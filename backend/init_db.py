#!/usr/bin/env python3
"""
Database initialization script for Heirloom backend.
Run this script to create all database tables.
"""

import os
import sys
from dotenv import load_dotenv

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

load_dotenv()

from app.db_connection import init_db, engine
from app.db_models import Base

def main():
    """Initialize the database"""
    print("Initializing Heirloom database...")
    print(f"Database URL: {os.getenv('DATABASE_URL', 'Not set')}")
    
    try:
        init_db()
        print("✓ Database tables created successfully!")
        
        from sqlalchemy import inspect
        inspector = inspect(engine)
        tables = inspector.get_table_names()
        
        print(f"\nCreated {len(tables)} tables:")
        for table in sorted(tables):
            print(f"  - {table}")
        
        return 0
    except Exception as e:
        print(f"✗ Error initializing database: {e}")
        return 1

if __name__ == "__main__":
    sys.exit(main())
