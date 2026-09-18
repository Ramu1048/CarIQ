import json
import logging
import sys
import time
from typing import Any, Dict, Optional


class JSONFormatter(logging.Formatter):
    """Structured JSON formatter for production AI logging."""

    def format(self, record: logging.LogRecord) -> str:
        log_obj: Dict[str, Any] = {
            "timestamp": self.formatTime(record, self.datefmt),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
        }

        # Include custom attributes if present
        for key in ["request_id", "intent", "provider", "latency_ms", "tokens", "confidence"]:
            if hasattr(record, key):
                log_obj[key] = getattr(record, key)

        if record.exc_info:
            log_obj["exception"] = self.formatException(record.exc_info)

        return json.dumps(log_obj)


def setup_logger(name: str = "cariq_ai") -> logging.Logger:
    logger = logging.getLogger(name)
    if not logger.handlers:
        handler = logging.StreamHandler(sys.stdout)
        handler.setFormatter(JSONFormatter())
        logger.addHandler(handler)
        logger.setLevel(logging.INFO)
    return logger


logger = setup_logger()


class LogContext:
    """Helper to measure latency and record structured logs."""

    def __init__(self, action: str, request_id: Optional[str] = None):
        self.action = action
        self.request_id = request_id
        self.start_time = 0.0

    def __enter__(self):
        self.start_time = time.time()
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        latency_ms = round((time.time() - self.start_time) * 1000, 2)
        if exc_type:
            logger.error(
                f"{self.action} failed: {exc_val}",
                extra={"request_id": self.request_id, "latency_ms": latency_ms},
            )
        else:
            logger.info(
                f"{self.action} completed",
                extra={"request_id": self.request_id, "latency_ms": latency_ms},
            )
