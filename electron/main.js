// electron/main.js
const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { initSchema } = require('../db/schema');
const { closeDb } = require('../db/connection');
const registerAllHandlers = require('./ipc/index');

const isDev = process.env.NODE_ENV === 'development';

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,   // SECURITY: keeps Node out of renderer
      nodeIntegration: false,   // SECURITY: renderer cannot call require()
    },
  });

  if (isDev) {
    win.loadURL('http://localhost:5173');
    win.webContents.openDevTools();
  } else {
    win.loadFile(path.join(__dirname, '..', 'renderer', 'dist', 'index.html'));
  }
}

app.whenReady().then(() => {
  initSchema();         // Create tables + seed lookups
  registerAllHandlers(); // Wire all IPC channels
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  closeDb();
  if (process.platform !== 'darwin') app.quit();
});