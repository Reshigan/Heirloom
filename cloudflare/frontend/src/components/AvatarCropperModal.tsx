import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ZoomIn, ZoomOut, Upload, Loader2 } from 'lucide-react';

interface AvatarCropperModalProps {
  isOpen: boolean;
  imageSrc: string | null;
  onCancel: () => void;
  onComplete: (croppedFile: File, previewUrl: string) => void;
  isUploading?: boolean;
}

export function AvatarCropperModal({ 
  isOpen, 
  imageSrc, 
  onCancel, 
  onComplete,
  isUploading = false 
}: AvatarCropperModalProps) {
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imageLoaded, setImageLoaded] = useState(false);
  const [, setImageDimensions] = useState({ width: 0, height: 0 });
  
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Reset state when modal opens with new image
  useEffect(() => {
    if (isOpen && imageSrc) {
      setZoom(1);
      setPosition({ x: 0, y: 0 });
      setImageLoaded(false);
    }
  }, [isOpen, imageSrc]);

  // Handle image load
  const handleImageLoad = useCallback(() => {
    if (imageRef.current) {
      setImageDimensions({
        width: imageRef.current.naturalWidth,
        height: imageRef.current.naturalHeight,
      });
      setImageLoaded(true);
    }
  }, []);

  // Handle mouse/touch drag start
  const handleDragStart = useCallback((clientX: number, clientY: number) => {
    setIsDragging(true);
    setDragStart({ x: clientX - position.x, y: clientY - position.y });
  }, [position]);

  // Handle mouse/touch drag move
  const handleDragMove = useCallback((clientX: number, clientY: number) => {
    if (!isDragging) return;
    
    const newX = clientX - dragStart.x;
    const newY = clientY - dragStart.y;
    
    // Limit movement based on zoom level
    const maxOffset = 100 * zoom;
    setPosition({
      x: Math.max(-maxOffset, Math.min(maxOffset, newX)),
      y: Math.max(-maxOffset, Math.min(maxOffset, newY)),
    });
  }, [isDragging, dragStart, zoom]);

  // Handle drag end
  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Mouse event handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    handleDragStart(e.clientX, e.clientY);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    handleDragMove(e.clientX, e.clientY);
  };

  const handleMouseUp = () => {
    handleDragEnd();
  };

  // Touch event handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      handleDragStart(e.touches[0].clientX, e.touches[0].clientY);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      handleDragMove(e.touches[0].clientX, e.touches[0].clientY);
    }
  };

  const handleTouchEnd = () => {
    handleDragEnd();
  };

  // Crop and save the image
  const handleSave = useCallback(async () => {
    if (!imageSrc || !canvasRef.current || !imageRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Output size (square avatar)
    const outputSize = 256;
    canvas.width = outputSize;
    canvas.height = outputSize;

    // Create a new image to draw
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      // Calculate the crop area
      const containerSize = 200; // The visible crop area size
      const scale = Math.min(img.width, img.height) / containerSize;
      
      // Calculate source coordinates based on zoom and position
      const sourceSize = containerSize * scale / zoom;
      const sourceCenterX = img.width / 2 - (position.x * scale / zoom);
      const sourceCenterY = img.height / 2 - (position.y * scale / zoom);
      
      const sourceX = sourceCenterX - sourceSize / 2;
      const sourceY = sourceCenterY - sourceSize / 2;

      // Draw the cropped image
      ctx.drawImage(
        img,
        sourceX,
        sourceY,
        sourceSize,
        sourceSize,
        0,
        0,
        outputSize,
        outputSize
      );

      // Convert to blob
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], `avatar-${Date.now()}.jpg`, { type: 'image/jpeg' });
          const previewUrl = canvas.toDataURL('image/jpeg', 0.9);
          onComplete(file, previewUrl);
        }
      }, 'image/jpeg', 0.9);
    };

    img.src = imageSrc;
  }, [imageSrc, zoom, position, onComplete]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-void-deep/90 backdrop-blur-sm"
        onClick={onCancel}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-void-light border border-gold/20 rounded-xl p-6 max-w-md w-full mx-4"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-light text-paper">Adjust Photo</h3>
            <button
              onClick={onCancel}
              className="p-2 text-paper/50 hover:text-paper transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Crop Area */}
          <div className="relative mb-6">
            <div
              ref={containerRef}
              className="relative w-[200px] h-[200px] mx-auto rounded-full overflow-hidden border-2 border-gold/50 cursor-move"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              {imageSrc && (
                <img
                  ref={imageRef}
                  src={imageSrc}
                  alt="Crop preview"
                  onLoad={handleImageLoad}
                  className="absolute top-1/2 left-1/2 max-w-none select-none"
                  style={{
                    transform: `translate(-50%, -50%) translate(${position.x}px, ${position.y}px) scale(${zoom})`,
                    minWidth: '100%',
                    minHeight: '100%',
                    objectFit: 'cover',
                  }}
                  draggable={false}
                />
              )}
              
              {/* Overlay grid for visual guidance */}
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute inset-0 border border-white/20 rounded-full" />
              </div>
            </div>

            {/* Instructions */}
            <p className="text-center text-paper/50 text-sm mt-3">
              Drag to reposition, use slider to zoom
            </p>
          </div>

          {/* Zoom Control */}
          <div className="flex items-center gap-4 mb-6">
            <button
              onClick={() => setZoom(Math.max(1, zoom - 0.1))}
              className="p-2 glass rounded-lg text-paper/50 hover:text-gold transition-colors"
            >
              <ZoomOut size={18} />
            </button>
            <input
              type="range"
              min="1"
              max="3"
              step="0.1"
              value={zoom}
              onChange={(e) => setZoom(parseFloat(e.target.value))}
              className="flex-1 h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-gold"
            />
            <button
              onClick={() => setZoom(Math.min(3, zoom + 0.1))}
              className="p-2 glass rounded-lg text-paper/50 hover:text-gold transition-colors"
            >
              <ZoomIn size={18} />
            </button>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="flex-1 btn btn-secondary"
              disabled={isUploading}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex-1 btn btn-primary flex items-center justify-center gap-2"
              disabled={!imageLoaded || isUploading}
            >
              {isUploading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload size={18} />
                  Save Photo
                </>
              )}
            </button>
          </div>

          {/* Hidden canvas for cropping */}
          <canvas ref={canvasRef} className="hidden" />
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
