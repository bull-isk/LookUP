// electron/ipc/lookup.handlers.js
const { ipcMain } = require("electron");
const repo = require("../../db/repositories/lookup.repo");
const { getDb } = require("../../db/connection");

module.exports = function registerLookupHandlers() {
	ipcMain.handle("lookup:all", () => repo.getAllLookups());
	ipcMain.handle("lookup:addCategory", (_, d) => repo.addCategory(d));
	ipcMain.handle("lookup:addPronoun", (_, t) => repo.addPronoun(t));
	ipcMain.handle("lookup:addOrg", (_, n) => repo.addOrg(n));
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

	const { shell } = require("electron");
	ipcMain.handle("shell:openExternal", (_, url) => shell.openExternal(url));
	ipcMain.handle("lookup:addSocialPlatform", (_, name) => {
		return getDb().prepare(`INSERT INTO SocialPlatform (PlatformName, Logo, URLTemplate) VALUES (?, '', '')`).run(name).lastInsertRowid;
	});
};
