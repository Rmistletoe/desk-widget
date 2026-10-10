<template>
  <div 
    class="drag-region w-full h-[42px] px-3 flex items-center justify-between text-xs select-none backdrop-blur-md rounded-full shadow-lg border border-black/10 transition-all cursor-pointer"
    :style="{ backgroundColor: currentBgHex }"
    @dblclick="expandToFull"
  >
    <!-- 左侧：发薪与倒计时 -->
    <div class="flex items-center gap-2 font-medium text-gray-700">
      <span class="text-xs">⏰</span>
      <span class="font-semibold">{{ workInfo.countdownText }}</span>
    </div>

    <!-- 右侧：未办数量与展开按钮 -->
    <div class="flex items-center gap-1.5 no-drag">
      <span 
        v-if="uncompletedCount > 0"
        class="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500/20 text-amber-800 font-bold"
        title="剩余待办事项"
      >
        {{ uncompletedCount }} 项
      </span>

      <button
        class="p-1 rounded-full hover:bg-black/10 text-gray-500 transition-colors"
        title="双击展开面板"
        @click="expandToFull"
      >
        <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <polyline points="15 3 21 3 21 9" />
          <polyline points="9 21 3 21 3 15" />
          <line x1="21" y1="3" x2="14" y2="10" />
          <line x1="3" y1="21" x2="10" y2="14" />
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { widgetStore } from '../stores/widgetStore';
import { calculateWorkProgress } from '../utils/countdown';

const now = ref(new Date());
let timer: number | null = null;

onMounted(() => {
  timer = window.setInterval(() => {
    now.value = new Date();
  }, 1000);
});

onUnmounted(() => {
  if (timer) clearInterval(timer);
});

const workInfo = computed(() => {
  return calculateWorkProgress(
    widgetStore.config.workStartTime,
    widgetStore.config.workEndTime,
    now.value
  );
});

const uncompletedCount = computed(() => {
  return widgetStore.todos.filter(t => !t.completed).length;
});

const currentBgHex = computed(() => {
  const map: Record<string, string> = {
    yellow: '#FFF8E1',
    green: '#E8F5E9',
    pink: '#FCE4EC',
    blue: '#E1F5FE',
    white: '#F5F5F7',
  };
  return map[widgetStore.note.color] || '#FFF8E1';
});

function expandToFull() {
  widgetStore.setCapsuleMode(false);
  // @ts-ignore
  if (window.electronAPI?.toggleCapsule) {
    // @ts-ignore
    window.electronAPI.toggleCapsule(false);
  }
}
</script>
