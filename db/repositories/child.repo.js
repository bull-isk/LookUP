// db/repositories/child.repo.js
const { getDb } = require("../connection");
const { touchLastUpdated } = require("./person.repo");

// ── QUOTE ────────────────────────────────────────────────────────
function createQuote(data) {
	const id = getDb().prepare(`INSERT INTO Quote (PersonID,Quote,Date) VALUES (@PersonID,@Quote,@Date)`).run(data).lastInsertRowid;
	touchLastUpdated(data.PersonID);
	return id;
}
function updateQuote(id, data) {
	const q = getDb().prepare(`SELECT PersonID FROM Quote WHERE QuoteID=?`).get(id);
	getDb()
		.prepare(`UPDATE Quote SET Quote=@Quote, Date=@Date WHERE QuoteID=@id`)
		.run({ ...data, id });
	if (q) touchLastUpdated(q.PersonID);
}
function deleteQuote(id) {
	const q = getDb().prepare(`SELECT PersonID FROM Quote WHERE QuoteID=?`).get(id);
	getDb().prepare(`DELETE FROM Quote WHERE QuoteID=?`).run(id);
	if (q) touchLastUpdated(q.PersonID);
}

// ── WORDMOUTH ────────────────────────────────────────────────────
function createWordMouth(data) {
	const id = getDb().prepare(`INSERT INTO WordMouth (PersonID,SayerID,Quote,Date) VALUES (@PersonID,@SayerID,@Quote,@Date)`).run(data).lastInsertRowid;
	touchLastUpdated(data.PersonID);
	return id;
}
function updateWordMouth(id, data) {
	const w = getDb().prepare(`SELECT PersonID FROM WordMouth WHERE WordMouthID=?`).get(id);
	getDb()
		.prepare(`UPDATE WordMouth SET SayerID=@SayerID, Quote=@Quote, Date=@Date WHERE WordMouthID=@id`)
		.run({ ...data, id });
	if (w) touchLastUpdated(w.PersonID);
}
function deleteWordMouth(id) {
	const w = getDb().prepare(`SELECT PersonID FROM WordMouth WHERE WordMouthID=?`).get(id);
	getDb().prepare(`DELETE FROM WordMouth WHERE WordMouthID=?`).run(id);
	if (w) touchLastUpdated(w.PersonID);
}

// ── NOTES ────────────────────────────────────────────────────────
function createNote(data) {
	const id = getDb().prepare(`INSERT INTO Notes (PersonID,Note) VALUES (@PersonID,@Note)`).run(data).lastInsertRowid;
	touchLastUpdated(data.PersonID);
	return id;
}
function updateNote(id, data) {
	const n = getDb().prepare(`SELECT PersonID FROM Notes WHERE NotesID=?`).get(id);
	getDb()
		.prepare(`UPDATE Notes SET Note=@Note WHERE NotesID=@id`)
		.run({ ...data, id });
	if (n) touchLastUpdated(n.PersonID);
}
function deleteNote(id) {
	const n = getDb().prepare(`SELECT PersonID FROM Notes WHERE NotesID=?`).get(id);
	getDb().prepare(`DELETE FROM Notes WHERE NotesID=?`).run(id);
	if (n) touchLastUpdated(n.PersonID);
}

// ── EDUCATION ────────────────────────────────────────────────────
// Fields used: PersonID, InstitutionText, FieldOfStudy (was Major),
//              Faculty, EduLevelText, StartYearText, EndYearText, IsPresent
// Removed: CityText, SubjectFocus, Major (merged into FieldOfStudy)
function createEdu(data) {
	const id = getDb()
		.prepare(
			`
    INSERT INTO EduHistory
      (PersonID, InstitutionText, FieldOfStudy, Faculty, EduLevelText, StartYear, EndYear, IsPresent)
    VALUES
      (@PersonID, @InstitutionText, @FieldOfStudy, @Faculty, @EduLevelText, @StartYear, @EndYear, @IsPresent)
  `,
		)
		.run({
			PersonID: data.PersonID,
			InstitutionText: data.InstitutionText || "",
			FieldOfStudy: data.FieldOfStudy || "",
			Faculty: data.Faculty || "",
			EduLevelText: data.EduLevelText || "",
			StartYear: data.StartYear ? Number(data.StartYear) : null,
			EndYear: data.IsPresent ? null : data.EndYear ? Number(data.EndYear) : null,
			IsPresent: data.IsPresent ? 1 : 0,
		}).lastInsertRowid;
	touchLastUpdated(data.PersonID);
	return id;
}

function updateEdu(id, data) {
	const e = getDb().prepare(`SELECT PersonID FROM EduHistory WHERE EduHistID=?`).get(id);
	getDb()
		.prepare(
			`
    UPDATE EduHistory
    SET InstitutionText=@InstitutionText,
        FieldOfStudy=@FieldOfStudy,
        Faculty=@Faculty,
        EduLevelText=@EduLevelText,
        StartYear=@StartYear,
        EndYear=@EndYear,
        IsPresent=@IsPresent
    WHERE EduHistID=@id
  `,
		)
		.run({
			id,
			InstitutionText: data.InstitutionText || "",
			FieldOfStudy: data.FieldOfStudy || "",
			Faculty: data.Faculty || "",
			EduLevelText: data.EduLevelText || "",
			StartYear: data.StartYear ? Number(data.StartYear) : null,
			EndYear: data.IsPresent ? null : data.EndYear ? Number(data.EndYear) : null,
			IsPresent: data.IsPresent ? 1 : 0,
		});
	if (e) touchLastUpdated(e.PersonID);
}

function deleteEdu(id) {
	const e = getDb().prepare(`SELECT PersonID FROM EduHistory WHERE EduHistID=?`).get(id);
	getDb().prepare(`DELETE FROM EduHistory WHERE EduHistID=?`).run(id);
	if (e) touchLastUpdated(e.PersonID);
}

// ── ORGANIZATION ──────────────────────────────────────────────────
// OrgID is now nullable.
function createOrg(data) {
  const id = getDb().prepare(`
    INSERT INTO OrgHistory (PersonID, OrgNameText, Role, StartYear, EndYear, IsPresent)
    VALUES (@PersonID, @OrgNameText, @Role, @StartYear, @EndYear, @IsPresent)
  `).run({
    PersonID:    data.PersonID,
    OrgNameText: data.OrgNameText || '',
    Role:        data.Role        || '',
    StartYear:   data.StartYear   ? Number(data.StartYear) : null,
    EndYear:     data.IsPresent ? null : (data.EndYear ? Number(data.EndYear) : null),
    IsPresent:   data.IsPresent ? 1 : 0,
  }).lastInsertRowid;
  touchLastUpdated(data.PersonID);
  return id;
}

function updateOrg(id, data) {
  const o = getDb().prepare(`SELECT PersonID FROM OrgHistory WHERE OrgHistID=?`).get(id);
  getDb().prepare(`
    UPDATE OrgHistory
    SET OrgNameText=@OrgNameText,
        Role=@Role,
        StartYear=@StartYear,
        EndYear=@EndYear,
        IsPresent=@IsPresent
    WHERE OrgHistID=@id
  `).run({
    id,
    OrgNameText: data.OrgNameText || '',
    Role:        data.Role        || '',
    StartYear:   data.StartYear   ? Number(data.StartYear) : null,
    EndYear:     data.IsPresent ? null : (data.EndYear ? Number(data.EndYear) : null),
    IsPresent:   data.IsPresent ? 1 : 0,
  });
  if (o) touchLastUpdated(o.PersonID);
}

function deleteOrg(id) {
	const o = getDb().prepare(`SELECT PersonID FROM OrgHistory WHERE OrgHistID=?`).get(id);
	getDb().prepare(`DELETE FROM OrgHistory WHERE OrgHistID=?`).run(id);
	if (o) touchLastUpdated(o.PersonID);
}

// ── SOCIAL ACCOUNT ───────────────────────────────────────────────
function createSocial(data) {
	const id = getDb().prepare(`INSERT INTO SocialAccount (PersonID,PlatformID,AccountTag) VALUES (@PersonID,@PlatformID,@AccountTag)`).run(data).lastInsertRowid;
	touchLastUpdated(data.PersonID);
	return id;
}
function updateSocial(id, accountTag) {
	const db = getDb();
	const s = db.prepare(`SELECT PersonID FROM SocialAccount WHERE SocialID=?`).get(id);
	db.prepare(`UPDATE SocialAccount SET AccountTag=? WHERE SocialID=?`).run(accountTag, id);
	if (s) touchLastUpdated(s.PersonID);
}
function deleteSocial(id) {
	const s = getDb().prepare(`SELECT PersonID FROM SocialAccount WHERE SocialID=?`).get(id);
	getDb().prepare(`DELETE FROM SocialAccount WHERE SocialID=?`).run(id);
	if (s) touchLastUpdated(s.PersonID);
}

// ── MEDIA ────────────────────────────────────────────────────────
function createMedia(data) {
	return getDb().prepare(`INSERT INTO Media (FilePath,Date) VALUES (@FilePath,@Date)`).run(data).lastInsertRowid;
}
function linkMedia(personId, mediaId) {
	try {
		getDb().prepare(`INSERT INTO PersonMedia (PersonID,MediaID) VALUES (?,?)`).run(personId, mediaId);
		touchLastUpdated(personId);
	} catch (e) {
		/* already linked */
	}
}
function unlinkMedia(personId, mediaId) {
	getDb().prepare(`DELETE FROM PersonMedia WHERE PersonID=? AND MediaID=?`).run(personId, mediaId);
	touchLastUpdated(personId);
}

module.exports = {
	createQuote,
	updateQuote,
	deleteQuote,
	createWordMouth,
	updateWordMouth,
	deleteWordMouth,
	createNote,
	updateNote,
	deleteNote,
	createEdu,
	updateEdu,
	deleteEdu,
	createOrg,
	updateOrg,
	deleteOrg,
	createSocial,
	updateSocial,
	deleteSocial,
	createMedia,
	linkMedia,
	unlinkMedia,
};
