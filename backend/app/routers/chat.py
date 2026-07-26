from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional, List
import time
import random
from app.data.mock_data import MOCK_CHAT_RESPONSES, AI_SUGGESTED_QUESTIONS

router = APIRouter()

class ChatMessagePayload(BaseModel):
    content: str

class Source(BaseModel):
    title: str
    confidence: float
    type: str

class ChatMessage(BaseModel):
    id: str
    role: str
    content: str
    timestamp: str
    sources: Optional[List[Source]] = None

_chat_history = []

@router.get("/suggested")
async def get_suggested():
    return AI_SUGGESTED_QUESTIONS

@router.get("/history")
async def get_history():
    return _chat_history

@router.post("/message")
async def send_message(payload: ChatMessagePayload):
    # Simulate thinking delay
    time.sleep(1.0)
    response = random.choice(MOCK_CHAT_RESPONSES)
    msg = {
        "id": f"msg-{int(time.time() * 1000)}",
        "role": "assistant",
        "content": response["content"],
        "timestamp": __import__("datetime").datetime.utcnow().isoformat() + "Z",
        "sources": response.get("sources", [])
    }
    _chat_history.append(msg)
    return msg

@router.post("/clear")
async def clear_history():
    global _chat_history
    _chat_history = []
    return {"success": True}
