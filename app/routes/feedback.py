from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse
from app.models.query import FeedbackRequest
from app.routes.auth import get_current_user_id
from app.config import FEEDBACK_PATH
import os
import json
from datetime import datetime

router = APIRouter()

@router.post("/feedback")
async def save_feedback(feedback: FeedbackRequest, user_id: str = Depends(get_current_user_id)):
    try:
        feedback_data = {
            "timestamp": datetime.now().isoformat(),
            "query_id": feedback.query_id,
            "rating": feedback.rating,
            "feedback_text": feedback.feedback_text,
            "helpful": feedback.helpful
        }
        
        feedback_file = os.path.join(FEEDBACK_PATH, f"{feedback.query_id}.json")
        with open(feedback_file, "w") as f:
            json.dump(feedback_data, f, indent=2)
            
        return {
            "status_code": 200,
            "message": "Feedback saved successfully",
            "data": feedback_data
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

@router.get("/feedback/{file_id}")
async def get_feedback(file_id: str, user_id: str = Depends(get_current_user_id)):
    feedbacks = []
    for fname in os.listdir(FEEDBACK_PATH):
        if fname.startswith(file_id):
            with open(os.path.join(FEEDBACK_PATH, fname), "r") as f:
                feedbacks.append(json.load(f))
    return {
        "status_code": 200,
        "message": "Feedback retrieved successfully",
        "data": feedbacks
    } 