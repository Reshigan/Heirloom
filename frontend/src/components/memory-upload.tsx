'use client';

import React, { useState, useCallback } from 'react';
import { Upload, Image, Video, FileText, X, Plus } from 'lucide-react';

interface MemoryUploadProps {
  onUpload?: (files: File[]) => void;
  onClose?: () => void;
}

export default function MemoryUpload({ onUpload, onClose }: MemoryUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [currentTag, setCurrentTag] = useState('');

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const newFiles = Array.from(e.dataTransfer.files);
      setFiles(prev => [...prev, ...newFiles]);
    }
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setFiles(prev => [...prev, ...newFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const addTag = () => {
    if (currentTag.trim() && !tags.includes(currentTag.trim())) {
      setTags(prev => [...prev, currentTag.trim()]);
      setCurrentTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(prev => prev.filter(tag => tag !== tagToRemove));
  };

  const handleSubmit = () => {
    if (onUpload) {
      onUpload(files);
    }
    // Reset form
    setFiles([]);
    setTitle('');
    setDescription('');
    setDate('');
    setTags([]);
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) return <Image className="w-6 h-6" />;
    if (file.type.startsWith('video/')) return <Video className="w-6 h-6" />;
    return <FileText className="w-6 h-6" />;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4">
      <div className="bg-black border border-gold/30 rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-display font-bold text-gold">💛 Preserve a Precious Memory</h2>
          {onClose && (
            <button
              onClick={onClose}
              className="text-gold/60 hover:text-gold transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          )}
        </div>

        {/* Drag and Drop Area */}
        <div
          className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 mb-6 ${
            dragActive 
              ? 'border-gold bg-gold/10' 
              : 'border-gold/30 hover:border-gold/50'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <Upload className="w-12 h-12 text-gold mx-auto mb-4" />
          <p className="text-gold text-lg mb-2">Share your treasured moments with us</p>
          <p className="text-gold/60 mb-4">or</p>
          <label className="inline-block bg-secondary-gradient text-black px-6 py-3 rounded-lg cursor-pointer hover:scale-105 transition-transform font-semibold">
            Choose Memories to Cherish
            <input
              type="file"
              multiple
              accept="image/*,video/*,.pdf,.doc,.docx,.txt"
              onChange={handleFileInput}
              className="hidden"
            />
          </label>
        </div>

        {/* File List */}
        {files.length > 0 && (
          <div className="mb-6">
            <h3 className="text-gold font-semibold mb-3">Selected Files:</h3>
            <div className="space-y-2">
              {files.map((file, index) => (
                <div key={index} className="flex items-center justify-between bg-black-light p-3 rounded-lg border border-gold/20">
                  <div className="flex items-center space-x-3">
                    <div className="text-gold">
                      {getFileIcon(file)}
                    </div>
                    <div>
                      <p className="text-gold font-medium">{file.name}</p>
                      <p className="text-gold/60 text-sm">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                  </div>
                  <button
                    onClick={() => removeFile(index)}
                    className="text-gold/60 hover:text-gold transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Memory Details Form */}
        <div className="space-y-4">
          <div>
            <label className="block text-gold font-medium mb-2">💫 Memory Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-black-light border border-gold/30 rounded-lg px-4 py-3 text-gold placeholder-gold/50 focus:border-gold focus:outline-none transition-colors"
              placeholder="What makes this moment special?"
            />
          </div>

          <div>
            <label className="block text-gold font-medium mb-2">💛 The Story Behind</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full bg-black-light border border-gold/30 rounded-lg px-4 py-3 text-gold placeholder-gold/50 focus:border-gold focus:outline-none transition-colors resize-none"
              placeholder="Share the love, laughter, and emotions of this precious moment..."
            />
          </div>

          <div>
            <label className="block text-gold font-medium mb-2">📅 When Love Was Captured</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-black-light border border-gold/30 rounded-lg px-4 py-3 text-gold focus:border-gold focus:outline-none transition-colors"
            />
          </div>

          <div>
            <label className="block text-gold font-medium mb-2">🏷️ Memory Tags</label>
            <div className="flex space-x-2 mb-3">
              <input
                type="text"
                value={currentTag}
                onChange={(e) => setCurrentTag(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addTag()}
                className="flex-1 bg-black-light border border-gold/30 rounded-lg px-4 py-2 text-gold placeholder-gold/50 focus:border-gold focus:outline-none transition-colors"
                placeholder="family, celebration, love..."
              />
              <button
                onClick={addTag}
                className="bg-secondary-gradient text-black px-4 py-2 rounded-lg hover:scale-105 transition-transform"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {tags.map((tag, index) => (
                  <span
                    key={index}
                    className="bg-gold/20 text-gold px-3 py-1 rounded-full text-sm flex items-center space-x-2"
                  >
                    <span>{tag}</span>
                    <button
                      onClick={() => removeTag(tag)}
                      className="text-gold/60 hover:text-gold"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-4 mt-8">
          {onClose && (
            <button
              onClick={onClose}
              className="px-6 py-3 border border-gold/30 text-gold rounded-lg hover:border-gold transition-colors"
            >
              Cancel
            </button>
          )}
          <button
            onClick={handleSubmit}
            disabled={files.length === 0}
            className="px-6 py-3 bg-secondary-gradient text-black rounded-lg hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
          >
            💛 Preserve Forever
          </button>
        </div>
      </div>
    </div>
  );
}