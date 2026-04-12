// electron/ipc/person.handlers.js
const { ipcMain } = require('electron');
const repo = require('../../db/repositories/person.repo');

module.exports = function registerPersonHandlers() {
  ipcMain.handle('person:list',            ()           => repo.getAllPersons());
  ipcMain.handle('person:full',            (_, id)      => repo.getFullPerson(id));
  ipcMain.handle('person:create',          (_, data)    => repo.createPerson(data));
  ipcMain.handle('person:update',          (_, id, d)   => repo.updatePerson(id, d));
  ipcMain.handle('person:delete',          (_, id)      => repo.deletePerson(id));
  ipcMain.handle('person:setPronouns',     (_, id, ids) => repo.setPersonPronouns(id, ids));
  ipcMain.handle('person:setTags',         (_, id, ids) => repo.setPersonTags(id, ids));
  ipcMain.handle('person:birthdays',       ()           => repo.getBirthdayPersons());
  ipcMain.handle('person:recentlyUpdated', (_, limit)   => repo.getRecentlyUpdated(limit));
  ipcMain.handle('person:favorites',       (_, limit)   => repo.getFavorites(limit));
  ipcMain.handle('person:byTag',           ()           => repo.getPeopleByTag());
  // Phase B
  ipcMain.handle('person:search',          (_, q)       => repo.searchPersons(q));

  ipcMain.handle('person:deletePopulateTest', () => repo.deletePopulateTest());
};