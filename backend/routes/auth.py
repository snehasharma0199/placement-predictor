from fastapi import APIRouter, HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr
from database import get_db
from utils.auth_utils import hash_password, verify_password, create_access_token, decode_token
from datetime import datetime

router = APIRouter()
security = HTTPBearer()

# ---- Schemas ----
class RegisterSchema(BaseModel):
    username: str
    email: str
    password: str

class LoginSchema(BaseModel):
    username: str
    password: str

# ---- Dependency: get current user ----
async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    payload = decode_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    return payload

# ---- Routes ----
@router.post("/register", status_code=201)
async def register(data: RegisterSchema):
    db = get_db()
    existing = await db.users.find_one({"username": data.username})
    if existing:
        raise HTTPException(status_code=400, detail="Username already exists")
    
    existing_email = await db.users.find_one({"email": data.email})
    if existing_email:
        raise HTTPException(status_code=400, detail="Email already registered")

    user = {
        "username": data.username,
        "email": data.email,
        "password": hash_password(data.password),
        "created_at": datetime.utcnow()
    }
    await db.users.insert_one(user)
    return {"message": "Registration successful ✅"}


@router.post("/login")
async def login(data: LoginSchema):
    db = get_db()
    user = await db.users.find_one({"username": data.username})
    if not user or not verify_password(data.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid username or password")
    
    token = create_access_token({"sub": data.username, "email": user.get("email","")})
    return {"access_token": token, "token_type": "bearer", "username": data.username}


@router.get("/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    return {"username": current_user["sub"], "email": current_user.get("email", "")}
