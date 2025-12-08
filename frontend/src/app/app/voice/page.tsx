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
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [newRecordingTitle, setNewRecordingTitle] = useState('');
  const [currentRecordingData, setCurrentRecordingData] = useState<string | null>(null);
  const [mediaRecorderSupported, setMediaRecorderSupported] = useState(true);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);
  const lastDurationRef = useRef<number>(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  useEffect(() => {
    fetchRecordings();
    if (typeof window !== 'undefined' && !window.MediaRecorder) {
      setMediaRecorderSupported(false);
    }
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
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRecording]);

  const fetchRecordings = async () => {
    try {
      const data = await apiClient.getVoiceRecordings();
      setRecordings(data);
    } catch (error) {
      console.error('Failed to fetch recordings:', error);
    } finally {
      setLoading(false);
    }
  };

  const startRecording = async () => {
    if (!mediaRecorderSupported) {
      alert('Your browser does not support audio recording. Please use a modern browser like Chrome, Firefox, or Edge.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : 'audio/webm';
      
      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      const chunks: BlobPart[] = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunks, { type: mimeType });
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64data = reader.result as string;
          setCurrentRecordingData(base64data);
          setShowSaveModal(true);
        };
        reader.readAsDataURL(blob);
        
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      
      startTimeRef.current = Date.now();
      setIsRecording(true);
      setRecordingTime(0);
    } catch (error) {
      console.error('Failed to start recording:', error);
      alert('Failed to access microphone. Please check your browser permissions and try again.');
    }
  };

  const stopRecording = () => {
    const mediaRecorder = mediaRecorderRef.current;
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      lastDurationRef.current = Math.round((Date.now() - startTimeRef.current) / 1000);
      mediaRecorder.stop();
    }
    setIsRecording(false);
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const calculateFileSizeBytes = (dataURL: string): number => {
    const base64 = dataURL.split(',')[1] || '';
    const padding = (base64.match(/=+$/) || [''])[0].length;
    return Math.ceil(base64.length * 3 / 4) - padding;
  };

  const saveRecording = async () => {
    try {
      if (!currentRecordingData) {
        alert('No recording data available');
        return;
      }

      const fileSizeBytes = calculateFileSizeBytes(currentRecordingData);
      const duration = lastDurationRef.current;

      await apiClient.createVoiceRecording({
        title: newRecordingTitle || 'Untitled Recording',
        encryptedData: currentRecordingData,
        encryptedDek: 'client-encrypted-dek', // TODO: Implement proper encryption
        duration: duration,
        fileSizeBytes: fileSizeBytes,
        transcription: undefined
      });

      setShowSaveModal(false);
      setNewRecordingTitle('');
      setCurrentRecordingData(null);
      lastDurationRef.current = 0;
      fetchRecordings();
    } catch (error) {
      console.error('Failed to save recording:', error);
      alert('Failed to save recording. Please try again.');
    }
  };

  const deleteRecording = async (id: string) => {
    if (!confirm('Are you sure you want to delete this recording?')) {
      return;
    }

    try {
      await apiClient.deleteVoiceRecording(id);
      fetchRecordings();
    } catch (error) {
      console.error('Failed to delete recording:', error);
      alert('Failed to delete recording. Please try again.');
    }
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

        {!mediaRecorderSupported && (
          <div className="mb-8 p-4 bg-red-500/20 border border-red-500 rounded-lg text-red-400">
            Your browser does not support audio recording. Please use a modern browser like Chrome, Firefox, or Edge.
          </div>
        )}

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
              disabled={!mediaRecorderSupported}
              className={`w-[120px] h-[120px] rounded-full border-4 flex items-center justify-center mx-auto relative transition-all ${
                isRecording
                  ? 'bg-gradient-to-br from-error-500 to-red-700 border-error-400 animate-pulse'
                  : mediaRecorderSupported
                  ? 'bg-gradient-to-br from-gold-500 to-gold-600 border-gold-400 hover:scale-105 hover:shadow-gold-lg'
                  : 'bg-gray-500 border-gray-400 cursor-not-allowed opacity-50'
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
                  <button 
                    onClick={() => deleteRecording(recording.id)}
                    className="p-2 text-black-100 hover:text-cream-300 hover:bg-black-600 rounded-md transition-all"
                  >
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
            <button 
              onClick={toggleRecording} 
              disabled={!mediaRecorderSupported}
              className="btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Record Your First Story
            </button>
          </div>
        )}
      </div>

      {showSaveModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-black-800 border border-gold-600 rounded-xl p-6 max-w-md w-full">
            <h3 className="font-display text-2xl text-cream-100 mb-4">Save Recording</h3>
            <p className="text-sm text-black-100 mb-4">
              Duration: {formatTime(lastDurationRef.current)}
            </p>
            <input
              type="text"
              placeholder="Enter recording title..."
              value={newRecordingTitle}
              onChange={(e) => setNewRecordingTitle(e.target.value)}
              className="w-full px-4 py-3 bg-black-700 border border-black-500 rounded-md text-cream-300 mb-4 focus:outline-none focus:border-gold-500"
            />
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowSaveModal(false);
                  setNewRecordingTitle('');
                  setCurrentRecordingData(null);
                  lastDurationRef.current = 0;
                }}
                className="flex-1 px-4 py-2 bg-black-700 border border-black-500 text-cream-300 rounded-md hover:border-black-400"
              >
                Cancel
              </button>
              <button
                onClick={saveRecording}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-gold-500 to-gold-600 text-black-900 font-medium rounded-md hover:shadow-gold-sm"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

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
