// electron/ipc/lookup.handlers.js
const { ipcMain } = require('electron');
const repo = require('../../db/repositories/lookup.repo');

module.exports = function registerLookupHandlers() {
  ipcMain.handle('lookup:all',         ()      => repo.getAllLookups());
  ipcMain.handle('lookup:addCategory', (_, d)  => repo.addCategory(d));
  ipcMain.handle('lookup:addTag',      (_, n)  => repo.addTag(n));
  ipcMain.handle('lookup:addPronoun',  (_, t)  => repo.addPronoun(t));
  ipcMain.handle('lookup:addOrg',      (_, n)  => repo.addOrg(n));
  ipcMain.handle('lookup:addInst',     (_, d)  => repo.addInstitution(d));
};