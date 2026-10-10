<template>
  <div class="w-screen h-screen flex flex-col justify-start items-center p-1 overflow-hidden relative">
    <!-- 胶囊收起态 -->
    <CapsuleView v-if="widgetStore.isCapsuleMode" />

    <!-- 完整便签展开面板 -->
    <div
      v-else
      class="note-container w-full h-full rounded-2xl shadow-xl border border-black/10 flex flex-col overflow-hidden backdrop-blur-md transition-all duration-300 relative"
      :style="{ backgroundColor: currentBgHex, opacity: widgetStore.config.opacity }"
    >
      <!-- 顶部状态栏 -->
      <HeaderStatus />

      <!-- 中间标签切换 (待办清单 / 随手便签) -->
      <TabNav />

      <!-- 视图主体区域 -->
      <div class="flex-1 flex flex-col overflow-hidden relative">
        <transition name="fade-slide" mode="out-in">
          <TodoList v-if="widgetStore.activeTab === 'todo'" key="todo" />
          <StickyNoteView v-else-if="widgetStore.activeTab === 'note'" key="note" />
        </transition>
      </div>

      <!-- 底部操作与暖心栏 -->
      <FooterBar />

      <!-- 设置弹窗 -->
      <transition name="fade-scale">
        <SettingsModal v-if="widgetStore.showSettings" />
      </transition>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { widgetStore } from './stores/widgetStore';
import HeaderStatus from './components/HeaderStatus.vue';
import TabNav from './components/TabNav.vue';
import TodoList from './components/TodoList.vue';
import StickyNoteView from './components/StickyNoteView.vue';
import FooterBar from './components/FooterBar.vue';
import CapsuleView from './components/CapsuleView.vue';
import SettingsModal from './components/SettingsModal.vue';

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
</script>

<style scoped>
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: opacity 0.18s ease, transform 0.18s ease;
}

.fade-slide-enter-from {
  opacity: 0;
  transform: translateY(4px);
}

.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

.fade-scale-enter-active,
.fade-scale-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.fade-scale-enter-from,
.fade-scale-leave-to {
  opacity: 0;
  transform: scale(0.96);
}
</style>
