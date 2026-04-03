# Spotter Desktop

> **GitHub:** [thoughtspot/spotter-desktop](https://github.com/thoughtspot/spotter-desktop)

A native macOS desktop app that brings [ThoughtSpot Spotter](https://www.thoughtspot.com/spotter) to your dock — no browser tab required.

Built with Electron + React, it wraps the ThoughtSpot Visual Embed SDK to deliver a first-class desktop experience with persistent sessions, dark/light theme support, and a collapsible conversation sidebar.

## Features

- Connect to any ThoughtSpot cloud instance
- Full SSO / browser-based sign-in flow
- Dark and light theme toggle
- Persistent session across launches
- Collapsible conversation history sidebar
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

## Project Structure

```
src/
├── main/
│   ├── main.js        # Electron main process
│   └── preload.js     # Preload script (context bridge)
└── renderer/
    ├── index.html     # HTML shell
    ├── index.jsx      # React entry point
    ├── App.jsx        # Main app component (setup, login, Spotter embed)
    └── styles.css     # Styles
```

## Tech Stack

| Layer | Technology |
|---|---|
| Shell | Electron 29 |
| UI | React 18 |
| Embed | ThoughtSpot Visual Embed SDK 1.46.5 |
| Bundler | Webpack 5 |
| Packaging | electron-builder |

## Troubleshooting

**Reset the app (clear saved host and session):**

Delete the config file and relaunch:
```
~/Library/Application Support/Spotter/spotter-config.json
```

This resets the ThoughtSpot host URL and login state, returning you to the setup screen.
