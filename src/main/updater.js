const { app } = require('electron');
const https = require('https');

const REPO = 'thoughtspot/spotter-desktop';
const RELEASES_URL = `https://github.com/${REPO}/releases/latest`;

// Compare dotted numeric versions. Returns false when either side is not
// parseable, so a tag like "nightly" can never masquerade as a newer release.
function isNewerVersion(latest, current) {
  const parse = (v) => {
    const match = /^v?(\d+)\.(\d+)\.(\d+)/.exec(String(v).trim());
    return match ? [Number(match[1]), Number(match[2]), Number(match[3])] : null;
  };
  const l = parse(latest);
  const c = parse(current);
  if (!l || !c) return false;
  for (let i = 0; i < 3; i++) {
    if (l[i] > c[i]) return true;
    if (l[i] < c[i]) return false;
  }
  return false;
}

// Ask the GitHub API for the newest published release. Used when electron-updater
// cannot run — an unpackaged dev build, or a release published without the
// latest-mac.yml metadata that electron-updater needs.
function fetchLatestRelease() {
  return new Promise((resolve) => {
    const req = https.get(
      {
        hostname: 'api.github.com',
        path: `/repos/${REPO}/releases/latest`,
        headers: { 'User-Agent': 'spotter-desktop', Accept: 'application/vnd.github+json' },
        timeout: 10000,
      },
      (res) => {
        // Rate limits and missing repos come back as JSON that parses cleanly but
        // has no tag_name, so status has to be checked before reading the body.
        if (res.statusCode !== 200) {
          res.resume();
          return resolve(null);
        }
        let data = '';
        res.setEncoding('utf8');
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          try {
            const tag = JSON.parse(data).tag_name;
            resolve(typeof tag === 'string' ? tag : null);
          } catch {
            resolve(null);
          }
        });
      }
    );
    req.on('timeout', () => req.destroy());
    req.on('error', () => resolve(null));
  });
}

async function checkViaGitHub() {
  const tag = await fetchLatestRelease();
  if (tag && isNewerVersion(tag, app.getVersion())) {
    return { mode: 'manual', version: tag, url: RELEASES_URL };
  }
  return null;
}

let autoUpdater = null;
let downloadedVersion = null;

// Wire electron-updater once, forwarding the terminal state to the renderer so it
// can offer a restart. Returns null when auto-update is not usable here.
function getAutoUpdater(onUpdateReady) {
  if (autoUpdater) return autoUpdater;
  if (!app.isPackaged) return null;
  try {
    ({ autoUpdater } = require('electron-updater'));
  } catch {
    return null;
  }
  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;
  autoUpdater.on('update-downloaded', (info) => {
    downloadedVersion = info?.version || null;
    onUpdateReady?.({ mode: 'ready', version: downloadedVersion });
  });
  autoUpdater.on('error', (err) => {
    console.error('Auto-update failed:', err?.message || err);
  });
  return autoUpdater;
}

// Resolves to the banner state the renderer should show, or null when current.
async function checkForUpdates(onUpdateReady) {
  if (downloadedVersion) return { mode: 'ready', version: downloadedVersion };

  const updater = getAutoUpdater(onUpdateReady);
  if (!updater) return checkViaGitHub();

  try {
    const result = await updater.checkForUpdates();
    const version = result?.updateInfo?.version;
    if (version && isNewerVersion(version, app.getVersion())) {
      return { mode: 'downloading', version };
    }
    return null;
  } catch (err) {
    console.error('Auto-update check failed, falling back to release page:', err?.message || err);
    return checkViaGitHub();
  }
}

function quitAndInstall() {
  if (autoUpdater && downloadedVersion) autoUpdater.quitAndInstall();
}

module.exports = { REPO, RELEASES_URL, checkForUpdates, quitAndInstall };
