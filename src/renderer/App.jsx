import React, { useEffect, useState, useCallback, useRef } from 'react';
import { init, AuthType, AuthStatus, logout } from '@thoughtspot/visual-embed-sdk';
import { SpotterEmbed, useEmbedRef } from '@thoughtspot/visual-embed-sdk/react';
import tsLogo from './logo.png';

const FONT_FAMILY = 'Lexend, "Lexend Fallback", system-ui, -apple-system, sans-serif';

const DARK_CUSTOMIZATIONS = {
  style: {
    customCSS: {
      variables: {
        '--ts-var-root-background': '#0a1628',
        '--ts-var-root-color': '#e2e8f0',
        '--ts-var-root-font-family': FONT_FAMILY,
        '--ts-var-nav-background': '#0d1b30',
        '--ts-var-nav-color': '#e2e8f0',
        '--ts-var-spotter-input-background': '#0d1b30',
        '--ts-var-spotter-prompt-background': '#0d1b30',
        '--ts-var-search-bar-background': '#1a2d4a',
        '--ts-var-search-bar-text-font-color': '#e2e8f0',
        '--ts-var-button--primary-background': '#2563eb',
        '--ts-var-button--primary-color': '#ffffff',
        '--ts-var-button--secondary-background': '#1a2d4a',
        '--ts-var-button--secondary-color': '#e2e8f0',
        '--ts-var-button--tertiary-background': 'transparent',
        '--ts-var-button--tertiary-color': '#e2e8f0',
        '--ts-var-menu-background': '#112038',
        '--ts-var-menu-color': '#e2e8f0',
        '--ts-var-menu--hover-background': '#1a2d4a',
        '--ts-var-dialog-body-background': '#0d1b30',
        '--ts-var-dialog-body-color': '#e2e8f0',
        '--ts-var-dialog-header-background': '#0d1b30',
        '--ts-var-dialog-header-color': '#e2e8f0',
        '--ts-var-dialog-footer-background': '#0d1b30',
        '--ts-var-viz-background': '#112038',
        '--ts-var-viz-title-color': '#e2e8f0',
        '--ts-var-viz-description-color': '#94a3b8',
        '--ts-var-answer-data-panel-background-color': '#0d1b30',
        '--ts-var-answer-edit-panel-background-color': '#0d1b30',
        '--ts-var-chip-background': '#1a2d4a',
        '--ts-var-chip-color': '#e2e8f0',
        '--ts-var-chip--hover-background': '#243b5c',
        '--ts-var-chip--active-background': '#2563eb',
        '--ts-var-list-hover-background': '#1a2d4a',
        '--ts-var-list-selected-background': '#1a2d4a',
        '--ts-var-segment-control-hover-background': '#1a2d4a',
        '--ts-var-spotter-chat-width': '100%',
      },
      rules_UNSTABLE: {
        // Base text color for all elements
        'body, body *': { 'color': '#e2e8f0 !important' },
        // Layout
        'html': { 'overflow-x': 'clip !important', 'width': '100% !important' },
        'body': { 'background-color': '#0a1628 !important', 'width': '100% !important', 'max-width': '100% !important', 'overflow-x': 'clip !important', 'box-sizing': 'border-box !important' },
        'div[class]': { 'background-color': 'transparent !important', 'background-image': 'none !important', 'border-color': 'transparent !important' },
        // Sidebar panels
        '[class*="sidebar"], [class*="pastConversation"], [class*="conversationList"], [class*="sidePanel"], [class*="chatHistory"]': { 'background-color': '#0d1b30 !important' },
        '[class*="sidebar"]': { 'border-color': '#1a2d4a !important' },
        '[class*="newChat"]': { 'background-color': '#1a2d4a !important', 'border-color': '#1a2d4a !important' },
        // Chat input border — use div prefix to beat div[class] border-color:transparent (specificity 0-1-1)
        'div[class*="promptEditor"], div[class*="promptPanel"], div[class*="chatFooter"]': { 'border': '1px solid #ffffff !important', 'border-radius': '16px !important' },
        // Chat message containers — layout + word wrap
        '[class*="chatMessages"], [class*="chatBody"], [class*="conversationThread"], [class*="messageList"], [class*="chatContent"], [class*="messageContainer"], [class*="conversationContainer"]': { 'overflow-y': 'auto !important', 'width': '100% !important', 'max-width': '100% !important', 'box-sizing': 'border-box !important', 'word-break': 'break-word !important', 'overflow-wrap': 'break-word !important', 'white-space': 'normal !important' },
        // Input & rich text editor text (white for better contrast in inputs)
        'textarea, input, [contenteditable], [class*="inputBox"], [class*="input-with-tokens"], [class*="chatInput"], [class*="chatInput"] *, [class*="ProseMirror"], [class*="prosemirror"], [class*="tiptap"], [class*="Tiptap"]': { 'color': '#ffffff !important' },
        // Placeholders
        'textarea::placeholder, input::placeholder, [contenteditable]:empty::before, [contenteditable][data-placeholder]::before, [data-placeholder]::before, .ProseMirror p.is-editor-empty:first-child::before, [class*="placeholder"], [class*="Placeholder"]': { 'color': '#ffffff !important' },
        // SVG icons
        'svg': { 'fill': '#ffffff !important', 'color': '#ffffff !important' },
        'svg path, svg circle, svg rect': { 'fill': '#ffffff !important' },
      },
    },
  },
};

const LIGHT_CUSTOMIZATIONS = {
  style: {
    customCSS: {
      variables: {
        '--ts-var-root-font-family': FONT_FAMILY,
        '--ts-var-spotter-chat-width': '100%',
      },
      rules_UNSTABLE: {
        'html': { 'overflow-x': 'clip !important', 'width': '100% !important' },
        'body': { 'width': '100% !important', 'max-width': '100% !important', 'overflow-x': 'clip !important', 'box-sizing': 'border-box !important' },
        '[class*="chatMessages"], [class*="chatBody"], [class*="conversationThread"], [class*="messageList"], [class*="chatContent"], [class*="messageContainer"], [class*="conversationContainer"]': { 'overflow-y': 'auto !important', 'width': '100% !important', 'max-width': '100% !important', 'box-sizing': 'border-box !important', 'word-break': 'break-word !important', 'overflow-wrap': 'break-word !important', 'white-space': 'normal !important' },
      },
    },
  },
};

// Shared utility: extract a short friendly label from a ThoughtSpot host URL
function getHostLabel(tsHost) {
  try { return new URL(tsHost).hostname.split('.')[0]; } catch { return 'Spotter'; }
}

// Simple semver comparison — returns true if latest > current
function isNewerVersion(latest, current) {
  const parse = (v) => v.replace(/^v/, '').split('.').map(Number);
  const [l, c] = [parse(latest), parse(current)];
  for (let i = 0; i < 3; i++) {
    if ((l[i] || 0) > (c[i] || 0)) return true;
    if ((l[i] || 0) < (c[i] || 0)) return false;
  }
  return false;
}

// ---------- Update banner ----------

function UpdateBanner({ version, url, onDismiss }) {
  return (
    <div className="update-banner">
      <span>✨ Version {version} is available</span>
      <button className="update-banner-btn" onClick={() => window.electronAPI?.openExternal(url)}>
        Download
      </button>
      <button className="update-banner-dismiss" onClick={onDismiss}>✕</button>
    </div>
  );
}

// ---------- SDK init ----------

function initializeSDK(tsHost, customizations, onSuccess, onAuthFailed) {
  const authEE = init({
    thoughtSpotHost: tsHost,
    authType: AuthType.None,
    customizations,
    suppressNoCookieAccessAlert: true,
  });

  if (authEE) {
    authEE
      .on(AuthStatus.SUCCESS, () => onSuccess?.())
      .on(AuthStatus.SDK_SUCCESS, () => onSuccess?.())
      .on(AuthStatus.FAILURE, () => onAuthFailed?.());
  }
}

// ---------- Error Boundary ----------

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() { return { hasError: true }; }
  render() {
    if (this.state.hasError) {
      return (
        <div className="loading-overlay">
          <p className="loading-text">Something went wrong loading Spotter.</p>
          <button className="setup-button" onClick={() => window.location.reload()}>
            Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// ---------- Icons ----------

function SunIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5"/>
      <line x1="12" y1="1" x2="12" y2="3"/>
      <line x1="12" y1="21" x2="12" y2="23"/>
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
      <line x1="1" y1="12" x2="3" y2="12"/>
      <line x1="21" y1="12" x2="23" y2="12"/>
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
    </svg>
  );
}

// ---------- Shared logo ----------

function SpotterLogo() {
  return (
    <img src={tsLogo} alt="ThoughtSpot" style={{ width: 64, height: 64, borderRadius: 16 }} />
  );
}

// ---------- Setup page ----------

function SetupPage({ onConnect, savedUrl }) {
  const [url, setUrl] = useState(savedUrl || '');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    let cleaned = url.trim();
    if (!cleaned) { setError('Please enter a URL'); return; }
    if (!cleaned.startsWith('http')) cleaned = 'https://' + cleaned;
    try {
      const parsed = new URL(cleaned);
      cleaned = parsed.origin;
    } catch {
      setError('Invalid URL'); return;
    }
    setError('');
    onConnect(cleaned);
  };

  return (
    <div className="app-container">
      <div className="titlebar">
        <span className="titlebar-title">Spotter</span>
      </div>
      <div className="setup-page">
        <div className="setup-card">
          <div className="setup-logo">
            <SpotterLogo />
          </div>
          <h1 className="setup-title">Connect to ThoughtSpot</h1>
          <p className="setup-subtitle">
            Enter the URL of your ThoughtSpot instance to launch Spotter
          </p>
          <form className="setup-form" onSubmit={handleSubmit}>
            <input
              className="setup-input"
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="e.g. https://mycompany.thoughtspot.cloud"
              autoFocus
            />
            {error && <p className="setup-error">{error}</p>}
            <button className="setup-button" type="submit">Connect</button>
          </form>
          <p className="setup-hint">
            This is the URL you use to access ThoughtSpot in your browser
          </p>
        </div>
      </div>
    </div>
  );
}

// ---------- Login page ----------

function LoginPage({ tsHost, onAuthDone, onBack }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const hostLabel = (() => {
    try { return new URL(tsHost).hostname; } catch { return tsHost; }
  })();

  const handleSignIn = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await window.electronAPI?.openAuthWindow();
      if (result?.success) {
        onAuthDone();
      } else {
        setError('Sign in was cancelled or timed out. Please try again.');
      }
    } catch {
      setError('Failed to open the sign-in window.');
    }
    setLoading(false);
  };

  return (
    <div className="app-container">
      <div className="titlebar">
        <span className="titlebar-title">Spotter</span>
      </div>
      <div className="setup-page">
        <div className="setup-card">
          <div className="setup-logo">
            <SpotterLogo />
          </div>
          <h1 className="setup-title">Sign in to ThoughtSpot</h1>
          <p className="setup-subtitle">{hostLabel}</p>
          <button
            className="setup-button"
            onClick={handleSignIn}
            disabled={loading}
          >
            {loading ? 'Opening sign-in window…' : 'Sign in'}
          </button>
          {error && <p className="setup-error">{error}</p>}
          <button className="setup-back-btn" onClick={onBack}>
            ← Wrong URL? Go back
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------- Spotter page ----------

function SpotterPage({ tsHost, onDisconnect, onAuthLost }) {
  const embedRef = useEmbedRef();
  const [sdkReady, setSdkReady] = useState(false);
  const [theme, setTheme] = useState('light');
  const [embedKey, setEmbedKey] = useState(0);
  const sdkKeyRef = useRef(null);

  const customizations = theme === 'dark' ? DARK_CUSTOMIZATIONS : LIGHT_CUSTOMIZATIONS;

  useEffect(() => {
    const key = `${tsHost}:${theme}`;
    if (sdkKeyRef.current === key) return; // already initialized for this config
    sdkKeyRef.current = key;
    initializeSDK(tsHost, customizations, () => setSdkReady(true), onAuthLost);
  }, [tsHost, theme]);

  const handleToggleTheme = useCallback(() => {
    setTheme(t => t === 'dark' ? 'light' : 'dark');
    setSdkReady(false);
    setEmbedKey(k => k + 1);
  }, []);

  const handleSignInAgain = useCallback(async () => {
    const result = await window.electronAPI?.openAuthWindow();
    if (result?.success) {
      const key = `${tsHost}:${theme}`;
      sdkKeyRef.current = key; // keep key in sync to prevent duplicate init from effect
      setSdkReady(false);
      setEmbedKey(k => k + 1);
      initializeSDK(tsHost, customizations, () => setSdkReady(true), onAuthLost);
    }
  }, [tsHost, theme, customizations, onAuthLost]);

  const handleLogout = useCallback(async () => {
    try { logout(); } catch (e) { console.error('SDK logout error:', e); }
    await window.electronAPI?.logout();
  }, []);

  const hostLabel = getHostLabel(tsHost);

  if (!sdkReady) {
    return (
      <div className="app-container">
        <div className="titlebar">
          <span className="titlebar-title">{hostLabel} - Spotter</span>
          <div className="titlebar-actions">
            <button className="titlebar-btn" onClick={handleLogout}>Logout</button>
          </div>
        </div>
        <div className="loading-overlay">
          <div className="spinner" />
          <p className="loading-text">Connecting to ThoughtSpot...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <div className="titlebar">
        <span className="titlebar-title">{hostLabel} - Spotter</span>
        <div className="titlebar-actions">
          <button className="titlebar-btn titlebar-btn--icon" onClick={handleToggleTheme} title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}>
            {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
          </button>
          <button className="titlebar-btn" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>
      <div className="embed-container" id="ts-embed">
        <ErrorBoundary>
          <SpotterEmbed
            key={embedKey}
            ref={embedRef}
            frameParams={{ width: '100%', height: '100%' }}
            worksheetId="auto_mode"
            updatedSpotterChatPrompt={true}
            spotterSidebarConfig={{
              enablePastConversationsSidebar: true,
              spotterSidebarTitle: 'My Conversations',
              spotterSidebarDefaultExpanded: false,
            }}
          />
        </ErrorBoundary>
      </div>
    </div>
  );
}

// ---------- Root ----------

export default function App() {
  const [tsHost, setTsHost] = useState(null);
  const [authDone, setAuthDone] = useState(false);
  const [checking, setChecking] = useState(true);
  const [updateInfo, setUpdateInfo] = useState(null);

  useEffect(() => {
    (async () => {
      if (window.electronAPI?.getHostUrl) {
        const saved = await window.electronAPI.getHostUrl();
        if (saved) setTsHost(saved);
      }
      // Skip LoginPage if already authenticated from a previous session
      if (window.electronAPI?.getLoggedIn) {
        const loggedIn = await window.electronAPI.getLoggedIn();
        if (loggedIn) setAuthDone(true);
      }
      setChecking(false);
    })();
  }, []);

  // Check for updates once on startup
  useEffect(() => {
    (async () => {
      try {
        const info = await window.electronAPI?.checkForUpdates();
        if (info && isNewerVersion(info.latestVersion, info.currentVersion)) {
          setUpdateInfo(info);
        }
      } catch {
        // Silently ignore update check failures
      }
    })();
  }, []);

  const handleConnect = useCallback(async (url) => {
    if (window.electronAPI?.setHostUrl) {
      await window.electronAPI.setHostUrl(url);
    }
    setTsHost(url);
  }, []);

  const handleAuthDone = useCallback(async () => {
    await window.electronAPI?.setLoggedIn(true);
    setAuthDone(true);
  }, []);

  const handleAuthLost = useCallback(async () => {
    await window.electronAPI?.setLoggedIn(false);
    setAuthDone(false);
  }, []);

  const handleDisconnect = useCallback(async () => {
    await window.electronAPI?.clearHostUrl();
    setTsHost(null);
    setAuthDone(false);
  }, []);

  const updateBanner = updateInfo ? (
    <UpdateBanner
      version={updateInfo.latestVersion}
      url={updateInfo.url}
      onDismiss={() => setUpdateInfo(null)}
    />
  ) : null;

  if (checking) {
    return (
      <div className="app-container">
        {updateBanner}
        <div className="titlebar"><span className="titlebar-title">Spotter</span></div>
        <div className="loading-overlay"><div className="spinner" /></div>
      </div>
    );
  }

  if (!tsHost) {
    return (
      <>
        {updateBanner}
        <SetupPage onConnect={handleConnect} savedUrl="" />
      </>
    );
  }

  if (!authDone) {
    return (
      <>
        {updateBanner}
        <LoginPage tsHost={tsHost} onAuthDone={handleAuthDone} onBack={handleDisconnect} />
      </>
    );
  }

  return (
    <>
      {updateBanner}
      <SpotterPage tsHost={tsHost} onDisconnect={handleDisconnect} onAuthLost={handleAuthLost} />
    </>
  );
}
