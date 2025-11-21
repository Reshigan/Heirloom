from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime
from enum import Enum

class PackageTier(str, Enum):
    free = "free"
    premium = "premium"
    family = "family"

class UserRegister(BaseModel):
    email: EmailStr
    password: str
    name: str
    family_name: Optional[str] = None
    package: Optional[PackageTier] = PackageTier.free

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    family_id: Optional[str] = None
    family_name: Optional[str] = None
    package: str = "free"
    created_at: datetime

class MemoryType(str, Enum):
    photo = "photo"
    video = "video"
    document = "document"
    audio = "audio"
    story = "story"

class Significance(str, Enum):
    low = "low"
    medium = "medium"
    high = "high"
    milestone = "milestone"

class MemoryCreate(BaseModel):
    title: str
    description: str
    date: str
    location: str
    type: MemoryType
    significance: Significance
    participants: List[str] = []
    tags: List[str] = []
    is_vault: bool = False

class MemoryResponse(BaseModel):
    id: str
    title: str
    description: str
    date: str
    location: str
    type: str
    significance: str
    participants: List[str]
    tags: List[str]
    thumbnail: Optional[str] = None
    ai_enhanced: bool = False
    is_vault: bool = False
    family_id: str
    created_by: str
    created_at: datetime
    sentiment_score: Optional[float] = None
    sentiment_label: Optional[str] = None

class CommentCreate(BaseModel):
    content: str
    reply_to: Optional[str] = None

class CommentResponse(BaseModel):
    id: str
    memory_id: str
    user_id: str
    user_name: str
    user_avatar: str
    content: str
    timestamp: datetime
    reactions: List[dict] = []
    replies: List[dict] = []

class ReactionCreate(BaseModel):
    type: str

class StoryCreate(BaseModel):
    title: str
    transcript: str
    location: str
    duration: int
    prompt: str
    participants: List[str] = []

class StoryResponse(BaseModel):
    id: str
    title: str
    transcript: str
    date: str
    location: str
    duration: int
    prompt: str
    participants: List[str]
    family_id: str
    created_by: str
    created_at: datetime

class HighlightCreate(BaseModel):
    title: str
    type: str
    memory_ids: List[str]
    unlock_date: Optional[str] = None

class HighlightResponse(BaseModel):
    id: str
    title: str
    type: str
    memory_ids: List[str]
    unlock_date: Optional[str] = None
    views: int
    shares: int
    family_id: str
    created_at: datetime

class TimeCapsuleCreate(BaseModel):
    title: str
    message: str
    memory_ids: List[str]
    unlock_date: str
    recipients: List[str] = []

class TimeCapsuleResponse(BaseModel):
    id: str
    title: str
    message: str
    memory_ids: List[str]
    unlock_date: str
    is_locked: bool
    recipients: List[str]
    family_id: str
    created_by: str
    created_at: datetime

class ImportStartRequest(BaseModel):
    source: str
    settings: dict

class ImportStartResponse(BaseModel):
    import_id: str
    status: str

class ImportStatusResponse(BaseModel):
    import_id: str
    total: int
    processed: int
    duplicates: int
    imported: int
    status: str

class DigestResponse(BaseModel):
    items: List[dict]
    stats: dict
    period: str

class NotificationSettingsResponse(BaseModel):
    weekly_digest: bool
    daily_reminders: bool
    new_comments: bool
    new_memories: bool
    birthdays: bool
    anniversaries: bool
    story_prompts: bool
    family_activity: bool
    email_notifications: bool
    push_notifications: bool

class NotificationSettingsUpdate(BaseModel):
    weekly_digest: Optional[bool] = None
    daily_reminders: Optional[bool] = None
    new_comments: Optional[bool] = None
    new_memories: Optional[bool] = None
    birthdays: Optional[bool] = None
    anniversaries: Optional[bool] = None
    story_prompts: Optional[bool] = None
    family_activity: Optional[bool] = None
    email_notifications: Optional[bool] = None
    push_notifications: Optional[bool] = None

class SearchRequest(BaseModel):
    query: Optional[str] = ""
    people: List[str] = []
    locations: List[str] = []
    date_start: Optional[str] = None
    date_end: Optional[str] = None
    types: List[str] = []
    tags: List[str] = []
    group_by: Optional[str] = None

class SubscriptionResponse(BaseModel):
    plan: str
    status: str
    cancel_at: Optional[datetime] = None
    current_period_end: Optional[datetime] = None

class UserProfileResponse(BaseModel):
    user: UserResponse
    subscription: SubscriptionResponse
    notification_settings: NotificationSettingsResponse
