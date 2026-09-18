from typing import Dict, Optional
from ai_service.app.schemas.preference import UserPreferences


class UserPreferenceStore:
    """Stores persistent user profile preferences across sessions."""

    def __init__(self):
        self._store: Dict[str, UserPreferences] = {}

    def get_user_preferences(self, user_id: str) -> UserPreferences:
        if user_id not in self._store:
            self._store[user_id] = UserPreferences()
        return self._store[user_id]

    def update_user_preferences(self, user_id: str, new_pref: UserPreferences) -> UserPreferences:
        self._store[user_id] = new_pref
        return self._store[user_id]

    def delete_user_preferences(self, user_id: str) -> bool:
        if user_id in self._store:
            del self._store[user_id]
            return True
        return False


user_preference_store = UserPreferenceStore()
