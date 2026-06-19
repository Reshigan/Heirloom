import { useState, useRef, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { voiceApi, aiApi, getAuthHeaders } from '../services/api';
import { ClothShell } from '../loom/components/ClothShell';
import { CosmicHeader, SectionLabel, WaxSeal } from '../loom/cosmic/CosmicUI';
import { ProgressHair } from '../loom/components/ProgressHair';

const SILENCE_THRESHOLD = 0.01;

const STARTING_PROMPTS = [
  'Tell me about your earliest childhood memory.',
  'What was the happiest day of your life?',
  'Describe the home you grew up in.',
  'Who had the biggest influence on your life?',
  "What's a lesson you learned the hard way?",
  'Tell me about a tradition in your family.',
  'What do you want your grandchildren to know about you?',
  'Describe a moment that changed everything.',
];

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
  const [recordingError, setRecordingError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mimeTypeRef = useRef<string>('audio/webm');
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const silenceStartRef = useRef<number | null>(null);

  useEffect(() => {
    setCurrentQuestion(STARTING_PROMPTS[Math.floor(Math.random() * STARTING_PROMPTS.length)]);
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
    setRecordingError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const supportedType = ['audio/webm', 'audio/mp4', 'audio/ogg'].find((t) =>
        MediaRecorder.isTypeSupported(t),
      );
      const mediaRecorder = supportedType
        ? new MediaRecorder(stream, { mimeType: supportedType })
        : new MediaRecorder(stream);
      mimeTypeRef.current = mediaRecorder.mimeType || supportedType || 'audio/webm';
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const audioContext = new Ctx();
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
      setRecordingError('Microphone access denied. Please allow microphone access and try again.');
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
      const followup = (response.data?.followup || '').trim();
      const questions = followup
        ? [followup]
        : [
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
    const mime = mediaRecorderRef.current?.mimeType || mimeTypeRef.current || 'audio/webm';
    const contentType = mime.split(';')[0];
    const ext = contentType.includes('mp4') ? 'm4a' : contentType.includes('ogg') ? 'ogg' : 'webm';
    const blob = new Blob(chunksRef.current, { type: contentType });

    try {
      const { data: uploadData } = await voiceApi.getUploadUrl({
        filename: `interview-${Date.now()}.${ext}`,
        contentType,
      });

      const uploadResponse = await fetch(uploadData.uploadUrl, {
        method: 'PUT',
        body: blob,
        headers: { 'Content-Type': contentType, ...getAuthHeaders() },
      });
      if (!uploadResponse.ok) {
        throw new Error(`Upload failed: ${uploadResponse.status}`);
      }

      await voiceApi.create({
        title: `Interview - ${new Date().toLocaleDateString()}`,
        fileKey: uploadData.key,
        fileUrl: uploadData.url,
        duration,
        recording_type: 'interview',
        interview_data: JSON.stringify({
          transcript,
          questions: transcript.filter((s) => s.isQuestion).map((s) => s.text),
          textAnswer: textAnswer || '',
        }),
      });

      navigate('/record');
    } catch (err) {
      console.error('Failed to save interview:', err);
      setSaveError('Failed to save interview. Please try again.');
    }
    setIsSaving(false);
  };

  const saveTextOnly = async () => {
    setIsSaving(true);
    try {
      await voiceApi.create({
        title: `Interview - ${new Date().toLocaleDateString()}`,
        fileKey: '',
        fileUrl: '',
        duration: 0,
        recording_type: 'interview',
        interview_data: JSON.stringify({
          transcript,
          questions: transcript.filter((s) => s.isQuestion).map((s) => s.text),
          textAnswer: textAnswer || '',
          segments: [],
        }),
      });
      navigate('/record');
    } catch (err) {
      console.error('Failed to save written interview:', err);
      setSaveError('Failed to save interview. Please try again.');
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

  const backLink = (
    <Link
      to="/loom/index"
      style={{
        fontFamily: 'var(--mono)',
        fontSize: 10,
        letterSpacing: '0.16em',
        color: 'var(--bone-faint)',
        textDecoration: 'none',
        textTransform: 'uppercase',
      }}
    >
      ← heirloom
    </Link>
  );

  const centerSlot = (
    <span
      style={{
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
            background: 'transparent',
            border: '1px solid var(--warm)',
            borderRadius: 0,
            animation: 'hl-blink 1400ms steps(1) infinite',
          }}
        />
      )}
      {formatTime(duration)}
    </span>
  );

  // Step progress — count of questions the listener has asked so far.
  const askedCount = transcript.filter((s) => s.isQuestion).length;

  const endLink = (
    <Link
      to="/record"
      style={{
        fontFamily: 'var(--mono)',
        fontSize: 10,
        letterSpacing: '0.16em',
        color: 'var(--warm)',
        textDecoration: 'none',
        textTransform: 'uppercase',
      }}
    >
      end interview →
    </Link>
  );

  return (
    <ClothShell topbarLeft={backLink} topbarCenter={centerSlot} topbarRight={endLink}>
      <div>
        <div
          style={{
            maxWidth: 'var(--page-max-wide)',
            margin: '0 auto',
            padding: 'var(--page-pad-top) var(--page-pad-x) var(--page-clear)',
          }}
        >
          {/* The listener's question — mono eyebrow + giant serif prompt */}
          <CosmicHeader
            key={currentQuestion}
            eyebrow="the listener asks"
            title={<span style={{ fontWeight: 400 }}>{currentQuestion}</span>}
          />

          {/* Answer area — faint amber left thread, serif body */}
          <div
            style={{
              marginTop: 4,
              borderLeft: '3px solid color-mix(in srgb, var(--warm) 32%, transparent)',
              paddingLeft: 24,
            }}
          >
            <textarea
              className="hl-serif"
              aria-label="Your answer"
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
                minHeight: 180,
                color: 'var(--bone)',
                caretColor: 'var(--warm)',
                lineHeight: 1.75,
              }}
            />
          </div>

          {/* Follow-up suggestions — the listener offers other threads to pull */}
          {followUpQuestions.length > 0 && (
            <div style={{ marginTop: 40 }}>
              <SectionLabel>follow-up questions</SectionLabel>
              <div>
                {followUpQuestions.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => selectFollowUp(q)}
                    style={{
                      display: 'block',
                      width: '100%',
                      padding: '14px 0',
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
                        fontSize: 16,
                        color: 'var(--bone-dim)',
                        lineHeight: 1.4,
                      }}
                    >
                      {q}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Inline status — silence hint, recording errors, save errors (mono, never red) */}
          {silenceTimer > 1500 && isRecording && !isPaused && (
            <p
              className="hl-serif"
              style={{
                marginTop: 22,
                color: 'var(--bone-faint)',
                fontStyle: 'italic',
                fontSize: 15,
                lineHeight: 1.5,
              }}
            >
              Take your time — or ask for a follow-up.
            </p>
          )}

          {recordingError && (
            <p style={{ color: 'var(--warm)', fontSize: 12, marginTop: 22, fontFamily: 'var(--mono)', letterSpacing: '0.08em' }}>
              {recordingError}
            </p>
          )}

          {saveError && (
            <p style={{ color: 'var(--warm)', fontSize: 12, marginTop: 22, fontFamily: 'var(--mono)', letterSpacing: '0.08em' }}>
              {saveError}
            </p>
          )}

          {/* Waveform — 1px hairline bars while recording */}
          {isRecording && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                height: 32,
                marginTop: 22,
              }}
            >
              {waveformBars.map((h, i) => {
                // A single 1px playhead may stay copper — the live leading edge
                // while actually recording. Every other bar is bone: lit (active,
                // not paused) reads var(--bone-dim), unlit reads var(--bone-faint).
                const isPlayhead = !isPaused && i === waveformBars.length - 1;
                return (
                  <div
                    key={i}
                    style={{
                      width: 1,
                      height: `${h * 32}px`,
                      background: isPlayhead
                        ? 'var(--warm)'
                        : isPaused
                          ? 'var(--bone-faint)'
                          : 'var(--bone-dim)',
                      opacity: 0.7,
                      transition: 'height 180ms var(--ease)',
                      borderRadius: 0,
                    }}
                  />
                );
              })}
            </div>
          )}

          {/* Step progress — hairline bar, never a spinner */}
          <div style={{ marginTop: 40 }}>
            <ProgressHair label="Interview progress" />
            <div
              style={{
                marginTop: 8,
                fontFamily: 'var(--mono)',
                fontSize: 10,
                letterSpacing: '0.22em',
                textTransform: 'uppercase',
                color: 'var(--bone-faint)',
              }}
            >
              {askedCount} {askedCount === 1 ? 'question' : 'questions'} asked
            </div>
          </div>

          {/* Bottom action bar — mono warm affordances, no icons */}
          <div
            style={{
              marginTop: 18,
              paddingTop: 18,
              borderTop: '1px solid var(--rule)',
              display: 'flex',
              alignItems: 'center',
              gap: 24,
              flexWrap: 'wrap',
            }}
          >
            {/* NEXT — ask the listener for a follow-up question */}
            <button
              onClick={generateFollowUp}
              disabled={isGeneratingQuestion}
              style={{
                background: 'none',
                border: 'none',
                padding: 0,
                cursor: isGeneratingQuestion ? 'wait' : 'pointer',
                fontFamily: 'var(--mono)',
                fontSize: 11,
                letterSpacing: '0.22em',
                textTransform: 'uppercase',
                color: isGeneratingQuestion ? 'var(--bone-faint)' : 'var(--warm)',
                opacity: isGeneratingQuestion ? 0.5 : 1,
                transition: 'opacity 180ms var(--ease)',
                minHeight: 44,
              }}
            >
              {isGeneratingQuestion ? 'thinking…' : 'next question →'}
            </button>

            {/* RECORD / PAUSE / SAVE — the voice path */}
            {!isRecording ? (
              <button
                onClick={startRecording}
                aria-label="Start voice recording"
                style={{
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  cursor: 'pointer',
                  fontFamily: 'var(--mono)',
                  fontSize: 11,
                  letterSpacing: '0.22em',
                  textTransform: 'uppercase',
                  color: 'var(--bone-dim)',
                  minHeight: 44,
                }}
              >
                record voice
              </button>
            ) : (
              <>
                <button
                  onClick={isPaused ? resumeRecording : pauseRecording}
                  aria-label={isPaused ? 'Resume recording' : 'Pause recording'}
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    cursor: 'pointer',
                    fontFamily: 'var(--mono)',
                    fontSize: 11,
                    letterSpacing: '0.22em',
                    textTransform: 'uppercase',
                    color: 'var(--bone-dim)',
                    minHeight: 44,
                  }}
                >
                  {isPaused ? 'resume' : 'pause'}
                </button>

                <button
                  onClick={stopAndSave}
                  disabled={isSaving}
                  aria-label={isSaving ? 'Saving' : 'Stop and save recording'}
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    cursor: isSaving ? 'wait' : 'pointer',
                    fontFamily: 'var(--mono)',
                    fontSize: 11,
                    letterSpacing: '0.22em',
                    textTransform: 'uppercase',
                    color: 'var(--warm)',
                    opacity: isSaving ? 0.5 : 1,
                    minHeight: 44,
                  }}
                >
                  {isSaving ? 'saving…' : 'stop & save →'}
                </button>
              </>
            )}

            {/* SAVE written answers — when there is text and no active recording */}
            {textAnswer.trim().length > 0 && !isRecording && (
              <button
                onClick={saveTextOnly}
                disabled={isSaving}
                style={{
                  marginLeft: 'auto',
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  cursor: isSaving ? 'wait' : 'pointer',
                  fontFamily: 'var(--mono)',
                  fontSize: 11,
                  letterSpacing: '0.22em',
                  textTransform: 'uppercase',
                  color: 'var(--warm)',
                  opacity: isSaving ? 0.5 : 1,
                  minHeight: 44,
                }}
              >
                {isSaving ? 'saving…' : 'save written →'}
              </button>
            )}
          </div>

          <div style={{ marginTop: 56 }}>
            <WaxSeal />
          </div>
        </div>
      </div>

      <style>{`
        @keyframes hl-blink {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0; }
        }
        progress { color: var(--bone-dim); }
        progress::-webkit-progress-bar { background: var(--rule); }
        progress::-webkit-progress-value { background: var(--bone-dim); }
        progress::-moz-progress-bar { background: var(--bone-dim); }
      `}</style>
    </ClothShell>
  );
}

export default InterviewMode;
