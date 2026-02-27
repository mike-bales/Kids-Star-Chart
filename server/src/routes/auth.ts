import { Router } from 'express';
import crypto from 'crypto';
import db from '../db/database';

const router = Router();

router.post('/verify', (req, res) => {
  const { pin } = req.body;

  if (!pin || typeof pin !== 'string') {
    res.status(400).json({ error: 'PIN is required' });
    return;
  }

  const pinHash = crypto.createHash('sha256').update(pin).digest('hex');
  const stored = db.prepare('SELECT value FROM settings WHERE key = ?').get('pin_hash') as { value: string } | undefined;

  if (stored && pinHash === stored.value) {
    res.json({ valid: true });
  } else {
    res.status(401).json({ valid: false, error: 'Invalid PIN' });
  }
});

export default router;
