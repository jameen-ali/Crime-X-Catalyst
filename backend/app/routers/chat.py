"""
backend/app/routers/chat.py
Real AI chat: Mistral called server-side, chat_messages persisted in Supabase.
Mistral API key stays on server — never exposed to browser.
"""
import os
import uuid
import httpx
from fastapi import APIRouter, Request, HTTPException
from pydantic import BaseModel
from typing import Optional, List

router = APIRouter()

MISTRAL_API_URL = "https://api.mistral.ai/v1/chat/completions"
MISTRAL_MODEL   = "open-mistral-7b"


def _db():
    from app.db.supabase_client import get_supabase
    return get_supabase()


def _mistral_key() -> str:
    key = os.getenv("MISTRAL_API_KEY", "")
    if not key:
        raise HTTPException(status_code=503, detail="MISTRAL_API_KEY not configured on server.")
    return key


class SendMessageRequest(BaseModel):
    conversation_id: str
    content: str
    user_id: Optional[str] = None


# ── Proxy raw Mistral call (for prediction engine / case comparison) ──────────

@router.post("/mistral")
async def proxy_mistral(request: Request):
    """Proxy frontend Mistral requests through the backend so the API key is never in the browser."""
    body = await request.json()
    key  = _mistral_key()
    async with httpx.AsyncClient(timeout=60.0) as client:
        resp = await client.post(
            MISTRAL_API_URL,
            headers={"Content-Type": "application/json", "Authorization": f"Bearer {key}"},
            json=body,
        )
    if not resp.is_success:
        raise HTTPException(status_code=resp.status_code, detail=resp.text)
    return resp.json()


# ── AI Chat: send message and get assistant reply ─────────────────────────────

@router.post("/send")
async def send_chat_message(req: SendMessageRequest):
    """
    Persist user message, call Mistral, persist assistant reply.
    Both messages are stored in chat_messages table (Supabase).
    """
    db  = _db()
    key = _mistral_key()

    # Validate / coerce conversation UUID
    try:
        conv_id = str(uuid.UUID(req.conversation_id))
    except ValueError:
        raise HTTPException(status_code=400, detail="conversation_id must be a valid UUID.")

    user_id = None
    if req.user_id:
        try:
            user_id = str(uuid.UUID(req.user_id))
        except ValueError:
            user_id = None

    # 1. Persist user message
    db.table("chat_messages").insert({
        "conversation_id": conv_id,
        "role": "user",
        "content": req.content,
        "user_id": user_id,
    }).execute()

    # 2. Fetch recent conversation history (last 10 messages)
    history_resp = db.table("chat_messages").select("role,content").eq(
        "conversation_id", conv_id
    ).order("created_at", desc=False).limit(10).execute()
    history = history_resp.data or []

    # 3. Fetch relevant case context from Supabase
    q_lower  = req.content.lower()
    db_ctx   = ""
    try:
        # Search cases for relevant context
        cases_resp = db.table("case_master").select(
            "crime_no,case_no,brief_facts,crime_registered_date,"
            "crime_head:crime_major_head_id(crime_group_name),"
            "accused(accused_name,risk_score),"
            "victim(victim_name)"
        ).or_(
            f"brief_facts.ilike.%{req.content[:50]}%,crime_no.ilike.%{req.content}%"
        ).limit(3).execute()

        if cases_resp.data:
            ctx_parts = []
            for c in cases_resp.data:
                ch   = c.get("crime_head") or {}
                crime_type = ch.get("crime_group_name", "Case") if isinstance(ch, dict) else "Case"
                accs = [a.get("accused_name","") for a in (c.get("accused") or [])[:3]]
                vics = [v.get("victim_name","")  for v in (c.get("victim")  or [])[:3]]
                ctx_parts.append(
                    f"Case {c.get('crime_no','')}: {crime_type} on {c.get('crime_registered_date','')}. "
                    f"Accused: {', '.join(accs) or 'Unknown'}. Victims: {', '.join(vics) or 'Unknown'}. "
                    f"Facts: {(c.get('brief_facts') or '')[:200]}"
                )
            db_ctx = "Relevant database records:\n" + "\n---\n".join(ctx_parts)
    except Exception:
        pass  # DB context is best-effort

    # 4. Build Mistral messages
    system_msg = (
        "You are an AI Investigation Assistant for the Karnataka State Police (KSP) Intelligence Platform. "
        "Answer questions about crime cases, suspects, patterns, and investigations based on the provided database context. "
        "Always distinguish between DATABASE FACTS and AI ANALYSIS. "
        "Add 'AI-assisted analytical aid — not a forensic conclusion.' at the end of analytical responses."
    )
    if db_ctx:
        system_msg += f"\n\n{db_ctx}"

    api_messages = [{"role": "system", "content": system_msg}]
    for h in history[:-1]:  # exclude the message we just inserted
        api_messages.append({"role": h["role"], "content": h["content"]})
    api_messages.append({"role": "user", "content": req.content})

    # 5. Call Mistral server-side
    reply_text = ""
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(
                MISTRAL_API_URL,
                headers={"Content-Type": "application/json", "Authorization": f"Bearer {key}"},
                json={"model": MISTRAL_MODEL, "messages": api_messages, "max_tokens": 600, "temperature": 0.3},
            )
        if resp.is_success:
            reply_text = resp.json().get("choices", [{}])[0].get("message", {}).get("content", "")
        else:
            reply_text = f"[Mistral returned {resp.status_code}. Using fallback.] I couldn't process your request at this time."
    except Exception as e:
        reply_text = f"[AI service temporarily unavailable: {e}] Please try again shortly."

    if not reply_text:
        reply_text = "I was unable to generate a response. Please try rephrasing your question."

    # 6. Persist assistant reply
    db.table("chat_messages").insert({
        "conversation_id": conv_id,
        "role": "assistant",
        "content": reply_text,
        "user_id": user_id,
    }).execute()

    return {"reply": reply_text, "conversation_id": conv_id}


# ── Get history ───────────────────────────────────────────────────────────────

@router.get("/history/{conversation_id}")
async def get_history(conversation_id: str):
    try:
        uuid.UUID(conversation_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid conversation_id UUID.")
    db   = _db()
    resp = db.table("chat_messages").select("*").eq(
        "conversation_id", conversation_id
    ).order("created_at", desc=False).execute()
    return resp.data or []


# ── Get conversations ───────────────────────────────────────────────────────────

@router.get("/conversations")
async def get_conversations(user_id: Optional[str] = None):
    db = _db()
    
    query = db.table("chat_messages").select("conversation_id, content, created_at").eq("role", "user")
    if user_id:
        try:
            valid_id = str(uuid.UUID(user_id))
            query = query.eq("user_id", valid_id)
        except ValueError:
            pass
            
    resp = query.order("created_at", desc=False).execute()
    
    # Extract unique conversations with first message as title
    seen = set()
    convs = []
    for m in (resp.data or []):
        cid = m.get("conversation_id")
        if cid and cid not in seen:
            seen.add(cid)
            content = m.get("content", "")
            clean = content.split("||SOURCES||")[0].split("[Uploaded")[0]
            title = clean[:30] + ("..." if len(clean) > 30 else "")
            convs.append({"id": cid, "title": title or "New Investigation"})
            
    # Reverse to show newest first
    return list(reversed(convs))

# ── Clear history ─────────────────────────────────────────────────────────────

@router.delete("/history/{conversation_id}")
async def clear_history(conversation_id: str):
    try:
        uuid.UUID(conversation_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid conversation_id UUID.")
    db = _db()
    db.table("chat_messages").delete().eq("conversation_id", conversation_id).execute()
    return {"success": True}


# ── Suggested questions ───────────────────────────────────────────────────────

@router.get("/suggested")
async def get_suggested():
    return [
        {"text": "Show me the most recent FIRs registered today", "category": "Cases"},
        {"text": "Which districts have the highest crime rates?",  "category": "Analytics"},
        {"text": "List accused persons with high risk scores",     "category": "Intelligence"},
        {"text": "What are the common crime patterns in Bengaluru?","category": "Patterns"},
        {"text": "Summarize open cases under investigation",       "category": "Cases"},
    ]
