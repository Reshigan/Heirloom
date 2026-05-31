import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
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
    "What's a lesson you learned the hard way?",
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

  // Waveform amplitude bars derived from audio level
  const waveformBars = Array.from({ length: 40 }, (_, i) => {
    const baseHeight = Math.sin((i / 40) * Math.PI) * 0.5 + 0.5;
    const audioInfluence = audioLevel * 3;
    return Math.max(0.1, baseHeight * (0.3 + audioInfluence));
  });

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--loom-ink)',
        color: 'var(--loom-bone)',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: "'Inter', system-ui, sans-serif",
        WebkitFontSmoothing: 'antialiased',
      }}
    >
      {/* Top bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '20px 28px',
          borderBottom: '1px solid var(--loom-rule)',
        }}
      >
        <button
          onClick={() => navigate('/record')}
          className="loom-mono"
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--loom-bone-faint)',
            fontSize: 10,
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            padding: 0,
          }}
        >
          ← exit
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {isRecording && !isPaused && (
            <div
              style={{
                width: 4,
                height: 4,
                background: '#c25a5a',
                borderRadius: '50%',
                animation: 'loom-caret 1.1s steps(1) infinite',
              }}
            />
          )}
          <span
            className="loom-mono"
            style={{ fontSize: 13, color: 'var(--loom-bone-dim)', letterSpacing: '0.06em' }}
          >
            {formatTime(duration)}
          </span>
        </div>

        {isRecording && (
          <button
            onClick={stopAndSave}
            disabled={isSaving}
            className="loom-btn-ghost"
            style={{ fontSize: 10, padding: '8px 18px', opacity: isSaving ? 0.5 : 1 }}
          >
            {isSaving ? 'saving…' : 'save & finish'}
          </button>
        )}
        {!isRecording && <div style={{ width: 80 }} />}
      </div>

      {/* Main — vertically centred */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '48px 28px',
          maxWidth: 640,
          margin: '0 auto',
          width: '100%',
        }}
      >
        {/* The Listener's question */}
        <div
          key={currentQuestion}
          style={{
            textAlign: 'center',
            marginBottom: 56,
            animation: 'fadeInUp 360ms var(--loom-ease) both',
          }}
        >
          {!isRecording && (
            <p
              className="loom-eyebrow"
              style={{ marginBottom: 20, color: 'var(--loom-warm)' }}
            >
              the listener
            </p>
          )}
          <p
            className="loom-h2"
            style={{
              fontStyle: 'italic',
              fontWeight: 300,
              fontSize: 'clamp(22px,3.5vw,32px)',
              lineHeight: 1.3,
              color: 'var(--loom-bone)',
              margin: 0,
            }}
          >
            &ldquo;{currentQuestion}&rdquo;
          </p>
        </div>

        {/* Waveform — 1px hairline bars */}
        {isRecording && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 2,
              height: 40,
              marginBottom: 40,
            }}
          >
            {waveformBars.map((h, i) => (
              <div
                key={i}
                style={{
                  width: 1,
                  height: `${h * 40}px`,
                  background: isPaused ? 'var(--loom-bone-faint)' : 'var(--loom-warm)',
                  opacity: 0.7,
                  transition: 'height 100ms var(--loom-ease)',
                  borderRadius: 0,
                }}
              />
            ))}
          </div>
        )}

        {/* Follow-up suggestions */}
        {followUpQuestions.length > 0 && (
          <div style={{ width: '100%', marginBottom: 40 }}>
            <p
              className="loom-eyebrow"
              style={{ textAlign: 'center', marginBottom: 16, color: 'var(--loom-bone-faint)' }}
            >
              follow-up questions
            </p>
            <div style={{ display: 'grid', gap: 0 }}>
              {followUpQuestions.map((q, i) => (
                <button
                  key={i}
                  onClick={() => selectFollowUp(q)}
                  style={{
                    display: 'block',
                    width: '100%',
                    padding: '12px 0',
                    background: 'none',
                    border: 'none',
                    borderBottom: '1px solid var(--loom-rule)',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  <span
                    className="loom-body"
                    style={{ fontStyle: 'italic', fontSize: 15, color: 'var(--loom-bone-dim)' }}
                  >
                    {q}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          {!isRecording ? (
            <button
              onClick={startRecording}
              className="loom-btn"
              style={{ minWidth: 120 }}
              aria-label="Start recording"
            >
              begin
            </button>
          ) : (
            <>
              <button
                onClick={isPaused ? resumeRecording : pauseRecording}
                className="loom-btn-ghost"
                aria-label={isPaused ? 'Resume recording' : 'Pause recording'}
                style={{ minWidth: 80 }}
              >
                {isPaused ? 'resume' : 'pause'}
              </button>

              <button
                onClick={stopAndSave}
                disabled={isSaving}
                className="loom-btn"
                aria-label={isSaving ? 'Saving' : 'Stop and save'}
                style={{ minWidth: 80, opacity: isSaving ? 0.5 : 1 }}
              >
                {isSaving ? 'saving…' : 'stop'}
              </button>

              <button
                onClick={generateFollowUp}
                disabled={isGeneratingQuestion}
                aria-label={isGeneratingQuestion ? 'Thinking of a follow-up' : 'Suggest a follow-up'}
                style={{
                  background: 'none',
                  border: '1px solid var(--loom-rule)',
                  cursor: isGeneratingQuestion ? 'wait' : 'pointer',
                  color: isGeneratingQuestion ? 'var(--loom-bone-faint)' : 'var(--loom-warm)',
                  fontFamily: "'Source Serif 4', serif",
                  fontSize: 18,
                  padding: '8px 16px',
                  opacity: isGeneratingQuestion ? 0.5 : 1,
                  borderRadius: 0,
                  transition: 'border-color 180ms var(--loom-ease)',
                }}
                title={isGeneratingQuestion ? 'Thinking of a follow-up…' : 'Suggest a follow-up'}
              >
                ∞
              </button>
            </>
          )}
        </div>

        {/* Silence hint */}
        {silenceTimer > 1500 && isRecording && !isPaused && (
          <p
            className="loom-body"
            style={{
              marginTop: 32,
              color: 'var(--loom-bone-faint)',
              fontStyle: 'italic',
              fontSize: 14,
              textAlign: 'center',
              animation: 'fadeInUp 360ms var(--loom-ease) both',
            }}
          >
            Take your time — or press ∞ for a follow-up question.
          </p>
        )}
      </div>

      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

export default InterviewMode;
