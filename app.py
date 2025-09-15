# app.py - Finn v0 backend (FastEmbed + FastAPI)
import os
import numpy as np
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from fastembed import TextEmbedding

# --- Config ---
KB = [
    {"id": "sleep#0", "title": "Sleep", "text": "Keep a consistent sleep/wake schedule. Limit caffeine. Dark, cool, quiet room. No screens 1h before bed."},
    {"id": "stress#0", "title": "Stress", "text": "Practice 4-4-4 breathing. Take short walks. Journal 5 minutes. Micro-breaks each hour."},
    {"id": "hydration#0", "title": "Hydration", "text": "Sip water regularly. Eat water-rich foods like fruits/veg. Limit sugary drinks."}
]

EMB = TextEmbedding("BAAI/bge-small-en-v1.5")  # tiny embedder
KB_VECS = np.array(list(EMB.embed([c["text"] for c in KB])))
KB_VECS /= np.linalg.norm(KB_VECS, axis=1, keepdims=True) + 1e-9

# --- FastAPI ---
app = FastAPI(title="Finn v0")

class ChatReq(BaseModel):
    message: str

@app.get("/health")
def health():
    return {"status": "ok", "kb_chunks": len(KB)}

@app.post("/chat")
def chat(req: ChatReq):
    q = req.message.strip()
    if not q:
        raise HTTPException(400, "Empty message")

    # Safety: crisis / out-of-scope
    lq = q.lower()
    if any(x in lq for x in ["suicide","self-harm","kill myself","overdose"]):
        return {"reply":"If in danger, call emergency services. In the U.S., dial 988.","citations":[],"safety":{"crisis":True}}
    if any(x in lq for x in ["dosage","mg","diagnose","prescribe"]):
        return {"reply":"I can share general wellness tips, but not medical dosing or diagnoses.","citations":[],"safety":{"out_of_scope":True}}

    # Retrieval
    qv = np.array(list(EMB.embed([q])))[0]
    qv /= np.linalg.norm(qv) + 1e-9
    sims = KB_VECS @ qv
    best = KB[int(sims.argmax())]

    return {
        "reply": best["text"],
        "citations": [{"title": best["title"], "id": best["id"], "score": float(sims.max())}],
        "safety": {}
    }

# Run local: uvicorn app:app --host 0.0.0.0 --port 8000
