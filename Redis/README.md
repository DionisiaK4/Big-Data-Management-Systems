# Event Service with Redis

## Table of Contents

- [1. Project Overview](#1-project-overview)
- [2. What This Project Implements](#2-what-this-project-implements)
- [3. Tech Stack](#3-tech-stack)
- [4. Project Structure](#4-project-structure)
- [5. Data Model](#5-data-model)
  - [5.1 Main Database (SQLite)](#51-main-database-sqlite)
  - [5.2 Redis Keys](#52-redis-keys)
- [6. How the System Works](#6-how-the-system-works)
  - [6.1 Persistent Storage vs Redis](#61-persistent-storage-vs-redis)
  - [6.2 Scheduler Logic](#62-scheduler-logic)
  - [6.3 Event Access Logic](#63-event-access-logic)
  - [6.4 Chat Logic](#64-chat-logic)
- [7. Setup Instructions](#7-setup-instructions)
- [8. How to Run the Project](#8-how-to-run-the-project)
- [9. API Endpoints](#9-api-endpoints)
  - [9.1 System / Utility Endpoints](#91-system--utility-endpoints)
  - [9.2 Event Lifecycle Endpoints](#92-event-lifecycle-endpoints)
  - [9.3 Participant Endpoints](#93-participant-endpoints)
  - [9.4 Admin Participant Endpoints](#94-admin-participant-endpoints)
  - [9.5 Event Discovery Endpoint](#95-event-discovery-endpoint)
  - [9.6 Chat Endpoints](#96-chat-endpoints)
- [10. Testing Through /docs](#10-testing-through-docs)
- [11. Complete Testing Scenarios](#11-complete-testing-scenarios)
  - [11.1 Scenario A: Startup and Health Check](#111-scenario-a--startup-and-health-check)
  - [11.2 Scenario B: Load and Unload an Event](#112-scenario-b--load-and-unload-an-event)
  - [11.3 Scenario C: Check-in / Checkout Flow](#113-scenario-c--check-in--checkout-flow)
  - [11.4 Scenario D: Admin Check-in / Checkout Flow](#114-scenario-d--admin-check-in--checkout-flow)
  - [11.5 Scenario E: Find Nearby Events](#115-scenario-e--find-nearby-events)
  - [11.6 Scenario F: Chat Flow](#116-scenario-f--chat-flow)
- [12. Future Improvements](#13-future-improvements)

---

## 1. Project Overview

This project implements a backend service for managing physical events using **Redis** as the live in-memory data store and **SQLite** as the persistent database.

Each event:

- has a title and subtitle,
- takes place at a location (`lat`, `lon`),
- has a radius of coverage,
- has a lifetime (`start_ts`, `end_ts`),
- may include special participants,
- may have an audience list,
- may support a chat room while it is active.

The system also includes:

- event loading/unloading to Redis,
- participant check-in / checkout,
- admin check-in / checkout,
- nearby event discovery,
- event chat,
- a scheduler that synchronizes active events every minute.

---

## 2. What This Project Implements

This backend implements the following required functionality:

- `start-event(event-id) -> ok/nok`
- `stop-event(event-id) -> ok/nok`
- `checkin(email, event-id) -> ok/nok`
- `checkout(email, event-id) -> ok/nok`
- `find-events(email, x, y) -> list of event-ids`
- `get-participants(event-id) -> list of participants`
- `num-participants(event-id) -> number`
- `checkin-byadmin(email, event-id) -> ok/nok`
- `checkout-byadmin(email, event-id) -> ok/nok`
- `get-events() -> list of active event ids`
- `post-to-chat(email, event-id, text) -> ok/nok`
- `get-posts(event-id) -> list of posts`
- `get-user-posts(email) -> list of user posts`

---

## 3. Tech Stack

This project uses:

- **Python**
- **FastAPI** for the REST API
- **Redis** for active/live event storage
- **SQLite** for persistent event and log storage
- **Uvicorn** as the ASGI server
- **Docker** to run Redis locally

---

## 4. Project Structure

```text
event-service/
  app/
    main.py
    db.py
    redis_client.py
    event_service.py
    scheduler.py
  scripts/
    init_db.py
  data/
    app.db
  requirements.txt
  README.md
```

### `app/main.py`
Contains the FastAPI application and all exposed API endpoints.
 
### `app/db.py`
Creates and returns SQLite connections to the local database file in `data/app.db`.
 
### `app/redis_client.py`
Creates the Redis client connection and provides a basic Redis health check.
 
### `app/event_service.py`
Contains the core business logic of the application:
- loading and unloading events to/from Redis
- checking user access
- handling check-in / checkout
- searching nearby events
- posting and reading chat messages
- writing logs to SQLite
 
### `app/scheduler.py`
Contains the background scheduler loop that runs every minute and synchronizes currently live events between SQLite and Redis.
 
### `scripts/init_db.py`
Initializes the SQLite database, creates the required tables, and inserts sample events for testing.
 
### `data/app.db`
The SQLite database file created after initialization.
 
### `requirements.txt`
Contains the Python dependencies needed to run the project.
 
### `README.md`
Project documentation, setup instructions, endpoint description, and testing scenarios.
 
---
 
## 5. Data Model
 
### 5.1 Main Database (SQLite)
 
SQLite is used as the persistent database.
 
It currently contains two main tables:
 
#### `events`
Stores the permanent definition of events.
 
Fields:
- `id`
- `title`
- `subtitle`
- `lat`
- `lon`
- `radius_m`
- `start_ts`
- `end_ts`
- `special_participants`
- `audience`
- `chat_enabled`
- `enabled`
 
#### `logs`
Stores log entries for important actions.
 
Fields:
- `id`
- `event_id`
- `email`
- `action`
- `ts`
- `details`
 
### 5.2 Redis Keys
 
Redis stores only the active/live data.
 
#### Active events
- `active:events` → `SET` of active event ids
 
#### Event metadata
- `event:{id}:meta` → `HASH`
  - `title`
  - `subtitle`
  - `lat`
  - `lon`
  - `radius`
  - `timestamps`
  - `visibility info`
 
#### Event audience
- `event:{id}:audience` → `SET` of allowed emails
 
#### Special participants
- `event:{id}:special` → `SET` of special participant emails
 
#### Event participants
- `event:{id}:participants` → `SORTED SET`
  - member = email
  - score = timestamp of join
 
#### Geospatial event index
- `geo:events` → Redis geo index for active event locations
 
#### Event chat
- `event:{id}:chat` → `STREAM`
 
#### User posts
- `user:{email}:posts` → `STREAM`
 
---
 
## 6. How the System Works
 
### 6.1 Persistent Storage vs Redis
 
The project separates data into two layers:
 
#### SQLite
Stores the permanent event definitions and logs.
 
#### Redis
Stores only the events that are currently active and the live data needed for fast operations:
- active event set
- participants
- chat
- geospatial lookup
 
This allows the API to answer live queries quickly while still keeping persistent data in SQLite.
 
### 6.2 Scheduler Logic
 
A scheduler runs every 60 seconds.
 
Its job is to:
1. read all enabled and currently live events from SQLite
2. load them into Redis if they are not already active
3. remove expired or disabled events from Redis
 
This keeps Redis synchronized with the current event state.
 
### 6.3 Event Access Logic
 
An event can be:
 
#### Public
If the audience list is empty, any user can access the event.
 
#### Private
If the audience list is not empty, only:
- listed audience emails, or
- special participants
 
may access the event.
 
Admin check-in bypasses this restriction.
 
### 6.4 Chat Logic
 
A user can post to an event chat only if:
- the event is active
- chat is enabled for the event
- the user is checked in or is a special participant
 
Posts are stored in:
- the event stream
- and also in a per-user stream for fast retrieval of user posts
 
---
 
## 7. Setup Instructions
 
### 1. Create and activate a virtual environment
 
```bash
python -m venv .venv
```

## 2. Install dependencies
 
```bash
pip install -r requirements.txt
```
 
## 3. Start Redis with Docker
 
```bash
docker run -d --name redis-local -p 6379:6379 redis:latest
```
 
## 4. Initialize the SQLite database
 
```bash
python scripts/init_db.py
```
---
## 8. How to Run the Project
 
Start the API server with:
 
```bash
uvicorn app.main:app --reload
```
 
Then open:
 
```text
http://127.0.0.1:8000/docs
```
 
This opens the FastAPI Swagger UI where you can test all endpoints interactively.

---
## 9. API Endpoints
 
### 9.1 System / Utility Endpoints
 
#### `GET /` : Basic root endpoint.
 
#### `GET /health` : Returns API health status.
 
#### `GET /redis-ping` : Checks whether Redis is reachable.
 
#### `GET /db-check` : Checks whether the SQLite database is reachable and lists available tables.
 
#### `GET /event-from-db/{event_id}` : Returns the raw event record from SQLite.
 
#### `POST /sync-now` : Triggers an immediate synchronization between SQLite and Redis.
 
### 9.2 Event Lifecycle Endpoints
 
#### `POST /start-event/{event_id}` : Enables the event in SQLite and tries to load it into Redis immediately.
 
Response:
 
```json
{"status": "ok", "loaded_now": true}
```
 
#### `POST /stop-event/{event_id}` : Disables the event in SQLite and unloads it from Redis.
 
Response:
 
```json
{"status": "ok", "unloaded_now": true}
```
 
#### `GET /get-events` : Returns the list of currently active event ids from Redis.
 
### 9.3 Participant Endpoints
 
#### `POST /checkin/{event_id}` : Checks a user into an active event.
 
Body:
 
```json
{
  "email": "user@example.com"
}
```
 
Returns:
- `ok` if the user is allowed and not already checked in
- `nok` otherwise
 
#### `POST /checkout/{event_id}` : Checks a user out of an active event.
 
Body:
 
```json
{
  "email": "user@example.com"
}
```
 
#### `GET /get-participants/{event_id}` : Returns the participants of the event in ascending order of join time.
 
Example response:
 
```json
{
  "event_id": 1,
  "participants": [
    {
      "email": "user@example.com",
      "timestamp_of_join": 1776181000
    }
  ]
}
```
 
#### `GET /num-participants/{event_id}` : Returns the number of checked-in participants for the event.
 
Example:
 
```json
{
  "event_id": 1,
  "count": 1
}
```
 
### 9.4 Admin Participant Endpoints
 
#### `POST /checkin-byadmin/{event_id}` : Checks in a user by admin action.
 
Body:
 
```json
{
  "email": "user@example.com"
}
```
 
This bypasses the audience/private access restriction.
 
#### `POST /checkout-byadmin/{event_id}` : Checks out a user by admin action.
 
Body:
 
```json
{
  "email": "user@example.com"
}
```
 
### 9.5 Event Discovery Endpoint
 
#### `POST /find-events`
 
Body:
 
```json
{
  "email": "user@example.com",
  "x": 37.9838,
  "y": 23.7275
}
```
 
Returns:
 
```json
{
  "event_ids": [1, 2]
}
```
 
This endpoint:
- looks up nearby active events
- checks whether the user has access
- filters results based on the event’s own radius
 
In this implementation:
- `x = latitude`
- `y = longitude`
 
### 9.6 Chat Endpoints
 
#### `POST /post-to-chat/{event_id}`
 
Body:
 
```json
{
  "email": "user@example.com",
  "text": "Hello everyone"
}
```
 
Returns:
- `ok` if the user is allowed to post
- `nok` otherwise
 
#### `GET /get-posts/{event_id}` : Returns all posts of a given event in ascending order of timestamp.
 
Example:
 
```json
{
  "event_id": 1,
  "posts": [
    {
      "timestamp": 1776181000,
      "email": "user@example.com",
      "text": "Hello everyone"
    }
  ]
}
```
 
#### `GET /get-user-posts/{email}` : Returns all posts written by a given user in ascending order of timestamp.
 
Example:
 
```json
{
  "email": "user@example.com",
  "posts": [
    {
      "timestamp": 1776181000,
      "text": "Hello everyone"
    }
  ]
}
```
 
---
 
## 10. Testing Through /docs
 
After starting the app, open:
 
```text
http://127.0.0.1:8000/docs
```
 
From there, you can:
- expand any endpoint
- click `Try it out`
- provide request parameters/body
- execute the request
- inspect the JSON response
 
---
 
## 11. Complete Testing Scenarios
 
### 11.1 Scenario A: Startup and Health Check
 
1. Start Redis (via Docker)
2. Initialize the database (as described in unit 7)
3. Start FastAPI (as described in unit 8)
4. Open `/docs`
 
Test:
- `GET /health`
- `GET /redis-ping`
- `GET /db-check`
 
Expected result:
- API responds successfully
- Redis responds successfully
- SQLite tables exist
 
### 11.2 Scenario B: Load and Unload an Event
 
1. Run `POST /sync-now`
2. Run `GET /get-events`
3. Confirm that currently live sample event ids appear (when starting the app immediately after initializing the database, the currently live event ID is 1)
4. Run `POST /stop-event/{event_id}`
5. Run `GET /get-events` again
6. Confirm that the event disappeared
7. Run `POST /start-event/{event_id}`
8. Run `GET /get-events` again
 
Expected result:
- the event is removed and re-added correctly
 
### 11.3 Scenario C: Check-in / Checkout Flow
 
1. Make sure an event is active (when starting the app immediately after initializing the database, the currently live event ID is 1)
2. Call `POST /checkin/{event_id}` with:
 
```json
{"email": "alice@example.com"}
```
 
3. Call `GET /get-participants/{event_id}`
4. Call `GET /num-participants/{event_id}`
5. Call `POST /checkout/{event_id}`
6. Call `GET /num-participants/{event_id}` again
 
Expected result:
- check-in succeeds
- participant appears in list
- count increases
- checkout succeeds
- count returns to zero
 
### 11.4 Scenario D: Admin Check-in / Checkout Flow
 
Use a user that would normally not have access to a private event.
 
1. Call `POST /checkin-byadmin/{event_id}`
2. Confirm with `GET /get-participants/{event_id}`
3. Call `POST /checkout-byadmin/{event_id}`
 
Expected result:
- admin check-in succeeds even for a restricted user
- admin checkout removes the user correctly
 
### 11.5 Scenario E: Find Nearby Events
 
1. Make sure there is an active event in Redis (when starting the app immediately after initializing the database, the currently live event ID is 1)
2. Call `POST /find-events` with coordinates near the sample event location
3. Use an allowed email for a private event, or any email for a public event (here event 1)
 
Example:
 
```json
{
  "email": "alice@example.com",
  "x": 37.9838,
  "y": 23.7275
}
```
 
Expected result:
- nearby active accessible event ids are returned
 
### 11.6 Scenario F: Chat Flow
 
1. Make sure the event is active (when starting the app immediately after initializing the database, the currently live event ID is 1)
2. Check in a user (here alice@example.com, as the event is public)
3. Call `POST /post-to-chat/{event_id}`
4. Call `GET /get-posts/{event_id}`
5. Call `GET /get-user-posts/{email}`
 
Example post body:
 
```json
{
  "email": "alice@example.com",
  "text": "Hello from Redis chat"
}
```
 
Expected result:
- post succeeds
- event chat returns the message
- user posts return the same message


---

## 12. Future Improvements
Possible improvements include:
- adding a front-end for easier demonstration,
- adding proper authentication and admin authorization,
- adding automatic Redis key expiration,
- using PostgreSQL instead of SQLite for larger-scale persistence.
