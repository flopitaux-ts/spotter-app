const { app } = require('electron');
const path = require('path');
const fs = require('fs');

const configPath = path.join(app.getPath('userData'), 'spotter-config.json');

let cache = null;

function read() {
  if (cache) return cache;
  try {
    const parsed = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    cache = parsed && typeof parsed === 'object' ? parsed : {};
  } catch (err) {
    if (err.code !== 'ENOENT') {
      console.error('Could not read config, starting fresh:', err.message);
    }
    cache = {};
  }
  return cache;
}

// Write to a temp file and rename over the original. A crash partway through a
// direct write leaves truncated JSON, and read() silently falls back to {} —
// which drops the user back on the setup screen with their host URL gone.
function write(next) {
  cache = next;
  const tmp = `${configPath}.${process.pid}.tmp`;
  try {
    fs.writeFileSync(tmp, JSON.stringify(next, null, 2));
    fs.renameSync(tmp, configPath);
  } catch (err) {
    console.error('Could not persist config:', err.message);
    try { fs.unlinkSync(tmp); } catch { /* nothing to clean up */ }
  }
}

// Merge a patch into the config. Keys set to undefined are removed.
function update(patch) {
  const next = { ...read(), ...patch };
  for (const [key, value] of Object.entries(patch)) {
    if (value === undefined) delete next[key];
  }
  write(next);
  return next;
}

module.exports = { configPath, read, update };
