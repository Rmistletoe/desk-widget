import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import electron from 'vite-plugin-electron';
import path from 'path';
import fs from 'node:fs';

export default defineConfig({
  plugins: [
    vue(),
    electron([
      {
        entry: 'src/main/index.ts',
      },
    ]),
    {
      name: 'copy-assets',
      closeBundle() {
        fs.mkdirSync(path.resolve(__dirname, 'dist-electron/assets'), { recursive: true });
        fs.copyFileSync(
          path.resolve(__dirname, 'src/main/preload.cjs'),
          path.resolve(__dirname, 'dist-electron/preload.cjs')
        );
        if (fs.existsSync(path.resolve(__dirname, 'src/main/assets/tray.png'))) {
          fs.copyFileSync(
            path.resolve(__dirname, 'src/main/assets/tray.png'),
            path.resolve(__dirname, 'dist-electron/assets/tray.png')
          );
        }
      },
    },
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src/renderer'),
    },
  },
});
