import { app, BrowserWindow, ipcMain, globalShortcut, screen, Tray, Menu, nativeImage } from 'electron';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// 核心优化 1：跳过代理自动探测，消除启动 2~5 秒卡顿延迟
app.commandLine.appendSwitch('no-proxy-server');
app.commandLine.appendSwitch('disable-gpu-shader-disk-cache');
// 核心优化 2：关闭原生遮挡计算，提高冷启动响应
app.commandLine.appendSwitch('disable-features', 'CalculateNativeWinOcclusion,SpareRendererForSitePerProcess');
app.commandLine.appendSwitch('disable-renderer-backgrounding');
app.commandLine.appendSwitch('disable-backgrounding-occluded-windows');

app.setName('DeskWidget');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;

// 内嵌 32x32 独立透明托盘便签图标（Base64 嵌入，绝不受磁盘路径与丢失影响）
const TRAY_ICON_DATA = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAVElEQVR4nGNgGAVI4Os87v/0wANqOU5HjDpg1AED7oB/n4//pycedcDQcMDNcjaq4KEbAqMOGHAHjCbCUQcMuAOokdiGdgiMOmBkOYCejsBq+YgFACTlOhe2usAsAAAAAElFTkSuQmCC';

const WINDOW_SIZES = {
  NORMAL: { width: 300, height: 480 },
  CAPSULE: { width: 240, height: 42 },
};

function createTray() {
  if (tray) return;

  try {
    const icon = nativeImage.createFromDataURL(TRAY_ICON_DATA);
    tray = new Tray(icon);
    tray.setToolTip('桌面便签挂件');

    const contextMenu = Menu.buildFromTemplate([
      {
        label: '📌 显示/隐藏便签',
        click: () => toggleWindowVisible(),
      },
      { type: 'separator' },
      {
        label: '❌ 退出程序',
        click: () => {
          app.quit();
        },
      },
    ]);

    tray.setContextMenu(contextMenu);

    // 单击右下角托盘图标：切换显示 / 隐藏
    tray.on('click', () => {
      toggleWindowVisible();
    });
  } catch (err) {
    console.error('Tray creation failed:', err);
  }
}

function toggleWindowVisible() {
  if (!mainWindow) return;
  if (mainWindow.isVisible()) {
    mainWindow.hide();
  } else {
    mainWindow.show();
    mainWindow.focus();
  }
}

function createWindow() {
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width: screenWidth } = primaryDisplay.workAreaSize;

  mainWindow = new BrowserWindow({
    x: screenWidth - 340,
    y: 80,
    width: WINDOW_SIZES.NORMAL.width,
    height: WINDOW_SIZES.NORMAL.height,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    resizable: false,
    skipTaskbar: true, // 核心：不在任务栏显示图标，只在右下角托盘显示！
    hasShadow: true,
    show: true, // 立即显示，防止 ready-to-show 挂起
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  const indexPath = path.join(__dirname, '../dist/index.html');
  mainWindow.loadFile(indexPath);

  mainWindow.show();
  mainWindow.focus();
}

// 监听窗口形态切换 (面板模式 / 胶囊模式)
ipcMain.on('toggle-capsule-mode', (_, isCapsule: boolean) => {
  if (!mainWindow) return;
  const target = isCapsule ? WINDOW_SIZES.CAPSULE : WINDOW_SIZES.NORMAL;
  mainWindow.setSize(target.width, target.height, true);
});

// 监听窗口控制
ipcMain.on('window-minimize', () => mainWindow?.minimize());
ipcMain.on('window-hide', () => mainWindow?.hide());
ipcMain.on('window-close', () => app.quit());
ipcMain.on('set-always-on-top', (_, always: boolean) => mainWindow?.setAlwaysOnTop(always));

app.whenReady().then(() => {
  createTray();
  createWindow();

  // 全局老板键 Alt+Shift+H
  globalShortcut.register('Alt+Shift+H', () => {
    toggleWindowVisible();
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
  if (tray) {
    tray.destroy();
    tray = null;
  }
});
