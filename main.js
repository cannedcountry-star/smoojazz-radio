const { app, BrowserWindow, Tray, Menu, ipcMain, nativeImage } = require('electron');
const path = require('path');

const WIN_W = 380, WIN_H = 600;
let win = null;
let tray = null;
let quitting = false;

// 二重起動防止（2つ目を起動したら既存の窓を前面に出す）
if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on('second-instance', () => showWindow());
  app.whenReady().then(() => { createWindow(); createTray(); });
}

function createWindow() {
  win = new BrowserWindow({
    width: WIN_W, height: WIN_H, minWidth: 320, minHeight: 420,
    frame: false,            // 枠なし
    alwaysOnTop: true,       // 常に最前面
    skipTaskbar: false,      // タスクバーにも表示（× で閉じたときはトレイに格納）
    resizable: true,
    backgroundColor: '#14110f',
    icon: path.join(__dirname, 'build', 'icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      backgroundThrottling: false,   // 非表示中も再生・曲名更新を止めない
    },
  });
  win.setMenuBarVisibility(false);
  win.loadFile('index.html');

  // × を押しても終了せずトレイに格納する
  win.on('close', (e) => {
    if (!quitting) { e.preventDefault(); win.hide(); }
  });
}

function createTray() {
  const icon = nativeImage.createFromPath(path.join(__dirname, 'build', 'tray.png')).resize({ width: 16, height: 16 });
  tray = new Tray(icon);
  tray.setToolTip('Smooth Jazz Radio');
  tray.setContextMenu(Menu.buildFromTemplate([
    { label: '表示 / 非表示', click: toggleWindow },
    { type: 'separator' },
    { label: '終了', click: () => { quitting = true; app.quit(); } },
  ]));
  tray.on('click', toggleWindow);
}

function showWindow() {
  if (!win) return;
  if (win.isMinimized()) win.restore();
  win.show();
  win.focus();
}
function toggleWindow() {
  if (!win) return;
  win.isVisible() && !win.isMinimized() ? win.hide() : showWindow();
}

ipcMain.on('widget:hide', () => win && win.hide());
ipcMain.on('widget:minimize', () => win && win.minimize());

app.on('window-all-closed', (e) => e.preventDefault()); // トレイ常駐なので閉じても終了しない
