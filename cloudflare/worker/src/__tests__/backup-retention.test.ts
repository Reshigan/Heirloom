import { describe, it, expect } from 'vitest';
import { staleDays, BACKUP_RETENTION_DAYS } from '../crons/backup';

// Backups hold a copy of every user row. If staleDays under-deletes, erased
// accounts live on in R2 forever (GDPR Art.17). If it over-deletes, we lose the
// dumps that exist to survive a bad migration. Both directions are tested.
describe('backup retention', () => {
  const TODAY = '2026-03-15';

  it('deletes days strictly older than the window', () => {
    // 35 days before 2026-03-15 is 2026-02-08.
    expect(staleDays(['2026-02-07'], TODAY, 35)).toEqual(['2026-02-07']);
    expect(staleDays(['2026-01-01', '2025-12-31'], TODAY, 35)).toEqual(['2026-01-01', '2025-12-31']);
  });

  it('keeps the cutoff day and everything newer', () => {
    expect(staleDays(['2026-02-08', '2026-03-14', TODAY], TODAY, 35)).toEqual([]);
  });

  it('crosses month and year boundaries by real calendar arithmetic', () => {
    // Not `day - 35` on the day-of-month: 35 days before Mar 1 is Jan 25.
    expect(staleDays(['2026-01-24'], '2026-03-01', 35)).toEqual(['2026-01-24']);
    expect(staleDays(['2026-01-25'], '2026-03-01', 35)).toEqual([]);
    // 35 days before 2025-01-30 is 2024-12-26 — the cutoff, so it stays.
    expect(staleDays(['2024-12-26'], '2025-01-30', 35)).toEqual([]);
    expect(staleDays(['2024-12-25'], '2025-01-30', 35)).toEqual(['2024-12-25']);
  });

  it('never touches keys that are not a YYYY-MM-DD day', () => {
    expect(staleDays(['_manifest.json', 'restore-2020', '', '2026-2-1'], TODAY, 35)).toEqual([]);
  });

  it('keeps dumps longer than D1 Time Travel (30 days), which they exist to outlive', () => {
    expect(BACKUP_RETENTION_DAYS).toBeGreaterThan(30);
  });
});
