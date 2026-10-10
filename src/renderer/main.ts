import { createApp } from 'vue';
import App from './App.vue';
import './assets/main.css';

console.log('Renderer: main.ts starting...');
createApp(App).mount('#app');
console.log('Renderer: App mounted!');
