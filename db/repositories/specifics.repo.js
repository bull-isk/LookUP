// db/repositories/specifics.repo.js
const { getDb } = require("../connection");
const { touchLastUpdated } = require("./person.repo");

// ── READ: full specifics tree for a person ───────────────────────
// Returns nested structure: [{ SubName, SubSpecificsID, points: [{ PointName, PointID, values: [...] }] }]
// Ordered by SubSpecifics insertion order (preserves Preferences→Interests→Characteristics→Habits)
function getSpecificsForPerson(personId) {
	const db = getDb();

	const rows = db
		.prepare(
			`
    SELECT
      ss.SubSpecificsID, ss.SubName,
      sp.PointID, sp.PointName,
      s.SpecificsID, s.SpecificNote
    FROM SubSpecifics ss
    JOIN SpecificsPts sp ON sp.SubSpecificsID = ss.SubSpecificsID
    JOIN Specifics s ON s.PointID = sp.PointID
    WHERE s.PersonID = ?
    ORDER BY ss.rowid, sp.PointName, s.SpecificsID
  `,
		)
		.all(personId);

	// Nest: SubSpecifics → SpecificsPts → Specifics rows
	const subMap = new Map();
	rows.forEach((r) => {
		if (!subMap.has(r.SubSpecificsID)) {
			subMap.set(r.SubSpecificsID, {
				SubSpecificsID: r.SubSpecificsID,
				SubName: r.SubName,
				points: new Map(),
			});
		}
		const sub = subMap.get(r.SubSpecificsID);
		if (!sub.points.has(r.PointID)) {
			sub.points.set(r.PointID, { PointID: r.PointID, PointName: r.PointName, values: [] });
		}
		sub.points.get(r.PointID).values.push({
			SpecificsID: r.SpecificsID,
			SpecificNote: r.SpecificNote,
		});
	});

	return [...subMap.values()].map((sub) => ({
		...sub,
		points: [...sub.points.values()],
	}));
}

// ── READ: full tree structure (for UI dropdowns/autocomplete) ────
function getSpecificsTree() {
	const db = getDb();
	const subs = db.prepare(`SELECT SubSpecificsID, SubName FROM SubSpecifics ORDER BY rowid`).all();

	return subs.map((sub) => ({
		...sub,
		points: db.prepare(`SELECT PointID, PointName FROM SpecificsPts WHERE SubSpecificsID = ? ORDER BY PointName`).all(sub.SubSpecificsID),
	}));
}

// ── CREATE a single value entry ──────────────────────────────────
function createSpecificValue(data) {
	// data: { PersonID, PointID, SpecificNote }
	const id = getDb().prepare(`INSERT INTO Specifics (PersonID, PointID, SpecificNote) VALUES (@PersonID, @PointID, @SpecificNote)`).run(data).lastInsertRowid;
	touchLastUpdated(data.PersonID);
	return id;
}

// ── UPDATE a single value ────────────────────────────────────────
function updateSpecificValue(specificsId, note) {
	const db = getDb();
	const row = db.prepare(`SELECT PersonID FROM Specifics WHERE SpecificsID=?`).get(specificsId);
	db.prepare(`UPDATE Specifics SET SpecificNote=? WHERE SpecificsID=?`).run(note, specificsId);
	if (row) touchLastUpdated(row.PersonID);
}

// ── DELETE a single value ────────────────────────────────────────
function deleteSpecificValue(specificsId) {
	const db = getDb();
	const row = db.prepare(`SELECT PersonID FROM Specifics WHERE SpecificsID=?`).get(specificsId);
	db.prepare(`DELETE FROM Specifics WHERE SpecificsID=?`).run(specificsId);
	if (row) touchLastUpdated(row.PersonID);
}

// ── UPSERT SubSpecifics (find or create) ─────────────────────────
// Case-insensitive dedup.
function findOrCreateSub(subName) {
	const db = getDb();
	const trimmed = subName.trim();
	const existing = db.prepare(`SELECT SubSpecificsID FROM SubSpecifics WHERE lower(SubName) = lower(?)`).get(trimmed);
	if (existing) return existing.SubSpecificsID;
	return db.prepare(`INSERT INTO SubSpecifics (SubName) VALUES (?)`).run(trimmed).lastInsertRowid;
}

// ── UPSERT SpecificsPts (find or create under a sub) ────────────
function findOrCreatePoint(subSpecificsId, pointName) {
	const db = getDb();
	const trimmed = pointName.trim();
	const existing = db.prepare(`SELECT PointID FROM SpecificsPts WHERE SubSpecificsID=? AND lower(PointName)=lower(?)`).get(subSpecificsId, trimmed);
	if (existing) return existing.PointID;
	return db.prepare(`INSERT INTO SpecificsPts (SubSpecificsID, PointName) VALUES (?, ?)`).run(subSpecificsId, trimmed).lastInsertRowid;
}

module.exports = {
	getSpecificsForPerson,
	getSpecificsTree,
	createSpecificValue,
	updateSpecificValue,
	deleteSpecificValue,
	findOrCreateSub,
	findOrCreatePoint,
};