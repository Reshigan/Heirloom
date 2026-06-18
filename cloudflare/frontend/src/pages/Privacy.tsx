import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { HLogo } from '../loom/components/HLogo';
import { ClothShell } from '../loom/components/ClothShell';
import { CosmicHeader, SectionLabel, WaxSeal } from '../loom/cosmic/CosmicUI';

const META_TITLE = 'Privacy';
const META_DESCRIPTION = "How Heirloom protects your family's stories.";
const OG_IMAGE = 'https://heirloom.blue/og-image.png?v=20260615b';
const CANONICAL = 'https://heirloom.blue/privacy';

const SECTIONS = [
  {
    n: 'one',
    h: 'Your entries are encrypted at rest.',
    b: 'Entry content is encrypted at rest with strong server-side AES-GCM, and access is controlled by your account and your thread membership — no one outside the thread can read it. We operate the encryption infrastructure, so this is not end-to-end or zero-knowledge encryption: the platform holds the keys. We never read your prose as a matter of policy, and if we are subpoenaed we hand over only what is genuinely demanded.',
  },
  {
    n: 'two',
    h: 'The thread outlives the company.',
    b: 'A successor non-profit is named in our bylaws and funded by Founder-tier payments. If Heirloom ends, the IPFS archive continues, and the family export tooling is open-sourced on day one of any wind-down.',
  },
  {
    n: 'three',
    h: 'You can always download everything.',
    b: 'Full export in plain text + original photographs + voice WAV files. No proprietary format. Updated nightly. Free at all tiers. You own this.',
  },
  {
    n: 'four',
    h: 'We never sell, share, or advertise.',
    b: 'No third-party trackers, no ad pixels, no analytics that identify individuals. Aggregate metrics only, in service of operating the platform. Pinky promise, codified in the bylaws.',
  },
  {
    n: 'five',
    h: 'Time-locked entries stay locked.',
    b: "A sealed note stays sealed until its release-condition is met — a date, a member's verified age, an author's verified death. The release is enforced server-side: until the condition is satisfied, the contents are withheld from recipients, and we do not surface them.",
  },
  {
    n: 'six',
    h: 'You can ask us to forget you.',
    b: 'A request to delete the account erases personal identifiers within 30 days. Content remains in the thread under whatever recipient grants you set. The 30-day grace exists because grief sometimes asks for things grief later regrets.',
  },
];

export function Privacy() {
  return (
    <ClothShell
      topbarLeft={<HLogo href="/" />}
      topbarCenter="privacy"
      topbarRight={<Link to="/terms">terms →</Link>}
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
          maxWidth: 'min(62ch, var(--page-max-prose))',
          margin: '0 auto',
          padding: 'var(--page-pad-top) var(--page-pad-x) var(--page-clear)',
        }}
      >
        <CosmicHeader
          eyebrow="privacy · plain words version"
          title="Six things you should know."
        />

        {SECTIONS.map((s) => (
          <section key={s.n} style={{ marginTop: 52 }}>
            <SectionLabel>{s.n}</SectionLabel>
            <div style={{ borderTop: '1px solid var(--rule)', paddingTop: 22 }}>
              <h2
                style={{
                  fontFamily: 'var(--serif-display)',
                  fontSize: 'clamp(24px, 3vw, 28px)',
                  fontWeight: 500,
                  letterSpacing: '-0.012em',
                  color: 'var(--bone)',
                  margin: 0,
                  lineHeight: 1.2,
                }}
              >
                {s.h}
              </h2>
              <p
                style={{
                  fontFamily: 'var(--serif)',
                  fontSize: 17,
                  lineHeight: 1.7,
                  marginTop: 14,
                  color: 'var(--bone-dim)',
                  maxWidth: '62ch',
                }}
              >
                {s.b}
              </p>
            </div>
          </section>
        ))}

        {/* Bridge to formal text + version stamp */}
        <div
          style={{
            marginTop: 72,
            paddingTop: 32,
            borderTop: '1px solid var(--rule)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'baseline',
            gap: 32,
            flexWrap: 'wrap',
          }}
        >
          <p
            style={{
              fontFamily: 'var(--serif)',
              fontStyle: 'italic',
              fontWeight: 300,
              fontSize: 14,
              lineHeight: 1.6,
              color: 'var(--bone-dim)',
              margin: 0,
            }}
          >
            The legal-formal version is below. We promise it says the same thing in more words.
          </p>
          <div
            style={{
              fontFamily: 'var(--mono)',
              fontSize: 10,
              color: 'var(--bone-faint)',
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              flexShrink: 0,
            }}
          >
            last updated · 14 nov 2025 · v 3.2
          </div>
        </div>

        {/* Footer links */}
        <div
          style={{
            marginTop: 56,
            paddingTop: 28,
            borderTop: '1px solid var(--rule)',
            display: 'flex',
            gap: 28,
            alignItems: 'center',
          }}
        >
          <Link to="/" style={{ textDecoration: 'none' }}>
            <HLogo size={14} wordmark mono />
          </Link>
          <Link
            to="/terms"
            className="hl-mono"
            style={{
              fontSize: 10,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: 'var(--bone-faint)',
              textDecoration: 'none',
            }}
          >
            Terms
          </Link>
          <a
            href="mailto:support@heirloom.blue"
            className="hl-mono"
            style={{
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

        {/* WaxSeal foot */}
        <div style={{ marginTop: 64, paddingBottom: 16 }}>
          <WaxSeal size={28} />
        </div>
      </div>
    </ClothShell>
  );
}
