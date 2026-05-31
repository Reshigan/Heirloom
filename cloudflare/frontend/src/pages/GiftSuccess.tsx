import { useSearchParams, Link } from 'react-router-dom';
import { useState } from 'react';

export function GiftSuccess() {
  const [searchParams] = useSearchParams();
  const code = searchParams.get('code') || '';
  const [copied, setCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const redemptionUrl = `${window.location.origin}/gift/redeem?code=${code}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(redemptionUrl);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--loom-ink)',
        color: 'var(--loom-bone)',
        display: 'grid',
        placeItems: 'center',
        padding: '40px 24px',
      }}
    >
      <div style={{ width: '100%', maxWidth: 480 }}>
        {/* Header */}
        <p className="loom-eyebrow" style={{ marginBottom: 20 }}>purchase complete</p>
        <h1
          className="loom-h2"
          style={{ fontSize: 'clamp(36px, 5vw, 52px)', fontWeight: 300, fontStyle: 'italic', margin: '0 0 16px' }}
        >
          Thank you.
        </h1>
        <p className="loom-body" style={{ color: 'var(--loom-bone-dim)', fontSize: 16, margin: '0 0 40px', lineHeight: 1.7 }}>
          Your gift voucher has been created. share the code or link with the person you're giving it to.
        </p>

        <hr className="loom-hairline" style={{ marginBottom: 40 }} />

        {/* Code */}
        <div style={{ marginBottom: 32 }}>
          <p className="loom-eyebrow" style={{ marginBottom: 14, fontSize: 9 }}>your gift code</p>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '16px 0',
              borderBottom: '1px solid var(--loom-rule)',
            }}
          >
            <span
              className="loom-mono"
              style={{ fontSize: 20, letterSpacing: '0.1em', color: 'var(--loom-warm)' }}
            >
              {code}
            </span>
            <button
              onClick={handleCopy}
              className="loom-btn-ghost"
              style={{ padding: '7px 16px' }}
            >
              {copied ? 'copied' : 'copy'}
            </button>
          </div>
        </div>

        {/* Redemption URL */}
        <div style={{ marginBottom: 40 }}>
          <p className="loom-eyebrow" style={{ marginBottom: 14, fontSize: 9 }}>or share this link</p>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <input
              type="text"
              value={redemptionUrl}
              readOnly
              className="loom-mono"
              style={{ flex: 1, fontSize: 11, color: 'var(--loom-bone-dim)', letterSpacing: '0.02em' }}
            />
            <button
              onClick={handleCopyLink}
              className="loom-btn-ghost"
              style={{ padding: '7px 16px', flexShrink: 0 }}
              aria-label="Copy redemption link"
            >
              {linkCopied ? 'copied' : 'copy'}
            </button>
          </div>
        </div>

        <hr className="loom-hairline" style={{ marginBottom: 32 }} />

        {/* Next steps */}
        <div style={{ marginBottom: 40 }}>
          <p className="loom-eyebrow" style={{ marginBottom: 16, fontSize: 9 }}>what's next</p>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 10 }}>
            {[
              'share the code or link with your recipient',
              'they can redeem it at heirloom.blue/gift/redeem',
              'the voucher is valid for one year',
            ].map((step, i) => (
              <li
                key={i}
                className="loom-body"
                style={{ display: 'flex', alignItems: 'baseline', gap: 12, fontSize: 14, color: 'var(--loom-bone-dim)' }}
              >
                <span style={{ color: 'var(--loom-warm)', flexShrink: 0 }}>·</span>
                {step}
              </li>
            ))}
          </ul>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <Link
            to="/gift"
            className="loom-btn-ghost"
            style={{ textDecoration: 'none', flex: 1, textAlign: 'center' }}
          >
            give another gift
          </Link>
          <Link
            to="/"
            className="loom-btn"
            style={{ textDecoration: 'none', flex: 1, textAlign: 'center' }}
          >
            heirloom
          </Link>
        </div>

        <p
          className="loom-mono"
          style={{ textAlign: 'center', fontSize: 9, letterSpacing: '0.18em', color: 'var(--loom-bone-faint)', marginTop: 28 }}
        >
          a confirmation has been sent to your email
        </p>
      </div>
    </div>
  );
}

export default GiftSuccess;
