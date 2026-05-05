import { useState, type ReactNode } from 'react';
import { LoomShell } from '../components/LoomShell';
import { Frame } from '../components/Frame';

/**
 * Screen 07 — The Reading Room
 *
 * The unified artifact view. Photos, voice, letters — every kind is
 * a "thread." The AI links across formats: a voice memo can rhyme
 * with a photograph. The left rail lists the threads; the centre is
 * the artifact in its medium-appropriate rendering; the right rail
 * is what this thread rhymes with elsewhere in the loom.
 */
type Kind = 'photo' | 'voice' | 'letter';

interface Thread {
  kind: Kind;
  date: string;
  title: string;
  who: string;
  duration?: string;
}

const THREADS: Thread[] = [
  { kind: 'photo',  date: '1986·05·14', title: 'the kitchen window, daffodils', who: 'Margaret' },
  { kind: 'voice',  date: '1992·01·07', title: 'humming, sunday',                who: 'Margaret', duration: '0:38' },
  { kind: 'letter', date: '2026·05·04', title: 'the kitchen window, in late may', who: 'Eleanor' },
  { kind: 'voice',  date: '2013·07·22', title: 'Maya, calling from Berlin',      who: 'Maya', duration: '2:14' },
  { kind: 'photo',  date: '2024·06·02', title: 'Iris asleep on the windowsill', who: 'Eleanor' },
];

const GLYPH: Record<Kind, string> = { photo: '◌', voice: '∿', letter: '∞' };

export function ReadingRoom() {
  const [active, setActive] = useState(2);
  const t = THREADS[active];

  return (
    <LoomShell>
      <Frame
        active="weft"
        right={<span className="loom-mono loom-faint">reading · {t.date}</span>}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'grid',
            gridTemplateColumns: '300px 1fr 320px',
            height: '100%',
          }}
        >
          {/* LEFT — thread list */}
          <aside
            style={{
              padding: '44px 28px',
              borderRight: '1px solid var(--loom-rule)',
              overflow: 'auto',
            }}
          >
            <div className="loom-eyebrow" style={{ marginBottom: 18 }}>
              five threads · this rhyme
            </div>
            <div style={{ display: 'grid', gap: 4 }}>
              {THREADS.map((th, i) => (
                <ThreadRow
                  key={i}
                  {...th}
                  active={i === active}
                  onClick={() => setActive(i)}
                />
              ))}
            </div>
            <hr className="loom-hairline" style={{ margin: '26px 0' }} />
            <div className="loom-eyebrow" style={{ marginBottom: 12 }}>
              filter
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {(['all', 'letters', 'photos', 'voice'] as const).map((f, i) => (
                <span
                  key={f}
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: 11,
                    color: i === 0 ? 'var(--loom-warm)' : 'var(--loom-bone-dim)',
                    padding: '4px 10px',
                    border:
                      i === 0
                        ? '1px solid var(--loom-warm)'
                        : '1px solid var(--loom-rule)',
                    cursor: 'pointer',
                    letterSpacing: '0.04em',
                  }}
                >
                  {f}
                </span>
              ))}
            </div>
          </aside>

          {/* CENTER — artifact */}
          <main style={{ padding: '44px 60px', overflow: 'hidden', position: 'relative' }}>
            <div
              className="loom-mono"
              style={{
                fontSize: 10,
                color: 'var(--loom-warm)',
                marginBottom: 8,
                letterSpacing: '0.04em',
              }}
            >
              ∞ &nbsp; {t.kind} · written by {t.who}
            </div>
            <div
              className="loom-h2"
              style={{
                fontSize: 30,
                fontWeight: 300,
                fontStyle: 'italic',
                marginBottom: 6,
                letterSpacing: '-0.014em',
                color: 'var(--loom-bone)',
              }}
            >
              {t.title}
            </div>
            <div
              className="loom-mono"
              style={{
                fontSize: 10,
                color: 'var(--loom-bone-faint)',
                letterSpacing: '0.04em',
                marginBottom: 32,
              }}
            >
              {t.date} &nbsp;·&nbsp; oak street &nbsp;·&nbsp; thread n°148 of 312
            </div>

            {t.kind === 'photo' && <PhotoView title={t.title} />}
            {t.kind === 'voice' && <VoiceView duration={t.duration ?? ''} />}
            {t.kind === 'letter' && <LetterView />}
          </main>

          {/* RIGHT — what it rhymes with */}
          <aside
            style={{
              padding: '44px 28px',
              borderLeft: '1px solid var(--loom-rule)',
              background: 'rgba(244,236,216,0.012)',
              overflow: 'auto',
            }}
          >
            <div className="loom-eyebrow" style={{ marginBottom: 12 }}>
              ∞ &nbsp; the loom links this to
            </div>
            <div
              className="loom-body"
              style={{
                fontSize: 13,
                fontStyle: 'italic',
                color: 'var(--loom-bone-dim)',
                lineHeight: 1.6,
                marginBottom: 24,
              }}
            >
              this {t.kind} rhymes with three threads across formats. the loom heard the same hum,
              saw the same window, found the same phrase.
            </div>
            <div style={{ display: 'grid', gap: 14 }}>
              <RhymeCard
                kind="photo"
                date="1986·05·14"
                who="Margaret"
                note="the same window, 40 yrs earlier"
                onClick={() => setActive(0)}
              />
              <RhymeCard
                kind="voice"
                date="1992·01·07"
                who="Margaret"
                note="she hummed at this same sill"
                onClick={() => setActive(1)}
              />
              <RhymeCard
                kind="photo"
                date="2024·06·02"
                who="Eleanor"
                note="iris, asleep where margaret used to sit"
                onClick={() => setActive(4)}
              />
            </div>
            <hr className="loom-hairline" style={{ margin: '28px 0' }} />
            <div className="loom-eyebrow" style={{ marginBottom: 8 }}>
              delivery
            </div>
            <div style={{ display: 'grid', gap: 8 }}>
              <DeliverRow name="Maya" status="on her 40th · 2031" />
              <DeliverRow name="Iris" status="on her 18th · 2042" warm />
              <DeliverRow name="future" status="open archive · 2076" />
            </div>
          </aside>
        </div>
      </Frame>
    </LoomShell>
  );
}

function ThreadRow({
  kind,
  date,
  title,
  who,
  active,
  onClick,
}: Thread & { active: boolean; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      style={{
        padding: '10px 12px',
        cursor: 'pointer',
        background: active ? 'rgba(176,122,74,0.08)' : 'transparent',
        borderLeft: active ? '1px solid var(--loom-warm)' : '1px solid transparent',
        display: 'grid',
        gap: 4,
        transition: 'all 180ms cubic-bezier(0.16,1,0.3,1)',
      }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '16px 1fr auto',
          gap: 10,
          alignItems: 'baseline',
        }}
      >
        <span
          style={{
            color: active ? 'var(--loom-warm)' : 'var(--loom-bone-dim)',
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 13,
            textAlign: 'center',
          }}
        >
          {GLYPH[kind]}
        </span>
        <span
          className="loom-serif"
          style={{
            fontVariationSettings: "'opsz' 14",
            fontSize: 14,
            color: active ? 'var(--loom-bone)' : 'var(--loom-bone-dim)',
            fontStyle: active ? 'italic' : 'normal',
            fontWeight: 400,
            lineHeight: 1.3,
          }}
        >
          {title}
        </span>
        <span
          className="loom-mono"
          style={{ fontSize: 9, color: 'var(--loom-bone-faint)' }}
        >
          {date.slice(0, 4)}
        </span>
      </div>
      <div style={{ paddingLeft: 26 }} className="loom-mono">
        <span
          style={{
            fontSize: 9,
            color: 'var(--loom-bone-faint)',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
          }}
        >
          {kind} · {who}
        </span>
      </div>
    </div>
  );
}

function PhotoView({ title }: { title: string }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 18 }}>
      <div
        style={{
          position: 'relative',
          aspectRatio: '4 / 3',
          background: `
            repeating-linear-gradient(135deg, rgba(244,236,216,0.04) 0, rgba(244,236,216,0.04) 1px, transparent 1px, transparent 8px),
            linear-gradient(135deg, #1a1612 0%, #0e0c08 100%)
          `,
          border: '1px solid var(--loom-rule)',
          display: 'grid',
          placeItems: 'center',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: '20%',
            left: '30%',
            width: '40%',
            height: '55%',
            background:
              'radial-gradient(ellipse, rgba(207,147,90,0.22), transparent 70%)',
            filter: 'blur(20px)',
          }}
        />
        <div
          className="loom-mono"
          style={{
            fontSize: 10,
            color: 'var(--loom-bone-faint)',
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            textAlign: 'center',
            position: 'relative',
            zIndex: 2,
          }}
        >
          [ photograph ]
          <br />
          <span
            style={{
              color: 'var(--loom-warm)',
              fontStyle: 'italic',
              textTransform: 'none',
              letterSpacing: 0,
            }}
          >
            {title}
          </span>
          <br />
          <span style={{ fontSize: 9 }}>4×3 · 35mm · 1.4MB</span>
        </div>
      </div>

      <div
        className="loom-body"
        style={{
          fontSize: 15,
          fontStyle: 'italic',
          color: 'var(--loom-bone-dim)',
          lineHeight: 1.7,
          textWrap: 'pretty',
        }}
      >
        <span className="loom-warm-text">∞ </span>
        the loom hears:{' '}
        <span style={{ color: 'var(--loom-bone)' }}>
          "slanted late-may light, the color of a strong tea. daffodils on the sill. the
          photographer is half-in the frame, holding the camera and looking out."
        </span>
      </div>

      <div
        style={{
          display: 'flex',
          gap: 14,
          alignItems: 'center',
          paddingTop: 14,
          borderTop: '1px solid var(--loom-rule)',
        }}
      >
        <Tag>kitchen window</Tag>
        <Tag>daffodils</Tag>
        <Tag>late may</Tag>
        <Tag warm>shared with iris · 2042</Tag>
      </div>
    </div>
  );
}

function VoiceView({ duration }: { duration: string }) {
  const bars = Array.from({ length: 96 }, (_, i) => {
    const v =
      0.2 +
      0.8 * Math.abs(Math.sin(i * 0.32) * Math.cos(i * 0.13)) *
        (1 - Math.abs(i - 48) / 60);
    return v;
  });
  return (
    <div style={{ display: 'grid', gap: 22 }}>
      <div
        style={{
          padding: '32px 28px',
          border: '1px solid var(--loom-rule)',
          background: 'rgba(8,8,6,0.4)',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'baseline',
            marginBottom: 18,
          }}
        >
          <div
            className="loom-mono"
            style={{
              fontSize: 10,
              color: 'var(--loom-warm)',
              letterSpacing: '0.04em',
            }}
          >
            ∿ &nbsp; {duration} &nbsp;·&nbsp; recorded on a sunday morning
          </div>
          <div
            className="loom-mono"
            style={{ fontSize: 10, color: 'var(--loom-bone-faint)' }}
          >
            0:14 / {duration}
          </div>
        </div>

        <div
          style={{ display: 'flex', alignItems: 'center', gap: 1.5, height: 80, marginBottom: 18 }}
        >
          {bars.map((v, i) => (
            <div
              key={i}
              style={{
                flex: 1,
                height: `${v * 100}%`,
                background: i < 17 ? 'var(--loom-warm)' : 'var(--loom-bone-dim)',
                opacity: i < 17 ? 1 : 0.6,
                minHeight: 2,
              }}
            />
          ))}
        </div>

        <div
          className="loom-body"
          style={{
            fontSize: 16,
            color: 'var(--loom-bone)',
            lineHeight: 1.85,
            fontStyle: 'italic',
            textWrap: 'pretty',
            fontVariationSettings: "'opsz' 14",
          }}
        >
          <span style={{ color: 'var(--loom-bone-dim)' }}>
            [soft humming] [a kettle in the background] [breath]
          </span>
          <span style={{ color: 'var(--loom-warm)', marginLeft: 8 }}>la la la—</span>
          <span style={{ color: 'var(--loom-bone-dim)' }}> [pause]</span>
          <span> oh, I forgot you were on. </span>
          <span style={{ color: 'var(--loom-bone-dim)' }}>[laughs] </span>
          <span> well — eleanor. the daffodils are out. </span>
        </div>
      </div>

      <div
        className="loom-body"
        style={{
          fontSize: 14,
          fontStyle: 'italic',
          color: 'var(--loom-bone-dim)',
          lineHeight: 1.7,
        }}
      >
        <span className="loom-warm-text">∞ </span>
        the loom recognized this hum. it appears in{' '}
        <span
          style={{
            color: 'var(--loom-warm)',
            textDecoration: 'underline dotted',
            textUnderlineOffset: 3,
            cursor: 'pointer',
          }}
        >
          maya's voice memo, 2013
        </span>{' '}
        — same six notes. she learned it without knowing she had.
      </div>

      <div
        style={{
          display: 'flex',
          gap: 14,
          paddingTop: 14,
          borderTop: '1px solid var(--loom-rule)',
        }}
      >
        <Tag>humming</Tag>
        <Tag>kettle</Tag>
        <Tag>sunday morning</Tag>
        <Tag warm>passed to maya · audibly</Tag>
      </div>
    </div>
  );
}

function LetterView() {
  return (
    <div
      style={{
        padding: '28px 32px',
        background: 'rgba(244,236,216,0.012)',
        border: '1px solid var(--loom-rule)',
        maxHeight: 460,
        overflow: 'auto',
      }}
    >
      <div
        className="loom-body"
        style={{
          fontSize: 16,
          lineHeight: 1.9,
          color: 'var(--loom-bone)',
          textWrap: 'pretty',
        }}
      >
        <p style={{ margin: '0 0 12px' }}>
          Tonight I sat at the kitchen window. The light came through the daffodils the way it
          used to when my mother was alive — slanted, low, the color of a strong tea. I thought I
          should write this down before it goes.
        </p>
        <p style={{ margin: '0 0 12px' }}>
          I do not know who will read it. Maybe Iris, in some year I will not see.{' '}
          <span style={{ color: 'var(--loom-warm)', fontStyle: 'italic' }}>
            I want you to know — here, hold this —
          </span>{' '}
          we don't get to keep each other for as long as we want. But we get the window. We get
          the late-may light. We get this.
        </p>
        <p style={{ margin: 0, fontStyle: 'italic', color: 'var(--loom-bone-dim)' }}>
          — Eleanor
        </p>
      </div>
    </div>
  );
}

function RhymeCard({
  kind,
  date,
  who,
  note,
  onClick,
}: {
  kind: Kind;
  date: string;
  who: string;
  note: string;
  onClick: () => void;
}) {
  return (
    <div
      onClick={onClick}
      style={{
        padding: 12,
        border: '1px solid var(--loom-rule)',
        cursor: 'pointer',
        display: 'grid',
        gap: 4,
        transition: 'border-color 180ms cubic-bezier(0.16,1,0.3,1)',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
        }}
      >
        <span
          className="loom-mono"
          style={{
            fontSize: 9,
            color: 'var(--loom-warm)',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
          }}
        >
          {GLYPH[kind]} {kind} · {who}
        </span>
        <span
          className="loom-mono"
          style={{ fontSize: 9, color: 'var(--loom-bone-faint)' }}
        >
          {date}
        </span>
      </div>
      <div
        className="loom-serif"
        style={{
          fontSize: 13,
          fontStyle: 'italic',
          color: 'var(--loom-bone-dim)',
          lineHeight: 1.4,
        }}
      >
        {note}
      </div>
    </div>
  );
}

function Tag({ children, warm }: { children: ReactNode; warm?: boolean }) {
  return (
    <span
      style={{
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 9,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        color: warm ? 'var(--loom-warm)' : 'var(--loom-bone-faint)',
        padding: '3px 10px',
        border: warm ? '1px solid var(--loom-warm)' : '1px solid var(--loom-rule)',
      }}
    >
      {children}
    </span>
  );
}

function DeliverRow({ name, status, warm }: { name: string; status: string; warm?: boolean }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr auto',
        alignItems: 'baseline',
        padding: '6px 0',
        borderBottom: '1px solid var(--loom-rule)',
      }}
    >
      <span
        className="loom-serif"
        style={{
          fontSize: 14,
          color: warm ? 'var(--loom-warm)' : 'var(--loom-bone)',
          fontStyle: warm ? 'italic' : 'normal',
        }}
      >
        {name}
      </span>
      <span
        className="loom-mono"
        style={{ fontSize: 9, color: 'var(--loom-bone-faint)' }}
      >
        {status}
      </span>
    </div>
  );
}
