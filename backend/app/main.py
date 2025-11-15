from fastapi import FastAPI, HTTPException, Depends, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
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
from app.compression import compress_image, generate_thumbnail, validate_image, get_image_info
from app import database as db

app = FastAPI(title="Heirloom API", version="1.0.0")

# Disable CORS. Do not remove this for full-stack development.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/healthz")
async def healthz():
    return {"status": "ok", "encryption": "enabled", "database": "in-memory"}

@app.post("/api/auth/register", response_model=UserResponse)
async def register(user_data: UserRegister):
    existing_user = db.get_user_by_email(user_data.email)
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = hash_password(user_data.password)
    
    user = db.create_user(
        email=user_data.email,
        hashed_password=hashed_password,
        name=user_data.name,
        family_name=user_data.family_name
    )
    
    return UserResponse(
        id=user['id'],
        email=user['email'],
        name=user['name'],
        family_id=user.get('family_id'),
        family_name=user.get('family_name'),
        created_at=user['created_at']
    )

@app.post("/api/auth/login")
async def login(credentials: UserLogin):
    user = db.get_user_by_email(credentials.email)
    if not user or not verify_password(credentials.password, user['password']):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    token = create_access_token(user['id'], user['email'])
    
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
async def get_me(current_user: dict = Depends(get_current_user)):
    user = db.get_user_by_id(current_user['user_id'])
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return UserResponse(
        id=user['id'],
        email=user['email'],
        name=user['name'],
        family_id=user.get('family_id'),
        family_name=user.get('family_name'),
        created_at=user['created_at']
    )

@app.get("/api/memories", response_model=List[MemoryResponse])
async def get_memories(current_user: dict = Depends(get_current_user)):
    user = db.get_user_by_id(current_user['user_id'])
    if not user or not user.get('family_id'):
        return []
    
    memories = db.get_memories_by_family(user['family_id'])
    
    decrypted_memories = []
    for memory in memories:
        decrypted_memory = memory.copy()
        if 'description_encrypted' in decrypted_memory:
            decrypted_memory['description'] = decrypt_data(decrypted_memory['description_encrypted'])
            del decrypted_memory['description_encrypted']
        if 'location_encrypted' in decrypted_memory:
            decrypted_memory['location'] = decrypt_data(decrypted_memory['location_encrypted'])
            del decrypted_memory['location_encrypted']
        
        decrypted_memories.append(MemoryResponse(**decrypted_memory))
    
    return decrypted_memories

@app.post("/api/memories", response_model=MemoryResponse)
async def create_memory(memory_data: MemoryCreate, current_user: dict = Depends(get_current_user)):
    user = db.get_user_by_id(current_user['user_id'])
    if not user or not user.get('family_id'):
        raise HTTPException(status_code=400, detail="User must belong to a family")
    
    memory_dict = memory_data.model_dump()
    
    memory_dict['description_encrypted'] = encrypt_data(memory_dict['description'])
    del memory_dict['description']
    memory_dict['location_encrypted'] = encrypt_data(memory_dict['location'])
    del memory_dict['location']
    
    memory_dict['thumbnail'] = None
    memory_dict['ai_enhanced'] = False
    
    memory = db.create_memory(memory_dict, user['family_id'], user['id'])
    
    response_memory = memory.copy()
    response_memory['description'] = decrypt_data(response_memory['description_encrypted'])
    del response_memory['description_encrypted']
    response_memory['location'] = decrypt_data(response_memory['location_encrypted'])
    del response_memory['location_encrypted']
    
    return MemoryResponse(**response_memory)

@app.get("/api/memories/{memory_id}", response_model=MemoryResponse)
async def get_memory(memory_id: str, current_user: dict = Depends(get_current_user)):
    memory = db.get_memory_by_id(memory_id)
    if not memory:
        raise HTTPException(status_code=404, detail="Memory not found")
    
    user = db.get_user_by_id(current_user['user_id'])
    if not user or memory['family_id'] != user.get('family_id'):
        raise HTTPException(status_code=403, detail="Access denied")
    
    decrypted_memory = memory.copy()
    if 'description_encrypted' in decrypted_memory:
        decrypted_memory['description'] = decrypt_data(decrypted_memory['description_encrypted'])
        del decrypted_memory['description_encrypted']
    if 'location_encrypted' in decrypted_memory:
        decrypted_memory['location'] = decrypt_data(decrypted_memory['location_encrypted'])
        del decrypted_memory['location_encrypted']
    
    return MemoryResponse(**decrypted_memory)

@app.put("/api/memories/{memory_id}", response_model=MemoryResponse)
async def update_memory(memory_id: str, memory_data: MemoryCreate, current_user: dict = Depends(get_current_user)):
    memory = db.get_memory_by_id(memory_id)
    if not memory:
        raise HTTPException(status_code=404, detail="Memory not found")
    
    user = db.get_user_by_id(current_user['user_id'])
    if not user or memory['family_id'] != user.get('family_id'):
        raise HTTPException(status_code=403, detail="Access denied")
    
    update_dict = memory_data.model_dump()
    update_dict['description_encrypted'] = encrypt_data(update_dict['description'])
    del update_dict['description']
    update_dict['location_encrypted'] = encrypt_data(update_dict['location'])
    del update_dict['location']
    
    updated_memory = db.update_memory(memory_id, update_dict)
    
    response_memory = updated_memory.copy()
    response_memory['description'] = decrypt_data(response_memory['description_encrypted'])
    del response_memory['description_encrypted']
    response_memory['location'] = decrypt_data(response_memory['location_encrypted'])
    del response_memory['location_encrypted']
    
    return MemoryResponse(**response_memory)

@app.delete("/api/memories/{memory_id}")
async def delete_memory(memory_id: str, current_user: dict = Depends(get_current_user)):
    memory = db.get_memory_by_id(memory_id)
    if not memory:
        raise HTTPException(status_code=404, detail="Memory not found")
    
    user = db.get_user_by_id(current_user['user_id'])
    if not user or memory['family_id'] != user.get('family_id'):
        raise HTTPException(status_code=403, detail="Access denied")
    
    db.delete_memory(memory_id)
    return {"message": "Memory deleted successfully"}

@app.get("/api/memories/{memory_id}/comments", response_model=List[CommentResponse])
async def get_comments(memory_id: str, current_user: dict = Depends(get_current_user)):
    memory = db.get_memory_by_id(memory_id)
    if not memory:
        raise HTTPException(status_code=404, detail="Memory not found")
    
    user = db.get_user_by_id(current_user['user_id'])
    if not user or memory['family_id'] != user.get('family_id'):
        raise HTTPException(status_code=403, detail="Access denied")
    
    comments = db.get_comments_by_memory(memory_id)
    
    decrypted_comments = []
    for comment in comments:
        decrypted_comment = comment.copy()
        if 'content_encrypted' in decrypted_comment:
            decrypted_comment['content'] = decrypt_data(decrypted_comment['content_encrypted'])
            del decrypted_comment['content_encrypted']
        
        replies = [c for c in db.comments_db.values() if c.get('reply_to') == comment['id']]
        decrypted_replies = []
        for reply in replies:
            decrypted_reply = reply.copy()
            if 'content_encrypted' in decrypted_reply:
                decrypted_reply['content'] = decrypt_data(decrypted_reply['content_encrypted'])
                del decrypted_reply['content_encrypted']
            decrypted_replies.append(decrypted_reply)
        
        decrypted_comment['replies'] = decrypted_replies
        decrypted_comments.append(CommentResponse(**decrypted_comment))
    
    return decrypted_comments

@app.post("/api/memories/{memory_id}/comments", response_model=CommentResponse)
async def create_comment(memory_id: str, comment_data: CommentCreate, current_user: dict = Depends(get_current_user)):
    memory = db.get_memory_by_id(memory_id)
    if not memory:
        raise HTTPException(status_code=404, detail="Memory not found")
    
    user = db.get_user_by_id(current_user['user_id'])
    if not user or memory['family_id'] != user.get('family_id'):
        raise HTTPException(status_code=403, detail="Access denied")
    
    encrypted_content = encrypt_data(comment_data.content)
    
    comment = db.create_comment(
        memory_id=memory_id,
        user_id=user['id'],
        user_name=user['name'],
        content=encrypted_content,
        reply_to=comment_data.reply_to
    )
    
    comment['content_encrypted'] = comment['content']
    comment['content'] = decrypt_data(comment['content_encrypted'])
    del comment['content_encrypted']
    
    return CommentResponse(**comment)

@app.delete("/api/comments/{comment_id}")
async def delete_comment(comment_id: str, current_user: dict = Depends(get_current_user)):
    comment = db.get_comment_by_id(comment_id)
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    
    if comment['user_id'] != current_user['user_id']:
        raise HTTPException(status_code=403, detail="Access denied")
    
    db.delete_comment(comment_id)
    return {"message": "Comment deleted successfully"}

@app.post("/api/comments/{comment_id}/reactions")
async def add_reaction(comment_id: str, reaction_data: ReactionCreate, current_user: dict = Depends(get_current_user)):
    comment = db.get_comment_by_id(comment_id)
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    
    user = db.get_user_by_id(current_user['user_id'])
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    success = db.add_reaction(comment_id, user['id'], user['name'], reaction_data.type)
    if not success:
        raise HTTPException(status_code=400, detail="Failed to add reaction")
    
    return {"message": "Reaction added successfully"}

@app.post("/api/stories", response_model=StoryResponse)
async def create_story(story_data: StoryCreate, current_user: dict = Depends(get_current_user)):
    user = db.get_user_by_id(current_user['user_id'])
    if not user or not user.get('family_id'):
        raise HTTPException(status_code=400, detail="User must belong to a family")
    
    story_dict = story_data.model_dump()
    
    story_dict['transcript_encrypted'] = encrypt_data(story_dict['transcript'])
    del story_dict['transcript']
    story_dict['location_encrypted'] = encrypt_data(story_dict['location'])
    del story_dict['location']
    
    story = db.create_story(story_dict, user['family_id'], user['id'])
    
    response_story = story.copy()
    response_story['transcript'] = decrypt_data(response_story['transcript_encrypted'])
    del response_story['transcript_encrypted']
    response_story['location'] = decrypt_data(response_story['location_encrypted'])
    del response_story['location_encrypted']
    
    return StoryResponse(**response_story)

@app.get("/api/stories", response_model=List[StoryResponse])
async def get_stories(current_user: dict = Depends(get_current_user)):
    user = db.get_user_by_id(current_user['user_id'])
    if not user or not user.get('family_id'):
        return []
    
    stories = db.get_stories_by_family(user['family_id'])
    
    decrypted_stories = []
    for story in stories:
        decrypted_story = story.copy()
        if 'transcript_encrypted' in decrypted_story:
            decrypted_story['transcript'] = decrypt_data(decrypted_story['transcript_encrypted'])
            del decrypted_story['transcript_encrypted']
        if 'location_encrypted' in decrypted_story:
            decrypted_story['location'] = decrypt_data(decrypted_story['location_encrypted'])
            del decrypted_story['location_encrypted']
        
        decrypted_stories.append(StoryResponse(**decrypted_story))
    
    return decrypted_stories

@app.post("/api/highlights", response_model=HighlightResponse)
async def create_highlight(highlight_data: HighlightCreate, current_user: dict = Depends(get_current_user)):
    user = db.get_user_by_id(current_user['user_id'])
    if not user or not user.get('family_id'):
        raise HTTPException(status_code=400, detail="User must belong to a family")
    
    highlight_dict = highlight_data.model_dump()
    highlight = db.create_highlight(highlight_dict, user['family_id'])
    
    return HighlightResponse(**highlight)

@app.get("/api/highlights", response_model=List[HighlightResponse])
async def get_highlights(current_user: dict = Depends(get_current_user)):
    user = db.get_user_by_id(current_user['user_id'])
    if not user or not user.get('family_id'):
        return []
    
    highlights = db.get_highlights_by_family(user['family_id'])
    return [HighlightResponse(**h) for h in highlights]

@app.post("/api/uploads/presign")
async def presign_upload(filename: str, content_type: str, current_user: dict = Depends(get_current_user)):
    upload_id = db.generate_id()
    
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
    compressed_size = original_size
    thumbnail_url = None
    
    if is_image:
        is_valid, error = validate_image(contents)
        if not is_valid:
            raise HTTPException(status_code=400, detail=error or "Invalid image file")
        
        image_info = get_image_info(contents)
        
        compressed_contents = compress_image(contents)
        compressed_size = len(compressed_contents)
        
        thumbnail_contents = generate_thumbnail(contents)
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
        "content_type": file.content_type
    }

@app.get("/api/search")
async def search(q: str, current_user: dict = Depends(get_current_user)):
    user = db.get_user_by_id(current_user['user_id'])
    if not user or not user.get('family_id'):
        return {"results": []}
    
    memories = db.get_memories_by_family(user['family_id'])
    
    results = []
    query_lower = q.lower()
    for memory in memories:
        title_match = query_lower in memory.get('title', '').lower()
        
        description = memory.get('description', '')
        if 'description_encrypted' in memory:
            description = decrypt_data(memory['description_encrypted'])
        description_match = query_lower in description.lower()
        
        if title_match or description_match:
            results.append({
                "id": memory['id'],
                "title": memory['title'],
                "type": memory['type'],
                "date": memory['date']
            })
    
    return {"results": results[:20]}
