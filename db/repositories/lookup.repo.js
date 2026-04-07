// db/repositories/lookup.repo.js
const { getDb } = require("../connection");

function getAllLookups() {
	const db = getDb();
	return {
		categories: db.prepare("SELECT * FROM Category ORDER BY CategoryName").all(),
		pronouns: db.prepare("SELECT * FROM Pronouns").all(),
		tags: db.prepare("SELECT * FROM Tags ORDER BY TagName").all(),
		timezones: db.prepare("SELECT * FROM Timezones").all(),
		eduLevels: db.prepare("SELECT * FROM EduLevel").all(),
		orgs: db.prepare("SELECT * FROM Organization").all(),
		institutions: db.prepare("SELECT * FROM AcademicInst").all(),
		platforms: db.prepare("SELECT * FROM SocialPlatform").all(),
		// Specifics tree now served separately via specifics:tree IPC
		persons: db.prepare("SELECT PersonID, FullName FROM Person ORDER BY FullName").all(),
	};
}

// ── TAG MANAGEMENT ───────────────────────────────────────────────

// Find or create tag (case-insensitive, trimmed). Returns TagID.
function findOrCreateTag(name) {
	const db = getDb();
	const trimmed = name.trim();
	if (!trimmed) throw new Error("Tag name cannot be empty");
	const existing = db.prepare(`SELECT TagID FROM Tags WHERE lower(TagName) = lower(?)`).get(trimmed);
	if (existing) return existing.TagID;
	return db.prepare(`INSERT INTO Tags (TagName) VALUES (?)`).run(trimmed).lastInsertRowid;
}

// Delete tags that have zero linked persons (called after setPersonTags)
function pruneOrphanTags() {
	getDb().exec(`
    DELETE FROM Tags WHERE TagID NOT IN (
      SELECT DISTINCT TagID FROM PersonTag
    )
  `);
}

// All tags with person counts (for Tags page header)
function getTagsWithCounts() {
	return getDb()
		.prepare(
			`
    SELECT t.TagID, t.TagName, COUNT(pt.PersonID) as personCount
    FROM Tags t
    LEFT JOIN PersonTag pt ON t.TagID = pt.TagID
    GROUP BY t.TagID
    HAVING personCount > 0
    ORDER BY t.TagName
  `,
		)
		.all();
}

// People under a specific tag, sorted by LastUpdated DESC
function getPersonsByTagId(tagId, limit = null) {
	const sql = `
    SELECT p.PersonID, p.FullName, p.Nickname, p.LastUpdated,
           c.CategoryName, c.HexCode as CategoryColor
    FROM Person p
    JOIN PersonTag pt ON p.PersonID = pt.PersonID
    LEFT JOIN Category c ON p.CategoryID = c.CategoryID
    WHERE pt.TagID = ?
    ORDER BY p.LastUpdated DESC${limit ? ` LIMIT ${limit}` : ""}
  `;
	return getDb().prepare(sql).all(tagId);
}

function addCategory(data) {
	return getDb().prepare("INSERT INTO Category (CategoryName,SVGPath,HexCode) VALUES (@CategoryName,@SVGPath,@HexCode)").run(data).lastInsertRowid;
}
function addPronoun(text) {
	return getDb().prepare("INSERT INTO Pronouns (Pronouns) VALUES (?)").run(text).lastInsertRowid;
}
function addOrg(name) {
	return getDb().prepare("INSERT INTO Organization (OrgName) VALUES (?)").run(name).lastInsertRowid;
}
function addInstitution(data) {
	return getDb().prepare("INSERT INTO AcademicInst (InstitutionName,Link) VALUES (@InstitutionName,@Link)").run(data).lastInsertRowid;
}

module.exports = {
	getAllLookups,
	findOrCreateTag,
	pruneOrphanTags,
	getTagsWithCounts,
	getPersonsByTagId,
	addCategory,
	addPronoun,
	addOrg,
	addInstitution,
};
