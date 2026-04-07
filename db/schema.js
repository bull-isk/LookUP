// db/schema.js
const { getDb } = require("./connection");

function initSchema() {
	const db = getDb();

	db.exec(`
    -- ── LOOKUP TABLES ──────────────────────────────────────────

    CREATE TABLE IF NOT EXISTS Category (
      CategoryID   INTEGER PRIMARY KEY AUTOINCREMENT,
      CategoryName TEXT NOT NULL,
      SVGPath      TEXT,
      HexCode      TEXT
    );

    CREATE TABLE IF NOT EXISTS Timezones (
      TimezoneID     INTEGER PRIMARY KEY AUTOINCREMENT,
      Name           TEXT NOT NULL,
      AssociatedCity TEXT,
      GMTDifference  TEXT
    );

    CREATE TABLE IF NOT EXISTS Pronouns (
      PronounsID INTEGER PRIMARY KEY AUTOINCREMENT,
      Pronouns   TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS SocialPlatform (
      PlatformID   INTEGER PRIMARY KEY AUTOINCREMENT,
      PlatformName TEXT NOT NULL,
      Logo         TEXT
    );

    CREATE TABLE IF NOT EXISTS AcademicInst (
      InstID          INTEGER PRIMARY KEY AUTOINCREMENT,
      InstitutionName TEXT NOT NULL,
      Link            TEXT
    );

    CREATE TABLE IF NOT EXISTS EduLevel (
      EduLevelID INTEGER PRIMARY KEY AUTOINCREMENT,
      LevelName  TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS Organization (
      OrgID   INTEGER PRIMARY KEY AUTOINCREMENT,
      OrgName TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS Tags (
      TagID   INTEGER PRIMARY KEY AUTOINCREMENT,
      TagName TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS SubSpecifics (
      SubSpecificsID INTEGER PRIMARY KEY AUTOINCREMENT,
      SubName        TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS SpecificsPts (
      PointID        INTEGER PRIMARY KEY AUTOINCREMENT,
      SubSpecificsID INTEGER NOT NULL
        REFERENCES SubSpecifics(SubSpecificsID) ON DELETE RESTRICT,
      PointName      TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS Media (
      MediaID  INTEGER PRIMARY KEY AUTOINCREMENT,
      FilePath TEXT NOT NULL,
      Date     TEXT
    );

    -- ── CORE ENTITY ─────────────────────────────────────────────

    CREATE TABLE IF NOT EXISTS Person (
      PersonID       INTEGER PRIMARY KEY AUTOINCREMENT,
      FullName       TEXT NOT NULL,
      Nickname       TEXT,
      Birthdate      TEXT,
      Address        TEXT,
      ImpressionNote TEXT,
      TimezoneID     INTEGER
        REFERENCES Timezones(TimezoneID) ON DELETE SET NULL
    );

    -- ── JUNCTION TABLES ─────────────────────────────────────────

    CREATE TABLE IF NOT EXISTS PersonPronouns (
      PersonID   INTEGER NOT NULL REFERENCES Person(PersonID) ON DELETE CASCADE,
      PronounsID INTEGER NOT NULL REFERENCES Pronouns(PronounsID) ON DELETE CASCADE,
      PRIMARY KEY (PersonID, PronounsID)
    );

    CREATE TABLE IF NOT EXISTS PersonTag (
      PersonID INTEGER NOT NULL REFERENCES Person(PersonID) ON DELETE CASCADE,
      TagID    INTEGER NOT NULL REFERENCES Tags(TagID) ON DELETE CASCADE,
      PRIMARY KEY (PersonID, TagID)
    );

    CREATE TABLE IF NOT EXISTS PersonMedia (
      PersonID INTEGER NOT NULL REFERENCES Person(PersonID) ON DELETE CASCADE,
      MediaID  INTEGER NOT NULL REFERENCES Media(MediaID) ON DELETE CASCADE,
      PRIMARY KEY (PersonID, MediaID)
    );

    -- ── CHILD ENTITIES ───────────────────────────────────────────

    CREATE TABLE IF NOT EXISTS SocialAccount (
      SocialID   INTEGER PRIMARY KEY AUTOINCREMENT,
      PlatformID INTEGER NOT NULL
        REFERENCES SocialPlatform(PlatformID) ON DELETE RESTRICT,
      PersonID   INTEGER NOT NULL
        REFERENCES Person(PersonID) ON DELETE CASCADE,
      AccountTag TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS EduHistory (
      EduHistID    INTEGER PRIMARY KEY AUTOINCREMENT,
      InstID       INTEGER NOT NULL REFERENCES AcademicInst(InstID) ON DELETE RESTRICT,
      PersonID     INTEGER NOT NULL REFERENCES Person(PersonID) ON DELETE CASCADE,
      EduLevelID   INTEGER NOT NULL REFERENCES EduLevel(EduLevelID) ON DELETE RESTRICT,
      StartYear    INTEGER,
      EndYear      INTEGER,
      FieldOfStudy TEXT
    );

    CREATE TABLE IF NOT EXISTS OrgHistory (
      OrgHistID INTEGER PRIMARY KEY AUTOINCREMENT,
      OrgID     INTEGER NOT NULL REFERENCES Organization(OrgID) ON DELETE RESTRICT,
      PersonID  INTEGER NOT NULL REFERENCES Person(PersonID) ON DELETE CASCADE,
      Division  TEXT,
      StartYear INTEGER,
      EndYear   INTEGER
    );

    CREATE TABLE IF NOT EXISTS Notes (
      NotesID  INTEGER PRIMARY KEY AUTOINCREMENT,
      PersonID INTEGER NOT NULL REFERENCES Person(PersonID) ON DELETE CASCADE,
      Note     TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS Quote (
      QuoteID  INTEGER PRIMARY KEY AUTOINCREMENT,
      PersonID INTEGER NOT NULL REFERENCES Person(PersonID) ON DELETE CASCADE,
      Quote    TEXT NOT NULL,
      Date     TEXT
    );

    CREATE TABLE IF NOT EXISTS WordMouth (
      WordMouthID INTEGER PRIMARY KEY AUTOINCREMENT,
      PersonID    INTEGER NOT NULL REFERENCES Person(PersonID) ON DELETE CASCADE,
      SayerID     INTEGER REFERENCES Person(PersonID) ON DELETE SET NULL,
      Quote       TEXT NOT NULL,
      Date        TEXT
    );

    CREATE TABLE IF NOT EXISTS Specifics (
      SpecificsID  INTEGER PRIMARY KEY AUTOINCREMENT,
      PointID      INTEGER NOT NULL
        REFERENCES SpecificsPts(PointID) ON DELETE RESTRICT,
      PersonID     INTEGER NOT NULL
        REFERENCES Person(PersonID) ON DELETE CASCADE,
      SpecificNote TEXT
    );
  `);

	// ── MIGRATIONS (safe to run on existing DB) ───────────────────
	runMigrations(db);

	// ── SEED ─────────────────────────────────────────────────────
	seedLookups(db);

	console.log("[DB] Schema ready.");
}

// db/schema.js  — only the runMigrations function changes
// Replace the existing runMigrations() with this one. Everything else stays.

function runMigrations(db) {
	const hasColumn = (table, col) =>
		db
			.prepare(`PRAGMA table_info(${table})`)
			.all()
			.some((c) => c.name === col);

	// Phase A migrations (keep these)
	if (!hasColumn("Person", "LastUpdated")) {
		db.exec(`ALTER TABLE Person ADD COLUMN LastUpdated TEXT`);
		db.exec(`UPDATE Person SET LastUpdated = datetime('now') WHERE LastUpdated IS NULL`);
		console.log("[DB] Migration: added Person.LastUpdated");
	}
	if (!hasColumn("Person", "CategoryID")) {
		db.exec(`ALTER TABLE Person ADD COLUMN CategoryID INTEGER REFERENCES Category(CategoryID) ON DELETE SET NULL`);
		console.log("[DB] Migration: added Person.CategoryID");
	}

	// Phase B — reset Specifics hierarchy to new 4-category structure
	// Guard: only run if the OLD seed names exist (Personality, Physical)
	// so this is safe to re-run on a fresh DB that already has new names.
	const oldSub = db.prepare(`SELECT COUNT(*) as n FROM SubSpecifics WHERE SubName IN ('Personality','Physical')`).get();

	if (oldSub.n > 0) {
		console.log("[DB] Migration: resetting Specifics hierarchy...");
		db.transaction(() => {
			// Cascade via FK: delete Specifics first, then SpecificsPts, then SubSpecifics
			db.exec(`DELETE FROM Specifics`);
			db.exec(`DELETE FROM SpecificsPts`);
			db.exec(`DELETE FROM SubSpecifics`);

			// Re-seed with new 4 top-level categories (order matters for UI)
			const insertSub = db.prepare(`INSERT INTO SubSpecifics (SubName) VALUES (?)`);
			const subs = ["Preferences", "Interests", "Characteristics", "Habits"];
			const subIds = {};
			subs.forEach((name) => {
				const r = insertSub.run(name);
				subIds[name] = r.lastInsertRowid;
			});

			// Seed starter points under each category
			const insertPt = db.prepare(`INSERT INTO SpecificsPts (SubSpecificsID, PointName) VALUES (?, ?)`);
			const pts = {
				Preferences: ["Food", "Music", "Place", "Colour", "Season"],
				Interests: ["Hobbies", "Sports", "Topics", "Media", "Travel"],
				Characteristics: ["Strengths", "Weaknesses", "Communication style", "Love language"],
				Habits: ["Morning routine", "Sleep schedule", "Exercise", "Reading"],
			};
			Object.entries(pts).forEach(([sub, points]) => {
				points.forEach((pt) => insertPt.run(subIds[sub], pt));
			});
		})();
		console.log("[DB] Migration: Specifics hierarchy reset complete.");
	}

	// Phase B Refinement — free-text fields for EduHistory
	// (old FK-based fields stay nullable for existing data; new text fields added)
	if (!hasColumn("EduHistory", "InstitutionText")) {
		db.exec(`ALTER TABLE EduHistory ADD COLUMN InstitutionText TEXT`);
		db.exec(`ALTER TABLE EduHistory ADD COLUMN CityText        TEXT`);
		db.exec(`ALTER TABLE EduHistory ADD COLUMN Faculty         TEXT`);
		db.exec(`ALTER TABLE EduHistory ADD COLUMN Major           TEXT`);
		db.exec(`ALTER TABLE EduHistory ADD COLUMN StartYearText   TEXT`);
		db.exec(`ALTER TABLE EduHistory ADD COLUMN EndYearText     TEXT`);
		console.log("[DB] Migration: added free-text fields to EduHistory");
	}

	// Phase B Refinement — free-text fields for OrgHistory
	if (!hasColumn("OrgHistory", "OrgNameText")) {
		db.exec(`ALTER TABLE OrgHistory ADD COLUMN OrgNameText  TEXT`);
		db.exec(`ALTER TABLE OrgHistory ADD COLUMN Role         TEXT`);
		db.exec(`ALTER TABLE OrgHistory ADD COLUMN StartYearText TEXT`);
		db.exec(`ALTER TABLE OrgHistory ADD COLUMN EndYearText   TEXT`);
		console.log("[DB] Migration: added free-text fields to OrgHistory");
	}
}

function seedLookups(db) {
	const seedIfEmpty = (table, rows) => {
		const count = db.prepare(`SELECT COUNT(*) as n FROM ${table}`).get().n;
		if (count > 0) return;
		const keys = Object.keys(rows[0]);
		const cols = keys.join(", ");
		const vals = keys.map((k) => `@${k}`).join(", ");
		const insert = db.prepare(`INSERT INTO ${table} (${cols}) VALUES (${vals})`);
		rows.forEach((r) => insert.run(r));
		console.log(`[DB] Seeded ${table}`);
	};

	seedIfEmpty("Category", [
		{ CategoryName: "Personal", SVGPath: "", HexCode: "#4A90D9" },
		{ CategoryName: "Professional", SVGPath: "", HexCode: "#7B68EE" },
		{ CategoryName: "Family", SVGPath: "", HexCode: "#E8A838" },
		{ CategoryName: "Acquaintance", SVGPath: "", HexCode: "#6AAB6A" },
	]);

	seedIfEmpty("Pronouns", [{ Pronouns: "he/him" }, { Pronouns: "she/her" }, { Pronouns: "they/them" }, { Pronouns: "xe/xem" }, { Pronouns: "prefer not to say" }]);

	seedIfEmpty("EduLevel", [
		{ LevelName: "High School" },
		{ LevelName: "Bachelor's" },
		{ LevelName: "Master's" },
		{ LevelName: "Doctorate" },
		{ LevelName: "Vocational" },
		{ LevelName: "Associate" },
	]);

	seedIfEmpty("Timezones", [
		{ Name: "WIB", AssociatedCity: "Jakarta", GMTDifference: "+7" },
		{ Name: "WITA", AssociatedCity: "Makassar", GMTDifference: "+8" },
		{ Name: "WIT", AssociatedCity: "Jayapura", GMTDifference: "+9" },
		{ Name: "UTC", AssociatedCity: "London", GMTDifference: "+0" },
		{ Name: "EST", AssociatedCity: "New York", GMTDifference: "-5" },
		{ Name: "JST", AssociatedCity: "Tokyo", GMTDifference: "+9" },
	]);

	seedIfEmpty("Tags", [{ TagName: "friend" }, { TagName: "colleague" }, { TagName: "family" }, { TagName: "mentor" }, { TagName: "contact" }]);

	seedIfEmpty("SocialPlatform", [
		{ PlatformName: "Instagram", Logo: "" },
		{ PlatformName: "X / Twitter", Logo: "" },
		{ PlatformName: "LinkedIn", Logo: "" },
		{ PlatformName: "TikTok", Logo: "" },
		{ PlatformName: "GitHub", Logo: "" },
	]);

	seedIfEmpty("Organization", [{ OrgName: "Freelance" }, { OrgName: "Unknown" }]);

	seedIfEmpty("AcademicInst", [{ InstitutionName: "Unknown", Link: "" }]);

	seedIfEmpty("SubSpecifics", [{ SubName: "Personality" }, { SubName: "Preferences" }, { SubName: "Physical" }, { SubName: "Habits" }]);

	const ptCount = db.prepare("SELECT COUNT(*) as n FROM SpecificsPts").get().n;
	if (ptCount === 0) {
		const subRows = db.prepare("SELECT SubSpecificsID, SubName FROM SubSpecifics").all();
		const subMap = Object.fromEntries(subRows.map((r) => [r.SubName, r.SubSpecificsID]));
		const pts = [
			{ SubSpecificsID: subMap["Personality"], PointName: "Strengths" },
			{ SubSpecificsID: subMap["Personality"], PointName: "Weaknesses" },
			{ SubSpecificsID: subMap["Personality"], PointName: "Communication style" },
			{ SubSpecificsID: subMap["Preferences"], PointName: "Favourite food" },
			{ SubSpecificsID: subMap["Preferences"], PointName: "Favourite music" },
			{ SubSpecificsID: subMap["Preferences"], PointName: "Favourite place" },
			{ SubSpecificsID: subMap["Physical"], PointName: "Height" },
			{ SubSpecificsID: subMap["Physical"], PointName: "Eye colour" },
			{ SubSpecificsID: subMap["Habits"], PointName: "Morning routine" },
			{ SubSpecificsID: subMap["Habits"], PointName: "Sleep schedule" },
		];
		const ins = db.prepare("INSERT INTO SpecificsPts (SubSpecificsID, PointName) VALUES (@SubSpecificsID, @PointName)");
		pts.forEach((p) => ins.run(p));
		console.log("[DB] Seeded SpecificsPts");
	}
}

module.exports = { initSchema };
