import { Hono } from 'hono';
import type { AppEnv } from '../index';

export const legacyPlanRoutes = new Hono<AppEnv>();

// ============================================
// GET LEGACY PLAN
// ============================================
legacyPlanRoutes.get('/', async (c) => {
  const userId = c.get('userId');

  // Get or create legacy plan
  let plan = await c.env.DB.prepare(
    'SELECT * FROM legacy_plans WHERE user_id = ?'
  ).bind(userId).first();

  if (!plan) {
    // Create new plan with default items from templates
    const planId = crypto.randomUUID();
    const shareToken = crypto.randomUUID();
    
    await c.env.DB.prepare(`
      INSERT INTO legacy_plans (id, user_id, share_token, created_at, updated_at)
      VALUES (?, ?, ?, datetime('now'), datetime('now'))
    `).bind(planId, userId, shareToken).run();

    // Copy template items to user's plan
    const templates = await c.env.DB.prepare(
      'SELECT * FROM legacy_plan_templates WHERE active = 1 ORDER BY category, sort_order'
    ).all();

    for (const template of templates.results || []) {
      const itemId = crypto.randomUUID();
      await c.env.DB.prepare(`
        INSERT INTO legacy_plan_items (id, user_id, category, title, description, sort_order, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
      `).bind(itemId, userId, template.category, template.title, template.description, template.sort_order).run();
    }

    plan = await c.env.DB.prepare(
      'SELECT * FROM legacy_plans WHERE user_id = ?'
    ).bind(userId).first();
  }

  // Get plan items
  const items = await c.env.DB.prepare(
    'SELECT * FROM legacy_plan_items WHERE user_id = ? ORDER BY category, sort_order'
  ).bind(userId).all();

  // Calculate progress
  const totalItems = items.results?.length || 0;
  const completedItems = items.results?.filter((i: Record<string, unknown>) => i.completed === 1).length || 0;
  const progressPercent = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

  // Group items by category
  const itemsByCategory: Record<string, unknown[]> = {};
  for (const item of items.results || []) {
    const category = item.category as string;
    if (!itemsByCategory[category]) {
      itemsByCategory[category] = [];
    }
    itemsByCategory[category].push(item);
  }

  return c.json({
    plan: {
      ...plan,
      totalItems,
      completedItems,
      progressPercent,
    },
    items: items.results || [],
    itemsByCategory,
  });
});

// ============================================
// UPDATE PLAN ITEM (COMPLETE/UNCOMPLETE)
// ============================================
legacyPlanRoutes.patch('/items/:itemId', async (c) => {
  const userId = c.get('userId');
  const itemId = c.req.param('itemId');
  const body = await c.req.json();

  // Verify item belongs to user
  const item = await c.env.DB.prepare(
    'SELECT * FROM legacy_plan_items WHERE id = ? AND user_id = ?'
  ).bind(itemId, userId).first();

  if (!item) {
    return c.json({ error: 'Item not found' }, 404);
  }

  // Update item
  const updates: string[] = [];
  const values: unknown[] = [];

  if (typeof body.completed !== 'undefined') {
    updates.push('completed = ?');
    values.push(body.completed ? 1 : 0);
    if (body.completed) {
      updates.push("completed_at = datetime('now')");
    } else {
      updates.push('completed_at = NULL');
    }
  }

  if (body.linked_type && body.linked_id) {
    updates.push('linked_type = ?');
    values.push(body.linked_type);
    updates.push('linked_id = ?');
    values.push(body.linked_id);
  }

  if (updates.length > 0) {
    updates.push("updated_at = datetime('now')");
    values.push(itemId, userId);
    
    await c.env.DB.prepare(`
      UPDATE legacy_plan_items SET ${updates.join(', ')} WHERE id = ? AND user_id = ?
    `).bind(...values).run();
  }

  // Get updated item
  const updatedItem = await c.env.DB.prepare(
    'SELECT * FROM legacy_plan_items WHERE id = ?'
  ).bind(itemId).first();

  return c.json({ item: updatedItem });
});

// ============================================
// ADD CUSTOM PLAN ITEM
// ============================================
legacyPlanRoutes.post('/items', async (c) => {
  const userId = c.get('userId');
  const body = await c.req.json();

  const { category, title, description } = body;

  if (!category || !title) {
    return c.json({ error: 'Category and title are required' }, 400);
  }

  const itemId = crypto.randomUUID();
  
  // Get max sort order for category
  const maxOrder = await c.env.DB.prepare(
    'SELECT MAX(sort_order) as max_order FROM legacy_plan_items WHERE user_id = ? AND category = ?'
  ).bind(userId, category).first();

  const sortOrder = ((maxOrder?.max_order as number) || 0) + 1;

  await c.env.DB.prepare(`
    INSERT INTO legacy_plan_items (id, user_id, category, title, description, sort_order, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
  `).bind(itemId, userId, category, title, description || null, sortOrder).run();

  const item = await c.env.DB.prepare(
    'SELECT * FROM legacy_plan_items WHERE id = ?'
  ).bind(itemId).first();

  return c.json({ item }, 201);
});

// ============================================
// DELETE PLAN ITEM
// ============================================
legacyPlanRoutes.delete('/items/:itemId', async (c) => {
  const userId = c.get('userId');
  const itemId = c.req.param('itemId');

  // Verify item belongs to user
  const item = await c.env.DB.prepare(
    'SELECT * FROM legacy_plan_items WHERE id = ? AND user_id = ?'
  ).bind(itemId, userId).first();

  if (!item) {
    return c.json({ error: 'Item not found' }, 404);
  }

  await c.env.DB.prepare(
    'DELETE FROM legacy_plan_items WHERE id = ? AND user_id = ?'
  ).bind(itemId, userId).run();

  return c.json({ success: true });
});

// ============================================
// GET SHAREABLE PROGRESS CARD (PUBLIC)
// ============================================
legacyPlanRoutes.get('/share/:token', async (c) => {
  const token = c.req.param('token');

  const plan = await c.env.DB.prepare(
    'SELECT lp.*, u.first_name FROM legacy_plans lp JOIN users u ON lp.user_id = u.id WHERE lp.share_token = ? AND lp.share_progress = 1'
  ).bind(token).first();

  if (!plan) {
    return c.json({ error: 'Plan not found or sharing disabled' }, 404);
  }

  // Get progress stats
  const items = await c.env.DB.prepare(
    'SELECT category, completed FROM legacy_plan_items WHERE user_id = ?'
  ).bind(plan.user_id).all();

  const totalItems = items.results?.length || 0;
  const completedItems = items.results?.filter((i: Record<string, unknown>) => i.completed === 1).length || 0;
  const progressPercent = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

  // Category progress
  const categoryProgress: Record<string, { total: number; completed: number }> = {};
  for (const item of items.results || []) {
    const cat = item.category as string;
    if (!categoryProgress[cat]) {
      categoryProgress[cat] = { total: 0, completed: 0 };
    }
    categoryProgress[cat].total++;
    if (item.completed === 1) {
      categoryProgress[cat].completed++;
    }
  }

  return c.json({
    firstName: plan.first_name,
    progressPercent,
    totalItems,
    completedItems,
    categoryProgress,
    createdAt: plan.created_at,
  });
});

// ============================================
// TOGGLE SHARE PROGRESS
// ============================================
legacyPlanRoutes.patch('/share', async (c) => {
  const userId = c.get('userId');
  const body = await c.req.json();

  await c.env.DB.prepare(`
    UPDATE legacy_plans SET share_progress = ?, updated_at = datetime('now') WHERE user_id = ?
  `).bind(body.shareProgress ? 1 : 0, userId).run();

  const plan = await c.env.DB.prepare(
    'SELECT share_token, share_progress FROM legacy_plans WHERE user_id = ?'
  ).bind(userId).first();

  return c.json({ 
    shareProgress: plan?.share_progress === 1,
    shareUrl: plan?.share_progress === 1 ? `/legacy-progress/${plan.share_token}` : null,
  });
});

export default legacyPlanRoutes;
