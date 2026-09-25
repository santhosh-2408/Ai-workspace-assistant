from fastapi import APIRouter, Depends, HTTPException, Body
from fastapi.security import OAuth2PasswordRequestForm, OAuth2PasswordBearer
from app.services.auth import (
    load_users, save_users, create_access_token,
    verify_password, get_password_hash, user_lock
)
from jose import JWTError, jwt
from app.config import SECRET_KEY, ALGORITHM
from pydantic import BaseModel
from typing import Optional

class UserUpdate(BaseModel):
    name: Optional[str] = None
    username: Optional[str] = None
    email: Optional[str] = None
    current_password: Optional[str] = None
    new_password: Optional[str] = None

router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/token")

def get_current_user_id(token: str = Depends(oauth2_scheme)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(
                status_code=401,
                detail="Invalid authentication credentials"
            )
        return user_id
    except JWTError as e:
        if "expired" in str(e):
            raise HTTPException(
                status_code=401,
                detail="Token has expired. Please login again."
            )
        raise HTTPException(
            status_code=401,
            detail="Invalid authentication credentials"
        )

@router.post("/register")
def register_user(
    name: str = Body(...),
    username: str = Body(...),
    email: str = Body(...),
    password: str = Body(...)
):
    with user_lock:
        users = load_users()
        if any(u["name"] == name for u in users):
            raise HTTPException(status_code=400, detail="Name already exists")
        if any(u["username"] == username for u in users):
            raise HTTPException(status_code=400, detail="Username already exists")
        if any(u["email"] == email for u in users):
            raise HTTPException(status_code=400, detail="Email already exists")
        
        hashed_password = get_password_hash(password)
        user_id = 1 if not users else max(u["user_id"] for u in users) + 1
        user = {
            "user_id": user_id,
            "name": name,
            "username": username,
            "email": email,
            "password": hashed_password
        }
        users.append(user)
        save_users(users)
    return {"message": "User registered successfully", "user_id": user_id}

@router.post("/token")
def login(form_data: OAuth2PasswordRequestForm = Depends()):
    users = load_users()
    user = next((u for u in users if u["username"] == form_data.username), None)
    
    if not user or not verify_password(form_data.password, user["password"]):
        raise HTTPException(status_code=400, detail="Incorrect username or password")
    
    access_token = create_access_token({"sub": str(user["user_id"])})
    return {"access_token": access_token, "token_type": "bearer", "user_id": user["user_id"]}

@router.get("/user/{user_id}")
def get_user(user_id: int):
    users = load_users()
    user = next((u for u in users if u["user_id"] == user_id), None)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user_copy = user.copy()
    user_copy.pop("password")
    return user_copy

@router.put("/profile")
def update_profile(user_update: UserUpdate, user_id: str = Depends(get_current_user_id)):
    with user_lock:
        users = load_users()
        user_index = next((i for i, u in enumerate(users) if str(u["user_id"]) == user_id), None)
        
        if user_index is None:
            raise HTTPException(status_code=404, detail="User not found")
        
        user = users[user_index]
        
        # Password validation if updating password
        if user_update.new_password:
            if not user_update.current_password:
                raise HTTPException(status_code=400, detail="Current password required to set new password")
                
            if not verify_password(user_update.current_password, user["password"]):
                raise HTTPException(status_code=400, detail="Current password is incorrect")
                
            user["password"] = get_password_hash(user_update.new_password)
        
        # Update other fields if provided
        if user_update.name:
            user["name"] = user_update.name
            
        if user_update.username:
            # Check if username already exists for another user
            if any(u["username"] == user_update.username and str(u["user_id"]) != user_id for u in users):
                raise HTTPException(status_code=400, detail="Username already taken")
            user["username"] = user_update.username
            
        if user_update.email:
            # Check if email already exists for another user
            if any(u["email"] == user_update.email and str(u["user_id"]) != user_id for u in users):
                raise HTTPException(status_code=400, detail="Email already taken")
            user["email"] = user_update.email
        
        # Save updated users
        save_users(users)
        
        # Return the updated user without password
        updated_user = user.copy()
        updated_user.pop("password")
        return {"message": "Profile updated successfully", "user": updated_user} 