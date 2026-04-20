from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from utils.auth_utils import decode_token
from typing import List
import httpx
import os

router = APIRouter()
security = HTTPBearer()

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    payload = decode_token(credentials.credentials)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    return payload

class Message(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    messages: List[Message]
    system: str = ""

class TextRequest(BaseModel):
    text: str
    task: str  # "resume", "interview", "package", "skills"

@router.post("/chat")
async def chat(req: ChatRequest, current_user: dict = Depends(get_current_user)):
    if not GROQ_API_KEY:
        raise HTTPException(status_code=500, detail="Groq API key not configured")

    system_prompt = req.system or """You are PlaceAI Assistant, an expert career counselor 
    specializing in campus placements in India. Help students with placement preparation, 
    interview tips, resume advice, and career guidance. Be concise, practical and encouraging."""

    messages = [{"role": "system", "content": system_prompt}]
    messages += [{"role": m.role, "content": m.content} for m in req.messages]

    async with httpx.AsyncClient() as client:
        res = await client.post(
            GROQ_URL,
            headers={"Authorization": f"Bearer {GROQ_API_KEY}", "Content-Type": "application/json"},
            json={"model": "llama3-8b-8192", "messages": messages, "max_tokens": 1000},
            timeout=30
        )
        data = res.json()
        if "error" in data:
            raise HTTPException(status_code=500, detail=data["error"]["message"])
        return {"reply": data["choices"][0]["message"]["content"]}


@router.post("/analyze")
async def analyze(req: TextRequest, current_user: dict = Depends(get_current_user)):
    if not GROQ_API_KEY:
        raise HTTPException(status_code=500, detail="Groq API key not configured")

    prompts = {
        "resume": """You are a professional resume reviewer for Indian campus placements.
Analyze the resume and return ONLY this JSON:
{"score": <0-100>, "grade": "<A/B/C/D>", "strengths": ["<p1>","<p2>","<p3>"], "improvements": ["<p1>","<p2>","<p3>"], "keywords_missing": ["<k1>","<k2>","<k3>"], "summary": "<2 sentence feedback>"}""",

        "interview": """You are an interview coach. Analyze readiness and return ONLY this JSON:
{"readiness_score": <0-100>, "level": "<Ready/Almost Ready/Needs Preparation>", "top_focus": ["<a1>","<a2>","<a3>"], "tips": ["<t1>","<t2>","<t3>"], "message": "<motivational message>"}""",

        "package": """You are a salary prediction expert for Indian IT placements. Return ONLY this JSON:
{"min_package": "<X LPA>", "max_package": "<Y LPA>", "expected_package": "<Z LPA>", "companies": ["<c1>","<c2>","<c3>"], "tips_to_increase": ["<t1>","<t2>"]}""",

        "skills": """You are a career skills advisor. Return ONLY this JSON:
{"must_have": ["<s1>","<s2>","<s3>","<s4>"], "good_to_have": ["<s1>","<s2>","<s3>"], "projects_to_build": ["<p1>","<p2>","<p3>"], "certifications": ["<c1>","<c2>"], "timeline": "<X months roadmap>"}"""
    }

    system = prompts.get(req.task, prompts["resume"])
    messages = [
        {"role": "system", "content": system},
        {"role": "user", "content": req.text}
    ]

    async with httpx.AsyncClient() as client:
        res = await client.post(
            GROQ_URL,
            headers={"Authorization": f"Bearer {GROQ_API_KEY}", "Content-Type": "application/json"},
            json={"model": "llama3-8b-8192", "messages": messages, "max_tokens": 1000},
            timeout=30
        )
        data = res.json()
        if "error" in data:
            raise HTTPException(status_code=500, detail=data["error"]["message"])

        raw = data["choices"][0]["message"]["content"]
        import json
        clean = raw.replace("```json", "").replace("```", "").strip()
        return json.loads(clean)
