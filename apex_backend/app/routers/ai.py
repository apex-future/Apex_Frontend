"""
Apex AI Router — All AI-powered endpoints using Google Gemini.
Uses the google-genai SDK with gemini-2.5-flash model.
"""

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional
from google import genai
from google.genai import types
import json
import logging
import os
from dotenv import load_dotenv

load_dotenv()

# ==============================
# INITIALIZE GEMINI CLIENT
# ==============================
# Get API key explicitly to avoid initialization race conditions
api_key = os.getenv("GEMINI_API_KEY")
client = genai.Client(api_key=api_key)

MODEL = "gemini-3-flash-preview"

# Simple request counter for rate-limit awareness
_request_count = 0

router = APIRouter(prefix="/api/ai", tags=["AI"])


# ==============================
# REQUEST SCHEMAS
# ==============================

class ConversationMessage(BaseModel):
    role: str  # "user" or "model"
    content: str


class ExplainRequest(BaseModel):
    selected_text: str
    context: Optional[str] = None
    book_title: Optional[str] = None
    conversation_history: Optional[list[ConversationMessage]] = []


class AskRequest(BaseModel):
    message: str
    book_title: Optional[str] = None
    conversation_history: Optional[list[ConversationMessage]] = []


class SummarizeRequest(BaseModel):
    highlights: list[str]
    book_title: Optional[str] = None


# ==============================
# STREAMING HELPERS
# ==============================

def _build_contents(history: list[ConversationMessage]) -> list[types.Content]:
    """Convert conversation history to Gemini Content objects."""
    contents = []
    for msg in history:
        contents.append(
            types.Content(
                role=msg.role,
                parts=[types.Part.from_text(text=msg.content)]
            )
        )
    return contents


# ==============================
# 1. POST /api/ai/explain  (STREAMING)
# ==============================

@router.post("/explain")
async def explain_text(request: ExplainRequest):
    """Stream an AI explanation of highlighted text."""
    global _request_count
    _request_count += 1
    logging.info(f"AI /explain request #{_request_count}")

    def stream_explanation():
        print("DEBUG: [VERSION 2.0] /explain endpoint triggered")
        try:
            book_title = request.book_title or "their book"
            system_prompt = (
                f"You are Apex AI, a friendly and knowledgeable tutor helping students "
                f"understand their reading material. The student is reading '{book_title}' "
                f"and has highlighted the following text: '{request.selected_text}'. "
                f"Explain this clearly and concisely in a way a student would understand. "
                f"Use simple language, examples where helpful, and markdown formatting "
                f"for clarity (bold key terms, use bullet points for lists). "
                f"Avoid LaTeX math delimiters like $ or $$. Use plain text or Unicode "
                f"subscripts for chemical formulas (e.g., H₂O instead of $H_2O$). "
                f"Keep explanations focused and under 300 words unless the topic requires more."
            )

            # Build contents from conversation history
            contents = _build_contents(request.conversation_history or [])

            # Add current user message
            user_message = f"Please explain this: {request.selected_text}"
            if request.context:
                user_message += f"\n\nSurrounding context: {request.context}"

            contents.append(
                types.Content(
                    role="user",
                    parts=[types.Part.from_text(text=user_message)]
                )
            )

            for chunk in client.models.generate_content_stream(
                model=MODEL,
                contents=contents,
                config=types.GenerateContentConfig(
                    system_instruction=system_prompt,
                    max_output_tokens=600,
                    temperature=0.7,
                )
            ):
                if chunk.text:
                    yield f"data: {json.dumps({'chunk': chunk.text})}\n\n"

            yield f"data: {json.dumps({'done': True})}\n\n"

        except Exception as e:
            logging.error(f"Streaming error in /explain: {e}")
            yield f"data: {json.dumps({'error': str(e)})}\n\n"

    return StreamingResponse(
        stream_explanation(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        }
    )


# ==============================
# 2. POST /api/ai/ask  (STREAMING)
# ==============================

@router.post("/ask")
async def ask_ai(request: AskRequest):
    """Stream an AI response to an open-ended study question."""
    global _request_count
    _request_count += 1
    logging.info(f"AI /ask request #{_request_count}")

    def stream_response():
        print("DEBUG: [VERSION 2.0] /ask endpoint triggered")
        try:
            book_context = ""
            if request.book_title:
                book_context = f" The student is currently reading '{request.book_title}'."

            system_prompt = (
                f"You are Apex AI, a 24/7 study companion for students. Be encouraging, "
                f"clear, and educational. Use markdown formatting.{book_context} "
                f"IMPORTANT: Use plain text for mathematical and chemical equations. "
                f"Do NOT use LaTeX delimiters like $ or $$. Use Unicode subscripts "
                f"where possible (e.g., C₆H₁₂O₆). If the student seems to be studying "
                f"for JAMB or WAEC exams, tailor examples to Nigerian curricula where relevant."
            )

            # Build contents from conversation history
            contents = _build_contents(request.conversation_history or [])

            # Add the new user message
            contents.append(
                types.Content(
                    role="user",
                    parts=[types.Part.from_text(text=request.message)]
                )
            )

            for chunk in client.models.generate_content_stream(
                model=MODEL,
                contents=contents,
                config=types.GenerateContentConfig(
                    system_instruction=system_prompt,
                    max_output_tokens=800,
                    temperature=0.7,
                )
            ):
                if chunk.text:
                    yield f"data: {json.dumps({'chunk': chunk.text})}\n\n"

            yield f"data: {json.dumps({'done': True})}\n\n"

        except Exception as e:
            logging.error(f"Streaming error in /ask: {e}")
            yield f"data: {json.dumps({'error': str(e)})}\n\n"

    return StreamingResponse(
        stream_response(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        }
    )


# ==============================
# 3. POST /api/ai/summarize  (NON-STREAMING)
# ==============================

@router.post("/summarize")
async def summarize_highlights(request: SummarizeRequest):
    """Summarize highlights into a structured study summary."""
    global _request_count
    _request_count += 1
    logging.info(f"AI /summarize request #{_request_count}")

    try:
        book_title = request.book_title or "the book"
        highlights_text = "\n".join(
            f"- {h}" for h in request.highlights
        )

        system_prompt = (
            f"Given these highlights from '{book_title}', create: "
            f"1. A concise study summary (2-3 paragraphs) "
            f"2. A list of 5 key concepts to remember "
            f"3. Three review questions to test understanding "
            f"Format your response as valid JSON with keys: summary, key_concepts, "
            f"review_questions. Return ONLY the JSON object, no markdown fences."
        )

        contents = [
            types.Content(
                role="user",
                parts=[types.Part.from_text(
                    text=f"Here are my highlights:\n{highlights_text}"
                )]
            )
        ]

        response = await client.aio.models.generate_content(
            model=MODEL,
            contents=contents,
            config=types.GenerateContentConfig(
                system_instruction=system_prompt,
                max_output_tokens=1000,
                temperature=0.5,
            )
        )

        # Try to parse the JSON response
        response_text = response.text.strip()

        # Strip markdown code fences if present
        if response_text.startswith("```"):
            lines = response_text.split("\n")
            # Remove first and last lines (the fences)
            lines = lines[1:-1] if lines[-1].strip() == "```" else lines[1:]
            response_text = "\n".join(lines).strip()

        try:
            result = json.loads(response_text)
        except json.JSONDecodeError:
            # If JSON parsing fails, return the raw text in a structured format
            result = {
                "summary": response_text,
                "key_concepts": [],
                "review_questions": []
            }

        return result

    except Exception as e:
        logging.error(f"Error in /summarize: {e}")
        raise HTTPException(status_code=500, detail=str(e))
