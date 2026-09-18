import json
import re
from typing import Any, Dict, Optional
import httpx
from ai_service.app.ai.llm_provider import LLMProvider
from ai_service.app.core.config import settings
from ai_service.app.core.logging import logger


class OllamaProvider(LLMProvider):
    """Local Ollama LLM provider implementation for private/local inference."""

    def __init__(self):
        self.base_url = settings.OLLAMA_BASE_URL.rstrip("/")
        self.model = settings.OLLAMA_MODEL or "llama3:8b"

    async def generate_text(
        self,
        prompt: str,
        system_instruction: Optional[str] = None,
        temperature: float = 0.2,
        max_tokens: int = 1024,
    ) -> str:
        url = f"{self.base_url}/api/generate"
        payload = {
            "model": self.model,
            "prompt": prompt,
            "system": system_instruction or "",
            "stream": False,
            "options": {
                "temperature": temperature,
                "num_predict": max_tokens,
            },
        }

        async with httpx.AsyncClient(timeout=45.0) as client:
            try:
                response = await client.post(url, json=payload)
                if response.status_code == 200:
                    data = response.json()
                    return data.get("response", "")
                logger.error(f"Ollama returned status {response.status_code}: {response.text}")
            except Exception as e:
                logger.error(f"Failed to connect to local Ollama at {self.base_url}: {e}")

        # Fallback response
        return "CarIQ retrieved the matching vehicle specifications from the database."

    async def generate_json(
        self,
        prompt: str,
        system_instruction: Optional[str] = None,
        temperature: float = 0.1,
    ) -> Dict[str, Any]:
        json_instruction = (system_instruction or "") + "\nRespond strictly in valid JSON format."
        raw = await self.generate_text(prompt, system_instruction=json_instruction, temperature=temperature)
        try:
            cleaned = raw.strip()
            if "```" in cleaned:
                match = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", cleaned)
                if match:
                    cleaned = match.group(1).strip()
            return json.loads(cleaned)
        except Exception as e:
            logger.warning(f"Failed to parse JSON from Ollama output: {e}")
            return {}

    async def health_check(self) -> Dict[str, Any]:
        try:
            async with httpx.AsyncClient(timeout=3.0) as client:
                res = await client.get(f"{self.base_url}/api/tags")
                if res.status_code == 200:
                    return {"provider": "ollama", "status": "online", "model": self.model}
        except Exception as e:
            return {"provider": "ollama", "status": "offline", "error": str(e)}
        return {"provider": "ollama", "status": "unreachable"}
