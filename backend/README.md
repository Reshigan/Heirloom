# Heirloom Backend

FastAPI backend with PostgreSQL database, encryption, and media compression.

## Features

- **Authentication**: JWT-based auth with PBKDF2 password hashing
- **Encryption**: AES-GCM encryption for all sensitive data at rest
- **Media Compression**: Automatic compression for images (60-80%), audio (50-70%), and video (60-80%)
- **Database**: PostgreSQL with SQLAlchemy ORM (falls back to in-memory for development)
- **API**: RESTful API with FastAPI

## Prerequisites

- Python 3.12+
- PostgreSQL 14+ (optional, will use in-memory if not available)
- FFmpeg (required for audio/video compression)
- Poetry (for dependency management)

## Installation

### 1. Install Dependencies

```bash
# Install Poetry if you don't have it
curl -sSL https://install.python-poetry.org | python3 -

# Install project dependencies
poetry install
```

### 2. Install FFmpeg

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install -y ffmpeg
```

**macOS:**
```bash
brew install ffmpeg
```

**Verify installation:**
```bash
ffmpeg -version
```

### 3. Set Up PostgreSQL (Optional)

If you want persistent data storage:

```bash
# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Create database and user
sudo -u postgres psql
```

In PostgreSQL shell:
```sql
CREATE DATABASE heirloom;
CREATE USER heirloom WITH PASSWORD 'heirloom';
GRANT ALL PRIVILEGES ON DATABASE heirloom TO heirloom;
\q
```

### 4. Configure Environment

```bash
# Copy example environment file
cp .env.example .env

# Edit .env and set your configuration
nano .env
```

**Important:** Change the `ENCRYPTION_KEY` and `JWT_SECRET` in production!

Generate secure keys:
```bash
# Generate encryption key (32 bytes, base64 encoded)
python3 -c "import os, base64; print(base64.b64encode(os.urandom(32)).decode())"

# Generate JWT secret (random string)
python3 -c "import secrets; print(secrets.token_urlsafe(64))"
```

### 5. Initialize Database

```bash
# Run database initialization script
poetry run python init_db.py
```

## Running the Server

### Development Mode

```bash
# Run with auto-reload
poetry run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Production Mode

```bash
# Run with Gunicorn and Uvicorn workers
poetry run gunicorn app.main:app \
  -k uvicorn.workers.UvicornWorker \
  -w 4 \
  -b 0.0.0.0:8000 \
  --access-logfile - \
  --error-logfile -
```

## API Endpoints

### Health Check
- `GET /healthz` - Check server status and database type

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login and get JWT token
- `GET /api/auth/me` - Get current user info

### Memories
- `GET /api/memories` - List all memories for user's family
- `POST /api/memories` - Create new memory
- `GET /api/memories/{id}` - Get specific memory
- `PUT /api/memories/{id}` - Update memory
- `DELETE /api/memories/{id}` - Delete memory

### Comments & Reactions
- `GET /api/memories/{id}/comments` - Get comments for memory
- `POST /api/memories/{id}/comments` - Add comment to memory
- `DELETE /api/comments/{id}` - Delete comment
- `POST /api/comments/{id}/reactions` - Add/remove reaction

### Stories
- `GET /api/stories` - List all stories for user's family
- `POST /api/stories` - Create new story

### Highlights & Time Capsules
- `GET /api/highlights` - List all highlights for user's family
- `POST /api/highlights` - Create new highlight

### File Uploads
- `POST /api/uploads/presign` - Get presigned upload URL
- `POST /api/uploads/{id}` - Upload and compress file

### Search
- `GET /api/search?q={query}` - Search memories by title/description

## Database Schema

### Tables
- `users` - User accounts
- `families` - Family groups
- `memories` - Memory records with encrypted data
- `comments` - Comments on memories with encrypted content
- `stories` - Voice-recorded stories with encrypted transcripts
- `highlights` - Auto-generated highlights and time capsules

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://heirloom:heirloom@localhost/heirloom` |
| `USE_POSTGRES` | Enable PostgreSQL (true/false) | `true` |
| `ENCRYPTION_KEY` | Base64-encoded 32-byte key for AES-GCM | Required |
| `JWT_SECRET` | Secret key for JWT tokens | Required |
| `HOST` | Server host | `0.0.0.0` |
| `PORT` | Server port | `8000` |

## Security Notes

1. **Never commit `.env` file** - It contains sensitive keys
2. **Change default keys in production** - Use strong, randomly generated keys
3. **Use HTTPS in production** - Never send tokens over HTTP
4. **Rotate keys periodically** - Implement key rotation strategy
5. **Limit file upload sizes** - Configure nginx/proxy limits

## Troubleshooting

### FFmpeg not found
```bash
# Check if FFmpeg is installed
which ffmpeg

# If not installed, install it
sudo apt install -y ffmpeg
```

### Database connection errors
```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Check connection
psql -U heirloom -d heirloom -h localhost
```

### Permission errors
```bash
# Make sure database user has correct permissions
sudo -u postgres psql
GRANT ALL PRIVILEGES ON DATABASE heirloom TO heirloom;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO heirloom;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO heirloom;
```

## Development

### Running Tests
```bash
# Run tests (when implemented)
poetry run pytest
```

### Code Formatting
```bash
# Format code with black
poetry run black app/

# Lint with flake8
poetry run flake8 app/
```

## Architecture

### Encryption
- All sensitive data (descriptions, locations, transcripts, comments) is encrypted at rest using AES-GCM
- Encryption key is stored in environment variables
- Data is encrypted before storage and decrypted on retrieval

### Media Compression
- **Images**: Resized to max 1920px, compressed to JPEG with quality 85, generates thumbnails
- **Audio**: Converted to MP3 at 128kbps
- **Video**: Converted to H.264 at 1080p max with CRF 23

### Database
- PostgreSQL for production with persistent storage
- In-memory fallback for development/testing
- SQLAlchemy ORM with repository pattern
- Automatic table creation on startup

## License

Proprietary - All rights reserved
