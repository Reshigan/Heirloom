import io
import base64
import os
import tempfile
import subprocess
from PIL import Image
from typing import Tuple, Optional

MAX_IMAGE_SIZE = (1920, 1920)
THUMBNAIL_SIZE = (200, 200)
JPEG_QUALITY = 85
THUMBNAIL_QUALITY = 70

AUDIO_BITRATE = '128k'
VIDEO_BITRATE = '2M'
VIDEO_MAX_WIDTH = 1920
VIDEO_MAX_HEIGHT = 1080
VIDEO_CRF = 23

def compress_image(image_data: bytes, max_size: Tuple[int, int] = MAX_IMAGE_SIZE, quality: int = JPEG_QUALITY) -> bytes:
    """
    Compress an image to reduce file size while maintaining quality.
    Converts to JPEG format and resizes if necessary.
    """
    try:
        img = Image.open(io.BytesIO(image_data))
        
        if img.mode in ('RGBA', 'LA', 'P'):
            background = Image.new('RGB', img.size, (255, 255, 255))
            if img.mode == 'P':
                img = img.convert('RGBA')
            background.paste(img, mask=img.split()[-1] if img.mode in ('RGBA', 'LA') else None)
            img = background
        elif img.mode != 'RGB':
            img = img.convert('RGB')
        
        img.thumbnail(max_size, Image.Resampling.LANCZOS)
        
        output = io.BytesIO()
        img.save(output, format='JPEG', quality=quality, optimize=True)
        output.seek(0)
        
        return output.read()
    except Exception as e:
        print(f"Image compression error: {e}")
        return image_data

def generate_thumbnail(image_data: bytes, size: Tuple[int, int] = THUMBNAIL_SIZE) -> bytes:
    """
    Generate a thumbnail from an image.
    """
    try:
        img = Image.open(io.BytesIO(image_data))
        
        if img.mode in ('RGBA', 'LA', 'P'):
            background = Image.new('RGB', img.size, (255, 255, 255))
            if img.mode == 'P':
                img = img.convert('RGBA')
            background.paste(img, mask=img.split()[-1] if img.mode in ('RGBA', 'LA') else None)
            img = background
        elif img.mode != 'RGB':
            img = img.convert('RGB')
        
        img.thumbnail(size, Image.Resampling.LANCZOS)
        
        output = io.BytesIO()
        img.save(output, format='JPEG', quality=THUMBNAIL_QUALITY, optimize=True)
        output.seek(0)
        
        return output.read()
    except Exception as e:
        print(f"Thumbnail generation error: {e}")
        return image_data

def validate_image(image_data: bytes) -> Tuple[bool, Optional[str]]:
    """
    Validate that the data is a valid image.
    Returns (is_valid, error_message)
    """
    try:
        img = Image.open(io.BytesIO(image_data))
        img.verify()
        return (True, None)
    except Exception as e:
        return (False, f"Invalid image: {str(e)}")

def get_image_info(image_data: bytes) -> dict:
    """
    Get information about an image.
    """
    try:
        img = Image.open(io.BytesIO(image_data))
        return {
            "format": img.format,
            "mode": img.mode,
            "size": img.size,
            "width": img.width,
            "height": img.height
        }
    except Exception as e:
        return {"error": str(e)}

def compress_audio(audio_data: bytes, output_format: str = 'mp3', bitrate: str = AUDIO_BITRATE) -> bytes:
    """
    Compress audio to reduce file size.
    Converts to MP3 or AAC format with specified bitrate.
    """
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix='.input') as input_file:
            input_file.write(audio_data)
            input_path = input_file.name
        
        output_path = input_path.replace('.input', f'.{output_format}')
        
        cmd = [
            'ffmpeg', '-y', '-i', input_path,
            '-codec:a', 'libmp3lame' if output_format == 'mp3' else 'aac',
            '-b:a', bitrate,
            '-ar', '44100',
            '-ac', '2',
            output_path
        ]
        
        result = subprocess.run(cmd, capture_output=True, text=True)
        
        if result.returncode != 0:
            print(f"Audio compression error: {result.stderr}")
            os.unlink(input_path)
            return audio_data
        
        with open(output_path, 'rb') as f:
            compressed_data = f.read()
        
        os.unlink(input_path)
        os.unlink(output_path)
        
        return compressed_data
    except Exception as e:
        print(f"Audio compression error: {e}")
        return audio_data

def compress_video(video_data: bytes, max_width: int = VIDEO_MAX_WIDTH, max_height: int = VIDEO_MAX_HEIGHT) -> bytes:
    """
    Compress video to reduce file size.
    Converts to H.264 format with resolution and bitrate limits.
    """
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix='.input') as input_file:
            input_file.write(video_data)
            input_path = input_file.name
        
        output_path = input_path.replace('.input', '.mp4')
        
        cmd = [
            'ffmpeg', '-y', '-i', input_path,
            '-codec:v', 'libx264',
            '-crf', str(VIDEO_CRF),
            '-preset', 'medium',
            '-vf', f'scale=min({max_width}\\,iw):min({max_height}\\,ih):force_original_aspect_ratio=decrease',
            '-codec:a', 'aac',
            '-b:a', AUDIO_BITRATE,
            '-movflags', '+faststart',
            output_path
        ]
        
        result = subprocess.run(cmd, capture_output=True, text=True)
        
        if result.returncode != 0:
            print(f"Video compression error: {result.stderr}")
            os.unlink(input_path)
            return video_data
        
        with open(output_path, 'rb') as f:
            compressed_data = f.read()
        
        os.unlink(input_path)
        os.unlink(output_path)
        
        return compressed_data
    except Exception as e:
        print(f"Video compression error: {e}")
        return video_data

def generate_video_thumbnail(video_data: bytes, timestamp: str = '00:00:01') -> bytes:
    """
    Generate a thumbnail from a video at specified timestamp.
    """
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix='.input') as input_file:
            input_file.write(video_data)
            input_path = input_file.name
        
        output_path = input_path.replace('.input', '.jpg')
        
        cmd = [
            'ffmpeg', '-y', '-i', input_path,
            '-ss', timestamp,
            '-vframes', '1',
            '-vf', f'scale={THUMBNAIL_SIZE[0]}:{THUMBNAIL_SIZE[1]}:force_original_aspect_ratio=decrease',
            '-q:v', '2',
            output_path
        ]
        
        result = subprocess.run(cmd, capture_output=True, text=True)
        
        if result.returncode != 0:
            print(f"Video thumbnail error: {result.stderr}")
            os.unlink(input_path)
            return b''
        
        with open(output_path, 'rb') as f:
            thumbnail_data = f.read()
        
        os.unlink(input_path)
        os.unlink(output_path)
        
        return thumbnail_data
    except Exception as e:
        print(f"Video thumbnail error: {e}")
        return b''

def get_media_info(file_data: bytes, file_type: str) -> dict:
    """
    Get information about audio or video file.
    """
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=f'.{file_type}') as input_file:
            input_file.write(file_data)
            input_path = input_file.name
        
        cmd = [
            'ffprobe', '-v', 'quiet',
            '-print_format', 'json',
            '-show_format', '-show_streams',
            input_path
        ]
        
        result = subprocess.run(cmd, capture_output=True, text=True)
        
        os.unlink(input_path)
        
        if result.returncode != 0:
            return {"error": "Failed to get media info"}
        
        import json
        info = json.loads(result.stdout)
        
        return {
            "format": info.get('format', {}).get('format_name'),
            "duration": float(info.get('format', {}).get('duration', 0)),
            "size": int(info.get('format', {}).get('size', 0)),
            "bitrate": int(info.get('format', {}).get('bit_rate', 0))
        }
    except Exception as e:
        return {"error": str(e)}
