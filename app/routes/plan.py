from fastapi import APIRouter, Depends, HTTPException, Body, Request
from fastapi.responses import JSONResponse
from app.models.plan import Plan, Subtask, PlanStatus
from app.services.plan import get_plans, add_plan, update_plan, delete_plan, reorder_plans
from app.routes.auth import get_current_user_id
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
import uuid
from app.config import gemini_model

router = APIRouter()

class PlanCreateRequest(BaseModel):
    title: str
    description: Optional[str] = None
    due_date: Optional[str] = None
    priority: Optional[str] = None

class PlanUpdateRequest(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    due_date: Optional[str] = None
    priority: Optional[str] = None
    subtasks: Optional[List[Subtask]] = None

class ReorderRequest(BaseModel):
    order: List[str]

@router.get("/plans")
def list_plans(user_id: str = Depends(get_current_user_id)):
    plans = get_plans(user_id)
    return {"status_code": 200, "data": [plan.dict() for plan in plans], "message": "success"}

@router.post("/plans")
def create_plan(request: PlanCreateRequest, user_id: str = Depends(get_current_user_id)):
    prompt = f"""
    You are a goal planning assistant. Break down the following task into clear, actionable subtasks.
    Task: {request.title}\n{request.description or ''}
    Respond with a numbered list of subtasks only.
    """
    generated_subtask_objects = []
    try:
        response = gemini_model.generate_content(prompt)
        subtask_texts = [line.strip(" .*") for line in response.text.strip().split("\n") if line.strip()]
        for text in subtask_texts:
            cleaned_text = text.lstrip('0123456789.').strip()
            if cleaned_text:
                generated_subtask_objects.append(
                    Subtask(text=cleaned_text, status=PlanStatus.TODO)
                )
    except Exception as e:
        generated_subtask_objects = []
    
    plan = Plan(
        id=str(uuid.uuid4()),
        user_id=user_id,
        title=request.title,
        description=request.description,
        status=PlanStatus.TODO,
        due_date=request.due_date,
        priority=request.priority or "medium",
        created_at=datetime.now().isoformat(),
        updated_at=datetime.now().isoformat(),
        subtasks=generated_subtask_objects
    )
    add_plan(user_id, plan)
    return {"status_code": 200, "data": plan.dict(), "message": "Plan created"}

@router.put("/plans/{plan_id}")
def update_plan_endpoint(plan_id: str, request: PlanUpdateRequest, user_id: str = Depends(get_current_user_id)):
    plan = update_plan(user_id, plan_id, request.dict(exclude_unset=True))
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    return {"status_code": 200, "data": plan.dict(), "message": "Plan updated"}

@router.delete("/plans/{plan_id}")
def delete_plan_endpoint(plan_id: str, user_id: str = Depends(get_current_user_id)):
    success = delete_plan(user_id, plan_id)
    if not success:
        raise HTTPException(status_code=404, detail="Plan not found")
    return {"status_code": 200, "message": "Plan deleted"}

@router.put("/plans/reorder")
def reorder_plans_endpoint(request: ReorderRequest, user_id: str = Depends(get_current_user_id)):
    reordered = reorder_plans(user_id, request.order)
    return {"status_code": 200, "data": [plan.dict() for plan in reordered], "message": "Plans reordered"}

@router.post("/plans/{plan_id}/suggest")
def suggest_subtasks(plan_id: str, user_id: str = Depends(get_current_user_id)):
    plans = get_plans(user_id)
    plan = next((p for p in plans if p.id == plan_id), None)
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    prompt = f"""
    You are a goal planning assistant. Break down the following task into clear, actionable subtasks.
    Task: {plan.title}\n{plan.description or ''}
    Respond with a numbered list of subtasks only.
    """
    try:
        response = gemini_model.generate_content(prompt)
        subtask_texts = [line.strip(" .*") for line in response.text.strip().split("\n") if line.strip()]
        cleaned_subtask_texts = []
        for text in subtask_texts:
            cleaned_text = text.lstrip('0123456789.').strip()
            if cleaned_text:
                cleaned_subtask_texts.append(cleaned_text)
        return {"status_code": 200, "data": cleaned_subtask_texts, "message": "success"}
    except Exception as e:
        return JSONResponse(status_code=500, content={"status_code": 500, "data": None, "message": str(e)}) 