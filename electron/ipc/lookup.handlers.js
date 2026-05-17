// electron/ipc/lookup.handlers.js
const { ipcMain } = require("electron");
const repo = require("../../db/repositories/lookup.repo");

module.exports = function registerLookupHandlers() {
	ipcMain.handle("lookup:all", () => repo.getAllLookups());
	ipcMain.handle("lookup:addInst", (_, d) => repo.addInstitution(d));
	// Tags
	ipcMain.handle("lookup:findOrCreateTag", (_, n) => repo.findOrCreateTag(n));
	ipcMain.handle("lookup:tagsWithCounts", () => repo.getTagsWithCounts());
	ipcMain.handle("lookup:personsByTag", (_, id) => repo.getPersonsByTagId(id));
	// Pronouns
	ipcMain.handle("lookup:findOrCreatePronoun", (_, t) => repo.findOrCreatePronoun(t));
	ipcMain.handle("lookup:prunePronouns", () => repo.pruneOrphanPronouns());
	// Categories
	ipcMain.handle("lookup:findOrCreateCategory", (_, n, hex) => repo.findOrCreateCategory(n, hex));
	ipcMain.handle("lookup:pruneCategories", () => repo.pruneOrphanCategories());
	// Academic Institutions and Organizations
	ipcMain.handle("lookup:findOrCreateInstitution", (_, name) => repo.findOrCreateInstitution(name));
	ipcMain.handle("lookup:findOrCreateOrganization", (_, name) => repo.findOrCreateOrganization(name));

	ipcMain.handle("ipcMain:openExternal", (_, url) => shell.openExternal(url));
	ipcMain.handle('lookup:addSocialPlatform', (_, name) => repo.addSocialPlatform(name));
};
