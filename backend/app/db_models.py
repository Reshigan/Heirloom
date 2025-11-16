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
