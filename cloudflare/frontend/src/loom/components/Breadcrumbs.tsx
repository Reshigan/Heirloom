import { Fragment } from 'react';
import { Link } from 'react-router-dom';

/**
 * Breadcrumbs — replaces the scattered lone "← back"/"exit" arrows with a
 * single consistent trail. Every screen tells you where it sits in the
 * cloth: e.g. cloth › voice, or ∞ › settings. The last crumb is the current
 * place (warm, not a link); earlier crumbs navigate.
 *
 * Mono, uppercase, hairline `›` separators — the same restrained topbar
 * voice as the rest of the loom. No icons, no chrome.
 */

export interface Crumb {
  label: string;
  to?: string; // omit on the final (current) crumb
}

export function Breadcrumbs({ trail }: { trail: Crumb[] }) {
  return (
    <nav
      aria-label="Breadcrumb"
      style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}
    >
      {trail.map((c, i) => {
        const last = i === trail.length - 1;
        return (
          <Fragment key={`${c.label}-${i}`}>
            {i > 0 && (
              <span
                aria-hidden
                style={{
                  fontFamily: 'var(--mono)', fontSize: 10, lineHeight: 1,
                  color: 'var(--bone-faint)', opacity: 0.6,
                }}
              >
                ›
              </span>
            )}
            {last || !c.to ? (
              <span
                aria-current={last ? 'page' : undefined}
                style={{
                  fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.18em',
                  textTransform: 'uppercase', color: last ? 'var(--warm)' : 'var(--bone-dim)',
                  whiteSpace: 'nowrap',
                }}
              >
                {c.label}
              </span>
            ) : (
              <Link
                to={c.to}
                style={{
                  fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.18em',
                  textTransform: 'uppercase', color: 'var(--bone-faint)',
                  textDecoration: 'none', whiteSpace: 'nowrap',
                }}
              >
                {c.label}
              </Link>
            )}
          </Fragment>
        );
      })}
    </nav>
  );
}

export default Breadcrumbs;
