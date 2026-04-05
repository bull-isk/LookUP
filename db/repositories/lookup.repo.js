// db/repositories/lookup.repo.js
const { getDb } = require('../connection');

function getAllLookups() {
  const db = getDb();
  return {
    pronouns:    db.prepare('SELECT * FROM Pronouns').all(),
    tags:        db.prepare('SELECT * FROM Tags').all(),
    timezones:   db.prepare('SELECT * FROM Timezones').all(),
    eduLevels:   db.prepare('SELECT * FROM EduLevel').all(),
    orgs:        db.prepare('SELECT * FROM Organization').all(),
    institutions:db.prepare('SELECT * FROM AcademicInst').all(),
    platforms:   db.prepare('SELECT * FROM SocialPlatform').all(),
    subSpecifics:db.prepare('SELECT * FROM SubSpecifics').all(),
    specificsPts:db.prepare(`
      SELECT sp.PointID, sp.PointName, ss.SubSpecificsID, ss.SubName
      FROM SpecificsPts sp
      JOIN SubSpecifics ss ON sp.SubSpecificsID = ss.SubSpecificsID
      ORDER BY ss.SubName, sp.PointName
    `).all(),
    persons:     db.prepare('SELECT PersonID, FullName FROM Person ORDER BY FullName').all(),
  };
}

// CRUD for lookup tables (add new items from the UI)
function addTag(name)         { return getDb().prepare('INSERT INTO Tags (TagName) VALUES (?)').run(name).lastInsertRowid; }
function addPronoun(text)     { return getDb().prepare('INSERT INTO Pronouns (Pronouns) VALUES (?)').run(text).lastInsertRowid; }
function addOrg(name)         { return getDb().prepare('INSERT INTO Organization (OrgName) VALUES (?)').run(name).lastInsertRowid; }
function addInstitution(data) { return getDb().prepare('INSERT INTO AcademicInst (InstitutionName,Link) VALUES (@InstitutionName,@Link)').run(data).lastInsertRowid; }

module.exports = { getAllLookups, addTag, addPronoun, addOrg, addInstitution };