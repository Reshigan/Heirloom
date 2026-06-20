/**
 * InlineStatus — the product's only transient-feedback affordance.
 *
 * Replaces native alert()/toast notifications: a bordered ink-card chip that
 * states the outcome inline, then self-clears on the 4s cadence. `ok` carries
 * cream (var(--bone-dim)); `err` carries the lone copper signal (var(--warm)).
 * All colours resolve through tokens that theme-flip (paper/vault).
 *
 * Shared by the admin console (AdminDashboard, MarketingTab). Pair the
 * `useInlineStatus` hook (state + ok/err/clear) with the `<InlineStatus>` chip.
 */
import { useEffect, useState } from 'react';

type StatusTone = 'ok' | 'err';
interface InlineStatusState { msg: string; tone: StatusTone; key: number }

export function useInlineStatus() {
  const [state, setState] = useState<InlineStatusState | null>(null);
  return {
    state,
    ok: (msg: string) => setState({ msg, tone: 'ok', key: Date.now() }),
    err: (msg: string) => setState({ msg, tone: 'err', key: Date.now() }),
    clear: () => setState(null),
  };
}
export type InlineStatusApi = ReturnType<typeof useInlineStatus>;

export function InlineStatus({ status }: { status: InlineStatusApi }) {
  useEffect(() => {
    if (!status.state) return;
    const t = setTimeout(() => status.clear(), 4000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status.state?.key]);
  if (!status.state) return null;
  const warm = status.state.tone === 'ok';
  return (
    <div
      role={status.state.tone === 'err' ? 'alert' : 'status'}
      style={{
        marginBottom: 20, padding: '8px 14px',
        background: 'var(--ink-card)',
        border: `1px solid ${warm ? 'var(--rule)' : 'var(--gold-40)'}`,
        fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '0.04em',
        color: warm ? 'var(--bone-dim)' : 'var(--warm)',
      }}
    >
      {status.state.msg}
    </div>
  );
}
