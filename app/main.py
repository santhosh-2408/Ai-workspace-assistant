from fastapi import FastAPI, APIRouter, Depends
from app.config import GEMINI_API_KEY
import google.generativeai as genai
from fastapi.responses import JSONResponse
import os
import json
from app.routes.auth import get_current_user_id
from app.config import MEMORY_PATH
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles


# Configure Gemini
genai.configure(api_key=GEMINI_API_KEY)
gemini_model = genai.GenerativeModel("gemini-1.5-flash")

# FastAPI app
app = FastAPI()

# Add CORS middleware first
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Import routers
from app.routes.auth import router as auth_router
from app.routes.file import router as file_router
from app.routes.query import router as query_router
from app.routes.feedback import router as feedback_router
from app.routes.memory import router as memory_router
from app.routes.plan import router as plan_router

# Include routers BEFORE mounting static files
app.include_router(auth_router, prefix="/api", tags=["Authentication"])
app.include_router(file_router, prefix="/api", tags=["File Operations"])
app.include_router(query_router, prefix="/api", tags=["Query Operations"])
app.include_router(feedback_router, prefix="/api", tags=["Feedback"]) 
app.include_router(memory_router, prefix="/api", tags=["Memory"])
app.include_router(plan_router, prefix="/api", tags=["Task Planner"])

# Mount the static files directory AFTER routers
app.mount("/", StaticFiles(directory="app", html=True), name="static")
