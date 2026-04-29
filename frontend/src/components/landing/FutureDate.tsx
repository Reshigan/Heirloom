import { useEffect, useState } from 'react';

/**
 * Live-ticking future-date marker. The ambient marketing argument for the
 * time-lock primitive: shows a real moment in 2055 (or any offset) that
 * an entry written today could be locked to. The visible time-of-day ticks
 * every second, the date shifts mid-month so the moment feels alive
 * rather than canned.
 *
 * No external libs — single setInterval, low cost.
 */
export function FutureDate({ yearsAhead = 30 }: { yearsAhead?: number }) {
  const [now, setNow] = useState<Date>(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const future = new Date(now);
  future.setFullYear(future.getFullYear() + yearsAhead);

  const dateStr = future.toLocaleDateString(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const timeStr = future.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  return (
    <span className="font-mono tabular-nums text-paper/55 text-sm">
      <span className="text-paper/30">unlocks</span> {dateStr}
      <span className="text-paper/40 ml-2">— {timeStr}</span>
    </span>
  );
}
