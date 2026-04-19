from fastapi import APIRouter, HTTPException, Depends, UploadFile, File
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from database import get_db
from utils.auth_utils import decode_token
from datetime import datetime
import joblib
import pandas as pd
import numpy as np
import os
import io

router = APIRouter()
security = HTTPBearer()

# ---- Load model, scaler, features ----
BASE = os.path.dirname(os.path.abspath(__file__))
MODEL_DIR = os.path.join(BASE, "..", "ml_models")

model = joblib.load(os.path.join(MODEL_DIR, "model.pkl"))
scaler = joblib.load(os.path.join(MODEL_DIR, "scaler.pkl"))
feature_columns = joblib.load(os.path.join(MODEL_DIR, "feature_columns.pkl"))

# ---- Auth dependency ----
async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    payload = decode_token(credentials.credentials)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    return payload

# ---- Schema ----
class PredictSchema(BaseModel):
    cgpa: float
    internships: int
    aptitude_score: float
    soft_skills: float
    projects: int

# ---- Single prediction ----
@router.post("/single")
async def predict_single(data: PredictSchema, current_user: dict = Depends(get_current_user)):
    db = get_db()
    
    input_df = pd.DataFrame([[
        data.cgpa, data.internships, data.aptitude_score,
        data.soft_skills, data.projects
    ]], columns=feature_columns)

    scaled = scaler.transform(input_df)
    pred = int(model.predict(scaled)[0])
    prob = float(model.predict_proba(scaled)[0][1]) * 100

    # Improvement tips
    tips = []
    if data.cgpa < 7: tips.append("Improve your CGPA above 7.0")
    if data.internships < 2: tips.append("Do at least 2 internships")
    if data.aptitude_score < 60: tips.append("Practice aptitude tests")
    if data.soft_skills < 6: tips.append("Improve communication & soft skills")
    if data.projects < 3: tips.append("Build at least 3 projects")

    result = {
        "username": current_user["sub"],
        "input": data.dict(),
        "prediction": "Placed" if pred == 1 else "Not Placed",
        "probability": round(prob, 2),
        "tips": tips,
        "timestamp": datetime.utcnow()
    }

    await db.predictions.insert_one(result)
    result.pop("_id", None)
    result["timestamp"] = result["timestamp"].isoformat()
    return result

# ---- Bulk prediction ----
@router.post("/bulk")
async def predict_bulk(file: UploadFile = File(...), current_user: dict = Depends(get_current_user)):
    db = get_db()

    content = await file.read()
    df = pd.read_csv(io.StringIO(content.decode("utf-8")))

    required = set(feature_columns)
    if not required.issubset(set(df.columns)):
        raise HTTPException(status_code=400, detail=f"CSV must have columns: {feature_columns}")

    X = df[feature_columns]
    scaled = scaler.transform(X)
    preds = model.predict(scaled)
    probs = model.predict_proba(scaled)[:, 1] * 100

    df["Prediction"] = ["Placed" if p == 1 else "Not Placed" for p in preds]
    df["Probability"] = [round(p, 2) for p in probs]
    df["Score"] = (
        df["CGPA"] * 10 +
        df["Internships"] * 5 +
        df["Aptitude_Test_Score"] * 0.5 +
        df["Soft_Skills_Rating"] * 5 +
        df["Projects"] * 5
    )
    df["Rank"] = df["Score"].rank(ascending=False, method="dense").astype(int)

    records = df.to_dict(orient="records")
    bulk_doc = {
        "username": current_user["sub"],
        "filename": file.filename,
        "total": len(records),
        "placed": int(sum(preds)),
        "not_placed": int(len(preds) - sum(preds)),
        "results": records,
        "timestamp": datetime.utcnow()
    }
    await db.bulk_predictions.insert_one(bulk_doc)

    return {
        "total": len(records),
        "placed": int(sum(preds)),
        "not_placed": int(len(preds) - sum(preds)),
        "results": records
    }

# ---- Prediction history ----
@router.get("/history")
async def get_history(current_user: dict = Depends(get_current_user)):
    db = get_db()
    cursor = db.predictions.find(
        {"username": current_user["sub"]},
        {"_id": 0}
    ).sort("timestamp", -1).limit(20)
    results = await cursor.to_list(length=20)
    for r in results:
        if isinstance(r.get("timestamp"), datetime):
            r["timestamp"] = r["timestamp"].isoformat()
    return results
