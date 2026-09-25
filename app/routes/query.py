from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import JSONResponse
from app.models.query import QueryRequest
from app.routes.auth import get_current_user_id
from app.services.file import get_uploaded_file_path
from app.services.memory import get_file_memory
from app.config import MEMORY_PATH, gemini_model
import pandas as pd
import os
import json
from datetime import datetime

router = APIRouter()

@router.post("/query")
async def query_knowledge_base(query: QueryRequest, user_id: str = Depends(get_current_user_id)):
    try:
        file_memory = get_file_memory(user_id, query.file_id)
        file_path = get_uploaded_file_path(user_id, query.file_id)
        
        if not file_path:
            return JSONResponse(
                status_code=404,
                content={"message": "File not found", "data": None}
            )
        
        if file_path.endswith('.csv'):
            df = pd.read_csv(file_path)
            if len(df) <= 100:
                df_str = df.to_markdown(index=False)
                data_note = "Here is the full data:"
            else:
                df_str = df.head(20).to_markdown(index=False)
                data_note = f"Here are the first 20 rows out of {len(df)} total. If you need the full data, please specify."
            
            columns = ', '.join(df.columns)
            filename = os.path.basename(file_path)
            prompt = f"""
            You are a data analyst assistant. The user has uploaded a CSV file named '{filename}' with the following columns: {columns}.

            
            {data_note}
            {df_str}

            User's question: {query.question}

            Answer the user's question directly and concisely, using only the data provided.
            always consider unique columns like id , email for any filtering or sorting like how many people are there in the data , how many of them subscribed.
            Do not explain your reasoning or mention the data size. Just give the answer in a friendly, helpful tone.
            If you feel to include any other corresponding column along with it like the name of the person, please do so.
            If the user just greets you, just say "Hello, how can I help you today?" don't say anything else.
            If the user asks about the file, like what is the file about, what is the data about, what is the file name, just say "The file : {filename} is about: {data_note}" or just tell the main context about the file in a single line."
            """
            
            # Call Gemini with graceful rate-limit handling
            try:
                response = gemini_model.generate_content(prompt)
            except Exception as ge:
                ge_str = str(ge).lower()
                if "quota" in ge_str or "rate" in ge_str or "429" in ge_str:
                    return JSONResponse(
                        status_code=429,
                        content={
                            "status_code": 429,
                            "data": None,
                            "message": "Rate limit reached on Gemini free tier. Please retry shortly."
                        }
                    )
                raise
            lines = [line.strip(" .") for line in response.text.strip().split("\n") if line.strip()]
            
            # Update memory
            memory_data = update_memory_data(file_memory, query, lines)
            save_memory(user_id, query.file_id, memory_data)
            
            return {
                "status_code": 200,
                "data": {
                    "response": lines,
                    "memory_updated": True
                },
                "message": "success"
            }
            
        # For non-CSV files
        from app.services.file import vectorstore
        results = vectorstore.similarity_search(
            query.question,
            k=3,
            filter={
                "$and": [
                    {"user_id": str(user_id)},
                    {"file_id": str(query.file_id)}
                ]
            }
        )
        context = "\n\n".join([doc.page_content for doc in results])
        
        prompt = f"""
        You are a helpful assistant. Use the following context and document history to provide a relevant answer.
        
        
        Document History:
        {file_memory.get('context', '')}
        
        Document Metadata:
        {json.dumps(file_memory.get('metadata', {}), indent=2)}
        
        Document Context:
        {context}

        Question: {query.question}
        """
        
        # Call Gemini with graceful rate-limit handling
        try:
            response = gemini_model.generate_content(prompt)
        except Exception as ge:
            ge_str = str(ge).lower()
            if "quota" in ge_str or "rate" in ge_str or "429" in ge_str:
                # Provide a retrieval-only fallback response so users still get value when rate-limited
                fallback = " Here are the most relevant excerpts I found:\n\n" + context[:1200]
                lines = [line.strip() for line in fallback.split('\n') if line.strip()]

                # Update memory with the fallback
                memory_data = update_memory_data(file_memory, query, lines)
                save_memory(user_id, query.file_id, memory_data)

                return {
                    "status_code": 200,
                    "data": {
                        "response": lines,
                        "memory_updated": True
                    },
                    "message": "partial_fallback_due_to_rate_limit"
                }
            raise
        lines = [line.strip() for line in response.text.strip().split('\n') if line.strip()]
        
        # Update memory
        memory_data = update_memory_data(file_memory, query, lines)
        save_memory(user_id, query.file_id, memory_data)
        
        return {
            "status_code": 200,
            "data": {
                "response": lines,
                "memory_updated": True
            },
            "message": "success"
        }
        
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={
                "status_code": 500,
                "data": None,
                "message": str(e)
            }
        )

def update_memory_data(file_memory, query, response_lines):
    prev_context = file_memory.get("context", [])
    if not isinstance(prev_context, list):
        prev_context = []
    
    prev_context.append({
        "question": query.question.strip(),
        "response": response_lines
    })
    
    return {
        "timestamp": datetime.now().isoformat(),
        "file_id": query.file_id,
        "context": prev_context,
        "metadata": {
            **file_memory.get('metadata', {}),
            "last_interaction": datetime.now().isoformat(),
            "question_count": file_memory.get('metadata', {}).get('question_count', 0) + 1
        }
    }

def save_memory(user_id, file_id, memory_data):
    memory_file = os.path.join(MEMORY_PATH, user_id, f"{file_id}.json")
    os.makedirs(os.path.dirname(memory_file), exist_ok=True)
    with open(memory_file, "w") as f:
        json.dump(memory_data, f, indent=2) 