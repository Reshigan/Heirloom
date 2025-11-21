#!/usr/bin/env python3
"""
Seed staging database with demo users and sample data.
Creates demo users via API to test authentication, encryption, and all features.
"""
import requests
import argparse
import sys
from pathlib import Path

def seed_staging(base_url: str):
    """Seed staging database with demo users and sample data"""
    print(f"🌱 Seeding staging database at {base_url}")
    
    demo_users = [
        {
            "email": "john@smithfamily.com",
            "password": "demo123",
            "name": "John Smith",
            "family_name": "The Smith Family"
        },
        {
            "email": "mary@smithfamily.com",
            "password": "demo123",
            "name": "Mary Smith",
            "family_name": "The Smith Family"
        },
        {
            "email": "sarah@smithfamily.com",
            "password": "demo123",
            "name": "Sarah Smith",
            "family_name": "The Smith Family"
        }
    ]
    
    tokens = {}
    for user in demo_users:
        print(f"\n📝 Registering user: {user['name']} ({user['email']})")
        try:
            response = requests.post(
                f"{base_url}/api/auth/register",
                json=user,
                timeout=10
            )
            if response.status_code == 200:
                data = response.json()
                tokens[user['email']] = data.get('access_token') or data.get('token')
                print(f"   ✓ Registered successfully (ID: {data['user']['id']})")
            elif response.status_code == 400 and ("already exists" in response.text.lower() or "already registered" in response.text.lower()):
                print(f"   ℹ User already exists, logging in...")
                login_response = requests.post(
                    f"{base_url}/api/auth/login",
                    json={"email": user['email'], "password": user['password']},
                    timeout=10
                )
                if login_response.status_code == 200:
                    data = login_response.json()
                    tokens[user['email']] = data.get('access_token') or data.get('token')
                    print(f"   ✓ Logged in successfully")
                else:
                    print(f"   ✗ Login failed: {login_response.status_code} - {login_response.text}")
            else:
                print(f"   ✗ Registration failed: {response.status_code} - {response.text}")
        except Exception as e:
            print(f"   ✗ Error: {e}")
    
    if not tokens:
        print("\n❌ No users registered successfully. Exiting.")
        return False
    
    primary_email = demo_users[0]['email']
    primary_token = tokens.get(primary_email)
    
    if not primary_token:
        print(f"\n❌ Primary user {primary_email} not registered. Exiting.")
        return False
    
    headers = {"Authorization": f"Bearer {primary_token}"}
    
    sample_memories = [
        {
            "title": "Family Reunion 2024",
            "description": "Our wonderful family reunion at the lake house. Everyone was there!",
            "date": "2024-07-15",
            "location": "Lake Tahoe, CA",
            "tags": ["family", "reunion", "celebration"]
        },
        {
            "title": "Grandma's 80th Birthday",
            "description": "Celebrating Grandma's milestone birthday with all her grandchildren.",
            "date": "2024-03-20",
            "location": "Smith Family Home",
            "tags": ["birthday", "grandma", "celebration"]
        },
        {
            "title": "Summer Vacation",
            "description": "Our amazing summer vacation to the beach. The kids loved building sandcastles!",
            "date": "2024-08-10",
            "location": "Santa Monica Beach, CA",
            "tags": ["vacation", "beach", "summer"]
        },
        {
            "title": "First Day of School",
            "description": "Sarah's first day of high school. She was so excited!",
            "date": "2024-09-05",
            "location": "Lincoln High School",
            "tags": ["school", "milestone", "education"]
        },
        {
            "title": "Thanksgiving Dinner",
            "description": "Traditional Thanksgiving dinner with the whole family. Turkey was perfect!",
            "date": "2024-11-28",
            "location": "Smith Family Home",
            "tags": ["thanksgiving", "holiday", "family"]
        }
    ]
    
    memory_ids = []
    print(f"\n📸 Creating sample memories...")
    for memory in sample_memories:
        try:
            response = requests.post(
                f"{base_url}/api/memories",
                json=memory,
                headers=headers,
                timeout=10
            )
            if response.status_code == 200:
                data = response.json()
                memory_ids.append(data['id'])
                print(f"   ✓ Created: {memory['title']}")
            else:
                print(f"   ✗ Failed to create '{memory['title']}': {response.status_code} - {response.text}")
        except Exception as e:
            print(f"   ✗ Error creating '{memory['title']}': {e}")
    
    if memory_ids:
        print(f"\n💬 Creating sample comments...")
        sample_comments = [
            {"memory_id": memory_ids[0], "text": "What a wonderful day! Can't wait for next year!"},
            {"memory_id": memory_ids[0], "text": "The lake was so beautiful!"},
            {"memory_id": memory_ids[1], "text": "Grandma looked so happy! ❤️"},
            {"memory_id": memory_ids[2], "text": "Best vacation ever!"},
            {"memory_id": memory_ids[3], "text": "She's growing up so fast!"},
        ]
        
        for comment in sample_comments:
            try:
                response = requests.post(
                    f"{base_url}/api/memories/{comment['memory_id']}/comments",
                    json={"text": comment['text']},
                    headers=headers,
                    timeout=10
                )
                if response.status_code == 200:
                    print(f"   ✓ Added comment to memory {comment['memory_id']}")
                else:
                    print(f"   ✗ Failed to add comment: {response.status_code}")
            except Exception as e:
                print(f"   ✗ Error adding comment: {e}")
    
    print(f"\n📖 Creating sample stories...")
    sample_stories = [
        {
            "title": "The Smith Family Legacy",
            "content": "Our family has been gathering at the lake house for over 50 years. It all started when Great-Grandpa Smith bought the property in 1970...",
            "tags": ["legacy", "history", "family"]
        },
        {
            "title": "Grandma's Secret Recipe",
            "content": "Grandma's famous apple pie recipe has been passed down through three generations. The secret ingredient? A pinch of cinnamon and lots of love!",
            "tags": ["recipe", "tradition", "cooking"]
        }
    ]
    
    for story in sample_stories:
        try:
            response = requests.post(
                f"{base_url}/api/stories",
                json=story,
                headers=headers,
                timeout=10
            )
            if response.status_code == 200:
                print(f"   ✓ Created: {story['title']}")
            else:
                print(f"   ✗ Failed to create '{story['title']}': {response.status_code}")
        except Exception as e:
            print(f"   ✗ Error creating '{story['title']}': {e}")
    
    if memory_ids:
        print(f"\n⭐ Creating sample highlights...")
        sample_highlights = [
            {
                "title": "Best Family Moments 2024",
                "description": "A collection of our favorite family moments from this year",
                "memory_ids": memory_ids[:3]
            }
        ]
        
        for highlight in sample_highlights:
            try:
                response = requests.post(
                    f"{base_url}/api/highlights",
                    json=highlight,
                    headers=headers,
                    timeout=10
                )
                if response.status_code == 200:
                    print(f"   ✓ Created: {highlight['title']}")
                else:
                    print(f"   ✗ Failed to create '{highlight['title']}': {response.status_code}")
            except Exception as e:
                print(f"   ✗ Error creating '{highlight['title']}': {e}")
    
    print(f"\n✅ Seeding completed successfully!")
    print(f"\n📋 Demo Users:")
    for user in demo_users:
        print(f"   • {user['name']}: {user['email']} / {user['password']}")
    
    return True

def main():
    parser = argparse.ArgumentParser(description="Seed staging database with demo data")
    parser.add_argument(
        "--base-url",
        default="http://127.0.0.1:8000",
        help="Base URL of the API (default: http://127.0.0.1:8000)"
    )
    args = parser.parse_args()
    
    success = seed_staging(args.base_url)
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    main()
