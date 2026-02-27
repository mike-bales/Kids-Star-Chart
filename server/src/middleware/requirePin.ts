import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import db from '../db/database';

export function requirePin(req: Request, res: Response, next: NextFunction): void {
  const pin = req.headers['x-parent-pin'] as string | undefined;

  if (!pin) {
    res.status(401).json({ error: 'PIN required' });
    return;
  }

  const pinHash = crypto.createHash('sha256').update(pin).digest('hex');
  const stored = db.prepare('SELECT value FROM settings WHERE key = ?').get('pin_hash') as { value: string } | undefined;

  if (!stored || pinHash !== stored.value) {
    res.status(401).json({ error: 'Invalid PIN' });
    return;
  }

  next();
}
