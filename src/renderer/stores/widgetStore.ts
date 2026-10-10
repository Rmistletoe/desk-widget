import { reactive, watch } from 'vue';
import type { TodoItem, StickyNote, AppConfig, ThemeColor, ActiveTab } from '../types';

const STORAGE_KEYS = {
  TODOS: 'desktop_widget_todos',
  NOTE: 'desktop_widget_note',
  CONFIG: 'desktop_widget_config',
};

const defaultTodos: TodoItem[] = [
  {
    id: '1',
    text: '完成今日重点任务',
    completed: false,
    priority: 'important',
    createdAt: Date.now(),
  },
  {
    id: '2',
    text: '下班准时打卡撤退 🎉',
    completed: false,
    priority: 'normal',
    createdAt: Date.now() - 1000,
  },
];

const defaultNote: StickyNote = {
  id: 'main-note',
  content: '【随手备忘】\n点击这里随手记录灵感、待办或备忘事项。\n打字实时自动保存，随时关闭不丢数据。',
  color: 'yellow',
  updatedAt: Date.now(),
};

const defaultConfig: AppConfig = {
  workStartTime: '09:00',
  workEndTime: '18:00',
  payday: 15,
  alwaysOnTop: true,
  opacity: 0.95,
  customMessage: '今天也要保持好心情，下班一起吃好吃的～',
};

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

export const widgetStore = reactive({
  activeTab: 'todo' as ActiveTab,
  isCapsuleMode: false,
  showSettings: false,
  todos: loadFromStorage<TodoItem[]>(STORAGE_KEYS.TODOS, defaultTodos),
  note: loadFromStorage<StickyNote>(STORAGE_KEYS.NOTE, defaultNote),
  config: loadFromStorage<AppConfig>(STORAGE_KEYS.CONFIG, defaultConfig),

  addTodo(text: string, priority: 'normal' | 'important' = 'normal') {
    if (!text.trim()) return;
    this.todos.unshift({
      id: Date.now().toString(),
      text: text.trim(),
      completed: false,
      priority,
      createdAt: Date.now(),
    });
  },

  toggleTodo(id: string) {
    const target = this.todos.find(item => item.id === id);
    if (target) {
      target.completed = !target.completed;
    }
  },

  deleteTodo(id: string) {
    this.todos = this.todos.filter(item => item.id !== id);
  },

  clearCompleted() {
    this.todos = this.todos.filter(item => !item.completed);
  },

  setNoteColor(color: ThemeColor) {
    this.note.color = color;
    this.note.updatedAt = Date.now();
  },

  setCapsuleMode(val: boolean) {
    this.isCapsuleMode = val;
  },

  toggleSettings() {
    this.showSettings = !this.showSettings;
  },
});

// 监听变动并防抖持久化
watch(
  () => widgetStore.todos,
  (val) => localStorage.setItem(STORAGE_KEYS.TODOS, JSON.stringify(val)),
  { deep: true }
);

watch(
  () => widgetStore.note,
  (val) => localStorage.setItem(STORAGE_KEYS.NOTE, JSON.stringify(val)),
  { deep: true }
);

watch(
  () => widgetStore.config,
  (val) => localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(val)),
  { deep: true }
);
