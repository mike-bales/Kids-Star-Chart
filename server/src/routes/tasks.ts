import { Router } from 'express';
import db from '../db/database';
import { requirePin } from '../middleware/requirePin';
import { z } from 'zod';

const router = Router();

const taskSchema = z.object({
  name: z.string().min(1).max(100),
  star_value: z.number().int().min(1).max(100),
  icon: z.string().optional(),
  sort_order: z.number().int().optional(),
});

// List active tasks
router.get('/', (_req, res) => {
  const tasks = db.prepare(
    'SELECT * FROM tasks WHERE deleted_at IS NULL ORDER BY sort_order ASC, created_at ASC'
  ).all();

  res.json(tasks);
});

// Create task
router.post('/', requirePin, (req, res) => {
  const result = taskSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ error: result.error.flatten() });
    return;
  }

  const { name, star_value, icon, sort_order } = result.data;
  const stmt = db.prepare(
    'INSERT INTO tasks (name, star_value, icon, sort_order) VALUES (?, ?, ?, ?)'
  );
  const info = stmt.run(name, star_value, icon || null, sort_order || 0);

  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json(task);
});

// Update task
router.put('/:id', requirePin, (req, res) => {
  const result = taskSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ error: result.error.flatten() });
    return;
  }

  const { name, star_value, icon, sort_order } = result.data;
  const stmt = db.prepare(
    'UPDATE tasks SET name = ?, star_value = ?, icon = ?, sort_order = ? WHERE id = ? AND deleted_at IS NULL'
  );
  const info = stmt.run(name, star_value, icon || null, sort_order || 0, req.params.id);

  if (info.changes === 0) {
    res.status(404).json({ error: 'Task not found' });
    return;
  }

  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id);
  res.json(task);
});

// Soft-delete task
router.delete('/:id', requirePin, (req, res) => {
  const stmt = db.prepare(
    "UPDATE tasks SET deleted_at = datetime('now') WHERE id = ? AND deleted_at IS NULL"
  );
  const info = stmt.run(req.params.id);

  if (info.changes === 0) {
    res.status(404).json({ error: 'Task not found' });
    return;
  }

  res.json({ success: true });
});

export default router;
