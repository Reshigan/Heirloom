'use client';

import { useEffect, useState, useRef } from 'react';
import { apiClient } from '@/lib/api-client';

interface Recording {
  id: string;
  title: string;
  duration: number;
  date: string;
  transcription?: string;
}

export default function VoicePage() {
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [loading, setLoading] = useState(true);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetchRecordings();
  }, []);

  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      setRecordingTime(0);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRecording]);

  const fetchRecordings = async () => {
    try {
      setRecordings([]);
    } catch (error) {
      console.error('Failed to fetch recordings:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleRecording = () => {
    setIsRecording(!isRecording);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="loading-ring"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black-900 p-8">
      <div className="max-w-5xl mx-auto">
        {/* Page Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="font-display text-3xl text-cream-100">Voice Recordings</h1>
        </div>

        {/* Weekly Allowance Banner */}
        <div className="flex justify-between items-center p-4 sm:p-6 bg-black-700 border border-black-500 rounded-lg mb-8">
          <div className="flex items-center gap-4">
            <div className="text-2xl">🎙️</div>
            <div>
              <h4 className="text-base text-cream-100 mb-1">Weekly Recording Allowance</h4>
              <p className="text-sm text-black-100">3 of 5 recordings remaining this week</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-[150px] h-2 bg-black-600 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-gold-600 to-gold-400 rounded-full" style={{ width: '60%' }} />
            </div>
            <div className="text-sm text-gold-500 font-semibold">3/5</div>
          </div>
        </div>

        {/* Recording Studio */}
        <div className="bg-gradient-to-br from-gold-500/10 to-gold-500/[0.02] border border-gold-600 rounded-xl p-10 mb-8 text-center">
          <div className="mb-8">
            <div className="font-display text-2xl text-cream-100 mb-2">Recording Studio</div>
            <div className="text-base text-black-100">Share your voice with future generations</div>
          </div>

          {/* Record Button */}
          <div className="mb-8">
            <button
              onClick={toggleRecording}
              className={`w-[120px] h-[120px] rounded-full border-4 flex items-center justify-center mx-auto relative transition-all ${
                isRecording
                  ? 'bg-gradient-to-br from-error-500 to-red-700 border-error-400 animate-pulse'
                  : 'bg-gradient-to-br from-gold-500 to-gold-600 border-gold-400 hover:scale-105 hover:shadow-gold-lg'
              }`}
            >
              <div className="absolute inset-[-8px] border-2 border-gold-500 rounded-full opacity-30" />
              <svg
                width="40"
                height="40"
                viewBox="0 0 24 24"
                fill="none"
                stroke={isRecording ? 'white' : 'var(--black-900)'}
                strokeWidth="2"
              >
                {isRecording ? (
                  <rect x="6" y="6" width="12" height="12" />
                ) : (
                  <>
                    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                    <line x1="12" y1="19" x2="12" y2="23" />
                    <line x1="8" y1="23" x2="16" y2="23" />
                  </>
                )}
              </svg>
            </button>
            <div className="text-lg font-medium text-cream-100 mt-4">
              {isRecording ? 'Recording...' : 'Click to Record'}
            </div>
            {isRecording && <div className="font-mono text-3xl text-gold-500 mt-2">{formatTime(recordingTime)}</div>}
          </div>

          {/* Waveform */}
          <div className={`flex items-center justify-center gap-1 h-[60px] mb-6 ${isRecording ? 'active' : ''}`}>
            {[...Array(9)].map((_, i) => (
              <div
                key={i}
                className={`w-1 bg-gold-500 rounded-full transition-all ${
                  isRecording ? 'animate-wave' : 'h-[10px]'
                }`}
                style={{
                  animationDelay: `${i * 0.1}s`,
                  height: isRecording ? undefined : '10px',
                }}
              />
            ))}
          </div>

          {/* Prompt Suggestions */}
          <div className="flex flex-wrap gap-2 justify-center max-w-[600px] mx-auto">
            {['Tell a childhood story', 'Share life advice', 'Describe a favorite memory', 'Express gratitude'].map(
              (prompt) => (
                <button
                  key={prompt}
                  className="px-4 py-2 text-sm text-cream-300 bg-black-700 border border-black-500 rounded-full cursor-pointer transition-all hover:border-gold-500 hover:text-gold-500"
                >
                  {prompt}
                </button>
              )
            )}
          </div>
        </div>

        {/* Recordings List */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-display text-xl text-cream-100">Your Recordings</h2>
        </div>

        {recordings.length > 0 ? (
          <div className="flex flex-col gap-4">
            {recordings.map((recording) => (
              <div
                key={recording.id}
                className="flex items-center gap-4 p-4 bg-black-700 border border-black-500 rounded-lg transition-all hover:border-gold-600"
              >
                <button className="w-12 h-12 flex items-center justify-center bg-gold-500 rounded-full cursor-pointer transition-all hover:scale-110 hover:shadow-gold-sm flex-shrink-0">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="var(--black-900)">
                    <polygon points="5 3 19 12 5 21 5 3" />
                  </svg>
                </button>
                <div className="flex-1 min-w-0">
                  <div className="text-base font-semibold text-cream-100 mb-1">{recording.title}</div>
                  <div className="flex items-center gap-4 text-sm text-black-100">
                    <div className="flex items-center gap-1">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="12 6 12 12 16 14" />
                      </svg>
                      <span>{formatTime(recording.duration)}</span>
                    </div>
                    <span>{new Date(recording.date).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="p-2 text-black-100 hover:text-cream-300 hover:bg-black-600 rounded-md transition-all">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                  </button>
                  <button className="p-2 text-black-100 hover:text-cream-300 hover:bg-black-600 rounded-md transition-all">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 6h18" />
                      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-black-700 border border-black-500 rounded-lg">
            <div className="text-6xl mb-4">🎙️</div>
            <h3 className="font-display text-2xl text-cream-100 mb-2">No recordings yet</h3>
            <p className="text-black-100 mb-6">Start recording your voice to preserve your stories</p>
            <button onClick={toggleRecording} className="btn btn-primary">
              Record Your First Story
            </button>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes wave {
          from {
            height: 10px;
          }
          to {
            height: 50px;
          }
        }
        .animate-wave {
          animation: wave 0.5s ease-in-out infinite alternate;
        }
      `}</style>
    </div>
  );
}
