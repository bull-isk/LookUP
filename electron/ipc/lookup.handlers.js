// electron/ipc/lookup.handlers.js
const { ipcMain } = require('electron');
const repo = require('../../db/repositories/lookup.repo');

module.exports = function registerLookupHandlers() {
  ipcMain.handle('lookup:all',          () => repo.getAllLookups());
  ipcMain.handle('lookup:addTag',       (_, name) => repo.addTag(name));
  ipcMain.handle('lookup:addPronoun',   (_, text) => repo.addPronoun(text));
  ipcMain.handle('lookup:addOrg',       (_, name) => repo.addOrg(name));
  ipcMain.handle('lookup:addInst',      (_, d) => repo.addInstitution(d));
};