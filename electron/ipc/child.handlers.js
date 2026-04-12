// electron/ipc/child.handlers.js
const { ipcMain } = require('electron');
const c = require('../../db/repositories/child.repo');

module.exports = function registerChildHandlers() {
  ipcMain.handle('quote:create',    (_, d) => c.createQuote(d));
  ipcMain.handle('quote:update',    (_, id, d) => c.updateQuote(id, d));
  ipcMain.handle('quote:delete',    (_, id) => c.deleteQuote(id));

  ipcMain.handle('wm:create',       (_, d) => c.createWordMouth(d));
  ipcMain.handle('wm:update',       (_, id, d) => c.updateWordMouth(id, d));
  ipcMain.handle('wm:delete',       (_, id) => c.deleteWordMouth(id));

  ipcMain.handle('note:create',     (_, d) => c.createNote(d));
  ipcMain.handle('note:update',     (_, id, d) => c.updateNote(id, d));
  ipcMain.handle('note:delete',     (_, id) => c.deleteNote(id));

  ipcMain.handle('specific:create', (_, d) => c.createSpecific(d));
  ipcMain.handle('specific:update', (_, id, d) => c.updateSpecific(id, d));
  ipcMain.handle('specific:delete', (_, id) => c.deleteSpecific(id));

  ipcMain.handle('edu:create',      (_, d) => c.createEdu(d));
  ipcMain.handle('edu:update',      (_, id, d) => c.updateEdu(id, d));
  ipcMain.handle('edu:delete',      (_, id) => c.deleteEdu(id));

  ipcMain.handle('org:create',      (_, d) => c.createOrg(d));
  ipcMain.handle('org:update',      (_, id, d) => c.updateOrg(id, d));
  ipcMain.handle('org:delete',      (_, id) => c.deleteOrg(id));

  ipcMain.handle('social:create',   (_, d) => c.createSocial(d));
  ipcMain.handle('social:delete',   (_, id) => c.deleteSocial(id));
  ipcMain.handle('social:update', (_, id, tag) => c.updateSocial(id, tag));

  ipcMain.handle('media:create',    (_, d) => c.createMedia(d));
  ipcMain.handle('media:link',      (_, personId, mediaId) => c.linkMedia(personId, mediaId));
  ipcMain.handle('media:unlink',    (_, personId, mediaId) => c.unlinkMedia(personId, mediaId));
};