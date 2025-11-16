from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime
from enum import Enum

class UserRegister(BaseModel):
    email: EmailStr
    password: str
    name: str
    family_name: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    family_id: Optional[str] = None
    family_name: Optional[str] = None
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
