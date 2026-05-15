// db/repositories/person.repo.js
const { getDb } = require("../connection");

// ADD at the top, after: const { getDb } = require('../connection');
const { pruneOrphanTags } = require("./lookup.repo");

// ── INTERNAL HELPER ──────────────────────────────────────────────
// Called by child.repo after any child create/update/delete.
// Exported so child.repo can import it without circular deps.
function touchLastUpdated(personId) {
	getDb().prepare(`UPDATE Person SET LastUpdated = datetime('now') WHERE PersonID = ?`).run(personId);
}

// ── LIST ────────────────────────────────────────────────────────
function getAllPersons() {
	return getDb()
		.prepare(
			`
    SELECT p.PersonID, p.FullName, p.Nickname, p.Birthdate, p.LastUpdated,
           c.CategoryName, c.HexCode
    FROM Person p
    LEFT JOIN Category c ON p.CategoryID = c.CategoryID
    ORDER BY p.FullName
  `,
		)
		.all();
}

// ── FULL READ ────────────────────────────────────────────────────
function getFullPerson(id) {
	const db = getDb();

	const person = db
		.prepare(
			`
    SELECT p.*, t.Name as TimezoneName,
           c.CategoryName, c.HexCode as CategoryColor
    FROM Person p
    LEFT JOIN Timezones t ON p.TimezoneID = t.TimezoneID
    LEFT JOIN Category c  ON p.CategoryID = c.CategoryID
    WHERE p.PersonID = ?
  `,
		)
		.get(id);

	if (!person) return null;

	return {
		person,
		pronouns: db
			.prepare(
				`
      SELECT pr.PronounsID, pr.Pronouns FROM Pronouns pr
      JOIN PersonPronouns pp ON pr.PronounsID = pp.PronounsID
      WHERE pp.PersonID = ?
    `,
			)
			.all(id),
		tags: db
			.prepare(
				`
      SELECT t.TagID, t.TagName FROM Tags t
      JOIN PersonTag pt ON t.TagID = pt.TagID
      WHERE pt.PersonID = ?
    `,
			)
			.all(id),
		socialAccounts: db
			.prepare(
				`
      SELECT sa.SocialID, sa.AccountTag, sp.PlatformName
      FROM SocialAccount sa
      JOIN SocialPlatform sp ON sa.PlatformID = sp.PlatformID
      WHERE sa.PersonID = ?
    `,
			)
			.all(id),
		// In person.repo.js — replace the eduHistory and orgHistory queries inside getFullPerson():

		// In getFullPerson(), replace the eduHistory query:
		socialAccounts: db
			.prepare(
				`
          SELECT sa.SocialID, sa.AccountTag, sp.PlatformName, sp.URLTemplate
          FROM SocialAccount sa
          JOIN SocialPlatform sp ON sa.PlatformID = sp.PlatformID
          WHERE sa.PersonID = ?
        `,
			)
			.all(id),

		eduHistory: db
			.prepare(
				`
        SELECT
          eh.EduHistID,
          eh.InstID,
          ai.InstitutionName,
          eh.EduLevelID,
          el.LevelName  AS EduLevelName,
          eh.Faculty,
          eh.FieldOfStudy,
          eh.StartYear,
          eh.EndYear,
          eh.IsPresent
        FROM EduHistory eh
        LEFT JOIN AcademicInst ai ON eh.InstID = ai.InstID
        LEFT JOIN EduLevel      el ON eh.EduLevelID = el.EduLevelID
        WHERE eh.PersonID = ?
        `,
			)
			.all(id),

		orgHistory: db
			.prepare(
				`
        SELECT
          oh.OrgHistID,
          oh.OrgID,
          o.OrgName,
          oh.Role,
          oh.StartYear,
          oh.EndYear,
          oh.IsPresent
        FROM OrgHistory oh
        LEFT JOIN Organization o ON oh.OrgID = o.OrgID
        WHERE oh.PersonID = ?
        `,
			)
			.all(id),

		notes: db.prepare(`SELECT NotesID, Note FROM Notes WHERE PersonID = ?`).all(id),

		quotes: db.prepare(`SELECT QuoteID, Quote, Date FROM Quote WHERE PersonID = ?`).all(id),

		wordMouths: db
			.prepare(
				`
          SELECT wm.WordMouthID, wm.Quote, wm.Date,
                p.FullName as SayerName, wm.SayerID
          FROM WordMouth wm
          LEFT JOIN Person p ON wm.SayerID = p.PersonID
          WHERE wm.PersonID = ?
    `,
			)
			.all(id),
		specifics: db
			.prepare(
          `
        SELECT s.SpecificsID, s.SpecificNote, sp.PointName, ss.SubName
        FROM Specifics s
        JOIN SpecificsPts sp ON s.PointID = sp.PointID
        JOIN SubSpecifics ss ON sp.SubSpecificsID = ss.SubSpecificsID
        WHERE s.PersonID = ?
        ORDER BY ss.SubName, sp.PointName
      `,
			)
			.all(id),
		media: db
			.prepare(
              `
        SELECT m.MediaID, m.FilePath, m.Date, m.Data, pm.Role
        FROM Media m
        JOIN PersonMedia pm ON m.MediaID = pm.MediaID
        WHERE pm.PersonID = ?
        ORDER BY
          CASE pm.Role
            WHEN 'primary'   THEN 0
            WHEN 'secondary' THEN 1
            ELSE                  2
          END,
          m.MediaID DESC
      `,
			)
			.all(id),
	};
}

// ── CREATE ───────────────────────────────────────────────────────
function createPerson(data) {
	const result = getDb()
		.prepare(
			`
    INSERT INTO Person
      (FullName, Nickname, Birthdate, Address, ImpressionNote, TimezoneID, CategoryID, LastUpdated)
    VALUES
      (@FullName, @Nickname, @Birthdate, @Address, @ImpressionNote, @TimezoneID, @CategoryID, datetime('now'))
  `,
		)
		.run(data);
	return result.lastInsertRowid;
}

// ── UPDATE ───────────────────────────────────────────────────────
function updatePerson(id, data) {
	return getDb()
		.prepare(
			`
    UPDATE Person
    SET FullName       = @FullName,
        Nickname       = @Nickname,
        Birthdate      = @Birthdate,
        Address        = @Address,
        ImpressionNote = @ImpressionNote,
        TimezoneID     = @TimezoneID,
        CategoryID     = @CategoryID,
        LastUpdated    = datetime('now')
    WHERE PersonID = @PersonID
  `,
		)
		.run({ ...data, PersonID: id });
}

// ── DELETE ───────────────────────────────────────────────────────
function deletePerson(id) {
	return getDb().prepare(`DELETE FROM Person WHERE PersonID = ?`).run(id);
}

// ── JUNCTION SYNC ────────────────────────────────────────────────
const syncJunction = (table, fkCol) => (personId, ids) => {
	const db = getDb();
	db.transaction(() => {
		db.prepare(`DELETE FROM ${table} WHERE PersonID = ?`).run(personId);
		const ins = db.prepare(`INSERT INTO ${table} (PersonID, ${fkCol}) VALUES (?, ?)`);
		(ids || []).forEach((id) => ins.run(personId, id));
	})();
	// Junction changes count as an update to the person
	touchLastUpdated(personId);
};

const setPersonPronouns = syncJunction("PersonPronouns", "PronounsID");
const setPersonTags = (personId, ids) => {
	syncJunction("PersonTag", "TagID")(personId, ids);
	// Phase B: remove tags that no longer have any linked persons
	pruneOrphanTags();
};
// ── BIRTHDAY QUERY ───────────────────────────────────────────────
// Returns all persons who have a Birthdate, with Category info.
// Birthday math (days until next) is done in JS — see birthday.js util.
function getBirthdayPersons() {
	return getDb()
		.prepare(
			`
    SELECT p.PersonID, p.FullName, p.Nickname, p.Birthdate,
           c.CategoryName, c.HexCode as CategoryColor
    FROM Person p
    LEFT JOIN Category c ON p.CategoryID = c.CategoryID
    WHERE p.Birthdate IS NOT NULL AND p.Birthdate != ''
    ORDER BY p.FullName
  `,
		)
		.all();
}

// ── RECENTLY UPDATED ─────────────────────────────────────────────
function getRecentlyUpdated(limit = 5) {
	return getDb()
		.prepare(
			`
    SELECT p.PersonID, p.FullName, p.Nickname, p.LastUpdated,
           c.CategoryName, c.HexCode as CategoryColor
    FROM Person p
    LEFT JOIN Category c ON p.CategoryID = c.CategoryID
    WHERE p.LastUpdated IS NOT NULL
    ORDER BY p.LastUpdated DESC
    LIMIT ?
  `,
		)
		.all(limit);
}

// ── FAVORITES HEURISTIC ──────────────────────────────────────────
// Score = count of non-null/non-empty fields across Person + child tables.
// We compute this in SQL with a series of CASE expressions so it's one round-trip.
function getFavorites(limit = 5) {
	return getDb()
		.prepare(
			`
    SELECT
      p.PersonID, p.FullName, p.Nickname,
      c.CategoryName, c.HexCode as CategoryColor,
      (
        -- Core fields (each = 1 point)
        (CASE WHEN p.Nickname       IS NOT NULL AND p.Nickname       != '' THEN 1 ELSE 0 END) +
        (CASE WHEN p.Birthdate      IS NOT NULL AND p.Birthdate      != '' THEN 1 ELSE 0 END) +
        (CASE WHEN p.Address        IS NOT NULL AND p.Address        != '' THEN 1 ELSE 0 END) +
        (CASE WHEN p.ImpressionNote IS NOT NULL AND p.ImpressionNote != '' THEN 1 ELSE 0 END) +
        (CASE WHEN p.TimezoneID     IS NOT NULL                            THEN 1 ELSE 0 END) +
        (CASE WHEN p.CategoryID     IS NOT NULL                            THEN 1 ELSE 0 END) +
        -- Child tables (each row = 1 point, capped at 3 per table to avoid bias)
        MIN(3, (SELECT COUNT(*) FROM Quote        WHERE PersonID = p.PersonID)) +
        MIN(3, (SELECT COUNT(*) FROM WordMouth    WHERE PersonID = p.PersonID)) +
        MIN(3, (SELECT COUNT(*) FROM Notes        WHERE PersonID = p.PersonID)) +
        MIN(3, (SELECT COUNT(*) FROM Specifics    WHERE PersonID = p.PersonID)) +
        MIN(3, (SELECT COUNT(*) FROM EduHistory   WHERE PersonID = p.PersonID)) +
        MIN(3, (SELECT COUNT(*) FROM OrgHistory   WHERE PersonID = p.PersonID)) +
        MIN(3, (SELECT COUNT(*) FROM SocialAccount WHERE PersonID = p.PersonID)) +
        MIN(3, (SELECT COUNT(*) FROM PersonMedia  WHERE PersonID = p.PersonID)) +
        MIN(3, (SELECT COUNT(*) FROM PersonPronouns WHERE PersonID = p.PersonID)) +
        MIN(3, (SELECT COUNT(*) FROM PersonTag    WHERE PersonID = p.PersonID))
      ) AS score
    FROM Person p
    LEFT JOIN Category c ON p.CategoryID = c.CategoryID
    ORDER BY score DESC, p.LastUpdated DESC
    LIMIT ?
  `,
		)
		.all(limit);
}

// ── PEOPLE BY TAG ────────────────────────────────────────────────
// Returns all tags that have at least one person, each with their people.
// Shape: [{ TagID, TagName, people: [...] }]
function getPeopleByTag() {
	const db = getDb();

	const tags = db
		.prepare(
			`
    SELECT DISTINCT t.TagID, t.TagName
    FROM Tags t
    JOIN PersonTag pt ON t.TagID = pt.TagID
    ORDER BY t.TagName
  `,
		)
		.all();

	return tags.map((tag) => ({
		...tag,
		people: db
			.prepare(
				`
      SELECT p.PersonID, p.FullName, p.Nickname,
             c.CategoryName, c.HexCode as CategoryColor
      FROM Person p
      JOIN PersonTag pt ON p.PersonID = pt.PersonID
      LEFT JOIN Category c ON p.CategoryID = c.CategoryID
      WHERE pt.TagID = ?
      ORDER BY p.FullName
    `,
			)
			.all(tag.TagID),
	}));
}

// ── SEARCH ───────────────────────────────────────────────────────
// Searches FullName, Nickname, and Tags. Returns ranked results.
function searchPersons(query) {
	if (!query || !query.trim()) return [];
	const db = getDb();
	const q = `%${query.trim().toLowerCase()}%`;

	return db
		.prepare(
			`
    SELECT DISTINCT
      p.PersonID, p.FullName, p.Nickname,
      c.CategoryName, c.HexCode as CategoryColor
    FROM Person p
    LEFT JOIN Category c ON p.CategoryID = c.CategoryID
    LEFT JOIN PersonTag pt ON p.PersonID = pt.PersonID
    LEFT JOIN Tags t ON pt.TagID = t.TagID
    WHERE lower(p.FullName) LIKE ?
       OR lower(p.Nickname) LIKE ?
       OR lower(t.TagName) LIKE ?
    ORDER BY
      -- Exact name match ranked first
      CASE WHEN lower(p.FullName) = lower(?) THEN 0 ELSE 1 END,
      p.FullName
    LIMIT 30
  `,
		)
		.all(q, q, q, query.trim());
}

// ADD before module.exports in person.repo.js:

// Deletes all persons in the "Populate Test" category.
// Called once during app init / on demand. CASCADE handles child rows.
function deletePopulateTest() {
	const db = getDb();
	const cat = db.prepare(`SELECT CategoryID FROM Category WHERE lower(CategoryName) = lower('Populate Test')`).get();
	if (!cat) return { changes: 0 };
	return db.prepare(`DELETE FROM Person WHERE CategoryID = ?`).run(cat.CategoryID);
}

// Also add `deletePopulateTest` to module.exports.

module.exports = {
	touchLastUpdated,
	getAllPersons,
	getFullPerson,
	createPerson,
	updatePerson,
	deletePerson,
	setPersonPronouns,
	setPersonTags,
	getBirthdayPersons,
	getRecentlyUpdated,
	getFavorites,
	getPeopleByTag,
	searchPersons,
	deletePopulateTest,
};
