from fastapi import FastAPI, HTTPException, Depends, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List, Optional
import base64
import os

from app.models import (
    UserRegister, UserLogin, UserResponse,
    MemoryCreate, MemoryResponse,
    CommentCreate, CommentResponse,
    ReactionCreate,
    StoryCreate, StoryResponse,
    HighlightCreate, HighlightResponse
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
async def search(q: str, current_user: dict = Depends(get_current_user), repo = Depends(get_repository)):
    user = repo.get_user_by_id(current_user['user_id'])
    family_id = user.family_id if use_postgres else user.get('family_id')
    
    if not user or not family_id:
        return {"results": []}
    
    memories = repo.get_memories_by_family(family_id)
    
    results = []
    query_lower = q.lower()
    for memory in memories:
        memory_dict = model_to_dict(memory)
        title_match = query_lower in memory_dict.get('title', '').lower()
        
        description = memory_dict.get('description', '')
        if 'description_encrypted' in memory_dict and memory_dict['description_encrypted']:
            description = decrypt_data(memory_dict['description_encrypted'])
        description_match = query_lower in description.lower()
        
        if title_match or description_match:
            results.append({
                "id": memory_dict['id'],
                "title": memory_dict['title'],
                "type": memory_dict['type'],
                "date": memory_dict['date']
            })
    
    return {"results": results[:20]}
