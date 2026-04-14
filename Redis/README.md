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
  - [11.1 Scenario A – Startup and Health Check](#111-scenario-a--startup-and-health-check)
  - [11.2 Scenario B – Load and Unload an Event](#112-scenario-b--load-and-unload-an-event)
  - [11.3 Scenario C – Check-in / Checkout Flow](#113-scenario-c--check-in--checkout-flow)
  - [11.4 Scenario D – Admin Check-in / Checkout Flow](#114-scenario-d--admin-check-in--checkout-flow)
  - [11.5 Scenario E – Find Nearby Events](#115-scenario-e--find-nearby-events)
  - [11.6 Scenario F – Chat Flow](#116-scenario-f--chat-flow)
- [12. Assumptions and Design Decisions](#12-assumptions-and-design-decisions)
- [13. Future Improvements](#13-future-improvements)

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
