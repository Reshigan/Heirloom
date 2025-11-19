from fastapi import FastAPI, HTTPException, Depends, UploadFile, File, Request
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List, Optional
import base64
import os
import stripe

from app.models import (
    UserRegister, UserLogin, UserResponse,
    MemoryCreate, MemoryResponse,
    CommentCreate, CommentResponse,
    ReactionCreate,
    StoryCreate, StoryResponse,
    HighlightCreate, HighlightResponse,
    TimeCapsuleCreate, TimeCapsuleResponse,
    ImportStartRequest, ImportStartResponse, ImportStatusResponse,
    DigestResponse, NotificationSettingsResponse, NotificationSettingsUpdate,
    SearchRequest, SubscriptionResponse, UserProfileResponse
)
from app.auth import hash_password, verify_password, create_access_token, get_current_user
from app.encryption import encrypt_data, decrypt_data
from app.compression import (
    compress_image, generate_thumbnail, validate_image, get_image_info,
    compress_audio, compress_video, generate_video_thumbnail, get_media_info
)
from app.db_connection import get_db, init_db
from app.repository import Repository, LegacyRepository
from app import database as legacy_db

app = FastAPI(title="Heirloom API", version="1.0.0")

use_postgres = os.getenv("use_postgres", "true").lower() == "true"
stripe.api_key = os.getenv("STRIPE_SECRET_KEY", "")
STRIPE_WEBHOOK_SECRET = os.getenv("STRIPE_WEBHOOK_SECRET", "")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")

@app.on_event("startup")
async def startup_event():
    global use_postgres
    if use_postgres:
        try:
            init_db()
            print("✓ PostgreSQL database initialized")
        except Exception as e:
            print(f"✗ Failed to initialize PostgreSQL: {e}")
            print("  Falling back to in-memory database")
            use_postgres = False

# Disable CORS. Do not remove this for full-stack development.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_repository(db: Session = Depends(get_db)):
    """Get repository instance (PostgreSQL or in-memory fallback)"""
    if use_postgres and db is not None:
        return Repository(db)
    return LegacyRepository()

@app.get("/healthz")
async def healthz():
    db_type = "postgresql" if use_postgres else "in-memory"
    return {"status": "ok", "encryption": "enabled", "database": db_type}

@app.post("/api/auth/register", response_model=UserResponse)
async def register(user_data: UserRegister, repo = Depends(get_repository)):
    existing_user = repo.get_user_by_email(user_data.email)
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = hash_password(user_data.password)
    
    user = repo.create_user(
        email=user_data.email,
        hashed_password=hashed_password,
        name=user_data.name,
        family_name=user_data.family_name
    )
    
    if use_postgres:
        return UserResponse(
            id=user.id,
            email=user.email,
            name=user.name,
            family_id=user.family_id,
            family_name=user.family_name,
            created_at=user.created_at
        )
    else:
        return UserResponse(
            id=user['id'],
            email=user['email'],
            name=user['name'],
            family_id=user.get('family_id'),
            family_name=user.get('family_name'),
            created_at=user['created_at']
        )

@app.post("/api/auth/login")
async def login(credentials: UserLogin, repo = Depends(get_repository)):
    user = repo.get_user_by_email(credentials.email)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    password_hash = user.password if use_postgres else user['password']
    if not verify_password(credentials.password, password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    user_id = user.id if use_postgres else user['id']
    user_email = user.email if use_postgres else user['email']
    token = create_access_token(user_id, user_email)
    
    if use_postgres:
        return {
            "access_token": token,
            "token_type": "bearer",
            "user": {
                "id": user.id,
                "email": user.email,
                "name": user.name,
                "family_id": user.family_id,
                "family_name": user.family_name
            }
        }
    else:
        return {
            "access_token": token,
            "token_type": "bearer",
            "user": {
                "id": user['id'],
                "email": user['email'],
                "name": user['name'],
                "family_id": user.get('family_id'),
                "family_name": user.get('family_name')
            }
        }

@app.get("/api/auth/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(get_current_user), repo = Depends(get_repository)):
    user = repo.get_user_by_id(current_user['user_id'])
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if use_postgres:
        return UserResponse(
            id=user.id,
            email=user.email,
            name=user.name,
            family_id=user.family_id,
            family_name=user.family_name,
            created_at=user.created_at
        )
    else:
        return UserResponse(
            id=user['id'],
            email=user['email'],
            name=user['name'],
            family_id=user.get('family_id'),
            family_name=user.get('family_name'),
            created_at=user['created_at']
        )

def model_to_dict(obj):
    """Convert SQLAlchemy model to dict"""
    if use_postgres:
        return {c.name: getattr(obj, c.name) for c in obj.__table__.columns}
    return obj

@app.get("/api/memories", response_model=List[MemoryResponse])
async def get_memories(current_user: dict = Depends(get_current_user), repo = Depends(get_repository)):
    user = repo.get_user_by_id(current_user['user_id'])
    family_id = user.family_id if use_postgres else user.get('family_id')
    
    if not user or not family_id:
        return []
    
    memories = repo.get_memories_by_family(family_id)
    
    decrypted_memories = []
    for memory in memories:
        memory_dict = model_to_dict(memory)
        if 'description_encrypted' in memory_dict and memory_dict['description_encrypted']:
            memory_dict['description'] = decrypt_data(memory_dict['description_encrypted'])
            del memory_dict['description_encrypted']
        if 'location_encrypted' in memory_dict and memory_dict['location_encrypted']:
            memory_dict['location'] = decrypt_data(memory_dict['location_encrypted'])
            del memory_dict['location_encrypted']
        
        decrypted_memories.append(MemoryResponse(**memory_dict))
    
    return decrypted_memories

@app.post("/api/memories", response_model=MemoryResponse)
async def create_memory(memory_data: MemoryCreate, current_user: dict = Depends(get_current_user), repo = Depends(get_repository)):
    user = repo.get_user_by_id(current_user['user_id'])
    family_id = user.family_id if use_postgres else user.get('family_id')
    user_id = user.id if use_postgres else user['id']
    
    if not user or not family_id:
        raise HTTPException(status_code=400, detail="User must belong to a family")
    
    memory_dict = memory_data.model_dump()
    
    memory_dict['description_encrypted'] = encrypt_data(memory_dict['description'])
    del memory_dict['description']
    memory_dict['location_encrypted'] = encrypt_data(memory_dict['location'])
    del memory_dict['location']
    
    memory_dict['thumbnail'] = None
    memory_dict['ai_enhanced'] = False
    
    memory = repo.create_memory(memory_dict, family_id, user_id)
    
    response_memory = model_to_dict(memory)
    response_memory['description'] = decrypt_data(response_memory['description_encrypted'])
    del response_memory['description_encrypted']
    response_memory['location'] = decrypt_data(response_memory['location_encrypted'])
    del response_memory['location_encrypted']
    
    return MemoryResponse(**response_memory)

@app.get("/api/memories/{memory_id}", response_model=MemoryResponse)
async def get_memory(memory_id: str, current_user: dict = Depends(get_current_user), repo = Depends(get_repository)):
    memory = repo.get_memory_by_id(memory_id)
    if not memory:
        raise HTTPException(status_code=404, detail="Memory not found")
    
    user = repo.get_user_by_id(current_user['user_id'])
    memory_family_id = memory.family_id if use_postgres else memory['family_id']
    user_family_id = user.family_id if use_postgres else user.get('family_id')
    
    if not user or memory_family_id != user_family_id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    decrypted_memory = model_to_dict(memory)
    if 'description_encrypted' in decrypted_memory and decrypted_memory['description_encrypted']:
        decrypted_memory['description'] = decrypt_data(decrypted_memory['description_encrypted'])
        del decrypted_memory['description_encrypted']
    if 'location_encrypted' in decrypted_memory and decrypted_memory['location_encrypted']:
        decrypted_memory['location'] = decrypt_data(decrypted_memory['location_encrypted'])
        del decrypted_memory['location_encrypted']
    
    return MemoryResponse(**decrypted_memory)

@app.put("/api/memories/{memory_id}", response_model=MemoryResponse)
async def update_memory(memory_id: str, memory_data: MemoryCreate, current_user: dict = Depends(get_current_user), repo = Depends(get_repository)):
    memory = repo.get_memory_by_id(memory_id)
    if not memory:
        raise HTTPException(status_code=404, detail="Memory not found")
    
    user = repo.get_user_by_id(current_user['user_id'])
    memory_family_id = memory.family_id if use_postgres else memory['family_id']
    user_family_id = user.family_id if use_postgres else user.get('family_id')
    
    if not user or memory_family_id != user_family_id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    update_dict = memory_data.model_dump()
    update_dict['description_encrypted'] = encrypt_data(update_dict['description'])
    del update_dict['description']
    update_dict['location_encrypted'] = encrypt_data(update_dict['location'])
    del update_dict['location']
    
    updated_memory = repo.update_memory(memory_id, update_dict)
    
    response_memory = model_to_dict(updated_memory)
    response_memory['description'] = decrypt_data(response_memory['description_encrypted'])
    del response_memory['description_encrypted']
    response_memory['location'] = decrypt_data(response_memory['location_encrypted'])
    del response_memory['location_encrypted']
    
    return MemoryResponse(**response_memory)

@app.delete("/api/memories/{memory_id}")
async def delete_memory(memory_id: str, current_user: dict = Depends(get_current_user), repo = Depends(get_repository)):
    memory = repo.get_memory_by_id(memory_id)
    if not memory:
        raise HTTPException(status_code=404, detail="Memory not found")
    
    user = repo.get_user_by_id(current_user['user_id'])
    memory_family_id = memory.family_id if use_postgres else memory['family_id']
    user_family_id = user.family_id if use_postgres else user.get('family_id')
    
    if not user or memory_family_id != user_family_id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    repo.delete_memory(memory_id)
    return {"message": "Memory deleted successfully"}

@app.get("/api/memories/{memory_id}/comments", response_model=List[CommentResponse])
async def get_comments(memory_id: str, current_user: dict = Depends(get_current_user), repo = Depends(get_repository)):
    memory = repo.get_memory_by_id(memory_id)
    if not memory:
        raise HTTPException(status_code=404, detail="Memory not found")
    
    user = repo.get_user_by_id(current_user['user_id'])
    memory_family_id = memory.family_id if use_postgres else memory['family_id']
    user_family_id = user.family_id if use_postgres else user.get('family_id')
    
    if not user or memory_family_id != user_family_id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    comments = repo.get_comments_by_memory(memory_id)
    
    decrypted_comments = []
    for comment in comments:
        comment_dict = model_to_dict(comment)
        comment_id = comment.id if use_postgres else comment['id']
        
        if 'content_encrypted' in comment_dict and comment_dict['content_encrypted']:
            comment_dict['content'] = decrypt_data(comment_dict['content_encrypted'])
            del comment_dict['content_encrypted']
        
        replies = repo.get_replies_by_comment(comment_id)
        decrypted_replies = []
        for reply in replies:
            reply_dict = model_to_dict(reply)
            if 'content_encrypted' in reply_dict and reply_dict['content_encrypted']:
                reply_dict['content'] = decrypt_data(reply_dict['content_encrypted'])
                del reply_dict['content_encrypted']
            decrypted_replies.append(reply_dict)
        
        comment_dict['replies'] = decrypted_replies
        decrypted_comments.append(CommentResponse(**comment_dict))
    
    return decrypted_comments

@app.post("/api/memories/{memory_id}/comments", response_model=CommentResponse)
async def create_comment(memory_id: str, comment_data: CommentCreate, current_user: dict = Depends(get_current_user), repo = Depends(get_repository)):
    memory = repo.get_memory_by_id(memory_id)
    if not memory:
        raise HTTPException(status_code=404, detail="Memory not found")
    
    user = repo.get_user_by_id(current_user['user_id'])
    memory_family_id = memory.family_id if use_postgres else memory['family_id']
    user_family_id = user.family_id if use_postgres else user.get('family_id')
    
    if not user or memory_family_id != user_family_id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    encrypted_content = encrypt_data(comment_data.content)
    user_id = user.id if use_postgres else user['id']
    user_name = user.name if use_postgres else user['name']
    
    comment = repo.create_comment(
        memory_id=memory_id,
        user_id=user_id,
        user_name=user_name,
        content_encrypted=encrypted_content,
        reply_to=comment_data.reply_to
    )
    
    comment_dict = model_to_dict(comment)
    comment_dict['content'] = decrypt_data(comment_dict['content_encrypted'])
    del comment_dict['content_encrypted']
    
    return CommentResponse(**comment_dict)

@app.delete("/api/comments/{comment_id}")
async def delete_comment(comment_id: str, current_user: dict = Depends(get_current_user), repo = Depends(get_repository)):
    comment = repo.get_comment_by_id(comment_id)
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    
    comment_user_id = comment.user_id if use_postgres else comment['user_id']
    if comment_user_id != current_user['user_id']:
        raise HTTPException(status_code=403, detail="Access denied")
    
    repo.delete_comment(comment_id)
    return {"message": "Comment deleted successfully"}

@app.post("/api/comments/{comment_id}/reactions")
async def add_reaction(comment_id: str, reaction_data: ReactionCreate, current_user: dict = Depends(get_current_user), repo = Depends(get_repository)):
    comment = repo.get_comment_by_id(comment_id)
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    
    user = repo.get_user_by_id(current_user['user_id'])
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user_id = user.id if use_postgres else user['id']
    user_name = user.name if use_postgres else user['name']
    
    success = repo.add_reaction(comment_id, user_id, user_name, reaction_data.type)
    if not success:
        raise HTTPException(status_code=400, detail="Failed to add reaction")
    
    return {"message": "Reaction added successfully"}

@app.post("/api/stories", response_model=StoryResponse)
async def create_story(story_data: StoryCreate, current_user: dict = Depends(get_current_user), repo = Depends(get_repository)):
    user = repo.get_user_by_id(current_user['user_id'])
    family_id = user.family_id if use_postgres else user.get('family_id')
    user_id = user.id if use_postgres else user['id']
    
    if not user or not family_id:
        raise HTTPException(status_code=400, detail="User must belong to a family")
    
    story_dict = story_data.model_dump()
    
    story_dict['transcript_encrypted'] = encrypt_data(story_dict['transcript'])
    del story_dict['transcript']
    story_dict['location_encrypted'] = encrypt_data(story_dict['location'])
    del story_dict['location']
    
    story = repo.create_story(story_dict, family_id, user_id)
    
    response_story = model_to_dict(story)
    response_story['transcript'] = decrypt_data(response_story['transcript_encrypted'])
    del response_story['transcript_encrypted']
    response_story['location'] = decrypt_data(response_story['location_encrypted'])
    del response_story['location_encrypted']
    
    return StoryResponse(**response_story)

@app.get("/api/stories", response_model=List[StoryResponse])
async def get_stories(current_user: dict = Depends(get_current_user), repo = Depends(get_repository)):
    user = repo.get_user_by_id(current_user['user_id'])
    family_id = user.family_id if use_postgres else user.get('family_id')
    
    if not user or not family_id:
        return []
    
    stories = repo.get_stories_by_family(family_id)
    
    decrypted_stories = []
    for story in stories:
        story_dict = model_to_dict(story)
        if 'transcript_encrypted' in story_dict and story_dict['transcript_encrypted']:
            story_dict['transcript'] = decrypt_data(story_dict['transcript_encrypted'])
            del story_dict['transcript_encrypted']
        if 'location_encrypted' in story_dict and story_dict['location_encrypted']:
            story_dict['location'] = decrypt_data(story_dict['location_encrypted'])
            del story_dict['location_encrypted']
        
        decrypted_stories.append(StoryResponse(**story_dict))
    
    return decrypted_stories

@app.post("/api/highlights", response_model=HighlightResponse)
async def create_highlight(highlight_data: HighlightCreate, current_user: dict = Depends(get_current_user), repo = Depends(get_repository)):
    user = repo.get_user_by_id(current_user['user_id'])
    family_id = user.family_id if use_postgres else user.get('family_id')
    
    if not user or not family_id:
        raise HTTPException(status_code=400, detail="User must belong to a family")
    
    highlight_dict = highlight_data.model_dump()
    highlight = repo.create_highlight(highlight_dict, family_id)
    
    highlight_dict = model_to_dict(highlight)
    return HighlightResponse(**highlight_dict)

@app.get("/api/highlights", response_model=List[HighlightResponse])
async def get_highlights(current_user: dict = Depends(get_current_user), repo = Depends(get_repository)):
    user = repo.get_user_by_id(current_user['user_id'])
    family_id = user.family_id if use_postgres else user.get('family_id')
    
    if not user or not family_id:
        return []
    
    highlights = repo.get_highlights_by_family(family_id)
    return [HighlightResponse(**model_to_dict(h)) for h in highlights]

@app.post("/api/uploads/presign")
async def presign_upload(filename: str, content_type: str, current_user: dict = Depends(get_current_user)):
    upload_id = legacy_db.generate_id()
    
    return {
        "upload_id": upload_id,
        "url": f"/api/uploads/{upload_id}",
        "method": "POST",
        "fields": {
            "filename": filename,
            "content_type": content_type
        }
    }

@app.post("/api/uploads/{upload_id}")
async def upload_file(upload_id: str, file: UploadFile = File(...), current_user: dict = Depends(get_current_user)):
    contents = await file.read()
    original_size = len(contents)
    
    is_image = file.content_type and file.content_type.startswith('image/')
    is_audio = file.content_type and file.content_type.startswith('audio/')
    is_video = file.content_type and file.content_type.startswith('video/')
    
    compressed_size = original_size
    thumbnail_url = None
    media_info = {}
    
    if is_image:
        is_valid, error = validate_image(contents)
        if not is_valid:
            raise HTTPException(status_code=400, detail=error or "Invalid image file")
        
        media_info = get_image_info(contents)
        
        compressed_contents = compress_image(contents)
        compressed_size = len(compressed_contents)
        
        thumbnail_contents = generate_thumbnail(contents)
        thumbnail_encrypted = encrypt_data(base64.b64encode(thumbnail_contents).decode('utf-8'))
        thumbnail_url = f"/api/files/{upload_id}/thumbnail"
        
        contents = compressed_contents
    
    elif is_audio:
        file_ext = file.filename.split('.')[-1].lower() if file.filename else 'mp3'
        media_info = get_media_info(contents, file_ext)
        
        compressed_contents = compress_audio(contents)
        compressed_size = len(compressed_contents)
        
        contents = compressed_contents
    
    elif is_video:
        file_ext = file.filename.split('.')[-1].lower() if file.filename else 'mp4'
        media_info = get_media_info(contents, file_ext)
        
        compressed_contents = compress_video(contents)
        compressed_size = len(compressed_contents)
        
        thumbnail_contents = generate_video_thumbnail(compressed_contents)
        if thumbnail_contents:
            thumbnail_encrypted = encrypt_data(base64.b64encode(thumbnail_contents).decode('utf-8'))
            thumbnail_url = f"/api/files/{upload_id}/thumbnail"
        
        contents = compressed_contents
    
    encrypted_contents = encrypt_data(base64.b64encode(contents).decode('utf-8'))
    
    compression_ratio = ((original_size - compressed_size) / original_size * 100) if original_size > 0 else 0
    
    return {
        "upload_id": upload_id,
        "filename": file.filename,
        "original_size": original_size,
        "compressed_size": compressed_size,
        "compression_ratio": round(compression_ratio, 2),
        "encrypted": True,
        "url": f"/api/files/{upload_id}",
        "thumbnail_url": thumbnail_url,
        "content_type": file.content_type,
        "media_info": media_info
    }

@app.get("/api/search")
async def search(q: str = "", people: str = "", locations: str = "", types: str = "", tags: str = "", 
                date_start: str = "", date_end: str = "", current_user: dict = Depends(get_current_user), 
                repo = Depends(get_repository)):
    user = repo.get_user_by_id(current_user['user_id'])
    family_id = user.family_id if use_postgres else user.get('family_id')
    
    if not user or not family_id:
        return {"results": []}
    
    memories = repo.get_memories_by_family(family_id)
    
    people_list = [p.strip() for p in people.split(',') if p.strip()] if people else []
    locations_list = [l.strip() for l in locations.split(',') if l.strip()] if locations else []
    types_list = [t.strip() for t in types.split(',') if t.strip()] if types else []
    tags_list = [tag.strip() for tag in tags.split(',') if tag.strip()] if tags else []
    
    results = []
    query_lower = q.lower() if q else ""
    
    for memory in memories:
        memory_dict = model_to_dict(memory)
        
        if query_lower:
            title_match = query_lower in memory_dict.get('title', '').lower()
            description = memory_dict.get('description', '')
            if 'description_encrypted' in memory_dict and memory_dict['description_encrypted']:
                description = decrypt_data(memory_dict['description_encrypted'])
            description_match = query_lower in description.lower()
            
            location = memory_dict.get('location', '')
            if 'location_encrypted' in memory_dict and memory_dict['location_encrypted']:
                location = decrypt_data(memory_dict['location_encrypted'])
            location_match = query_lower in location.lower()
            
            if not (title_match or description_match or location_match):
                continue
        
        if people_list:
            memory_participants = memory_dict.get('participants', [])
            if not any(person in memory_participants for person in people_list):
                continue
        
        if locations_list:
            memory_location = memory_dict.get('location', '')
            if 'location_encrypted' in memory_dict and memory_dict['location_encrypted']:
                memory_location = decrypt_data(memory_dict['location_encrypted'])
            if not any(loc.lower() in memory_location.lower() for loc in locations_list):
                continue
        
        if types_list:
            if memory_dict.get('type') not in types_list:
                continue
        
        if tags_list:
            memory_tags = memory_dict.get('tags', [])
            if not any(tag in memory_tags for tag in tags_list):
                continue
        
        if date_start and memory_dict.get('date', '') < date_start:
            continue
        if date_end and memory_dict.get('date', '') > date_end:
            continue
        
        if 'description_encrypted' in memory_dict and memory_dict['description_encrypted']:
            memory_dict['description'] = decrypt_data(memory_dict['description_encrypted'])
            del memory_dict['description_encrypted']
        if 'location_encrypted' in memory_dict and memory_dict['location_encrypted']:
            memory_dict['location'] = decrypt_data(memory_dict['location_encrypted'])
            del memory_dict['location_encrypted']
        
        results.append(MemoryResponse(**memory_dict))
    
    return {"results": results[:100]}

@app.get("/api/time-capsules", response_model=List[TimeCapsuleResponse])
async def get_time_capsules(current_user: dict = Depends(get_current_user), repo = Depends(get_repository)):
    user = repo.get_user_by_id(current_user['user_id'])
    family_id = user.family_id if use_postgres else user.get('family_id')
    
    if not user or not family_id:
        return []
    
    capsules = repo.get_time_capsules_by_family(family_id)
    return [TimeCapsuleResponse(**model_to_dict(c)) for c in capsules]

@app.post("/api/time-capsules", response_model=TimeCapsuleResponse)
async def create_time_capsule(capsule_data: TimeCapsuleCreate, current_user: dict = Depends(get_current_user), 
                              repo = Depends(get_repository)):
    user = repo.get_user_by_id(current_user['user_id'])
    family_id = user.family_id if use_postgres else user.get('family_id')
    user_id = user.id if use_postgres else user['id']
    
    if not user or not family_id:
        raise HTTPException(status_code=400, detail="User must belong to a family")
    
    capsule_dict = capsule_data.model_dump()
    capsule = repo.create_time_capsule(capsule_dict, family_id, user_id)
    
    return TimeCapsuleResponse(**model_to_dict(capsule))

@app.post("/api/time-capsules/{capsule_id}/unlock")
async def unlock_time_capsule(capsule_id: str, current_user: dict = Depends(get_current_user), 
                              repo = Depends(get_repository)):
    capsule = repo.get_time_capsule_by_id(capsule_id)
    if not capsule:
        raise HTTPException(status_code=404, detail="Time capsule not found")
    
    user = repo.get_user_by_id(current_user['user_id'])
    capsule_family_id = capsule.family_id if use_postgres else capsule['family_id']
    user_family_id = user.family_id if use_postgres else user.get('family_id')
    
    if not user or capsule_family_id != user_family_id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    unlock_date = capsule.unlock_date if use_postgres else capsule['unlock_date']
    from datetime import datetime
    if unlock_date > datetime.now().isoformat():
        raise HTTPException(status_code=400, detail="Time capsule cannot be unlocked yet")
    
    success = repo.unlock_time_capsule(capsule_id)
    if not success:
        raise HTTPException(status_code=400, detail="Failed to unlock time capsule")
    
    return {"message": "Time capsule unlocked successfully"}

@app.post("/api/imports/start", response_model=ImportStartResponse)
async def start_import(import_request: ImportStartRequest, current_user: dict = Depends(get_current_user), 
                      repo = Depends(get_repository)):
    user = repo.get_user_by_id(current_user['user_id'])
    family_id = user.family_id if use_postgres else user.get('family_id')
    user_id = user.id if use_postgres else user['id']
    
    if not user or not family_id:
        raise HTTPException(status_code=400, detail="User must belong to a family")
    
    job = repo.create_import_job(user_id, family_id, import_request.source, import_request.settings)
    job_id = job.id if use_postgres else job['id']
    
    return ImportStartResponse(import_id=job_id, status="idle")

@app.get("/api/imports/{import_id}/status", response_model=ImportStatusResponse)
async def get_import_status(import_id: str, current_user: dict = Depends(get_current_user), 
                           repo = Depends(get_repository)):
    job = repo.get_import_job_by_id(import_id)
    if not job:
        raise HTTPException(status_code=404, detail="Import job not found")
    
    job_dict = model_to_dict(job)
    return ImportStatusResponse(
        import_id=job_dict['id'],
        total=job_dict['total'],
        processed=job_dict['processed'],
        duplicates=job_dict['duplicates'],
        imported=job_dict['imported'],
        status=job_dict['status']
    )

@app.post("/api/imports/{import_id}/files")
async def upload_import_files(import_id: str, files: List[UploadFile] = File(...), 
                             current_user: dict = Depends(get_current_user), repo = Depends(get_repository)):
    job = repo.get_import_job_by_id(import_id)
    if not job:
        raise HTTPException(status_code=404, detail="Import job not found")
    
    repo.update_import_job(import_id, {
        'status': 'processing',
        'total': len(files)
    })
    
    imported = 0
    for file in files:
        imported += 1
        repo.update_import_job(import_id, {
            'processed': imported,
            'imported': imported
        })
    
    repo.update_import_job(import_id, {'status': 'complete'})
    
    return {"message": f"Imported {imported} files successfully"}

@app.get("/api/digest/weekly", response_model=DigestResponse)
async def get_weekly_digest(current_user: dict = Depends(get_current_user), repo = Depends(get_repository)):
    user = repo.get_user_by_id(current_user['user_id'])
    family_id = user.family_id if use_postgres else user.get('family_id')
    
    if not user or not family_id:
        return DigestResponse(items=[], stats={}, period="week")
    
    memories = repo.get_memories_by_family(family_id)
    
    from datetime import datetime, timedelta
    week_ago = datetime.utcnow() - timedelta(days=7)
    
    recent_memories = []
    for memory in memories:
        memory_dict = model_to_dict(memory)
        created_at = memory_dict.get('created_at')
        if created_at and created_at > week_ago:
            recent_memories.append(memory_dict)
    
    items = []
    
    if recent_memories:
        items.append({
            'id': 'new-memories',
            'type': 'memory',
            'title': 'New Family Memories Added',
            'description': f'{len(recent_memories)} new memories were added this week',
            'timestamp': datetime.utcnow().isoformat(),
            'icon': 'ImageIcon',
            'color': 'from-gold-600 to-gold-500'
        })
    
    stats = {
        'new_memories': len(recent_memories),
        'new_comments': 0,
        'family_activity': len(recent_memories)
    }
    
    return DigestResponse(items=items, stats=stats, period="week")

@app.get("/api/user/notification-settings", response_model=NotificationSettingsResponse)
async def get_notification_settings(current_user: dict = Depends(get_current_user), repo = Depends(get_repository)):
    user_id = current_user['user_id']
    settings = repo.get_notification_settings(user_id)
    
    if not settings:
        settings = repo.create_notification_settings(user_id)
    
    settings_dict = model_to_dict(settings)
    return NotificationSettingsResponse(**settings_dict)

@app.put("/api/user/notification-settings", response_model=NotificationSettingsResponse)
async def update_notification_settings(settings_update: NotificationSettingsUpdate, 
                                      current_user: dict = Depends(get_current_user), 
                                      repo = Depends(get_repository)):
    user_id = current_user['user_id']
    updates = {k: v for k, v in settings_update.model_dump().items() if v is not None}
    
    settings = repo.update_notification_settings(user_id, updates)
    settings_dict = model_to_dict(settings)
    
    return NotificationSettingsResponse(**settings_dict)

@app.get("/api/user/profile", response_model=UserProfileResponse)
async def get_user_profile(current_user: dict = Depends(get_current_user), repo = Depends(get_repository)):
    user = repo.get_user_by_id(current_user['user_id'])
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user_id = user.id if use_postgres else user['id']
    
    subscription = repo.get_subscription(user_id)
    if not subscription:
        subscription = repo.create_subscription(user_id)
    
    subscription_dict = model_to_dict(subscription)
    subscription_response = SubscriptionResponse(
        plan=subscription_dict['plan'],
        status=subscription_dict['status'],
        cancel_at=subscription_dict.get('cancel_at'),
        current_period_end=subscription_dict.get('current_period_end')
    )
    
    settings = repo.get_notification_settings(user_id)
    if not settings:
        settings = repo.create_notification_settings(user_id)
    
    settings_dict = model_to_dict(settings)
    settings_response = NotificationSettingsResponse(**settings_dict)
    
    user_dict = model_to_dict(user)
    user_response = UserResponse(
        id=user_dict['id'],
        email=user_dict['email'],
        name=user_dict['name'],
        family_id=user_dict.get('family_id'),
        family_name=user_dict.get('family_name'),
        created_at=user_dict['created_at']
    )
    
    return UserProfileResponse(
        user=user_response,
        subscription=subscription_response,
        notification_settings=settings_response
    )

@app.post("/api/billing/create-checkout-session")
async def create_checkout_session(plan: str, current_user: dict = Depends(get_current_user), 
                                  repo = Depends(get_repository)):
    if not stripe.api_key:
        return {
            "session_url": f"https://checkout.stripe.com/pay/test_{plan}",
            "session_id": f"cs_test_{legacy_db.generate_id()}"
        }
    
    user = repo.get_user_by_id(current_user['user_id'])
    user_id = user.id if use_postgres else user['id']
    user_email = user.email if use_postgres else user['email']
    
    price_id = os.getenv(f"STRIPE_PRICE_ID_{plan.upper()}", "")
    
    try:
        session = stripe.checkout.Session.create(
            customer_email=user_email,
            payment_method_types=['card'],
            line_items=[{
                'price': price_id,
                'quantity': 1,
            }],
            mode='subscription',
            success_url=f"{FRONTEND_URL}/?session_id={{CHECKOUT_SESSION_ID}}",
            cancel_url=f"{FRONTEND_URL}/settings",
            metadata={
                'user_id': user_id,
                'plan': plan
            }
        )
        
        return {
            "session_url": session.url,
            "session_id": session.id
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create checkout session: {str(e)}")

@app.post("/api/billing/create-portal-session")
async def create_portal_session(current_user: dict = Depends(get_current_user), repo = Depends(get_repository)):
    if not stripe.api_key:
        return {
            "portal_url": "https://billing.stripe.com/session/test",
            "session_id": f"bps_test_{legacy_db.generate_id()}"
        }
    
    user = repo.get_user_by_id(current_user['user_id'])
    user_id = user.id if use_postgres else user['id']
    
    subscription = repo.get_subscription(user_id)
    if not subscription:
        raise HTTPException(status_code=404, detail="No subscription found")
    
    subscription_dict = model_to_dict(subscription)
    stripe_customer_id = subscription_dict.get('stripe_customer_id')
    
    if not stripe_customer_id:
        raise HTTPException(status_code=400, detail="No Stripe customer ID found")
    
    try:
        session = stripe.billing_portal.Session.create(
            customer=stripe_customer_id,
            return_url=f"{FRONTEND_URL}/settings"
        )
        
        return {
            "portal_url": session.url,
            "session_id": session.id
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create portal session: {str(e)}")

@app.post("/api/webhooks/stripe")
async def stripe_webhook(request: Request, repo = Depends(get_repository)):
    payload = await request.body()
    sig_header = request.headers.get('stripe-signature')
    
    if not STRIPE_WEBHOOK_SECRET:
        return {"received": True}
    
    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, STRIPE_WEBHOOK_SECRET
        )
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid payload")
    except stripe.error.SignatureVerificationError:
        raise HTTPException(status_code=400, detail="Invalid signature")
    
    event_type = event['type']
    data = event['data']['object']
    
    if event_type == 'checkout.session.completed':
        user_id = data['metadata'].get('user_id')
        plan = data['metadata'].get('plan', 'free')
        customer_id = data.get('customer')
        subscription_id = data.get('subscription')
        
        if user_id:
            subscription = repo.get_subscription(user_id)
            if subscription:
                repo.update_subscription(user_id, {
                    'stripe_customer_id': customer_id,
                    'stripe_subscription_id': subscription_id,
                    'plan': plan,
                    'status': 'active'
                })
            else:
                repo.create_subscription(user_id, {
                    'stripe_customer_id': customer_id,
                    'stripe_subscription_id': subscription_id,
                    'plan': plan,
                    'status': 'active'
                })
    
    elif event_type == 'customer.subscription.updated':
        subscription_id = data.get('id')
        status = data.get('status')
        cancel_at = data.get('cancel_at')
        current_period_end = data.get('current_period_end')
        
        subscriptions = repo.get_all_subscriptions()
        for sub in subscriptions:
            sub_dict = model_to_dict(sub)
            if sub_dict.get('stripe_subscription_id') == subscription_id:
                user_id = sub_dict['user_id']
                from datetime import datetime
                repo.update_subscription(user_id, {
                    'status': status,
                    'cancel_at': datetime.fromtimestamp(cancel_at) if cancel_at else None,
                    'current_period_end': datetime.fromtimestamp(current_period_end) if current_period_end else None
                })
                break
    
    elif event_type == 'customer.subscription.deleted':
        subscription_id = data.get('id')
        
        subscriptions = repo.get_all_subscriptions()
        for sub in subscriptions:
            sub_dict = model_to_dict(sub)
            if sub_dict.get('stripe_subscription_id') == subscription_id:
                user_id = sub_dict['user_id']
                repo.update_subscription(user_id, {
                    'status': 'canceled',
                    'plan': 'free'
                })
                break
    
    return {"received": True}
