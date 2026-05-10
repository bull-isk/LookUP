const { getDb } = require("./connection");

function initSchema() {
	const db = getDb();

	// ── ALL TABLES ─────────────────────────────────────────────────
	db.exec(`

		-- Lookup / reference tables

		CREATE TABLE IF NOT EXISTS Category (
		CategoryID   INTEGER PRIMARY KEY AUTOINCREMENT,
		CategoryName TEXT NOT NULL,
		SVGPath      TEXT NOT NULL DEFAULT '',
		HexCode      TEXT NOT NULL DEFAULT '#6366f1'
		);

		CREATE TABLE IF NOT EXISTS Timezones (
		TimezoneID    INTEGER PRIMARY KEY AUTOINCREMENT,
		Name          TEXT NOT NULL,
		AssociatedCity TEXT,
		GMTDifference TEXT
		);

		CREATE TABLE IF NOT EXISTS Pronouns (
		PronounsID INTEGER PRIMARY KEY AUTOINCREMENT,
		Pronouns   TEXT NOT NULL UNIQUE
		);

		CREATE TABLE IF NOT EXISTS Tags (
		TagID   INTEGER PRIMARY KEY AUTOINCREMENT,
		TagName TEXT NOT NULL UNIQUE
		);

		CREATE TABLE IF NOT EXISTS SocialPlatform (
		PlatformID   INTEGER PRIMARY KEY AUTOINCREMENT,
		PlatformName TEXT NOT NULL,
		Logo         TEXT NOT NULL DEFAULT '',
		URLTemplate  TEXT NOT NULL DEFAULT ''
		);

		CREATE TABLE IF NOT EXISTS AcademicInst (
		InstID          INTEGER PRIMARY KEY AUTOINCREMENT,
		InstitutionName TEXT NOT NULL UNIQUE,
		Link            TEXT NOT NULL DEFAULT ''
		);

		CREATE TABLE IF NOT EXISTS EduLevel (
		EduLevelID INTEGER PRIMARY KEY AUTOINCREMENT,
		LevelName  TEXT NOT NULL UNIQUE
		);

		CREATE TABLE IF NOT EXISTS Organization (
		OrgID   INTEGER PRIMARY KEY AUTOINCREMENT,
		OrgName TEXT NOT NULL UNIQUE
		);

		CREATE TABLE IF NOT EXISTS SubSpecifics (
		SubSpecificsID INTEGER PRIMARY KEY AUTOINCREMENT,
		SubName        TEXT NOT NULL UNIQUE
		);

		CREATE TABLE IF NOT EXISTS SpecificsPts (
		PointID        INTEGER PRIMARY KEY AUTOINCREMENT,
		SubSpecificsID INTEGER NOT NULL
			REFERENCES SubSpecifics(SubSpecificsID) ON DELETE CASCADE,
		PointName      TEXT NOT NULL
		);

		CREATE TABLE IF NOT EXISTS Media (
		MediaID  INTEGER PRIMARY KEY AUTOINCREMENT,
		FilePath TEXT NOT NULL,
		Date     TEXT
		);

		-- Core entity

		CREATE TABLE IF NOT EXISTS Person (
		PersonID       INTEGER PRIMARY KEY AUTOINCREMENT,
		FullName       TEXT NOT NULL,
		Nickname       TEXT,
		Birthdate      TEXT,
		Address        TEXT,
		ImpressionNote TEXT,
		TimezoneID     INTEGER REFERENCES Timezones(TimezoneID) ON DELETE SET NULL,
		CategoryID     INTEGER REFERENCES Category(CategoryID)  ON DELETE SET NULL,
		LastUpdated    TEXT
		);

		-- Junction tables

		CREATE TABLE IF NOT EXISTS PersonPronouns (
		PersonID   INTEGER NOT NULL REFERENCES Person(PersonID)  ON DELETE CASCADE,
		PronounsID INTEGER NOT NULL REFERENCES Pronouns(PronounsID) ON DELETE CASCADE,
		PRIMARY KEY (PersonID, PronounsID)
		);

		CREATE TABLE IF NOT EXISTS PersonTag (
		PersonID INTEGER NOT NULL REFERENCES Person(PersonID) ON DELETE CASCADE,
		TagID    INTEGER NOT NULL REFERENCES Tags(TagID)      ON DELETE CASCADE,
		PRIMARY KEY (PersonID, TagID)
		);

		CREATE TABLE IF NOT EXISTS PersonMedia (
		PersonID INTEGER NOT NULL REFERENCES Person(PersonID) ON DELETE CASCADE,
		MediaID  INTEGER NOT NULL REFERENCES Media(MediaID)   ON DELETE CASCADE,
		PRIMARY KEY (PersonID, MediaID)
		);

		-- Child entities

		CREATE TABLE IF NOT EXISTS SocialAccount (
		SocialID   INTEGER PRIMARY KEY AUTOINCREMENT,
		PersonID   INTEGER NOT NULL REFERENCES Person(PersonID)         ON DELETE CASCADE,
		PlatformID INTEGER NOT NULL REFERENCES SocialPlatform(PlatformID) ON DELETE RESTRICT,
		AccountTag TEXT NOT NULL
		);

		CREATE TABLE IF NOT EXISTS EduHistory (
		EduHistID    INTEGER PRIMARY KEY AUTOINCREMENT,
		PersonID     INTEGER NOT NULL REFERENCES Person(PersonID)       ON DELETE CASCADE,
		InstID       INTEGER REFERENCES AcademicInst(InstID)            ON DELETE SET NULL,
		EduLevelID   INTEGER REFERENCES EduLevel(EduLevelID)            ON DELETE SET NULL,
		Faculty      TEXT,
		FieldOfStudy TEXT,
		StartYear    INTEGER,
		EndYear      INTEGER,
		IsPresent    INTEGER NOT NULL DEFAULT 0
		);

		CREATE TABLE IF NOT EXISTS OrgHistory (
		OrgHistID INTEGER PRIMARY KEY AUTOINCREMENT,
		PersonID  INTEGER NOT NULL REFERENCES Person(PersonID)    ON DELETE CASCADE,
		OrgID     INTEGER REFERENCES Organization(OrgID)          ON DELETE SET NULL,
		Role      TEXT,
		StartYear INTEGER,
		EndYear   INTEGER,
		IsPresent INTEGER NOT NULL DEFAULT 0
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
		SayerID     INTEGER REFERENCES Person(PersonID)          ON DELETE SET NULL,
		Quote       TEXT NOT NULL,
		Date        TEXT
		);

		CREATE TABLE IF NOT EXISTS Specifics (
		SpecificsID  INTEGER PRIMARY KEY AUTOINCREMENT,
		PersonID     INTEGER NOT NULL REFERENCES Person(PersonID)     ON DELETE CASCADE,
		PointID      INTEGER NOT NULL REFERENCES SpecificsPts(PointID) ON DELETE RESTRICT,
		SpecificNote TEXT
		);
	`);

	seedLookups(db);

	// Prune orphan tags on every startup
	db.exec(`DELETE FROM Tags WHERE TagID NOT IN (SELECT DISTINCT TagID FROM PersonTag)`);

	console.log("[DB] Schema ready.");
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

	// ── Categories ─────────────────────────────────────────────────
	seedIfEmpty("Category", [
		{ CategoryName: "Friend", SVGPath: "", HexCode: "#6366f1" },
		{ CategoryName: "Family", SVGPath: "", HexCode: "#22c55e" },
		{ CategoryName: "Colleague", SVGPath: "", HexCode: "#f59e0b" },
		{ CategoryName: "Online Friend", SVGPath: "", HexCode: "#818cf8" },
	]);

	// ── Pronouns ───────────────────────────────────────────────────
	seedIfEmpty("Pronouns", [{ Pronouns: "he/him" }, { Pronouns: "she/her" }, { Pronouns: "they/them" }]);

	// ── Education levels ───────────────────────────────────────────
	seedIfEmpty("EduLevel", [{ LevelName: "Primary School" }, { LevelName: "Middle School" }, { LevelName: "High School" }, { LevelName: "College" }, { LevelName: "Other" }]);

	// ── Timezones ──────────────────────────────────────────────────
	seedIfEmpty("Timezones", [
		{ Name: "WIB", AssociatedCity: "Jakarta", GMTDifference: "+7" },
		{ Name: "WITA", AssociatedCity: "Makassar", GMTDifference: "+8" },
		{ Name: "WIT", AssociatedCity: "Jayapura", GMTDifference: "+9" },
		{ Name: "UTC", AssociatedCity: "London", GMTDifference: "+0" },
		{ Name: "EST", AssociatedCity: "New York", GMTDifference: "-5" },
		{ Name: "CST", AssociatedCity: "Chicago", GMTDifference: "-6" },
		{ Name: "MST", AssociatedCity: "Denver", GMTDifference: "-7" },
		{ Name: "PST", AssociatedCity: "LA", GMTDifference: "-8" },
		{ Name: "CET", AssociatedCity: "Paris", GMTDifference: "+1" },
		{ Name: "IST", AssociatedCity: "Mumbai", GMTDifference: "+5.5" },
		{ Name: "JST", AssociatedCity: "Tokyo", GMTDifference: "+9" },
		{ Name: "AEST", AssociatedCity: "Sydney", GMTDifference: "+10" },
	]);

	// ── Social platforms ───────────────────────────────────────────
	seedIfEmpty("SocialPlatform", [
		{ PlatformName: "WhatsApp", Logo: "", URLTemplate: "https://wa.me/{value}" },
		{ PlatformName: "Instagram", Logo: "", URLTemplate: "https://www.instagram.com/{value}" },
		{ PlatformName: "Twitter", Logo: "", URLTemplate: "https://twitter.com/{value}" },
		{ PlatformName: "Facebook", Logo: "", URLTemplate: "https://facebook.com/{value}" },
		{ PlatformName: "GitHub", Logo: "", URLTemplate: "https://github.com/{value}" },
		{ PlatformName: "LinkedIn", Logo: "", URLTemplate: "https://www.linkedin.com/in/{value}" },
	]);

	// ── Specifics structure ────────────────────────────────────────
	seedIfEmpty("SubSpecifics", [{ SubName: "Preferences" }, { SubName: "Interests" }, { SubName: "Characteristics" }, { SubName: "Habits" }]);

	const ptCount = db.prepare("SELECT COUNT(*) as n FROM SpecificsPts").get().n;
	if (ptCount === 0) {
		const subRows = db.prepare("SELECT SubSpecificsID, SubName FROM SubSpecifics").all();
		const subMap = Object.fromEntries(subRows.map((r) => [r.SubName, r.SubSpecificsID]));
		const ins = db.prepare("INSERT INTO SpecificsPts (SubSpecificsID, PointName) VALUES (@SubSpecificsID, @PointName)");
		const pts = [
			{ SubName: "Preferences", PointName: "Food" },
			{ SubName: "Preferences", PointName: "Music" },
			{ SubName: "Preferences", PointName: "Place" },
			{ SubName: "Preferences", PointName: "Colour" },
			{ SubName: "Interests", PointName: "Hobbies" },
			{ SubName: "Interests", PointName: "Sports" },
			{ SubName: "Interests", PointName: "Topics" },
			{ SubName: "Characteristics", PointName: "Strengths" },
			{ SubName: "Characteristics", PointName: "Weaknesses" },
			{ SubName: "Characteristics", PointName: "Communication style" },
			{ SubName: "Habits", PointName: "Morning routine" },
			{ SubName: "Habits", PointName: "Sleep schedule" },
		];
		pts.forEach((p) => ins.run({ SubSpecificsID: subMap[p.SubName], PointName: p.PointName }));
		console.log("[DB] Seeded SpecificsPts");
	}
}

module.exports = { initSchema };
