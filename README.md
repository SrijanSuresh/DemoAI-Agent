# Finn — AI Fitness Coach

Simple full-stack project where a **Next.js frontend** talks to a **FastAPI backend**.  
The backend uses embeddings + a small markdown knowledge base to answer basic health and wellness questions.  
If a question is out of scope, the bot politely declines.

## Features
- Answers from a small KB (sleep, stress, hydration, etc.)
- Graceful handling of medical / crisis / out-of-scope stuff
- Frontend built with Next.js (React + Tailwind)
- Backend with FastAPI + sentence-transformers
- Dockerized backend for easy deploy (tested on Render)

## Project Structure
    DemoAI-Agent/
    ├── finn-ui/ # Next.js frontend (Vercel-ready)
    ├── app.py # FastAPI backend
    ├── requirements.txt # backend deps
    ├── Dockerfile # backend container
    └── docker-compose.yml


## Running Locally

### Backend
```bash
# inside repo root
docker compose up --build
# backend will be on http://localhost:8000
curl http://localhost:8000/health
curl -X POST http://localhost:8000/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"How can I improve my sleep?"}'
cd finn-ui
npm install
npm run dev
# open http://localhost:3000
```
Deployment

### Frontend → Vercel (root set to finn-ui)

### Backend → Render (free tier, Docker build)

### Notes

- Just a demo project, not medical advice.

- Kept backend super lightweight (<500MB) so it runs on free hosting.

- Built as a learning project combining embeddings, RAG basics, and deployment practice.