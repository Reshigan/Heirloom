import { AppFrame } from '../loom/components/AppFrame';

export function QA() {
  return (
    <AppFrame left="ask the thread">
      <div style={{ maxWidth: 640, padding: '48px 0' }}>
        <div className="hl-eyebrow" style={{ marginBottom: 24 }}>coming soon</div>
        <h1 className="hl-serif hl-tight" style={{ fontSize: 32, fontWeight: 300, color: 'var(--bone)', margin: '0 0 24px' }}>
          Ask your thread anything.
        </h1>
        <p className="hl-serif" style={{ fontSize: 17, lineHeight: 1.7, color: 'var(--bone-dim)', maxWidth: '44ch', margin: 0 }}>
          We're building an AI that can search your family's entries and surface answers — with citations back to the exact entry. It will never invent.
        </p>
        <p className="hl-mono" style={{ fontSize: 10, color: 'var(--bone-faint)', letterSpacing: '0.14em', textTransform: 'uppercase', marginTop: 40 }}>
          Arriving later this year
        </p>
      </div>
    </AppFrame>
  );
}
