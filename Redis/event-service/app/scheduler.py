import asyncio
 
from app.event_service import sync_live_events
 
async def scheduler_loop():
    while True:
        try:
            result = sync_live_events()
            if result["loaded"] or result["unloaded"]:
                print(
                    f"[scheduler] loaded={result['loaded']} "
                    f"unloaded={result['unloaded']}"
                )
        except Exception as exc:
            print(f"[scheduler] error: {exc}")
 
        await asyncio.sleep(60)