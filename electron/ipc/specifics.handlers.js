// electron/ipc/specifics.handlers.js
const { ipcMain } = require('electron');
const repo = require('../../db/repositories/specifics.repo');

module.exports = function registerSpecificsHandlers() {
  ipcMain.handle('specifics:forPerson',  (_, personId) => repo.getSpecificsForPerson(personId));
  ipcMain.handle('specifics:tree',       ()            => repo.getSpecificsTree());
  ipcMain.handle('specifics:addValue',   (_, data)     => repo.createSpecificValue(data));
  ipcMain.handle('specifics:updateValue',(_, id, note) => repo.updateSpecificValue(id, note));
  ipcMain.handle('specifics:deleteValue',(_, id)       => repo.deleteSpecificValue(id));
  ipcMain.handle('specifics:findOrCreateSub',  (_, name)         => repo.findOrCreateSub(name));
  ipcMain.handle('specifics:findOrCreatePoint',(_, subId, name)  => repo.findOrCreatePoint(subId, name));
};