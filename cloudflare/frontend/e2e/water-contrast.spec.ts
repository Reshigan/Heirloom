import { test, expect } from '@playwright/test';

/**
 * The Deep is a two-sided constraint: the water must read as lit sea, and cream
 * type must stay legible on top of it. Those pull against each other, and the
 * only referee is the composited pixel — the shader and .deep-scrim each look
 * fine in isolation while the product is a black field or an unreadable one.
 *
 * So: hide the content layer, screenshot the backdrop exactly as it sits under
 * the type, and assert both sides at once.
 *
 * Both bounds were failed by real edits. The scrim once sat at 86% ink and the
 * sea measured rgb(6..20) everywhere (mean luminance 0.012) — that fails the
 * brightness floor. Brightening the shader's *surface* to fix it pushed the
 * topbar strip to 3.98:1 — that fails the contrast floor. Only the pair holds.
 */

const BONE = [0xf2, 0xe6, 0xd0] as const; // --bone, the app's type colour

const lin = (c: number) => {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
};
const luminance = ([r, g, b]: number[]) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
const contrast = (a: number[], b: readonly number[]) => {
  const [hi, lo] = [luminance(a), luminance([...b])].sort((m, n) => n - m);
  return (hi + 0.05) / (lo + 0.05);
};

// Fractions of the viewport, so this holds on mobile too. Every point is
// somewhere type actually lands: headline, reading column, topbar, BottomNav.
const POINTS = {
  headline: [0.5, 0.3],
  colLeft: [0.32, 0.5],
  colRight: [0.68, 0.5],
  marginLeft: [0.05, 0.5],
  marginRight: [0.95, 0.5],
  bottom: [0.5, 0.9],
  top: [0.5, 0.06],
} as const;

// WCAG AA for normal text. Deliberately not AAA (7:1): the shipped values clear
// AAA on a real GPU, but CI renders WebGL through SwiftShader and the dye seed
// varies per load. AA is the contract; anything below it is a genuine defect.
const MIN_CONTRAST = 4.5;
// The sea must stay visible. Measured over the whole frame, not the sample
// patches: the dye seed and plume placement vary per load, so a handful of 80px
// patches is a noisy estimate of "is the water lit" while the full frame is
// steady to ~3%. Runs on this viewport — the near-black field this test was
// written against: 0.0051, 0.0053. The lit one: 0.0083, 0.0086, 0.0088. The
// floor sits between the bands.
const MIN_FRAME_LUMINANCE = 0.0068;

test('the Deep stays bright enough to see and dark enough to read', async ({ page }) => {
  await page.goto('/');
  await page.waitForSelector('.loom canvas');
  await page.waitForTimeout(1200); // let the water settle onto a frame

  // .loom's first child is the fixed z0 backdrop (WaterCanvas + .deep-scrim);
  // its second is the content layer. Hiding the latter leaves precisely the
  // pixels that sit behind the type.
  await page.evaluate(() => {
    const content = document.querySelector('.loom')?.children[1] as HTMLElement | undefined;
    if (content) content.style.visibility = 'hidden';
    document.querySelector('#hl-splash')?.remove();
  });
  await page.waitForTimeout(400);

  const shot = (await page.screenshot()).toString('base64');

  // Decoding in-page avoids pulling in an image dependency for one assertion.
  const { samples, frameLuminance } = await page.evaluate(
    async ({ b64, points }) => {
      const img = new Image();
      img.src = 'data:image/png;base64,' + b64;
      await img.decode();
      const cv = document.createElement('canvas');
      cv.width = img.width;
      cv.height = img.height;
      const ctx = cv.getContext('2d')!;
      ctx.drawImage(img, 0, 0);

      const samples: Record<string, number[]> = {};
      for (const [name, [fx, fy]] of Object.entries(points)) {
        // Average a patch so one caustic highlight can't swing the reading.
        const x = Math.max(0, Math.min(img.width - 80, img.width * fx - 40));
        const y = Math.max(0, Math.min(img.height - 80, img.height * fy - 40));
        const d = ctx.getImageData(x, y, 80, 80).data;
        let r = 0, g = 0, b = 0;
        for (let i = 0; i < d.length; i += 4) { r += d[i]; g += d[i + 1]; b += d[i + 2]; }
        const n = d.length / 4;
        samples[name] = [r / n, g / n, b / n];
      }

      // Mean of per-pixel luminance, not luminance of the mean pixel — the sRGB
      // decode is nonlinear, so the two disagree and only the former answers
      // "how much light is in this frame".
      const lin = (c: number) => {
        const s = c / 255;
        return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
      };
      const all = ctx.getImageData(0, 0, img.width, img.height).data;
      let sum = 0;
      for (let i = 0; i < all.length; i += 4) {
        sum += 0.2126 * lin(all[i]) + 0.7152 * lin(all[i + 1]) + 0.0722 * lin(all[i + 2]);
      }
      return { samples, frameLuminance: sum / (all.length / 4) };
    },
    { b64: shot, points: POINTS as unknown as Record<string, number[]> },
  );

  for (const [name, rgb] of Object.entries(samples)) {
    expect(contrast(rgb, BONE), `bone-on-water contrast at ${name}`).toBeGreaterThanOrEqual(MIN_CONTRAST);
  }

  expect(
    frameLuminance,
    'whole-frame backdrop luminance — the water must read as lit sea',
  ).toBeGreaterThanOrEqual(MIN_FRAME_LUMINANCE);
});
