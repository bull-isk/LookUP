// db/repositories/child.repo.js
// Handles: Quote, WordMouth, Notes, Specifics, EduHistory, OrgHistory,
//          SocialAccount, Media, PersonMedia
const { getDb } = require('../connection');

// ── QUOTE (by person) ────────────────────────────────────────────
function createQuote(data)        { return getDb().prepare(`INSERT INTO Quote (PersonID,Quote,Date) VALUES (@PersonID,@Quote,@Date)`).run(data).lastInsertRowid; }
function updateQuote(id, data)    { return getDb().prepare(`UPDATE Quote SET Quote=@Quote, Date=@Date WHERE QuoteID=@id`).run({...data, id}); }
function deleteQuote(id)          { return getDb().prepare(`DELETE FROM Quote WHERE QuoteID=?`).run(id); }

// ── WORDMOUTH (about person) ──────────────────────────────────────
function createWordMouth(data)    { return getDb().prepare(`INSERT INTO WordMouth (PersonID,SayerID,Quote,Date) VALUES (@PersonID,@SayerID,@Quote,@Date)`).run(data).lastInsertRowid; }
function updateWordMouth(id,data) { return getDb().prepare(`UPDATE WordMouth SET SayerID=@SayerID, Quote=@Quote, Date=@Date WHERE WordMouthID=@id`).run({...data, id}); }
function deleteWordMouth(id)      { return getDb().prepare(`DELETE FROM WordMouth WHERE WordMouthID=?`).run(id); }

// ── NOTES ────────────────────────────────────────────────────────
function createNote(data)         { return getDb().prepare(`INSERT INTO Notes (PersonID,Note) VALUES (@PersonID,@Note)`).run(data).lastInsertRowid; }
function updateNote(id, data)     { return getDb().prepare(`UPDATE Notes SET Note=@Note WHERE NotesID=@id`).run({...data, id}); }
function deleteNote(id)           { return getDb().prepare(`DELETE FROM Notes WHERE NotesID=?`).run(id); }

// ── SPECIFICS ────────────────────────────────────────────────────
function createSpecific(data)     { return getDb().prepare(`INSERT INTO Specifics (PersonID,PointID,SpecificNote) VALUES (@PersonID,@PointID,@SpecificNote)`).run(data).lastInsertRowid; }
function updateSpecific(id,data)  { return getDb().prepare(`UPDATE Specifics SET PointID=@PointID, SpecificNote=@SpecificNote WHERE SpecificsID=@id`).run({...data, id}); }
function deleteSpecific(id)       { return getDb().prepare(`DELETE FROM Specifics WHERE SpecificsID=?`).run(id); }

// ── EDU HISTORY ──────────────────────────────────────────────────
function createEdu(data)          { return getDb().prepare(`INSERT INTO EduHistory (PersonID,InstID,EduLevelID,StartYear,EndYear,FieldOfStudy) VALUES (@PersonID,@InstID,@EduLevelID,@StartYear,@EndYear,@FieldOfStudy)`).run(data).lastInsertRowid; }
function updateEdu(id,data)       { return getDb().prepare(`UPDATE EduHistory SET InstID=@InstID, EduLevelID=@EduLevelID, StartYear=@StartYear, EndYear=@EndYear, FieldOfStudy=@FieldOfStudy WHERE EduHistID=@id`).run({...data, id}); }
function deleteEdu(id)            { return getDb().prepare(`DELETE FROM EduHistory WHERE EduHistID=?`).run(id); }

// ── ORG HISTORY ──────────────────────────────────────────────────
function createOrg(data)          { return getDb().prepare(`INSERT INTO OrgHistory (PersonID,OrgID,Division,StartYear,EndYear) VALUES (@PersonID,@OrgID,@Division,@StartYear,@EndYear)`).run(data).lastInsertRowid; }
function updateOrg(id,data)       { return getDb().prepare(`UPDATE OrgHistory SET OrgID=@OrgID, Division=@Division, StartYear=@StartYear, EndYear=@EndYear WHERE OrgHistID=@id`).run({...data, id}); }
function deleteOrg(id)            { return getDb().prepare(`DELETE FROM OrgHistory WHERE OrgHistID=?`).run(id); }

// ── SOCIAL ACCOUNT ───────────────────────────────────────────────
function createSocial(data)       { return getDb().prepare(`INSERT INTO SocialAccount (PersonID,PlatformID,AccountTag) VALUES (@PersonID,@PlatformID,@AccountTag)`).run(data).lastInsertRowid; }
function deleteSocial(id)         { return getDb().prepare(`DELETE FROM SocialAccount WHERE SocialID=?`).run(id); }

// ── MEDIA ────────────────────────────────────────────────────────
function createMedia(data)        { return getDb().prepare(`INSERT INTO Media (FilePath,Date) VALUES (@FilePath,@Date)`).run(data).lastInsertRowid; }
function linkMedia(personId, mediaId) {
  try {
    getDb().prepare(`INSERT INTO PersonMedia (PersonID,MediaID) VALUES (?,?)`).run(personId, mediaId);
  } catch(e) { /* already linked */ }
}
function unlinkMedia(personId, mediaId) {
  getDb().prepare(`DELETE FROM PersonMedia WHERE PersonID=? AND MediaID=?`).run(personId, mediaId);
}

module.exports = {
  createQuote, updateQuote, deleteQuote,
  createWordMouth, updateWordMouth, deleteWordMouth,
  createNote, updateNote, deleteNote,
  createSpecific, updateSpecific, deleteSpecific,
  createEdu, updateEdu, deleteEdu,
  createOrg, updateOrg, deleteOrg,
  createSocial, deleteSocial,
  createMedia, linkMedia, unlinkMedia,
};