import { useState, useRef, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { voiceApi, aiApi } from '../services/api';
import { HLogo } from '../loom/components/HLogo';
import { TapestryEdge } from '../loom/components/Frame';

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
  const [textAnswer, setTextAnswer] = useState('');

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
    setTextAnswer('');
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
      className="hl-screen"
      style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}
    >
      {/* hl-topbar: HLogo + label | center counter | end interview */}
      <div className="hl-topbar">
        {/* left: logo + page label */}
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 18 }}>
          <Link to="/loom" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>
            <HLogo size={18} wordmark />
          </Link>
          <span style={{ color: 'var(--bone-low)' }}>·</span>
          <span>interview mode</span>
        </span>

        {/* center: duration counter */}
        <span
          className="hl-counter"
          style={{
            position: 'absolute',
            left: '50%',
            transform: 'translateX(-50%)',
            whiteSpace: 'nowrap',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          {isRecording && !isPaused && (
            <span
              style={{
                display: 'inline-block',
                width: 4,
                height: 4,
                background: '#c25a5a',
                borderRadius: 0,
                animation: 'hl-blink 1.1s steps(1) infinite',
              }}
            />
          )}
          <b>{formatTime(duration)}</b>
        </span>

        {/* right: end interview link */}
        <span>
          <Link
            to="/record"
            className="hl-link warm"
            style={{ textDecoration: 'none' }}
          >
            end interview →
          </Link>
        </span>
      </div>

      {/* scrollable content area */}
      <div
        style={{
          position: 'absolute',
          top: 56,
          bottom: 80,
          left: 0,
          right: 0,
          overflowY: 'auto',
          overflowX: 'hidden',
        }}
      >
        <div
          style={{
            maxWidth: 640,
            margin: '0 auto',
            paddingTop: 60,
            paddingLeft: 24,
            paddingRight: 24,
            paddingBottom: 48,
          }}
        >
          {/* Question display */}
          <div key={currentQuestion}>
            <p
              className="hl-eyebrow"
              style={{ marginBottom: 14 }}
            >
              the listener
            </p>
            <h2
              className="hl-serif"
              style={{
                margin: 0,
                fontSize: 30,
                fontWeight: 400,
                fontStyle: 'italic',
                lineHeight: 1.3,
                color: 'var(--bone-dim)',
              }}
            >
              {currentQuestion}
            </h2>
          </div>

          {/* Answer area */}
          <div
            style={{
              marginTop: 24,
              borderTop: '1px solid var(--rule)',
              paddingTop: 18,
            }}
          >
            <textarea
              className="hl-serif"
              value={textAnswer}
              onChange={(e) => setTextAnswer(e.target.value)}
              placeholder="write your answer…"
              style={{
                width: '100%',
                fontSize: 18,
                fontFamily: 'var(--serif)',
                background: 'transparent',
                border: 'none',
                outline: 'none',
                resize: 'none',
                minHeight: 160,
                color: 'var(--bone)',
                caretColor: 'var(--warm)',
                lineHeight: 1.7,
              }}
            />
          </div>

          {/* Follow-up suggestions */}
          {followUpQuestions.length > 0 && (
            <div style={{ marginTop: 32 }}>
              <p
                className="hl-eyebrow"
                style={{ marginBottom: 14 }}
              >
                follow-up questions
              </p>
              <div>
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
                      borderBottom: '1px solid var(--rule)',
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                  >
                    <span
                      className="hl-serif"
                      style={{
                        fontStyle: 'italic',
                        fontSize: 15,
                        color: 'var(--bone-dim)',
                      }}
                    >
                      {q}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Next question link */}
          <div style={{ marginTop: 22 }}>
            <button
              onClick={generateFollowUp}
              disabled={isGeneratingQuestion}
              style={{
                background: 'none',
                border: 'none',
                padding: 0,
                cursor: isGeneratingQuestion ? 'wait' : 'pointer',
                fontFamily: 'var(--mono)',
                fontSize: 10,
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                color: isGeneratingQuestion ? 'var(--bone-faint)' : 'var(--warm)',
                opacity: isGeneratingQuestion ? 0.5 : 1,
                transition: 'opacity 180ms cubic-bezier(0.16,1,0.3,1)',
              }}
            >
              {isGeneratingQuestion ? 'thinking…' : 'next question →'}
            </button>
          </div>

          {/* Voice recording option */}
          <div style={{ marginTop: 40 }}>
            <hr className="hl-rule" />
            <div style={{ marginTop: 18, display: 'flex', alignItems: 'center', gap: 16 }}>
              {!isRecording ? (
                <button
                  onClick={startRecording}
                  className="hl-btn"
                  style={{ fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase', padding: '10px 20px' }}
                  aria-label="Start voice recording"
                >
                  record voice
                </button>
              ) : (
                <>
                  <button
                    onClick={isPaused ? resumeRecording : pauseRecording}
                    className="hl-btn ghost"
                    aria-label={isPaused ? 'Resume recording' : 'Pause recording'}
                    style={{ fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase', padding: '10px 20px' }}
                  >
                    {isPaused ? 'resume' : 'pause'}
                  </button>

                  <button
                    onClick={stopAndSave}
                    disabled={isSaving}
                    className="hl-btn"
                    aria-label={isSaving ? 'Saving' : 'Stop and save recording'}
                    style={{
                      fontSize: 10,
                      letterSpacing: '0.16em',
                      textTransform: 'uppercase',
                      padding: '10px 20px',
                      opacity: isSaving ? 0.5 : 1,
                    }}
                  >
                    {isSaving ? 'saving…' : 'stop & save'}
                  </button>
                </>
              )}
            </div>

            {/* Waveform — 1px hairline bars while recording */}
            {isRecording && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  height: 32,
                  marginTop: 16,
                }}
              >
                {waveformBars.map((h, i) => (
                  <div
                    key={i}
                    style={{
                      width: 1,
                      height: `${h * 32}px`,
                      background: isPaused ? 'var(--bone-faint)' : 'var(--warm)',
                      opacity: 0.7,
                      transition: 'height 100ms cubic-bezier(0.16,1,0.3,1)',
                      borderRadius: 0,
                    }}
                  />
                ))}
              </div>
            )}

            {/* Silence hint */}
            {silenceTimer > 1500 && isRecording && !isPaused && (
              <p
                className="hl-serif"
                style={{
                  marginTop: 16,
                  color: 'var(--bone-faint)',
                  fontStyle: 'italic',
                  fontSize: 14,
                  lineHeight: 1.5,
                }}
              >
                Take your time — or press next question for a follow-up.
              </p>
            )}
          </div>
        </div>
      </div>

      <TapestryEdge />

      <style>{`
        @keyframes hl-blink {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0; }
        }
      `}</style>
    </div>
  );
}

export default InterviewMode;
