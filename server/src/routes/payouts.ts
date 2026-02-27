import { Router } from 'express';
import db from '../db/database';
import { requirePin } from '../middleware/requirePin';
import { z } from 'zod';

const router = Router();

const payoutSchema = z.object({
  stars_spent: z.number().int().min(1),
  amount: z.number().min(0),
  note: z.string().max(200).optional(),
});

// Get payout history for a child
router.get('/:childId/payouts', requirePin, (req, res) => {
  const payouts = db.prepare(
    'SELECT * FROM payouts WHERE child_id = ? ORDER BY created_at DESC'
  ).all(req.params.childId);

  res.json(payouts);
});

// Record a payout
router.post('/:childId/payouts', requirePin, (req, res) => {
  const result = payoutSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ error: result.error.flatten() });
    return;
  }

  // Verify child exists
  const child = db.prepare(
    'SELECT id FROM children WHERE id = ? AND deleted_at IS NULL'
  ).get(req.params.childId);

  if (!child) {
    res.status(404).json({ error: 'Child not found' });
    return;
  }

  const { stars_spent, amount, note } = result.data;
  const stmt = db.prepare(
    'INSERT INTO payouts (child_id, stars_spent, amount, note) VALUES (?, ?, ?, ?)'
  );
  const info = stmt.run(req.params.childId, stars_spent, amount, note || null);

  const payout = db.prepare('SELECT * FROM payouts WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json(payout);
});

export default router;
