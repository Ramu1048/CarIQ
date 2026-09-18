"""
CarIQ Backend — AI Service (Provider Abstraction)
Supports Gemini, OpenAI-compatible, and Mock providers.
Configurable via AI_PROVIDER env var.
"""
from __future__ import annotations
import logging
from abc import ABC, abstractmethod
from typing import Any, Dict, List, Optional

from app.core.config import settings

logger = logging.getLogger(__name__)


# ── Base Provider ─────────────────────────────────────────────────────────────
class BaseAIProvider(ABC):
    """Abstract base for all AI providers."""

    @abstractmethod
    async def generate(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        history: Optional[List[Dict[str, str]]] = None,
        max_tokens: int = 1024,
    ) -> str:
        ...

    @property
    @abstractmethod
    def provider_name(self) -> str:
        ...


# ── Mock Provider ─────────────────────────────────────────────────────────────
class MockAIProvider(BaseAIProvider):
    """Database-driven mock — never invents data."""

    @property
    def provider_name(self) -> str:
        return "mock"

    async def generate(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        history: Optional[List[Dict[str, str]]] = None,
        max_tokens: int = 1024,
    ) -> str:
        logger.info("[MockAI] generate() called — returning template response")
        return (
            "Based on the vehicle data in our database, here is a structured analysis. "
            "Note: AI explanations are generated from verified database records only. "
            "No data has been fabricated."
        )


# ── Gemini Provider ────────────────────────────────────────────────────────────
class GeminiAIProvider(BaseAIProvider):
    """Google Gemini provider via google-generativeai SDK."""

    def __init__(self) -> None:
        try:
            import google.generativeai as genai
            genai.configure(api_key=settings.GEMINI_API_KEY)
            self._genai = genai
            self._model = genai.GenerativeModel(settings.GEMINI_MODEL)
        except Exception as e:
            logger.error(f"Failed to initialise Gemini: {e}")
            raise

    @property
    def provider_name(self) -> str:
        return "gemini"

    async def generate(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        history: Optional[List[Dict[str, str]]] = None,
        max_tokens: int = 1024,
    ) -> str:
        try:
            full_prompt = ""
            if system_prompt:
                full_prompt += f"System: {system_prompt}\n\n"
            if history:
                for msg in history:
                    full_prompt += f"{msg['role'].capitalize()}: {msg['content']}\n"
            full_prompt += f"User: {prompt}"

            response = self._model.generate_content(
                full_prompt,
                generation_config=self._genai.types.GenerationConfig(
                    max_output_tokens=max_tokens,
                    temperature=0.3,
                ),
            )
            return response.text
        except Exception as e:
            logger.error(f"Gemini API error: {e}")
            raise


# ── OpenAI Provider ────────────────────────────────────────────────────────────
class OpenAIProvider(BaseAIProvider):
    """OpenAI (or compatible) provider via openai SDK."""

    def __init__(self) -> None:
        try:
            from openai import AsyncOpenAI
            self._client = AsyncOpenAI(
                api_key=settings.OPENAI_API_KEY,
                base_url=settings.OPENAI_BASE_URL,
            )
            self._model = settings.OPENAI_MODEL
        except Exception as e:
            logger.error(f"Failed to initialise OpenAI: {e}")
            raise

    @property
    def provider_name(self) -> str:
        return "openai"

    async def generate(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        history: Optional[List[Dict[str, str]]] = None,
        max_tokens: int = 1024,
    ) -> str:
        messages: List[Dict[str, str]] = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        if history:
            messages.extend(history)
        messages.append({"role": "user", "content": prompt})

        try:
            response = await self._client.chat.completions.create(
                model=self._model,
                messages=messages,
                max_tokens=max_tokens,
                temperature=0.3,
            )
            return response.choices[0].message.content or ""
        except Exception as e:
            logger.error(f"OpenAI API error: {e}")
            raise


# ── Factory ────────────────────────────────────────────────────────────────────
_provider_instance: Optional[BaseAIProvider] = None


def get_ai_provider() -> BaseAIProvider:
    """Return the configured AI provider singleton."""
    global _provider_instance
    if _provider_instance is not None:
        return _provider_instance

    provider_name = settings.AI_PROVIDER.lower()

    try:
        if provider_name == "gemini" and settings.GEMINI_API_KEY:
            _provider_instance = GeminiAIProvider()
        elif provider_name == "openai" and settings.OPENAI_API_KEY:
            _provider_instance = OpenAIProvider()
        else:
            logger.warning(f"AI provider '{provider_name}' not configured or key missing — using Mock")
            _provider_instance = MockAIProvider()
    except Exception as e:
        logger.error(f"Failed to create AI provider '{provider_name}': {e} — falling back to Mock")
        _provider_instance = MockAIProvider()

    return _provider_instance


# ── System Prompts ─────────────────────────────────────────────────────────────
RECOMMENDATION_SYSTEM_PROMPT = """You are CarIQ, an expert automotive consultant for the Indian car market.
You receive structured vehicle data from a verified database and user requirements.
Your job is to:
1. Explain WHY each vehicle matches the user's requirements
2. List key advantages and limitations based on the provided data ONLY
3. Never invent specifications, prices, or features not in the provided data
4. Be concise, factual, and helpful
5. Use Indian context (INR prices, Indian road conditions, fuel types popular in India)
If data is missing, explicitly say "data not available" rather than guessing."""

CHAT_SYSTEM_PROMPT = """You are CarIQ Assistant, an expert car-buying advisor for the Indian market.
You help customers:
- Find the right car for their budget and needs
- Understand EMI and financing
- Compare vehicles
- Understand car features and terminology
- Evaluate new vs used car decisions
- Understand EVs, hybrids, and alternate fuel vehicles

Rules:
- Only use data provided in the context
- Never fabricate prices, specifications, or availability
- If you don't know something, say so clearly
- Be conversational but precise
- Use INR for prices"""
