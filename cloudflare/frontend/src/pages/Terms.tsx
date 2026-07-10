import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { HLogo } from '../loom/components/HLogo';
import { ClothShell } from '../loom/components/ClothShell';
import { CosmicHeader, SectionLabel, WaxSeal } from '../loom/cosmic/CosmicUI';

const META_TITLE = 'Terms';
const META_DESCRIPTION = 'Terms of use for Heirloom.';
const OG_IMAGE = 'https://heirloom.blue/og-image.png?v=20260615b';
const CANONICAL = 'https://heirloom.blue/terms';

const SECTIONS = [
  {
    n: 'i',
    h: 'You write. We hold it.',
    b: 'Your entries are yours. You grant Heirloom only the technical permission needed to store, encrypt, replicate, and present them back to the people you\'ve authorized. We claim no rights beyond that.',
  },
  {
    n: 'ii',
    h: 'Append-only, with grace.',
    b: 'Entries cannot be silently edited. For 30 days the original author may correct an entry in place; after that, every change is kept as a visible amendment, not a silent rewrite. A deleted entry is recoverable for 7 days, then it is released. Beyond these windows the entry stands until the Deep\'s end-of-time.',
  },
  {
    n: 'iii',
    h: 'Members and successors.',
    b: 'You may invite members and designate successors. Roles are granular: author, reader, future-member, legacy contact, successor. The succession order is binding and visible in the audit log.',
  },
  {
    n: 'iv',
    h: 'The dead-man\'s switch.',
    b: 'You may arm a check-in interval. Missed check-ins raise warnings across a grace period; after sustained silence the switch enters a triggered state and the legacy contacts you have verified are asked to confirm your passing. Only their confirmation — or, as a last-resort backstop, a prolonged stretch of continued silence — passes administrative authority to your designated successor and releases entries set to open "on death."',
  },
  {
    n: 'v',
    h: 'Payment and continuity.',
    b: 'Subscription fees keep the platform running. Founder-tier payments are earmarked to fund a successor non-profit. We do not promise immortality. We commit to reasonable, documented provisions for what happens if we cease.',
  },
  {
    n: 'vi',
    h: 'Conduct.',
    b: 'Threads are private by default. We do not moderate private prose. We do moderate public-historian opt-in entries for the usual reasons (illegality, abuse). We reserve the right to suspend accounts that publish abusive material to the open archive.',
  },
  {
    n: 'vii',
    h: 'Disputes and venue.',
    b: 'Governed by the laws of the State of Delaware, USA. Disputes are arbitrated. Class actions are not waived; we do not believe in those waivers.',
  },
];

export function Terms() {
  return (
    <ClothShell
      topbarLeft={<HLogo href="/" />}
      topbarCenter="terms"
      topbarRight={<Link to="/privacy">privacy →</Link>}
    >
      <Helmet>
        <title>{`${META_TITLE} · Heirloom`}</title>
        <meta name="description" content={META_DESCRIPTION} />
        <meta property="og:title" content={META_TITLE} />
        <meta property="og:description" content={META_DESCRIPTION} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={CANONICAL} />
        <meta property="og:image" content={OG_IMAGE} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:image" content={OG_IMAGE} />
        <link rel="canonical" href={CANONICAL} />
      </Helmet>
      <div
        style={{
          maxWidth: '62ch',
          margin: '0 auto',
          padding: 'var(--page-pad-top) var(--page-pad-x) var(--page-clear)',
        }}
      >
        {/* LEGAL variant: mono eyebrow + giant serif title */}
        <CosmicHeader
          eyebrow="terms of service · plain words version"
          title="What we owe each other."
        />

        {/* Serif prose body — section by section */}
        {SECTIONS.map((s) => (
          <section key={s.n} style={{ marginTop: 52 }}>
            {/* Section label: roman numeral + heading in mono + serif */}
            <SectionLabel>{s.n} — {s.h}</SectionLabel>
            <p
              style={{
                fontFamily: 'var(--serif)',
                fontSize: 17,
                lineHeight: 1.7,
                color: 'var(--bone-dim)',
                margin: '10px 0 0',
                maxWidth: '62ch',
              }}
            >
              {s.b}
            </p>
          </section>
        ))}

        {/* Footer rule + links */}
        <div
          style={{
            marginTop: 72,
            paddingTop: 28,
            borderTop: '1px solid var(--rule)',
            display: 'flex',
            gap: 28,
            alignItems: 'center',
            flexWrap: 'wrap',
          }}
        >
          <Link to="/" style={{ textDecoration: 'none' }}>
            <HLogo size={14} wordmark mono />
          </Link>
          <Link
            to="/privacy"
            style={{
              fontFamily: 'var(--mono)',
              fontSize: 10,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: 'var(--bone-faint)',
              textDecoration: 'none',
            }}
          >
            Privacy
          </Link>
          <Link
            to="/security"
            style={{
              fontFamily: 'var(--mono)',
              fontSize: 10,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: 'var(--bone-faint)',
              textDecoration: 'none',
            }}
          >
            Security
          </Link>
          <a
            href="mailto:support@heirloom.blue"
            style={{
              fontFamily: 'var(--mono)',
              fontSize: 10,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: 'var(--bone-faint)',
              textDecoration: 'none',
            }}
          >
            Contact
          </a>
        </div>

        {/* WaxSeal foot — optional per spec */}
        <div style={{ marginTop: 56, marginBottom: 8 }}>
          <WaxSeal size={24} />
        </div>
      </div>
    </ClothShell>
  );
}
