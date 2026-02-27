export interface Child {
  id: number;
  name: string;
  avatar_url: string | null;
  color: string;
  created_at: string;
  deleted_at: string | null;
}

export interface Task {
  id: number;
  name: string;
  star_value: number;
  icon: string | null;
  sort_order: number;
  created_at: string;
  deleted_at: string | null;
}

export interface StarLog {
  id: number;
  child_id: number;
  task_id: number | null;
  stars: number;
  note: string | null;
  created_at: string;
  undone_at: string | null;
}

export interface Payout {
  id: number;
  child_id: number;
  stars_spent: number;
  amount: number;
  created_at: string;
}

export interface Setting {
  key: string;
  value: string;
}
