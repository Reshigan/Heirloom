import { useState, type ReactNode } from 'react';
import { LoomShell } from '../components/LoomShell';
import { Frame } from '../components/Frame';
import { ViewToggle } from '../components/ViewToggle';

/**
 * Screen 07 — The Reading Room
 *
 * The unified artifact view. Photos, voice, letters — every kind is
 * a "thread." The AI links across formats: a voice memo can rhyme
 * with a photograph. The left rail lists the threads; the centre is
 * the artifact in its medium-appropriate rendering; the right rail
 * is what this thread rhymes with elsewhere in the loom.
 *
 * Two view-modes, switched by the loom-mono ViewToggle in the top bar:
 *   wall — the canonical three-column reader (below)
 *   book — the descendant's large-type book-spread reader (BookView),
 *          a generous two-page reading surface with page-turn paging
 *          and ∞ chapter marks.
 */
type Kind = 'photo' | 'voice' | 'letter';
type RoomView = 'wall' | 'book';

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

// ∞ is the only mark; kind is distinguished by the loom-mono label text.
const GLYPH: Record<Kind, string> = { photo: '∞', voice: '∞', letter: '∞' };

export function ReadingRoom() {
  const [active, setActive] = useState(2);
  const [view, setView] = useState<RoomView>('wall');
  const t = THREADS[active];

  const toggle = (
    <ViewToggle<RoomView>
      value={view}
      onChange={setView}
      options={[
        { value: 'wall', label: 'wall' },
        { value: 'book', label: 'book' },
      ]}
    />
  );

  if (view === 'book') {
    return (
      <LoomShell>
        <Frame active="weft" right={toggle} showHorizon={false} showGrain={false}>
          <BookView />
        </Frame>
      </LoomShell>
    );
  }

  return (
    <LoomShell>
      <Frame
        active="weft"
        right={
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 18 }}>
            {toggle}
            <span className="loom-mono loom-faint">reading · {t.date}</span>
          </span>
        }
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
              borderRight: '1px solid var(--rule)',
              overflow: 'auto',
            }}
          >
            <div className="loom-eyebrow" style={{ marginBottom: 18 }}>
              five threads · this rhyme
            </div>
            <div style={{ display: 'grid', gap: 0 }}>
              {THREADS.map((th, i) => (
                <div key={th.date + th.title}>
                  {i > 0 && (
                    <hr style={{ border: 0, borderTop: '1px solid var(--rule)', margin: '0' }} />
                  )}
                  <ThreadRow
                    {...th}
                    active={i === active}
                    onClick={() => setActive(i)}
                  />
                </div>
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
                    color: i === 0 ? 'var(--warm)' : 'var(--bone-dim)',
                    padding: '4px 10px',
                    border:
                      i === 0
                        ? '1px solid var(--warm)'
                        : '1px solid var(--rule)',
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
                color: 'var(--warm)',
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
                color: 'var(--bone)',
              }}
            >
              {t.title}
            </div>
            <div
              className="loom-mono"
              style={{
                fontSize: 10,
                color: 'var(--bone-faint)',
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
              borderLeft: '1px solid var(--rule)',
              background: 'var(--ink-card)',
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
                color: 'var(--bone-dim)',
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
        borderLeft: active ? '1px solid var(--warm)' : '1px solid transparent',
        display: 'grid',
        gap: 4,
        transition: 'background 180ms cubic-bezier(0.16,1,0.3,1), border-color 180ms cubic-bezier(0.16,1,0.3,1)',
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
            color: active ? 'var(--warm)' : 'var(--bone-dim)',
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
            color: active ? 'var(--bone)' : 'var(--bone-dim)',
            fontStyle: active ? 'italic' : 'normal',
            fontWeight: 400,
            lineHeight: 1.3,
          }}
        >
          {title}
        </span>
        <span
          className="loom-mono"
          style={{ fontSize: 9, color: 'var(--bone-faint)' }}
        >
          {date.slice(0, 4)}
        </span>
      </div>
      <div style={{ paddingLeft: 26 }} className="loom-mono">
        <span
          style={{
            fontSize: 9,
            color: 'var(--bone-faint)',
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
          background: 'var(--ink-card)',
          border: '1px solid var(--rule)',
          display: 'grid',
          placeItems: 'center',
          overflow: 'hidden',
        }}
      >
        <div
          className="loom-mono"
          style={{
            fontSize: 10,
            color: 'var(--bone-faint)',
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
              color: 'var(--warm)',
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
          color: 'var(--bone-dim)',
          lineHeight: 1.7,
          textWrap: 'pretty',
        }}
      >
        <span className="loom-warm-text">∞ </span>
        the loom hears:{' '}
        <span style={{ color: 'var(--bone)' }}>
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
          borderTop: '1px solid var(--rule)',
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
          border: '1px solid var(--rule)',
          background: 'var(--ink-deep)',
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
              color: 'var(--warm)',
              letterSpacing: '0.04em',
            }}
          >
            voice &nbsp;·&nbsp; {duration} &nbsp;·&nbsp; recorded on a sunday morning
          </div>
          <div
            className="loom-mono"
            style={{ fontSize: 10, color: 'var(--bone-faint)' }}
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
                background: i < 17 ? 'var(--warm)' : 'var(--bone-dim)',
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
            color: 'var(--bone)',
            lineHeight: 1.85,
            fontStyle: 'italic',
            textWrap: 'pretty',
            fontVariationSettings: "'opsz' 14",
          }}
        >
          <span style={{ color: 'var(--bone-dim)' }}>
            [soft humming] [a kettle in the background] [breath]
          </span>
          <span style={{ color: 'var(--warm)', marginLeft: 8 }}>la la la—</span>
          <span style={{ color: 'var(--bone-dim)' }}> [pause]</span>
          <span> oh, I forgot you were on. </span>
          <span style={{ color: 'var(--bone-dim)' }}>[laughs] </span>
          <span> well — eleanor. the daffodils are out. </span>
        </div>
      </div>

      <div
        className="loom-body"
        style={{
          fontSize: 14,
          fontStyle: 'italic',
          color: 'var(--bone-dim)',
          lineHeight: 1.7,
        }}
      >
        <span className="loom-warm-text">∞ </span>
        the loom recognized this hum. it appears in{' '}
        <span
          style={{
            color: 'var(--warm)',
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
          borderTop: '1px solid var(--rule)',
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
        background: 'var(--ink-card)',
        border: '1px solid var(--rule)',
        maxHeight: 460,
        overflow: 'auto',
      }}
    >
      <div
        className="loom-body"
        style={{
          fontSize: 16,
          lineHeight: 1.9,
          color: 'var(--bone)',
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
          <span style={{ color: 'var(--warm)', fontStyle: 'italic' }}>
            I want you to know — here, hold this —
          </span>{' '}
          we don't get to keep each other for as long as we want. But we get the window. We get
          the late-may light. We get this.
        </p>
        <p style={{ margin: 0, fontStyle: 'italic', color: 'var(--bone-dim)' }}>
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
        border: '1px solid var(--rule)',
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
            color: 'var(--warm)',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
          }}
        >
          {GLYPH[kind]} {kind} · {who}
        </span>
        <span
          className="loom-mono"
          style={{ fontSize: 9, color: 'var(--bone-faint)' }}
        >
          {date}
        </span>
      </div>
      <div
        className="loom-serif"
        style={{
          fontSize: 13,
          fontStyle: 'italic',
          color: 'var(--bone-dim)',
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
        color: warm ? 'var(--warm)' : 'var(--bone-faint)',
        padding: '3px 10px',
        border: warm ? '1px solid var(--warm)' : '1px solid var(--rule)',
      }}
    >
      {children}
    </span>
  );
}

/**
 * BookView — the descendant's reader.
 *
 * A book-spread large-type reading surface: the left page carries the
 * chapter intro (∞ chapter mark, the title set huge, the byline), the
 * right page carries the prose set generously in Source Serif 4. Page
 * turns are a quiet left/right pager, marked with ∞; the running heads
 * name the thread and the chapter.
 */
interface Chapter {
  numeral: string;
  eyebrow: string;
  title: string;
  byline: string;
  body: string[];
  closing: string;
  leftPage: number;
  rightPage: number;
}

const CHAPTERS: Chapter[] = [
  {
    numeral: 'i',
    eyebrow: 'i · the kitchen window · 1986',
    title: 'The late-may light.',
    byline:
      'Written by Eleanor Hartshorn on the 14th of May, 1986. The daffodils were out for the last spring her mother saw them.',
    body: [
      'Tonight I sat at the kitchen window. The light came through the daffodils the way it used to when my mother was alive — slanted, low, the colour of a strong tea. I thought I should write this down before it goes.',
      'I do not know who will read it. Maybe Iris, in some year I will not see. We don’t get to keep each other for as long as we want. But we get the window. We get the late-may light. We get this.',
    ],
    closing: 'She kept the daffodils on the sill every May after.',
    leftPage: 148,
    rightPage: 149,
  },
  {
    numeral: 'ii',
    eyebrow: 'ii · humming, sunday · 1992',
    title: 'The same six notes.',
    byline:
      'Recorded by Margaret on a Sunday morning in 1992. A kettle in the background, and a tune she never knew she taught.',
    body: [
      'A kettle, a Sunday, six notes I have hummed my whole life without knowing where I learned them. The recorder was on and I had forgotten it. Oh, I forgot you were on — well, Eleanor. The daffodils are out.',
      'Maya hums them now, thirty years on, calling from a city I have never been to. She learned it without knowing she had. That is how the smallest things travel: under the words, in the breath between them.',
    ],
    closing: 'The loom heard the same hum, two generations apart.',
    leftPage: 150,
    rightPage: 151,
  },
  {
    numeral: 'iii',
    eyebrow: 'iii · to my granddaughter · 2024',
    title: 'For the day you are ready.',
    byline:
      'Written by Eleanor Hartshorn on the 2nd of June, 2024. Iris was asleep on the windowsill where Margaret used to sit.',
    body: [
      'To my granddaughter, today: you are asleep on the windowsill where my mother used to sit. I do not know who you will become. I am writing so that you will know who we were.',
      'You do not have to read all of this at once. The thread cannot be deleted, and it will wait. Read it on the day you are ready, and then put it down, and then come back. That is what it is for.',
    ],
    closing: 'She didn’t wake her. She just wrote.',
    leftPage: 152,
    rightPage: 153,
  },
];

function BookView() {
  const [ch, setCh] = useState(0);
  const c = CHAPTERS[ch];
  const turn = (delta: number) =>
    setCh((p) => Math.min(CHAPTERS.length - 1, Math.max(0, p + delta)));

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--parchment)',
        color: 'var(--parchment-ink)',
      }}
    >
      {/* running heads */}
      <div
        className="loom-mono"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          padding: '22px 64px 0',
          fontSize: 10,
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: 'var(--parchment-faint)',
        }}
      >
        <span>book mode · the Hartshorn thread</span>
        <span style={{ color: 'var(--warm)' }}>
          ∞ &nbsp; chapter {c.numeral} · {c.title.replace(/\.$/, '')}
        </span>
      </div>

      {/* two-page spread */}
      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        {/* left page — chapter intro */}
        <div
          style={{
            flex: 1,
            padding: '56px 64px 56px 88px',
            borderRight: '1px solid var(--parchment-rule)',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div
            className="loom-mono"
            style={{
              fontSize: 10,
              color: 'var(--parchment-faint)',
              letterSpacing: '0.32em',
              textTransform: 'uppercase',
              marginBottom: 36,
            }}
          >
            {c.eyebrow}
          </div>
          <h2
            className="loom-display"
            style={{
              fontSize: 46,
              fontStyle: 'italic',
              margin: 0,
              maxWidth: '14ch',
              color: 'var(--parchment-ink)',
            }}
          >
            {c.title}
          </h2>
          <div
            className="loom-serif"
            style={{
              fontStyle: 'italic',
              fontSize: 17,
              color: 'var(--parchment-dim)',
              marginTop: 32,
              maxWidth: '38ch',
              lineHeight: 1.7,
            }}
          >
            {c.byline}
          </div>
          <div style={{ flex: 1 }} />
          <div
            className="loom-mono"
            style={{ fontSize: 10, color: 'var(--parchment-faint)', letterSpacing: '0.18em' }}
          >
            p. {c.leftPage}
          </div>
        </div>

        {/* right page — body */}
        <div
          style={{
            flex: 1,
            padding: '56px 80px',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div style={{ maxWidth: '52ch' }}>
            {c.body.map((p, i) => (
              <p
                key={i}
                className="loom-body"
                style={{
                  fontSize: 19,
                  lineHeight: 1.9,
                  color: 'var(--parchment-ink)',
                  margin: '0 0 18px',
                }}
              >
                {p}
              </p>
            ))}
            <div
              className="loom-serif"
              style={{
                fontStyle: 'italic',
                fontSize: 16,
                color: 'var(--parchment-dim)',
                marginTop: 10,
              }}
            >
              {c.closing}
            </div>
          </div>
          <div style={{ flex: 1 }} />
          <div
            className="loom-mono"
            style={{
              fontSize: 10,
              color: 'var(--parchment-faint)',
              letterSpacing: '0.18em',
              textAlign: 'right',
            }}
          >
            p. {c.rightPage}
          </div>
        </div>
      </div>

      {/* page-turn pager — ∞ chapter marks */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 64px 24px',
        }}
      >
        <button
          type="button"
          onClick={() => turn(-1)}
          disabled={ch === 0}
          className="loom-mono"
          style={{
            background: 'transparent',
            border: 0,
            padding: 0,
            cursor: ch === 0 ? 'default' : 'pointer',
            fontSize: 10,
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            color: ch === 0 ? 'var(--parchment-faint)' : 'var(--parchment-dim)',
          }}
        >
          ← earlier
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          {CHAPTERS.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`chapter ${i + 1}`}
              aria-current={i === ch}
              onClick={() => setCh(i)}
              className="loom-serif"
              style={{
                background: 'transparent',
                border: 0,
                padding: 0,
                cursor: 'pointer',
                fontSize: 14,
                lineHeight: 1,
                color: i === ch ? 'var(--warm)' : 'var(--parchment-faint)',
                transition: 'color 180ms cubic-bezier(0.16,1,0.3,1)',
              }}
            >
              ∞
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => turn(1)}
          disabled={ch === CHAPTERS.length - 1}
          className="loom-mono"
          style={{
            background: 'transparent',
            border: 0,
            padding: 0,
            cursor: ch === CHAPTERS.length - 1 ? 'default' : 'pointer',
            fontSize: 10,
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            color:
              ch === CHAPTERS.length - 1 ? 'var(--parchment-faint)' : 'var(--warm)',
          }}
        >
          later →
        </button>
      </div>

      {/* parchment edge — paler, ~6px, anchors the book as a physical object */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: 6,
          background: 'var(--parchment-edge, #e6dcc4)',
          borderTop: '1px solid var(--parchment-rule)',
          opacity: 0.6,
          overflow: 'hidden',
          pointerEvents: 'none',
        }}
      >
        {Array.from({ length: 144 }, (_, k) => (
          <span
            key={k}
            style={{
              position: 'absolute',
              top: 0,
              bottom: 0,
              left: `${(k / 144) * 100}%`,
              width: 1,
              background: 'var(--parchment-grain, rgba(26,25,22,0.06))',
            }}
          />
        ))}
      </div>
    </div>
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
        borderBottom: '1px solid var(--rule)',
      }}
    >
      <span
        className="loom-serif"
        style={{
          fontSize: 14,
          color: warm ? 'var(--warm)' : 'var(--bone)',
          fontStyle: warm ? 'italic' : 'normal',
        }}
      >
        {name}
      </span>
      <span
        className="loom-mono"
        style={{ fontSize: 9, color: 'var(--bone-faint)' }}
      >
        {status}
      </span>
    </div>
  );
}
