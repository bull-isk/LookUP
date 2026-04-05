// db/repositories/person.repo.js
const { getDb } = require('../connection');

// ── LIST ────────────────────────────────────────────────────────
function getAllPersons() {
  return getDb().prepare(`
    SELECT PersonID, FullName, Nickname, Birthdate FROM Person ORDER BY FullName
  `).all();
}

// ── FULL READ (all related data in one call) ─────────────────────
function getFullPerson(id) {
  const db = getDb();

  const person = db.prepare(`
    SELECT p.*, t.Name as TimezoneName
    FROM Person p
    LEFT JOIN Timezones t ON p.TimezoneID = t.TimezoneID
    WHERE p.PersonID = ?
  `).get(id);

  if (!person) return null;

  return {
    person,
    pronouns: db.prepare(`
      SELECT pr.PronounsID, pr.Pronouns FROM Pronouns pr
      JOIN PersonPronouns pp ON pr.PronounsID = pp.PronounsID
      WHERE pp.PersonID = ?
    `).all(id),

    tags: db.prepare(`
      SELECT t.TagID, t.TagName FROM Tags t
      JOIN PersonTag pt ON t.TagID = pt.TagID
      WHERE pt.PersonID = ?
    `).all(id),

    socialAccounts: db.prepare(`
      SELECT sa.SocialID, sa.AccountTag, sp.PlatformName
      FROM SocialAccount sa
      JOIN SocialPlatform sp ON sa.PlatformID = sp.PlatformID
      WHERE sa.PersonID = ?
    `).all(id),

    eduHistory: db.prepare(`
      SELECT eh.EduHistID, eh.StartYear, eh.EndYear, eh.FieldOfStudy,
             ai.InstitutionName, el.LevelName
      FROM EduHistory eh
      JOIN AcademicInst ai ON eh.InstID = ai.InstID
      JOIN EduLevel el ON eh.EduLevelID = el.EduLevelID
      WHERE eh.PersonID = ?
    `).all(id),

    orgHistory: db.prepare(`
      SELECT oh.OrgHistID, oh.Division, oh.StartYear, oh.EndYear,
             o.OrgName
      FROM OrgHistory oh
      JOIN Organization o ON oh.OrgID = o.OrgID
      WHERE oh.PersonID = ?
    `).all(id),

    notes: db.prepare(`SELECT NotesID, Note FROM Notes WHERE PersonID = ?`).all(id),

    quotes: db.prepare(`SELECT QuoteID, Quote, Date FROM Quote WHERE PersonID = ?`).all(id),

    wordMouths: db.prepare(`
      SELECT wm.WordMouthID, wm.Quote, wm.Date,
             p.FullName as SayerName, wm.SayerID
      FROM WordMouth wm
      LEFT JOIN Person p ON wm.SayerID = p.PersonID
      WHERE wm.PersonID = ?
    `).all(id),

    specifics: db.prepare(`
      SELECT s.SpecificsID, s.SpecificNote,
             sp.PointName, ss.SubName
      FROM Specifics s
      JOIN SpecificsPts sp ON s.PointID = sp.PointID
      JOIN SubSpecifics ss ON sp.SubSpecificsID = ss.SubSpecificsID
      WHERE s.PersonID = ?
      ORDER BY ss.SubName, sp.PointName
    `).all(id),

    media: db.prepare(`
      SELECT m.MediaID, m.FilePath, m.Date
      FROM Media m
      JOIN PersonMedia pm ON m.MediaID = pm.MediaID
      WHERE pm.PersonID = ?
    `).all(id),
  };
}

// ── CREATE ───────────────────────────────────────────────────────
function createPerson(data) {
  const db = getDb();
  const result = db.prepare(`
    INSERT INTO Person (FullName, Nickname, Birthdate, Address, ImpressionNote, TimezoneID)
    VALUES (@FullName, @Nickname, @Birthdate, @Address, @ImpressionNote, @TimezoneID)
  `).run(data);
  return result.lastInsertRowid;
}

// ── UPDATE ───────────────────────────────────────────────────────
function updatePerson(id, data) {
  return getDb().prepare(`
    UPDATE Person
    SET FullName=@FullName, Nickname=@Nickname, Birthdate=@Birthdate,
        Address=@Address, ImpressionNote=@ImpressionNote, TimezoneID=@TimezoneID
    WHERE PersonID=@PersonID
  `).run({ ...data, PersonID: id });
}

// ── DELETE ───────────────────────────────────────────────────────
function deletePerson(id) {
  // ON DELETE CASCADE handles: Quote, WordMouth, Notes, Specifics,
  // SocialAccount, EduHistory, OrgHistory, PersonPronouns, PersonTag, PersonMedia
  return getDb().prepare(`DELETE FROM Person WHERE PersonID = ?`).run(id);
}

// ── JUNCTION SYNC ────────────────────────────────────────────────
// Replace all pronouns / tags in a single transaction
const syncJunction = (table, fkCol) => (personId, ids) => {
  const db = getDb();
  const sync = db.transaction(() => {
    db.prepare(`DELETE FROM ${table} WHERE PersonID = ?`).run(personId);
    const ins = db.prepare(
      `INSERT INTO ${table} (PersonID, ${fkCol}) VALUES (?, ?)`
    );
    (ids || []).forEach(id => ins.run(personId, id));
  });
  sync();
};

const setPersonPronouns = syncJunction('PersonPronouns', 'PronounsID');
const setPersonTags     = syncJunction('PersonTag', 'TagID');

module.exports = {
  getAllPersons,
  getFullPerson,
  createPerson,
  updatePerson,
  deletePerson,
  setPersonPronouns,
  setPersonTags,
};