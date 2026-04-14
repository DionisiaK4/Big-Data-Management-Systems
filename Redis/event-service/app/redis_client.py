import redis
 
redis_client = redis.Redis(
    host="localhost",
    port=6379,
    # Use decode_responses to get string results instead of bytes
    decode_responses=True,
)
 
def redis_ok() -> bool:
    return bool(redis_client.ping())