import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Pause, Stop, ArrowLeft, Sparkles, Loader2, Play, Check } from '../components/Icons';
import { voiceApi, aiApi } from '../services/api';

const SILENCE_THRESHOLD = 0.01;

interface TranscriptSegment {
  text: string;
  timestamp: number;
  isQuestion: boolean;
}

export function InterviewMode() {
  const navigate = useNavigate();
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState('Tell me about your earliest childhood memory.');
  const [followUpQuestions, setFollowUpQuestions] = useState<string[]>([]);
  const [transcript, setTranscript] = useState<TranscriptSegment[]>([]);
  const [duration, setDuration] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [isGeneratingQuestion, setIsGeneratingQuestion] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [silenceTimer, setSilenceTimer] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const silenceStartRef = useRef<number | null>(null);

  const startingPrompts = [
    'Tell me about your earliest childhood memory.',
    'What was the happiest day of your life?',
    'Describe the home you grew up in.',
    'Who had the biggest influence on your life?',
    'What\'s a lesson you learned the hard way?',
    'Tell me about a tradition in your family.',
    'What do you want your grandchildren to know about you?',
    'Describe a moment that changed everything.',
  ];

  useEffect(() => {
    setCurrentQuestion(startingPrompts[Math.floor(Math.random() * startingPrompts.length)]);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (audioContextRef.current) audioContextRef.current.close();
    };
  }, []);

  const monitorAudio = useCallback(() => {
    if (!analyserRef.current) return;
    const data = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteTimeDomainData(data);

    let sum = 0;
    for (let i = 0; i < data.length; i++) {
      const v = (data[i] - 128) / 128;
      sum += v * v;
    }
    const rms = Math.sqrt(sum / data.length);
    setAudioLevel(rms);

    if (rms < SILENCE_THRESHOLD) {
      if (!silenceStartRef.current) {
        silenceStartRef.current = Date.now();
      }
      setSilenceTimer(Date.now() - silenceStartRef.current);
    } else {
      silenceStartRef.current = null;
      setSilenceTimer(0);
    }

    animFrameRef.current = requestAnimationFrame(monitorAudio);
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      // Set up audio analysis
      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.start(1000);
      setIsRecording(true);
      setIsPaused(false);

      timerRef.current = setInterval(() => {
        setDuration((d) => d + 1);
      }, 1000);

      monitorAudio();

      setTranscript((prev) => [
        ...prev,
        { text: currentQuestion, timestamp: duration, isQuestion: true },
      ]);
    } catch (err) {
      console.error('Failed to start recording:', err);
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
      if (timerRef.current) clearInterval(timerRef.current);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    }
  };

  const resumeRecording = () => {
    if (mediaRecorderRef.current?.state === 'paused') {
      mediaRecorderRef.current.resume();
      setIsPaused(false);
      timerRef.current = setInterval(() => setDuration((d) => d + 1), 1000);
      monitorAudio();
    }
  };

  const generateFollowUp = async () => {
    setIsGeneratingQuestion(true);
    try {
      const response = await aiApi.interviewFollowup({
        currentQuestion,
        transcriptSoFar: transcript.map((s) => s.text).join(' '),
      });
      const questions = response.data?.questions || [
        'Can you tell me more about that?',
        'How did that make you feel?',
        'What happened next?',
      ];
      setFollowUpQuestions(questions);
    } catch {
      setFollowUpQuestions([
        'Can you tell me more about that?',
        'How did that make you feel?',
        'What happened next?',
      ]);
    }
    setIsGeneratingQuestion(false);
  };

  const selectFollowUp = (question: string) => {
    setCurrentQuestion(question);
    setFollowUpQuestions([]);
    setTranscript((prev) => [
      ...prev,
      { text: question, timestamp: duration, isQuestion: true },
    ]);
  };

  const stopAndSave = async () => {
    if (!mediaRecorderRef.current) return;
    setIsSaving(true);

    mediaRecorderRef.current.stop();
    if (timerRef.current) clearInterval(timerRef.current);
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    if (audioContextRef.current) audioContextRef.current.close();

    // Wait for data
    await new Promise((resolve) => setTimeout(resolve, 500));
    const blob = new Blob(chunksRef.current, { type: 'audio/webm' });

    try {
      const { data: uploadData } = await voiceApi.getUploadUrl({
        filename: `interview-${Date.now()}.webm`,
        contentType: 'audio/webm',
      });

      await fetch(uploadData.uploadUrl, {
        method: 'PUT',
        body: blob,
        headers: { 'Content-Type': 'audio/webm' },
      });

      await voiceApi.create({
        title: `Interview - ${new Date().toLocaleDateString()}`,
        fileKey: uploadData.key,
        fileUrl: uploadData.url,
        duration,
        recording_type: 'interview',
        interview_data: JSON.stringify({
          transcript,
          questions: transcript.filter((s) => s.isQuestion).map((s) => s.text),
        }),
      });

      navigate('/record');
    } catch (err) {
      console.error('Failed to save interview:', err);
    }
    setIsSaving(false);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Generate waveform bars from audio level
  const waveformBars = Array.from({ length: 40 }, (_, i) => {
    const baseHeight = Math.sin((i / 40) * Math.PI) * 0.5 + 0.5;
    const audioInfluence = audioLevel * 3;
    return Math.max(0.1, baseHeight * (0.3 + audioInfluence));
  });

  return (
    <div className="min-h-screen bg-void text-paper flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-6">
        <button
          onClick={() => navigate('/record')}
          className="flex items-center gap-2 text-paper/50 hover:text-paper transition-colors"
        >
          <ArrowLeft size={20} />
          <span className="text-sm">Exit Interview</span>
        </button>

        <div className="flex items-center gap-3">
          <div className={`w-2 h-2 rounded-full ${isRecording && !isPaused ? 'bg-red-500 animate-pulse' : 'bg-paper/20'}`} />
          <span className="font-mono text-lg text-paper/80">{formatTime(duration)}</span>
        </div>

        {isRecording && (
          <button
            onClick={stopAndSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gold/20 text-gold hover:bg-gold/30 transition-colors text-sm"
          >
            {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
            Save & Finish
          </button>
        )}
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 max-w-2xl mx-auto w-full">
        {/* Current question */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestion}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="text-center mb-12"
          >
            <p className="font-serif text-2xl md:text-3xl text-paper leading-relaxed italic">
              &ldquo;{currentQuestion}&rdquo;
            </p>
          </motion.div>
        </AnimatePresence>

        {/* Waveform visualizer */}
        {isRecording && (
          <div className="flex items-center justify-center gap-[2px] h-24 mb-8">
            {waveformBars.map((height, i) => (
              <motion.div
                key={i}
                className="w-1 rounded-full bg-gold/60"
                animate={{ height: `${height * 96}px` }}
                transition={{ duration: 0.1 }}
              />
            ))}
          </div>
        )}

        {/* Follow-up suggestions */}
        <AnimatePresence>
          {followUpQuestions.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full space-y-2 mb-8"
            >
              <p className="text-center text-paper/40 text-sm mb-3">
                <Sparkles size={14} className="inline mr-1" />
                AI-suggested follow-ups
              </p>
              {followUpQuestions.map((q, i) => (
                <button
                  key={i}
                  onClick={() => selectFollowUp(q)}
                  className="w-full p-3 rounded-lg border border-paper/10 bg-paper/5 text-paper/70 hover:border-gold/30 hover:text-gold text-left text-sm transition-all"
                >
                  {q}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Controls */}
        <div className="flex items-center gap-6">
          {!isRecording ? (
            <motion.button
              onClick={startRecording}
              className="w-20 h-20 rounded-full bg-gradient-to-br from-blood to-blood/80 flex items-center justify-center shadow-lg shadow-blood/30 hover:shadow-blood/50 transition-all"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Mic size={32} className="text-white" />
            </motion.button>
          ) : (
            <>
              <motion.button
                onClick={isPaused ? resumeRecording : pauseRecording}
                className="w-14 h-14 rounded-full bg-paper/10 flex items-center justify-center hover:bg-paper/20 transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {isPaused ? <Play size={24} /> : <Pause size={24} />}
              </motion.button>

              <motion.button
                onClick={stopAndSave}
                disabled={isSaving}
                className="w-20 h-20 rounded-full bg-gradient-to-br from-blood to-blood/80 flex items-center justify-center shadow-lg shadow-blood/30"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {isSaving ? (
                  <Loader2 size={32} className="text-white animate-spin" />
                ) : (
                  <Stop size={32} className="text-white" />
                )}
              </motion.button>

              <motion.button
                onClick={generateFollowUp}
                disabled={isGeneratingQuestion}
                className="w-14 h-14 rounded-full bg-gold/20 flex items-center justify-center hover:bg-gold/30 transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {isGeneratingQuestion ? (
                  <Loader2 size={20} className="text-gold animate-spin" />
                ) : (
                  <Sparkles size={20} className="text-gold" />
                )}
              </motion.button>
            </>
          )}
        </div>

        {/* Silence indicator */}
        {silenceTimer > 1500 && isRecording && !isPaused && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-6 text-paper/30 text-sm"
          >
            Take your time... or tap the sparkle for a follow-up question
          </motion.p>
        )}
      </div>
    </div>
  );
}

export default InterviewMode;
