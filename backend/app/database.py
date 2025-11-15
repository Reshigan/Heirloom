from datetime import datetime
from typing import Dict, List, Optional
import uuid

users_db: Dict[str, dict] = {}
families_db: Dict[str, dict] = {}
memories_db: Dict[str, dict] = {}
comments_db: Dict[str, dict] = {}
reactions_db: Dict[str, dict] = {}
stories_db: Dict[str, dict] = {}
highlights_db: Dict[str, dict] = {}

user_email_index: Dict[str, str] = {}

def generate_id() -> str:
    return str(uuid.uuid4())

def get_user_by_email(email: str) -> Optional[dict]:
    user_id = user_email_index.get(email)
    if user_id:
        return users_db.get(user_id)
    return None

def get_user_by_id(user_id: str) -> Optional[dict]:
    return users_db.get(user_id)

def create_user(email: str, hashed_password: str, name: str, family_name: Optional[str] = None) -> dict:
    user_id = generate_id()
    family_id = None
    
    if family_name:
        family_id = generate_id()
        families_db[family_id] = {
            'id': family_id,
            'name': family_name,
            'created_by': user_id,
            'members': [user_id],
            'created_at': datetime.utcnow()
        }
    
    user = {
        'id': user_id,
        'email': email,
        'password': hashed_password,
        'name': name,
        'family_id': family_id,
        'family_name': family_name,
        'created_at': datetime.utcnow()
    }
    
    users_db[user_id] = user
    user_email_index[email] = user_id
    
    return user

def get_memories_by_family(family_id: str) -> List[dict]:
    return [m for m in memories_db.values() if m.get('family_id') == family_id]

def get_memory_by_id(memory_id: str) -> Optional[dict]:
    return memories_db.get(memory_id)

def create_memory(memory_data: dict, family_id: str, user_id: str) -> dict:
    memory_id = generate_id()
    memory = {
        'id': memory_id,
        'family_id': family_id,
        'created_by': user_id,
        'created_at': datetime.utcnow(),
        **memory_data
    }
    memories_db[memory_id] = memory
    return memory

def update_memory(memory_id: str, memory_data: dict) -> Optional[dict]:
    if memory_id in memories_db:
        memories_db[memory_id].update(memory_data)
        return memories_db[memory_id]
    return None

def delete_memory(memory_id: str) -> bool:
    if memory_id in memories_db:
        del memories_db[memory_id]
        return True
    return False

def get_comments_by_memory(memory_id: str) -> List[dict]:
    return [c for c in comments_db.values() if c.get('memory_id') == memory_id and not c.get('reply_to')]

def create_comment(memory_id: str, user_id: str, user_name: str, content: str, reply_to: Optional[str] = None) -> dict:
    comment_id = generate_id()
    comment = {
        'id': comment_id,
        'memory_id': memory_id,
        'user_id': user_id,
        'user_name': user_name,
        'user_avatar': user_name[:2].upper(),
        'content': content,
        'timestamp': datetime.utcnow(),
        'reactions': [],
        'replies': [],
        'reply_to': reply_to
    }
    comments_db[comment_id] = comment
    return comment

def get_comment_by_id(comment_id: str) -> Optional[dict]:
    return comments_db.get(comment_id)

def delete_comment(comment_id: str) -> bool:
    if comment_id in comments_db:
        del comments_db[comment_id]
        return True
    return False

def add_reaction(comment_id: str, user_id: str, user_name: str, reaction_type: str) -> bool:
    comment = comments_db.get(comment_id)
    if comment:
        existing = next((r for r in comment['reactions'] if r['userId'] == user_id and r['type'] == reaction_type), None)
        if existing:
            comment['reactions'] = [r for r in comment['reactions'] if not (r['userId'] == user_id and r['type'] == reaction_type)]
        else:
            comment['reactions'].append({
                'type': reaction_type,
                'userId': user_id,
                'userName': user_name
            })
        return True
    return False

def create_story(story_data: dict, family_id: str, user_id: str) -> dict:
    story_id = generate_id()
    story = {
        'id': story_id,
        'family_id': family_id,
        'created_by': user_id,
        'created_at': datetime.utcnow(),
        'date': datetime.utcnow().isoformat(),
        **story_data
    }
    stories_db[story_id] = story
    return story

def get_stories_by_family(family_id: str) -> List[dict]:
    return [s for s in stories_db.values() if s.get('family_id') == family_id]

def create_highlight(highlight_data: dict, family_id: str) -> dict:
    highlight_id = generate_id()
    highlight = {
        'id': highlight_id,
        'family_id': family_id,
        'views': 0,
        'shares': 0,
        'created_at': datetime.utcnow(),
        **highlight_data
    }
    highlights_db[highlight_id] = highlight
    return highlight

def get_highlights_by_family(family_id: str) -> List[dict]:
    return [h for h in highlights_db.values() if h.get('family_id') == family_id]
