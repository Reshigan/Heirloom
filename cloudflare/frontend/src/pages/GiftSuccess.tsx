import { useSearchParams, Link } from 'react-router-dom';
import { Gift, Check, Copy, Send, ArrowRight } from '../components/Icons';
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
    <div className="min-h-screen relative overflow-hidden">
      {/* Sanctuary Background */}
      <div className="sanctuary-bg">
        <div className="sanctuary-orb sanctuary-orb-1" />
        <div className="sanctuary-orb sanctuary-orb-2" />
        <div className="sanctuary-orb sanctuary-orb-3" />
        <div className="sanctuary-stars" />
        <div className="sanctuary-mist" />
      </div>

      <div className="relative z-10 max-w-lg mx-auto px-4 py-12">
        <div className="card text-center">
          {/* Success Icon */}
          <div className="w-24 h-24 bg-gradient-to-br from-green-500/30 to-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-green-500/30">
            <Check className="w-12 h-12 text-green-400" />
          </div>

          <h1 className="text-3xl font-light text-paper mb-2">
            Thank You!
          </h1>
          <p className="text-paper/60 mb-8">
            Your gift voucher has been created successfully.
          </p>

          {/* Voucher Code */}
          <div className="bg-white/5 border border-gold/30 rounded-lg p-6 mb-6">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Gift className="w-5 h-5 text-gold" />
              <span className="text-paper/50 text-sm">Your Gift Code</span>
            </div>
            <div className="font-mono text-2xl md:text-3xl text-gold tracking-wider mb-4">
              {code}
            </div>
            <button
              onClick={handleCopy}
              className="btn btn-secondary inline-flex items-center gap-2"
            >
              <Copy size={16} />
              {copied ? 'Copied!' : 'Copy Code'}
            </button>
          </div>

          {/* Redemption Link */}
          <div className="bg-white/[0.02] border border-white/10 rounded-lg p-4 mb-6">
            <p className="text-paper/50 text-sm mb-2">Or share this redemption link:</p>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={redemptionUrl}
                readOnly
                className="flex-1 bg-white/5 border border-white/10 rounded px-3 py-2 text-paper/70 text-sm"
              />
              <button
                onClick={() => {
                  navigator.clipboard.writeText(redemptionUrl);
                  alert('Link copied!');
                }}
                className="btn btn-secondary px-3"
              >
                <Copy size={16} />
              </button>
            </div>
          </div>

          {/* Next Steps */}
          <div className="text-left bg-gold/5 border border-gold/20 rounded-lg p-4 mb-6">
            <h3 className="text-gold text-sm font-medium mb-2">What's Next?</h3>
            <ul className="space-y-2 text-paper/70 text-sm">
              <li className="flex items-start gap-2">
                <Send className="w-4 h-4 text-gold mt-0.5 flex-shrink-0" />
                <span>Share the code or link with your recipient</span>
              </li>
              <li className="flex items-start gap-2">
                <Gift className="w-4 h-4 text-gold mt-0.5 flex-shrink-0" />
                <span>They can redeem it at heirloom.blue/gift/redeem</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-gold mt-0.5 flex-shrink-0" />
                <span>The voucher is valid for 1 year</span>
              </li>
            </ul>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              to="/gift"
              className="flex-1 btn btn-secondary text-center"
            >
              Buy Another Gift
            </Link>
            <Link
              to="/"
              className="flex-1 btn btn-primary text-center inline-flex items-center justify-center gap-2"
            >
              Go to Heirloom
              <ArrowRight size={16} />
            </Link>
          </div>

          {/* Receipt Note */}
          <p className="text-paper/40 text-xs mt-6">
            A confirmation email has been sent to your email address.
          </p>
        </div>
      </div>
    </div>
  );
}

export default GiftSuccess;
