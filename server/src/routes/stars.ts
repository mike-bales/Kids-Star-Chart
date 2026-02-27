import { Router } from 'express';
import db from '../db/database';
import { requirePin } from '../middleware/requirePin';
import { z } from 'zod';

const router = Router();

const awardSchema = z.object({
  task_id: z.number().int(),
});

const removeSchema = z.object({
  stars: z.number().int().min(1),
  note: z.string().max(200).optional(),
});

// Get star log for a child
router.get('/:childId/stars', (req, res) => {
  const logs = db.prepare(`
    SELECT sl.*, t.name as task_name, t.icon as task_icon
    FROM star_logs sl
    LEFT JOIN tasks t ON sl.task_id = t.id
    WHERE sl.child_id = ?
    ORDER BY sl.created_at DESC
  `).all(req.params.childId);

  res.json(logs);
});

// Get star summary for a child
router.get('/:childId/stars/summary', (req, res) => {
  const totalStars = db.prepare(`
    SELECT COALESCE(SUM(stars), 0) as total
    FROM star_logs
    WHERE child_id = ? AND undone_at IS NULL
  `).get(req.params.childId) as { total: number };

  const totalPaidStars = db.prepare(`
    SELECT COALESCE(SUM(stars_spent), 0) as total
    FROM payouts
    WHERE child_id = ?
  `).get(req.params.childId) as { total: number };

  const threshold = db.prepare(
    "SELECT value FROM settings WHERE key = 'reward_threshold_stars'"
  ).get() as { value: string };

  const amount = db.prepare(
    "SELECT value FROM settings WHERE key = 'reward_threshold_amount'"
  ).get() as { value: string };

  const thresholdStars = parseInt(threshold.value);
  const outstanding = totalStars.total - totalPaidStars.total;
  const rewardsEarned = Math.floor(totalStars.total / thresholdStars);
  const rewardsPaid = Math.floor(totalPaidStars.total / thresholdStars);

  res.json({
    total_stars: totalStars.total,
    outstanding_stars: outstanding,
    stars_toward_next: outstanding % thresholdStars,
    threshold_stars: thresholdStars,
    threshold_amount: parseFloat(amount.value),
    rewards_earned: rewardsEarned,
    rewards_paid: rewardsPaid,
    total_earned_amount: rewardsEarned * parseFloat(amount.value),
    total_paid_amount: rewardsPaid * parseFloat(amount.value),
  });
});

// Get insights for a child
router.get('/:childId/stars/insights', (req, res) => {
  const childId = req.params.childId;

  // Total stars all-time
  const totalStars = db.prepare(`
    SELECT COALESCE(SUM(stars), 0) as total
    FROM star_logs WHERE child_id = ? AND undone_at IS NULL
  `).get(childId) as { total: number };

  // First star date
  const firstStar = db.prepare(`
    SELECT created_at FROM star_logs
    WHERE child_id = ? AND undone_at IS NULL
    ORDER BY created_at ASC LIMIT 1
  `).get(childId) as { created_at: string } | undefined;

  // Stars this week (last 7 days)
  const starsThisWeek = db.prepare(`
    SELECT COALESCE(SUM(stars), 0) as total
    FROM star_logs
    WHERE child_id = ? AND undone_at IS NULL
      AND created_at >= datetime('now', '-7 days')
  `).get(childId) as { total: number };

  // Stars this month (last 30 days)
  const starsThisMonth = db.prepare(`
    SELECT COALESCE(SUM(stars), 0) as total
    FROM star_logs
    WHERE child_id = ? AND undone_at IS NULL
      AND created_at >= datetime('now', '-30 days')
  `).get(childId) as { total: number };

  // Distinct active days
  const activeDays = db.prepare(`
    SELECT COUNT(DISTINCT date(created_at)) as count
    FROM star_logs
    WHERE child_id = ? AND undone_at IS NULL
  `).get(childId) as { count: number };

  // Average stars per active day
  const avgPerDay = activeDays.count > 0
    ? Math.round((totalStars.total / activeDays.count) * 10) / 10
    : 0;

  // Current streak and best streak (consecutive days with at least 1 star)
  const allDays = db.prepare(`
    SELECT DISTINCT date(created_at) as day
    FROM star_logs
    WHERE child_id = ? AND undone_at IS NULL
    ORDER BY day ASC
  `).all(childId) as { day: string }[];

  let currentStreak = 0;
  let bestStreak = 0;
  let tempStreak = 0;
  const today = new Date().toISOString().slice(0, 10);

  for (let i = 0; i < allDays.length; i++) {
    if (i === 0) {
      tempStreak = 1;
    } else {
      const prev = new Date(allDays[i - 1].day);
      const curr = new Date(allDays[i].day);
      const diffDays = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);
      tempStreak = diffDays === 1 ? tempStreak + 1 : 1;
    }
    bestStreak = Math.max(bestStreak, tempStreak);
  }

  // Current streak: count backwards from today/yesterday
  if (allDays.length > 0) {
    const lastDay = allDays[allDays.length - 1].day;
    const lastDate = new Date(lastDay);
    const todayDate = new Date(today);
    const diffFromToday = (todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24);

    if (diffFromToday <= 1) {
      currentStreak = 1;
      for (let i = allDays.length - 2; i >= 0; i--) {
        const curr = new Date(allDays[i + 1].day);
        const prev = new Date(allDays[i].day);
        const diff = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);
        if (diff === 1) {
          currentStreak++;
        } else {
          break;
        }
      }
    }
  }

  // Task breakdown: completions and stars per task
  const taskBreakdown = db.prepare(`
    SELECT
      t.id,
      t.name,
      t.icon,
      COUNT(*) as completions,
      SUM(sl.stars) as total_stars
    FROM star_logs sl
    JOIN tasks t ON sl.task_id = t.id
    WHERE sl.child_id = ? AND sl.undone_at IS NULL
    GROUP BY t.id
    ORDER BY completions DESC
  `).all(childId) as { id: number; name: string; icon: string | null; completions: number; total_stars: number }[];

  // Most completed task
  const mostCompleted = taskBreakdown.length > 0 ? taskBreakdown[0] : null;

  // Highest earning task (by total stars)
  const highestEarning = taskBreakdown.length > 0
    ? [...taskBreakdown].sort((a, b) => b.total_stars - a.total_stars)[0]
    : null;

  // Earnings stats
  const totalPaid = db.prepare(`
    SELECT COALESCE(SUM(amount), 0) as total
    FROM payouts WHERE child_id = ?
  `).get(childId) as { total: number };

  const totalPaidStars = db.prepare(`
    SELECT COALESCE(SUM(stars_spent), 0) as total
    FROM payouts WHERE child_id = ?
  `).get(childId) as { total: number };

  const threshold = db.prepare(
    "SELECT value FROM settings WHERE key = 'reward_threshold_stars'"
  ).get() as { value: string };
  const thresholdAmount = db.prepare(
    "SELECT value FROM settings WHERE key = 'reward_threshold_amount'"
  ).get() as { value: string };

  const thresholdStars = parseInt(threshold.value);
  const rewardsEarned = Math.floor(totalStars.total / thresholdStars);
  const totalEarnedAmount = rewardsEarned * parseFloat(thresholdAmount.value);
  const unpaidAmount = totalEarnedAmount - totalPaid.total;

  // Star rank
  const total = totalStars.total;
  let rank: string;
  if (total >= 500) rank = 'Star Legend';
  else if (total >= 200) rank = 'Star Champion';
  else if (total >= 100) rank = 'Superstar';
  else if (total >= 50) rank = 'Star Explorer';
  else if (total >= 20) rank = 'Rising Star';
  else if (total >= 5) rank = 'Star Starter';
  else rank = 'New Star';

  // Days since first star
  const daysSinceFirst = firstStar
    ? Math.floor((new Date().getTime() - new Date(firstStar.created_at).getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  // Progress to next reward
  const outstanding = totalStars.total - totalPaidStars.total;
  const starsTowardNext = outstanding % thresholdStars;
  const progressPercent = Math.round((starsTowardNext / thresholdStars) * 100);

  res.json({
    total_stars: totalStars.total,
    stars_this_week: starsThisWeek.total,
    stars_this_month: starsThisMonth.total,
    avg_stars_per_day: avgPerDay,
    active_days: activeDays.count,
    current_streak: currentStreak,
    best_streak: bestStreak,
    days_since_first: daysSinceFirst,
    most_completed_task: mostCompleted,
    highest_earning_task: highestEarning,
    task_breakdown: taskBreakdown,
    total_earned_amount: totalEarnedAmount,
    total_paid_amount: totalPaid.total,
    unpaid_amount: unpaidAmount,
    rewards_earned: rewardsEarned,
    progress_percent: progressPercent,
    stars_toward_next: starsTowardNext,
    threshold_stars: thresholdStars,
    rank,
  });
});

// Award stars (NO PIN — kids use this!)
router.post('/:childId/stars', (req, res) => {
  const result = awardSchema.safeParse(req.body);
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

  // Get task to know star value
  const task = db.prepare(
    'SELECT * FROM tasks WHERE id = ? AND deleted_at IS NULL'
  ).get(result.data.task_id) as { id: number; star_value: number; name: string } | undefined;

  if (!task) {
    res.status(404).json({ error: 'Task not found' });
    return;
  }

  // Get previous total before awarding
  const beforeTotal = db.prepare(`
    SELECT COALESCE(SUM(stars), 0) as total
    FROM star_logs
    WHERE child_id = ? AND undone_at IS NULL
  `).get(req.params.childId) as { total: number };

  const totalPaidStars = db.prepare(`
    SELECT COALESCE(SUM(stars_spent), 0) as total
    FROM payouts WHERE child_id = ?
  `).get(req.params.childId) as { total: number };

  // Insert star log
  const stmt = db.prepare(
    'INSERT INTO star_logs (child_id, task_id, stars, note) VALUES (?, ?, ?, ?)'
  );
  const info = stmt.run(req.params.childId, task.id, task.star_value, task.name);

  const newTotal = beforeTotal.total + task.star_value;
  const outstanding = newTotal - totalPaidStars.total;

  // Check if threshold was crossed
  const threshold = db.prepare(
    "SELECT value FROM settings WHERE key = 'reward_threshold_stars'"
  ).get() as { value: string };
  const thresholdStars = parseInt(threshold.value);

  const previousOutstanding = outstanding - task.star_value;
  const thresholdReached = Math.floor(outstanding / thresholdStars) > Math.floor(previousOutstanding / thresholdStars);

  const log = db.prepare('SELECT * FROM star_logs WHERE id = ?').get(info.lastInsertRowid);

  res.status(201).json({
    log,
    newTotal,
    outstanding,
    starsAwarded: task.star_value,
    thresholdReached,
    thresholdStars,
  });
});

// Remove stars manually (requires PIN)
router.post('/:childId/stars/remove', requirePin, (req, res) => {
  const result = removeSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ error: result.error.flatten() });
    return;
  }

  const child = db.prepare(
    'SELECT id FROM children WHERE id = ? AND deleted_at IS NULL'
  ).get(req.params.childId);

  if (!child) {
    res.status(404).json({ error: 'Child not found' });
    return;
  }

  const { stars, note } = result.data;
  db.prepare(
    'INSERT INTO star_logs (child_id, task_id, stars, note) VALUES (?, NULL, ?, ?)'
  ).run(req.params.childId, -stars, note || 'Stars removed');

  const newTotal = db.prepare(`
    SELECT COALESCE(SUM(stars), 0) as total
    FROM star_logs WHERE child_id = ? AND undone_at IS NULL
  `).get(req.params.childId) as { total: number };

  res.json({ success: true, newTotal: newTotal.total, starsRemoved: stars });
});

// Undo a star award (requires PIN)
router.post('/:childId/stars/:logId/undo', requirePin, (req, res) => {
  const log = db.prepare(
    'SELECT * FROM star_logs WHERE id = ? AND child_id = ? AND undone_at IS NULL'
  ).get(req.params.logId, req.params.childId) as { id: number; stars: number } | undefined;

  if (!log) {
    res.status(404).json({ error: 'Star log not found or already undone' });
    return;
  }

  db.prepare(
    "UPDATE star_logs SET undone_at = datetime('now') WHERE id = ?"
  ).run(log.id);

  // Get new total
  const newTotal = db.prepare(`
    SELECT COALESCE(SUM(stars), 0) as total
    FROM star_logs
    WHERE child_id = ? AND undone_at IS NULL
  `).get(req.params.childId) as { total: number };

  res.json({ success: true, newTotal: newTotal.total });
});

export default router;
