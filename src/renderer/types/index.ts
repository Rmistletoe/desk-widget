export type ThemeColor = 'yellow' | 'green' | 'pink' | 'blue' | 'white';

export interface TodoItem {
  id: string;
  text: string;
  completed: boolean;
  priority?: 'normal' | 'important';
  createdAt: number;
}

export interface StickyNote {
  id: string;
  content: string;
  color: ThemeColor;
  updatedAt: number;
}

export interface AppConfig {
  workStartTime: string; // e.g. "09:00"
  workEndTime: string;   // e.g. "18:00"
  payday: number;        // e.g. 15
  alwaysOnTop: boolean;
  opacity: number;       // e.g. 0.95
  customMessage: string; // 专属留言/提醒
}

export type ActiveTab = 'todo' | 'note';
