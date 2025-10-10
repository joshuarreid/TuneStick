# TuneStick - Desktop Album Manager

## Building Executable App for Mac

This guide provides step-by-step instructions for packaging TuneStick into a Mac executable (.app and .dmg).

### Prerequisites

- Node.js installed
- All dependencies installed (`npm install`)
- App icon file: `public/assets/app.icns`
- Configuration file: `public/config.json`

### Required Configuration Files

#### 1. Config File Setup
Create `public/config.json` with your music library path:
```json
{
  "musicFolderPath": "/yourpath/to/music/folder"
}
```
## Running locally

- Windows: npm run electron-dev --use-powershell=false
- MAC: npm run electron-dev

## Packaging for Mac

- npm run build
- npx electron-builder --mac


## Packaging for Windows

- Run PowerShell as Administrator
- npm run build
- npx electron-builder --win --x64
