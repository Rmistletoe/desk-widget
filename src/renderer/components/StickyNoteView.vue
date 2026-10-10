<template>
  <div class="flex-1 flex flex-col p-3 overflow-hidden">
    <!-- 快捷模板工具条 -->
    <div class="flex items-center gap-1 mb-2 overflow-x-auto no-scrollbar pb-0.5">
      <span class="text-[10px] text-gray-400 shrink-0">插入:</span>
      <button
        v-for="tpl in templates"
        :key="tpl.label"
        class="text-[10px] px-1.5 py-0.5 rounded bg-black/5 hover:bg-black/10 text-gray-700 shrink-0 transition-colors"
        @click="insertTemplate(tpl.text)"
      >
        {{ tpl.label }}
      </button>
    </div>

    <!-- 便签编辑区域 -->
    <div class="flex-1 relative">
      <textarea
        v-model="widgetStore.note.content"
        class="w-full h-full p-2.5 text-xs text-gray-800 bg-white/60 focus:bg-white/90 border border-black/5 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500/50 resize-none leading-relaxed transition-all shadow-inner select-text"
        placeholder="写下随时需要记录的信息、开票抬头、临时备忘...（打字即存，关机不丢）"
      ></textarea>

      <!-- 实时字数统计与保存提示 -->
      <div class="absolute right-2 bottom-2 text-[10px] text-gray-400 select-none flex items-center gap-1 bg-white/80 px-1.5 py-0.5 rounded backdrop-blur-sm">
        <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
        <span>已自动保存 · {{ widgetStore.note.content.length }} 字</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { widgetStore } from '../stores/widgetStore';

const templates = [
  { label: '+ 会议备忘', text: '\n【会议要点】\n- 时间：\n- 重点：\n- 待办项：' },
  { label: '+ 灵感草稿', text: '\n【灵感闪念】\n- 想法：\n- 可行性：' },
  { label: '+ 常用信息', text: '\n【备忘记录】\n名称：\n账号/链接：' },
];

function insertTemplate(tplText: string) {
  widgetStore.note.content += tplText;
}
</script>
