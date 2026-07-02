import { useEffect } from 'react';

const BASE = 'Heirloom';

/**
 * Set the browser tab title and meta description for the current page.
 * Appends " — Heirloom" unless the title already contains it.
 */
export function usePageMeta(title: string, description?: string): void {
  useEffect(() => {
    const full = title.includes(BASE) ? title : `${title} — ${BASE}`;
    document.title = full;

    if (description) {
      let el = document.querySelector<HTMLMetaElement>('meta[name="description"]');
      if (!el) {
        el = document.createElement('meta');
        el.name = 'description';
        document.head.appendChild(el);
      }
      el.content = description;
    }

    return () => {
      document.title = `${BASE} — some things only get deeper`;
    };
  }, [title, description]);
}
