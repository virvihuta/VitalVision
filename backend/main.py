from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from typing import Optional
import uuid
from datetime import datetime
import anthropic
import os
from dotenv import load_dotenv
import jwt
import bcrypt

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

SECRET_KEY = "vitalvision-secret-key-2024"

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
    clinicalNotes: Optional[str] = ""

class AnalyzeRequest(BaseModel):
    image: str
    metadata: PatientMetadata

class ArchiveRequest(BaseModel):
    metadata: dict
    report: dict

class RegisterRequest(BaseModel):
    name: str
    email: str
    password: str
    role: str
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
MOCK_REPORT = {
    "riskScore": 78,
    "riskLevel": "HIGH",
    "findings": [
        {
            "region": "right lower lobe",
            "severity": "moderate",
            "description": "consolidation consistent with bacterial pneumonia"
        }
    ],
    "impression": "There is evidence of right lower lobe consolidation most consistent with bacterial pneumonia. No pleural effusion or pneumothorax identified. Cardiac silhouette is within normal limits.",
    "recommendation": "Clinical correlation recommended. Consider antibiotic therapy and follow-up chest X-ray in 4-6 weeks.",
    "tags": ["pneumonia", "consolidation", "follow-up required"],
    "studyQuality": "good"
}

SYSTEM_PROMPT = """You are an expert radiologist AI assistant. Analyze the provided medical image and return a structured JSON report.

You must return ONLY valid JSON, no other text, in exactly this format:
{
  "riskScore": <integer 0-100>,
  "riskLevel": <"LOW" if score<30, "MODERATE" if 30-74, "HIGH" if >=75>,
  "findings": [
    {
      "region": "<anatomical region>",
      "severity": "<mild|moderate|severe>",
      "description": "<specific clinical description>"
    }
  ],
  "impression": "<2-3 sentence overall clinical picture>",
  "recommendation": "<specific next step>",
  "tags": ["<tag1>", "<tag2>"],
  "studyQuality": "<good|fair|poor>"
}

If the image is blurry, wrongly oriented, or not a medical image, return:
{
  "riskScore": 0,
  "riskLevel": "LOW",
  "findings": [{"region": "N/A", "severity": "N/A", "description": "image quality insufficient for reliable analysis"}],
  "impression": "The submitted image could not be analyzed reliably due to quality issues.",
  "recommendation": "Please resubmit a higher quality image.",
  "tags": ["image-quality-issue"],
  "studyQuality": "poor"
}"""

# --- Auth Endpoints ---

@app.post("/register")
async def register(request: RegisterRequest):
    for user in users:
        if user["email"] == request.email:
            raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed = bcrypt.hashpw(request.password.encode(), bcrypt.gensalt()).decode()
    user = {
        "id": str(uuid.uuid4()),
        "name": request.name,
        "email": request.email,
        "password": hashed,
        "role": request.role,
        "hospital": request.hospital
    }
    users.append(user)
    token = create_token(user["id"])
    return {
        "token": token,
        "user": {
            "id": user["id"],
            "name": user["name"],
            "role": user["role"],
            "hospital": user["hospital"]
        }
    }

@app.post("/login")
async def login(request: LoginRequest):
    for user in users:
        if user["email"] == request.email:
            if bcrypt.checkpw(request.password.encode(), user["password"].encode()):
                token = create_token(user["id"])
                return {
                    "token": token,
                    "user": {
                        "id": user["id"],
                        "name": user["name"],
                        "role": user["role"],
                        "hospital": user["hospital"]
                    }
                }
    raise HTTPException(status_code=401, detail="Invalid email or password")

@app.post("/logout")
async def logout(current_user: dict = Depends(get_current_user)):
    return {"success": True, "message": "Logged out successfully"}

@app.get("/me")
async def me(current_user: dict = Depends(get_current_user)):
    return {
        "id": current_user["id"],
        "name": current_user["name"],
        "role": current_user["role"],
        "hospital": current_user["hospital"]
    }

# --- Main Endpoints ---

@app.post("/analyze")
async def analyze(request: AnalyzeRequest):
    api_key = os.getenv("ANTHROPIC_API_KEY")

    if not api_key or api_key == "paste_your_key_here":
        return MOCK_REPORT

    try:
        client = anthropic.Anthropic(api_key=api_key)
        message = client.messages.create(
            model="claude-opus-4-6",
            max_tokens=1024,
            system=SYSTEM_PROMPT,
            messages=[
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "image",
                            "source": {
                                "type": "base64",
                                "media_type": "image/jpeg",
                                "data": request.image,
                            },
                        },
                        {
                            "type": "text",
                            "text": f"Analyze this medical image. Patient info: {request.metadata.age} year old {request.metadata.sex}, modality: {request.metadata.modality}. Clinical notes: {request.metadata.clinicalNotes}"
                        }
                    ],
                }
            ],
        )
        import json
        report = json.loads(message.content[0].text)
        return report
    except Exception as e:
        return MOCK_REPORT

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
    return {"error": "Study not found"}

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