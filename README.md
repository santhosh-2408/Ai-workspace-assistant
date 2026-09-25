# AI Workspace Assistant

A modern, AI-powered productivity web application that brings together intelligent document interaction and goal-oriented task planning. This assistant combines natural language understanding with advanced memory and planning capabilities to enhance personal and team productivity.

---

## 🚀 Overview

**AI Workspace Assistant** is a unified assistant designed to help users:

* Upload and query documents using natural language.
* Extract summaries, action items, and FAQ-style responses.
* Break down high-level goals into structured, actionable tasks.
* Retain memory of interactions to improve context and usability over time.

---

## 🎯 Key Features

| Feature                         | Description                                                         |
| ------------------------------- | ------------------------------------------------------------------- |
| 📄 Multi-File Upload            | Upload PDFs, CSVs, plain text, or Docs                              |
| 💬 Natural Language Q\&A        | Ask questions and receive cited answers from uploaded content       |
| 📑 Summarization & Action Items | Extract key summaries and decisions from docs and meeting notes     |
| 🧠 Goal Planner                 | Turn high-level goals into subtasks with intelligent agent support  |
| 🧭 Smart File Routing           | Automatically identify and route documents by type (PDF, CSV, etc.) |
| 🗂️ Vector Memory               | Store past conversations and preferences for smarter context        |
| 📈 Feedback Logging             | Enable feedback to improve AI responses over time                   |

---

## 🧠 Tech Stack

| Layer         | Technology                                       |
| ------------- | ------------------------------------------------ |
| LLM           | Gemini 1.5                                       |
| Orchestration | LangChain (Agents, Chains, Memory)               |
| Backend       | FastAPI                                          |
| Vector Store  | ChromaDB                                         |
| Loaders       | LangChain Document Loaders (PDF, CSV, Docs, TXT) |

---

## 💡 Use Cases

* Retrieve internal knowledge from policies and product documentation
* Summarize meeting notes and create follow-up tasks
* Q\&A over legal documents and contracts
* Goal setting and automatic task breakdown
* Analyze and ask questions on CSV reports

---

## 🔮 Future Scope

* Fine-tuning models for legal, HR, and marketing domains
* Web-based UI with real-time conversational memory
* Multi-user support with individual histories and access

---

## 🛠️ Getting Started

**Prerequisites:** Python 3.9+ and a Google Gemini API key
([get one free here](https://aistudio.google.com/app/apikey)).

### 1. Clone the repository

```bash
git clone <repo-url>
cd Ai-workspace-assistant
```

### 2. Create and activate a virtual environment

```bash
python3 -m venv venv

# macOS / Linux
source venv/bin/activate

# Windows (PowerShell)
.\venv\Scripts\Activate.ps1
```

### 3. Install dependencies

```bash
pip install --upgrade pip
pip install -r requirements.txt
```

> First install is large (~1–2 GB) because it pulls in PyTorch and the
> `sentence-transformers` embedding model. Give it a few minutes.

### 4. Configure environment variables

Copy the example file and add your own keys:

```bash
cp env.example .env
```

Then edit `.env` and set:

- `GEMINI_API_KEY` – your Google Gemini API key (required)
- `SECRET_KEY` – any long random string for signing auth tokens

### 5. Run the server

```bash
python main.py
```

This starts the app at **http://127.0.0.1:8000**.
(Equivalent: `uvicorn main:app --reload` for auto-reload during development.)

### 6. Check that it works

- Open **http://127.0.0.1:8000** in your browser — you'll see the login /
  registration page. Register a user, then upload a document and ask
  questions, or try the task planner.
- Open **http://127.0.0.1:8000/docs** for the interactive FastAPI (Swagger)
  API documentation.

The first document query downloads the embedding model and may take a few
seconds; subsequent queries are fast.

---

## 📁 Project Structure

```
.
├── main.py            # Entry point — starts the FastAPI server
├── requirements.txt   # Python dependencies
├── env.example        # Template for the .env file
├── app/
│   ├── main.py        # FastAPI app: CORS, routers, static file mounting
│   ├── config.py      # Env vars, Gemini + ChromaDB + embeddings setup
│   ├── routes/        # API endpoints (auth, file, query, memory, feedback, plan)
│   ├── services/      # Business logic
│   ├── models/        # Pydantic models
│   ├── assets/        # Images and logos
│   ├── index.html     # Login & registration UI
│   ├── dashboard.html # Chat & file management UI
│   ├── planner.html   # Task planner UI
│   └── *.css, *.js    # Frontend styles and logic
├── data/              # Runtime storage for uploads, memory, plans (git-ignored)
└── db/                # ChromaDB vector store (git-ignored)
```

> **Note:** `data/` and `db/` hold user uploads and the vector index. They are
> generated at runtime and intentionally excluded from git, so a fresh clone
> starts empty.

---

## 🤝 Contributing

Pull requests are welcome! For significant changes, please open an issue to discuss your ideas first.

---

## 📄 License

[MIT](LICENSE)

---

**AI Workspace Assistant – Smarter Work, Simpler Life.**
