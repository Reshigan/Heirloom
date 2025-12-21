import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Square, Play, Pause, Save, Trash2, Loader2, Check, X, Lightbulb, RefreshCw, Calendar, ChevronLeft, ChevronRight, Heart, Sparkles, Cloud, Gift, Droplet, Eye, Trophy, Leaf, Sun, Volume2, Plus, FileText } from '../components/Icons';
import { Mp3Encoder } from 'lamejs';
import { voiceApi, familyApi, transcriptionApi, aiApi } from '../services/api';
import { AddFamilyMemberModal } from '../components/AddFamilyMemberModal';
import { Navigation } from '../components/Navigation';
import { InspirationPrompt } from '../components/InspirationPrompt';

type EmotionType = 'joyful' | 'nostalgic' | 'grateful' | 'loving' | 'bittersweet' | 'sad' | 'reflective' | 'proud' | 'peaceful' | 'hopeful';

const EMOTIONS: { value: EmotionType; label: string; icon: React.ElementType; color: string }[] = [
  { value: 'joyful', label: 'Joyful', icon: Sparkles, color: 'text-yellow-400 bg-yellow-400/20' },
  { value: 'nostalgic', label: 'Nostalgic', icon: Cloud, color: 'text-amber-400 bg-amber-400/20' },
  { value: 'grateful', label: 'Grateful', icon: Gift, color: 'text-emerald-400 bg-emerald-400/20' },
  { value: 'loving', label: 'Loving', icon: Heart, color: 'text-rose-400 bg-rose-400/20' },
  { value: 'bittersweet', label: 'Bittersweet', icon: Droplet, color: 'text-purple-400 bg-purple-400/20' },
  { value: 'reflective', label: 'Reflective', icon: Eye, color: 'text-indigo-400 bg-indigo-400/20' },
  { value: 'proud', label: 'Proud', icon: Trophy, color: 'text-orange-400 bg-orange-400/20' },
  { value: 'peaceful', label: 'Peaceful', icon: Leaf, color: 'text-teal-400 bg-teal-400/20' },
  { value: 'hopeful', label: 'Hopeful', icon: Sun, color: 'text-sky-400 bg-sky-400/20' },
];

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

type VoiceRecording = {
  id: string;
  title: string;
  duration: number;
  emotion?: EmotionType;
  fileUrl?: string;
  transcript?: string;
  createdAt: string;
};

export function Record() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedPrompt, setSelectedPrompt] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [waveformData, setWaveformData] = useState<number[]>(new Array(40).fill(0));
  
    const [form, setForm] = useState({
      title: '',
      promptId: null as string | null,
      recipientIds: [] as string[],
      recordingDate: '', // For historic recordings - empty means use current date
    });
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const savedAudioRef = useRef<HTMLAudioElement | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationRef = useRef<number | null>(null);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const { data: family } = useQuery({
    queryKey: ['family'],
    queryFn: () => familyApi.getAll().then(r => r.data),
  });

    const { data: stats } = useQuery({
      queryKey: ['voice-stats'],
      queryFn: () => voiceApi.getStats().then(r => r.data),
    });

    // Fetch all voice recordings for timeline view
    const { data: recordings } = useQuery({
      queryKey: ['voice'],
      queryFn: () => voiceApi.getAll().then(r => r.data),
    });

        // Timeline filter state
        const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
        const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
        const [selectedEmotion, setSelectedEmotion] = useState<EmotionType | null>(null);
        const [showRecordingsList, setShowRecordingsList] = useState(false);
                const [playingRecordingId, setPlayingRecordingId] = useState<string | null>(null);
                const [showAddFamilyModal, setShowAddFamilyModal] = useState(false);
                const [transcribingId, setTranscribingId] = useState<string | null>(null);
                const [expandedTranscriptId, setExpandedTranscriptId] = useState<string | null>(null);

    // Get available years from recordings
    // Note: API returns { data: [...], pagination: {...} }
    const availableYears = useMemo(() => {
      if (!recordings?.data) return [new Date().getFullYear()];
      const years = new Set<number>();
      recordings.data.forEach((r: VoiceRecording) => {
        years.add(new Date(r.createdAt).getFullYear());
      });
      const yearArray = Array.from(years).sort((a, b) => b - a);
      return yearArray.length > 0 ? yearArray : [new Date().getFullYear()];
    }, [recordings]);

    // Filter recordings by timeline and emotion
    const filteredRecordings = useMemo(() => {
      if (!recordings?.data) return [];
      return recordings.data.filter((r: VoiceRecording) => {
        const date = new Date(r.createdAt);
        const matchesYear = date.getFullYear() === selectedYear;
        const matchesMonth = selectedMonth === null || date.getMonth() === selectedMonth;
        const matchesEmotion = selectedEmotion === null || r.emotion === selectedEmotion;
        return matchesYear && matchesMonth && matchesEmotion;
      });
    }, [recordings, selectedYear, selectedMonth, selectedEmotion]);

    // Get emotion counts for current filter
    const emotionCounts = useMemo(() => {
      if (!recordings?.data) return {};
      const counts: Record<string, number> = {};
      recordings.data.forEach((r: VoiceRecording) => {
        const date = new Date(r.createdAt);
        if (date.getFullYear() === selectedYear && (selectedMonth === null || date.getMonth() === selectedMonth)) {
          if (r.emotion) {
            counts[r.emotion] = (counts[r.emotion] || 0) + 1;
          }
        }
      });
      return counts;
    }, [recordings, selectedYear, selectedMonth]);

    const uploadMutation = useMutation({
    mutationFn: async (data: { blob: Blob; form: typeof form }) => {
      // Convert to MP3 for universal cross-browser playback
      // MP3 is supported by all browsers (Safari, Chrome, Firefox, Edge)
      const mp3Blob = await convertToMp3(data.blob);
      const file = new File([mp3Blob], 'recording.mp3', { type: 'audio/mpeg' });
      
      const { data: urlData } = await voiceApi.getUploadUrl({
        filename: file.name,
        contentType: file.type,
      });
      
      // Upload the file to R2 storage
      const uploadResponse = await fetch(urlData.uploadUrl, {
        method: 'PUT',
        body: file,
        headers: { 
          'Content-Type': file.type,
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      
      let fileUrl = `${import.meta.env.VITE_API_URL || 'https://api.heirloom.blue/api'}/voice/file/${encodeURIComponent(urlData.key)}`;
      
      // Try to get the file URL from the upload response
      try {
        const uploadResult = await uploadResponse.json();
        if (uploadResult.fileUrl) {
          fileUrl = uploadResult.fileUrl;
        }
      } catch {
        // Response might not be JSON, use default URL
      }
      
            return voiceApi.create({
              title: data.form.title || 'Untitled Recording',
              fileKey: urlData.key,
              fileUrl,
              mimeType: file.type,
              duration: Math.floor(recordingTime),
              fileSize: file.size,
              recipientIds: data.form.recipientIds,
              recordingDate: data.form.recordingDate || undefined, // For historic recordings
            });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['voice'] });
      queryClient.invalidateQueries({ queryKey: ['voice-stats'] });
      showToast('Recording saved successfully', 'success');
      resetRecording();
    },
      onError: () => {
        showToast('Failed to save recording', 'error');
      },
    });

    // Transcription mutation
    const transcribeMutation = useMutation({
      mutationFn: async (recordingId: string) => {
        setTranscribingId(recordingId);
        return transcriptionApi.transcribe(recordingId);
      },
      onSuccess: (response) => {
        queryClient.invalidateQueries({ queryKey: ['voice'] });
        showToast('Transcription complete', 'success');
        if (response.data?.transcript) {
          setExpandedTranscriptId(transcribingId);
        }
        setTranscribingId(null);
      },
      onError: () => {
        showToast('Failed to transcribe recording', 'error');
        setTranscribingId(null);
      },
    });

    // Waveform animation during recording
  useEffect(() => {
    if (!isRecording || !analyserRef.current) return;
    
    const analyser = analyserRef.current;
    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    
    const updateWaveform = () => {
      analyser.getByteFrequencyData(dataArray);
      
      const samples = 40;
      const blockSize = Math.floor(dataArray.length / samples);
      const newData = [];
      
      for (let i = 0; i < samples; i++) {
        let sum = 0;
        for (let j = 0; j < blockSize; j++) {
          sum += dataArray[i * blockSize + j];
        }
        newData.push(sum / blockSize / 255);
      }
      
      setWaveformData(newData);
      animationRef.current = requestAnimationFrame(updateWaveform);
    };
    
    updateWaveform();
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isRecording]);

  // Convert audio blob to MP3 for cross-browser compatibility
  const convertToMp3 = async (audioBlob: Blob): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const arrayBuffer = reader.result as ArrayBuffer;
          const audioContext = new AudioContext();
          const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
          
          const sampleRate = audioBuffer.sampleRate;
          const numChannels = audioBuffer.numberOfChannels;
          const samples = audioBuffer.length;
          
          // Get audio data as Float32Array
          const leftChannel = audioBuffer.getChannelData(0);
          const rightChannel = numChannels > 1 ? audioBuffer.getChannelData(1) : leftChannel;
          
          // Convert Float32 to Int16 for MP3 encoding
          const leftInt16 = new Int16Array(samples);
          const rightInt16 = new Int16Array(samples);
          
          for (let i = 0; i < samples; i++) {
            // Clamp values to [-1, 1] and convert to Int16 range
            leftInt16[i] = Math.max(-32768, Math.min(32767, Math.floor(leftChannel[i] * 32767)));
            rightInt16[i] = Math.max(-32768, Math.min(32767, Math.floor(rightChannel[i] * 32767)));
          }
          
          // Create MP3 encoder (128kbps for good quality/size balance)
          const mp3Encoder = new Mp3Encoder(numChannels, sampleRate, 128);
          const mp3Data: ArrayBuffer[] = [];
          
          // Encode in chunks of 1152 samples (MP3 frame size)
          const chunkSize = 1152;
          for (let i = 0; i < samples; i += chunkSize) {
            const leftChunk = leftInt16.subarray(i, Math.min(i + chunkSize, samples));
            const rightChunk = numChannels > 1 ? rightInt16.subarray(i, Math.min(i + chunkSize, samples)) : undefined;
            
            const mp3buf = mp3Encoder.encodeBuffer(leftChunk, rightChunk);
            if (mp3buf.length > 0) {
              // Convert Int8Array to ArrayBuffer for Blob compatibility
              mp3Data.push(new Uint8Array(mp3buf).buffer);
            }
          }
          
          // Flush remaining data
          const mp3End = mp3Encoder.flush();
          if (mp3End.length > 0) {
            mp3Data.push(new Uint8Array(mp3End).buffer);
          }
          
          // Combine all MP3 chunks into a single blob
          const mp3Blob = new Blob(mp3Data, { type: 'audio/mpeg' });
          resolve(mp3Blob);
        } catch (error) {
          console.error('MP3 encoding error:', error);
          // Fall back to original blob if encoding fails
          resolve(audioBlob);
        }
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsArrayBuffer(audioBlob);
    });
  };

  // Detect the best supported audio format for recording
  const getRecordingMimeType = (): { mimeType: string; extension: string } => {
    // Prefer MP4/AAC for Safari compatibility, fall back to WebM for others
    const formats = [
      { mimeType: 'audio/mp4', extension: 'mp4' },
      { mimeType: 'audio/webm;codecs=opus', extension: 'webm' },
      { mimeType: 'audio/webm', extension: 'webm' },
      { mimeType: 'audio/ogg;codecs=opus', extension: 'ogg' },
    ];
    
    for (const format of formats) {
      if (MediaRecorder.isTypeSupported(format.mimeType)) {
        return format;
      }
    }
    
    // Fallback - let browser choose default
    return { mimeType: '', extension: 'webm' };
  };

  const recordingFormatRef = useRef<{ mimeType: string; extension: string }>({ mimeType: '', extension: 'webm' });

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;
      
      // Get the best supported format for this browser
      const format = getRecordingMimeType();
      recordingFormatRef.current = format;
      
      // Create MediaRecorder with the detected format
      const options: MediaRecorderOptions = format.mimeType ? { mimeType: format.mimeType } : {};
      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];
      
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        // Use the actual mimeType from the recorder (may differ from requested)
        const actualMimeType = mediaRecorder.mimeType || format.mimeType || 'audio/webm';
        const blob = new Blob(chunksRef.current, { type: actualMimeType });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorder.start(100);
      setIsRecording(true);
      
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      
    } catch (error) {
      showToast('Could not access microphone', 'error');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setWaveformData(new Array(40).fill(0));
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
  };

    const resetRecording = () => {
      setAudioBlob(null);
      setAudioUrl(null);
      setRecordingTime(0);
      setIsPlaying(false);
      setForm({ title: '', promptId: null, recipientIds: [], recordingDate: '' });
      setSelectedPrompt(null);
    };

  const togglePlayback = () => {
    if (!audioRef.current || !audioUrl) return;
    
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSave = () => {
    if (!audioBlob) return;
    uploadMutation.mutate({ blob: audioBlob, form });
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleRecipient = (id: string) => {
    setForm(prev => ({
      ...prev,
      recipientIds: prev.recipientIds.includes(id)
        ? prev.recipientIds.filter(r => r !== id)
        : [...prev.recipientIds, id],
    }));
  };

  // State for AI-generated prompts
  const [allPrompts, setAllPrompts] = useState<{ id: string; text: string; category: string }[]>([]);
  const [visiblePrompts, setVisiblePrompts] = useState<{ id: string; text: string; category: string }[]>([]);
  const [isLoadingPrompts, setIsLoadingPrompts] = useState(false);

  // Fetch prompts from AI API
  const fetchPrompts = async () => {
    setIsLoadingPrompts(true);
    try {
      const { data } = await aiApi.getPrompts(12);
      if (data.prompts && data.prompts.length > 0) {
        const formattedPrompts = data.prompts.map((p: { id: string; prompt: string; category: string }) => ({
          id: p.id,
          text: p.prompt,
          category: p.category || 'General',
        }));
        setAllPrompts(formattedPrompts);
        // Show first 4 prompts
        setVisiblePrompts(formattedPrompts.slice(0, 4));
      }
    } catch {
      // Prompts are optional, fail silently
    } finally {
      setIsLoadingPrompts(false);
    }
  };

  // Fetch prompts on mount
  useEffect(() => {
    fetchPrompts();
  }, []);

  // Helper to get random prompts from loaded prompts
  const getRandomPrompts = (count: number) => {
    if (allPrompts.length === 0) return [];
    const shuffled = [...allPrompts].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  };

  // Shuffle prompts
  const shufflePrompts = () => {
    if (allPrompts.length > 0) {
      setVisiblePrompts(getRandomPrompts(4));
    } else {
      // If no prompts loaded, try fetching again
      fetchPrompts();
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Sanctuary Background */}
      <div className="sanctuary-bg">
        <div className="sanctuary-orb sanctuary-orb-1" />
        <div className="sanctuary-orb sanctuary-orb-2" />
        <div className="sanctuary-orb sanctuary-orb-3" />
        <div className="sanctuary-stars" />
        <div className="sanctuary-mist" />
      </div>

      <Navigation />

      {/* Soft ambient glow */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-blood/5 rounded-full blur-[150px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-gold/5 rounded-full blur-[150px]" />
      </div>

      {/* Hidden audio element */}
      {audioUrl && (
        <audio
          ref={audioRef}
          src={audioUrl}
          onEnded={() => setIsPlaying(false)}
        />
      )}

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-50 px-6 py-4 rounded-xl glass-strong flex items-center gap-3 ${
              toast.type === 'success' ? 'border-l-4 border-green-500' : 'border-l-4 border-red-500'
            }`}
          >
            {toast.type === 'success' ? <Check className="text-green-400" size={20} /> : <X className="text-red-400" size={20} />}
            <span>{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative z-10 px-6 md:px-12 pt-24 md:pt-28 pb-12">
        <motion.button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 text-paper/40 hover:text-gold transition-colors mb-8 group"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          whileHover={{ x: -4 }}
        >
          <ArrowLeft size={20} />
          Back to Vault
        </motion.button>

        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <h1 className="text-4xl md:text-5xl font-light mb-2">Record Your <em>Voice</em></h1>
            <p className="text-paper/50">Let your loved ones hear your voice forever</p>
            {stats && (
              <div className="mt-4 text-sm text-paper/40">
                {stats.totalMinutes || 0} minutes recorded • {stats.totalRecordings || 0} recordings
              </div>
            )}
          </motion.div>

          {/* Inspiration Prompt - Top of page */}
          <InspirationPrompt
            prompts={visiblePrompts.map(p => p.text)}
            storageKey="record_inspiration"
            onUsePrompt={(prompt) => setSelectedPrompt(prompt)}
            className="mb-8"
          />

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Recording Area */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="lg:col-span-2"
            >
              {/* Vintage Recorder Device */}
              <div className="card relative overflow-hidden sm:overflow-visible">
                {/* Device body - compact padding on mobile */}
                <div 
                  className="rounded-2xl p-3 sm:p-6 relative"
                  style={{
                    background: 'linear-gradient(180deg, #2a2520 0%, #1a1510 50%, #0f0d0a 100%)',
                    boxShadow: '0 30px 60px -15px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.05), inset 0 -2px 0 rgba(0,0,0,0.5)',
                  }}
                >
                  {/* Chrome trim */}
                  <div className="absolute top-0 left-8 right-8 h-1 bg-gradient-to-r from-transparent via-gold/30 to-transparent rounded-full" />
                  
                  {/* Reels - smaller on mobile for better fit */}
                  <div className="flex justify-center gap-4 sm:gap-12 mb-4 sm:mb-8">
                    {[0, 1].map((i) => (
                      <motion.div
                        key={i}
                        className="relative"
                        animate={isRecording ? { rotate: 360 } : {}}
                        transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                      >
                        <div 
                          className="w-12 h-12 sm:w-20 sm:h-20 rounded-full relative"
                          style={{
                            background: 'radial-gradient(circle at 30% 30%, #4a4540 0%, #2a2520 50%, #1a1510 100%)',
                            boxShadow: 'inset 0 4px 8px rgba(0,0,0,0.5), 0 2px 4px rgba(0,0,0,0.3)',
                          }}
                        >
                          {/* Center hub */}
                          <div className="absolute inset-4 rounded-full bg-gradient-to-br from-gold/20 to-transparent" />
                          <div className="absolute inset-8 rounded-full bg-void" />
                          {/* Spokes */}
                          {[0, 60, 120, 180, 240, 300].map((deg) => (
                            <div
                              key={deg}
                              className="absolute top-1/2 left-1/2 w-8 h-0.5 bg-gold/20 origin-left"
                              style={{ transform: `rotate(${deg}deg)` }}
                            />
                          ))}
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  {/* Waveform Display - smaller on mobile */}
                  <div 
                    className="h-20 sm:h-32 rounded-lg mb-4 sm:mb-8 flex items-center justify-center gap-1 px-4 relative overflow-hidden"
                    style={{
                      background: 'linear-gradient(180deg, #0a0908 0%, #151210 100%)',
                      boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.8)',
                    }}
                  >
                    {/* Screen glare */}
                    <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent pointer-events-none" />
                    
                    {/* Waveform bars */}
                    {waveformData.map((value, i) => (
                      <motion.div
                        key={i}
                        className="w-1.5 rounded-full"
                        style={{
                          background: isRecording 
                            ? `linear-gradient(180deg, #c9a959 0%, #8b2942 100%)`
                            : 'rgba(201,169,89,0.3)',
                        }}
                        animate={{
                          height: isRecording ? `${Math.max(8, value * 100)}%` : '8px',
                        }}
                        transition={{ duration: 0.05 }}
                      />
                    ))}
                    
                    {/* Idle state message */}
                    {!isRecording && !audioBlob && (
                      <div className="absolute inset-0 flex items-center justify-center bg-void/80 backdrop-blur-sm">
                        <span className="text-gold/60 text-sm tracking-wider font-medium">READY TO RECORD</span>
                      </div>
                    )}
                    
                    {/* Playback state */}
                    {!isRecording && audioBlob && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-gold/60 text-sm tracking-wider">
                          {isPlaying ? 'PLAYING...' : 'RECORDING READY'}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Controls - smaller on mobile */}
                  <div className="flex items-center justify-center gap-3 sm:gap-6">
                    {/* Timer */}
                    <div 
                      className="px-3 sm:px-6 py-2 sm:py-3 rounded-lg font-mono text-lg sm:text-2xl"
                      style={{
                        background: '#0a0908',
                        boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.8)',
                        color: isRecording ? '#c9a959' : 'rgba(201,169,89,0.4)',
                      }}
                    >
                      {formatTime(recordingTime)}
                    </div>

                    {/* Main record/stop button */}
                    {!audioBlob ? (
                      <motion.button
                        onClick={isRecording ? stopRecording : startRecording}
                        className="relative"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <div 
                          className="w-14 h-14 sm:w-20 sm:h-20 rounded-full flex items-center justify-center relative"
                          style={{
                            background: isRecording 
                              ? 'linear-gradient(180deg, #a83250 0%, #8b2942 100%)'
                              : 'linear-gradient(180deg, #3a3530 0%, #2a2520 100%)',
                            boxShadow: isRecording
                              ? '0 0 30px rgba(139,41,66,0.5), inset 0 2px 0 rgba(255,255,255,0.1)'
                              : 'inset 0 2px 0 rgba(255,255,255,0.05), inset 0 -2px 0 rgba(0,0,0,0.3)',
                          }}
                        >
                          {isRecording ? (
                            <Square size={28} className="text-paper" fill="currentColor" />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-blood" />
                          )}
                        </div>
                        {isRecording && (
                          <motion.div
                            className="absolute inset-0 rounded-full border-2 border-blood"
                            animate={{ scale: [1, 1.3], opacity: [0.8, 0] }}
                            transition={{ duration: 1, repeat: Infinity }}
                          />
                        )}
                      </motion.button>
                    ) : (
                      <div className="flex items-center gap-4">
                        {/* Play/Pause */}
                        <motion.button
                          onClick={togglePlayback}
                          className="w-16 h-16 rounded-full flex items-center justify-center"
                          style={{
                            background: 'linear-gradient(180deg, #3a3530 0%, #2a2520 100%)',
                            boxShadow: 'inset 0 2px 0 rgba(255,255,255,0.05)',
                          }}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          {isPlaying ? (
                            <Pause size={24} className="text-gold" />
                          ) : (
                            <Play size={24} className="text-gold ml-1" />
                          )}
                        </motion.button>

                        {/* Delete */}
                        <motion.button
                          onClick={resetRecording}
                          className="w-12 h-12 rounded-full flex items-center justify-center"
                          style={{
                            background: 'linear-gradient(180deg, #3a3530 0%, #2a2520 100%)',
                          }}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <Trash2 size={18} className="text-blood/70" />
                        </motion.button>
                      </div>
                    )}
                  </div>

                  {/* VU Meters - hidden on mobile to save space */}
                  <div className="hidden sm:flex justify-center gap-4 mt-4 sm:mt-6">
                    {[0, 1].map((i) => (
                      <div key={i} className="flex items-end gap-0.5">
                        {[...Array(8)].map((_, j) => (
                          <motion.div
                            key={j}
                            className="w-2 rounded-sm"
                            style={{
                              background: j < 6 ? '#22c55e' : j < 7 ? '#eab308' : '#ef4444',
                            }}
                            animate={{
                              height: isRecording ? `${Math.random() * 20 + 4}px` : '4px',
                              opacity: isRecording ? 1 : 0.3,
                            }}
                            transition={{ duration: 0.1 }}
                          />
                        ))}
                      </div>
                    ))}
                  </div>

                  {/* Brand label - hidden on mobile */}
                  <div className="hidden sm:block text-center mt-4 sm:mt-6">
                    <span className="text-gold/30 text-xs tracking-[0.3em]">HEIRLOOM RECORDER</span>
                  </div>
                </div>
              </div>

              {/* Save Form (shows after recording) */}
              <AnimatePresence>
                {audioBlob && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="card mt-6"
                  >
                    <h3 className="text-lg mb-4 flex items-center gap-2">
                      <Save size={18} className="text-gold" />
                      Save Recording
                    </h3>
                    
                    <div className="space-y-4">
                                            <div>
                                              <label className="block text-sm text-paper/50 mb-2">Title</label>
                                              <input
                                                type="text"
                                                value={form.title}
                                                onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))}
                                                placeholder="Give this recording a name"
                                                className="input"
                                              />
                                            </div>

                                            {/* Recording Date - for historic recordings */}
                                            <div>
                                              <label className="block text-sm text-paper/50 mb-2">When was this recorded? (optional)</label>
                                              <input
                                                type="date"
                                                value={form.recordingDate}
                                                onChange={(e) => setForm(prev => ({ ...prev, recordingDate: e.target.value }))}
                                                max={new Date().toISOString().split('T')[0]}
                                                className="input"
                                              />
                                              <p className="text-xs text-paper/40 mt-1">Leave empty to use today's date</p>
                                            </div>

                                                                  <div>
                                                                    <label className="block text-sm text-paper/50 mb-2">Share with (optional)</label>
                                              <div className="flex flex-wrap gap-2">
                                                {family?.map((member: any) => (
                                                  <button
                                                    key={member.id}
                                                    type="button"
                                                    onClick={() => toggleRecipient(member.id)}
                                                    className={`px-3 py-2 rounded-lg text-sm transition-all ${
                                                      form.recipientIds.includes(member.id)
                                                        ? 'glass bg-gold/20 text-gold border border-gold/30'
                                                        : 'glass text-paper/60 hover:text-paper'
                                                    }`}
                                                  >
                                                    {member.name}
                                                  </button>
                                                ))}
                                                <button
                                                  type="button"
                                                  onClick={() => setShowAddFamilyModal(true)}
                                                  className="px-3 py-2 rounded-lg text-sm border border-dashed border-gold/30 text-paper/40 hover:border-gold/50 hover:text-paper/60 transition-all flex items-center gap-1.5"
                                                >
                                                  <Plus size={14} />
                                                  Add Family Member
                                                </button>
                                              </div>
                                            </div>

                      <motion.button
                        onClick={handleSave}
                        disabled={uploadMutation.isPending}
                        className="btn btn-primary w-full"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        {uploadMutation.isPending ? (
                          <>
                            <Loader2 size={18} className="animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save size={18} />
                            Save to Vault
                          </>
                        )}
                      </motion.button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Prompts Panel */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="space-y-4"
            >
              <div className="card p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Lightbulb size={16} className="text-gold" />
                    <h3 className="text-base">Story Prompts</h3>
                  </div>
                  <motion.button
                    onClick={shufflePrompts}
                    className="p-2 rounded-lg glass hover:bg-white/10 transition-colors"
                    whileHover={{ rotate: 180 }}
                    whileTap={{ scale: 0.9 }}
                    title="Shuffle prompts"
                  >
                    <RefreshCw size={14} className="text-gold" />
                  </motion.button>
                </div>
                <p className="text-paper/50 text-xs mb-3">
                  Select a prompt to guide your recording.
                </p>
                
                <div className="space-y-1.5">
                  {isLoadingPrompts ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 size={20} className="text-gold animate-spin" />
                      <span className="ml-2 text-sm text-paper/50">Loading prompts...</span>
                    </div>
                  ) : visiblePrompts.length === 0 ? (
                    <p className="text-sm text-paper/40 text-center py-4">No prompts available. Click refresh to try again.</p>
                  ) : (
                    visiblePrompts.map((prompt) => (
                      <motion.button
                        key={prompt.id}
                        onClick={() => {
                          setSelectedPrompt(prompt.id);
                          setForm(prev => ({ ...prev, promptId: prompt.id, title: prompt.text.slice(0, 50) }));
                        }}
                        className={`w-full text-left p-3 rounded-lg transition-all ${
                          selectedPrompt === prompt.id
                            ? 'glass bg-gold/20 border border-gold/30'
                            : 'glass hover:bg-white/5'
                        }`}
                        whileHover={{ x: 2 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <span className="text-xs text-gold/60 tracking-wider">{prompt.category}</span>
                        <p className="text-xs mt-0.5 leading-relaxed">{prompt.text}</p>
                      </motion.button>
                    ))
                  )}
                </div>
              </div>

              {/* Tips */}
              <div className="card bg-void-elevated/50">
                <h4 className="text-sm text-gold mb-3">Recording Tips</h4>
                <ul className="space-y-2 text-sm text-paper/50">
                  <li className="flex items-start gap-2">
                    <Check size={14} className="text-green-400 mt-1 flex-shrink-0" />
                    Find a quiet space with minimal echo
                  </li>
                  <li className="flex items-start gap-2">
                    <Check size={14} className="text-green-400 mt-1 flex-shrink-0" />
                    Speak naturally, as if talking to a loved one
                  </li>
                  <li className="flex items-start gap-2">
                    <Check size={14} className="text-green-400 mt-1 flex-shrink-0" />
                    Don't worry about perfection—authenticity matters
                  </li>
                  <li className="flex items-start gap-2">
                    <Check size={14} className="text-green-400 mt-1 flex-shrink-0" />
                    You can record multiple takes
                  </li>
                </ul>
              </div>
            </motion.div>
          </div>

          {/* Previous Recordings Section with Timeline Slider */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-8"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-light flex items-center gap-2">
                <Volume2 size={20} className="text-gold" />
                Previous Recordings
              </h2>
              <button
                onClick={() => setShowRecordingsList(!showRecordingsList)}
                className="btn btn-secondary text-sm"
              >
                {showRecordingsList ? 'Hide' : 'Show'} Timeline
              </button>
            </div>

            <AnimatePresence>
              {showRecordingsList && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  {/* Timeline Slider */}
                  <div className="mb-8">
                    {/* Year Selector */}
                    <div className="flex items-center justify-center gap-4 mb-4">
                      <button
                        onClick={() => {
                          const idx = availableYears.indexOf(selectedYear);
                          if (idx < availableYears.length - 1) {
                            setSelectedYear(availableYears[idx + 1]);
                            setSelectedMonth(null);
                          }
                        }}
                        disabled={availableYears.indexOf(selectedYear) === availableYears.length - 1}
                        className="p-2 glass rounded-full text-paper/50 hover:text-gold disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      >
                        <ChevronLeft size={20} />
                      </button>
                      <div className="flex items-center gap-2">
                        <Calendar size={18} className="text-gold" />
                        <span className="text-2xl font-light text-gold">{selectedYear}</span>
                      </div>
                      <button
                        onClick={() => {
                          const idx = availableYears.indexOf(selectedYear);
                          if (idx > 0) {
                            setSelectedYear(availableYears[idx - 1]);
                            setSelectedMonth(null);
                          }
                        }}
                        disabled={availableYears.indexOf(selectedYear) === 0}
                        className="p-2 glass rounded-full text-paper/50 hover:text-gold disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      >
                        <ChevronRight size={20} />
                      </button>
                    </div>

                    {/* Month Slider */}
                    <div className="flex items-center justify-center gap-2 flex-wrap mb-6">
                      <button
                        onClick={() => setSelectedMonth(null)}
                        className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                          selectedMonth === null
                            ? 'bg-gold text-void font-medium'
                            : 'glass text-paper/60 hover:text-paper hover:bg-white/10'
                        }`}
                      >
                        All
                      </button>
                      {MONTHS.map((month, idx) => (
                        <button
                          key={month}
                          onClick={() => setSelectedMonth(selectedMonth === idx ? null : idx)}
                          className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                            selectedMonth === idx
                              ? 'bg-gold text-void font-medium'
                              : 'glass text-paper/60 hover:text-paper hover:bg-white/10'
                          }`}
                        >
                          {month}
                        </button>
                      ))}
                    </div>

                    {/* Emotion Filter */}
                    <div className="flex items-center justify-center gap-2 flex-wrap">
                      <span className="text-paper/40 text-sm mr-2">Filter by emotion:</span>
                      <button
                        onClick={() => setSelectedEmotion(null)}
                        className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                          selectedEmotion === null
                            ? 'bg-white/20 text-paper font-medium'
                            : 'glass text-paper/50 hover:text-paper'
                        }`}
                      >
                        All
                      </button>
                      {EMOTIONS.map((emotion) => {
                        const Icon = emotion.icon;
                        const count = emotionCounts[emotion.value] || 0;
                        return (
                          <button
                            key={emotion.value}
                            onClick={() => setSelectedEmotion(selectedEmotion === emotion.value ? null : emotion.value)}
                            className={`px-3 py-1.5 rounded-full text-sm transition-all flex items-center gap-1.5 ${
                              selectedEmotion === emotion.value
                                ? emotion.color + ' font-medium'
                                : 'glass text-paper/50 hover:text-paper'
                            }`}
                          >
                            <Icon size={14} />
                            {emotion.label}
                            {count > 0 && <span className="text-xs opacity-60">({count})</span>}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Recordings List */}
                  {filteredRecordings.length > 0 ? (
                    <div className="space-y-3">
                                            {filteredRecordings.map((recording: VoiceRecording) => {
                                              const emotionData = EMOTIONS.find(e => e.value === recording.emotion);
                                              const EmotionIcon = emotionData?.icon;
                                              return (
                                                <React.Fragment key={recording.id}>
                                                <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="card p-4 flex items-center justify-between"
                          >
                            <div className="flex items-center gap-4">
                              <button
                                onClick={() => {
                                  if (playingRecordingId === recording.id) {
                                    if (savedAudioRef.current) {
                                      savedAudioRef.current.pause();
                                    }
                                    setPlayingRecordingId(null);
                                  } else {
                                    if (savedAudioRef.current) {
                                      savedAudioRef.current.pause();
                                    }
                                    if (recording.fileUrl) {
                                      const audio = new Audio(recording.fileUrl);
                                      savedAudioRef.current = audio;
                                      audio.onended = () => setPlayingRecordingId(null);
                                      audio.onerror = () => {
                                        showToast('Failed to play recording', 'error');
                                        setPlayingRecordingId(null);
                                      };
                                      audio.play().catch(() => {
                                        showToast('Failed to play recording', 'error');
                                        setPlayingRecordingId(null);
                                      });
                                      setPlayingRecordingId(recording.id);
                                    } else {
                                      showToast('Recording file not available', 'error');
                                    }
                                  }
                                }}
                                className="w-10 h-10 rounded-full glass flex items-center justify-center hover:bg-white/10 transition-colors"
                              >
                                {playingRecordingId === recording.id ? (
                                  <Pause size={18} className="text-gold" />
                                ) : (
                                  <Play size={18} className="text-gold ml-0.5" />
                                )}
                              </button>
                              <div>
                                <h4 className="font-medium">{recording.title}</h4>
                                <div className="flex items-center gap-3 text-sm text-paper/50">
                                  <span>{formatTime(recording.duration)}</span>
                                  <span>{new Date(recording.createdAt).toLocaleDateString()}</span>
                                </div>
                              </div>
                            </div>
                                                      <div className="flex items-center gap-3">
                                                        {emotionData && EmotionIcon && (
                                                          <span className={`px-3 py-1 rounded-full text-xs flex items-center gap-1.5 ${emotionData.color}`}>
                                                            <EmotionIcon size={12} />
                                                            {emotionData.label}
                                                          </span>
                                                        )}
                                                        {recording.transcript ? (
                                                          <button
                                                            onClick={() => setExpandedTranscriptId(
                                                              expandedTranscriptId === recording.id ? null : recording.id
                                                            )}
                                                            className="p-2 glass rounded-lg hover:bg-white/10 transition-colors"
                                                            title="View transcript"
                                                          >
                                                            <FileText size={16} className="text-gold" />
                                                          </button>
                                                        ) : (
                                                          <button
                                                            onClick={() => transcribeMutation.mutate(recording.id)}
                                                            disabled={transcribingId === recording.id}
                                                            className="p-2 glass rounded-lg hover:bg-white/10 transition-colors disabled:opacity-50"
                                                            title="Transcribe recording"
                                                          >
                                                            {transcribingId === recording.id ? (
                                                              <Loader2 size={16} className="animate-spin text-gold" />
                                                            ) : (
                                                              <FileText size={16} className="text-paper/50" />
                                                            )}
                                                          </button>
                                                        )}
                                                                            </div>
                                                  </motion.div>
                                                  {expandedTranscriptId === recording.id && recording.transcript && (
                                                    <motion.div
                                                      initial={{ opacity: 0, height: 0 }}
                                                      animate={{ opacity: 1, height: 'auto' }}
                                                      exit={{ opacity: 0, height: 0 }}
                                                      className="card p-4 ml-14 mt-2 bg-void/50"
                                                    >
                                                      <p className="text-sm text-paper/70 leading-relaxed">{recording.transcript}</p>
                                                                                                </motion.div>
                                                                        )}
                                                                      </React.Fragment>
                                                                    );
                                                                  })}
                    </div>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-center py-12"
                    >
                      {recordings?.data?.length > 0 ? (
                        <>
                          <h3 className="text-xl font-light mb-2">No recordings match your filters</h3>
                          <p className="text-paper/50 mb-6">Try adjusting the year, month, or emotion filter</p>
                          <button 
                            onClick={() => {
                              setSelectedMonth(null);
                              setSelectedEmotion(null);
                            }} 
                            className="btn btn-secondary"
                          >
                            Clear Filters
                          </button>
                        </>
                      ) : (
                        <>
                          <h3 className="text-xl font-light mb-2">No recordings yet</h3>
                          <p className="text-paper/50">Start recording your voice messages above</p>
                        </>
                      )}
                    </motion.div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>

      {/* Add Family Member Modal */}
      <AddFamilyMemberModal
        isOpen={showAddFamilyModal}
        onClose={() => setShowAddFamilyModal(false)}
        onCreated={(member) => {
          queryClient.setQueryData(['family'], (old: any) => {
            if (!old) return [member];
            if (Array.isArray(old)) return [...old, member];
            return old;
          });
          setForm(prev => ({
            ...prev,
            recipientIds: [...prev.recipientIds, member.id],
          }));
        }}
      />
    </div>
  );
}
