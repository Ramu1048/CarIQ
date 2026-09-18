import time
import uuid
from typing import Dict, List, Optional
from ai_service.app.schemas.chat import ChatMessage
from ai_service.app.schemas.preference import UserPreferences


class ConversationSession:
    """Maintains multi-turn conversation messages and active dynamic preferences."""

    def __init__(self, conversation_id: str, user_id: Optional[str] = None):
        self.conversation_id = conversation_id
        self.user_id = user_id
        self.messages: List[ChatMessage] = []
        self.active_preferences = UserPreferences()
        self.created_at = time.time()
        self.updated_at = time.time()

    def add_message(self, role: str, content: str) -> None:
        self.messages.append(ChatMessage(role=role, content=content, timestamp=str(int(time.time()))))
        self.updated_at = time.time()

    def merge_preferences(self, new_pref: UserPreferences) -> None:
        """Merges extracted criteria from new turns without overwriting already established preferences unless explicitly modified."""
        if new_pref.budget_max is not None:
            self.active_preferences.budget_max = new_pref.budget_max
        if new_pref.budget_min is not None:
            self.active_preferences.budget_min = new_pref.budget_min
        if new_pref.brand is not None:
            self.active_preferences.brand = new_pref.brand
        if new_pref.body_type is not None:
            self.active_preferences.body_type = new_pref.body_type
        if new_pref.fuel_type is not None:
            self.active_preferences.fuel_type = new_pref.fuel_type
        if new_pref.transmission is not None:
            self.active_preferences.transmission = new_pref.transmission
        if new_pref.seating_capacity is not None and new_pref.seating_capacity != 5:
            self.active_preferences.seating_capacity = new_pref.seating_capacity
        if new_pref.usage != "mixed":
            self.active_preferences.usage = new_pref.usage
        if new_pref.purpose is not None:
            self.active_preferences.purpose = new_pref.purpose
        if new_pref.priorities:
            # Union of priorities
            combined = set(self.active_preferences.priorities) | set(new_pref.priorities)
            self.active_preferences.priorities = list(combined)

        self.updated_at = time.time()

    def get_history_dict(self) -> List[Dict[str, str]]:
        return [{"role": m.role, "content": m.content} for m in self.messages]


class ConversationMemoryManager:
    """In-memory session manager with automatic conversation ID assignment."""

    def __init__(self):
        self._sessions: Dict[str, ConversationSession] = {}

    def get_or_create(self, conversation_id: Optional[str] = None, user_id: Optional[str] = None) -> ConversationSession:
        if not conversation_id or conversation_id not in self._sessions:
            cid = conversation_id or str(uuid.uuid4())
            session = ConversationSession(conversation_id=cid, user_id=user_id)
            self._sessions[cid] = session
            return session
        return self._sessions[conversation_id]

    def get(self, conversation_id: str) -> Optional[ConversationSession]:
        return self._sessions.get(conversation_id)

    def clear(self, conversation_id: str) -> bool:
        if conversation_id in self._sessions:
            del self._sessions[conversation_id]
            return True
        return False


conversation_memory = ConversationMemoryManager()
