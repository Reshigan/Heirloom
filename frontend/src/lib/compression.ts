export interface CompressionOptions {
  maxSizeMB: number
  maxWidthOrHeight: number
  useWebWorker?: boolean
  quality?: number
}

export interface CompressionResult {
  file: File
  originalSize: number
  compressedSize: number
  compressionRatio: number
}

const DEFAULT_OPTIONS: CompressionOptions = {
  maxSizeMB: 2,
  maxWidthOrHeight: 1920,
  useWebWorker: false,
  quality: 0.8
}

export async function compressImage(
  file: File,
  options: Partial<CompressionOptions> = {}
): Promise<CompressionResult> {
  const opts = { ...DEFAULT_OPTIONS, ...options }
  const originalSize = file.size

  try {
    const compressedFile = await compressImageFile(file, opts)
    const compressedSize = compressedFile.size
    const compressionRatio = ((originalSize - compressedSize) / originalSize) * 100

    return {
      file: compressedFile,
      originalSize,
      compressedSize,
      compressionRatio
    }
  } catch (error) {
    console.error('Compression failed:', error)
    return {
      file,
      originalSize,
      compressedSize: originalSize,
      compressionRatio: 0
    }
  }
}

async function compressImageFile(
  file: File,
  options: CompressionOptions
): Promise<File> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = (e) => {
      const img = new Image()
      
      img.onload = () => {
        const canvas = document.createElement('canvas')
        let { width, height } = img
        
        const maxDimension = options.maxWidthOrHeight
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = (height / width) * maxDimension
            width = maxDimension
          } else {
            width = (width / height) * maxDimension
            height = maxDimension
          }
        }
        
        canvas.width = width
        canvas.height = height
        
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject(new Error('Failed to get canvas context'))
          return
        }
        
        ctx.drawImage(img, 0, 0, width, height)
        
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Failed to create blob'))
              return
            }
            
            const targetSizeBytes = options.maxSizeMB * 1024 * 1024
            if (blob.size <= targetSizeBytes) {
              const compressedFile = new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now()
              })
              resolve(compressedFile)
            } else {
              const newQuality = Math.max(0.1, (options.quality || 0.8) * 0.8)
              compressImageFile(file, { ...options, quality: newQuality })
                .then(resolve)
                .catch(reject)
            }
          },
          'image/jpeg',
          options.quality
        )
      }
      
      img.onerror = () => reject(new Error('Failed to load image'))
      img.src = e.target?.result as string
    }
    
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsDataURL(file)
  })
}

export async function compressVideo(
  file: File,
  options: { maxSizeMB: number } = { maxSizeMB: 50 }
): Promise<CompressionResult> {
  const originalSize = file.size
  const maxSizeBytes = options.maxSizeMB * 1024 * 1024

  if (originalSize <= maxSizeBytes) {
    return {
      file,
      originalSize,
      compressedSize: originalSize,
      compressionRatio: 0
    }
  }

  return {
    file,
    originalSize,
    compressedSize: originalSize,
    compressionRatio: 0
  }
}

export async function compressAudio(
  file: File,
  options: { maxSizeMB: number; bitrate?: number } = { maxSizeMB: 10, bitrate: 128 }
): Promise<CompressionResult> {
  const originalSize = file.size
  const maxSizeBytes = options.maxSizeMB * 1024 * 1024

  if (originalSize <= maxSizeBytes) {
    return {
      file,
      originalSize,
      compressedSize: originalSize,
      compressionRatio: 0
    }
  }

  return {
    file,
    originalSize,
    compressedSize: originalSize,
    compressionRatio: 0
  }
}

export function validateFile(file: File): { valid: boolean; error?: string } {
  const MAX_FILE_SIZE = 100 * 1024 * 1024
  const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic']
  const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm']
  const ALLOWED_AUDIO_TYPES = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/webm', 'audio/aac', 'audio/m4a']
  const ALLOWED_TYPES = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_VIDEO_TYPES, ...ALLOWED_AUDIO_TYPES]

  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File size exceeds 100MB limit. Current size: ${(file.size / 1024 / 1024).toFixed(2)}MB`
    }
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: `File type not supported. Allowed types: Images (JPEG, PNG, WebP, HEIC), Videos (MP4, MOV, AVI, WebM), Audio (MP3, WAV, OGG, AAC, M4A)`
    }
  }

  return { valid: true }
}

export function getMediaType(file: File): 'image' | 'video' | 'audio' | 'unknown' {
  if (file.type.startsWith('image/')) return 'image'
  if (file.type.startsWith('video/')) return 'video'
  if (file.type.startsWith('audio/')) return 'audio'
  return 'unknown'
}

export async function compressMedia(file: File): Promise<CompressionResult> {
  const mediaType = getMediaType(file)
  
  switch (mediaType) {
    case 'image':
      return compressImage(file)
    case 'video':
      return compressVideo(file)
    case 'audio':
      return compressAudio(file)
    default:
      return {
        file,
        originalSize: file.size,
        compressedSize: file.size,
        compressionRatio: 0
      }
  }
}

export async function generateThumbnail(
  file: File,
  maxSize: number = 200
): Promise<File> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = (e) => {
      const img = new Image()
      
      img.onload = () => {
        const canvas = document.createElement('canvas')
        let { width, height } = img
        
        if (width > height) {
          height = (height / width) * maxSize
          width = maxSize
        } else {
          width = (width / height) * maxSize
          height = maxSize
        }
        
        canvas.width = width
        canvas.height = height
        
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject(new Error('Failed to get canvas context'))
          return
        }
        
        ctx.drawImage(img, 0, 0, width, height)
        
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Failed to create thumbnail blob'))
              return
            }
            
            const thumbnailFile = new File([blob], `thumb_${file.name}`, {
              type: 'image/jpeg',
              lastModified: Date.now()
            })
            resolve(thumbnailFile)
          },
          'image/jpeg',
          0.7
        )
      }
      
      img.onerror = () => reject(new Error('Failed to load image for thumbnail'))
      img.src = e.target?.result as string
    }
    
    reader.onerror = () => reject(new Error('Failed to read file for thumbnail'))
    reader.readAsDataURL(file)
  })
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
}
