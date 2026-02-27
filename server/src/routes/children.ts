import { Router } from 'express';
import db from '../db/database';
import { requirePin } from '../middleware/requirePin';
import { z } from 'zod';

const router = Router();

const childSchema = z.object({
  name: z.string().min(1).max(50),
  color: z.string().optional(),
  avatar_url: z.string().optional(),
  homework_tracking: z.number().int().min(0).max(1).optional(),
  homework_required: z.number().int().min(1).max(5).optional(),
  homework_total_days: z.number().int().min(1).max(5).optional(),
});

// List active children with star totals
router.get('/', (_req, res) => {
  const children = db.prepare(`
    SELECT c.*,
      COALESCE((
        SELECT SUM(sl.stars) FROM star_logs sl
        WHERE sl.child_id = c.id AND sl.undone_at IS NULL
      ), 0) as total_stars,
      COALESCE((
        SELECT SUM(p.stars_spent) FROM payouts p WHERE p.child_id = c.id
      ), 0) as total_paid_stars
    FROM children c
    WHERE c.deleted_at IS NULL
    ORDER BY c.created_at ASC
  `).all();

  res.json(children);
});

// Create child
router.post('/', requirePin, (req, res) => {
  const result = childSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ error: result.error.flatten() });
    return;
  }

  const { name, color, avatar_url, homework_tracking, homework_required, homework_total_days } = result.data;
  const stmt = db.prepare(
    'INSERT INTO children (name, color, avatar_url, homework_tracking, homework_required, homework_total_days) VALUES (?, ?, ?, ?, ?, ?)'
  );
  const info = stmt.run(name, color || '#FFD700', avatar_url || null, homework_tracking || 0, homework_required || 4, homework_total_days || 5);

  const child = db.prepare('SELECT * FROM children WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json(child);
});

// Update child
router.put('/:id', requirePin, (req, res) => {
  const result = childSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ error: result.error.flatten() });
    return;
  }

  const { name, color, avatar_url, homework_tracking, homework_required, homework_total_days } = result.data;
  const stmt = db.prepare(
    'UPDATE children SET name = ?, color = ?, avatar_url = ?, homework_tracking = ?, homework_required = ?, homework_total_days = ? WHERE id = ? AND deleted_at IS NULL'
  );
  const info = stmt.run(name, color || '#FFD700', avatar_url || null, homework_tracking ?? 0, homework_required ?? 4, homework_total_days ?? 5, req.params.id);

  if (info.changes === 0) {
    res.status(404).json({ error: 'Child not found' });
    return;
  }

  const child = db.prepare('SELECT * FROM children WHERE id = ?').get(req.params.id);
  res.json(child);
});

// Soft-delete child
router.delete('/:id', requirePin, (req, res) => {
  const stmt = db.prepare(
    "UPDATE children SET deleted_at = datetime('now') WHERE id = ? AND deleted_at IS NULL"
  );
  const info = stmt.run(req.params.id);

  if (info.changes === 0) {
    res.status(404).json({ error: 'Child not found' });
    return;
  }

  res.json({ success: true });
});

export default router;
