export interface User {
  id: string;
  sync_code: string;
  created_at: string;
}

export interface Schedule {
  id: string;
  user_id: string;
  title: string;
  description: string;
  scheduled_at: string;
  reminder_minutes: number;
  is_completed: boolean;
  created_at: string;
}

export interface MoodEvent {
  id: string;
  text: string;
  period: 'morning' | 'afternoon' | 'evening';
}

export interface MoodEntry {
  id: string;
  user_id: string;
  date: string;
  mood_score: number; // 0 = 未评分
  events: MoodEvent[];
  note: string;
  created_at: string;
}

export interface PushSubscriptionRecord {
  id: string;
  user_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  created_at: string;
}

export type SyncCodeResponse = {
  user: User;
  sync_code: string;
};
