<template>
  <div class="px-3 py-2 border-t border-black/5 flex flex-col gap-1.5 select-none text-xs">
    <!-- 专属暖心语句留言 -->
    <div 
      class="flex items-center gap-1.5 text-gray-600 bg-white/40 hover:bg-white/70 px-2 py-1 rounded cursor-pointer transition-colors"
      title="点击切换一句专属暖心话"
      @click="nextSweetMessage"
    >
      <span class="text-xs">💌</span>
      <span class="truncate flex-1 font-medium text-[11px] text-gray-700">
        {{ currentSweetMessage }}
      </span>
      <span class="text-[10px] text-gray-400">↻</span>
    </div>

    <!-- 底部操作条：便签换色 + 清理已办 -->
    <div class="flex items-center justify-between pt-0.5">
      <!-- 5 款莫兰迪色彩切换圆点 -->
      <div class="flex items-center gap-1.5">
        <button
          v-for="c in colorOptions"
          :key="c.name"
          class="w-3.5 h-3.5 rounded-full border transition-transform"
          :class="[
            c.borderClass,
            widgetStore.note.color === c.name ? 'scale-125 ring-2 ring-black/20' : 'hover:scale-110'
          ]"
          :style="{ backgroundColor: c.bgHex }"
          :title="c.label"
          @click="widgetStore.setNoteColor(c.name)"
        ></button>
      </div>

      <!-- 右侧辅助按钮 -->
      <div class="flex items-center gap-2 text-[11px] text-gray-500">
        <button
          v-if="widgetStore.activeTab === 'todo' && hasCompleted"
          class="hover:text-red-500 transition-colors flex items-center gap-0.5"
          @click="widgetStore.clearCompleted"
        >
          <span>🧹</span>
          <span>清理已办</span>
        </button>

        <span class="text-[10px] text-gray-400">桌面便签 v0.1</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { widgetStore } from '../stores/widgetStore';
import type { ThemeColor } from '../types';

const defaultMessages = [
  '今天也要元气满满，保持好心情～',
  '下班去吃好吃的，再坚持一下下 🍖',
  '记得多喝两口温水，活动下脖子哦 🍵',
  '任务一项项搞定，准时下班起飞 🛫',
  '暴富发薪倒计时中，今天也要开心呀 ✨',
];

const messageIndex = ref(0);
const currentSweetMessage = computed(() => {
  const list = widgetStore.config.customMessage
    ? [widgetStore.config.customMessage, ...defaultMessages]
    : defaultMessages;
  return list[messageIndex.value % list.length];
});

function nextSweetMessage() {
  messageIndex.value++;
}

const colorOptions: { name: ThemeColor; label: string; bgHex: string; borderClass: string }[] = [
  { name: 'yellow', label: '杏黄', bgHex: '#FFF8E1', borderClass: 'border-amber-300' },
  { name: 'green', label: '薄荷绿', bgHex: '#E8F5E9', borderClass: 'border-emerald-300' },
  { name: 'pink', label: '早樱粉', bgHex: '#FCE4EC', borderClass: 'border-rose-300' },
  { name: 'blue', label: '晴空蓝', bgHex: '#E1F5FE', borderClass: 'border-sky-300' },
  { name: 'white', label: '极简白', bgHex: '#F5F5F7', borderClass: 'border-gray-300' },
];

const hasCompleted = computed(() => {
  return widgetStore.todos.some(t => t.completed);
});
</script>
