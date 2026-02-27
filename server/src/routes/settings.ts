import { Router } from 'express';
import crypto from 'crypto';
import db from '../db/database';
import { requirePin } from '../middleware/requirePin';
import { z } from 'zod';

const router = Router();

const thresholdSchema = z.object({
  stars: z.number().int().min(1),
  amount: z.number().min(0),
});

const pinChangeSchema = z.object({
  current_pin: z.string().length(4),
  new_pin: z.string().length(4),
});

// Get reward threshold (public)
router.get('/reward-threshold', (_req, res) => {
  const stars = db.prepare("SELECT value FROM settings WHERE key = 'reward_threshold_stars'").get() as { value: string };
  const amount = db.prepare("SELECT value FROM settings WHERE key = 'reward_threshold_amount'").get() as { value: string };

  res.json({
    stars: parseInt(stars.value),
    amount: parseFloat(amount.value),
  });
});

// Update reward threshold
router.put('/reward-threshold', requirePin, (req, res) => {
  const result = thresholdSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ error: result.error.flatten() });
    return;
  }

  const { stars, amount } = result.data;
  db.prepare("UPDATE settings SET value = ? WHERE key = 'reward_threshold_stars'").run(stars.toString());
  db.prepare("UPDATE settings SET value = ? WHERE key = 'reward_threshold_amount'").run(amount.toFixed(2));

  res.json({ stars, amount });
});

// Change PIN
router.put('/pin', requirePin, (req, res) => {
  const result = pinChangeSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ error: result.error.flatten() });
    return;
  }

  const { current_pin, new_pin } = result.data;

  // Verify current PIN
  const currentHash = crypto.createHash('sha256').update(current_pin).digest('hex');
  const stored = db.prepare("SELECT value FROM settings WHERE key = 'pin_hash'").get() as { value: string };

  if (currentHash !== stored.value) {
    res.status(401).json({ error: 'Current PIN is incorrect' });
    return;
  }

  const newHash = crypto.createHash('sha256').update(new_pin).digest('hex');
  db.prepare("UPDATE settings SET value = ? WHERE key = 'pin_hash'").run(newHash);

  res.json({ success: true });
});

export default router;
