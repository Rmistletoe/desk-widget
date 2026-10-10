import { app, BrowserWindow, ipcMain, globalShortcut, screen, Tray, Menu, nativeImage } from 'electron';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';

// 核心网络与启动加速开关
app.commandLine.appendSwitch('no-proxy-server');
app.commandLine.appendSwitch('disable-features', 'CalculateNativeWinOcclusion');
app.commandLine.appendSwitch('disable-background-networking');
app.commandLine.appendSwitch('disable-component-update');
app.commandLine.appendSwitch('disable-renderer-backgrounding');
app.commandLine.appendSwitch('disable-backgrounding-occluded-windows');

app.setName('DeskWidget');

// 单实例锁定：杜绝重复启动、避免锁竞争和托盘僵尸堆叠
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;

// 高性能日志打点
const logFile = path.join(process.cwd(), 'startup.log');
function logTime(msg: string) {
  const line = `[${new Date().toISOString()}] (+${performance.now().toFixed(1)}ms) ${msg}\n`;
  try {
    fs.appendFileSync(logFile, line);
  } catch (e) {}
}

try {
  fs.writeFileSync(logFile, `=== Startup Benchmark ===\n`);
} catch (e) {}
logTime('Index.ts evaluated');

// 内嵌 32x32 独立透明托盘便签图标（Base64 嵌入，绝不受磁盘路径与丢失影响）
const TRAY_ICON_DATA =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAVElEQVR4nGNgGAVI4Os87v/0wANqOU5HjDpg1AED7oB/n4//pycedcDQcMDNcjaq4KEbAqMOGHAHjCbCUQcMuAOokdiGdgiMOmBkOYCejsBq+YgFACTlOhe2usAsAAAAAElFTkSuQmCC';

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
  logTime('createWindow start');
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width: screenWidth } = primaryDisplay.workAreaSize;

  mainWindow = new BrowserWindow({
    x: screenWidth - 340,
    y: 80,
    width: WINDOW_SIZES.NORMAL.width,
    height: WINDOW_SIZES.NORMAL.height,
    frame: false,
    transparent: true,
    backgroundColor: '#00000000',
    alwaysOnTop: true,
    resizable: false,
    skipTaskbar: true,
    hasShadow: false, // 核心：透明窗口禁用 OS 级别 hasShadow，彻底消除 Windows DWM 穿透合成卡顿！
    show: false, // 核心：首帧就绪前不白屏，ready-to-show 即刻毫秒级展示
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
      backgroundThrottling: false, // 核心：防止 skipTaskbar 窗口被系统误判为后台而降频挂起
    },
  });
  logTime('BrowserWindow instance constructed');

  mainWindow.webContents.on('did-start-loading', () => logTime('webContents: did-start-loading'));
  mainWindow.webContents.on('dom-ready', () => logTime('webContents: dom-ready'));
  mainWindow.webContents.on('did-finish-load', () => logTime('webContents: did-finish-load'));

  let shown = false;
  const doShow = () => {
    if (shown || !mainWindow) return;
    shown = true;
    logTime('Executing mainWindow.show() and focus()');
    mainWindow.show();
    mainWindow.focus();
  };

  mainWindow.once('ready-to-show', () => {
    logTime('mainWindow: ready-to-show fired');
    doShow();
  });

  // 兜底超时：如果 ready-to-show 500ms 内未触发，强制显示，绝不阻断界面
  setTimeout(() => {
    if (!shown) {
      logTime('Fallback show triggered after 500ms');
      doShow();
    }
  }, 500);

  const indexPath = path.join(__dirname, '../dist/index.html');
  logTime('Calling mainWindow.loadFile: ' + indexPath);
  mainWindow.loadFile(indexPath);
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

// 多实例呼起已有窗口
app.on('second-instance', () => {
  if (mainWindow) {
    if (!mainWindow.isVisible()) mainWindow.show();
    mainWindow.focus();
  }
});

app.whenReady().then(() => {
  logTime('app.whenReady resolved');
  createTray();
  logTime('createTray done');
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
