from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from utils.auth_utils import decode_token
from typing import List
import httpx
import os
import json

router = APIRouter()
security = HTTPBearer()

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
    task: str

@router.get("/test")
async def test_key():
    key = os.environ.get("GROQ_API_KEY", "NOT_FOUND")
    return {"key_exists": key != "NOT_FOUND", "key_prefix": key[:8] if key != "NOT_FOUND" else "none"}

@router.post("/chat")
async def chat(req: ChatRequest, current_user: dict = Depends(get_current_user)):
    GROQ_API_KEY = os.environ.get("GROQ_API_KEY")
    if not GROQ_API_KEY:
        raise HTTPException(status_code=500, detail="GROQ_API_KEY not found in environment")

    system_prompt = req.system or "You are PlaceAI Assistant, an expert career counselor specializing in campus placements in India. Help students with placement preparation, interview tips, resume advice. Be concise and encouraging."

    messages = [{"role": "system", "content": system_prompt}]
    messages += [{"role": m.role, "content": m.content} for m in req.messages]

    try:
        async with httpx.AsyncClient(timeout=30) as client:
            res = await client.post(
                GROQ_URL,
                headers={"Authorization": f"Bearer {GROQ_API_KEY}", "Content-Type": "application/json"},
                json={"model": "llama3-8b-8192", "messages": messages, "max_tokens": 1000}
            )
            data = res.json()
            if "error" in data:
                raise HTTPException(status_code=500, detail=str(data["error"]))
            return {"reply": data["choices"][0]["message"]["content"]}
    except httpx.TimeoutException:
        raise HTTPException(status_code=500, detail="Groq API timeout")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/analyze")
async def analyze(req: TextRequest, current_user: dict = Depends(get_current_user)):
    GROQ_API_KEY = os.environ.get("GROQ_API_KEY")
    if not GROQ_API_KEY:
        raise HTTPException(status_code=500, detail="GROQ_API_KEY not found in environment")

    prompts = {
        "resume": 'You are a resume reviewer. Return ONLY JSON: {"score": <0-100>, "grade": "<A/B/C/D>", "strengths": ["p1","p2","p3"], "improvements": ["p1","p2","p3"], "keywords_missing": ["k1","k2","k3"], "summary": "<feedback>"}',
        "interview": 'You are an interview coach. Return ONLY JSON: {"readiness_score": <0-100>, "level": "<Ready/Almost Ready/Needs Preparation>", "top_focus": ["a1","a2","a3"], "tips": ["t1","t2","t3"], "message": "<message>"}',
        "package": 'You are a salary expert. Return ONLY JSON: {"min_package": "<X LPA>", "max_package": "<Y LPA>", "expected_package": "<Z LPA>", "companies": ["c1","c2","c3"], "tips_to_increase": ["t1","t2"]}',
        "skills": 'You are a skills advisor. Return ONLY JSON: {"must_have": ["s1","s2","s3","s4"], "good_to_have": ["s1","s2","s3"], "projects_to_build": ["p1","p2","p3"], "certifications": ["c1","c2"], "timeline": "<roadmap>"}'
    }

    system = prompts.get(req.task, prompts["resume"])

    try:
        async with httpx.AsyncClient(timeout=30) as client:
            res = await client.post(
                GROQ_URL,
                headers={"Authorization": f"Bearer {GROQ_API_KEY}", "Content-Type": "application/json"},
                json={"model": "llama3-8b-8192", "messages": [
                    {"role": "system", "content": system},
                    {"role": "user", "content": req.text}
                ], "max_tokens": 1000}
            )
            data = res.json()
            if "error" in data:
                raise HTTPException(status_code=500, detail=str(data["error"]))

            raw = data["choices"][0]["message"]["content"]
            clean = raw.replace("```json", "").replace("```", "").strip()
            return json.loads(clean)
    except json.JSONDecodeError as e:
        raise HTTPException(status_code=500, detail=f"JSON parse error: {str(e)}")
    except httpx.TimeoutException:
        raise HTTPException(status_code=500, detail="Groq API timeout")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))