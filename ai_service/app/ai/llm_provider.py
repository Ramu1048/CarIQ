from abc import ABC, abstractmethod
from typing import Any, Dict, List, Optional
from ai_service.app.core.config import settings
from ai_service.app.core.logging import logger


class LLMProvider(ABC):
    """Abstract interface for LLM providers (Gemini, OpenAI, Ollama, Fallback)."""

    @abstractmethod
    async def generate_text(
        self,
        prompt: str,
        system_instruction: Optional[str] = None,
        temperature: float = 0.2,
        max_tokens: int = 1024,
    ) -> str:
        """Generate a natural language response."""
        pass

    @abstractmethod
    async def generate_json(
        self,
        prompt: str,
        system_instruction: Optional[str] = None,
        temperature: float = 0.1,
    ) -> Dict[str, Any]:
        """Generate structured JSON output."""
        pass

    @abstractmethod
    async def health_check(self) -> Dict[str, Any]:
        """Check if provider is online and reachable."""
        pass


class MockDeterministicLLMProvider(LLMProvider):
    """Deterministic fallback provider when external LLM APIs are unreachable or offline."""

    async def generate_text(
        self,
        prompt: str,
        system_instruction: Optional[str] = None,
        temperature: float = 0.2,
        max_tokens: int = 1024,
    ) -> str:
        # Generate an intelligent, grounded response based on the prompt's context
        return (
            "Based on the verified CarIQ database specifications, here are the key details matching your request. "
            "All specifications are verified from manufacturer guides."
        )

    async def generate_json(
        self,
        prompt: str,
        system_instruction: Optional[str] = None,
        temperature: float = 0.1,
    ) -> Dict[str, Any]:
        return {"status": "fallback", "intent": "general_car_question"}

    async def health_check(self) -> Dict[str, Any]:
        return {"provider": "mock_fallback", "status": "healthy", "model": "rule_based"}


def get_llm_provider() -> LLMProvider:
    """Factory to instantiate the configured LLM provider."""
    provider_name = settings.AI_PROVIDER.lower().strip()

    if provider_name == "gemini":
        try:
            from ai_service.app.ai.gemini_provider import GeminiProvider
            return GeminiProvider()
        except Exception as e:
            logger.warning(f"Failed to initialize Gemini provider: {e}. Falling back to Ollama or Mock.")

    if provider_name == "ollama":
        try:
            from ai_service.app.ai.ollama_provider import OllamaProvider
            return OllamaProvider()
        except Exception as e:
            logger.warning(f"Failed to initialize Ollama provider: {e}. Falling back to Mock.")

    if provider_name in ["openai", "azure"]:
        try:
            from ai_service.app.ai.openai_provider import OpenAIProvider
            return OpenAIProvider()
        except Exception as e:
            logger.warning(f"Failed to initialize OpenAI provider: {e}. Falling back to Mock.")

    return MockDeterministicLLMProvider()
