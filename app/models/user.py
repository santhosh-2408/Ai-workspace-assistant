from pydantic import BaseModel
from datetime import datetime

class User(BaseModel):
    user_id: int
    name: str
    username: str
    email: str
    password: str 