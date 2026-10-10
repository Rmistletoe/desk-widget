<template>
  <div 
    class="drag-region px-3 pt-2.5 pb-2 border-b border-black/5 flex flex-col gap-1.5 select-none"
    @dblclick="toggleCapsule"
  >
    <!-- 顶部操作条与标题 -->
    <div class="flex items-center justify-between text-xs text-gray-500 font-medium">
      <!-- 发薪日状态胶囊 -->
      <div class="no-drag flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-700">
        <span class="text-xs">💰</span>
        <span class="font-semibold">{{ paydayInfo.text }}</span>
      </div>

      <!-- 右侧控制按钮 -->
      <div class="no-drag flex items-center gap-1 text-gray-400">
        <!-- 打开设置窗口 -->
        <button 
          class="p-1 rounded hover:bg-black/5 transition-colors" 
          title="设置（上下班时间、发薪日、透明度）"
          @click="widgetStore.toggleSettings"
        >
          <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        </button>

        <!-- 置顶状态 -->
        <button 
          class="p-1 rounded hover:bg-black/5 transition-colors" 
          :class="{ 'text-amber-600': widgetStore.config.alwaysOnTop }"
          :title="widgetStore.config.alwaysOnTop ? '已置顶' : '未置顶'"
          @click="toggleAlwaysOnTop"
        >
          <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 2v10M12 12l-4 4h8l-4-4zM5 20h14" />
          </svg>
        </button>

        <!-- 缩小为胶囊 -->
        <button 
          class="p-1 rounded hover:bg-black/5 transition-colors" 
          title="双击或点击收起为胶囊"
          @click="toggleCapsule"
        >
          <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M4 14h6m0 0v6m0-6L3 21M20 10h-6m0 0V4m0 6l7-7" />
          </svg>
        </button>
      </div>
    </div>

    <!-- 下班倒计时与工时进度条 -->
    <div class="flex items-center justify-between text-xs mt-0.5">
      <div class="flex items-center gap-1.5 text-gray-700 font-semibold">
        <span class="text-sm">⏰</span>
        <span>{{ workInfo.countdownText }}</span>
      </div>
      <div class="text-[11px] text-gray-400 font-medium">
        已打工 {{ workInfo.progressPercent }}%
      </div>
    </div>

    <!-- 进度条本体 -->
    <div class="w-full h-1.5 bg-black/5 rounded-full overflow-hidden">
      <div 
        class="h-full bg-gradient-to-r from-amber-400 to-emerald-400 rounded-full transition-all duration-500 ease-out"
        :style="{ width: `${workInfo.progressPercent}%` }"
      ></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { widgetStore } from '../stores/widgetStore';
import { calculateWorkProgress, calculatePayday } from '../utils/countdown';

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

const paydayInfo = computed(() => {
  return calculatePayday(widgetStore.config.payday, now.value);
});

function toggleCapsule() {
  widgetStore.setCapsuleMode(!widgetStore.isCapsuleMode);
  // @ts-ignore
  if (window.electronAPI?.toggleCapsule) {
    // @ts-ignore
    window.electronAPI.toggleCapsule(widgetStore.isCapsuleMode);
  }
}

function toggleAlwaysOnTop() {
  widgetStore.config.alwaysOnTop = !widgetStore.config.alwaysOnTop;
  // @ts-ignore
  if (window.electronAPI?.setAlwaysOnTop) {
    // @ts-ignore
    window.electronAPI.setAlwaysOnTop(widgetStore.config.alwaysOnTop);
  }
}
</script>
