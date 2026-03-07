import React, { useEffect, useState, useCallback } from 'react';
import { init, AuthType, AuthStatus, logout } from '@thoughtspot/visual-embed-sdk';
import { SpotterEmbed, useEmbedRef } from '@thoughtspot/visual-embed-sdk/react';

const CSS_CUSTOMIZATIONS = {
  style: {
    customCSS: {
      variables: {
        '--ts-var-root-background': '#0a1628',
        '--ts-var-root-color': '#e2e8f0',
        '--ts-var-root-font-family': 'Lexend, "Lexend Fallback", system-ui, -apple-system, sans-serif',
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
        '[class*="promptEditor"]': { 'border': '1px solid rgba(255,255,255,0.4) !important', 'border-radius': '16px !important' },
        '[class*="promptPanel"]': { 'border': '1px solid rgba(255,255,255,0.4) !important', 'border-radius': '16px !important' },
        '[class*="chatFooter"]': { 'border': '1px solid rgba(255,255,255,0.4) !important', 'border-radius': '16px !important' },
        'textarea, input': { 'color': '#ffffff !important' },
        'textarea::placeholder, input::placeholder': { 'color': 'rgba(255,255,255,0.6) !important' },
        '[class*="inputBox"], [class*="input-with-tokens"]': { 'color': '#ffffff !important' },
        '[class*="inputBox"]::placeholder, [class*="input-with-tokens"]::placeholder': { 'color': 'rgba(255,255,255,0.6) !important' },
        '[class*="chatInput"], [class*="chatInput"] *': { 'color': '#ffffff !important' },
        '[class*="prompt"] textarea': { 'color': '#ffffff !important' },
        '[class*="placeholder"], [class*="Placeholder"]': { 'color': 'rgba(255,255,255,0.6) !important' },
        '[contenteditable]': { 'color': '#ffffff !important' },
        '[contenteditable]:empty::before, [contenteditable][data-placeholder]::before': { 'color': 'rgba(255,255,255,0.6) !important' },
        '[data-placeholder]::before': { 'color': 'rgba(255,255,255,0.6) !important' },
        '[class*="ProseMirror"], [class*="prosemirror"]': { 'color': '#ffffff !important' },
        '.ProseMirror': { 'color': '#ffffff !important' },
        '.ProseMirror p.is-editor-empty:first-child::before': { 'color': 'rgba(255,255,255,0.6) !important' },
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

let sdkInitializedForHost = null;

function initializeSDK(tsHost, onSuccess, onFailure) {
  if (sdkInitializedForHost === tsHost) {
    onSuccess?.();
    return;
  }
  sdkInitializedForHost = tsHost;

  const authEE = init({
    thoughtSpotHost: tsHost,
    authType: AuthType.None,
    customizations: CSS_CUSTOMIZATIONS,
  });

  if (authEE) {
    authEE
      .on(AuthStatus.SUCCESS, () => onSuccess?.())
      .on(AuthStatus.SDK_SUCCESS, () => onSuccess?.())
      .on(AuthStatus.FAILURE, () => onFailure?.());
  }
}

// ---------- Setup page ----------

function SetupPage({ onConnect, savedUrl, loggingIn }) {
  const [url, setUrl] = useState(savedUrl || '');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (loggingIn) return;
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
            <svg width="48" height="48" viewBox="0 0 32 32" fill="none">
              <rect width="32" height="32" rx="8" fill="#1a2d4a"/>
              <rect x="4" y="4" width="24" height="2" rx="1" fill="#fff"/>
              <rect x="4" y="8" width="24" height="2" rx="1" fill="#fff"/>
              <rect x="4" y="12" width="24" height="2" rx="1" fill="#fff"/>
              <rect x="13" y="16" width="2" height="12" rx="1" fill="#fff"/>
              <rect x="17" y="16" width="2" height="12" rx="1" fill="#fff"/>
              <rect x="21" y="16" width="2" height="12" rx="1" fill="#fff"/>
              <circle cx="26" cy="26" r="3" fill="#fff"/>
            </svg>
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
              disabled={loggingIn}
            />
            {error && <p className="setup-error">{error}</p>}
            <button className="setup-button" type="submit" disabled={loggingIn}>
              {loggingIn ? 'Signing in...' : 'Connect'}
            </button>
          </form>
          <p className="setup-hint">
            {loggingIn
              ? 'Complete sign-in in the popup window'
              : 'This is the URL you use to access ThoughtSpot in your browser'}
          </p>
        </div>
      </div>
    </div>
  );
}

// ---------- Spotter page ----------

function SpotterPage({ tsHost, onDisconnect }) {
  const embedRef = useEmbedRef();
  const [sdkReady, setSdkReady] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    initializeSDK(
      tsHost,
      () => setSdkReady(true),
      () => setSdkReady(true),
    );
    const timer = setTimeout(() => setSdkReady(true), 2000);
    return () => clearTimeout(timer);
  }, [tsHost]);

  const onSpotterLoad = useCallback(() => setLoaded(true), []);

  const handleLogout = useCallback(async () => {
    try { logout(); } catch (_) {}
    if (window.electronAPI?.clearHostUrl) {
      await window.electronAPI.clearHostUrl();
    }
    if (window.electronAPI?.logout) {
      await window.electronAPI.logout();
    }
    sdkInitializedForHost = null;
    onDisconnect();
  }, [onDisconnect]);

  const hostLabel = (() => {
    try { return new URL(tsHost).hostname.split('.')[0]; } catch { return 'Spotter'; }
  })();

  if (!sdkReady) {
    return (
      <div className="app-container">
        <div className="titlebar">
          <span className="titlebar-title">{hostLabel} - Spotter</span>
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
          <button className="titlebar-btn" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>
      <div className="embed-container" id="ts-embed">
        <SpotterEmbed
          ref={embedRef}
          frameParams={{ width: '100%', height: '100%' }}
          worksheetId="auto_mode"
          updatedSpotterChatPrompt={true}
          enablePastConversationsSidebar={true}
          onLoad={onSpotterLoad}
        />
      </div>
    </div>
  );
}

// ---------- Root ----------

export default function App() {
  const [tsHost, setTsHost] = useState(null);
  const [checking, setChecking] = useState(true);
  const [loggingIn, setLoggingIn] = useState(false);

  useEffect(() => {
    (async () => {
      if (window.electronAPI?.getHostUrl) {
        const saved = await window.electronAPI.getHostUrl();
        if (saved) setTsHost(saved);
      }
      setChecking(false);
    })();
  }, []);

  const handleConnect = useCallback(async (url) => {
    setLoggingIn(true);
    try {
      if (window.electronAPI?.openLogin) {
        await window.electronAPI.openLogin(url);
      }
      if (window.electronAPI?.setHostUrl) {
        await window.electronAPI.setHostUrl(url);
      }
      setTsHost(url);
    } finally {
      setLoggingIn(false);
    }
  }, []);

  const handleDisconnect = useCallback(() => {
    sdkInitializedForHost = null;
    setTsHost(null);
  }, []);

  if (checking) return null;

  if (!tsHost) {
    return <SetupPage onConnect={handleConnect} savedUrl="" loggingIn={loggingIn} />;
  }

  return <SpotterPage tsHost={tsHost} onDisconnect={handleDisconnect} />;
}
