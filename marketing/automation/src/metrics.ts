// Performance feedback loop.
//
// Pulls engagement metrics back from Ayrshare and writes them to
// marketing/automation/output/metrics.jsonl. The next generation pass can
// read this file to learn which hooks worked.
//
// In MOCK mode this returns an empty pull and is safe to call.

import fs from "node:fs/promises";
import path from "node:path";

const AYRSHARE_KEY = process.env.AYRSHARE_API_KEY;
const DRY_RUN = process.env.DRY_RUN === "1" || !AYRSHARE_KEY;

export interface PostMetric {
  postId: string;
  platform: string;
  impressions?: number;
  engagements?: number;
  saves?: number;
  shares?: number;
  comments?: number;
  retrievedAt: string;
}

export async function pullMetrics(postIds: string[]): Promise<PostMetric[]> {
  if (DRY_RUN) return [];

  const all: PostMetric[] = [];
  for (const id of postIds) {
    const res = await fetch(`https://app.ayrshare.com/api/analytics/post?id=${id}`, {
      headers: { Authorization: `Bearer ${AYRSHARE_KEY}` },
    });
    if (!res.ok) continue;
    const data = (await res.json()) as { posts?: Record<string, unknown>[] };
    for (const p of data.posts ?? []) {
      all.push({
        postId: id,
        platform: String(p.platform ?? "unknown"),
        impressions: typeof p.impressions === "number" ? p.impressions : undefined,
        engagements: typeof p.engagements === "number" ? p.engagements : undefined,
        saves: typeof p.saves === "number" ? p.saves : undefined,
        shares: typeof p.shares === "number" ? p.shares : undefined,
        comments: typeof p.comments === "number" ? p.comments : undefined,
        retrievedAt: new Date().toISOString(),
      });
    }
  }

  await persist(all);
  return all;
}

async function persist(metrics: PostMetric[]): Promise<void> {
  const file = path.resolve(process.cwd(), "output", "metrics.jsonl");
  await fs.mkdir(path.dirname(file), { recursive: true });
  const lines = metrics.map((m) => JSON.stringify(m)).join("\n");
  if (lines) await fs.appendFile(file, lines + "\n", "utf-8");
}

export async function topHooks(limit = 10): Promise<string[]> {
  // Placeholder: in production, join metrics back to source posts via postId
  // and return the top-engaging hooks for negative-prompting in generate.ts.
  // For now this returns empty to keep the loop functional.
  return [];
}
