// URL predicates shared by the window/session hardening in main.js and the Org
// REST calls in orgs.js. Both decide whether a URL may be trusted, and they must
// answer that the same way.

function protocolOf(url) {
  try { return new URL(url).protocol; } catch { return ''; }
}

// Compare origins, never prefixes: "https://acme.thoughtspot.cloud" is a string
// prefix of "https://acme.thoughtspot.cloud.example.com", so startsWith would
// treat an unrelated host as trusted.
function isSameOrigin(url, origin) {
  if (!origin) return false;
  try { return new URL(url).origin === origin; } catch { return false; }
}

function isValidHttpsUrl(str) {
  try { return new URL(str).protocol === 'https:'; } catch { return false; }
}

module.exports = { protocolOf, isSameOrigin, isValidHttpsUrl };
