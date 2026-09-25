from pydantic import BaseModel
from typing import Optional

class QueryRequest(BaseModel):
    question: str
    file_id: str

class FeedbackRequest(BaseModel):
    query_id: str
    rating: int
    feedback_text: Optional[str] = None
    helpful: bool

class MemoryRequest(BaseModel):
    user_id: str
    file_id: str
    context: str
    metadata: Optional[dict] = None 