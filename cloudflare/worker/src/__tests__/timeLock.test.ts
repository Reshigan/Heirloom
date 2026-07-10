import { describe, it, expect } from 'vitest';
import { ageMatured, unlockInstant, unlockMatured } from '../utils/timeLock';

// The one property that matters: a sealed note never opens before its date has
// begun for the person reading it. Late is forgivable. Early is not.
describe('unlockMatured', () => {
  // The time-locks cron runs daily at 09:00 UTC (wrangler.toml).
  const cronOn = (day: string) => new Date(`${day}T09:00:00Z`);

  it('does not resolve a bare date while any zone on Earth is still on the day before', () => {
    // 09:00 UTC on 1 Jun is 23:00 on 31 May in Hawaii (UTC-10). The old
    // `new Date('2041-06-01') <= now` returned true here and opened it early.
    expect(unlockMatured('2041-06-01', cronOn('2041-06-01'))).toBe(false);
    expect(unlockMatured('2041-06-01', cronOn('2041-06-02'))).toBe(true);
  });

  it('matures a bare date exactly when UTC-12 reaches it, and not a second sooner', () => {
    expect(unlockInstant('2041-06-01').toISOString()).toBe('2041-06-01T12:00:00.000Z');
    expect(unlockMatured('2041-06-01', new Date('2041-06-01T11:59:59Z'))).toBe(false);
    expect(unlockMatured('2041-06-01', new Date('2041-06-01T12:00:00Z'))).toBe(true);
  });

  it('honours an explicit instant from a client that knows its own zone', () => {
    // The browser's local midnight in Hawaii, posted as an instant.
    const hawaiiMidnight = '2041-06-01T10:00:00.000Z';
    expect(unlockMatured(hawaiiMidnight, new Date('2041-06-01T09:59:59Z'))).toBe(false);
    expect(unlockMatured(hawaiiMidnight, new Date('2041-06-01T10:00:00Z'))).toBe(true);
  });

  it('never matures an unparseable date', () => {
    expect(unlockMatured('someday', new Date('2999-01-01T00:00:00Z'))).toBe(false);
    expect(unlockMatured('', new Date('2999-01-01T00:00:00Z'))).toBe(false);
  });
});

describe('ageMatured', () => {
  const born = '2023-06-01';

  it('does not turn the year while any zone is still on the day before the birthday', () => {
    // The 09:00 UTC cron on the eighteenth birthday is still 31 May in Hawaii.
    expect(ageMatured(born, 18, new Date('2041-06-01T09:00:00Z'))).toBe(false);
    expect(ageMatured(born, 18, new Date('2041-06-02T09:00:00Z'))).toBe(true);
  });

  it('turns the year exactly when UTC-12 reaches the birthday', () => {
    expect(ageMatured(born, 18, new Date('2041-06-01T11:59:59Z'))).toBe(false);
    expect(ageMatured(born, 18, new Date('2041-06-01T12:00:00Z'))).toBe(true);
  });

  it('holds a lock whose age is years away', () => {
    expect(ageMatured(born, 18, new Date('2040-12-31T23:59:59Z'))).toBe(false);
  });

  it('gives a 29 Feb birthday its birthday on 1 March in common years', () => {
    // getUTCDate() comparison rolls the leap-day child over on 1 Mar, not 28 Feb.
    expect(ageMatured('2024-02-29', 17, new Date('2041-02-28T12:00:00Z'))).toBe(false);
    expect(ageMatured('2024-02-29', 17, new Date('2041-03-01T12:00:00Z'))).toBe(true);
  });

  it('never matures an unparseable birth date', () => {
    expect(ageMatured('unknown', 18, new Date('2999-01-01T00:00:00Z'))).toBe(false);
  });
});
