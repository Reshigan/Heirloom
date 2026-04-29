import { useEffect, useState } from 'react';

/**
 * Live-ticking future-date marker. Ambient marketing for the time-lock
 * primitive: shows a real moment N years from right-now, ticking
 * every second.
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
    <span className="font-mono tabular-nums text-paper-60 text-sm">
      <span className="text-paper-30">unlocks</span> {dateStr}
      <span className="text-paper-50 ml-2">— {timeStr}</span>
    </span>
  );
}
