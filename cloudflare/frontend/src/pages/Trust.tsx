import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { HLogo } from '../loom/components/HLogo';
import { ClothShell } from '../loom/components/ClothShell';
import { CosmicHeader, SectionLabel, WaxSeal } from '../loom/cosmic/CosmicUI';

// Every claim on this page is traceable to code in cloudflare/worker. A trust
// page that overclaims is worse than no trust page: it is the one document a
// reader is entitled to take literally. Section eight exists because of that —
// if a control is not built, it is named there rather than omitted. Before
// editing any sentence below, verify it against the worker, not against intent.
// Claims that depend on a deployed secret (encryption, cron) are not decidable
// from source alone — `curl https://api.heirloom.blue/api/health` returns the
// readiness booleans the worker actually sees.

const META_TITLE = 'Security';
const META_DESCRIPTION = 'How Heirloom holds your family’s archive — and what we have not built yet.';
const OG_IMAGE = 'https://heirloom.blue/og-image.png?v=20260615b';
const CANONICAL = 'https://heirloom.blue/security';
const LAST_UPDATED = '10 jul 2026';

const SECTIONS = [
  {
    n: 'one',
    h: 'How your account is held shut.',
    b: 'Passwords are never stored — only a PBKDF2-HMAC-SHA256 hash at 100,000 iterations with a per-user salt. Sessions are signed tokens that expire in an hour and are additionally checked against a server-side session record on every request, so signing out of a device revokes it immediately rather than waiting for the token to lapse. Two-factor authentication by authenticator app is available on every account. Rate limiting sits in front of the login and signup routes and fails closed: if the limiter itself is unreachable, the request is refused rather than waved through.',
  },
  {
    n: 'two',
    h: 'What our encryption is, and what it is not.',
    b: 'Everything moves over TLS, and the disks underneath us are encrypted at rest by our infrastructure provider. Above that, the body of every entry you write is sealed a second time, with AES-256-GCM, under a master key held outside the database — so a stolen copy of the database, on its own, does not read as prose. That is the honest extent of it. Heirloom is not end-to-end encrypted and it is not zero-knowledge: we run the servers and we hold that key, which is what makes search, sealed-note release, and account recovery possible at all. Anyone who tells you a product does all three of those and holds no keys is selling something. We would rather you know exactly who can read what.',
  },
  {
    n: 'three',
    h: 'Nothing is quietly overwritten.',
    b: 'The archive is append-only by construction. Deleting an entry marks it deleted; it does not vacate the row. Edits to an entry do not replace what was there — the prior text is written to a revision log that only ever grows. This is the whole point of the Deep: a great-grandchild should be able to see that a story was told one way in 2026 and another way in 2041, and that neither telling was erased to make the other tidier.',
  },
  {
    n: 'four',
    h: 'You can take everything and leave.',
    b: 'One request downloads your complete archive as plain JSON — every entry, every sealed note, every revision ever recorded — along with a manifest of direct links to the original photographs and voice files, in the format you uploaded them. No proprietary container, no support ticket, no fee, at any tier. One request erases the account outright: database rows, stored files, and the payment-processor customer record, immediately and without our involvement. There is also a slower door, if you want it: schedule the deletion and the account sits archived for ninety days, exportable and reversible, before the same purge runs.',
  },
  {
    n: 'five',
    h: 'Backups exist, and they forget.',
    b: 'Every night the irreplaceable tables are dumped to durable storage, so a bad migration or an accidental mass-delete is recoverable beyond the database’s own thirty-day window. Those dumps are copies of real people, so they expire: any dump older than thirty-five days is deleted automatically. That is what makes erasure honest. When you delete your account, you are gone from the live system that day and out of the last backup within thirty-five.',
  },
  {
    n: 'six',
    h: 'A sealed note stays sealed.',
    b: 'The release condition on a sealed note — a date, a member reaching an age, an author’s verified death — is enforced on the server. Until it is met, the contents are not sent to the browser at all, so there is nothing in the page to inspect. A sealed note is not hidden from you by the interface. It is withheld from you by the server.',
  },
  {
    n: 'seven',
    h: 'Who else touches your data.',
    b: 'Payments and card data go to Stripe — we never see a card number. Transactional email goes to Resend. The application, database, and file storage run on Cloudflare, and the optional writing assistance runs on Cloudflare’s AI platform, not on a third party’s. Printed books are produced by Lulu, and only for the order you place. Push notifications route through Apple and Google. If you import from a social account, that provider sees the authorisation. That is the complete list. No advertising network, no analytics broker, no data buyer has ever been in it.',
  },
];

// The part a security page usually omits. Each line is a control we have NOT
// built; each is a real weakness a determined reader deserves before they trust
// us with the only copy of their grandmother's voice.
const NOT_YET = [
  'That second layer of encryption reaches the body of an entry and stops there. Titles, letters, voice transcripts, and the revision log are stored as you wrote them, protected only by the provider’s disk encryption.',
  'Two-factor secrets are stored unencrypted in our database. Someone with a database dump could reconstruct your authenticator codes. Your password hash would still stand between them and your account.',
  'There is no lockout after repeated failed passwords — only per-address rate limiting, which a distributed attacker can spread out under.',
  'Backups live with the same provider as the live data, and we have not yet run a full restore drill. An untested backup is a hypothesis.',
  'Your data is not pinned to a jurisdiction. It sits wherever our provider places it.',
];

export function Trust() {
  return (
    <ClothShell
      topbarLeft={<HLogo href="/" />}
      topbarCenter="security"
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
          maxWidth: 'min(62ch, var(--page-max-prose))',
          margin: '0 auto',
          padding: 'var(--page-pad-top) var(--page-pad-x) var(--page-clear)',
        }}
      >
        <CosmicHeader
          eyebrow="security · what we can prove"
          title="A hundred years is a long time to trust someone."
        />

        <p
          style={{
            fontFamily: 'var(--serif)',
            fontStyle: 'italic',
            fontWeight: 300,
            fontSize: 17,
            lineHeight: 1.7,
            marginTop: 28,
            color: 'var(--bone-dim)',
            maxWidth: '62ch',
          }}
        >
          So this page is written to be checked, not admired. Everything below is
          something the software actually does today. What it does not do is at
          the bottom, in the same plain words.
        </p>

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

        <section style={{ marginTop: 52 }}>
          <SectionLabel>eight</SectionLabel>
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
              What we have not built yet.
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
              A security page that lists only its strengths has told you nothing,
              because every security page lists only its strengths. Here is the
              rest of it.
            </p>
            <ul style={{ listStyle: 'none', margin: '26px 0 0', padding: 0 }}>
              {NOT_YET.map((line) => (
                <li
                  key={line}
                  style={{
                    fontFamily: 'var(--serif)',
                    fontSize: 16,
                    lineHeight: 1.7,
                    color: 'var(--bone-dim)',
                    maxWidth: '62ch',
                    paddingLeft: 20,
                    marginTop: 16,
                    borderLeft: '1px solid var(--rule)',
                  }}
                >
                  {line}
                </li>
              ))}
            </ul>
            <p
              style={{
                fontFamily: 'var(--serif)',
                fontSize: 17,
                lineHeight: 1.7,
                marginTop: 26,
                color: 'var(--bone-dim)',
                maxWidth: '62ch',
              }}
            >
              Each of these is on the work list rather than the wish list. When one
              is done it moves up this page, and the date below changes. If you
              find something we have got wrong, write to us — that address is read
              by the people who wrote the code.
            </p>
          </div>
        </section>

        {/* Disclosure + version stamp */}
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
            Found a vulnerability? support@heirloom.blue. We will not threaten you
            for telling us.
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
            last verified · {LAST_UPDATED}
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
            flexWrap: 'wrap',
          }}
        >
          <Link to="/" style={{ textDecoration: 'none' }}>
            <HLogo size={14} wordmark mono />
          </Link>
          <Link
            to="/privacy"
            className="hl-mono"
            style={{
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

        <div style={{ marginTop: 64, paddingBottom: 16 }}>
          <WaxSeal size={28} />
        </div>
      </div>
    </ClothShell>
  );
}
