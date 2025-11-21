"""
Package tier entitlements and enforcement.
Defines what each package tier can access and enforces limits.
"""
from typing import Dict, Any
from enum import Enum

class PackageTier(str, Enum):
    FREE = "free"
    PREMIUM = "premium"
    FAMILY = "family"

ENTITLEMENTS: Dict[str, Dict[str, Any]] = {
    "free": {
        "max_storage_mb": 100,
        "max_media_per_month": 10,
        "max_members": 2,
        "time_capsules_enabled": False,
        "ai_sentiment_enabled": False,
        "export_enabled": False,
        "highlights_enabled": False,
        "stories_enabled": False,
    },
    "premium": {
        "max_storage_mb": 5000,
        "max_media_per_month": 100,
        "max_members": 5,
        "time_capsules_enabled": True,
        "ai_sentiment_enabled": True,
        "export_enabled": True,
        "highlights_enabled": True,
        "stories_enabled": True,
    },
    "family": {
        "max_storage_mb": 50000,
        "max_media_per_month": 1000,
        "max_members": 50,
        "time_capsules_enabled": True,
        "ai_sentiment_enabled": True,
        "export_enabled": True,
        "highlights_enabled": True,
        "stories_enabled": True,
    }
}

def get_entitlements(package: str) -> Dict[str, Any]:
    """Get entitlements for a package tier"""
    return ENTITLEMENTS.get(package.lower(), ENTITLEMENTS["free"])

def check_feature_access(package: str, feature: str) -> bool:
    """Check if a package tier has access to a feature"""
    entitlements = get_entitlements(package)
    return entitlements.get(feature, False)

def get_limit(package: str, limit_name: str) -> Any:
    """Get a specific limit for a package tier"""
    entitlements = get_entitlements(package)
    return entitlements.get(limit_name, 0)

class EntitlementError(Exception):
    """Raised when a user tries to access a feature they don't have access to"""
    def __init__(self, message: str, feature: str, required_tier: str):
        self.message = message
        self.feature = feature
        self.required_tier = required_tier
        super().__init__(self.message)
