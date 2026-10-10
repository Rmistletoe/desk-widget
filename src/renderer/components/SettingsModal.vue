<template>
  <div class="absolute inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-3">
    <div class="w-full max-h-full bg-white/95 rounded-xl shadow-2xl border border-black/10 flex flex-col overflow-hidden text-xs text-gray-800">
      <!-- 设置标题栏 -->
      <div class="px-3.5 py-2.5 bg-gray-50/80 border-b border-black/5 flex items-center justify-between font-semibold select-none">
        <div class="flex items-center gap-1.5 text-gray-800">
          <span class="text-sm">⚙️</span>
          <span>挂件设置</span>
        </div>
        <button
          class="p-1 rounded-md text-gray-400 hover:text-gray-700 hover:bg-black/5 transition-colors"
          title="关闭"
          @click="widgetStore.showSettings = false"
        >
          <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      <!-- 设置内容区 -->
      <div class="p-3.5 space-y-3.5 overflow-y-auto max-h-[380px] leading-relaxed">
        <!-- 1. 作息时间设置 -->
        <div class="space-y-1.5">
          <label class="font-semibold text-gray-700 flex items-center gap-1">
            <span>⏰</span> 作息时间设置
          </label>
          <div class="grid grid-cols-2 gap-2 bg-gray-50/80 p-2 rounded-lg border border-black/5">
            <div>
              <span class="text-[11px] text-gray-500 block mb-1">上班时间</span>
              <input
                v-model="widgetStore.config.workStartTime"
                type="time"
                class="w-full px-2 py-1 bg-white border border-black/10 rounded focus:outline-none focus:ring-1 focus:ring-amber-500 text-xs"
              />
            </div>
            <div>
              <span class="text-[11px] text-gray-500 block mb-1">下班时间</span>
              <input
                v-model="widgetStore.config.workEndTime"
                type="time"
                class="w-full px-2 py-1 bg-white border border-black/10 rounded focus:outline-none focus:ring-1 focus:ring-amber-500 text-xs"
              />
            </div>
          </div>
        </div>

        <!-- 2. 每月发薪日 -->
        <div class="space-y-1.5">
          <label class="font-semibold text-gray-700 flex items-center gap-1">
            <span>💰</span> 发薪日设置
          </label>
          <div class="flex items-center gap-2 bg-gray-50/80 p-2 rounded-lg border border-black/5">
            <span class="text-[11px] text-gray-600">每月</span>
            <select
              v-model.number="widgetStore.config.payday"
              class="px-2 py-1 bg-white border border-black/10 rounded focus:outline-none focus:ring-1 focus:ring-amber-500 text-xs font-medium"
            >
              <option v-for="d in 31" :key="d" :value="d">{{ d }} 日</option>
            </select>
            <span class="text-[11px] text-gray-500">发放薪资</span>
          </div>
        </div>

        <!-- 3. 窗口外观与置顶 -->
        <div class="space-y-1.5">
          <label class="font-semibold text-gray-700 flex items-center gap-1">
            <span>🪟</span> 窗口与显示
          </label>
          <div class="bg-gray-50/80 p-2 rounded-lg border border-black/5 space-y-2">
            <!-- 置顶开关 -->
            <div class="flex items-center justify-between">
              <span class="text-[11px] text-gray-600">总是置顶于最上层</span>
              <input
                v-model="widgetStore.config.alwaysOnTop"
                type="checkbox"
                class="w-4 h-4 text-amber-600 rounded focus:ring-0 cursor-pointer"
                @change="handleAlwaysOnTopChange"
              />
            </div>

            <!-- 透明度调节 -->
            <div class="space-y-1 pt-1 border-t border-black/5">
              <div class="flex items-center justify-between text-[11px] text-gray-600">
                <span>窗口不透明度</span>
                <span class="font-bold text-gray-800">{{ Math.round(widgetStore.config.opacity * 100) }}%</span>
              </div>
              <input
                v-model.number="widgetStore.config.opacity"
                type="range"
                min="0.6"
                max="1"
                step="0.05"
                class="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
            </div>
          </div>
        </div>

        <!-- 4. 自定义专属留言 -->
        <div class="space-y-1.5">
          <label class="font-semibold text-gray-700 flex items-center gap-1">
            <span>💌</span> 专属励志/暖心语句
          </label>
          <div class="bg-gray-50/80 p-2 rounded-lg border border-black/5">
            <input
              v-model="widgetStore.config.customMessage"
              type="text"
              placeholder="写一句喜欢的话..."
              class="w-full px-2 py-1.5 bg-white border border-black/10 rounded focus:outline-none focus:ring-1 focus:ring-amber-500 text-xs text-gray-800"
            />
          </div>
        </div>
      </div>

      <!-- 底部完成按钮 -->
      <div class="p-2.5 bg-gray-50/90 border-t border-black/5 flex justify-end">
        <button
          class="px-4 py-1 rounded-md bg-amber-500 hover:bg-amber-600 text-white font-medium text-xs transition-colors shadow-sm"
          @click="widgetStore.showSettings = false"
        >
          保存并关闭
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { widgetStore } from '../stores/widgetStore';

function handleAlwaysOnTopChange() {
  // @ts-ignore
  if (window.electronAPI?.setAlwaysOnTop) {
    // @ts-ignore
    window.electronAPI.setAlwaysOnTop(widgetStore.config.alwaysOnTop);
  }
}
</script>
