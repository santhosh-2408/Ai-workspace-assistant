import os
import json
from typing import List, Optional
from app.models.plan import Plan, Subtask, PlanStatus, PlanPriority
from datetime import datetime
import uuid

PLANS_PATH = os.path.join("data", "plans")

def _get_user_plan_file(user_id: str) -> str:
    os.makedirs(PLANS_PATH, exist_ok=True)
    return os.path.join(PLANS_PATH, f"{user_id}.json")

def get_plans(user_id: str) -> List[Plan]:
    plan_file = _get_user_plan_file(user_id)
    if not os.path.exists(plan_file):
        return []
    with open(plan_file, "r") as f:
        data = json.load(f)
    
    migrated_plans = []
    needs_resave = False
    for item_data in data:
        # Check if subtasks need migration
        if "subtasks" in item_data and item_data["subtasks"] and isinstance(item_data["subtasks"][0], str):
            needs_resave = True
            migrated_subtasks_list = []
            for subtask_text in item_data["subtasks"]:
                # Basic cleaning, similar to how it's done in routes/plan.py create_plan
                cleaned_text = subtask_text.lstrip('0123456789.').strip()
                if cleaned_text:
                    migrated_subtasks_list.append(
                        Subtask(text=cleaned_text, status=PlanStatus.TODO, id=str(uuid.uuid4())).dict()
                    )
            item_data["subtasks"] = migrated_subtasks_list
        
        # Ensure essential fields exist if loading very old data or for robustness
        item_data.setdefault('order', 0)
        item_data.setdefault('description', None)
        item_data.setdefault('due_date', None)
        item_data.setdefault('priority', PlanPriority.MEDIUM)
        item_data.setdefault('status', PlanStatus.TODO)

        migrated_plans.append(Plan(**item_data))
    
    if needs_resave:
        # If migration occurred, save the updated structure back to the file
        # This uses the save_plans function which expects List[Plan] objects
        # So we pass the fully parsed and validated migrated_plans
        save_plans(user_id, migrated_plans) 
        
    return migrated_plans

def save_plans(user_id: str, plans: List[Plan]):
    plan_file = _get_user_plan_file(user_id)
    with open(plan_file, "w") as f:
        json.dump([plan.dict() for plan in plans], f, indent=2)

def add_plan(user_id: str, plan: Plan):
    plans = get_plans(user_id) # This will now handle migration if needed
    plans.append(plan)
    save_plans(user_id, plans)

def update_plan(user_id: str, plan_id: str, plan_data: dict) -> Optional[Plan]:
    plans = get_plans(user_id)
    for i, plan in enumerate(plans):
        if plan.id == plan_id:
            # If subtasks are being updated, they should already be in the new Subtask model format from the request
            if 'subtasks' in plan_data and plan_data['subtasks'] is not None:
                # Pydantic model in request will ensure subtasks are list of Subtask objects or valid dicts
                # We need to ensure they become Subtask instances if they are dicts
                plan.subtasks = [Subtask(**st) if isinstance(st, dict) else st for st in plan_data['subtasks']]
                del plan_data['subtasks'] # Remove from plan_data to avoid setattr issues for the list itself
            
            for k, v in plan_data.items():
                setattr(plan, k, v)
            plan.updated_at = datetime.now().isoformat()
            save_plans(user_id, plans)
            return plan
    return None

def delete_plan(user_id: str, plan_id: str) -> bool:
    plans = get_plans(user_id)
    new_plans = [plan for plan in plans if plan.id != plan_id]
    if len(new_plans) == len(plans):
        return False
    save_plans(user_id, new_plans)
    return True

def reorder_plans(user_id: str, new_order: list):
    plans = get_plans(user_id)
    id_to_plan = {plan.id: plan for plan in plans}
    reordered = []
    for idx, plan_id in enumerate(new_order):
        plan = id_to_plan.get(plan_id)
        if plan:
            plan.order = idx
            reordered.append(plan)
    # Add any plans not in new_order at the end
    for plan in plans:
        if plan.id not in new_order:
            plan.order = len(reordered)
            reordered.append(plan)
    save_plans(user_id, reordered)
    return reordered 