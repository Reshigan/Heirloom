import { Link, useLocation } from 'react-router-dom';
import { Surface, Column } from '../components/Surface';
import { AppShell } from '../components/AppShell';
import { Eyebrow, Display, Body } from '../components/Type';

/**
 * Placeholder for v3 surfaces that are routed but not yet prototyped.
 * Used during the multi-phase v3 rollout. Replace each route's element
 * with the real page as it ships.
 */
export function ComingSoon({ title }: { title?: string }) {
  const { pathname } = useLocation();
  return (
    <Surface>
      <AppShell>
        <Column width="header" className="py-24 md:py-32">
          <Eyebrow className="mb-6">In progress · {pathname}</Eyebrow>
          <Display size={2} className="mb-7">{title ?? 'This surface is in the next batch.'}</Display>
          <Body className="text-char max-w-[60ch]">
            The v3 redesign ships in three phases. Marketing surfaces are live; reading and writing
            surfaces follow. The route is reserved so the navigation reads correctly while the
            design lands. See{' '}
            <Link to="/v3/sitemap" className="text-mark underline underline-offset-[3px] decoration-1 decoration-mark/40 hover:decoration-mark">
              the sitemap
            </Link>{' '}
            for the full set.
          </Body>
        </Column>
      </AppShell>
    </Surface>
  );
}
