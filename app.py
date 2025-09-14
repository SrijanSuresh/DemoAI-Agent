# app.py
import os, re, glob, numpy as np
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from sentence_transformers import SentenceTransformer

KB_DIR = os.getenv("KB_DIR", "data/kb")
app = FastAPI(title="Finn-mini")
CRISIS = re.compile(r"(suicide|self[-\s]?harm|kill myself|overdose)", re.I)
OOS    = re.compile(r"\b(dosage|dose|mg|milligram|diagnose|prescribe|medication)\b", re.I)
BULLET = re.compile(r"^\s*[-*•]\s+(.+)$")

def load_kb():
    items=[]
    for p in glob.glob(f"{KB_DIR}/*.md"):
        title=os.path.splitext(os.path.basename(p))[0].title()
        txt=open(p,encoding="utf-8").read()
        for i,chunk in enumerate([c.strip() for c in txt.split("\n\n") if c.strip()]):
            items.append({"id":f"{os.path.basename(p)}#{i}","title":title,"text":chunk})
    if not items: raise RuntimeError(f"No .md in {KB_DIR}")
    return items
KB=load_kb()
EMB=SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")
M = EMB.encode([c["text"] for c in KB], normalize_embeddings=True)

class ChatReq(BaseModel): message:str
def bullets(t):
    b=[m.group(1).strip() for m in map(BULLET.match,t.splitlines()) if m]; 
    return b if b else [s.strip() for s in re.split(r"(?<=[.!?])\s+", t) if s.strip()]

def retrieve(q,k=4):
    qv = EMB.encode([q], normalize_embeddings=True)[0]
    sims = M @ qv; idx = sims.argsort()[::-1][:k]
    return [{"score":float(sims[i]), **KB[i]} for i in idx if sims[i]>0.2]

@app.get("/health")
def health(): return {"status":"ok","kb_chunks":len(KB),"emb_model":"all-MiniLM-L6-v2"}

@app.post("/chat")
def chat(req:ChatReq):
    q=(req.message or "").strip()
    if not q: raise HTTPException(400,"Empty message")
    if CRISIS.search(q): return {"reply":"If you're in immediate danger call local emergency services. In the U.S., call or text 988.","citations":[],"safety":{"crisis":True}}
    if OOS.search(q):    return {"reply":"I can share general wellness tips, but I can’t diagnose or give dosing advice. Please consult a clinician.","citations":[],"safety":{"out_of_scope":True}}
    hits=retrieve(q); 
    if not hits: return {"reply":"I may not have notes on that yet. Try sleep, stress, or hydration topics.","citations":[],"safety":{}}
    tips=[]; cits=[]
    for h in hits:
        for t in bullets(h["text"]):
            if len(tips)<5 and t not in tips: tips.append(t)
        cits.append({"title":h["title"],"chunk_id":h["id"]})
        if len(tips)>=5: break
    reply="Here are a few things to try:\n\n"+"\n".join(f"{i}. {t}" for i,t in enumerate(tips,1))
    return {"reply":reply,"citations":cits,"safety":{}}
