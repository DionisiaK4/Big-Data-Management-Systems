import sqlite3
import time
from pathlib import Path
 
BASE_DIR = Path(__file__).resolve().parent.parent
DB_PATH = BASE_DIR / "data" / "app.db"
 
DB_PATH.parent.mkdir(parents=True, exist_ok=True)
 
conn = sqlite3.connect(DB_PATH)
cur = conn.cursor()
 
cur.execute("""
CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY,
    title TEXT NOT NULL,
    subtitle TEXT,
    lat REAL NOT NULL,
    lon REAL NOT NULL,
    radius_m INTEGER NOT NULL,
    start_ts INTEGER NOT NULL,
    end_ts INTEGER NOT NULL,
    special_participants TEXT DEFAULT '',
    audience TEXT DEFAULT '',
    chat_enabled INTEGER DEFAULT 1,
    enabled INTEGER NOT NULL DEFAULT 1
)
""")
 
cur.execute("""
CREATE TABLE IF NOT EXISTS logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_id INTEGER,
    email TEXT,
    action TEXT NOT NULL,
    ts INTEGER NOT NULL,
    details TEXT
)
""")
 
cur.execute("DELETE FROM events")
 
now = int(time.time())
 
sample_events = [
    (
        1,
        "Redis Intro",
        "Active right now",
        37.9838,
        23.7275,
        300,
        now - 1800,
        now + 3600,
        "teacher@example.com",
        "",
        1,
        1
    ),
    (
        2,
        "Private Seminar",
        "Starts later",
        37.9842,
        23.7280,
        150,
        now + 3600,
        now + 7200,
        "speaker@example.com",
        "student1@example.com,student2@example.com",
        1,
        1
    ),
    (
        3,
        "Old Event",
        "Already finished",
        37.9800,
        23.7200,
        200,
        now - 7200,
        now - 3600,
        "",
        "",
        0,
        1
    ),
]
 
cur.executemany("""
INSERT INTO events (
    id, title, subtitle, lat, lon, radius_m,
    start_ts, end_ts, special_participants, audience, chat_enabled, enabled
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
""", sample_events)
 
conn.commit()
conn.close()
 
print(f"Database initialized at: {DB_PATH}")