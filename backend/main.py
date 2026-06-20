import os
import sys
import uuid
from datetime import datetime
from typing import Optional

from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from dotenv import load_dotenv
import jwt
import bcrypt

sys.path.append(os.path.join(os.path.dirname(__file__), '..'))
from ai.analyze import analyze as pytorch_analyze

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

SECRET_KEY = "vitalvision-secret-key-2024"

INVITE_CODES = {
    "RAD-2026": "radiologist",
    "DEPT-2026": "department_doctor",
    "OPS-2026": "ops",
}
USED_INVITE_CODES: set[str] = set()

# In-memory storage
studies = []
users = []

security = HTTPBearer()

# --- Models ---
class PatientMetadata(BaseModel):
    patientName: str
    patientId: str
    age: int
    sex: str
    modality: str
    bodyPart: Optional[str] = ""
    clinicalNotes: Optional[str] = ""

class AnalyzeRequest(BaseModel):
    image: str
    metadata: PatientMetadata
    lang: Optional[str] = "en"

class ArchiveRequest(BaseModel):
    metadata: dict
    report: dict

class RegisterRequest(BaseModel):
    name: str
    email: str
    password: str
    invite_code: str
    hospital: Optional[str] = "General Hospital"

class LoginRequest(BaseModel):
    email: str
    password: str

# --- Auth helpers ---
def create_token(user_id: str) -> str:
    return jwt.encode({"user_id": user_id}, SECRET_KEY, algorithm="HS256")

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=["HS256"])
        user_id = payload.get("user_id")
        for user in users:
            if user["id"] == user_id:
                return user
        raise HTTPException(status_code=401, detail="User not found")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

# --- Mock report ---
_MOCK_REPORTS = {
    "en": {
        "riskScore": 78,
        "riskLevel": "HIGH",
        "findings": [
            {
                "region": "right lower lobe",
                "severity": "moderate",
                "description": "consolidation consistent with bacterial pneumonia",
            }
        ],
        "impression": "There is evidence of right lower lobe consolidation most consistent with bacterial pneumonia. No pleural effusion or pneumothorax identified. Cardiac silhouette is within normal limits.",
        "recommendation": "Clinical correlation recommended. Consider antibiotic therapy and follow-up chest X-ray in 4-6 weeks.",
        "tags": ["pneumonia", "consolidation", "follow-up required"],
        "studyQuality": "good",
    },
    "sq": {
        "riskScore": 78,
        "riskLevel": "HIGH",
        "findings": [
            {
                "region": "lobi i poshtëm i djathtë",
                "severity": "moderate",
                "description": "konsolidim në përputhje me pneumoni bakteriale",
            }
        ],
        "impression": "Vërehet konsolidim në lobin e poshtëm të djathtë, më shumë në përputhje me pneumoni bakteriale. Nuk u identifikua efuzion pleural ose pneumotoraks. Silueta kardiake brenda kufijve normalë.",
        "recommendation": "Rekomandohet korrelim klinik. Konsidero terapi me antibiotikë dhe rentgen kontrolli të kraharorit pas 4-6 javësh.",
        "tags": ["pneumoni", "konsolidim", "kërkohet kontroll"],
        "studyQuality": "good",
    },
}

def mock_report(lang: str = "en") -> dict:
    return _MOCK_REPORTS.get(lang, _MOCK_REPORTS["en"])

# --- User helpers ---

def _public_user(user: dict) -> dict:
    return {
        "id": user["id"],
        "name": user["name"],
        "email": user["email"],
        "role": user["role"],
        "hospital": user["hospital"],
    }

def _seed_demo_users() -> None:
    if users:
        return
    demo = [
        ("Dr. Arben Kola", "dr.radiolog@vitalvision.al", "password123", "radiologist", "QSUT Tirana"),
        ("Dr. Elira Hoxha", "dr.dept@vitalvision.al", "password123", "department_doctor", "QSUT Tirana"),
        ("Ops Admin", "ops@vitalvision.al", "password123", "ops", "QSUT Tirana"),
    ]
    for name, email, password, role, hospital in demo:
        users.append({
            "id": str(uuid.uuid4()),
            "name": name,
            "email": email,
            "password": bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode(),
            "role": role,
            "hospital": hospital,
        })

_seed_demo_users()

# --- Auth Endpoints ---

@app.post("/register")
async def register(request: RegisterRequest):
    code = request.invite_code
    if code not in INVITE_CODES or code in USED_INVITE_CODES:
        raise HTTPException(status_code=403, detail="Invalid invite code")

    for user in users:
        if user["email"] == request.email:
            raise HTTPException(status_code=400, detail="Email already registered")

    role = INVITE_CODES[code]
    hashed = bcrypt.hashpw(request.password.encode(), bcrypt.gensalt()).decode()
    user = {
        "id": str(uuid.uuid4()),
        "name": request.name,
        "email": request.email,
        "password": hashed,
        "role": role,
        "hospital": request.hospital,
    }
    users.append(user)
    USED_INVITE_CODES.add(code)
    token = create_token(user["id"])
    return {"token": token, "user": _public_user(user)}

@app.post("/login")
async def login(request: LoginRequest):
    for user in users:
        if user["email"] == request.email:
            if bcrypt.checkpw(request.password.encode(), user["password"].encode()):
                token = create_token(user["id"])
                return {"token": token, "user": _public_user(user)}
    raise HTTPException(status_code=401, detail="Invalid email or password")

@app.post("/logout")
async def logout(current_user: dict = Depends(get_current_user)):
    return {"success": True, "message": "Logged out successfully"}

@app.get("/me")
async def me(current_user: dict = Depends(get_current_user)):
    return _public_user(current_user)

# --- Main Endpoints ---

@app.post("/analyze")
async def analyze(request: AnalyzeRequest):
    lang = request.lang or "en"
    try:
        return pytorch_analyze(image_base64=request.image, lang=lang)
    except Exception:
        return mock_report(lang)

@app.post("/archive")
async def archive(request: ArchiveRequest):
    study = {
        "id": str(uuid.uuid4()),
        "timestamp": datetime.utcnow().isoformat(),
        "metadata": request.metadata,
        "report": request.report,
    }
    studies.append(study)
    return {"success": True, "studyId": study["id"]}

@app.get("/studies")
async def get_studies():
    return studies

@app.get("/studies/{study_id}")
async def get_study(study_id: str):
    for study in studies:
        if study["id"] == study_id:
            return study
    raise HTTPException(status_code=404, detail="Study not found")

@app.get("/alerts")
async def get_alerts():
    return [s for s in studies if s["report"].get("riskScore", 0) >= 75]

@app.get("/stats")
async def get_stats():
    total = len(studies)
    avg_risk = sum(s["report"].get("riskScore", 0) for s in studies) / total if total else 0
    high_risk = len([s for s in studies if s["report"].get("riskScore", 0) >= 75])
    modalities = {}
    for s in studies:
        mod = s["metadata"].get("modality", "unknown")
        modalities[mod] = modalities.get(mod, 0) + 1
    return {
        "totalStudies": total,
        "averageRiskScore": round(avg_risk, 1),
        "highRiskCases": high_risk,
        "modalityBreakdown": modalities
    }