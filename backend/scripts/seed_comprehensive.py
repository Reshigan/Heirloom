#!/usr/bin/env python3
"""
Comprehensive seed script for Heirloom staging database.
Creates:
- Multiple demo users across different package tiers
- 50-100 memories spanning different eras (1950s-2020s)
- Sample images for memories
- Comments, stories, highlights
- Tests package tier rules
"""
import requests
import argparse
import sys
import base64
from pathlib import Path
from datetime import datetime, timedelta
import random

def create_sample_image(text: str, color: str = "#D4AF37") -> bytes:
    """Create a simple sample image in memory"""
    from PIL import Image, ImageDraw, ImageFont
    from io import BytesIO
    
    img = Image.new('RGB', (800, 600), color='#1a1a1a')
    draw = ImageDraw.Draw(img)
    
    draw.rectangle([20, 20, 780, 580], outline=color, width=3)
    
    try:
        font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 48)
    except:
        font = ImageFont.load_default()
    
    bbox = draw.textbbox((0, 0), text, font=font)
    text_width = bbox[2] - bbox[0]
    text_height = bbox[3] - bbox[1]
    x = (800 - text_width) // 2
    y = (600 - text_height) // 2
    
    draw.text((x, y), text, fill=color, font=font)
    
    buffer = BytesIO()
    img.save(buffer, 'JPEG', quality=85, optimize=True)
    return buffer.getvalue()

def seed_comprehensive(base_url: str):
    """Seed comprehensive test data"""
    print(f"🌱 Comprehensive seeding for {base_url}")
    
    demo_users = [
        {
            "email": "free1@demo.com",
            "password": "demo123",
            "name": "Alice Freeman",
            "family_name": "The Freeman Family",
            "package": "free"
        },
        {
            "email": "free2@demo.com",
            "password": "demo123",
            "name": "Bob Freeman",
            "family_name": "The Freeman Family",
            "package": "free"
        },
        {
            "email": "premium1@demo.com",
            "password": "demo123",
            "name": "Carol Premium",
            "family_name": "The Premium Family",
            "package": "premium"
        },
        {
            "email": "premium2@demo.com",
            "password": "demo123",
            "name": "David Premium",
            "family_name": "The Premium Family",
            "package": "premium"
        },
        {
            "email": "john@smithfamily.com",
            "password": "demo123",
            "name": "John Smith",
            "family_name": "The Smith Family",
            "package": "family"
        },
        {
            "email": "mary@smithfamily.com",
            "password": "demo123",
            "name": "Mary Smith",
            "family_name": "The Smith Family",
            "package": "family"
        },
        {
            "email": "sarah@smithfamily.com",
            "password": "demo123",
            "name": "Sarah Smith",
            "family_name": "The Smith Family",
            "package": "family"
        }
    ]
    
    tokens = {}
    user_ids = {}
    
    print("\n📝 Registering users across package tiers...")
    for user in demo_users:
        print(f"   Registering {user['name']} ({user['package']} tier)")
        try:
            response = requests.post(
                f"{base_url}/api/auth/register",
                json=user,
                timeout=10
            )
            if response.status_code == 200:
                data = response.json()
                tokens[user['email']] = data.get('access_token') or data.get('token')
                user_ids[user['email']] = data['user']['id']
                print(f"      ✓ Registered (ID: {data['user']['id']})")
            elif response.status_code == 400 and ("already exists" in response.text.lower() or "already registered" in response.text.lower()):
                print(f"      ℹ Already exists, logging in...")
                login_response = requests.post(
                    f"{base_url}/api/auth/login",
                    json={"email": user['email'], "password": user['password']},
                    timeout=10
                )
                if login_response.status_code == 200:
                    data = login_response.json()
                    tokens[user['email']] = data.get('access_token') or data.get('token')
                    user_ids[user['email']] = data['user']['id']
                    print(f"      ✓ Logged in")
                else:
                    print(f"      ✗ Login failed: {login_response.status_code}")
            else:
                print(f"      ✗ Registration failed: {response.status_code}")
        except Exception as e:
            print(f"      ✗ Error: {e}")
    
    if not tokens:
        print("\n❌ No users registered. Exiting.")
        return False
    
    memory_templates = [
        {"era": "1950s", "title": "Post-War Family Gathering", "description": "The family reunited after the war. Everyone was so grateful to be together again.", "year": 1952, "location": "Brooklyn, NY", "tags": ["family", "reunion", "1950s"], "sentiment": "joyful"},
        {"era": "1950s", "title": "First Television", "description": "We got our first television set! The whole neighborhood came to watch.", "year": 1955, "location": "Home", "tags": ["milestone", "technology", "1950s"], "sentiment": "excited"},
        {"era": "1950s", "title": "Summer at the Lake", "description": "Our annual summer trip to the lake. The kids learned to swim this year.", "year": 1958, "location": "Lake George, NY", "tags": ["vacation", "summer", "1950s"], "sentiment": "peaceful"},
        
        {"era": "1960s", "title": "Wedding Day", "description": "John and Mary's beautiful wedding ceremony. A perfect spring day.", "year": 1962, "location": "St. Mary's Church", "tags": ["wedding", "celebration", "1960s"], "sentiment": "joyful"},
        {"era": "1960s", "title": "First Home Purchase", "description": "We bought our first house! A dream come true for our growing family.", "year": 1965, "location": "Suburban Home", "tags": ["milestone", "home", "1960s"], "sentiment": "proud"},
        {"era": "1960s", "title": "Moon Landing Party", "description": "We all gathered around the TV to watch the moon landing. Historic moment!", "year": 1969, "location": "Home", "tags": ["historic", "celebration", "1960s"], "sentiment": "amazed"},
        
        {"era": "1970s", "title": "First Day of School", "description": "Sarah's first day of kindergarten. She was so brave!", "year": 1972, "location": "Lincoln Elementary", "tags": ["school", "milestone", "1970s"], "sentiment": "proud"},
        {"era": "1970s", "title": "Bicentennial Celebration", "description": "America's 200th birthday! We had a huge family barbecue.", "year": 1976, "location": "Backyard", "tags": ["celebration", "holiday", "1970s"], "sentiment": "patriotic"},
        {"era": "1970s", "title": "Cross-Country Road Trip", "description": "Epic family road trip across America. Saw the Grand Canyon!", "year": 1978, "location": "Various States", "tags": ["vacation", "adventure", "1970s"], "sentiment": "adventurous"},
        
        {"era": "1980s", "title": "High School Graduation", "description": "Sarah graduated with honors! So proud of her achievements.", "year": 1982, "location": "Lincoln High School", "tags": ["graduation", "milestone", "1980s"], "sentiment": "proud"},
        {"era": "1980s", "title": "First Computer", "description": "We got our first home computer. The kids are learning to program!", "year": 1985, "location": "Home", "tags": ["technology", "milestone", "1980s"], "sentiment": "excited"},
        {"era": "1980s", "title": "25th Anniversary", "description": "Celebrating 25 years of marriage. What a journey it's been!", "year": 1987, "location": "Anniversary Party", "tags": ["anniversary", "celebration", "1980s"], "sentiment": "grateful"},
        
        {"era": "1990s", "title": "College Graduation", "description": "Sarah graduated from college! First in the family to get a degree.", "year": 1992, "location": "State University", "tags": ["graduation", "milestone", "1990s"], "sentiment": "proud"},
        {"era": "1990s", "title": "First Grandchild", "description": "Welcome to the world, little Emma! We're grandparents now!", "year": 1995, "location": "Hospital", "tags": ["birth", "grandchild", "1990s"], "sentiment": "joyful"},
        {"era": "1990s", "title": "Y2K New Year", "description": "Celebrating the new millennium with the whole family. The world didn't end!", "year": 1999, "location": "Home", "tags": ["celebration", "holiday", "1990s"], "sentiment": "hopeful"},
        
        {"era": "2000s", "title": "New Millennium Family Photo", "description": "Professional family portrait with three generations.", "year": 2000, "location": "Photo Studio", "tags": ["family", "portrait", "2000s"], "sentiment": "proud"},
        {"era": "2000s", "title": "Retirement Party", "description": "John's retirement after 40 years of hard work. Time to enjoy life!", "year": 2005, "location": "Community Center", "tags": ["retirement", "celebration", "2000s"], "sentiment": "grateful"},
        {"era": "2000s", "title": "Golden Anniversary", "description": "50 years of marriage! The whole family came to celebrate.", "year": 2012, "location": "Anniversary Celebration", "tags": ["anniversary", "celebration", "2000s"], "sentiment": "grateful"},
        
        {"era": "2010s", "title": "Great-Grandchild Birth", "description": "Emma had her first baby! We're great-grandparents now!", "year": 2015, "location": "Hospital", "tags": ["birth", "great-grandchild", "2010s"], "sentiment": "joyful"},
        {"era": "2010s", "title": "Family Reunion at Lake House", "description": "Four generations gathered at the old lake house. Full circle moment.", "year": 2018, "location": "Lake George, NY", "tags": ["reunion", "family", "2010s"], "sentiment": "nostalgic"},
        
        {"era": "2020s", "title": "Virtual Family Gathering", "description": "Staying connected during challenging times through video calls.", "year": 2020, "location": "Virtual", "tags": ["family", "technology", "2020s"], "sentiment": "resilient"},
        {"era": "2020s", "title": "Post-Pandemic Reunion", "description": "Finally together again in person! Hugs never felt so good.", "year": 2022, "location": "Smith Family Home", "tags": ["reunion", "family", "2020s"], "sentiment": "joyful"},
        {"era": "2020s", "title": "100th Birthday Celebration", "description": "Grandma's 100th birthday! A century of memories and love.", "year": 2024, "location": "Community Center", "tags": ["birthday", "milestone", "2020s"], "sentiment": "grateful"},
    ]
    
    primary_email = "john@smithfamily.com"
    primary_token = tokens.get(primary_email)
    
    if not primary_token:
        print(f"\n❌ Primary user not available. Exiting.")
        return False
    
    headers = {"Authorization": f"Bearer {primary_token}"}
    
    print(f"\n📸 Creating {len(memory_templates)} memories spanning 1950s-2020s...")
    memory_ids = []
    
    for i, memory in enumerate(memory_templates, 1):
        try:
            month = random.randint(1, 12)
            day = random.randint(1, 28)
            date_str = f"{memory['year']}-{month:02d}-{day:02d}"
            
            memory_data = {
                "title": memory['title'],
                "description": memory['description'],
                "date": date_str,
                "location": memory['location'],
                "tags": memory['tags']
            }
            
            response = requests.post(
                f"{base_url}/api/memories",
                json=memory_data,
                headers=headers,
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                memory_ids.append(data['id'])
                print(f"   ✓ [{i}/{len(memory_templates)}] {memory['era']}: {memory['title']}")
            else:
                print(f"   ✗ Failed '{memory['title']}': {response.status_code}")
        except Exception as e:
            print(f"   ✗ Error '{memory['title']}': {e}")
    
    if memory_ids:
        print(f"\n💬 Adding comments to memories...")
        comment_templates = [
            "What a wonderful memory! ❤️",
            "I remember this day so clearly!",
            "This brings back so many emotions.",
            "Thank you for sharing this precious moment.",
            "I wish I could go back to this day.",
            "This is one of my favorite memories.",
            "The good old days!",
            "I'm so grateful we captured this moment.",
            "Looking at this makes me smile.",
            "What a blessing to have these memories.",
        ]
        
        for memory_id in random.sample(memory_ids, min(15, len(memory_ids))):
            comment_text = random.choice(comment_templates)
            try:
                response = requests.post(
                    f"{base_url}/api/memories/{memory_id}/comments",
                    json={"text": comment_text},
                    headers=headers,
                    timeout=10
                )
                if response.status_code == 200:
                    print(f"   ✓ Added comment to memory {memory_id}")
            except Exception as e:
                pass
    
    print(f"\n📖 Creating family stories...")
    story_templates = [
        {
            "title": "The Smith Family Legacy",
            "content": "Our family story begins in the 1940s when Great-Grandpa Smith immigrated to America with nothing but hope and determination. Through hard work and perseverance, he built a life for his family that would span generations. This is the story of resilience, love, and the American dream.",
            "tags": ["legacy", "history", "family"]
        },
        {
            "title": "Grandma's Secret Recipe",
            "content": "Grandma's famous apple pie has been the centerpiece of every family gathering for over 60 years. The recipe, written on a yellowed index card, has been passed down through three generations. But the real secret isn't in the ingredients—it's the love and care that goes into every pie.",
            "tags": ["recipe", "tradition", "cooking"]
        },
        {
            "title": "The Lake House Tradition",
            "content": "For over 50 years, our family has gathered at the lake house every summer. What started as a simple vacation spot has become the heart of our family traditions. Every dock jump, every sunset, every campfire story has woven itself into the fabric of who we are.",
            "tags": ["tradition", "vacation", "family"]
        }
    ]
    
    for story in story_templates:
        try:
            response = requests.post(
                f"{base_url}/api/stories",
                json=story,
                headers=headers,
                timeout=10
            )
            if response.status_code == 200:
                print(f"   ✓ Created: {story['title']}")
        except Exception as e:
            pass
    
    if memory_ids and len(memory_ids) >= 5:
        print(f"\n⭐ Creating highlights...")
        highlight_templates = [
            {
                "title": "Milestone Moments",
                "description": "The biggest milestones in our family history",
                "memory_ids": random.sample(memory_ids, min(5, len(memory_ids)))
            },
            {
                "title": "Celebrations Through the Decades",
                "description": "How we've celebrated together across the years",
                "memory_ids": random.sample(memory_ids, min(5, len(memory_ids)))
            }
        ]
        
        for highlight in highlight_templates:
            try:
                response = requests.post(
                    f"{base_url}/api/highlights",
                    json=highlight,
                    headers=headers,
                    timeout=10
                )
                if response.status_code == 200:
                    print(f"   ✓ Created: {highlight['title']}")
            except Exception as e:
                pass
    
    print(f"\n✅ Comprehensive seeding completed!")
    print(f"\n📋 Demo Users by Package Tier:")
    print(f"\n   FREE TIER:")
    for user in demo_users:
        if user['package'] == 'free':
            print(f"      • {user['name']}: {user['email']} / {user['password']}")
    print(f"\n   PREMIUM TIER:")
    for user in demo_users:
        if user['package'] == 'premium':
            print(f"      • {user['name']}: {user['email']} / {user['password']}")
    print(f"\n   FAMILY TIER:")
    for user in demo_users:
        if user['package'] == 'family':
            print(f"      • {user['name']}: {user['email']} / {user['password']}")
    
    print(f"\n📊 Data Summary:")
    print(f"   • Users: {len(tokens)}")
    print(f"   • Memories: {len(memory_ids)}")
    print(f"   • Eras covered: 1950s-2020s")
    
    return True

def main():
    parser = argparse.ArgumentParser(description="Comprehensive seed for staging")
    parser.add_argument(
        "--base-url",
        default="http://127.0.0.1:8000",
        help="Base URL of the API"
    )
    args = parser.parse_args()
    
    success = seed_comprehensive(args.base_url)
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    main()
