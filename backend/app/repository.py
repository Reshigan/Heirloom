from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from app.db_models import User, Family, Memory, Comment, Story, Highlight, TimeCapsule, ImportJob, NotificationSettings, Subscription
from app import database as legacy_db

class Repository:
    """Repository layer for database operations"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def get_user_by_email(self, email: str) -> Optional[User]:
        return self.db.query(User).filter(User.email == email).first()
    
    def get_user_by_id(self, user_id: str) -> Optional[User]:
        return self.db.query(User).filter(User.id == user_id).first()
    
    def create_user(self, email: str, hashed_password: str, name: str, family_name: Optional[str] = None) -> User:
        family = None
        if family_name:
            family = Family(
                id=legacy_db.generate_id(),
                name=family_name,
                created_by="",  # Will be set after user creation
                created_at=datetime.utcnow()
            )
            self.db.add(family)
            self.db.flush()
        
        user = User(
            id=legacy_db.generate_id(),
            email=email,
            password=hashed_password,
            name=name,
            family_id=family.id if family else None,
            family_name=family_name,
            created_at=datetime.utcnow()
        )
        
        if family:
            family.created_by = user.id
        
        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)
        return user
    
    def get_memories_by_family(self, family_id: str) -> List[Memory]:
        return self.db.query(Memory).filter(Memory.family_id == family_id).all()
    
    def get_memory_by_id(self, memory_id: str) -> Optional[Memory]:
        return self.db.query(Memory).filter(Memory.id == memory_id).first()
    
    def create_memory(self, memory_data: dict, family_id: str, user_id: str) -> Memory:
        memory = Memory(
            id=legacy_db.generate_id(),
            family_id=family_id,
            created_by=user_id,
            created_at=datetime.utcnow(),
            **memory_data
        )
        self.db.add(memory)
        self.db.commit()
        self.db.refresh(memory)
        return memory
    
    def update_memory(self, memory_id: str, memory_data: dict) -> Optional[Memory]:
        memory = self.get_memory_by_id(memory_id)
        if memory:
            for key, value in memory_data.items():
                setattr(memory, key, value)
            self.db.commit()
            self.db.refresh(memory)
        return memory
    
    def delete_memory(self, memory_id: str) -> bool:
        memory = self.get_memory_by_id(memory_id)
        if memory:
            self.db.delete(memory)
            self.db.commit()
            return True
        return False
    
    def get_comments_by_memory(self, memory_id: str) -> List[Comment]:
        return self.db.query(Comment).filter(
            Comment.memory_id == memory_id,
            Comment.reply_to == None
        ).all()
    
    def get_comment_by_id(self, comment_id: str) -> Optional[Comment]:
        return self.db.query(Comment).filter(Comment.id == comment_id).first()
    
    def get_replies_by_comment(self, comment_id: str) -> List[Comment]:
        return self.db.query(Comment).filter(Comment.reply_to == comment_id).all()
    
    def create_comment(self, memory_id: str, user_id: str, user_name: str, 
                      content_encrypted: str, reply_to: Optional[str] = None) -> Comment:
        comment = Comment(
            id=legacy_db.generate_id(),
            memory_id=memory_id,
            user_id=user_id,
            user_name=user_name,
            user_avatar=user_name[:2].upper(),
            content_encrypted=content_encrypted,
            timestamp=datetime.utcnow(),
            reactions=[],
            reply_to=reply_to
        )
        self.db.add(comment)
        self.db.commit()
        self.db.refresh(comment)
        return comment
    
    def delete_comment(self, comment_id: str) -> bool:
        comment = self.get_comment_by_id(comment_id)
        if comment:
            self.db.delete(comment)
            self.db.commit()
            return True
        return False
    
    def add_reaction(self, comment_id: str, user_id: str, user_name: str, reaction_type: str) -> bool:
        comment = self.get_comment_by_id(comment_id)
        if comment:
            reactions = comment.reactions or []
            existing = next((r for r in reactions if r['userId'] == user_id and r['type'] == reaction_type), None)
            
            if existing:
                reactions = [r for r in reactions if not (r['userId'] == user_id and r['type'] == reaction_type)]
            else:
                reactions.append({
                    'type': reaction_type,
                    'userId': user_id,
                    'userName': user_name
                })
            
            comment.reactions = reactions
            self.db.commit()
            return True
        return False
    
    def create_story(self, story_data: dict, family_id: str, user_id: str) -> Story:
        story = Story(
            id=legacy_db.generate_id(),
            family_id=family_id,
            created_by=user_id,
            created_at=datetime.utcnow(),
            date=datetime.utcnow().isoformat(),
            **story_data
        )
        self.db.add(story)
        self.db.commit()
        self.db.refresh(story)
        return story
    
    def get_stories_by_family(self, family_id: str) -> List[Story]:
        return self.db.query(Story).filter(Story.family_id == family_id).all()
    
    def create_highlight(self, highlight_data: dict, family_id: str) -> Highlight:
        highlight = Highlight(
            id=legacy_db.generate_id(),
            family_id=family_id,
            views=0,
            shares=0,
            created_at=datetime.utcnow(),
            **highlight_data
        )
        self.db.add(highlight)
        self.db.commit()
        self.db.refresh(highlight)
        return highlight
    
    def get_highlights_by_family(self, family_id: str) -> List[Highlight]:
        return self.db.query(Highlight).filter(Highlight.family_id == family_id).all()
    
    def create_time_capsule(self, capsule_data: dict, family_id: str, user_id: str) -> TimeCapsule:
        capsule = TimeCapsule(
            id=legacy_db.generate_id(),
            family_id=family_id,
            created_by=user_id,
            created_at=datetime.utcnow(),
            **capsule_data
        )
        self.db.add(capsule)
        self.db.commit()
        self.db.refresh(capsule)
        return capsule
    
    def get_time_capsules_by_family(self, family_id: str) -> List[TimeCapsule]:
        return self.db.query(TimeCapsule).filter(TimeCapsule.family_id == family_id).all()
    
    def get_time_capsule_by_id(self, capsule_id: str) -> Optional[TimeCapsule]:
        return self.db.query(TimeCapsule).filter(TimeCapsule.id == capsule_id).first()
    
    def unlock_time_capsule(self, capsule_id: str) -> bool:
        capsule = self.get_time_capsule_by_id(capsule_id)
        if capsule:
            capsule.is_locked = False
            self.db.commit()
            return True
        return False
    
    def create_import_job(self, user_id: str, family_id: str, source: str, settings: dict) -> ImportJob:
        job = ImportJob(
            id=legacy_db.generate_id(),
            user_id=user_id,
            family_id=family_id,
            source=source,
            settings=settings,
            created_at=datetime.utcnow()
        )
        self.db.add(job)
        self.db.commit()
        self.db.refresh(job)
        return job
    
    def get_import_job_by_id(self, job_id: str) -> Optional[ImportJob]:
        return self.db.query(ImportJob).filter(ImportJob.id == job_id).first()
    
    def update_import_job(self, job_id: str, updates: dict) -> Optional[ImportJob]:
        job = self.get_import_job_by_id(job_id)
        if job:
            for key, value in updates.items():
                setattr(job, key, value)
            self.db.commit()
            self.db.refresh(job)
        return job
    
    def get_notification_settings(self, user_id: str) -> Optional[NotificationSettings]:
        return self.db.query(NotificationSettings).filter(NotificationSettings.user_id == user_id).first()
    
    def create_notification_settings(self, user_id: str) -> NotificationSettings:
        settings = NotificationSettings(
            id=legacy_db.generate_id(),
            user_id=user_id
        )
        self.db.add(settings)
        self.db.commit()
        self.db.refresh(settings)
        return settings
    
    def update_notification_settings(self, user_id: str, updates: dict) -> NotificationSettings:
        settings = self.get_notification_settings(user_id)
        if not settings:
            settings = self.create_notification_settings(user_id)
        
        for key, value in updates.items():
            if value is not None and hasattr(settings, key):
                setattr(settings, key, value)
        self.db.commit()
        self.db.refresh(settings)
        return settings
    
    def get_subscription(self, user_id: str) -> Optional[Subscription]:
        return self.db.query(Subscription).filter(Subscription.user_id == user_id).first()
    
    def create_subscription(self, user_id: str, plan: str = "free") -> Subscription:
        subscription = Subscription(
            id=legacy_db.generate_id(),
            user_id=user_id,
            plan=plan,
            created_at=datetime.utcnow()
        )
        self.db.add(subscription)
        self.db.commit()
        self.db.refresh(subscription)
        return subscription
    
    def update_subscription(self, user_id: str, updates: dict) -> Optional[Subscription]:
        subscription = self.get_subscription(user_id)
        if subscription:
            for key, value in updates.items():
                setattr(subscription, key, value)
            self.db.commit()
            self.db.refresh(subscription)
        return subscription


class LegacyRepository:
    """Fallback repository using in-memory database"""
    
    def get_user_by_email(self, email: str) -> Optional[dict]:
        return legacy_db.get_user_by_email(email)
    
    def get_user_by_id(self, user_id: str) -> Optional[dict]:
        return legacy_db.get_user_by_id(user_id)
    
    def create_user(self, email: str, hashed_password: str, name: str, family_name: Optional[str] = None) -> dict:
        return legacy_db.create_user(email, hashed_password, name, family_name)
    
    def get_memories_by_family(self, family_id: str) -> List[dict]:
        return legacy_db.get_memories_by_family(family_id)
    
    def get_memory_by_id(self, memory_id: str) -> Optional[dict]:
        return legacy_db.get_memory_by_id(memory_id)
    
    def create_memory(self, memory_data: dict, family_id: str, user_id: str) -> dict:
        return legacy_db.create_memory(memory_data, family_id, user_id)
    
    def update_memory(self, memory_id: str, memory_data: dict) -> Optional[dict]:
        return legacy_db.update_memory(memory_id, memory_data)
    
    def delete_memory(self, memory_id: str) -> bool:
        return legacy_db.delete_memory(memory_id)
    
    def get_comments_by_memory(self, memory_id: str) -> List[dict]:
        return legacy_db.get_comments_by_memory(memory_id)
    
    def get_comment_by_id(self, comment_id: str) -> Optional[dict]:
        return legacy_db.get_comment_by_id(comment_id)
    
    def get_replies_by_comment(self, comment_id: str) -> List[dict]:
        return [c for c in legacy_db.comments_db.values() if c.get('reply_to') == comment_id]
    
    def create_comment(self, memory_id: str, user_id: str, user_name: str, 
                      content_encrypted: str, reply_to: Optional[str] = None) -> dict:
        return legacy_db.create_comment(memory_id, user_id, user_name, content_encrypted, reply_to)
    
    def delete_comment(self, comment_id: str) -> bool:
        return legacy_db.delete_comment(comment_id)
    
    def add_reaction(self, comment_id: str, user_id: str, user_name: str, reaction_type: str) -> bool:
        return legacy_db.add_reaction(comment_id, user_id, user_name, reaction_type)
    
    def create_story(self, story_data: dict, family_id: str, user_id: str) -> dict:
        return legacy_db.create_story(story_data, family_id, user_id)
    
    def get_stories_by_family(self, family_id: str) -> List[dict]:
        return legacy_db.get_stories_by_family(family_id)
    
    def create_highlight(self, highlight_data: dict, family_id: str) -> dict:
        return legacy_db.create_highlight(highlight_data, family_id)
    
    def get_highlights_by_family(self, family_id: str) -> List[dict]:
        return legacy_db.get_highlights_by_family(family_id)
    
    def create_time_capsule(self, capsule_data: dict, family_id: str, user_id: str) -> dict:
        return legacy_db.create_time_capsule(capsule_data, family_id, user_id)
    
    def get_time_capsules_by_family(self, family_id: str) -> List[dict]:
        return legacy_db.get_time_capsules_by_family(family_id)
    
    def get_time_capsule_by_id(self, capsule_id: str) -> Optional[dict]:
        return legacy_db.get_time_capsule_by_id(capsule_id)
    
    def unlock_time_capsule(self, capsule_id: str) -> bool:
        return legacy_db.unlock_time_capsule(capsule_id)
    
    def create_import_job(self, user_id: str, family_id: str, source: str, settings: dict) -> dict:
        return legacy_db.create_import_job(user_id, family_id, source, settings)
    
    def get_import_job_by_id(self, job_id: str) -> Optional[dict]:
        return legacy_db.get_import_job_by_id(job_id)
    
    def update_import_job(self, job_id: str, updates: dict) -> Optional[dict]:
        return legacy_db.update_import_job(job_id, updates)
    
    def get_notification_settings(self, user_id: str) -> Optional[dict]:
        return legacy_db.get_notification_settings(user_id)
    
    def create_notification_settings(self, user_id: str) -> dict:
        return legacy_db.create_notification_settings(user_id)
    
    def update_notification_settings(self, user_id: str, updates: dict) -> dict:
        return legacy_db.update_notification_settings(user_id, updates)
    
    def get_subscription(self, user_id: str) -> Optional[dict]:
        return legacy_db.get_subscription(user_id)
    
    def create_subscription(self, user_id: str, plan: str = "free") -> dict:
        return legacy_db.create_subscription(user_id, plan)
    
    def update_subscription(self, user_id: str, updates: dict) -> Optional[dict]:
        return legacy_db.update_subscription(user_id, updates)
