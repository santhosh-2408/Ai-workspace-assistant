from datetime import datetime, timedelta
from jose import jwt
from passlib.context import CryptContext
import json
import os
from app.config import SECRET_KEY, ALGORITHM, USER_FILE
import threading
from fastapi import APIRouter, Depends, HTTPException, Body
from fastapi.security import OAuth2PasswordRequestForm, OAuth2PasswordBearer

user_lock = threading.Lock()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/token")

def load_users():
    if not os.path.exists(USER_FILE):
        return []
    with open(USER_FILE, "r") as f:
        return json.load(f)

def save_users(users):
    with open(USER_FILE, "w") as f:
        json.dump(users, f, indent=2)

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.now() + timedelta(days=1)
    to_encode["exp"] = int(expire.timestamp())
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password) 