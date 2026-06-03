import type { Env } from '../index';
import { sendEmail } from '../utils/email';
import { giftSubscriptionPurchaseEmail, giftSubscriptionReceivedEmail } from '../email-templates';

export async function processScheduledGifts(env: Env): Promise<{ delivered: number; errors: number }> {
  const now = new Date().toISOString();
  const due = await env.DB.prepare(
    `SELECT * FROM gift_subscriptions WHERE status = 'pending' AND scheduled_delivery_date IS NOT NULL AND scheduled_delivery_date <= ? LIMIT 50`
  ).bind(now).all();

  let delivered = 0;
  let errors = 0;

  for (const gift of due.results as any[]) {
    try {
      const redeemUrl = `https://heirloom.blue/gift/redeem?code=${gift.gift_code}`;

      // Email recipient
      const period: 'monthly' | 'annual' = gift.duration_months === 1 ? 'monthly' : 'annual';
      const recipientEmail = giftSubscriptionReceivedEmail(
        gift.recipient_name, gift.purchaser_name, gift.tier, period, gift.gift_code, redeemUrl, gift.personal_message
      );
      await sendEmail(env, { from: 'Heirloom <noreply@heirloom.blue>', to: gift.recipient_email, subject: recipientEmail.subject, html: recipientEmail.html }, 'GIFT_SUBSCRIPTION_DELIVERY');

      // Email purchaser (confirmation)
      const purchaserEmail = giftSubscriptionPurchaseEmail(
        gift.purchaser_name, gift.recipient_name, gift.recipient_email, gift.tier,
        (gift.amount_paid / 100), period, gift.gift_code, gift.personal_message
      );
      await sendEmail(env, { from: 'Heirloom <noreply@heirloom.blue>', to: gift.purchaser_email, subject: purchaserEmail.subject, html: purchaserEmail.html }, 'GIFT_SUBSCRIPTION_PURCHASE_CONFIRM');

      await env.DB.prepare(
        `UPDATE gift_subscriptions SET status = 'delivered', delivered_at = ? WHERE id = ?`
      ).bind(now, gift.id).run();

      delivered++;
    } catch (err) {
      errors++;
      console.error(`Failed to deliver scheduled gift ${gift.id}:`, err);
    }
  }
  return { delivered, errors };
}
