<template>
  <div class="flex items-center px-3 pt-2 pb-1 gap-1 border-b border-black/5 select-none text-xs">
    <button
      v-for="tab in tabs"
      :key="tab.key"
      class="flex-1 py-1 px-2 rounded-md font-medium transition-all text-center flex items-center justify-center gap-1"
      :class="[
        widgetStore.activeTab === tab.key
          ? 'bg-black/10 text-gray-900 shadow-sm'
          : 'text-gray-500 hover:text-gray-700 hover:bg-black/5'
      ]"
      @click="widgetStore.activeTab = tab.key"
    >
      <span>{{ tab.icon }}</span>
      <span>{{ tab.label }}</span>
      <span 
        v-if="tab.key === 'todo' && uncompletedCount > 0"
        class="ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500/20 text-amber-800 font-bold"
      >
        {{ uncompletedCount }}
      </span>
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { widgetStore } from '../stores/widgetStore';
import type { ActiveTab } from '../types';

const tabs: { key: ActiveTab; label: string; icon: string }[] = [
  { key: 'todo', label: '待办清单', icon: '📝' },
  { key: 'note', label: '随手便签', icon: '📌' },
];

const uncompletedCount = computed(() => {
  return widgetStore.todos.filter(t => !t.completed).length;
});
</script>
