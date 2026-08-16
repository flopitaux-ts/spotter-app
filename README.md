# Spotter Desktop

> **GitHub:** [thoughtspot/spotter-desktop](https://github.com/thoughtspot/spotter-desktop)

A native macOS desktop app that brings [ThoughtSpot Spotter](https://www.thoughtspot.com/spotter) to your dock — no browser tab required.

Built with Electron + React, it wraps the ThoughtSpot Visual Embed SDK to deliver a first-class desktop experience with persistent sessions, dark/light theme support, and a collapsible conversation sidebar.

## Features

- Connect to any ThoughtSpot cloud instance
- Full SSO / browser-based sign-in flow
- Persistent session and window size/position across launches
- Collapsible conversation history sidebar
- In-app auto-update
- Signed & notarization-ready macOS build

## Installation

The easiest way to get started is to download the latest release directly — no Node.js or build tools needed.

1. Go to the [Releases](https://github.com/thoughtspot/spotter-desktop/releases) page
2. Download the latest `Spotter-<version>.dmg`
3. Open the `.dmg`, drag **Spotter** to your Applications folder
4. Launch Spotter from Applications or Spotlight

> **First launch on macOS:** If you see a security warning, go to **System Settings → Privacy & Security** and click **Open Anyway**.

---

## Getting Started (Development)

### Prerequisites

- Node.js 18+
- npm

### Install

```bash
npm install
```

### Run in Development

```bash
npm start        # one-shot build then launch
npm run dev      # watch mode — rebuilds on file changes (use during active development)
```

To open DevTools:

```bash
npm start -- --devtools
```

### Lint

```bash
npm run lint
```

### Build for macOS

```bash
npm run pack
```

Outputs a signed `.dmg` and `.zip` in the `dist/` folder.

### Code Signing & Notarization

To produce a notarized build, set the following environment variables before running `npm run pack`:

```bash
export APPLE_ID="your@apple.id"
export APPLE_APP_SPECIFIC_PASSWORD="xxxx-xxxx-xxxx-xxxx"
export APPLE_TEAM_ID="XXXXXXXXXX"
npm run pack
```

Without these variables, the app is built and signed but not notarized (Gatekeeper will show a warning on first launch).

### Publishing a Release

Auto-update reads `latest-mac.yml`, which electron-builder only writes when it
publishes the release itself. Push a tag and let CI do it:

```bash
npm version minor && git push --follow-tags
```

The `Release` workflow builds, signs, notarizes and publishes to GitHub Releases.
It needs these repository secrets: `CSC_LINK` (base64-encoded Developer ID `.p12`),
`CSC_KEY_PASSWORD`, `APPLE_ID`, `APPLE_APP_SPECIFIC_PASSWORD`, `APPLE_TEAM_ID`.

> Releases uploaded by hand will not contain `latest-mac.yml`. The app still
> notices them and falls back to showing a "Download" banner pointing at the
> Releases page, but silent auto-update will not work.

## Project Structure

```
src/
├── main/
│   ├── main.js        # Electron main process (windows, session, IPC)
│   ├── config.js      # Atomic read/write of spotter-config.json
│   ├── menu.js        # Application menu
│   ├── updater.js     # Auto-update, with GitHub Releases fallback
│   └── preload.js     # Preload script (context bridge)
└── renderer/
    ├── index.html     # HTML shell + CSP
    ├── index.jsx      # React entry point
    ├── App.jsx        # Main app component (setup, login, Spotter embed)
    └── styles.css     # Styles (theme tokens, light/dark)
```

## Tech Stack

| Layer | Technology |
|---|---|
| Shell | Electron 41 |
| UI | React 18 |
| Embed | ThoughtSpot Visual Embed SDK 1.51 |
| Bundler | Webpack 5 |
| Packaging | electron-builder + electron-updater |

## Troubleshooting

**Connect to a different ThoughtSpot instance:**

Use **File → Switch Instance…** from the menu bar. **File → Sign Out** clears the
session but keeps the host URL.

**Full reset (clear saved host, session and window position):**

Quit Spotter, delete the config file, and relaunch:
```
~/Library/Application Support/Spotter/spotter-config.json
```
