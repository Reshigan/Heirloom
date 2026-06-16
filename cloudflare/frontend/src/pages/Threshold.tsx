import { Link, Navigate } from 'react-router-dom';
import { ClothShell } from '../loom/components/ClothShell';
import { HLogo } from '../loom/components/HLogo';
import { SpineThread, type SpineEntry } from '../loom/components/SpineThread';
import { useAuthStore } from '../stores/authStore';

/**
 * Screen 01 — The Threshold
 *
 * The anonymous arrival. The Thousand-Year Spine stands as the page: a demo
 * bloodline's thread descending from the present into the ancestral deep, the
 * thesis set at its crown. We do not ask for an account or a name; the spine
 * is the pitch — a thread that outlives the people on it — and "start your
 * thread" is the one door.
 */

// A demo bloodline — the thousand-year thread made visible to a first arrival.
const DEMO_THREAD: SpineEntry[] = [
  { title: 'The crossing', year: 1921, dye: 'walnut' },
  { title: 'A wedding in the rain', year: 1949, dye: 'madder' },
  { title: 'The house on Mercer Street', year: 1963, dye: 'indigo' },
  { title: 'Her first word', year: 1981, dye: 'saffron' },
  { title: 'The recipe, finally written down', year: 1998, dye: 'weld' },
  { title: 'A letter for your thirtieth', year: 2014, dye: 'cochineal', sealed: true },
  { title: 'The morning everything changed', year: 2024, dye: 'woad' },
];

export function Threshold() {
  const { isAuthenticated } = useAuthStore();

  // `/loom` is wired as "home" across the whole app — breadcrumbs, back-links,
  // post-login, post-join, post-purchase. This screen is the anonymous brand
  // splash showing a demo family's thread, not the visitor's own. Forward a
  // signed-in visitor to their real home so every one of those links lands
  // correctly from this single guard. Anonymous visitors keep the splash.
  if (isAuthenticated) return <Navigate to="/loom/pwa" replace />;

  return (
    <ClothShell
      topbarLeft={<HLogo size="sm" wordmark />}
      topbarRight={
        <Link
          to="/login"
          style={{
            fontFamily: 'var(--mono)',
            fontSize: 10,
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            color: 'var(--warm)',
            textDecoration: 'none',
          }}
        >
          enter →
        </Link>
      }
    >
      <SpineThread
        entries={DEMO_THREAD}
        headline={<>Start your family&rsquo;s<br />thousand-year thread.</>}
        tagline="A perpetual archive owned by a bloodline."
        presentYear={2026}
        addLabel="start your thread"
        addRoute="/signup"
      />
    </ClothShell>
  );
}
