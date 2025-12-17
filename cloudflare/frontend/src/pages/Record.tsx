import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Square, Play, Pause, Save, Trash2, Loader2, Check, X, Lightbulb } from 'lucide-react';
import { voiceApi, familyApi } from '../services/api';

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
  });
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
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

  const uploadMutation = useMutation({
    mutationFn: async (data: { blob: Blob; form: typeof form }) => {
      const file = new File([data.blob], 'recording.webm', { type: 'audio/webm' });
      
      const { data: urlData } = await voiceApi.getUploadUrl({
        filename: file.name,
        contentType: file.type,
      });
      
      await fetch(urlData.uploadUrl, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type },
      });
      
      // Construct the file URL for playback
      // @ts-ignore - Vite env types
      const fileUrl = `${import.meta.env?.VITE_API_URL || 'https://api.heirloom.blue/api'}/voice/file/${encodeURIComponent(urlData.key)}`;
      
      return voiceApi.create({
        title: data.form.title || 'Untitled Recording',
        fileKey: urlData.key,
        fileUrl,
        mimeType: file.type,
        duration: Math.floor(recordingTime),
        fileSize: file.size,
        recipientIds: data.form.recipientIds,
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

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;
      
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];
      
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
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
    setForm({ title: '', promptId: null, recipientIds: [] });
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

  const prompts = [
    { id: '1', text: 'Tell me about the happiest day of your life', category: 'Memories' },
    { id: '2', text: 'What advice would you give your younger self?', category: 'Wisdom' },
    { id: '3', text: 'Describe your favorite family tradition', category: 'Family' },
    { id: '4', text: 'What do you want your children to know about you?', category: 'Legacy' },
    { id: '5', text: 'Share a story about how you met your partner', category: 'Love' },
    { id: '6', text: 'What are you most grateful for in life?', category: 'Gratitude' },
  ];

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

      <div className="relative z-10 px-6 md:px-12 py-12">
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
            className="text-center mb-12"
          >
            <h1 className="text-4xl md:text-5xl font-light mb-2">Record Your <em>Voice</em></h1>
            <p className="text-paper/50">Let your loved ones hear your voice forever</p>
            {stats && (
              <div className="mt-4 text-sm text-paper/40">
                {stats.totalMinutes || 0} minutes recorded • {stats.totalRecordings || 0} recordings
              </div>
            )}
          </motion.div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Recording Area */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="lg:col-span-2"
            >
              {/* Vintage Recorder Device */}
              <div className="card relative overflow-visible">
                {/* Device body */}
                <div 
                  className="rounded-2xl p-8 relative"
                  style={{
                    background: 'linear-gradient(180deg, #2a2520 0%, #1a1510 50%, #0f0d0a 100%)',
                    boxShadow: '0 30px 60px -15px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.05), inset 0 -2px 0 rgba(0,0,0,0.5)',
                  }}
                >
                  {/* Chrome trim */}
                  <div className="absolute top-0 left-8 right-8 h-1 bg-gradient-to-r from-transparent via-gold/30 to-transparent rounded-full" />
                  
                  {/* Reels */}
                  <div className="flex justify-center gap-16 mb-8">
                    {[0, 1].map((i) => (
                      <motion.div
                        key={i}
                        className="relative"
                        animate={isRecording ? { rotate: 360 } : {}}
                        transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                      >
                        <div 
                          className="w-24 h-24 rounded-full relative"
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

                  {/* Waveform Display */}
                  <div 
                    className="h-32 rounded-lg mb-8 flex items-center justify-center gap-1 px-4 relative overflow-hidden"
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
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-gold/40 text-sm tracking-wider">READY TO RECORD</span>
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

                  {/* Controls */}
                  <div className="flex items-center justify-center gap-6">
                    {/* Timer */}
                    <div 
                      className="px-6 py-3 rounded-lg font-mono text-2xl"
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
                          className="w-20 h-20 rounded-full flex items-center justify-center relative"
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

                  {/* VU Meters */}
                  <div className="flex justify-center gap-4 mt-6">
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

                  {/* Brand label */}
                  <div className="text-center mt-6">
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
              className="space-y-6"
            >
              <div className="card">
                <div className="flex items-center gap-2 mb-4">
                  <Lightbulb size={18} className="text-gold" />
                  <h3 className="text-lg">Story Prompts</h3>
                </div>
                <p className="text-paper/50 text-sm mb-4">
                  Need inspiration? Select a prompt to guide your recording.
                </p>
                
                <div className="space-y-2">
                  {prompts.map((prompt) => (
                    <motion.button
                      key={prompt.id}
                      onClick={() => {
                        setSelectedPrompt(prompt.id);
                        setForm(prev => ({ ...prev, promptId: prompt.id, title: prompt.text.slice(0, 50) }));
                      }}
                      className={`w-full text-left p-4 rounded-lg transition-all ${
                        selectedPrompt === prompt.id
                          ? 'glass bg-gold/20 border border-gold/30'
                          : 'glass hover:bg-white/5'
                      }`}
                      whileHover={{ x: 4 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <span className="text-xs text-gold/60 tracking-wider">{prompt.category}</span>
                      <p className="text-sm mt-1">{prompt.text}</p>
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Tips */}
              <div className="card bg-void-light/50">
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
        </div>
      </div>
    </div>
  );
}
