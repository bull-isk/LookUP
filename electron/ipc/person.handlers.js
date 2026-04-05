// electron/ipc/person.handlers.js
const { ipcMain } = require('electron');
const repo = require('../../db/repositories/person.repo');

module.exports = function registerPersonHandlers() {
  ipcMain.handle('person:list',         () => repo.getAllPersons());
  ipcMain.handle('person:full',         (_, id) => repo.getFullPerson(id));
  ipcMain.handle('person:create',       (_, data) => repo.createPerson(data));
  ipcMain.handle('person:update',       (_, id, data) => repo.updatePerson(id, data));
  ipcMain.handle('person:delete',       (_, id) => repo.deletePerson(id));
  ipcMain.handle('person:setPronouns',  (_, personId, ids) => repo.setPersonPronouns(personId, ids));
  ipcMain.handle('person:setTags',      (_, personId, ids) => repo.setPersonTags(personId, ids));
};