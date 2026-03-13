const { app, BrowserWindow, session, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

const configPath = path.join(app.getPath('userData'), 'spotter-config.json');

function readConfig() {
  try {
    return JSON.parse(fs.readFileSync(configPath, 'utf8'));
  } catch {
    return {};
  }
}

function writeConfig(data) {
  fs.writeFileSync(configPath, JSON.stringify(data, null, 2));
}

function isValidHttpsUrl(str) {
  try {
    const u = new URL(str);
    return u.protocol === 'https:';
  } catch {
    return false;
  }
}

let mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 16, y: 16 },
    backgroundColor: '#0a1628',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // Redirect source map requests to suppress console noise
  session.defaultSession.webRequest.onBeforeRequest((details, callback) => {
    if (details.url.endsWith('.js.map') || details.url.endsWith('.css.map')) {
      return callback({ redirectURL: 'data:application/json;charset=utf-8,%7B%22version%22%3A3%2C%22sources%22%3A%5B%5D%2C%22mappings%22%3A%22%22%7D' });
    }
    callback({});
  });

  // Strip framing and CSP restrictions so the embed iframe works
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    const headers = { ...details.responseHeaders };
    delete headers['x-frame-options'];
    delete headers['X-Frame-Options'];
    delete headers['content-security-policy'];
    delete headers['Content-Security-Policy'];
    delete headers['content-security-policy-report-only'];
    delete headers['Content-Security-Policy-Report-Only'];
    callback({ responseHeaders: headers });
  });

  mainWindow.loadFile(path.join(__dirname, '../../build/index.html'));

  // Prevent the SSO callback from navigating the main window away from the app
  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (!url.startsWith('file://')) {
      event.preventDefault();
    }
  });

  if (process.argv.includes('--devtools')) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => { mainWindow = null; });
}

ipcMain.handle('get-host-url', () => {
  return readConfig().hostUrl || null;
});

ipcMain.handle('set-host-url', (_event, url) => {
  if (typeof url !== 'string' || !isValidHttpsUrl(url)) {
    throw new Error('Invalid URL: must be a valid HTTPS URL');
  }
  const config = readConfig();
  config.hostUrl = new URL(url).origin;
  writeConfig(config);
  return true;
});

ipcMain.handle('clear-host-url', () => {
  const config = readConfig();
  delete config.hostUrl;
  writeConfig(config);
  return true;
});

ipcMain.handle('logout', async () => {
  await session.defaultSession.clearStorageData();
  await session.defaultSession.clearCache();
  await session.defaultSession.clearAuthCache();
  if (mainWindow) {
    mainWindow.loadFile(path.join(__dirname, '../../build/index.html'));
  }
});

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
