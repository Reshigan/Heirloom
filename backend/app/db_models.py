from sqlalchemy import Column, String, DateTime, Integer, Boolean, Text, ForeignKey, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

Base = declarative_base()

def generate_uuid():
    return str(uuid.uuid4())

class User(Base):
    __tablename__ = "users"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    email = Column(String, unique=True, nullable=False, index=True)
    password = Column(String, nullable=False)
    name = Column(String, nullable=False)
    family_id = Column(String, ForeignKey("families.id"), nullable=True)
    family_name = Column(String, nullable=True)
    package = Column(String, default="free", nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    family = relationship("Family", back_populates="members")
    memories = relationship("Memory", back_populates="creator")
    comments = relationship("Comment", back_populates="user")
    stories = relationship("Story", back_populates="creator")

class Family(Base):
    __tablename__ = "families"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    name = Column(String, nullable=False)
    created_by = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    members = relationship("User", back_populates="family")
    memories = relationship("Memory", back_populates="family")
    stories = relationship("Story", back_populates="family")
    highlights = relationship("Highlight", back_populates="family")

class Memory(Base):
    __tablename__ = "memories"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    family_id = Column(String, ForeignKey("families.id"), nullable=False)
    created_by = Column(String, ForeignKey("users.id"), nullable=False)
    title = Column(String, nullable=False)
    description_encrypted = Column(Text, nullable=True)
    date = Column(String, nullable=False)
    location_encrypted = Column(Text, nullable=True)
    type = Column(String, nullable=False)
    significance = Column(String, nullable=False)
    participants = Column(JSON, default=list)
    tags = Column(JSON, default=list)
    thumbnail = Column(String, nullable=True)
    ai_enhanced = Column(Boolean, default=False)
    is_vault = Column(Boolean, default=False)
    sentiment_score = Column(Integer, nullable=True)
    sentiment_label = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    family = relationship("Family", back_populates="memories")
    creator = relationship("User", back_populates="memories")
    comments = relationship("Comment", back_populates="memory", cascade="all, delete-orphan")

class Comment(Base):
    __tablename__ = "comments"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    memory_id = Column(String, ForeignKey("memories.id"), nullable=False)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    user_name = Column(String, nullable=False)
    user_avatar = Column(String, nullable=False)
    content_encrypted = Column(Text, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False)
    reactions = Column(JSON, default=list)
    reply_to = Column(String, nullable=True)
    
    memory = relationship("Memory", back_populates="comments")
    user = relationship("User", back_populates="comments")

class Story(Base):
    __tablename__ = "stories"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    family_id = Column(String, ForeignKey("families.id"), nullable=False)
    created_by = Column(String, ForeignKey("users.id"), nullable=False)
    title = Column(String, nullable=False)
    transcript_encrypted = Column(Text, nullable=False)
    date = Column(String, nullable=False)
    location_encrypted = Column(Text, nullable=False)
    duration = Column(Integer, nullable=False)
    prompt = Column(String, nullable=False)
    participants = Column(JSON, default=list)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    family = relationship("Family", back_populates="stories")
    creator = relationship("User", back_populates="stories")

class Highlight(Base):
    __tablename__ = "highlights"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    family_id = Column(String, ForeignKey("families.id"), nullable=False)
    title = Column(String, nullable=False)
    type = Column(String, nullable=False)
    memory_ids = Column(JSON, default=list)
    unlock_date = Column(String, nullable=True)
    views = Column(Integer, default=0)
    shares = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    family = relationship("Family", back_populates="highlights")

class TimeCapsule(Base):
    __tablename__ = "time_capsules"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    family_id = Column(String, ForeignKey("families.id"), nullable=False)
    created_by = Column(String, ForeignKey("users.id"), nullable=False)
    title = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    memory_ids = Column(JSON, default=list)
    unlock_date = Column(String, nullable=False)
    is_locked = Column(Boolean, default=True)
    recipients = Column(JSON, default=list)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

class ImportJob(Base):
    __tablename__ = "import_jobs"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    family_id = Column(String, ForeignKey("families.id"), nullable=False)
    source = Column(String, nullable=False)
    settings = Column(JSON, default=dict)
    total = Column(Integer, default=0)
    processed = Column(Integer, default=0)
    duplicates = Column(Integer, default=0)
    imported = Column(Integer, default=0)
    status = Column(String, default="idle")
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

class NotificationSettings(Base):
    __tablename__ = "notification_settings"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=False, unique=True)
    weekly_digest = Column(Boolean, default=True)
    daily_reminders = Column(Boolean, default=False)
    new_comments = Column(Boolean, default=True)
    new_memories = Column(Boolean, default=True)
    birthdays = Column(Boolean, default=True)
    anniversaries = Column(Boolean, default=True)
    story_prompts = Column(Boolean, default=True)
    family_activity = Column(Boolean, default=True)
    email_notifications = Column(Boolean, default=True)
    push_notifications = Column(Boolean, default=False)

class Subscription(Base):
    __tablename__ = "subscriptions"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=False, unique=True)
    stripe_customer_id = Column(String, nullable=True)
    stripe_subscription_id = Column(String, nullable=True)
    plan = Column(String, default="free")
    status = Column(String, default="active")
    cancel_at = Column(DateTime, nullable=True)
    current_period_end = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
