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

// 获取从主进程同步注入的外部独立配置文件内容
const electronState = (window as any).electronAPI?.initialState;

export const widgetStore = reactive({
  activeTab: 'todo' as ActiveTab,
  isCapsuleMode: false,
  showSettings: false,
  todos: (electronState?.data?.todos as TodoItem[]) || loadFromStorage<TodoItem[]>(STORAGE_KEYS.TODOS, defaultTodos),
  note: (electronState?.data?.note as StickyNote) || loadFromStorage<StickyNote>(STORAGE_KEYS.NOTE, defaultNote),
  config: (electronState?.config as AppConfig) || loadFromStorage<AppConfig>(STORAGE_KEYS.CONFIG, defaultConfig),

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

  updateConfig(newConfig: Partial<AppConfig>) {
    Object.assign(this.config, newConfig);
    const plain = JSON.parse(JSON.stringify(this.config));
    localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(plain));
    if ((window as any).electronAPI?.saveConfig) {
      (window as any).electronAPI.saveConfig(plain);
    }
  },
});

// 监听配置变动：同时持久化到 localStorage 与外部独立 config.json
watch(
  widgetStore.config,
  (val) => {
    const plain = JSON.parse(JSON.stringify(val));
    localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(plain));
    (window as any).electronAPI?.saveConfig?.(plain);
  },
  { deep: true }
);

// 监听待办与便签变动：同时持久化到 localStorage 与外部独立 data.json
watch(
  () => [widgetStore.todos, widgetStore.note],
  () => {
    const data = {
      todos: JSON.parse(JSON.stringify(widgetStore.todos)),
      note: JSON.parse(JSON.stringify(widgetStore.note)),
    };
    localStorage.setItem(STORAGE_KEYS.TODOS, JSON.stringify(data.todos));
    localStorage.setItem(STORAGE_KEYS.NOTE, JSON.stringify(data.note));
    (window as any).electronAPI?.saveData(data);
  },
  { deep: true }
);
