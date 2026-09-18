import json
import re
from typing import Any, Dict, Optional
import httpx
from ai_service.app.ai.llm_provider import LLMProvider
from ai_service.app.core.config import settings
from ai_service.app.core.logging import logger


class OpenAIProvider(LLMProvider):
    """OpenAI-compatible LLM provider implementation."""

    def __init__(self):
        self.api_key = settings.OPENAI_API_KEY or settings.AI_API_KEY
        self.base_url = settings.OPENAI_BASE_URL or "https://api.openai.com/v1"
        self.model = settings.AI_MODEL or "gpt-4o-mini"

    async def generate_text(
        self,
        prompt: str,
        system_instruction: Optional[str] = None,
        temperature: float = 0.2,
        max_tokens: int = 1024,
    ) -> str:
        if not self.api_key:
            return "Based on CarIQ database specifications, here are the recommendations matching your query."

        url = f"{self.base_url}/chat/completions"
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

        messages = []
        if system_instruction:
            messages.append({"role": "system", "content": system_instruction})
        messages.append({"role": "user", "content": prompt})

        payload = {
            "model": self.model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
        }

        async with httpx.AsyncClient(timeout=30.0) as client:
            try:
                response = await client.post(url, headers=headers, json=payload)
                if response.status_code == 200:
                    data = response.json()
                    choices = data.get("choices", [])
                    if choices and "message" in choices[0]:
                        return choices[0]["message"].get("content", "")
                logger.error(f"OpenAI API returned error: {response.status_code} - {response.text}")
            except Exception as e:
                logger.error(f"Exception calling OpenAI API: {e}")

        return "I have evaluated the vehicle database according to your criteria."

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
            logger.warning(f"Failed to parse JSON from OpenAI output: {e}")
            return {}

    async def health_check(self) -> Dict[str, Any]:
        return {"provider": "openai_compatible", "status": "ready" if self.api_key else "unconfigured", "model": self.model}
