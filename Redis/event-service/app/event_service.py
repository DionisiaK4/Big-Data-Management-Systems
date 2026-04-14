import time
from typing import Any
 
from app.db import get_connection
from app.redis_client import redis_client
 
ACTIVE_EVENTS_KEY = "active:events"
GEO_EVENTS_KEY = "geo:events"
 
 
def parse_email_csv(raw: str | None) -> list[str]:
    if not raw:
        return []
    return [part.strip().lower() for part in raw.split(",") if part.strip()]
 
def get_event_from_db(event_id: int) -> dict[str, Any] | None:
    conn = get_connection()
    try:
        cur = conn.cursor()
        cur.execute("SELECT * FROM events WHERE id = ?", (event_id,))
        row = cur.fetchone()
        if row is None:
            return None
        return {key: row[key] for key in row.keys()}
    finally:
        conn.close()
 
# used in the main for the "start-event" and "stop-event" endpoints
def set_event_enabled(event_id: int, enabled: bool) -> bool:
    conn = get_connection()
    try:
        cur = conn.cursor()
        cur.execute(
            "UPDATE events SET enabled = ? WHERE id = ?",
            (1 if enabled else 0, event_id),
        )
        conn.commit()
        return cur.rowcount > 0
    finally:
        conn.close()
 
 
def is_event_live(event: dict[str, Any], now_ts: int | None = None) -> bool:
    now_ts = now_ts or int(time.time())
    return event["start_ts"] <= now_ts <= event["end_ts"]
 
 
def get_live_event_ids_from_db(now_ts: int | None = None) -> list[int]:
    now_ts = now_ts or int(time.time())
    conn = get_connection()
    try:
        cur = conn.cursor()
        cur.execute(
            """
            SELECT id
            FROM events
            WHERE enabled = 1
              AND start_ts <= ?
              AND end_ts >= ?
            """,
            (now_ts, now_ts),
        )
        return [row["id"] for row in cur.fetchall()]
    finally:
        conn.close()
 
 
def get_active_event_ids_from_redis() -> list[int]:
    ids = redis_client.smembers(ACTIVE_EVENTS_KEY)
    return sorted(int(x) for x in ids)
 
# MAIN LOGIC FOR SYNC
# Load
def load_event_to_redis(event_id: int) -> bool:
    event = get_event_from_db(event_id)
    if not event:
        return False
 
    if int(event["enabled"]) != 1:
        return False
 
    if not is_event_live(event):
        return False
 
    audience = parse_email_csv(event["audience"])
    special = parse_email_csv(event["special_participants"])
 
    meta_key = f"event:{event_id}:meta"
    audience_key = f"event:{event_id}:audience"
    special_key = f"event:{event_id}:special"
 
    pipe = redis_client.pipeline()
 
    pipe.delete(meta_key, audience_key, special_key)
 
    pipe.sadd(ACTIVE_EVENTS_KEY, str(event_id))
 
    pipe.hset(
        meta_key,
        mapping={
            "id": str(event["id"]),
            "title": event["title"],
            "subtitle": event["subtitle"] or "",
            "lat": str(event["lat"]),
            "lon": str(event["lon"]),
            "radius_m": str(event["radius_m"]),
            "start_ts": str(event["start_ts"]),
            "end_ts": str(event["end_ts"]),
            "chat_enabled": str(event["chat_enabled"]),
            "is_public": "1" if not audience else "0",
        },
    )
 
    if audience:
        pipe.sadd(audience_key, *audience)
 
    if special:
        pipe.sadd(special_key, *special)
 
    pipe.geoadd(GEO_EVENTS_KEY, [event["lon"], event["lat"], str(event_id)])
 
    pipe.execute()
    return True
 
# Unload
def unload_event_from_redis(event_id: int) -> bool:
    event_id_str = str(event_id)
 
    if not redis_client.sismember(ACTIVE_EVENTS_KEY, event_id_str):
        return False
 
    meta_key = f"event:{event_id}:meta"
    audience_key = f"event:{event_id}:audience"
    special_key = f"event:{event_id}:special"
    participants_key = f"event:{event_id}:participants"
    chat_key = f"event:{event_id}:chat"
 
    pipe = redis_client.pipeline()
    pipe.srem(ACTIVE_EVENTS_KEY, event_id_str)
    pipe.zrem(GEO_EVENTS_KEY, event_id_str)
    pipe.delete(meta_key, audience_key, special_key, participants_key, chat_key)
    pipe.execute()
 
    return True
 
 
# Function for Scheduler
def sync_live_events() -> dict[str, list[int]]:
    db_live_ids = set(get_live_event_ids_from_db())
    redis_active_ids = set(get_active_event_ids_from_redis())
 
    loaded = []
    unloaded = []
 
    for event_id in sorted(db_live_ids - redis_active_ids):
        if load_event_to_redis(event_id):
            loaded.append(event_id)
 
    for event_id in sorted(redis_active_ids - db_live_ids):
        if unload_event_from_redis(event_id):
            unloaded.append(event_id)
 
    return {"loaded": loaded, "unloaded": unloaded}



# Checkin/Checkout & Participant logic
def get_event_meta_from_redis(event_id: int) -> dict[str, str]:
    return redis_client.hgetall(f"event:{event_id}:meta")
 
 
def is_event_active(event_id: int) -> bool:
    return bool(redis_client.sismember(ACTIVE_EVENTS_KEY, str(event_id)))
 
 
def normalize_email(email: str) -> str:
    return email.strip().lower()


def can_access_event(email: str, event_id: int) -> bool:
    email = normalize_email(email)
    meta = get_event_meta_from_redis(event_id)
 
    if not meta:
        return False
 
    if meta.get("is_public") == "1":
        return True
 
    audience_key = f"event:{event_id}:audience"
    special_key = f"event:{event_id}:special"
 
    return bool(
        redis_client.sismember(audience_key, email)
        or redis_client.sismember(special_key, email)
    )

 
def add_log_entry(event_id: int, email: str, action: str, details: str = "") -> None:
    conn = get_connection()
    try:
        cur = conn.cursor()
        cur.execute(
            """
            INSERT INTO logs (event_id, email, action, ts, details)
            VALUES (?, ?, ?, ?, ?)
            """,
            (event_id, email, action, int(time.time()), details),
        )
        conn.commit()
    finally:
        conn.close()


def checkin_user(email: str, event_id: int, by_admin: bool = False) -> bool:
    email = normalize_email(email)
    if not email:
        return False
 
    if not is_event_active(event_id):
        return False
 
    if not by_admin and not can_access_event(email, event_id):
        return False
 
    participants_key = f"event:{event_id}:participants"
    now_ts = int(time.time())
 
    added = redis_client.zadd(participants_key, {email: now_ts}, nx=True)
    if added == 1:
        action = "checkin-byadmin" if by_admin else "checkin"
        add_log_entry(event_id, email, action)
        return True
 
    return False


def checkout_user(email: str, event_id: int, by_admin: bool = False) -> bool:
    email = normalize_email(email)
    if not email:
        return False
 
    if not is_event_active(event_id):
        return False
 
    participants_key = f"event:{event_id}:participants"
    removed = redis_client.zrem(participants_key, email)
 
    if removed == 1:
        action = "checkout-byadmin" if by_admin else "checkout"
        add_log_entry(event_id, email, action)
        return True
 
    return False


def get_participants_for_event(event_id: int) -> list[dict[str, int | str]]:
    if not is_event_active(event_id):
        return []
 
    participants_key = f"event:{event_id}:participants"
    rows = redis_client.zrange(participants_key, 0, -1, withscores=True)
 
    return [
        {"email": email, "timestamp_of_join": int(score)}
        for email, score in rows
    ]
 
 
def get_num_participants_for_event(event_id: int) -> int:
    if not is_event_active(event_id):
        return 0
 
    participants_key = f"event:{event_id}:participants"
    return int(redis_client.zcard(participants_key))


def checkin_user_by_admin(email: str, event_id: int) -> bool:
    return checkin_user(email=email, event_id=event_id, by_admin=True)
 
 
def checkout_user_by_admin(email: str, event_id: int) -> bool:
    return checkout_user(email=email, event_id=event_id, by_admin=True)
 
 
# "Find nearby events for a user" Logic
def distance_meters(
    lat1: float,
    lon1: float,
    lat2: float,
    lon2: float,
) -> float:
    from math import radians, sin, cos, sqrt, atan2
 
    earth_radius_m = 6371000
 
    dlat = radians(lat2 - lat1)
    dlon = radians(lon2 - lon1)
 
    a = (
        sin(dlat / 2) ** 2
        + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlon / 2) ** 2
    )
    c = 2 * atan2(sqrt(a), sqrt(1 - a))
    return earth_radius_m * c
 
 
def find_events_for_user(email: str, x: float, y: float) -> list[int]:
    email = normalize_email(email)
    if not email:
        return []

    # In my schema:
    # x = latitude
    # y = longitude
    user_lat = x
    user_lon = y
 
    # I fetch candidate active events from the geo index.
    # I set a large radius to find all active nearby candidates
    # and then filter them by the actual radius of each event.
    try:
        candidate_ids = redis_client.geosearch(
            GEO_EVENTS_KEY,
            longitude=user_lon,
            latitude=user_lat,
            radius=50,
            unit="km",
        )
    except Exception:
        candidate_ids = []
 
    result = []
 
    for raw_event_id in candidate_ids:
        event_id = int(raw_event_id)
 
        if not is_event_active(event_id):
            continue
 
        if not can_access_event(email, event_id):
            continue
 
        meta = get_event_meta_from_redis(event_id)
        if not meta:
            continue
 
        event_lat = float(meta["lat"])
        event_lon = float(meta["lon"])
        event_radius_m = float(meta["radius_m"])
 
        dist = distance_meters(
            user_lat,
            user_lon,
            event_lat,
            event_lon,
        )
 
        if dist <= event_radius_m:
            result.append(event_id)
 
    return sorted(result)


# Post/Chat Logic 
def user_is_checked_in(event_id: int, email: str) -> bool:
    email = normalize_email(email)
    if not email:
        return False
 
    participants_key = f"event:{event_id}:participants"
    return redis_client.zscore(participants_key, email) is not None
 
 
def user_is_special_participant(event_id: int, email: str) -> bool:
    email = normalize_email(email)
    if not email:
        return False
 
    special_key = f"event:{event_id}:special"
    return bool(redis_client.sismember(special_key, email))
 
 
def can_post_to_chat(event_id: int, email: str) -> bool:
    if not is_event_active(event_id):
        return False
 
    meta = get_event_meta_from_redis(event_id)
    if not meta:
        return False
 
    if meta.get("chat_enabled") != "1":
        return False
 
    return user_is_checked_in(event_id, email) or user_is_special_participant(event_id, email)
 
 
def post_to_chat(email: str, event_id: int, text: str) -> bool:
    email = normalize_email(email)
    text = text.strip()
 
    if not email or not text:
        return False
 
    if not can_post_to_chat(event_id, email):
        return False
 
    ts = int(time.time())
 
    event_chat_key = f"event:{event_id}:chat"
    user_posts_key = f"user:{email}:posts"
 
    pipe = redis_client.pipeline()
 
    pipe.xadd(
        event_chat_key,
        {
            "timestamp": str(ts),
            "email": email,
            "text": text,
        }
    )
 
    pipe.xadd(
        user_posts_key,
        {
            "timestamp": str(ts),
            "event_id": str(event_id),
            "text": text,
        }
    )
 
    pipe.execute()
 
    add_log_entry(event_id, email, "post-to-chat", text)
 
    return True
 
 
def get_posts_for_event(event_id: int) -> list[dict[str, Any]]:
    if not is_event_active(event_id):
        return []
 
    event_chat_key = f"event:{event_id}:chat"
    rows = redis_client.xrange(event_chat_key, min="-", max="+")
 
    posts = []
    for _, fields in rows:
        posts.append(
            {
                "timestamp": int(fields["timestamp"]),
                "email": fields["email"],
                "text": fields["text"],
            }
        )
 
    return posts
 
 
def get_posts_for_user(email: str) -> list[dict[str, Any]]:
    email = normalize_email(email)
    if not email:
        return []
 
    user_posts_key = f"user:{email}:posts"
    rows = redis_client.xrange(user_posts_key, min="-", max="+")
 
    posts = []
    for _, fields in rows:
        posts.append(
            {
                "timestamp": int(fields["timestamp"]),
                "text": fields["text"],
            }
        )
 
    return posts