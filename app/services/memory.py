import os
import json
from app.config import MEMORY_PATH

def get_file_memory(user_id: str, file_id: str) -> dict:
    memory_file = os.path.join(MEMORY_PATH, user_id, f"{file_id}.json")
    if os.path.exists(memory_file):
        with open(memory_file, "r") as f:
            return json.load(f)
    return {"file_id": file_id, "context": "", "metadata": {}}

def save_memory(user_id: str, file_id: str, memory_data: dict):
    memory_file = os.path.join(MEMORY_PATH, user_id, f"{file_id}.json")
    os.makedirs(os.path.dirname(memory_file), exist_ok=True)
    with open(memory_file, "w") as f:
        json.dump(memory_data, f, indent=2) 