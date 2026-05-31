import { useSearchParams, Link } from 'react-router-dom';
import { useState } from 'react';

export function GiftSuccess() {
  const [searchParams] = useSearchParams();
  const code = searchParams.get('code') || '';
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const redemptionUrl = `${window.location.origin}/gift/redeem?code=${code}`;

  return (
    <div className="min-h-screen bg-void text-paper antialiased">
      <div className="max-w-lg mx-auto px-6 md:px-12 py-12">
        <div className="bg-void-surface border border-paper-15 p-8 md:p-10 text-center">
          {/* Success Mark */}
          <span className="font-body text-5xl text-gold block mb-6" aria-hidden>∞</span>

          <h1
            className="font-body font-light text-paper mb-2 tracking-[-0.014em]"
            style={{ fontSize: 'clamp(2rem, 4vw, 2.75rem)' }}
          >
            Thank you.
          </h1>
          <p className="text-paper-70 mb-8 leading-relaxed">
            Your gift voucher has been created successfully.
          </p>

          {/* Voucher Code */}
          <div className="bg-void border border-gold-40 p-6 mb-6">
            <div className="text-paper-50 text-xs uppercase tracking-[0.22em] mb-2">Your gift code</div>
            <div className="font-mono text-2xl md:text-3xl text-gold tracking-wider mb-4">
              {code}
            </div>
            <button
              onClick={handleCopy}
              className="btn btn-ghost"
            >
              {copied ? 'Copied' : 'Copy code'}
            </button>
          </div>

          {/* Redemption Link */}
          <div className="bg-void border border-paper-15 p-4 mb-6">
            <p className="text-paper-50 text-sm mb-2 text-left">Or share this redemption link:</p>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={redemptionUrl}
                readOnly
                className="flex-1 bg-void-surface border border-paper-15 text-paper-70 text-sm px-3 py-2 rounded-[2px]"
              />
              <button
                onClick={() => {
                  navigator.clipboard.writeText(redemptionUrl);
                  alert('Link copied!');
                }}
                className="btn btn-ghost px-4"
                aria-label="Copy redemption link"
              >
                Copy
              </button>
            </div>
          </div>

          {/* Next Steps */}
          <div className="text-left bg-void border border-paper-15 p-4 mb-6">
            <h3 className="text-gold text-xs uppercase tracking-[0.22em] mb-3">What's next</h3>
            <ul className="space-y-2 text-paper-70 text-sm">
              <li className="flex items-baseline gap-3">
                <span className="text-gold font-mono text-sm" aria-hidden>·</span>
                <span>Share the code or link with your recipient</span>
              </li>
              <li className="flex items-baseline gap-3">
                <span className="text-gold font-mono text-sm" aria-hidden>·</span>
                <span>They can redeem it at heirloom.blue/gift/redeem</span>
              </li>
              <li className="flex items-baseline gap-3">
                <span className="text-gold font-mono text-sm" aria-hidden>·</span>
                <span>The voucher is valid for 1 year</span>
              </li>
            </ul>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              to="/gift"
              className="flex-1 btn btn-ghost text-center"
            >
              Buy another gift
            </Link>
            <Link
              to="/"
              className="flex-1 btn btn-primary text-center"
            >
              Go to Heirloom <span aria-hidden>→</span>
            </Link>
          </div>

          {/* Receipt Note */}
          <p className="text-paper-50 text-xs mt-6">
            A confirmation email has been sent to your email address.
          </p>
        </div>
      </div>
    </div>
  );
}

export default GiftSuccess;
