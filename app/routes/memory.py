from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse
import os
import json
from app.routes.auth import get_current_user_id
from app.config import MEMORY_PATH

router = APIRouter()

@router.get("/memory/{file_id}")
async def get_memory(file_id: str, user_id: str = Depends(get_current_user_id)):
    try:
        memory_file = os.path.join(MEMORY_PATH, user_id, f"{file_id}.json")
        print(f"Looking for memory file at: {memory_file}")
        if not os.path.exists(memory_file):
            return JSONResponse(
                status_code=404,
                content={
                    "status_code": 404,
                    "message": "No memory found for this file",
                    "data": None
                }
            )
        with open(memory_file, "r") as f:
            memory_data = json.load(f)
        context = memory_data.get("context", [])
        last_qa = context[-1] if isinstance(context, list) and context else None
        return {
            "status_code": 200,
            "message": "Memory retrieved successfully",
            "data": {
                "context": context,
                "questions_count": memory_data.get("metadata", {}).get("question_count", 0)
            }
        }
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={
                "status_code": 500,
                "message": str(e),
                "data": None
            }
        ) 