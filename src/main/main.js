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

function belongsToHost(requestUrl, tsOrigin) {
  try {
    return new URL(requestUrl).origin === tsOrigin;
  } catch {
    return false;
  }
}

let mainWindow = null;
let currentTsOrigin = null;

// Load saved host on startup
const savedConfig = readConfig();
if (savedConfig.hostUrl && isValidHttpsUrl(savedConfig.hostUrl)) {
  currentTsOrigin = new URL(savedConfig.hostUrl).origin;
}

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

  // Redirect source map requests to empty valid JSON
  session.defaultSession.webRequest.onBeforeRequest((details, callback) => {
    if (details.url.endsWith('.js.map') || details.url.endsWith('.css.map')) {
      return callback({ redirectURL: 'data:application/json;charset=utf-8,%7B%22version%22%3A3%2C%22sources%22%3A%5B%5D%2C%22mappings%22%3A%22%22%7D' });
    }
    callback({});
  });

  // Only strip frame/CSP headers and add CORS for the configured ThoughtSpot host
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    if (!currentTsOrigin || !belongsToHost(details.url, currentTsOrigin)) {
      return callback({});
    }

    const headers = { ...details.responseHeaders };
    delete headers['x-frame-options'];
    delete headers['X-Frame-Options'];
    delete headers['content-security-policy'];
    delete headers['Content-Security-Policy'];

    const hasACOrigin = Object.keys(headers).some(
      (k) => k.toLowerCase() === 'access-control-allow-origin',
    );
    if (!hasACOrigin) {
      headers['Access-Control-Allow-Origin'] = ['*'];
      headers['Access-Control-Allow-Methods'] = ['GET, POST, PUT, DELETE, OPTIONS'];
      headers['Access-Control-Allow-Headers'] = ['*'];
    }

    callback({ responseHeaders: headers });
  });

  mainWindow.loadFile(path.join(__dirname, '../../build/index.html'));

  if (process.argv.includes('--devtools')) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// --- IPC handlers (registered once) ---

ipcMain.handle('get-host-url', () => {
  const config = readConfig();
  return config.hostUrl || null;
});

ipcMain.handle('set-host-url', (_event, url) => {
  if (typeof url !== 'string' || !isValidHttpsUrl(url)) {
    throw new Error('Invalid URL: must be a valid HTTPS URL');
  }
  const origin = new URL(url).origin;
  const config = readConfig();
  config.hostUrl = origin;
  writeConfig(config);
  currentTsOrigin = origin;
  return true;
});

ipcMain.handle('clear-host-url', () => {
  const config = readConfig();
  delete config.hostUrl;
  writeConfig(config);
  currentTsOrigin = null;
  return true;
});

ipcMain.handle('open-login', (_event, tsHost) => {
  if (typeof tsHost !== 'string' || !isValidHttpsUrl(tsHost)) {
    throw new Error('Invalid URL: must be a valid HTTPS URL');
  }

  const requestedOrigin = new URL(tsHost).origin;
  if (currentTsOrigin && requestedOrigin !== currentTsOrigin) {
    throw new Error('URL mismatch: does not match configured host');
  }

  return new Promise((resolve) => {
    const loginWin = new BrowserWindow({
      width: 900,
      height: 700,
      parent: mainWindow,
      modal: true,
      backgroundColor: '#ffffff',
      webPreferences: {
        contextIsolation: true,
        nodeIntegration: false,
      },
    });

    loginWin.setMenuBarVisibility(false);
    loginWin.loadURL(requestedOrigin);

    const checkNav = (url) => {
      if (url.startsWith(requestedOrigin) && !url.includes('/oidc/login') && !url.includes('/authorize')) {
        loginWin.close();
      }
    };

    loginWin.webContents.on('did-navigate', (_e, url) => checkNav(url));
    loginWin.webContents.on('did-navigate-in-page', (_e, url) => checkNav(url));
    loginWin.webContents.on('did-redirect-navigation', (_e, url) => checkNav(url));

    loginWin.on('closed', () => {
      resolve(true);
    });
  });
});

ipcMain.handle('logout', async () => {
  const ses = session.defaultSession;
  await ses.clearStorageData();
  await ses.clearCache();
  await ses.clearAuthCache();
  currentTsOrigin = null;
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
