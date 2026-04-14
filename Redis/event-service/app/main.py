import asyncio
from contextlib import asynccontextmanager, suppress

from fastapi import FastAPI
from app.redis_client import redis_ok
from app.db import get_connection

from app.event_service import (
    checkin_user,
    checkin_user_by_admin,
    checkout_user,
    checkout_user_by_admin,
    find_events_for_user,
    get_active_event_ids_from_redis,
    get_event_from_db,
    get_num_participants_for_event,
    get_participants_for_event,
    get_posts_for_event,
    get_posts_for_user,
    post_to_chat,
    load_event_to_redis,
    set_event_enabled,
    sync_live_events,
    unload_event_from_redis,
)

from pydantic import BaseModel

from app.scheduler import scheduler_loop
 
@asynccontextmanager
async def lifespan(app: FastAPI):
    task = asyncio.create_task(scheduler_loop())
    yield
    task.cancel()
    with suppress(asyncio.CancelledError):
        await task
 
app = FastAPI(title="Event Service", lifespan=lifespan)
 
@app.get("/")
def root():
    return {"message": "API is running"}
 
@app.get("/health")
def health():
    return {"status": "ok"} 
 
@app.get("/redis-ping")
def redis_ping():
    return {"redis": "ok" if redis_ok() else "nok"}
 
@app.get("/db-check")
def db_check():
    conn = get_connection()
    try:
        cur = conn.cursor()
        cur.execute("SELECT name FROM sqlite_master WHERE type='table'")
        tables = [row[0] for row in cur.fetchall()]
        return {"db": "ok", "tables": tables}
    finally:
        conn.close()
  
 
@app.get("/event-from-db/{event_id}")
def event_from_db(event_id: int):
    return {"event": get_event_from_db(event_id)}
 
 
@app.post("/start-event/{event_id}")
def start_event(event_id: int):
    exists = set_event_enabled(event_id, True)
    if not exists:
        return {"status": "nok"}
 
    loaded_now = load_event_to_redis(event_id)
    return {"status": "ok", "loaded_now": loaded_now}
 
 
@app.post("/stop-event/{event_id}")
def stop_event(event_id: int):
    exists = set_event_enabled(event_id, False)
    if not exists:
        return {"status": "nok"}
 
    unloaded_now = unload_event_from_redis(event_id)
    return {"status": "ok", "unloaded_now": unloaded_now}
 
 
@app.get("/get-events")
def get_events():
    return {"event_ids": get_active_event_ids_from_redis()}
 
 
@app.post("/sync-now")
def sync_now():
    return sync_live_events()



# Checkin/Checkout & Participant endpoints
class EventEmailRequest(BaseModel):
    email: str

@app.post("/checkin/{event_id}")
def checkin(event_id: int, payload: EventEmailRequest):
    ok = checkin_user(payload.email, event_id)
    return {"status": "ok" if ok else "nok"}
 
 
@app.post("/checkout/{event_id}")
def checkout(event_id: int, payload: EventEmailRequest):
    ok = checkout_user(payload.email, event_id)
    return {"status": "ok" if ok else "nok"}
 
 
@app.get("/get-participants/{event_id}")
def get_participants(event_id: int):
    return {"participants": get_participants_for_event(event_id)}
 
 
@app.get("/num-participants/{event_id}")
def num_participants(event_id: int):
    return {"count": get_num_participants_for_event(event_id)}


# Admin checkin/checkout endpoints
@app.post("/checkin-byadmin/{event_id}")
def checkin_byadmin(event_id: int, payload: EventEmailRequest):
    ok = checkin_user_by_admin(payload.email, event_id)
    return {"status": "ok" if ok else "nok"}
 
 
@app.post("/checkout-byadmin/{event_id}")
def checkout_byadmin(event_id: int, payload: EventEmailRequest):
    ok = checkout_user_by_admin(payload.email, event_id)
    return {"status": "ok" if ok else "nok"}


# "Find nearby events" endpoint
class FindEventsRequest(BaseModel):
    email: str
    x: float
    y: float

@app.post("/find-events")
def find_events(payload: FindEventsRequest):
    event_ids = find_events_for_user(
        email=payload.email,
        x=payload.x,
        y=payload.y,
    )
    return {"event_ids": event_ids}



# Post/Chat endpoints
class ChatPostRequest(BaseModel):
    email: str
    text: str

@app.post("/post-to-chat/{event_id}")
def post_chat(event_id: int, payload: ChatPostRequest):
    ok = post_to_chat(payload.email, event_id, payload.text)
    return {"status": "ok" if ok else "nok"}
 
 
@app.get("/get-posts/{event_id}")
def get_posts(event_id: int):
    return {
        "event_id": event_id,
        "posts": get_posts_for_event(event_id),
    }
 

@app.get("/get-user-posts/{email}")
def get_user_posts(email: str):
    return {
        "email": email,
        "posts": get_posts_for_user(email),
    }