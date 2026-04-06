/**
 * Social Posting Cron Handler
 * Processes due social posts from D1 and publishes via Postiz API
 * Runs every 5 minutes via existing cron trigger
 */

import type { Env } from '../index';

interface PostizPost {
  content: string;
  platforms: string[];
  mediaUrls?: string[];
  scheduledAt?: string;
}

/**
 * Process the social posting queue.
 * Fetches posts that are due (status=scheduled, scheduled_at <= now),
 * sends them to Postiz API, and updates their status.
 */
export async function processSocialQueue(env: Env): Promise<{ processed: number; published: number; failed: number }> {
  const now = new Date().toISOString();
  let processed = 0;
  let published = 0;
  let failed = 0;

  // Check if Postiz is configured
  if (!env.POSTIZ_URL || !env.POSTIZ_API_KEY) {
    // Postiz not configured yet — skip silently
    return { processed: 0, published: 0, failed: 0 };
  }

  // Fetch posts that are due for publishing
  const duePosts = await env.DB.prepare(`
    SELECT * FROM social_posts
    WHERE status = 'scheduled' AND scheduled_at <= ?
    ORDER BY scheduled_at ASC LIMIT 3
  `).bind(now).all();

  for (const post of duePosts.results) {
    processed++;
    const content = JSON.parse(post.content as string);
    const platforms = JSON.parse(post.platforms as string);

    try {
      // Mark as publishing
      await env.DB.prepare(`
        UPDATE social_posts SET status = 'publishing', updated_at = ? WHERE id = ?
      `).bind(now, post.id).run();

      // Build video URL from R2 key if present
      let videoUrl: string | undefined;
      if (content.videoKey) {
        videoUrl = `${env.APP_URL}/api/social-assets/${content.videoKey}`;
      }

      // Call Postiz API to create and publish
      const response = await fetch(`${env.POSTIZ_URL}/api/posts`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${env.POSTIZ_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: content.text,
          platforms: platforms,
          media: videoUrl ? [{ url: videoUrl }] : undefined,
          publishAt: now, // publish immediately (already past scheduled time)
        } as PostizPost),
      });

      const result = await response.json();

      if (response.ok) {
        await env.DB.prepare(`
          UPDATE social_posts SET status = 'published', published_at = ?, api_response = ?, updated_at = ?
          WHERE id = ?
        `).bind(now, JSON.stringify(result), now, post.id).run();
        published++;
      } else {
        const retryCount = (post.retry_count as number) || 0;
        const newStatus = retryCount >= 2 ? 'failed' : 'scheduled';
        await env.DB.prepare(`
          UPDATE social_posts SET status = ?, error = ?, retry_count = ?, updated_at = ?
          WHERE id = ?
        `).bind(newStatus, JSON.stringify(result), retryCount + 1, now, post.id).run();
        failed++;
      }
    } catch (error: any) {
      const retryCount = (post.retry_count as number) || 0;
      const newStatus = retryCount >= 2 ? 'failed' : 'scheduled';
      await env.DB.prepare(`
        UPDATE social_posts SET status = ?, error = ?, retry_count = ?, updated_at = ?
        WHERE id = ?
      `).bind(newStatus, String(error.message || error), retryCount + 1, now, post.id).run();
      failed++;
    }
  }

  return { processed, published, failed };
}
