# 🧠 AI Personal Learning OS

> The future operating system for learning — an autonomous AI-powered personalized learning platform.

[![Built with AI Agents](https://img.shields.io/badge/AI%20Agents-5%20Active-7c3aed?style=for-the-badge)](/)
[![Next.js 15](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge)](https://nextjs.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?style=for-the-badge)](https://fastapi.tiangolo.com)
[![Gemini](https://img.shields.io/badge/Gemini-Flash-4285F4?style=for-the-badge)](https://ai.google.dev)

---

## 🎯 What is this ?

AI Personal Learning OS is an **intelligent education platform** that automatically generates personalized learning experiences from your uploaded materials. It's not just a chatbot — it's:

- 🤖 **An AI Tutor** — answers questions from your materials using RAG
- 📋 **An AI Planner** — creates adaptive study roadmaps
- 📝 **An AI Quiz Master** — generates and grades assessments
- 🃏 **An AI Flashcard Creator** — builds spaced repetition cards
- 📊 **An AI Analytics Engine** — tracks progress and adapts learning

---

## ⚡ Key Features

### 🔐 Authentication
- Email/password signup and login
- Google OAuth integration
- Supabase Auth with JWT sessions

### 📄 Smart Document Upload
- PDF, DOCX, TXT, MD file support
- Automatic text extraction and chunking
- Sentence-transformer embeddings (all-MiniLM-L6-v2)
- ChromaDB vector storage

### 💬 RAG-Powered AI Tutor
- Retrieval-Augmented Generation chat
- Answers ONLY from your uploaded materials
- Source citations with page references
- Beginner-friendly explanations

### 🗺️ Adaptive Learning Roadmap
- AI-generated personalized study plans
- Daily tasks and weekly milestones
- Performance-based automatic adaptation
- Difficulty and time estimates

### 📝 AI Quiz Generator
- MCQ, True/False, and Short Answer questions
- Automatic grading and weakness analysis
- Difficulty levels (easy, medium, hard)
- Topic-based performance tracking

### 🃏 Smart Flashcards
- AI-generated flashcard decks
- Interactive 3D card flip animations
- Spaced repetition support
- Difficulty tracking

### 📊 Analytics Dashboard
- Learning streaks and progress tracking
- Quiz score history and trends
- Weak/strong topic identification
- Daily activity visualization
- AI-powered recommendations

### 🤖 Multi-Agent AI System
5 specialized AI agents working autonomously:

| Agent | Role | Responsibility |
|-------|------|----------------|
| **Planner** | Learning Architect | Creates and adapts roadmaps |
| **Tutor** | Learning Companion | Explains concepts via RAG |
| **Quiz** | Assessment Creator | Generates and grades quizzes |
| **Revision** | Material Creator | Builds flashcards and summaries |
| **Performance** | Analytics Analyst | Monitors and adapts learning |

---

## 🏗️ Architecture

```
┌─────────────────┐     ┌──────────────────────────┐
│   Next.js 15    │     │       FastAPI Backend     │
│   (Frontend)    │────▶│                          │
│                 │     │  ┌──────┐ ┌───────────┐  │
│ • Dashboard     │     │  │ API  │ │ AI Agents │  │
│ • Chat UI       │     │  │Routes│ │ (CrewAI)  │  │
│ • Quiz UI       │     │  └──┬───┘ └─────┬─────┘  │
│ • Roadmap UI    │     │     │           │         │
│ • Flashcards    │     │  ┌──▼───────────▼──────┐  │
│ • Analytics     │     │  │   RAG Pipeline      │  │
└─────────────────┘     │  │ (LangChain + embed) │  │
                        │  └──┬──────────────┬───┘  │
                        │     │              │      │
                        │  ┌──▼────┐  ┌──────▼───┐  │
                        │  │Gemini │  │ ChromaDB │  │
                        │  │ Flash │  │ (vectors)│  │
                        │  └───────┘  └──────────┘  │
                        └────────┬──────────────────┘
                                 │
                        ┌────────▼──────────────┐
                        │  Supabase PostgreSQL  │
                        │  (users, progress,    │
                        │   quizzes, roadmaps)  │
                        └───────────────────────┘
```

---

## 🛠️ Tech Stack

### Frontend
- **Next.js 15** (App Router, TypeScript)
- **Tailwind CSS** (custom dark theme)
- **Framer Motion** (animations)
- **React Query** (server state)
- **Zustand** (client state)
- **Lucide React** (icons)

### Backend
- **FastAPI** (Python async API)
- **LangChain** (RAG orchestration)
- **Sentence Transformers** (embeddings)
- **ChromaDB** (vector database)
- **Google Gemini Flash** (LLM)

### Database
- **Supabase PostgreSQL** (structured data)
- **ChromaDB** (vector embeddings)

### AI
- **Gemini 2.0 Flash** (primary LLM)
- **all-MiniLM-L6-v2** (embeddings)

---

## 🚀 Setup Guide

### Prerequisites
- Node.js 20+
- Python 3.11+
- Supabase account (free tier)
- Gemini API key (free)

### 1. Clone the repo
```bash
git clone https://github.com/your-username/ai-learning-os.git
cd ai-learning-os
```

### 2. Set up Supabase
1. Create a new project at [supabase.com](https://supabase.com)
2. Go to SQL Editor and run the schema from `docs/supabase_schema.sql`
3. Enable Google OAuth in Authentication → Providers
4. Copy your project URL and anon key

### 3. Backend setup
```bash
cd backend
python -m venv venv
venv\Scripts\activate  # Windows
# source venv/bin/activate  # Linux/Mac

pip install -r requirements.txt

# Create .env from template
copy .env.example .env
# Edit .env with your API keys
```

### 4. Frontend setup
```bash
cd frontend
npm install

# Create .env.local from template
copy .env.example .env.local
# Edit .env.local with your Supabase keys
```

### 5. Run the app
```bash
# Terminal 1 — Backend
cd backend
uvicorn app.main:app --reload --port 8000

# Terminal 2 — Frontend
cd frontend
npm run dev
```

Visit **http://localhost:3000** 🎉

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/signup` | Register user |
| POST | `/api/auth/login` | Login user |
| GET | `/api/auth/me` | Get current user |
| POST | `/api/documents/upload` | Upload & process document |
| GET | `/api/documents/` | List documents |
| POST | `/api/chat` | RAG-powered chat |
| POST | `/api/generate-quiz` | Generate quiz |
| POST | `/api/submit-quiz` | Submit & grade quiz |
| POST | `/api/generate-roadmap` | Generate roadmap |
| GET | `/api/roadmap` | Get active roadmap |
| POST | `/api/generate-flashcards` | Generate flashcards |
| GET | `/api/flashcards` | List flashcard decks |
| GET | `/api/dashboard` | Dashboard data |
| GET | `/api/analytics` | Learning analytics |
| POST | `/api/update-performance` | Log performance |

---

## 🎬 Demo Flow

1. **User uploads a PDF** → AI parses, chunks, and embeds it
2. **AI generates a roadmap** → Personalized study plan with daily tasks
3. **User chats with tutor** → RAG retrieves context, AI explains concepts
4. **AI creates a quiz** → MCQ, T/F, and short answer questions
5. **User performs poorly** → Score < 60% triggers adaptation
6. **AI adapts the roadmap** → Extra practice, slower pace, prerequisites added
7. **Dashboard updates** → Streaks, scores, weak topics, and recommendations

> The adaptive behavior is the core selling point — the system autonomously adjusts to optimize learning.

---

## 📂 Project Structure

```
ai-learning-os/
├── frontend/
│   ├── src/
│   │   ├── app/           # Next.js pages
│   │   ├── components/    # Shared components
│   │   ├── lib/           # Utils, store, supabase
│   │   └── services/      # API client
│   └── package.json
├── backend/
│   ├── app/
│   │   ├── agents/        # CrewAI agent system
│   │   ├── api/           # FastAPI routes
│   │   ├── rag/           # RAG pipeline
│   │   ├── services/      # Business logic
│   │   ├── models/        # Pydantic schemas
│   │   └── main.py        # App entry point
│   └── requirements.txt
├── docs/
│   └── supabase_schema.sql
├── docker-compose.yml
└── README.md
```

---

## 🚢 Deployment

### Frontend → Vercel
```bash
cd frontend
npx vercel
```

### Backend → Render / Railway
1. Connect your GitHub repo
2. Set build command: `pip install -r requirements.txt`
3. Set start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
4. Add environment variables from `.env`

### Docker
```bash
docker-compose up --build
```

---

## 🏆 Hackathon Highlights

- ✅ **5 autonomous AI agents** working collaboratively
- ✅ **Adaptive learning** — automatically adjusts to performance
- ✅ **RAG pipeline** — answers only from uploaded content
- ✅ **Enterprise-grade architecture** — clean separation of concerns
- ✅ **Production-quality UI** — dark mode, animations, premium design
- ✅ **Full-stack TypeScript/Python** — modern tech stack
- ✅ **Vector database** — semantic search with ChromaDB
- ✅ **Real-time analytics** — streaks, scores, recommendations

---

## 📝 License

MIT License — Built for the AI Agents Hackathon 2025
