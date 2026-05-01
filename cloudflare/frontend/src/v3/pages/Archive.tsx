import { useEffect, useState } from 'react';
import { archiveApi, type ArchiveAudit } from '../../services/api';
import { Surface, Column } from '../components/Surface';
import { AppShell } from '../components/AppShell';
import { Eyebrow, Display, Body, ReadingBody, Caption, Rule } from '../components/Type';

export function Archive() {
  const [data, setData] = useState<ArchiveAudit | null>(null);
  useEffect(() => {
    archiveApi.audit().then((r) => setData(r.data)).catch(() => undefined);
  }, []);

  return (
    <Surface>
      <AppShell>
        <header className="border-b border-edge">
          <Column width="header" className="py-14">
            <Eyebrow className="mb-5">Continuity audit</Eyebrow>
            <Display size={2}>Operating in the open.</Display>
            <Body className="mt-6 max-w-[60ch] text-char">
              Every thread is mirrored to public IPFS providers on a weekly schedule. The numbers
              below are pulled live; the page is public; the proof is meant to be checkable, not
              taken on trust.
            </Body>
          </Column>
        </header>
        <Column width="reading" className="py-14">
          {data ? (
            <>
              <section>
                <Eyebrow className="mb-3">As of {new Date(data.audit_generated_at).toLocaleString()}</Eyebrow>
                <Rule className="mb-7" />
                <dl className="grid sm:grid-cols-2 gap-y-7 gap-x-12">
                  {[
                    [data.summary.total_pins.toLocaleString(), 'pins on IPFS'],
                    [data.summary.threads_pinned.toLocaleString(), 'threads pinned'],
                    [data.summary.total_entries_archived.toLocaleString(), 'entries archived'],
                    [`${(data.summary.total_bytes_pinned / 1e9).toFixed(2)} GB`, 'data archived'],
                  ].map(([n, l]) => (
                    <div key={l} className="border-l border-edge pl-4">
                      <dt className="font-news text-[2.25rem] leading-[1] text-ink">{n}</dt>
                      <dd className="mt-1 font-v3mono text-[0.7rem] tracking-[0.28em] uppercase text-char">{l}</dd>
                    </div>
                  ))}
                </dl>
              </section>

              <Rule className="my-12" />

              <section>
                <Eyebrow className="mb-3">Providers</Eyebrow>
                <ul className="divide-y divide-edge">
                  {data.providers.length === 0 ? (
                    <li className="py-4"><Caption>No providers reported pins yet.</Caption></li>
                  ) : data.providers.map((p) => (
                    <li key={p.provider} className="py-4 grid grid-cols-[1fr_auto_auto] gap-6 items-baseline">
                      <span className="font-news text-[1.0625rem]">{p.provider}</span>
                      <Caption className="not-italic font-v3mono text-[0.7rem] tracking-[0.18em] uppercase text-char">{p.pins} pins</Caption>
                      <Caption className="not-italic font-v3mono text-[0.7rem] tracking-[0.18em] uppercase text-char">last {p.most_recent ?? '—'}</Caption>
                    </li>
                  ))}
                </ul>
              </section>

              <Rule className="my-12" />

              <ReadingBody className="italic text-char">{data.commitment}</ReadingBody>
            </>
          ) : (
            <Caption>Loading the audit…</Caption>
          )}
        </Column>
      </AppShell>
    </Surface>
  );
}
