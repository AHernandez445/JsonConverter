# GeoJSON Distance & Elevation Desktop App

This project is a simple GeoJSON analyzer that computes segment distances, elevation changes, slope percentage, and height-change percentage for `LineString` features.

## Install from GitHub

You can install this app directly from the GitHub repository using npm:

```bash
npm install https://github.com/Ahernandez/JsonConverter.git
npm start
```

This will install the dependencies and launch the app in an Electron window.

## Run locally

1. Install Node.js on Windows.
2. Open a terminal in this project folder.
3. Run:

```bash
npm install
npm start
```

This launches the app in an Electron window.

## Package for Windows

After installing dependencies, run:

```bash
npm run package-win
```

The packaged app and installer will appear in the `dist/` folder.

## Notes

- The app loads `json.html` and uses `app.js` for processing.
- `sample-multi-coordinates.geojson` is included for testing.
- If you only want to preview in a browser, open `json.html` directly.
