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

// ========================
// 独立配置文件与数据持久化逻辑
// ========================
function getConfigDir(): string {
  // 打包生产环境保存在 exe 同级目录，开发环境保存在工程根目录
  if (app.isPackaged) {
    return path.dirname(process.execPath);
  }
  return process.cwd();
}

const DEFAULT_CONFIG = {
  workStartTime: '09:00',
  workEndTime: '18:00',
  payday: 15,
  alwaysOnTop: true,
  opacity: 0.95,
  customMessage: '今天也要保持好心情，下班一起吃好吃的～',
};

const DEFAULT_DATA = {
  todos: [
    {
      id: '1',
      text: '完成今日重点任务',
      completed: false,
      priority: 'important',
      createdAt: Date.now(),
    },
    {
      id: '2',
      text: '下班准时打卡撤退 🎉',
      completed: false,
      priority: 'normal',
      createdAt: Date.now() - 1000,
    },
  ],
  note: {
    id: 'main-note',
    content: '【随手备忘】\n点击这里随手记录灵感、待办或备忘事项。\n打字实时自动保存，随时关闭不丢数据。',
    color: 'yellow',
    updatedAt: Date.now(),
  },
};

function loadConfigFromFile() {
  const dir = getConfigDir();
  const cfgPath = path.join(dir, 'config.json');
  try {
    if (fs.existsSync(cfgPath)) {
      const content = fs.readFileSync(cfgPath, 'utf-8');
      return { ...DEFAULT_CONFIG, ...JSON.parse(content) };
    } else {
      // 首次自动生成带标准缩进的独立配置文件
      fs.writeFileSync(cfgPath, JSON.stringify(DEFAULT_CONFIG, null, 2), 'utf-8');
      return DEFAULT_CONFIG;
    }
  } catch (e) {
    console.error('Error loading config.json:', e);
    return DEFAULT_CONFIG;
  }
}

function saveConfigToFile(cfg: any) {
  const dir = getConfigDir();
  const cfgPath = path.join(dir, 'config.json');
  try {
    fs.writeFileSync(cfgPath, JSON.stringify(cfg, null, 2), 'utf-8');
  } catch (e) {
    console.error('Error saving config.json:', e);
  }
}

function loadDataFromFile() {
  const dir = getConfigDir();
  const dataPath = path.join(dir, 'data.json');
  try {
    if (fs.existsSync(dataPath)) {
      const content = fs.readFileSync(dataPath, 'utf-8');
      return { ...DEFAULT_DATA, ...JSON.parse(content) };
    } else {
      // 首次自动生成带标准缩进的数据文件
      fs.writeFileSync(dataPath, JSON.stringify(DEFAULT_DATA, null, 2), 'utf-8');
      return DEFAULT_DATA;
    }
  } catch (e) {
    console.error('Error loading data.json:', e);
    return DEFAULT_DATA;
  }
}

function saveDataToFile(data: any) {
  const dir = getConfigDir();
  const dataPath = path.join(dir, 'data.json');
  try {
    fs.writeFileSync(dataPath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (e) {
    console.error('Error saving data.json:', e);
  }
}

// 预热加载一次确保文件创建
const initialConfig = loadConfigFromFile();
const initialData = loadDataFromFile();

// IPC 数据通信响应
ipcMain.on('get-initial-app-state', (event) => {
  event.returnValue = {
    config: loadConfigFromFile(),
    data: loadDataFromFile(),
  };
});

ipcMain.on('save-config', (_, cfg) => {
  saveConfigToFile(cfg);
  if (cfg.alwaysOnTop !== undefined && mainWindow) {
    mainWindow.setAlwaysOnTop(Boolean(cfg.alwaysOnTop));
  }
});

ipcMain.on('save-data', (_, data) => {
  saveDataToFile(data);
});

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
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width: screenWidth } = primaryDisplay.workAreaSize;
  const currentCfg = loadConfigFromFile();

  mainWindow = new BrowserWindow({
    x: screenWidth - 340,
    y: 80,
    width: WINDOW_SIZES.NORMAL.width,
    height: WINDOW_SIZES.NORMAL.height,
    frame: false,
    transparent: true,
    backgroundColor: '#00000000',
    alwaysOnTop: currentCfg.alwaysOnTop ?? true,
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

  let shown = false;
  const doShow = () => {
    if (shown || !mainWindow) return;
    shown = true;
    mainWindow.show();
    mainWindow.focus();
  };

  mainWindow.once('ready-to-show', () => {
    doShow();
  });

  // 兜底超时：如果 ready-to-show 500ms 内未触发，强制显示
  setTimeout(() => {
    if (!shown) {
      doShow();
    }
  }, 500);

  const indexPath = path.join(__dirname, '../dist/index.html');
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
