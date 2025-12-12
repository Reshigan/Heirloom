import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Mic, Square, Play, Save } from 'lucide-react';
import { voiceApi, familyApi } from '../services/api';
import { PartnerIcon, HomeIcon, HolidayIcon, LightbulbIcon } from '../components/icons/StoryPromptIcons';

export function Record() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const animationRef = useRef<number>();
  
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [title, setTitle] = useState('');
  const [selectedPrompt, setSelectedPrompt] = useState<string | null>(null);
  const [recipientIds, setRecipientIds] = useState<string[]>([]);
  
  const { data: family } = useQuery({
    queryKey: ['family'],
    queryFn: () => familyApi.getAll().then(r => r.data),
  });
  
  const { data: recordings } = useQuery({
    queryKey: ['voice-recordings'],
    queryFn: () => voiceApi.getAll({ limit: 5 }).then(r => r.data.recordings),
  });
  
  // Timer effect
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;
    if (isRecording && !isPaused) {
      interval = setInterval(() => setRecordingTime(t => t + 1), 1000);
    }
    return () => { if (interval) clearInterval(interval); };
  }, [isRecording, isPaused]);
  
  // Waveform animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d')!;
    const width = canvas.width;
    const height = canvas.height;
    
    const drawWaveform = () => {
      ctx.fillStyle = 'rgba(5, 5, 5, 0.1)';
      ctx.fillRect(0, 0, width, height);
      
      ctx.strokeStyle = isRecording ? '#8b2942' : '#c9a959';
      ctx.lineWidth = 2;
      ctx.beginPath();
      
      const amplitude = isRecording ? 40 : 20;
      const frequency = 0.02;
      const time = Date.now() * 0.002;
      
      for (let x = 0; x < width; x++) {
        const y = height / 2 + Math.sin(x * frequency + time) * amplitude * Math.sin(x * 0.01);
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      
      ctx.stroke();
      animationRef.current = requestAnimationFrame(drawWaveform);
    };
    
    drawWaveform();
    return () => cancelAnimationFrame(animationRef.current!);
  }, [isRecording]);
  
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };
      
      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorder.start(100);
      setIsRecording(true);
      setRecordingTime(0);
    } catch (err) {
      alert('Microphone access required');
    }
  };
  
  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
    setIsPaused(false);
  };
  
  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!audioBlob) throw new Error('No recording');
      
      // Get upload URL
      const { data: upload } = await voiceApi.getUploadUrl({
        filename: `recording-${Date.now()}.webm`,
        contentType: 'audio/webm',
      });
      
      // Upload to S3
      await fetch(upload.uploadUrl, {
        method: 'PUT',
        body: audioBlob,
        headers: { 'Content-Type': 'audio/webm' },
      });
      
      // Save recording
      return voiceApi.create({
        title: title || `Recording ${new Date().toLocaleDateString()}`,
        duration: recordingTime,
        prompt: selectedPrompt || undefined,
        recipientIds,
        fileKey: upload.key,
        fileUrl: upload.publicUrl,
        fileSize: audioBlob.size,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['voice-recordings'] });
      setAudioBlob(null);
      setTitle('');
      setRecordingTime(0);
      setSelectedPrompt(null);
    },
  });
  
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };
  
  return (
    <div className="min-h-screen px-6 md:px-12 py-12">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-paper/40 hover:text-gold transition-colors mb-8">
        <ArrowLeft size={20} />
        Back to Vault
      </button>
      
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-light mb-12">Record Your Voice</h1>
        
        <div className="grid md:grid-cols-2 gap-12">
          {/* Recording panel */}
          <div>
            {/* Orb */}
            <div className="relative w-48 h-48 mx-auto mb-8">
              <motion.div
                className="absolute inset-0 border border-gold/30 rounded-full"
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
              />
              <motion.div
                className="absolute inset-4 border border-gold/20 rounded-full"
                animate={{ rotate: -360 }}
                transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
              />
              
              {/* Record button */}
              <button
                onClick={isRecording ? stopRecording : startRecording}
                className={`absolute inset-8 rounded-full flex items-center justify-center transition-all ${
                  isRecording
                    ? 'bg-blood hover:bg-blood-light'
                    : 'bg-gradient-to-br from-gold to-gold-dim hover:shadow-lg hover:shadow-gold/20'
                }`}
              >
                {isRecording ? <Square size={32} className="text-paper" /> : <Mic size={32} className="text-void" />}
              </button>
            </div>
            
            {/* Timer */}
            <div className={`text-center text-5xl font-light mb-8 tabular-nums ${isRecording ? 'text-blood' : 'text-paper'}`}>
              {formatTime(recordingTime)}
            </div>
            
            {/* Waveform */}
            <canvas ref={canvasRef} width={400} height={100} className="w-full h-24 rounded bg-void-light" />
            
            {/* Title input */}
            {audioBlob && (
              <div className="mt-8 space-y-4">
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Name this recording..."
                  className="input"
                />
                
                <div className="flex gap-2 flex-wrap">
                  {family?.map((member: any) => (
                    <button
                      key={member.id}
                      onClick={() => setRecipientIds(prev => 
                        prev.includes(member.id) ? prev.filter(id => id !== member.id) : [...prev, member.id]
                      )}
                      className={`px-3 py-1 text-sm border transition-all ${
                        recipientIds.includes(member.id)
                          ? 'border-gold text-gold'
                          : 'border-white/10 text-paper/40'
                      }`}
                    >
                      {member.name}
                    </button>
                  ))}
                </div>
                
                <button
                  onClick={() => saveMutation.mutate()}
                  disabled={saveMutation.isPending}
                  className="btn btn-primary w-full flex items-center justify-center gap-2"
                >
                  <Save size={18} />
                  {saveMutation.isPending ? 'Saving...' : 'Save Recording'}
                </button>
              </div>
            )}
          </div>
          
          {/* Prompts & recent */}
          <div className="space-y-8">
            {/* Story prompts */}
            <div>
              <h3 className="text-lg text-paper/60 mb-4">Story Prompts</h3>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { icon: PartnerIcon, text: 'How did you meet your partner?' },
                  { icon: HomeIcon, text: 'Describe your childhood home' },
                  { icon: HolidayIcon, text: 'Favorite holiday memory' },
                  { icon: LightbulbIcon, text: 'Best advice you ever received' },
                ].map((prompt, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedPrompt(prompt.text)}
                    className={`p-4 text-left rounded-lg transition-all ${
                      selectedPrompt === prompt.text
                        ? 'glass-panel border-gold/30'
                        : 'glass-card hover:border-gold/20'
                    }`}
                  >
                    <prompt.icon size={28} className="text-gold mb-2" />
                    <span className="text-sm text-paper/60">{prompt.text}</span>
                  </button>
                ))}
              </div>
            </div>
            
            {/* Recent recordings */}
            <div>
              <h3 className="text-lg text-paper/60 mb-4">Recent Recordings</h3>
              <div className="space-y-3">
                {recordings?.map((rec: any) => (
                  <div key={rec.id} className="flex items-center gap-4 p-4 bg-white/[0.02] border border-white/[0.04]">
                    <button className="w-10 h-10 rounded-full border border-gold/30 flex items-center justify-center text-gold hover:bg-gold/10">
                      <Play size={16} />
                    </button>
                    <div className="flex-1">
                      <div className="text-paper">{rec.title}</div>
                      <div className="text-paper/40 text-sm">{formatTime(rec.duration)}</div>
                    </div>
                    <div className="flex gap-1">
                      {[...Array(8)].map((_, i) => (
                        <motion.div
                          key={i}
                          className="w-0.5 bg-gold/50"
                          animate={{ height: [8, 16, 8] }}
                          transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.1 }}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
