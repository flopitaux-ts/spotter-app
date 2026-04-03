const { app, BrowserWindow, session, ipcMain, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const https = require('https');

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
let currentTsHost = null;

function createWindow() {
  currentTsHost = readConfig().hostUrl || null;

  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 16, y: 16 },
    backgroundColor: '#ffffff',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // Cancel source map requests to suppress console noise
  session.defaultSession.webRequest.onBeforeRequest((details, callback) => {
    if (details.url.endsWith('.js.map') || details.url.endsWith('.css.map')) {
      return callback({ cancel: true });
    }
    callback({});
  });

  // Strip framing and CSP restrictions so the embed iframe works.
  // Only applied to responses from the configured ThoughtSpot host to avoid
  // weakening security headers on third-party requests (e.g. OIDC providers).
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    if (!currentTsHost || !details.url.startsWith(currentTsHost)) {
      return callback({});
    }
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

  // Keep the main window on the local file:// page at all times.
  // isMainFrame check is critical: will-navigate/will-redirect fire for ALL frames including
  // iframes — without this, the SpotterEmbed iframe's OIDC redirect to Okta gets blocked.
  const blockExternalNavigation = (event, url, isInPlace, isMainFrame) => {
    if (isMainFrame && !url.startsWith('file://')) {
      event.preventDefault();
    }
  };
  mainWindow.webContents.on('will-navigate', blockExternalNavigation);
  mainWindow.webContents.on('will-redirect', blockExternalNavigation);

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
  currentTsHost = config.hostUrl;
  return true;
});

ipcMain.handle('clear-host-url', () => {
  const config = readConfig();
  delete config.hostUrl;
  delete config.authToken;
  writeConfig(config);
  currentTsHost = null;
  return true;
});

ipcMain.handle('logout', async () => {
  await session.defaultSession.clearStorageData();
  await session.defaultSession.clearCache();
  await session.defaultSession.clearAuthCache();
  const config = readConfig();
  delete config.authToken;
  delete config.loggedIn;
  writeConfig(config);
  if (mainWindow) {
    mainWindow.loadFile(path.join(__dirname, '../../build/index.html'));
  }
});

ipcMain.handle('get-logged-in', () => {
  return readConfig().loggedIn || false;
});

ipcMain.handle('set-logged-in', (_event, value) => {
  const config = readConfig();
  config.loggedIn = !!value;
  writeConfig(config);
  return true;
});

// Open a dedicated BrowserWindow for OIDC login.
// Uses defaultSession so the resulting auth cookies are shared with the main window's embed.
// Injects a window.uploadMixpanelEvent stub on dom-ready to work around a ThoughtSpot
// staging bug where their /authorize page calls this function from a script that fails to
// load from CDNjs (the referenced axios version does not exist on that CDN).
// tsHost is read from the persisted config rather than trusted from the renderer.
ipcMain.handle('open-auth-window', async () => {
  const tsHost = readConfig().hostUrl;
  if (!tsHost) return { success: false };
  return new Promise((resolve) => {
    let resolved = false;
    const finish = (result) => {
      if (!resolved) {
        resolved = true;
        if (authWin && !authWin.isDestroyed()) authWin.close();
        resolve(result);
      }
    };

    const authWin = new BrowserWindow({
      width: 520,
      height: 680,
      title: 'Sign in to ThoughtSpot',
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        // defaultSession used by default — cookies shared with the main window
      },
    });

    authWin.loadURL(`${tsHost}/callosum/v1/oidc/login`);

    // Inject the stub on every dom-ready (fires on each page in the auth flow).
    // This must run before the XHR success callback that calls uploadMixpanelEvent.
    authWin.webContents.on('dom-ready', () => {
      authWin.webContents.executeJavaScript(
        'if (typeof window.uploadMixpanelEvent === "undefined") { window.uploadMixpanelEvent = function() {}; }'
      ).catch(() => {});
    });

    // Detect auth completion: ThoughtSpot redirects back to its main app after OIDC
    authWin.webContents.on('did-navigate', (_e, url) => {
      if (
        url.startsWith(tsHost) &&
        !url.includes('/authorize') &&
        !url.includes('/callosum/v1/oidc') &&
        !url.includes('/callosum/v1/saml')
      ) {
        finish({ success: true });
      }
    });

    authWin.on('closed', () => finish({ success: false }));
    setTimeout(() => finish({ success: false }), 10 * 60 * 1000);
  });
});

ipcMain.handle('check-for-updates', () => {
  const currentVersion = app.getVersion();
  return new Promise((resolve) => {
    const req = https.get(
      {
        hostname: 'api.github.com',
        path: '/repos/thoughtspot/spotter-desktop/releases/latest',
        headers: { 'User-Agent': 'spotter-desktop' },
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          try {
            const release = JSON.parse(data);
            resolve({ latestVersion: release.tag_name, currentVersion, url: release.html_url });
          } catch {
            resolve(null);
          }
        });
      }
    );
    req.on('error', () => resolve(null));
  });
});

ipcMain.handle('open-external', (_event, url) => {
  if (typeof url === 'string' && url.startsWith('https://github.com/thoughtspot/spotter-desktop')) {
    shell.openExternal(url);
  }
});

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
