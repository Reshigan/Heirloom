'use client';

import React, { useState } from 'react';
import { Calendar, Clock, MapPin, Users, Heart, MessageCircle, Share2, ChevronLeft, ChevronRight, Filter, X } from 'lucide-react';

interface TimelineEvent {
  id: string;
  title: string;
  description: string;
  date: string;
  time?: string;
  location?: string;
  people: string[];
  photos: string[];
  type: 'memory' | 'milestone' | 'celebration' | 'achievement';
  reactions: {
    likes: number;
    hearts: number;
    comments: number;
  };
  tags: string[];
}

interface TimelineViewProps {
  onClose?: () => void;
}

export default function TimelineView({ onClose }: TimelineViewProps) {
  const [selectedYear, setSelectedYear] = useState(2024);
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'year' | 'month' | 'day'>('year');

  const timelineEvents: TimelineEvent[] = [
    {
      id: '1',
      title: "Emma's First Birthday",
      description: "Our little princess turned one! The house was filled with laughter, colorful balloons, and the sweetest cake smash session ever captured.",
      date: '2024-03-15',
      time: '14:30',
      location: 'Home, San Francisco',
      people: ['Emma Johnson', 'Sarah Johnson', 'Michael Johnson', 'Grandma Rose', 'Uncle Tom'],
      photos: ['https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=400', 'https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?w=400'],
      type: 'milestone',
      reactions: { likes: 89, hearts: 156, comments: 23 },
      tags: ['birthday', 'milestone', 'family', 'celebration']
    },
    {
      id: '2',
      title: "Family Vacation to Yellowstone",
      description: "An incredible week exploring the wonders of Yellowstone National Park. From geysers to wildlife, every moment was magical.",
      date: '2024-07-22',
      time: '09:00',
      location: 'Yellowstone National Park',
      people: ['Sarah Johnson', 'Michael Johnson', 'Emma Johnson', 'David Johnson'],
      photos: ['https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400', 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400'],
      type: 'memory',
      reactions: { likes: 67, hearts: 92, comments: 18 },
      tags: ['vacation', 'nature', 'adventure', 'family-time']
    },
    {
      id: '3',
      title: "Sarah's Promotion Celebration",
      description: "After years of hard work, Sarah finally got the promotion she deserved! We celebrated with dinner at her favorite restaurant.",
      date: '2024-09-10',
      time: '19:00',
      location: 'The Golden Gate Restaurant',
      people: ['Sarah Johnson', 'Michael Johnson', 'Emma Johnson', 'Work Colleagues'],
      photos: ['https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400'],
      type: 'achievement',
      reactions: { likes: 45, hearts: 78, comments: 12 },
      tags: ['career', 'achievement', 'celebration', 'success']
    },
    {
      id: '4',
      title: "Thanksgiving Family Gathering",
      description: "Four generations came together for our traditional Thanksgiving feast. Grandma's recipes, family stories, and gratitude filled the air.",
      date: '2024-11-28',
      time: '15:00',
      location: 'Grandma Rose\'s House',
      people: ['Grandma Rose', 'Sarah Johnson', 'Michael Johnson', 'Emma Johnson', 'Uncle Tom', 'Aunt Mary', 'Cousins'],
      photos: ['https://images.unsplash.com/photo-1574972166131-b78c3b4b4b6e?w=400', 'https://images.unsplash.com/photo-1511895426328-dc8714191300?w=400'],
      type: 'celebration',
      reactions: { likes: 123, hearts: 189, comments: 34 },
      tags: ['thanksgiving', 'family', 'tradition', 'gratitude']
    },
    {
      id: '5',
      title: "Christmas Morning Magic",
      description: "Emma's second Christmas was pure magic. Her eyes lit up with wonder at every present, and the joy was infectious throughout the house.",
      date: '2024-12-25',
      time: '07:30',
      location: 'Home, San Francisco',
      people: ['Emma Johnson', 'Sarah Johnson', 'Michael Johnson', 'Santa Claus'],
      photos: ['https://images.unsplash.com/photo-1512389142860-9c449e58a543?w=400', 'https://images.unsplash.com/photo-1545558014-8692077e9b5c?w=400'],
      type: 'celebration',
      reactions: { likes: 156, hearts: 234, comments: 45 },
      tags: ['christmas', 'holiday', 'magic', 'childhood']
    }
  ];

  const years = [2020, 2021, 2022, 2023, 2024];
  const eventTypes = [
    { type: 'memory', color: 'bg-blue-500', label: 'Memory' },
    { type: 'milestone', color: 'bg-green-500', label: 'Milestone' },
    { type: 'celebration', color: 'bg-purple-500', label: 'Celebration' },
    { type: 'achievement', color: 'bg-orange-500', label: 'Achievement' }
  ];

  const filteredEvents = timelineEvents.filter(event => 
    new Date(event.date).getFullYear() === selectedYear
  ).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const selectedEventData = selectedEvent ? timelineEvents.find(e => e.id === selectedEvent) : null;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const getEventTypeColor = (type: string) => {
    const eventType = eventTypes.find(et => et.type === type);
    return eventType ? eventType.color : 'bg-gray-500';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex z-50">
      {/* Main Timeline View */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-glass-bg backdrop-blur-lg border-b border-glass-border p-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-3xl font-display font-bold text-gold">Family Timeline</h2>
              <p className="text-gold/70 mt-1">Journey through your precious memories</p>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Year Selector */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setSelectedYear(prev => Math.max(prev - 1, 2020))}
                  className="p-2 text-gold/60 hover:text-gold transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <span className="text-xl font-bold text-gold min-w-[80px] text-center">{selectedYear}</span>
                <button
                  onClick={() => setSelectedYear(prev => Math.min(prev + 1, 2024))}
                  className="p-2 text-gold/60 hover:text-gold transition-colors"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>

              {/* View Mode Toggle */}
              <div className="flex bg-black-light rounded-lg p-1">
                {['year', 'month', 'day'].map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setViewMode(mode as 'year' | 'month' | 'day')}
                    className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                      viewMode === mode 
                        ? 'bg-secondary-gradient text-black' 
                        : 'text-gold/60 hover:text-gold'
                    }`}
                  >
                    {mode.charAt(0).toUpperCase() + mode.slice(1)}
                  </button>
                ))}
              </div>

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

          {/* Event Type Legend */}
          <div className="flex items-center space-x-4 mt-4">
            <span className="text-gold/60 text-sm">Event Types:</span>
            {eventTypes.map((type) => (
              <div key={type.type} className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${type.color.replace('bg-', 'bg-gold')}`}></div>
                <span className="text-gold/80 text-sm">{type.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Timeline Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-4xl mx-auto">
            {/* Timeline Line */}
            <div className="relative">
              <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gold/30"></div>
              
              {/* Timeline Events */}
              <div className="space-y-8">
                {filteredEvents.map((event, index) => (
                  <div key={event.id} className="relative flex items-start space-x-6">
                    {/* Timeline Dot */}
                    <div className="relative z-10">
                      <div className={`w-4 h-4 rounded-full bg-secondary-gradient border-4 border-black`}></div>
                      <div className="absolute -inset-2 rounded-full bg-gold/20 animate-pulse"></div>
                    </div>

                    {/* Event Card */}
                    <div 
                      className="flex-1 bg-glass-bg backdrop-blur-lg border border-glass-border rounded-2xl p-6 cursor-pointer hover:border-gold/50 transition-all duration-300 hover:scale-[1.02]"
                      onClick={() => setSelectedEvent(event.id)}
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-xl font-display font-bold text-gold mb-2">{event.title}</h3>
                          <div className="flex items-center space-x-4 text-gold/60 text-sm">
                            <div className="flex items-center space-x-1">
                              <Calendar className="w-4 h-4" />
                              <span>{formatDate(event.date)}</span>
                            </div>
                            {event.time && (
                              <div className="flex items-center space-x-1">
                                <Clock className="w-4 h-4" />
                                <span>{event.time}</span>
                              </div>
                            )}
                            {event.location && (
                              <div className="flex items-center space-x-1">
                                <MapPin className="w-4 h-4" />
                                <span>{event.location}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-xs font-medium bg-gold/20 text-gold`}>
                          {eventTypes.find(t => t.type === event.type)?.label}
                        </div>
                      </div>

                      <p className="text-gold/80 mb-4 line-clamp-2">{event.description}</p>

                      {/* Photos Preview */}
                      {event.photos.length > 0 && (
                        <div className="flex space-x-2 mb-4">
                          {event.photos.slice(0, 3).map((photo, photoIndex) => (
                            <div key={photoIndex} className="w-16 h-16 rounded-lg overflow-hidden">
                              <img src={photo} alt="" className="w-full h-full object-cover" />
                            </div>
                          ))}
                          {event.photos.length > 3 && (
                            <div className="w-16 h-16 rounded-lg bg-gold/20 flex items-center justify-center text-gold text-xs font-medium">
                              +{event.photos.length - 3}
                            </div>
                          )}
                        </div>
                      )}

                      {/* People and Reactions */}
                      <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-2">
                          <Users className="w-4 h-4 text-gold/60" />
                          <span className="text-gold/60 text-sm">{event.people.length} people</span>
                        </div>
                        <div className="flex items-center space-x-4 text-gold/60 text-sm">
                          <span className="flex items-center space-x-1">
                            <Heart className="w-4 h-4" />
                            <span>{event.reactions.hearts}</span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <MessageCircle className="w-4 h-4" />
                            <span>{event.reactions.comments}</span>
                          </span>
                        </div>
                      </div>

                      {/* Tags */}
                      {event.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3">
                          {event.tags.map((tag) => (
                            <span key={tag} className="px-2 py-1 text-xs rounded-full bg-gold/20 text-gold/80">
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Event Detail Panel */}
      {selectedEventData && (
        <div className="w-96 bg-glass-bg backdrop-blur-lg border-l border-glass-border p-6 overflow-y-auto">
          <div className="flex justify-between items-start mb-6">
            <h3 className="text-xl font-display font-bold text-gold">Event Details</h3>
            <button
              onClick={() => setSelectedEvent(null)}
              className="text-gold/60 hover:text-gold transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-6">
            {/* Event Info */}
            <div>
              <h4 className="text-lg font-display font-bold text-gold mb-2">{selectedEventData.title}</h4>
              <p className="text-gold/80 mb-4">{selectedEventData.description}</p>
              
              <div className="space-y-2 text-sm">
                <div className="flex items-center space-x-2 text-gold/60">
                  <Calendar className="w-4 h-4" />
                  <span>{formatDate(selectedEventData.date)}</span>
                </div>
                {selectedEventData.time && (
                  <div className="flex items-center space-x-2 text-gold/60">
                    <Clock className="w-4 h-4" />
                    <span>{selectedEventData.time}</span>
                  </div>
                )}
                {selectedEventData.location && (
                  <div className="flex items-center space-x-2 text-gold/60">
                    <MapPin className="w-4 h-4" />
                    <span>{selectedEventData.location}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Photos */}
            {selectedEventData.photos.length > 0 && (
              <div>
                <h5 className="font-medium text-gold mb-3">Photos</h5>
                <div className="grid grid-cols-2 gap-2">
                  {selectedEventData.photos.map((photo, index) => (
                    <div key={index} className="aspect-square rounded-lg overflow-hidden">
                      <img src={photo} alt="" className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* People */}
            <div>
              <h5 className="font-medium text-gold mb-3">People ({selectedEventData.people.length})</h5>
              <div className="space-y-2">
                {selectedEventData.people.map((person, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-secondary-gradient flex items-center justify-center text-black text-sm font-bold">
                      {person[0]}
                    </div>
                    <span className="text-gold/80">{person}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex space-x-2">
              <button className="flex-1 bg-secondary-gradient text-black py-2 rounded-lg hover:scale-105 transition-transform font-semibold">
                <Heart className="w-4 h-4 inline mr-2" />
                Like
              </button>
              <button className="flex-1 border border-gold/30 text-gold py-2 rounded-lg hover:border-gold transition-colors">
                <Share2 className="w-4 h-4 inline mr-2" />
                Share
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}