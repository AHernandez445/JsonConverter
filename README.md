#important to note that this was vibe codedusing AI
# GeoJSON Distance & Elevation Desktop App

This project is a simple GeoJSON analyzer that computes segment distances, elevation changes, slope percentage, and height-change percentage for `LineString` features.

## Download Standalone App (No Node.js Required)

For end users who don't want to install Node.js, download the pre-built installer from the [GitHub Releases](https://github.com/Ahernandez/JsonConverter/releases) page. The installer is a standalone executable that includes everything needed to run the app.
### Portable Version for USB Drives

The releases also include a **portable version** (`.exe` file) that can be copied to a USB drive and run directly on any Windows computer without installation. Just download the portable exe from the releases and copy it to your USB drive.
To create a new release:
1. Push a git tag (e.g., `git tag v1.0.1 && git push --tags`)
2. GitHub Actions will automatically build the app and create a release with the installer files.

## Install from GitHub (Requires Node.js)

You can install this app directly from the GitHub repository using npm:

```bash
npm install https://github.com/Ahernandez/JsonConverter.git
npm start
```

This will install the dependencies and launch the app in an Electron window.

## Run locally (Requires Node.js)

1. Install Node.js on Windows.
2. Open a terminal in this project folder.
3. Run:

```bash
npm install
npm start
```

This launches the app in an Electron window.

## Package for Windows (Requires Node.js for building)

After installing dependencies, run:

```bash
npm run package-win
```

The packaged app, installer, and portable exe will appear in the `dist/` folder. The portable exe can be copied to a USB drive for use on any Windows computer without installation.

For portable only:
```bash
npm run package-portable
```

## Notes

- The app loads `json.html` and uses `app.js` for processing.
- `sample-multi-coordinates.geojson` is included for testing.
- If you only want to preview in a browser, open `json.html` directly.
