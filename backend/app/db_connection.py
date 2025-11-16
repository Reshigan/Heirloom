from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from typing import Generator
import os
from dotenv import load_dotenv

from app.db_models import Base

load_dotenv()

USE_POSTGRES = os.getenv("USE_POSTGRES", "true").lower() == "true"
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://heirloom:heirloom@localhost/heirloom")

engine = None
SessionLocal = None

if USE_POSTGRES:
    try:
        engine = create_engine(
            DATABASE_URL,
            pool_pre_ping=True,
            pool_size=10,
            max_overflow=20
        )
        SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    except Exception as e:
        print(f"Warning: Could not create database engine: {e}")
        USE_POSTGRES = False

def init_db():
    """Initialize database tables"""
    if engine:
        Base.metadata.create_all(bind=engine)

def get_db() -> Generator[Session, None, None]:
    """Dependency for getting database session"""
    if SessionLocal:
        db = SessionLocal()
        try:
            yield db
        finally:
            db.close()
    else:
        yield None
