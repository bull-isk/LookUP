// db/repositories/lookup.repo.js
const { getDb } = require("../connection");

// Default pronouns — never pruned even when unused
const DEFAULT_PRONOUNS = ["he/him", "she/her", "they/them"];
// Default categories — never pruned even when unused
const DEFAULT_CATEGORIES = ["friend", "family", "colleague", "online friend"];

function getAllLookups() {
	const db = getDb();
	return {
		categories: db.prepare("SELECT * FROM Category ORDER BY CategoryName").all(),
		pronouns: db.prepare("SELECT * FROM Pronouns ORDER BY Pronouns").all(),
		tags: db.prepare("SELECT * FROM Tags ORDER BY TagName").all(),
		timezones: db.prepare("SELECT * FROM Timezones").all(),
		eduLevels: db.prepare("SELECT * FROM EduLevel ORDER BY EduLevelID").all(),
		institutions: db.prepare("SELECT * FROM AcademicInst ORDER BY InstitutionName").all(),
		orgs: db.prepare("SELECT * FROM Organization").all(),
		platforms: db.prepare("SELECT * FROM SocialPlatform").all(),
		persons: db.prepare("SELECT PersonID, FullName FROM Person ORDER BY FullName").all(),
	};
}

// ── TAGS ─────────────────────────────────────────────────────────

function findOrCreateTag(name) {
	const db = getDb();
	const trimmed = name.trim();
	if (!trimmed) throw new Error("Tag name cannot be empty");
	const existing = db.prepare(`SELECT TagID FROM Tags WHERE lower(TagName) = lower(?)`).get(trimmed);
	if (existing) return existing.TagID;
	return db.prepare(`INSERT INTO Tags (TagName) VALUES (?)`).run(trimmed).lastInsertRowid;
}

function pruneOrphanTags() {
	getDb().exec(`DELETE FROM Tags WHERE TagID NOT IN (SELECT DISTINCT TagID FROM PersonTag)`);
}

function getTagsWithCounts() {
	return getDb()
		.prepare(
			`
    SELECT t.TagID, t.TagName, COUNT(pt.PersonID) as personCount
    FROM Tags t LEFT JOIN PersonTag pt ON t.TagID = pt.TagID
    GROUP BY t.TagID HAVING personCount > 0 ORDER BY t.TagName
  `,
		)
		.all();
}

function getPersonsByTagId(tagId) {
	return getDb()
		.prepare(
			`
    SELECT p.PersonID, p.FullName, p.Nickname, p.LastUpdated,
           c.CategoryName, c.HexCode as CategoryColor
    FROM Person p
    JOIN PersonTag pt ON p.PersonID = pt.PersonID
    LEFT JOIN Category c ON p.CategoryID = c.CategoryID
    WHERE pt.TagID = ?
    ORDER BY p.LastUpdated DESC
  `,
		)
		.all(tagId);
}

// ── PRONOUNS ─────────────────────────────────────────────────────

// Find or create pronoun (case-insensitive). Returns PronounsID.
function findOrCreatePronoun(text) {
	const db = getDb();
	const trimmed = text.trim();
	if (!trimmed) throw new Error("Pronoun cannot be empty");
	const existing = db.prepare(`SELECT PronounsID FROM Pronouns WHERE lower(Pronouns) = lower(?)`).get(trimmed);
	if (existing) return existing.PronounsID;
	return db.prepare(`INSERT INTO Pronouns (Pronouns) VALUES (?)`).run(trimmed).lastInsertRowid;
}

// Prune custom pronouns with no linked persons.
// Default pronouns (he/him, she/her, they/them) are protected.
function pruneOrphanPronouns() {
	const db = getDb();
	const placeholders = DEFAULT_PRONOUNS.map(() => "?").join(",");
	db.prepare(
		`
    DELETE FROM Pronouns
    WHERE PronounsID NOT IN (SELECT DISTINCT PronounsID FROM PersonPronouns)
      AND lower(Pronouns) NOT IN (${placeholders})
  `,
	).run(...DEFAULT_PRONOUNS.map((p) => p.toLowerCase()));
}

// ── CATEGORIES ────────────────────────────────────────────────────

// Find or create category (case-insensitive). Returns CategoryID.
function findOrCreateCategory(name, hexCode = "#6366f1") {
	const db = getDb();
	const trimmed = name.trim();
	if (!trimmed) throw new Error("Category name cannot be empty");
	const existing = db.prepare(`SELECT CategoryID FROM Category WHERE lower(CategoryName) = lower(?)`).get(trimmed);
	if (existing) return existing.CategoryID;
	return db.prepare(`INSERT INTO Category (CategoryName, SVGPath, HexCode) VALUES (?, '', ?)`).run(trimmed, hexCode).lastInsertRowid;
}

// Prune non-default categories with no linked persons.
function pruneOrphanCategories() {
	const db = getDb();
	const placeholders = DEFAULT_CATEGORIES.map(() => "?").join(",");
	db.prepare(
		`
    DELETE FROM Category
    WHERE CategoryID NOT IN (
      SELECT DISTINCT CategoryID FROM Person WHERE CategoryID IS NOT NULL
    )
      AND lower(CategoryName) NOT IN (${placeholders})
  `,
	).run(...DEFAULT_CATEGORIES);
}

// ── ACADEMIC INSTITUTIONS AND ORGANIZATIONS ────────────────────────────────────────────────────

// Find AcademicInst by name (case-insensitive), or create it. Returns InstID.
function findOrCreateInstitution(name) {
	const db = getDb();
	const trimmed = name.trim();
	if (!trimmed) throw new Error("Institution name cannot be empty");
	const existing = db.prepare(`SELECT InstID FROM AcademicInst WHERE lower(InstitutionName) = lower(?)`).get(trimmed);
	if (existing) return existing.InstID;
	return db.prepare(`INSERT INTO AcademicInst (InstitutionName, Link) VALUES (?, '')`).run(trimmed).lastInsertRowid;
}

// Find Organization by name (case-insensitive), or create it. Returns OrgID.
function findOrCreateOrganization(name) {
	const db = getDb();
	const trimmed = name.trim();
	if (!trimmed) throw new Error("Organization name cannot be empty");
	const existing = db.prepare(`SELECT OrgID FROM Organization WHERE lower(OrgName) = lower(?)`).get(trimmed);
	if (existing) return existing.OrgID;
	return db.prepare(`INSERT INTO Organization (OrgName) VALUES (?)`).run(trimmed).lastInsertRowid;
}

// ── LEGACY HELPERS (kept for IPC compatibility) ───────────────────
function addCategory(data) {
	return getDb().prepare("INSERT INTO Category (CategoryName,SVGPath,HexCode) VALUES (@CategoryName,@SVGPath,@HexCode)").run(data).lastInsertRowid;
}
function addPronoun(text) {
	return findOrCreatePronoun(text);
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
	findOrCreatePronoun,
	pruneOrphanPronouns,
	findOrCreateCategory,
	pruneOrphanCategories,
	addCategory,
	addPronoun,
	addOrg,
	addInstitution,
	findOrCreateInstitution,
	findOrCreateOrganization,
};
