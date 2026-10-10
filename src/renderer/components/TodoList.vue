<template>
  <div class="flex-1 flex flex-col p-3 overflow-hidden">
    <!-- 快速新建输入框 -->
    <div class="flex items-center gap-1.5 mb-2.5">
      <div class="relative flex-1">
        <input
          v-model="newTodoText"
          type="text"
          placeholder="+ 添加待办（回车保存，支持多行粘贴）"
          class="w-full pl-3 pr-8 py-1.5 text-xs bg-white/70 border border-black/10 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500/50 focus:bg-white placeholder-gray-400 text-gray-800 transition-all shadow-inner"
          @keydown.enter="handleAddTodo"
          @paste="handlePaste"
        />
        <button
          v-if="newTodoText.trim()"
          class="absolute right-1.5 top-1/2 -translate-y-1/2 p-1 text-amber-600 hover:text-amber-700"
          @click="handleAddTodo"
        >
          <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>

    <!-- 财务常用待办快速填充标签 -->
    <div class="flex items-center gap-1 mb-2 overflow-x-auto no-scrollbar pb-0.5">
      <span class="text-[10px] text-gray-400 shrink-0">速填:</span>
      <button
        v-for="preset in presets"
        :key="preset"
        class="text-[10px] px-1.5 py-0.5 rounded bg-black/5 hover:bg-black/10 text-gray-600 shrink-0 transition-colors"
        @click="fillPreset(preset)"
      >
        {{ preset }}
      </button>
    </div>

    <!-- 待办任务列表区域 -->
    <div class="flex-1 overflow-y-auto space-y-1.5 pr-1">
      <div
        v-for="item in sortedTodos"
        :key="item.id"
        class="group flex items-start gap-2 p-2 rounded-lg bg-white/60 hover:bg-white/90 border border-black/5 transition-all text-xs"
        :class="{ 'opacity-50 bg-black/5': item.completed }"
      >
        <!-- 复选框 -->
        <button
          class="mt-0.5 w-4 h-4 rounded border flex items-center justify-center transition-colors shrink-0"
          :class="[
            item.completed
              ? 'bg-emerald-500 border-emerald-500 text-white'
              : 'border-gray-300 hover:border-amber-500 bg-white'
          ]"
          @click="widgetStore.toggleTodo(item.id)"
        >
          <svg v-if="item.completed" class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </button>

        <!-- 文本内容 -->
        <div class="flex-1 min-w-0">
          <p
            class="text-gray-800 break-words leading-relaxed select-text"
            :class="{ 'todo-strike text-gray-400 line-through': item.completed }"
          >
            {{ item.text }}
          </p>
        </div>

        <!-- 删除按钮 -->
        <button
          class="opacity-0 group-hover:opacity-100 p-0.5 text-gray-400 hover:text-red-500 transition-opacity shrink-0"
          title="删除"
          @click="widgetStore.deleteTodo(item.id)"
        >
          <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      <!-- 空状态 -->
      <div v-if="widgetStore.todos.length === 0" class="py-12 text-center text-gray-400 text-xs">
        <p class="text-2xl mb-1">🍵</p>
        <p>暂无待办事项，今天轻松愉快！</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { widgetStore } from '../stores/widgetStore';

const newTodoText = ref('');

const presets = ['重要', '工作', '生活', '学习'];

function fillPreset(tag: string) {
  newTodoText.value = `[${tag}] ${newTodoText.value.replace(/^\[.*?\]\s*/, '')}`;
}

function handleAddTodo() {
  if (!newTodoText.value.trim()) return;
  widgetStore.addTodo(newTodoText.value);
  newTodoText.value = '';
}

function handlePaste(e: ClipboardEvent) {
  const pasteText = e.clipboardData?.getData('text') || '';
  const lines = pasteText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  if (lines.length > 1) {
    e.preventDefault();
    lines.forEach(line => widgetStore.addTodo(line));
    newTodoText.value = '';
  }
}

// 未完成排在前面，已完成排在后面
const sortedTodos = computed(() => {
  return [...widgetStore.todos].sort((a, b) => {
    if (a.completed === b.completed) return b.createdAt - a.createdAt;
    return a.completed ? 1 : -1;
  });
});
</script>
