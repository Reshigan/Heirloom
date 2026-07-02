// Daily growth scoreboard — visits, signups, sources, activity, retention —
// emailed to the operator every morning. Excludes internal/test accounts
// (@heirloom.* and @example.com). Every section is individually guarded so a
// schema surprise degrades one row, never the whole email.
import { sendEmail } from '../utils/email';
import type { Env } from '../index';

const EXCLUDE = `email NOT LIKE '%@heirloom%' AND email NOT LIKE '%@example.com'`;

function iso(d: Date): string { return d.toISOString().slice(0, 10); }
function trend(today: number, prior: number): string {
  if (today > prior) return `▲ +${today - prior}`;
  if (today < prior) return `▼ ${today - prior}`;
  return '· 0';
}

async function one<T>(env: Env, sql: string, ...binds: unknown[]): Promise<T | null> {
  try { return await env.DB.prepare(sql).bind(...binds).first<T>(); } catch { return null; }
}
async function all<T>(env: Env, sql: string, ...binds: unknown[]): Promise<T[]> {
  try { return ((await env.DB.prepare(sql).bind(...binds).all<T>()).results ?? []) as T[]; } catch { return []; }
}

export async function runDailyScoreboard(env: Env): Promise<void> {
  const now = new Date();
  const day = iso(new Date(now.getTime() - 86_400_000));      // the report day: yesterday
  const prior = iso(new Date(now.getTime() - 2 * 86_400_000)); // the day before
  const week = iso(new Date(now.getTime() - 8 * 86_400_000));  // 7-day window start

  // Visits (site_visits: day × ref × path)
  const vDay = (await one<{ n: number }>(env, `SELECT COALESCE(SUM(hits),0) n FROM site_visits WHERE day = ?`, day))?.n ?? 0;
  const vPrior = (await one<{ n: number }>(env, `SELECT COALESCE(SUM(hits),0) n FROM site_visits WHERE day = ?`, prior))?.n ?? 0;
  const vByRef = await all<{ ref: string; n: number }>(env,
    `SELECT CASE WHEN ref='' THEN 'direct' ELSE ref END ref, SUM(hits) n
     FROM site_visits WHERE day >= ? GROUP BY 1 ORDER BY 2 DESC LIMIT 8`, week);

  // Real signups (test users excluded)
  const sDay = (await one<{ n: number }>(env, `SELECT COUNT(*) n FROM users WHERE date(created_at)=? AND ${EXCLUDE}`, day))?.n ?? 0;
  const sPrior = (await one<{ n: number }>(env, `SELECT COUNT(*) n FROM users WHERE date(created_at)=? AND ${EXCLUDE}`, prior))?.n ?? 0;
  const s7 = (await one<{ n: number }>(env, `SELECT COUNT(*) n FROM users WHERE date(created_at)>=? AND ${EXCLUDE}`, week))?.n ?? 0;
  const sTotal = (await one<{ n: number }>(env, `SELECT COUNT(*) n FROM users WHERE ${EXCLUDE}`))?.n ?? 0;
  const sBySrc = await all<{ src: string; n: number }>(env,
    `SELECT COALESCE(signup_source,'direct') src, COUNT(*) n FROM users
     WHERE date(created_at) >= ? AND ${EXCLUDE} GROUP BY 1 ORDER BY 2 DESC`, week);

  // Activity + simple week-1 retention (real users only)
  const dau = (await one<{ n: number }>(env, `SELECT COUNT(*) n FROM users WHERE date(last_login_at)=? AND ${EXCLUDE}`, day))?.n ?? 0;
  const wau = (await one<{ n: number }>(env, `SELECT COUNT(*) n FROM users WHERE date(last_login_at)>=? AND ${EXCLUDE}`, week))?.n ?? 0;
  const ret = await one<{ cohort: number; kept: number }>(env,
    `SELECT COUNT(*) cohort,
            SUM(CASE WHEN date(last_login_at) >= ? THEN 1 ELSE 0 END) kept
     FROM users
     WHERE date(created_at) BETWEEN date(?, '-14 days') AND date(?, '-8 days') AND ${EXCLUDE}`,
    week, day, day);
  const retPct = ret && ret.cohort > 0 ? Math.round((100 * (ret.kept ?? 0)) / ret.cohort) : null;

  // Commercial + support signal (replaces the retired daily admin summary)
  const subs = await one<{ active: number; trialing: number }>(env,
    `SELECT COUNT(CASE WHEN s.status='ACTIVE' THEN 1 END) active,
            COUNT(CASE WHEN s.status='TRIALING' THEN 1 END) trialing
     FROM subscriptions s JOIN users u ON u.id = s.user_id
     WHERE ${EXCLUDE.replace(/email/g, 'u.email')}`);
  const tickets = (await one<{ n: number }>(env,
    `SELECT COUNT(*) n FROM support_tickets WHERE status NOT IN ('RESOLVED','CLOSED')`))?.n ?? null;

  // Content settling in (letters written by real users)
  const lDay = (await one<{ n: number }>(env,
    `SELECT COUNT(*) n FROM letters l JOIN users u ON u.id = l.user_id
     WHERE date(l.created_at)=? AND ${EXCLUDE.replace(/email/g, 'u.email')}`, day))?.n ?? 0;

  const row = (label: string, value: string, tr = '') =>
    `<tr><td style="padding:8px 0;border-bottom:1px solid rgba(242,230,208,0.11);color:rgba(242,230,208,0.72);font-family:'Courier New',monospace;font-size:12px;letter-spacing:0.08em;text-transform:uppercase">${label}</td>
     <td style="padding:8px 0;border-bottom:1px solid rgba(242,230,208,0.11);color:#f2e6d0;font-family:Georgia,serif;font-size:18px;text-align:right">${value}</td>
     <td style="padding:8px 0 8px 14px;border-bottom:1px solid rgba(242,230,208,0.11);color:#e0a062;font-family:'Courier New',monospace;font-size:12px;text-align:right;white-space:nowrap">${tr}</td></tr>`;

  const list = (items: { k: string; n: number }[]) =>
    items.length
      ? items.map((i) => `${i.k} <span style="color:#e0a062">${i.n}</span>`).join(' &nbsp;·&nbsp; ')
      : '<span style="color:rgba(242,230,208,0.5)">none yet</span>';

  const html = `
  <div style="background:#070d14;padding:32px 24px;max-width:640px;margin:0 auto">
    <p style="color:#e0a062;font-family:'Courier New',monospace;font-size:11px;letter-spacing:0.3em;text-transform:uppercase;margin:0 0 4px">Heirloom · daily scoreboard</p>
    <h1 style="color:#f2e6d0;font-family:Georgia,serif;font-weight:400;font-size:26px;margin:0 0 24px">${day} <span style="color:rgba(242,230,208,0.5);font-size:15px">(test users excluded)</span></h1>
    <table style="width:100%;border-collapse:collapse">
      ${row('Visits', String(vDay), trend(vDay, vPrior))}
      ${row('Signups', String(sDay), trend(sDay, sPrior))}
      ${row('Signups · 7d', String(s7))}
      ${row('Real users · total', String(sTotal))}
      ${row('Active yesterday (DAU)', String(dau))}
      ${row('Active · 7d (WAU)', String(wau))}
      ${row('Week-1 retention', retPct === null ? '— (cohort empty)' : `${retPct}% of ${ret!.cohort}`)}
      ${row('Letters written', String(lDay))}
      ${row('Subscriptions', subs ? `${subs.active} active · ${subs.trialing} trial` : '—')}
      ${row('Open support tickets', tickets === null ? '—' : String(tickets))}
    </table>
    <p style="color:rgba(242,230,208,0.72);font-family:Georgia,serif;font-size:14px;line-height:1.7;margin:20px 0 6px"><span style="color:#e0a062;font-family:'Courier New',monospace;font-size:11px;letter-spacing:0.2em;text-transform:uppercase">Visits by source · 7d</span><br>${list(vByRef.map((r) => ({ k: r.ref, n: r.n })))}</p>
    <p style="color:rgba(242,230,208,0.72);font-family:Georgia,serif;font-size:14px;line-height:1.7;margin:14px 0 0"><span style="color:#e0a062;font-family:'Courier New',monospace;font-size:11px;letter-spacing:0.2em;text-transform:uppercase">Signups by source · 7d</span><br>${list(sBySrc.map((r) => ({ k: r.src, n: r.n })))}</p>
    <p style="color:rgba(242,230,208,0.5);font-family:'Courier New',monospace;font-size:10px;letter-spacing:0.14em;margin:28px 0 0">H E I R L O O M . B L U E</p>
  </div>`;

  await sendEmail(env, {
    from: 'Heirloom <noreply@heirloom.blue>',
    to: env.SCOREBOARD_EMAIL || 'admin@vantax.co.za',
    subject: `Heirloom scoreboard ${day} — ${sDay} signup${sDay === 1 ? '' : 's'}, ${vDay} visit${vDay === 1 ? '' : 's'}`,
    html,
  }, 'daily-scoreboard');
}
