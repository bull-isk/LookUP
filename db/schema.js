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

	db.exec(`DELETE FROM Tags WHERE TagID NOT IN (SELECT DISTINCT TagID FROM PersonTag)`);
	console.log("[DB] Startup: pruned orphan tags");

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

	const requiredCats = [
		{ CategoryName: "Friend", HexCode: "#0472ef" },
		{ CategoryName: "Family", HexCode: "#e61b73" },
		{ CategoryName: "Colleague", HexCode: "#f22314" },
		{ CategoryName: "Online Friend", HexCode: "#f2c514" },
	];
	const insertCat = db.prepare(`INSERT INTO Category (CategoryName, SVGPath, HexCode) VALUES (?, '', ?)`);
	requiredCats.forEach(({ CategoryName, HexCode }) => {
		const exists = db.prepare(`SELECT CategoryID FROM Category WHERE lower(CategoryName) = lower(?)`).get(CategoryName);
		if (!exists) insertCat.run(CategoryName, HexCode);
	});

	// ── Phase C migrations ────────────────────────────────────────────

	// 1. Add URL template column to SocialPlatform
	if (!hasColumn("SocialPlatform", "URLTemplate")) {
		db.exec(`ALTER TABLE SocialPlatform ADD COLUMN URLTemplate TEXT`);
		console.log("[DB] Migration: added SocialPlatform.URLTemplate");
	}

	// 2. Seed / update the 6 default platforms with URL templates.
	//    Uses INSERT OR IGNORE so existing rows are preserved, then updates URL.
	const defaultPlatforms = [
		{ PlatformName: "WhatsApp", Logo: "", URLTemplate: "https://wa.me/{value}" },
		{ PlatformName: "Instagram", Logo: "", URLTemplate: "https://www.instagram.com/{value}" },
		{ PlatformName: "Twitter", Logo: "", URLTemplate: "https://twitter.com/{value}" },
		{ PlatformName: "Facebook", Logo: "", URLTemplate: "https://facebook.com/{value}" },
		{ PlatformName: "GitHub", Logo: "", URLTemplate: "https://github.com/{value}" },
		{ PlatformName: "LinkedIn", Logo: "", URLTemplate: "https://www.linkedin.com/in/{value}" },
	];
	defaultPlatforms.forEach(({ PlatformName, Logo, URLTemplate }) => {
		const existing = db.prepare(`SELECT PlatformID FROM SocialPlatform WHERE lower(PlatformName) = lower(?)`).get(PlatformName);
		if (existing) {
			db.prepare(`UPDATE SocialPlatform SET URLTemplate=? WHERE PlatformID=?`).run(URLTemplate, existing.PlatformID);
		} else {
			db.prepare(`INSERT INTO SocialPlatform (PlatformName, Logo, URLTemplate) VALUES (?,?,?)`).run(PlatformName, Logo, URLTemplate);
		}
	});

	// 3. Seed new EduLevel values (the 5 required levels).
	//    Wipe old levels and reseed only if the old set is present.
	const oldLevels = db.prepare(`SELECT COUNT(*) as n FROM EduLevel WHERE LevelName IN ('High School','Bachelor''s','Master''s','Doctorate','Vocational','Associate')`).get();
	if (oldLevels.n > 0) {
		db.exec(`DELETE FROM EduHistory`); // FK-safe: cascade not needed, just wipe seeded test data
		db.exec(`DELETE FROM EduLevel`);
		const newLevels = ["Primary School", "Middle School", "High School", "College", "Other"];
		const insLevel = db.prepare(`INSERT INTO EduLevel (LevelName) VALUES (?)`);
		newLevels.forEach((l) => insLevel.run(l));
		console.log("[DB] Migration: reseeded EduLevel");
	}

	// 4. Add new free-text columns to EduHistory for Phase C education rework.
	if (!hasColumn("EduHistory", "EduLevelText")) {
		db.exec(`ALTER TABLE EduHistory ADD COLUMN EduLevelText  TEXT`); // "College", "High School", etc.
		db.exec(`ALTER TABLE EduHistory ADD COLUMN SubjectFocus  TEXT`); // High School only
		db.exec(`ALTER TABLE EduHistory ADD COLUMN IsPresent     INTEGER DEFAULT 0`); // 1 = currently enrolled
		console.log("[DB] Migration: added EduHistory.EduLevelText, SubjectFocus, IsPresent");
	}

	// 5. Delete all people in the "Populate Test" category.
	const popTestCat = db.prepare(`SELECT CategoryID FROM Category WHERE lower(CategoryName) = lower('Populate Test')`).get();
	if (popTestCat) {
		const deleted = db.prepare(`DELETE FROM Person WHERE CategoryID = ?`).run(popTestCat.CategoryID);
		if (deleted.changes > 0) {
			console.log(`[DB] Migration: deleted ${deleted.changes} Populate Test people`);
		}
	}

	// ADD inside runMigrations(), after all existing Phase C blocks:

	// Phase C Fix — make EduHistory FK columns nullable so edu entries
	// don't require valid InstID/EduLevelID (we use free-text fields instead).
	// SQLite can't ALTER COLUMN, so we recreate the table only if needed.
	const eduInfo = db.prepare(`PRAGMA table_info(EduHistory)`).all();
	const instCol = eduInfo.find((c) => c.name === "InstID");
	const levelCol = eduInfo.find((c) => c.name === "EduLevelID");
	// Check if columns are NOT NULL (notnull=1 means NOT NULL)
	if ((instCol && instCol.notnull === 1) || (levelCol && levelCol.notnull === 1)) {
		console.log("[DB] Migration: relaxing EduHistory FK constraints...");
		db.transaction(() => {
			// Get existing columns
			const cols = db
				.prepare(`PRAGMA table_info(EduHistory)`)
				.all()
				.map((c) => c.name);
			// Recreate without NOT NULL on InstID and EduLevelID
			db.exec(`
					CREATE TABLE IF NOT EXISTS EduHistory_new (
						EduHistID      INTEGER PRIMARY KEY AUTOINCREMENT,
						InstID         INTEGER REFERENCES AcademicInst(InstID) ON DELETE SET NULL,
						PersonID       INTEGER NOT NULL REFERENCES Person(PersonID) ON DELETE CASCADE,
						EduLevelID     INTEGER REFERENCES EduLevel(EduLevelID) ON DELETE SET NULL,
						StartYear      INTEGER,
						EndYear        INTEGER,
						FieldOfStudy   TEXT,
						InstitutionText TEXT,
						CityText        TEXT,
						Faculty         TEXT,
						Major           TEXT,
						StartYearText   TEXT,
						EndYearText     TEXT,
						EduLevelText    TEXT,
						SubjectFocus    TEXT,
						IsPresent       INTEGER DEFAULT 0
					)
					`);
			// Copy existing data (only columns that exist in old table)
			const safeColsAll = [
				"EduHistID",
				"PersonID",
				"StartYear",
				"EndYear",
				"FieldOfStudy",
				"InstitutionText",
				"CityText",
				"Faculty",
				"Major",
				"StartYearText",
				"EndYearText",
				"EduLevelText",
				"SubjectFocus",
				"IsPresent",
			];
			const safeCols = safeColsAll.filter((c) => cols.includes(c));
			// Always include InstID and EduLevelID but coerce to NULL-safe copy
			db.exec(`
			INSERT INTO EduHistory_new (${safeCols.join(",")}, InstID, EduLevelID)
			SELECT ${safeCols.join(",")}, NULL, NULL FROM EduHistory
			`);
			db.exec(`DROP TABLE EduHistory`);
			db.exec(`ALTER TABLE EduHistory_new RENAME TO EduHistory`);
		})();
		console.log("[DB] Migration: EduHistory FK columns are now nullable");
	}

	// Same fix for OrgHistory — OrgID is NOT NULL with FK reference
	const orgInfo = db.prepare(`PRAGMA table_info(OrgHistory)`).all();
	const orgCol = orgInfo.find((c) => c.name === "OrgID");
	if (orgCol && orgCol.notnull === 1) {
		console.log("[DB] Migration: relaxing OrgHistory FK constraints...");
		db.transaction(() => {
			const cols = db
				.prepare(`PRAGMA table_info(OrgHistory)`)
				.all()
				.map((c) => c.name);
			db.exec(`
					CREATE TABLE IF NOT EXISTS OrgHistory_new (
						OrgHistID     INTEGER PRIMARY KEY AUTOINCREMENT,
						OrgID         INTEGER REFERENCES Organization(OrgID) ON DELETE SET NULL,
						PersonID      INTEGER NOT NULL REFERENCES Person(PersonID) ON DELETE CASCADE,
						Division      TEXT,
						StartYear     INTEGER,
						EndYear       INTEGER,
						OrgNameText   TEXT,
						Role          TEXT,
						StartYearText TEXT,
						EndYearText   TEXT
					)
					`);
			const safeColsAll = ["OrgHistID", "PersonID", "Division", "StartYear", "EndYear", "OrgNameText", "Role", "StartYearText", "EndYearText"];
			const safeCols = safeColsAll.filter((c) => cols.includes(c));
			db.exec(`
					INSERT INTO OrgHistory_new (${safeCols.join(",")}, OrgID)
					SELECT ${safeCols.join(",")}, NULL FROM OrgHistory
					`);
			db.exec(`DROP TABLE OrgHistory`);
			db.exec(`ALTER TABLE OrgHistory_new RENAME TO OrgHistory`);
		})();
		console.log("[DB] Migration: OrgHistory FK columns are now nullable");
	}

	// Post-Phase-C: add IsPresent to OrgHistory (same as EduHistory)
	if (!hasColumn("OrgHistory", "IsPresent")) {
		db.exec(`ALTER TABLE OrgHistory ADD COLUMN IsPresent INTEGER DEFAULT 0`);
		console.log("[DB] Migration: added OrgHistory.IsPresent");
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
