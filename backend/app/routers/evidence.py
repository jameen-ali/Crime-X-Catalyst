from fastapi import APIRouter, Query, UploadFile, File, Form
from typing import Optional
from app.data.mock_data import MOCK_EVIDENCE
import time

router = APIRouter()


@router.get("")
async def get_evidence(firId: Optional[str] = None):
    if firId:
        return [e for e in MOCK_EVIDENCE if e["firId"] == firId]
    return MOCK_EVIDENCE


@router.post("/upload")
async def upload_evidence(
    file: UploadFile = File(...),
    firId: str = Form(...),
    uploadedBy: str = Form(...),
):
    return {
        "id": f"ev-{int(time.time())}",
        "firId": firId,
        "type": "Document",
        "fileName": file.filename,
        "fileSize": 0,
        "mimeType": file.content_type,
        "uploadedBy": uploadedBy,
        "uploadedAt": __import__("datetime").datetime.utcnow().isoformat() + "Z",
        "description": f"Uploaded file for FIR {firId}",
        "tags": ["uploaded"],
    }
