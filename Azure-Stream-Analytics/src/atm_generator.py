import time
import random
import json
from datetime import datetime, timezone
from azure.eventhub import EventHubProducerClient, EventData
import os
from dotenv import load_dotenv


# =========================
# --- STUDENT CONFIG ---
# =========================
load_dotenv()

HOST_NAME = os.getenv("HOST_NAME")
SHARED_ACCESS_KEY_NAME = os.getenv("SHARED_ACCESS_KEY_NAME")
SHARED_ACCESS_KEY = os.getenv("SHARED_ACCESS_KEY")
EVENT_HUB_NAME = os.getenv("EVENT_HUB_NAME")

required_vars = {
    "HOST_NAME": HOST_NAME,
    "SHARED_ACCESS_KEY_NAME": SHARED_ACCESS_KEY_NAME,
    "SHARED_ACCESS_KEY": SHARED_ACCESS_KEY,
    "EVENT_HUB_NAME": EVENT_HUB_NAME,
}

missing = [name for name, value in required_vars.items() if not value]

if missing:
    raise ValueError(f"Missing required environment variables: {', '.join(missing)}")
# =========================


# Create a standard connection string from the components for the SDK
CONNECTION_STR = (
    f"Endpoint=sb://{HOST_NAME}/;"
    f"SharedAccessKeyName={SHARED_ACCESS_KEY_NAME};"
    f"SharedAccessKey={SHARED_ACCESS_KEY}"
)

# --- Generator settings ---
INTERVAL_SECONDS = 0.5  # 500ms

AREAS = ["Athens-Center", "Athens-North", "Thessaloniki", "Patras", "Heraklion"]
ATM_IDS = [f"ATM-{i:03d}" for i in range(1, 16)]           # 15 ATMs
ACCOUNTS = [f"ACC-{i:05d}" for i in range(1, 501)]         # 500 accounts

def utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()

def weighted_txn_type() -> str:
    r = random.random()
    if r < 0.55:
        return "withdrawal"
    if r < 0.75:
        return "deposit"
    if r < 0.92:
        return "balance_inquiry"
    return "transfer"

def amount_for(txn_type: str) -> float:
    if txn_type == "balance_inquiry":
        return 0.0
    if txn_type == "withdrawal":
        return float(random.choice([20, 40, 50, 60, 80, 100, 120, 150, 200, 300]))
    if txn_type == "deposit":
        return float(random.choice([50, 100, 150, 200, 300, 500, 800, 1000]))
    # transfer
    return float(random.choice([25, 50, 75, 100, 150, 200, 300, 500]))

def generate_atm_event() -> str:
    txn_type = weighted_txn_type()
    data = {
        "eventTime": utc_now_iso(),                     # used as event time in ASA
        "area": random.choice(AREAS),
        "atmId": random.choice(ATM_IDS),
        "accountId": random.choice(ACCOUNTS),
        "transactionType": txn_type,
        "amount": amount_for(txn_type),
        "currency": "EUR"
    }
    return json.dumps(data)

def run_sender():
    print(f"Connecting to Event Hub: {EVENT_HUB_NAME} on {HOST_NAME}")
    producer = EventHubProducerClient.from_connection_string(
        conn_str=CONNECTION_STR,
        eventhub_name=EVENT_HUB_NAME
    )
    print("Connection established. Sending ATM events...")

    with producer:
        while True:
            payload = generate_atm_event()
            evt = json.loads(payload)

            # Partition key: accountId is useful for “per-account” analytics (bursts, patterns)
            partition_key = evt["accountId"]

            producer.send_batch([EventData(payload)], partition_key=partition_key)
            print(f"Sent: {payload} | Partition Key: {partition_key}")

            time.sleep(INTERVAL_SECONDS)

if __name__ == "__main__":
    try:
        run_sender()
    except Exception as e:
        print(f"\nAn error occurred: {e}")
        print("Check EVENT_HUB_NAME, HOST_NAME, SAS policy name/key, and that the policy has Send permissions.")
