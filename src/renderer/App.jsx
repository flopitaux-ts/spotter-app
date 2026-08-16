import React, { useEffect, useState, useCallback, useRef } from 'react';
import { init, AuthType, AuthStatus, logout } from '@thoughtspot/visual-embed-sdk';
import { SpotterEmbed, useEmbedRef } from '@thoughtspot/visual-embed-sdk/react';
import tsLogo from './logo.png';

// Genuine workarounds for the embed overflowing its container, not styling —
// there is no CSS variable equivalent, so they stay as raw rules.
const LAYOUT_RULES = {
  'html': { 'overflow-x': 'clip !important', 'width': '100% !important' },
  'body': { 'width': '100% !important', 'max-width': '100% !important', 'overflow-x': 'clip !important', 'box-sizing': 'border-box !important' },
  '[class*="chatMessages"], [class*="chatBody"], [class*="conversationThread"], [class*="messageList"], [class*="chatContent"], [class*="messageContainer"], [class*="conversationContainer"]': { 'overflow-y': 'auto !important', 'width': '100% !important', 'max-width': '100% !important', 'box-sizing': 'border-box !important', 'word-break': 'break-word !important', 'overflow-wrap': 'break-word !important', 'white-space': 'normal !important' },
};

const EMBED_CUSTOMIZATIONS = {
  style: {
    customCSS: {
      variables: {
        '--ts-var-spotter-chat-width': '100%',
      },
      rules_UNSTABLE: { ...LAYOUT_RULES },
    },
  },
};

// Shared utility: extract a short friendly label from a ThoughtSpot host URL
function getHostLabel(tsHost) {
  try { return new URL(tsHost).hostname.split('.')[0]; } catch { return 'Spotter'; }
}

// ---------- Update banner ----------

// `info.mode` is decided in the main process: `ready` when electron-updater has
// staged an install, `downloading` while it fetches, `manual` when auto-update is
// unavailable and the user must grab the release themselves.
function UpdateBanner({ info, onDismiss }) {
  const { mode, version, url } = info;

  const action = {
    ready: { label: 'Restart', onClick: () => window.electronAPI?.installUpdate() },
    manual: { label: 'Download', onClick: () => window.electronAPI?.openExternal(url) },
  }[mode];

  const message = {
    ready: `✨ Version ${version} is ready to install`,
    downloading: `Downloading version ${version}…`,
    manual: `✨ Version ${version} is available`,
    current: 'Spotter is up to date',
  }[mode];

  return (
    <div className="update-banner" role="status">
      <span>{message}</span>
      {action && (
        <button className="update-banner-btn" onClick={action.onClick}>
          {action.label}
        </button>
      )}
      <button className="update-banner-dismiss" onClick={onDismiss} aria-label="Dismiss">✕</button>
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

  const handleSubmit = async (e) => {
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
    try {
      // The main process re-validates and rejects anything that is not HTTPS.
      await onConnect(cleaned);
    } catch {
      setError('Could not connect to that URL — it must start with https://');
    }
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

function SpotterPage({ tsHost, onSignOut, onAuthLost }) {
  const embedRef = useEmbedRef();
  const [sdkInitialized, setSdkInitialized] = useState(false);
  const [sdkReady, setSdkReady] = useState(false);
  const sdkKeyRef = useRef(null);

  useEffect(() => {
    if (sdkKeyRef.current === tsHost) return; // already initialized for this host
    sdkKeyRef.current = tsHost;
    initializeSDK(tsHost, EMBED_CUSTOMIZATIONS, () => setSdkReady(true), onAuthLost);
    // init() returns synchronously; auth resolves later. Flipping this now lets the
    // embed mount and start loading its iframe while we are still waiting on auth,
    // instead of the two waits running back to back.
    setSdkInitialized(true);
  }, [tsHost, onAuthLost]);

  // Notify when an answer lands while the user is away. No single event covers
  // this on every cluster version, so we arm on the query and fire on whichever
  // completion signal arrives first:
  //   SpotterResponseComplete - the precise one, needs 26.9.0.cl
  //   SpotterData             - text answers, 10.10.0.cl
  //   Data                    - visualization answers, available everywhere
  // Arming on the query is what keeps Data from notifying on conversation
  // restores and other data traffic the user did not ask for.
  const queryPendingRef = useRef(false);

  const handleQueryTriggered = useCallback(() => {
    queryPendingRef.current = true;
  }, []);

  const handleResponseComplete = useCallback(() => {
    if (!queryPendingRef.current) return;
    queryPendingRef.current = false; // first signal wins; the rest are duplicates
    window.electronAPI?.notifyResponseComplete();
  }, []);

  const hostLabel = getHostLabel(tsHost);

  return (
    <div className="app-container">
      <div className="titlebar">
        <span className="titlebar-title">{hostLabel} - Spotter</span>
        <div className="titlebar-actions">
          <button className="titlebar-btn" onClick={onSignOut}>
            Logout
          </button>
        </div>
      </div>
      {!sdkReady && (
        <div className="loading-overlay">
          <div className="spinner" />
          <p className="loading-text">Connecting to ThoughtSpot...</p>
        </div>
      )}
      {sdkInitialized && (
        // Kept at full size while warming so the embed lays out against real
        // dimensions rather than reflowing when it is revealed.
        <div
          className={`embed-container${sdkReady ? '' : ' embed-container--warming'}`}
          id="ts-embed"
        >
          <ErrorBoundary>
            <SpotterEmbed
              ref={embedRef}
              frameParams={{ width: '100%', height: '100%' }}
              worksheetId="auto_mode"
              updatedSpotterChatPrompt={true}
              // Lets users interrupt a long generation (26.5+)
              enableStopAnswerGenerationEmbed={true}
              spotterChatConfig={{
                enableStarterPrompts: true, // 26.8+
                spotterFileUploadEnabled: true, // 26.6+
              }}
              // Inert until the cluster reaches 26.9 — the SDK forwards it, but the
              // share UI is rendered by ThoughtSpot inside the iframe. champagne is
              // on 26.8, so this lights up on upgrade with no code change.
              spotterShareConversationConfig={{ enableShareConversation: true }}
              onSpotterQueryTriggered={handleQueryTriggered}
              onSpotterResponseComplete={handleResponseComplete}
              onSpotterData={handleResponseComplete}
              onData={handleResponseComplete}
              spotterSidebarConfig={{
                enablePastConversationsSidebar: true,
                spotterSidebarTitle: 'My Conversations',
                spotterSidebarDefaultExpanded: false,
              }}
            />
          </ErrorBoundary>
        </div>
      )}
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
      const api = window.electronAPI;
      const [saved, loggedIn] = await Promise.all([
        api?.getHostUrl?.() ?? null,
        api?.getLoggedIn?.() ?? false, // skip LoginPage if a previous session authenticated
      ]);
      if (saved) setTsHost(saved);
      if (loggedIn) setAuthDone(true);
      setChecking(false);
    })();
  }, []);

  // Check once on startup, then stay subscribed: electron-updater downloads in the
  // background and reports separately when a build is staged and ready to install.
  useEffect(() => {
    (async () => {
      try {
        const info = await window.electronAPI?.checkForUpdates();
        if (info) setUpdateInfo(info);
      } catch {
        // Silently ignore update check failures
      }
    })();
    return window.electronAPI?.onUpdateAvailable?.(setUpdateInfo);
  }, []);

  const handleConnect = useCallback(async (url) => {
    await window.electronAPI?.setHostUrl?.(url);
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

  const handleSignOut = useCallback(async () => {
    try { logout(); } catch (e) { console.error('SDK logout error:', e); }
    await window.electronAPI?.logout();
  }, []);

  useEffect(() => window.electronAPI?.onMenuAction?.((action) => {
    if (action === 'switch-instance') handleDisconnect();
    else if (action === 'sign-out') handleSignOut();
  }), [handleDisconnect, handleSignOut]);

  const updateBanner = updateInfo ? (
    <UpdateBanner info={updateInfo} onDismiss={() => setUpdateInfo(null)} />
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
      <SpotterPage tsHost={tsHost} onSignOut={handleSignOut} onAuthLost={handleAuthLost} />
    </>
  );
}
