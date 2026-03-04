import asyncio
import os
from google import genai
from dotenv import load_dotenv

load_dotenv()

async def test_genai():
    client = genai.Client()
    print("Testing client.aio.models.generate_content_stream...")
    
    # We won't actually call it because we don't want to waste tokens/fail on key
    # but we can check the function type
    func = client.aio.models.generate_content_stream
    print(f"Function type: {type(func)}")
    import inspect
    print(f"Is coroutine function: {inspect.iscoroutinefunction(func)}")
    print(f"Is async generator function: {inspect.isasyncgenfunction(func)}")

if __name__ == "__main__":
    asyncio.run(test_genai())
