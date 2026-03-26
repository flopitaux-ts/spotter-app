import React, { useEffect, useState, useCallback } from 'react';
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
      },
      rules_UNSTABLE: {
        'body, body *': { 'color': '#e2e8f0 !important' },
        'h1, h2, h3, h4, h5, h6, p, span, label, a, div': { 'color': '#e2e8f0 !important' },
        'div[class]': { 'background-color': 'transparent !important', 'background-image': 'none !important' },
        'body': { 'background-color': '#0a1628 !important' },
        '[class*="sidebar"]': { 'background-color': '#0d1b30 !important', 'border-color': '#1a2d4a !important' },
        '[class*="pastConversation"]': { 'background-color': '#0d1b30 !important' },
        '[class*="conversationList"]': { 'background-color': '#0d1b30 !important' },
        '[class*="sidePanel"]': { 'background-color': '#0d1b30 !important' },
        '[class*="chatHistory"]': { 'background-color': '#0d1b30 !important' },
        '[class*="newChat"]': { 'background-color': '#1a2d4a !important', 'border-color': '#1a2d4a !important' },
        '/* b */ div[class]': { 'border-color': 'transparent !important' },
        '[class*="promptEditor"]': { 'border': '1px solid #ffffff !important', 'border-radius': '16px !important' },
        '[class*="promptPanel"]': { 'border': '1px solid #ffffff !important', 'border-radius': '16px !important' },
        '[class*="chatFooter"]': { 'border': '1px solid #ffffff !important', 'border-radius': '16px !important' },
        'textarea, input': { 'color': '#ffffff !important' },
        'textarea::placeholder, input::placeholder': { 'color': '#ffffff !important' },
        '[class*="inputBox"], [class*="input-with-tokens"]': { 'color': '#ffffff !important' },
        '[class*="inputBox"]::placeholder, [class*="input-with-tokens"]::placeholder': { 'color': '#ffffff !important' },
        '[class*="chatInput"], [class*="chatInput"] *': { 'color': '#ffffff !important' },
        '[class*="prompt"] textarea': { 'color': '#ffffff !important' },
        '[class*="placeholder"], [class*="Placeholder"]': { 'color': '#ffffff !important' },
        '[contenteditable]': { 'color': '#ffffff !important' },
        '[contenteditable]:empty::before, [contenteditable][data-placeholder]::before': { 'color': '#ffffff !important' },
        '[data-placeholder]::before': { 'color': '#ffffff !important' },
        '[class*="ProseMirror"], [class*="prosemirror"]': { 'color': '#ffffff !important' },
        '.ProseMirror': { 'color': '#ffffff !important' },
        '.ProseMirror p.is-editor-empty:first-child::before': { 'color': '#ffffff !important' },
        '[class*="tiptap"], [class*="Tiptap"]': { 'color': '#ffffff !important' },
        'svg': { 'fill': '#ffffff !important', 'color': '#ffffff !important' },
        'svg path': { 'fill': '#ffffff !important' },
        'svg circle': { 'fill': '#ffffff !important' },
        'svg rect': { 'fill': '#ffffff !important' },
        'button svg, button svg path': { 'fill': '#ffffff !important', 'color': '#ffffff !important' },
        '[class*="icon"] svg, [class*="Icon"] svg': { 'fill': '#ffffff !important', 'color': '#ffffff !important' },
        '[class*="icon"] svg path, [class*="Icon"] svg path': { 'fill': '#ffffff !important' },
      },
    },
  },
};

const LIGHT_CUSTOMIZATIONS = {
  style: {
    customCSS: {
      variables: {
        '--ts-var-root-font-family': FONT_FAMILY,
      },
    },
  },
};

let sdkInitializedKey = null;

function initializeSDK(tsHost, customizations, onSuccess) {
  const key = `${tsHost}:${customizations === DARK_CUSTOMIZATIONS ? 'dark' : 'light'}`;
  if (sdkInitializedKey === key) {
    onSuccess?.();
    return;
  }
  sdkInitializedKey = key;

  // AuthType.None: no session check — fires SUCCESS immediately.
  // Auth is handled up-front via the LoginPage BrowserWindow flow, so by the time
  // SpotterPage renders the session cookie is already in Electron's defaultSession.
  const authEE = init({
    thoughtSpotHost: tsHost,
    authType: AuthType.None,
    customizations,
    suppressNoCookieAccessAlert: true,
  });

  if (authEE) {
    authEE
      .on(AuthStatus.SUCCESS, () => onSuccess?.())
      .on(AuthStatus.SDK_SUCCESS, () => onSuccess?.());
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
      const result = await window.electronAPI?.openAuthWindow(tsHost);
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
  const [loaded, setLoaded] = useState(false);
  const [theme, setTheme] = useState('light');
  const [embedKey, setEmbedKey] = useState(0);

  const customizations = theme === 'dark' ? DARK_CUSTOMIZATIONS : LIGHT_CUSTOMIZATIONS;

  useEffect(() => {
    initializeSDK(tsHost, customizations, () => setSdkReady(true));
  }, [tsHost, theme]);

  const onSpotterLoad = useCallback(() => setLoaded(true), []);

  const handleToggleTheme = useCallback(() => {
    setTheme(t => {
      const next = t === 'dark' ? 'light' : 'dark';
      sdkInitializedKey = null;
      setSdkReady(false);
      setLoaded(false);
      setEmbedKey(k => k + 1);
      return next;
    });
  }, []);

  const handleSignInAgain = useCallback(async () => {
    const result = await window.electronAPI?.openAuthWindow(tsHost);
    if (result?.success) {
      // Reload the embed to pick up the refreshed session
      sdkInitializedKey = null;
      setSdkReady(false);
      setLoaded(false);
      setEmbedKey(k => k + 1);
      initializeSDK(tsHost, customizations, () => setSdkReady(true));
    }
  }, [tsHost, customizations]);

  const handleLogout = useCallback(async () => {
    try { logout(); } catch (_) {}
    if (window.electronAPI?.clearHostUrl) {
      await window.electronAPI.clearHostUrl();
    }
    if (window.electronAPI?.logout) {
      await window.electronAPI.logout();
    }
    sdkInitializedKey = null;
    onAuthLost?.();
    onDisconnect();
  }, [onDisconnect, onAuthLost]);

  const hostLabel = (() => {
    try { return new URL(tsHost).hostname.split('.')[0]; } catch { return 'Spotter'; }
  })();

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
        <SpotterEmbed
          key={embedKey}
          ref={embedRef}
          frameParams={{ width: '100%', height: '100%' }}
          worksheetId="auto_mode"
          updatedSpotterChatPrompt={true}
          spotterSidebarConfig={{
            enablePastConversationsSidebar: true,
            spotterSidebarTitle: 'My Conversations',
            spotterSidebarDefaultExpanded: true,
          }}
          onLoad={onSpotterLoad}
        />
      </div>
    </div>
  );
}

// ---------- Root ----------

export default function App() {
  const [tsHost, setTsHost] = useState(null);
  const [authDone, setAuthDone] = useState(false);
  const [checking, setChecking] = useState(true);

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

  const handleDisconnect = useCallback(() => {
    sdkInitializedKey = null;
    setTsHost(null);
    setAuthDone(false);
  }, []);

  if (checking) return null;

  if (!tsHost) {
    return <SetupPage onConnect={handleConnect} savedUrl="" />;
  }

  if (!authDone) {
    return <LoginPage tsHost={tsHost} onAuthDone={handleAuthDone} onBack={handleDisconnect} />;
  }

  return <SpotterPage tsHost={tsHost} onDisconnect={handleDisconnect} onAuthLost={handleAuthLost} />;
}
