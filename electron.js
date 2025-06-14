const { app, BrowserWindow } = require('electron');
const path = require('path');

// 判断是否为开发环境
const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

let mainWindow;

function createWindow() {
  // 创建浏览器窗口
  mainWindow = new BrowserWindow({
    width: 1500,
    height: 890,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: !isDev // 开发环境下关闭安全限制
    },
    // icon 路径现在从根目录开始算
    icon: path.join(__dirname, 'assets/icon.png'),
    title: "Lyra's Chat Exporter"
  });

  // 加载应用
  if (isDev) {
    // 开发环境：加载 localhost，端口改成 3789！
    mainWindow.loadURL('http://localhost:3789'); // <-- 看这里！
    mainWindow.webContents.openDevTools();
  } else {
    // 生产环境：加载打包后的文件，路径也需要调整
    mainWindow.loadFile(path.join(__dirname, 'build/index.html')); // <-- 看这里！
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Electron 准备就绪
app.whenReady().then(createWindow);

// 所有窗口关闭时退出
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});
