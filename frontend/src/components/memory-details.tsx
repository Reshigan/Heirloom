'use client';

import React, { useState } from 'react';
import { Heart, MessageCircle, Share2, Download, Edit3, Trash2, Calendar, MapPin, Users, Tag, ChevronLeft, ChevronRight, X, Plus } from 'lucide-react';

interface Comment {
  id: string;
  author: string;
  content: string;
  timestamp: string;
  avatar?: string;
}

interface MemoryDetailsProps {
  memoryId?: string;
  onClose?: () => void;
}

export default function MemoryDetails({ memoryId, onClose }: MemoryDetailsProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [isHearted, setIsHearted] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [comments, setComments] = useState<Comment[]>([
    {
      id: '1',
      author: 'Michael Johnson',
      content: 'What a beautiful memory! Emma looks so happy in these photos.',
      timestamp: '2 hours ago'
    },
    {
      id: '2',
      author: 'Grandma Rose',
      content: 'This brings back so many memories of when you were little, Sarah. Time flies so fast! ❤️',
      timestamp: '5 hours ago'
    },
    {
      id: '3',
      author: 'Uncle Tom',
      content: 'Great shots! The lighting in that third photo is perfect.',
      timestamp: '1 day ago'
    }
  ]);

  // Mock memory data
  const memory = {
    id: memoryId || '1',
    title: "Emma's First Steps Adventure",
    description: "Today was the day we've all been waiting for! Emma took her first independent steps, and the joy on her face was absolutely priceless. She was so proud of herself, clapping and giggling with each wobbly step. We captured every precious moment as she discovered this new freedom of movement. The whole family was there cheering her on, and you could feel the love and excitement in the room. These are the moments that make life so beautiful and meaningful.",
    date: '2024-03-15',
    time: '14:30',
    location: 'Home, San Francisco, CA',
    photographer: 'Sarah Johnson',
    people: ['Emma Johnson', 'Sarah Johnson', 'Michael Johnson', 'Grandma Rose'],
    tags: ['first-steps', 'milestone', 'baby', 'family', 'joy', 'growth'],
    photos: [
      'https://images.unsplash.com/photo-1544717297-fa95b6ee9643?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=800&h=600&fit=crop'
    ],
    reactions: {
      likes: 89,
      hearts: 156,
      comments: 23,
      shares: 12
    },
    metadata: {
      camera: 'iPhone 15 Pro',
      settings: 'f/1.8, 1/120s, ISO 100',
      fileSize: '2.4 MB',
      resolution: '4032 × 3024'
    }
  };

  const handlePrevImage = () => {
    setCurrentImageIndex(prev => 
      prev === 0 ? memory.photos.length - 1 : prev - 1
    );
  };

  const handleNextImage = () => {
    setCurrentImageIndex(prev => 
      prev === memory.photos.length - 1 ? 0 : prev + 1
    );
  };

  const handleAddComment = () => {
    if (newComment.trim()) {
      const comment: Comment = {
        id: Date.now().toString(),
        author: 'You',
        content: newComment.trim(),
        timestamp: 'Just now'
      };
      setComments(prev => [comment, ...prev]);
      setNewComment('');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-95 flex z-50">
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-glass-bg backdrop-blur-lg border-b border-glass-border p-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <h2 className="text-2xl font-display font-bold text-gold">{memory.title}</h2>
              <div className="flex items-center space-x-2 text-gold/60 text-sm">
                <Calendar className="w-4 h-4" />
                <span>{formatDate(memory.date)}</span>
                {memory.time && (
                  <>
                    <span>•</span>
                    <span>{memory.time}</span>
                  </>
                )}
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <button className="p-2 text-gold/60 hover:text-gold transition-colors">
                <Edit3 className="w-5 h-5" />
              </button>
              <button className="p-2 text-gold/60 hover:text-gold transition-colors">
                <Download className="w-5 h-5" />
              </button>
              <button className="p-2 text-gold/60 hover:text-gold transition-colors">
                <Share2 className="w-5 h-5" />
              </button>
              {onClose && (
                <button
                  onClick={onClose}
                  className="p-2 text-gold/60 hover:text-gold transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Image Viewer */}
        <div className="flex-1 flex items-center justify-center bg-black relative">
          {memory.photos.length > 0 && (
            <>
              <img
                src={memory.photos[currentImageIndex]}
                alt={memory.title}
                className="max-w-full max-h-full object-contain"
              />
              
              {/* Navigation Arrows */}
              {memory.photos.length > 1 && (
                <>
                  <button
                    onClick={handlePrevImage}
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-glass-bg backdrop-blur-lg border border-glass-border p-3 rounded-full text-gold hover:bg-gold-500/10 transition-colors"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                  <button
                    onClick={handleNextImage}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-glass-bg backdrop-blur-lg border border-glass-border p-3 rounded-full text-gold hover:bg-gold-500/10 transition-colors"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                </>
              )}

              {/* Image Counter */}
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-glass-bg backdrop-blur-lg border border-glass-border px-4 py-2 rounded-full text-gold text-sm">
                {currentImageIndex + 1} of {memory.photos.length}
              </div>

              {/* Thumbnail Strip */}
              {memory.photos.length > 1 && (
                <div className="absolute bottom-4 left-4 flex space-x-2">
                  {memory.photos.map((photo, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`w-12 h-12 rounded-lg overflow-hidden border-2 transition-all ${
                        index === currentImageIndex 
                          ? 'border-gold scale-110' 
                          : 'border-gold-500/30 hover:border-gold/60'
                      }`}
                    >
                      <img src={photo} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Action Bar */}
        <div className="bg-glass-bg backdrop-blur-lg border-t border-glass-border p-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-6">
              <button
                onClick={() => setIsLiked(!isLiked)}
                className={`flex items-center space-x-2 transition-colors ${
                  isLiked ? 'text-gold' : 'text-gold/60 hover:text-gold'
                }`}
              >
                <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
                <span>{memory.reactions.likes + (isLiked ? 1 : 0)}</span>
              </button>
              
              <button
                onClick={() => setIsHearted(!isHearted)}
                className={`flex items-center space-x-2 transition-colors ${
                  isHearted ? 'text-red-500' : 'text-gold/60 hover:text-gold'
                }`}
              >
                <span className="text-lg">❤️</span>
                <span>{memory.reactions.hearts + (isHearted ? 1 : 0)}</span>
              </button>
              
              <button
                onClick={() => setShowComments(!showComments)}
                className="flex items-center space-x-2 text-gold/60 hover:text-gold transition-colors"
              >
                <MessageCircle className="w-5 h-5" />
                <span>{comments.length}</span>
              </button>
              
              <button className="flex items-center space-x-2 text-gold/60 hover:text-gold transition-colors">
                <Share2 className="w-5 h-5" />
                <span>{memory.reactions.shares}</span>
              </button>
            </div>

            <div className="text-gold/60 text-sm">
              Photo by {memory.photographer}
            </div>
          </div>
        </div>
      </div>

      {/* Sidebar */}
      <div className="w-96 bg-glass-bg backdrop-blur-lg border-l border-glass-border flex flex-col">
        {/* Memory Info */}
        <div className="p-6 border-b border-glass-border">
          <div className="space-y-4">
            {/* Description */}
            <div>
              <h3 className="font-medium text-gold mb-2">Description</h3>
              <p className="text-gold/80 text-sm leading-relaxed">{memory.description}</p>
            </div>

            {/* Details */}
            <div className="space-y-3">
              <div className="flex items-center space-x-2 text-gold/60 text-sm">
                <MapPin className="w-4 h-4" />
                <span>{memory.location}</span>
              </div>
              
              <div className="flex items-center space-x-2 text-gold/60 text-sm">
                <Users className="w-4 h-4" />
                <span>{memory.people.length} people</span>
              </div>
            </div>

            {/* People */}
            <div>
              <h4 className="font-medium text-gold mb-2">People</h4>
              <div className="space-y-2">
                {memory.people.map((person, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-secondary-gradient flex items-center justify-center text-black text-sm font-bold">
                      {person[0]}
                    </div>
                    <span className="text-gold/80 text-sm">{person}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Tags */}
            <div>
              <h4 className="font-medium text-gold mb-2">Tags</h4>
              <div className="flex flex-wrap gap-2">
                {memory.tags.map((tag) => (
                  <span key={tag} className="px-2 py-1 text-xs rounded-full bg-gold/20 text-gold/80">
                    #{tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Metadata */}
            <div>
              <h4 className="font-medium text-gold mb-2">Photo Details</h4>
              <div className="space-y-1 text-gold/60 text-xs">
                <div>Camera: {memory.metadata.camera}</div>
                <div>Settings: {memory.metadata.settings}</div>
                <div>Resolution: {memory.metadata.resolution}</div>
                <div>File Size: {memory.metadata.fileSize}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Comments Section */}
        <div className="flex-1 flex flex-col">
          <div className="p-4 border-b border-glass-border">
            <button
              onClick={() => setShowComments(!showComments)}
              className="flex items-center justify-between w-full text-gold font-medium"
            >
              <span>Comments ({comments.length})</span>
              <ChevronRight className={`w-4 h-4 transition-transform ${showComments ? 'rotate-90' : ''}`} />
            </button>
          </div>

          {showComments && (
            <>
              {/* Add Comment */}
              <div className="p-4 border-b border-glass-border">
                <div className="flex space-x-3">
                  <div className="w-8 h-8 rounded-full bg-secondary-gradient flex items-center justify-center text-black text-sm font-bold">
                    Y
                  </div>
                  <div className="flex-1">
                    <textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Add a comment..."
                      className="w-full bg-black-light border border-gold-500/30 rounded-lg px-3 py-2 text-gold placeholder-gold/50 focus:border-gold focus:outline-none transition-colors resize-none"
                      rows={2}
                    />
                    <div className="flex justify-end mt-2">
                      <button
                        onClick={handleAddComment}
                        disabled={!newComment.trim()}
                        className="bg-secondary-gradient text-black px-4 py-1 rounded-lg hover:scale-105 transition-transform font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Post
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Comments List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {comments.map((comment) => (
                  <div key={comment.id} className="flex space-x-3">
                    <div className="w-8 h-8 rounded-full bg-secondary-gradient flex items-center justify-center text-black text-sm font-bold">
                      {comment.author[0]}
                    </div>
                    <div className="flex-1">
                      <div className="bg-black-light rounded-lg p-3">
                        <div className="flex justify-between items-start mb-1">
                          <span className="font-medium text-gold text-sm">{comment.author}</span>
                          <span className="text-gold/50 text-xs">{comment.timestamp}</span>
                        </div>
                        <p className="text-gold/80 text-sm">{comment.content}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}