


import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Tag, Plus, X, Hash, Edit3, Save, Trash2, Sparkles } from 'lucide-react';

type Memory = {
  id: string;
  title: string;
  description?: string;
  type: 'PHOTO' | 'VIDEO';
  fileUrl?: string;
  emotion?: string;
  recipients: { familyMember: { id: string; name: string } }[];
  tags?: string[];
  createdAt: string;
};

interface MemoryTaggingProps {
  memory: Memory;
  availableTags: string[];
  onTagsUpdate: (memoryId: string, tags: string[]) => void;
  onTagCreate: (tag: string) => void;
  onTagDelete: (tag: string) => void;
}

interface TagSuggestion {
  tag: string;
  confidence: number;
  reason: string;
}

export function MemoryTagging({ 
  memory, 
  availableTags, 
  onTagsUpdate, 
  onTagCreate,
  onTagDelete 
}: MemoryTaggingProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [newTag, setNewTag] = useState('');
  const [suggestedTags, setSuggestedTags] = useState<TagSuggestion[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // AI-powered tag suggestions based on memory content
  const analyzeMemoryForTags = async () => {
    setIsAnalyzing(true);
    
    // Simulate AI analysis delay
    setTimeout(() => {
      const suggestions: TagSuggestion[] = [];
      
      // Analyze title for keywords
      const title = memory.title.toLowerCase();
      const description = (memory.description || '').toLowerCase();
      
      // Common tag patterns
      const patterns = {
        family: ['family', 'mom', 'dad', 'parents', 'children', 'kids', 'siblings'],
        travel: ['vacation', 'travel', 'trip', 'beach', 'mountains', 'city', 'adventure'],
        celebration: ['birthday', 'wedding', 'anniversary', 'graduation', 'celebration'],
        nature: ['nature', 'outdoors', 'landscape', 'sunset', 'sunrise', 'wildlife'],
        holiday: ['christmas', 'thanksgiving', 'easter', 'holiday', 'festival'],
        emotion: ['happy', 'joy', 'love', 'grateful', 'excited', 'memorable']
      };
      
      // Check each pattern
      Object.entries(patterns).forEach(([category, keywords]) => {
        const matches = keywords.filter(keyword => 
          title.includes(keyword) || description.includes(keyword)
        ).length;
        
        if (matches > 0) {
          suggestions.push({
            tag: category,
            confidence: Math.min(100, matches * 20),
            reason: `Found ${matches} related keywords in memory content`
          });
        }
      });
      
      // Suggest emotion-based tags if emotion is set
      if (memory.emotion) {
        suggestions.push({
          tag: memory.emotion,
          confidence: 85,
          reason: 'Based on memory emotion'
        });
      }
      
      // Suggest type-based tags
      suggestions.push({
        tag: memory.type.toLowerCase(),
        confidence: 100,
        reason: 'Memory type'
      });
      
      // Remove duplicates and sort by confidence
      const uniqueSuggestions = suggestions.reduce((acc: TagSuggestion[], suggestion) => {
        if (!acc.find(s => s.tag === suggestion.tag)) {
          acc.push(suggestion);
        }
        return acc;
      }, []);
      
      setSuggestedTags(uniqueSuggestions.sort((a, b) => b.confidence - a.confidence));
      setIsAnalyzing(false);
    }, 800);
  };

  useEffect(() => {
    if (isEditing) {
      analyzeMemoryForTags();
    }
  }, [isEditing]);

  const handleAddTag = (tag: string) => {
    const normalizedTag = tag.trim().toLowerCase();
    if (normalizedTag && !memory.tags?.includes(normalizedTag)) {
      const newTags = [...(memory.tags || []), normalizedTag];
      onTagsUpdate(memory.id, newTags);
      
      // Add to available tags if it doesn't exist
      if (!availableTags.includes(normalizedTag)) {
        onTagCreate(normalizedTag);
      }
    }
    setNewTag('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const newTags = memory.tags?.filter(tag => tag !== tagToRemove) || [];
    onTagsUpdate(memory.id, newTags);
  };

  const handleCreateNewTag = () => {
    if (newTag.trim()) {
      handleAddTag(newTag.trim());
    }
  };

  const getTagColor = (tag: string) => {
    const colors = [
      'bg-blue-500/20 text-blue-300 border-blue-500/30',
      'bg-green-500/20 text-green-300 border-green-500/30',
      'bg-purple-500/20 text-purple-300 border-purple-500/30',
      'bg-orange-500/20 text-orange-300 border-orange-500/30',
      'bg-pink-500/20 text-pink-300 border-pink-500/30',
      'bg-teal-500/20 text-teal-300 border-teal-500/30'
    ];
    
    const index = tag.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
    return colors[index];
  };

  return (
    <div className="space-y-4">
      {/* Tags Display */}
      <div className="flex items-center gap-2">
        <Tag size={16} className="text-paper/50" />
        <div className="flex flex-wrap gap-2">
          {memory.tags?.map((tag) => (
            <span key={tag} className={`px-2 py-1 rounded-full text-sm border ${getTagColor(tag)} flex items-center gap-1`}>
              {tag}
              {isEditing && (
                <button
                  onClick={() => handleRemoveTag(tag)}
                  className="text-paper/50 hover:text-paper transition-colors"
                >
                  <X size={12} />
                </button>
              )}
            </span>
          ))}
        </div>
        
        <button
          onClick={() => setIsEditing(!isEditing)}
          className={`ml-auto p-1 rounded transition-colors ${
            isEditing ? 'text-gold' : 'text-paper/50 hover:text-paper'
          }`}
        >
          {isEditing ? <Save size={16} /> : <Edit3 size={16} />}
        </button>
      </div>

      {/* Tag Editor */}
      <AnimatePresence>
        {isEditing && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="glass rounded-lg p-4 space-y-4"
          >
            {/* AI Suggestions */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-paper/50 text-sm">
                <Sparkles size={14} />
                <span>AI Tag Suggestions</span>
                {isAnalyzing && (
                  <div className="spinner w-3 h-3 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
                )}
              </div>
              
              <div className="flex flex-wrap gap-2">
                {suggestedTags.map((suggestion) => (
                  <button
                    key={suggestion.tag}
                    onClick={() => handleAddTag(suggestion.tag)}
                    disabled={memory.tags?.includes(suggestion.tag)}
                    className={`px-2 py-1 rounded-full text-sm border transition-all ${
                      memory.tags?.includes(suggestion.tag)
                        ? 'bg-gold/20 text-gold border-gold/30 cursor-not-allowed'
                        : `${getTagColor(suggestion.tag)} hover:scale-105 cursor-pointer`
                    }`}
                    title={`Confidence: ${suggestion.confidence}% - ${suggestion.reason}`}
                  >
                    {suggestion.tag}
                    <span className="text-xs opacity-60 ml-1">({suggestion.confidence}%)</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Available Tags */}
            {availableTags.length > 0 && (
              <div className="space-y-3">
                <div className="text-paper/50 text-sm">Available Tags</div>
                <div className="flex flex-wrap gap-2">
                  {availableTags.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => handleAddTag(tag)}
                      disabled={memory.tags?.includes(tag)}
                      className={`px-2 py-1 rounded-full text-sm border transition-all ${
                        memory.tags?.includes(tag)
                          ? 'bg-gold/20 text-gold border-gold/30 cursor-not-allowed'
                          : `${getTagColor(tag)} hover:scale-105 cursor-pointer`
                      }`}
                    >
                      {tag}
                      {memory.tags?.includes(tag) && (
                        <span className="ml-1 text-xs">✓</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Create New Tag */}
            <div className="space-y-2">
              <div className="text-paper/50 text-sm">Create New Tag</div>
              <div className="flex gap-2">
                <div className="flex-1 glass rounded-lg overflow-hidden">
                  <input
                    type="text"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleCreateNewTag()}
                    placeholder="Enter a new tag..."
                    className="w-full bg-transparent p-2 text-paper placeholder-paper/50 focus:outline-none"
                  />
                </div>
                <button
                  onClick={handleCreateNewTag}
                  disabled={!newTag.trim()}
                  className="btn btn-primary whitespace-nowrap"
                >
                  <Plus size={16} />
                  Add Tag
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Tag Management Component for Global Tag Management
interface TagManagerProps {
  allTags: string[];
  onTagDelete: (tag: string) => void;
  onTagsMerge: (sourceTag: string, targetTag: string) => void;
}

export function TagManager({ allTags, onTagDelete, onTagsMerge }: TagManagerProps) {
  const [isManaging, setIsManaging] = useState(false);
  const [mergeSource, setMergeSource] = useState<string | null>(null);

  const handleMergeTags = (targetTag: string) => {
    if (mergeSource && mergeSource !== targetTag) {
      onTagsMerge(mergeSource, targetTag);
      setMergeSource(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Hash size={16} className="text-paper/50" />
          <span className="text-paper">Manage Tags ({allTags.length})</span>
        </div>
        <button
          onClick={() => setIsManaging(!isManaging)}
          className="btn btn-secondary"
        >
          {isManaging ? 'Done' : 'Manage Tags'}
        </button>
      </div>

      <AnimatePresence>
        {isManaging && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="glass rounded-lg p-4 space-y-4"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {allTags.map((tag) => (
                <div key={tag} className="flex items-center justify-between glass rounded-lg p-3">
                  <span className="text-paper">{tag}</span>
                  <div className="flex items-center gap-2">
                    {mergeSource === tag ? (
                      <>
                        <span className="text-xs text-paper/50">Merging...</span>
                        <button
                          onClick={() => setMergeSource(null)}
                          className="text-paper/50 hover:text-paper"
                        >
                          <X size={14} />
                        </button>
                      </>
                    ) : mergeSource ? (
                      <button
                        onClick={() => handleMergeTags(tag)}
                        className="text-green-400 hover:text-green-300"
                        title={`Merge ${mergeSource} into ${tag}`}
                      >
                        ✓ Merge
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={() => setMergeSource(tag)}
                          className="text-blue-400 hover:text-blue-300"
                          title="Merge this tag with another"
                        >
                          Merge
                        </button>
                        <button
                          onClick={() => onTagDelete(tag)}
                          className="text-red-400 hover:text-red-300"
                          title="Delete this tag"
                        >
                          <Trash2 size={14} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
            
            {mergeSource && (
              <div className="text-center text-paper/50 text-sm">
                Select a tag to merge "{mergeSource}" into
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}


