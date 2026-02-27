CREATE TABLE IF NOT EXISTS children (
  id                      INTEGER PRIMARY KEY AUTOINCREMENT,
  name                    TEXT NOT NULL,
  avatar_url              TEXT,
  color                   TEXT DEFAULT '#FFD700',
  homework_tracking       INTEGER DEFAULT 0,
  homework_required       INTEGER DEFAULT 4,
  homework_total_days     INTEGER DEFAULT 5,
  created_at              TEXT DEFAULT (datetime('now')),
  deleted_at              TEXT
);

CREATE TABLE IF NOT EXISTS tasks (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  name        TEXT NOT NULL,
  star_value  INTEGER NOT NULL DEFAULT 1,
  icon        TEXT,
  sort_order  INTEGER DEFAULT 0,
  created_at  TEXT DEFAULT (datetime('now')),
  deleted_at  TEXT
);

CREATE TABLE IF NOT EXISTS star_logs (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  child_id    INTEGER NOT NULL REFERENCES children(id),
  task_id     INTEGER REFERENCES tasks(id),
  stars       INTEGER NOT NULL,
  note        TEXT,
  created_at  TEXT DEFAULT (datetime('now')),
  undone_at   TEXT
);

CREATE TABLE IF NOT EXISTS payouts (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  child_id    INTEGER NOT NULL REFERENCES children(id),
  stars_spent INTEGER NOT NULL,
  amount      REAL NOT NULL,
  note        TEXT,
  created_at  TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS homework_logs (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  child_id    INTEGER NOT NULL REFERENCES children(id),
  date        TEXT NOT NULL,
  status      TEXT NOT NULL DEFAULT 'pending',
  updated_at  TEXT DEFAULT (datetime('now')),
  UNIQUE(child_id, date)
);

CREATE TABLE IF NOT EXISTS settings (
  key         TEXT PRIMARY KEY,
  value       TEXT NOT NULL
);
