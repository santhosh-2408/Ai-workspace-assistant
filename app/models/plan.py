from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
import uuid # Added for subtask IDs

class PlanStatus: # Renaming for clarity, as it's used by both Plan and Subtask
    TODO = "todo"
    IN_PROGRESS = "in_progress"
    DONE = "done"

class PlanPriority:
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"

class Subtask(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    text: str
    status: str = PlanStatus.TODO
    due_date: Optional[str] = None
    # order: int = 0 # Optional: for reordering subtasks later

class Plan(BaseModel):
    id: str
    user_id: str
    title: str
    description: Optional[str] = None
    status: str = PlanStatus.TODO
    due_date: Optional[str] = None  # ISO format
    priority: str = PlanPriority.MEDIUM
    created_at: str
    updated_at: str
    order: int = 0
    subtasks: List[Subtask] = [] # Changed from List[str] 