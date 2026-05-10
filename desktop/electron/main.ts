import { app, BrowserWindow, ipcMain, shell, dialog, clipboard } from 'electron';
import path from 'path';
import { fetchMetadata } from './services/metadata';
import { startDownload, cancelDownload } from './services/downloader';
import fs from 'fs';
import { probeFile, convertFile, cancelFileConvert, saveBuffer } from './services/fileConverter';
import { getFfmpegPath } from './utils/ffPaths';
import { getHistory, addHistory, clearHistory } from './services/history';
import { getStorage } from './services/storage';

let win: BrowserWindow | null = null;

function createWindow() {
  win = new BrowserWindow({
    width: 1180,
    height: 760,
    minWidth: 900,
    minHeight: 600,
    frame: false,
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'hidden',
    backgroundColor: '#0e1014',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    win.loadURL(process.env.VITE_DEV_SERVER_URL);
    win.webContents.openDevTools({ mode: 'detach' });
  } else {
    win.loadFile(path.join(__dirname, '../dist/index.html'));
  }
}

app.whenReady().then(() => {
  // FFmpeg check (use bundled binary so packaged app works without system FFmpeg)
  const { execSync } = require('child_process');
  try {
    execSync(`"${getFfmpegPath()}" -version`, { stdio: 'ignore' });
  } catch {
    dialog.showErrorBox(
      'FFmpeg Not Found',
      'FFmpeg was not found in your PATH.\n\nInstall it:\n  Windows: https://ffmpeg.org/download.html\n  macOS: brew install ffmpeg\n  Linux: sudo apt install ffmpeg',
    );
    app.quit();
    return;
  }

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// ─── Window controls ───────────────────────────────────────────────────────
ipcMain.handle('window:minimize', () => win?.minimize());
ipcMain.handle('window:maximize', () => {
  if (win?.isMaximized()) win.unmaximize();
  else win?.maximize();
});
ipcMain.handle('window:close', () => win?.close());
ipcMain.handle('window:isMaximized', () => win?.isMaximized() ?? false);

// ─── Metadata ──────────────────────────────────────────────────────────────
ipcMain.handle('metadata:fetch', async (_e, url: string) => {
  return fetchMetadata(url);
});

// ─── Download ──────────────────────────────────────────────────────────────
ipcMain.handle('download:start', async (_e, opts) => {
  return startDownload(opts, (event, data) => {
    win?.webContents.send(event, data);
  });
});
ipcMain.handle('download:cancel', () => cancelDownload());

// ─── History ───────────────────────────────────────────────────────────────
ipcMain.handle('history:get', () => getHistory());
ipcMain.handle('history:add', (_e, entry) => addHistory(entry));
ipcMain.handle('history:clear', () => clearHistory());

// ─── Storage ───────────────────────────────────────────────────────────────
ipcMain.handle('storage:get', () => getStorage());

// ─── File ops ──────────────────────────────────────────────────────────────
ipcMain.handle('file:reveal', (_e, filePath: string) => {
  shell.showItemInFolder(filePath);
});
ipcMain.handle('file:chooseDir', async () => {
  const result = await dialog.showOpenDialog(win!, {
    properties: ['openDirectory'],
  });
  return result.canceled ? null : result.filePaths[0];
});

// ─── File convert ──────────────────────────────────────────────────────────
ipcMain.handle('convert:probe', (_e, filePath: string) => probeFile(filePath));
ipcMain.handle('convert:start', async (_e, opts) => {
  return convertFile(opts, (event, data) => {
    win?.webContents.send(event, data);
  });
});
ipcMain.handle('convert:cancel', () => cancelFileConvert());
ipcMain.handle('file:readBytes', async (_e, filePath: string) => {
  const buf = await fs.promises.readFile(filePath);
  return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
});
ipcMain.handle('convert:saveBuffer', async (_e, data: ArrayBuffer, outputPath: string) => {
  await saveBuffer(new Uint8Array(data), outputPath);
});
ipcMain.handle('file:pickInput', async () => {
  const result = await dialog.showOpenDialog(win!, {
    properties: ['openFile'],
    filters: [
      {
        name: 'All Supported',
        extensions: [
          'mp4', 'webm', 'mov', 'mkv', 'avi', 'wmv', 'flv', 'ts', 'm4v',
          'mp3', 'wav', 'flac', 'm4a', 'aac', 'ogg', 'opus',
          'jpg', 'jpeg', 'png', 'webp', 'bmp', 'gif', 'tiff', 'tif', 'avif', 'heic',
          'pdf',
        ],
      },
      { name: 'Video',  extensions: ['mp4', 'webm', 'mov', 'mkv', 'avi', 'wmv', 'flv'] },
      { name: 'Audio',  extensions: ['mp3', 'wav', 'flac', 'm4a', 'aac', 'ogg'] },
      { name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'webp', 'bmp', 'gif', 'tiff', 'avif'] },
      { name: 'PDF',    extensions: ['pdf'] },
      { name: 'All Files', extensions: ['*'] },
    ],
  });
  return result.canceled ? null : result.filePaths[0];
});

// ─── System ────────────────────────────────────────────────────────────────
ipcMain.handle('system:platform', () => process.platform);
ipcMain.handle('clipboard:read', () => clipboard.readText());
