import os
from dotenv import load_dotenv
import google.generativeai as genai
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_community.vectorstores import Chroma
from typing import List, Optional

# Load environment variables
load_dotenv()

# API Keys and Config
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-here")
ALGORITHM = "HS256"

# Configure Gemini
genai.configure(api_key=GEMINI_API_KEY)

def _select_supported_model(preferred_models: List[str]) -> Optional[str]:
    try:
        available = list(genai.list_models())
        # Filter models that support generateContent
        generate_capable = [
            m for m in available
            if hasattr(m, "supported_generation_methods")
            and "generateContent" in getattr(m, "supported_generation_methods", [])
        ]
        # Normalize to names
        names = {m.name for m in generate_capable}
        # Try preferred order (restrict strictly to preferred free-tier candidates)
        for model_name in preferred_models:
            if model_name in names:
                return model_name
        # If none of the preferred free-tier models are available, return None to trigger our fallback
        return None
    except Exception:
        # If list_models fails (e.g., outdated SDK or network), prefer our first free-tier candidate
        return preferred_models[0] if preferred_models else None

# Choose a model that works with the installed SDK
_PREFERRED_MODELS = [
    "gemini-1.5-flash",
    "gemini-1.5-flash-8b",
    "gemini-1.5-pro",
    "gemini-1.0-pro",
]
_MODEL_ID = _select_supported_model(_PREFERRED_MODELS) or "gemini-1.5-flash"
gemini_model = genai.GenerativeModel(_MODEL_ID)

# Directory paths
UPLOAD_DIR = "data/uploaded_docs"
MEMORY_PATH = "data/memory"
FEEDBACK_PATH = "data/feedback"
USERS_PATH = "data/users"
CHROMA_PATH = "db/chroma"

# Create directories
for path in [UPLOAD_DIR, MEMORY_PATH, FEEDBACK_PATH, USERS_PATH, CHROMA_PATH]:
    os.makedirs(path, exist_ok=True)

# File paths
USER_FILE = os.path.join(USERS_PATH, "users.json")

# Embedding setup
embedding_model = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")
vectorstore = Chroma(persist_directory=CHROMA_PATH, embedding_function=embedding_model)

# File loaders mapping
FILE_LOADERS = {
    "pdf": "PyPDFLoader",
    "csv": "CSVLoader",
    "txt": "TextLoader",
    "docx": "UnstructuredWordDocumentLoader",
    "xlsx": "UnstructuredExcelLoader"
} 