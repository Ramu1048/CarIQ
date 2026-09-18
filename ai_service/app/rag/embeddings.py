import math
import re
from abc import ABC, abstractmethod
from typing import List
from ai_service.app.core.config import settings
from ai_service.app.core.logging import logger


class EmbeddingProvider(ABC):
    """Abstract base class for vector embedding generators."""

    @abstractmethod
    def embed_text(self, text: str) -> List[float]:
        """Generate embedding vector for a single text."""
        pass

    @abstractmethod
    def embed_batch(self, texts: List[str]) -> List[List[float]]:
        """Generate embeddings for a list of texts."""
        pass


class TFIDFFastEmbeddingProvider(EmbeddingProvider):
    """
    Lightweight, deterministic, zero-dependency subword/token frequency embedding provider.
    Ideal for local development, fast testing, and serverless environments.
    """

    def __init__(self, vector_dim: int = 128):
        self.vector_dim = vector_dim

    def _tokenize(self, text: str) -> List[str]:
        cleaned = text.lower()
        # Words and numbers (e.g. 15, lakh, nexon, suv, automatic)
        tokens = re.findall(r"\b[a-z0-9_]{2,}\b", cleaned)
        return tokens

    def embed_text(self, text: str) -> List[float]:
        tokens = self._tokenize(text)
        if not tokens:
            return [0.0] * self.vector_dim

        vector = [0.0] * self.vector_dim
        for token in tokens:
            idx = hash(token) % self.vector_dim
            # Simple TF weighting
            vector[idx] += 1.0

        # L2 normalize
        norm = math.sqrt(sum(v * v for v in vector))
        if norm > 0:
            vector = [round(v / norm, 5) for v in vector]
        return vector

    def embed_batch(self, texts: List[str]) -> List[List[float]]:
        return [self.embed_text(t) for t in texts]


class SentenceTransformersProvider(EmbeddingProvider):
    """HuggingFace Sentence Transformers wrapper if library is installed."""

    def __init__(self, model_name: str = "all-MiniLM-L6-v2"):
        try:
            from sentence_transformers import SentenceTransformer
            self.model = SentenceTransformer(model_name)
            logger.info(f"Loaded SentenceTransformer model: {model_name}")
        except Exception as e:
            logger.warning(f"sentence_transformers not available ({e}), falling back to TFIDFFastEmbeddingProvider")
            self.model = None
            self.fallback = TFIDFFastEmbeddingProvider()

    def embed_text(self, text: str) -> List[float]:
        if self.model:
            emb = self.model.encode(text, normalize_embeddings=True)
            return emb.tolist()
        return self.fallback.embed_text(text)

    def embed_batch(self, texts: List[str]) -> List[List[float]]:
        if self.model:
            embs = self.model.encode(texts, normalize_embeddings=True)
            return [e.tolist() for e in embs]
        return self.fallback.embed_batch(texts)


def get_embedding_provider() -> EmbeddingProvider:
    """Factory to get the embedding provider based on config."""
    if settings.EMBEDDING_PROVIDER == "sentence_transformers":
        return SentenceTransformersProvider(settings.EMBEDDING_MODEL)
    return TFIDFFastEmbeddingProvider()


embedding_engine = get_embedding_provider()
