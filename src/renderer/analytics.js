// The default mixpanel-browser entry bundles the session-replay recorder
// (@mixpanel/rrweb), which this app deliberately does not use. The core loader
// is Mixpanel's documented way to leave it out — it halves the renderer bundle
// and makes "no session replay" a property of the build, not just a setting.
import mixpanel from 'mixpanel-browser/src/loaders/loader-module-core';

// Usage tracking for the desktop app, reported to our own Mixpanel project.
//
// The token is injected at build time by webpack's DefinePlugin from
// MIXPANEL_TOKEN. When it is absent — which is every developer machine that has
// not set the variable — every function here becomes a no-op, so `npm start`
// never writes into the production project.
const TOKEN = process.env.MIXPANEL_TOKEN;

let ready = false;

export function initAnalytics() {
  if (!TOKEN || ready) return;
  try {
    mixpanel.init(TOKEN, {
      // The renderer is served from file://, where cookies are unavailable —
      // Mixpanel's default persistence would silently fail to keep a distinct
      // id across launches, making every session look like a new user.
      persistence: 'localStorage',
      // There are no page views in a single-window desktop app.
      track_pageview: false,
      // Clicks, inputs, scrolls and submits are captured automatically. Passing
      // an object merges over Mixpanel's defaults, so only pageview changes.
      //
      // pageview is off because this renderer is a single file:// page: the
      // default 'full-url' mode would report the local filesystem path, which
      // carries the macOS account name in a dev build and the bundle path in a
      // packaged one. Neither is usage data, and there is no navigation to
      // measure anyway.
      autocapture: { pageview: false },
      // Session replay stays off deliberately. It would record the Spotter
      // conversation — question text, returned values, whatever customer data is
      // on screen. Explicit rather than implicit so nobody has to guess.
      record_sessions_percent: 0,
    });
    ready = true;
  } catch (err) {
    console.error('Mixpanel init failed:', err?.message || err);
  }
}

// Called once the ThoughtSpot session is known. Identity is the ThoughtSpot user
// GUID; the instance hostname and build metadata ride along as super properties
// so every later event carries them without being passed explicitly.
export function identify({ userGUID, host, appVersion, platform }) {
  if (!ready) return;
  try {
    if (userGUID) mixpanel.identify(userGUID);
    mixpanel.register({
      ts_host: host,
      app_version: appVersion,
      platform,
      surface: 'spotter-desktop',
    });
  } catch (err) {
    console.error('Mixpanel identify failed:', err?.message || err);
  }
}

export function track(event, props) {
  if (!ready) return;
  try {
    mixpanel.track(event, props);
  } catch (err) {
    console.error('Mixpanel track failed:', err?.message || err);
  }
}
