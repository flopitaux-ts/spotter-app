# Spotter — Standalone Mac App

A standalone Electron + React application that embeds [ThoughtSpot Spotter](https://champagne.thoughtspotstaging.cloud/#/).

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Install Dependencies

```bash
npm install
```

### Run in Development

```bash
npm start
```

To open DevTools, pass the flag:

```bash
npm start -- --devtools
```

### Build for macOS

```bash
npm run pack
```

The `.dmg` and `.zip` outputs will be in the `dist/` folder.

## Project Structure

```
src/
├── main/
│   ├── main.js        # Electron main process
│   └── preload.js     # Preload script (context bridge)
└── renderer/
    ├── index.html      # HTML shell
    ├── index.jsx       # React entry point
    ├── App.jsx         # Main component with webview
    └── styles.css      # Styles
```
