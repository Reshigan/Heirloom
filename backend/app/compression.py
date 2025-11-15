import io
import base64
from PIL import Image
from typing import Tuple, Optional

MAX_IMAGE_SIZE = (1920, 1920)
THUMBNAIL_SIZE = (200, 200)
JPEG_QUALITY = 85
THUMBNAIL_QUALITY = 70

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
