import { Router } from 'express';
import db from '../db/database';
import { z } from 'zod';

const router = Router();

const statusSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  status: z.enum(['done', 'not_done', 'day_off', 'pending']),
});

// Get homework for a week (given any date in that week)
// Returns Mon-Fri for the week containing the given date
router.get('/:childId/homework', (req, res) => {
  const { week } = req.query; // YYYY-MM-DD, any day in the target week
  const refDate = week ? new Date(week as string) : new Date();

  // Find Monday of the week
  const day = refDate.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(refDate);
  monday.setDate(monday.getDate() + diffToMonday);

  const dates: string[] = [];
  for (let i = 0; i < 5; i++) {
    const d = new Date(monday);
    d.setDate(d.getDate() + i);
    dates.push(d.toISOString().slice(0, 10));
  }

  const fridayStr = dates[4];

  // Get existing logs for this week
  const logs = db.prepare(`
    SELECT date, status FROM homework_logs
    WHERE child_id = ? AND date >= ? AND date <= ?
  `).all(req.params.childId, dates[0], fridayStr) as { date: string; status: string }[];

  const logMap = new Map(logs.map(l => [l.date, l.status]));

  // Get child's homework settings
  const child = db.prepare(
    'SELECT homework_tracking, homework_required, homework_total_days FROM children WHERE id = ?'
  ).get(req.params.childId) as { homework_tracking: number; homework_required: number; homework_total_days: number } | undefined;

  if (!child) {
    res.status(404).json({ error: 'Child not found' });
    return;
  }

  const today = new Date().toISOString().slice(0, 10);

  // Build the week view
  const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const week_days = dates.map((date, i) => {
    let status = logMap.get(date) || 'pending';

    // Auto-mark past days without a log as not_done
    if (status === 'pending' && date < today) {
      status = 'not_done';
      // Persist the auto-mark
      db.prepare(
        'INSERT OR IGNORE INTO homework_logs (child_id, date, status) VALUES (?, ?, ?)'
      ).run(req.params.childId, date, 'not_done');
    }

    return {
      date,
      day_name: dayNames[i],
      status,
      is_today: date === today,
      is_past: date < today,
      is_future: date > today,
    };
  });

  // Calculate if screen time is earned
  const schoolDays = week_days.filter(d => d.status !== 'day_off');
  const daysOff = week_days.filter(d => d.status === 'day_off').length;
  const totalSchoolDays = 5 - daysOff;
  const doneCount = week_days.filter(d => d.status === 'done').length;

  // If shortened week, all days required. Otherwise use the configured required count.
  const required = totalSchoolDays < child.homework_total_days
    ? totalSchoolDays
    : child.homework_required;

  const pendingDays = week_days.filter(d => d.status === 'pending').length;
  const notDoneCount = week_days.filter(d => d.status === 'not_done').length;

  // Can they still earn it?
  const maxPossible = doneCount + pendingDays;
  const earned = doneCount >= required;
  const stillPossible = maxPossible >= required;
  const lost = !earned && !stillPossible;

  res.json({
    week_start: dates[0],
    week_end: fridayStr,
    days: week_days,
    summary: {
      done: doneCount,
      not_done: notDoneCount,
      day_off: daysOff,
      pending: pendingDays,
      total_school_days: totalSchoolDays,
      required,
      earned,
      still_possible: stillPossible,
      lost,
    },
  });
});

// Set homework status for a specific day (kids can do this)
router.post('/:childId/homework', (req, res) => {
  const result = statusSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ error: result.error.flatten() });
    return;
  }

  const { date, status } = result.data;

  // Verify child exists
  const child = db.prepare(
    'SELECT id FROM children WHERE id = ? AND deleted_at IS NULL'
  ).get(req.params.childId);

  if (!child) {
    res.status(404).json({ error: 'Child not found' });
    return;
  }

  // Verify it's a weekday (Mon-Fri)
  const dayOfWeek = new Date(date).getDay();
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    res.status(400).json({ error: 'Homework can only be tracked on weekdays' });
    return;
  }

  db.prepare(`
    INSERT INTO homework_logs (child_id, date, status, updated_at)
    VALUES (?, ?, ?, datetime('now'))
    ON CONFLICT(child_id, date) DO UPDATE SET status = ?, updated_at = datetime('now')
  `).run(req.params.childId, date, status, status);

  res.json({ success: true, date, status });
});

// Get homework history (last N weeks)
router.get('/:childId/homework/history', (req, res) => {
  const weeks = parseInt(req.query.weeks as string) || 8;

  const today = new Date();
  const startDate = new Date(today);
  startDate.setDate(startDate.getDate() - (weeks * 7));

  const child = db.prepare(
    'SELECT homework_required, homework_total_days FROM children WHERE id = ? AND deleted_at IS NULL'
  ).get(req.params.childId) as { homework_required: number; homework_total_days: number } | undefined;

  if (!child) {
    res.status(404).json({ error: 'Child not found' });
    return;
  }

  const logs = db.prepare(`
    SELECT date, status FROM homework_logs
    WHERE child_id = ? AND date >= ?
    ORDER BY date ASC
  `).all(req.params.childId, startDate.toISOString().slice(0, 10)) as { date: string; status: string }[];

  // Group by week (Monday start)
  const weekMap = new Map<string, { done: number; not_done: number; day_off: number }>();

  for (const log of logs) {
    const d = new Date(log.date);
    const day = d.getDay();
    const diffToMonday = day === 0 ? -6 : 1 - day;
    const monday = new Date(d);
    monday.setDate(monday.getDate() + diffToMonday);
    const weekKey = monday.toISOString().slice(0, 10);

    if (!weekMap.has(weekKey)) {
      weekMap.set(weekKey, { done: 0, not_done: 0, day_off: 0 });
    }

    const week = weekMap.get(weekKey)!;
    if (log.status === 'done') week.done++;
    else if (log.status === 'not_done') week.not_done++;
    else if (log.status === 'day_off') week.day_off++;
  }

  const history = Array.from(weekMap.entries()).map(([weekStart, counts]) => {
    const totalSchoolDays = 5 - counts.day_off;
    const required = totalSchoolDays < child.homework_total_days
      ? totalSchoolDays
      : child.homework_required;

    return {
      week_start: weekStart,
      ...counts,
      total_school_days: totalSchoolDays,
      required,
      earned: counts.done >= required,
    };
  }).sort((a, b) => b.week_start.localeCompare(a.week_start));

  res.json(history);
});

export default router;
