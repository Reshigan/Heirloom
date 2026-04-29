// SEO content moat generator.
//
// Per PLAYBOOK §3 Loop C: programmatic "questions to ask [relation]" landing
// pages. This is Promptly Journals' moat — they rank for thousands of these
// long-tail queries.
//
// We generate the page CATALOG (relation × occasion × angle) in pure JS, then
// fill the question lists via Claude. Output is static HTML files in
// marketing/automation/seo-output/, suitable for deployment to a subdomain
// (e.g. questions.heirloom.blue) via Cloudflare Pages or Vercel.
//
// One-shot generation (run once, then incremental updates). Not part of the
// daily cron.

import "dotenv/config";
import fs from "node:fs/promises";
import path from "node:path";
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { BRAND_VOICE_SYSTEM_PROMPT } from "./voice.js";

// Sonnet 4.6 default — more than enough quality for SEO landing pages,
// at ~$0.005/page generated.
const MODEL = process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-6";
const OUT_DIR = path.resolve(process.cwd(), "seo-output");

const RELATIONS = [
  "mom", "dad", "grandma", "grandpa", "mother", "father",
  "grandmother", "grandfather", "parents", "grandparents",
  "aunt", "uncle", "older sibling",
];

const OCCASIONS = [
  null, // generic "before it's too late"
  "before they pass",
  "before they forget",
  "for Mother's Day",
  "for Father's Day",
  "for Grandparents Day",
  "for Christmas",
  "for their birthday",
  "after a diagnosis",
];

const ANGLES = [
  null, // generic
  "about their childhood",
  "about love and marriage",
  "about their parents",
  "about regret",
  "about work",
  "about money",
  "about faith",
];

const pageSchema = z.object({
  title: z.string(),
  slug: z.string(),
  metaDescription: z.string().min(80).max(170),
  intro: z.string().min(100).max(600),
  questions: z.array(z.string().min(15).max(200)).min(30).max(80),
  outro: z.string().min(60).max(400),
});

export type SeoPage = z.infer<typeof pageSchema>;

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

interface PageInput {
  relation: string;
  occasion: string | null;
  angle: string | null;
}

function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function inputToTitle({ relation, occasion, angle }: PageInput): string {
  const base = `Questions to ask your ${relation}`;
  const parts = [base];
  if (angle) parts.push(angle);
  if (occasion) parts.push(occasion);
  return parts.join(" ");
}

async function generatePage(input: PageInput): Promise<SeoPage> {
  const title = inputToTitle(input);
  const slug = slugify(title);

  const userPrompt = `Generate a long-tail SEO landing page for the query: "${title}"

Output strict JSON, no prose, no markdown fences:

{
  "title": "${title}",
  "slug": "${slug}",
  "metaDescription": "150-character meta description, must include the relation word and 'questions'",
  "intro": "200-400 words. A warm, specific opener. Don't be motivational — be specific. Reference real loss (recipes with no card, voices on old tapes). Set up why these questions matter. Mention the conversation, not legacy or generations. End with a soft transition into the list.",
  "questions": [
    "30-60 questions, each one specific, open, and answerable in 1-3 minutes. Mix childhood/work/love/loss/regret/joy. Avoid yes/no questions. Avoid 'what's your favorite' generic. Examples of good ones: 'What did your kitchen smell like growing up?' / 'Who is the person you wish you'd called more often?' / 'What did you wear to your first job?' / 'What's a song that always brings you back to a specific place?'"
  ],
  "outro": "100-300 words. A small CTA at the end. Suggest recording the answers (voice or written) and saving them somewhere they'll last. Mention Heirloom by name once — soft. Don't be salesy."
}

JSON only.`;

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 4000,
    system: [
      {
        type: "text",
        text: BRAND_VOICE_SYSTEM_PROMPT,
        cache_control: { type: "ephemeral" },
      },
    ],
    messages: [{ role: "user", content: userPrompt }],
  });

  const block = response.content.find((c) => c.type === "text");
  if (!block || block.type !== "text") throw new Error("no text in response");
  const raw = block.text.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
  return pageSchema.parse(JSON.parse(raw));
}

function renderHTML(page: SeoPage): string {
  const questionsList = page.questions.map((q, i) => `    <li><strong>${i + 1}.</strong> ${escapeHtml(q)}</li>`).join("\n");
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(page.title)} — Heirloom</title>
  <meta name="description" content="${escapeHtml(page.metaDescription)}">
  <link rel="canonical" href="https://questions.heirloom.blue/${page.slug}">
  <meta property="og:title" content="${escapeHtml(page.title)}">
  <meta property="og:description" content="${escapeHtml(page.metaDescription)}">
  <meta property="og:type" content="article">
  <script type="application/ld+json">${JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Article",
    headline: page.title,
    description: page.metaDescription,
    author: { "@type": "Organization", name: "Heirloom" },
  })}</script>
  <link rel="stylesheet" href="/styles.css">
</head>
<body>
  <main class="prose">
    <h1>${escapeHtml(page.title)}</h1>
    <div class="intro">${paragraphs(page.intro)}</div>
    <ol class="questions">
${questionsList}
    </ol>
    <div class="outro">${paragraphs(page.outro)}</div>
    <a href="https://heirloom.blue/signup?ref=seo&slug=${page.slug}" class="cta">Save these answers in Heirloom — free, no card</a>
  </main>
</body>
</html>`;
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function paragraphs(s: string): string {
  return s.split(/\n\n+/).map((p) => `<p>${escapeHtml(p.trim())}</p>`).join("\n");
}

async function buildIndex(pages: SeoPage[]): Promise<string> {
  const items = pages.map((p) => `  <li><a href="/${p.slug}">${escapeHtml(p.title)}</a></li>`).join("\n");
  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><title>Questions to ask — Heirloom</title></head>
<body><main><h1>Questions worth asking</h1><ul>
${items}
</ul></main></body></html>`;
}

function buildSitemap(pages: SeoPage[]): string {
  const urls = pages.map((p) => `  <url><loc>https://questions.heirloom.blue/${p.slug}</loc></url>`).join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;
}

function pickInputs(limit: number): PageInput[] {
  const all: PageInput[] = [];
  for (const r of RELATIONS) {
    for (const o of OCCASIONS) {
      for (const a of ANGLES) {
        all.push({ relation: r, occasion: o, angle: a });
      }
    }
  }
  return all.slice(0, limit);
}

async function main(): Promise<void> {
  const limit = Number(process.env.SEO_PAGE_LIMIT ?? "20");
  const concurrency = Number(process.env.SEO_CONCURRENCY ?? "4");
  const inputs = pickInputs(limit);

  console.log(`[seo] generating ${inputs.length} pages (concurrency=${concurrency})…`);
  await fs.mkdir(OUT_DIR, { recursive: true });

  const pages: SeoPage[] = [];
  for (let i = 0; i < inputs.length; i += concurrency) {
    const batch = inputs.slice(i, i + concurrency);
    const batchResults = await Promise.allSettled(batch.map((b) => generatePage(b)));
    for (const r of batchResults) {
      if (r.status === "fulfilled") {
        pages.push(r.value);
        await fs.writeFile(path.join(OUT_DIR, `${r.value.slug}.html`), renderHTML(r.value), "utf-8");
        await fs.writeFile(path.join(OUT_DIR, `${r.value.slug}.json`), JSON.stringify(r.value, null, 2), "utf-8");
        console.log(`[seo] wrote ${r.value.slug}`);
      } else {
        console.error(`[seo] failed:`, r.reason instanceof Error ? r.reason.message : r.reason);
      }
    }
  }

  await fs.writeFile(path.join(OUT_DIR, "index.html"), await buildIndex(pages), "utf-8");
  await fs.writeFile(path.join(OUT_DIR, "sitemap.xml"), buildSitemap(pages), "utf-8");
  console.log(`[seo] done. ${pages.length} pages written to ${OUT_DIR}`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
