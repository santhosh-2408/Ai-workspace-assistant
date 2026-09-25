from fastapi import APIRouter, UploadFile, File, Depends, Request, HTTPException
from fastapi.responses import JSONResponse, FileResponse
from app.routes.auth import get_current_user_id
from app.services.file import load_and_embed, get_uploaded_file_path
from app.config import UPLOAD_DIR, SECRET_KEY, ALGORITHM
import os
import shutil
from jose import jwt, JWTError

router = APIRouter()

@router.post("/upload")
async def upload_file(file: UploadFile = File(...), user_id: str = Depends(get_current_user_id)):
    try:
        user_upload_dir = os.path.join(UPLOAD_DIR, user_id)
        os.makedirs(user_upload_dir, exist_ok=True)
        file_path = os.path.join(user_upload_dir, file.filename)
        
        with open(file_path, "wb") as f:
            shutil.copyfileobj(file.file, f)
        
        file_id = os.path.splitext(file.filename)[0]
        chunk_count = load_and_embed(file_path, user_id, file_id)
        if chunk_count:
            return {
                "status": "success", 
                "chunks": chunk_count, 
                "filename": file.filename,
                "file_id": file_id
            }
        else:
            return JSONResponse(status_code=400, content={"error": "Unsupported file type"})
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})

@router.get("/files")
async def get_files(user_id: str = Depends(get_current_user_id)):
    user_upload_dir = os.path.join(UPLOAD_DIR, user_id)
    
    if not os.path.exists(user_upload_dir):
        return {"files": []}
    
    files = []
    for filename in os.listdir(user_upload_dir):
        file_id = os.path.splitext(filename)[0]
        files.append({
            "filename": filename,
            "file_id": file_id,
            "upload_date": os.path.getctime(os.path.join(user_upload_dir, filename))
        })
    
    # Sort by upload date (newest first)
    files.sort(key=lambda x: x["upload_date"], reverse=True)
    
    return {"files": files}

@router.delete("/files/{file_id}")
async def delete_file(file_id: str, user_id: str = Depends(get_current_user_id)):
    user_upload_dir = os.path.join(UPLOAD_DIR, user_id)
    
    if not os.path.exists(user_upload_dir):
        return JSONResponse(status_code=404, content={"error": "No files found"})
    
    file_deleted = False
    for filename in os.listdir(user_upload_dir):
        file_base_name = os.path.splitext(filename)[0]
        if file_base_name == file_id:
            file_path = os.path.join(user_upload_dir, filename)
            os.remove(file_path)
            file_deleted = True
            break
    
    # Also delete any memory files associated with this file_id
    memory_file_path = os.path.join("data/memory", user_id, f"{file_id}.json")
    if os.path.exists(memory_file_path):
        os.remove(memory_file_path)
    
    if file_deleted:
        return {"status": "success", "message": "File deleted successfully"}
    else:
        return JSONResponse(status_code=404, content={"error": "File not found"})

@router.get("/files/{file_id}/view")
async def view_file(file_id: str, user_id: str = Depends(get_current_user_id)):
    file_path = get_uploaded_file_path(user_id, file_id)
    if not file_path or not os.path.exists(file_path):
        return JSONResponse(status_code=404, content={"error": "File not found"})
    return FileResponse(file_path)

@router.get("/files/{file_id}/public_view")
async def public_view_file(file_id: str, token: str, request: Request):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid authentication credentials")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid authentication credentials")
    file_path = get_uploaded_file_path(user_id, file_id)
    if not file_path or not os.path.exists(file_path):
        return JSONResponse(status_code=404, content={"error": "File not found"})
    return FileResponse(file_path) 