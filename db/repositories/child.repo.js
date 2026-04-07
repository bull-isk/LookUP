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

// ── EDUCATION — now fully free-text ──────────────────────────────
// Old FK columns (InstID, EduLevelID, StartYear, EndYear, FieldOfStudy) are preserved
// in the DB but no longer written by this function. New free-text columns are used.
function createEdu(data) {
	// data: { PersonID, InstitutionText, CityText, Faculty, Major, StartYearText, EndYearText }
	const id = getDb()
		.prepare(
			`
    INSERT INTO EduHistory
      (PersonID, InstID, EduLevelID,
       InstitutionText, CityText, Faculty, Major, StartYearText, EndYearText)
    VALUES
      (@PersonID, 1, 1,
       @InstitutionText, @CityText, @Faculty, @Major, @StartYearText, @EndYearText)
  `,
		)
		.run({
			PersonID: data.PersonID,
			InstitutionText: data.InstitutionText || "",
			CityText: data.CityText || "",
			Faculty: data.Faculty || "",
			Major: data.Major || "",
			StartYearText: data.StartYearText || "",
			EndYearText: data.EndYearText || "",
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
    SET InstitutionText=@InstitutionText, CityText=@CityText,
        Faculty=@Faculty, Major=@Major,
        StartYearText=@StartYearText, EndYearText=@EndYearText
    WHERE EduHistID=@id
  `,
		)
		.run({
			id,
			InstitutionText: data.InstitutionText || "",
			CityText: data.CityText || "",
			Faculty: data.Faculty || "",
			Major: data.Major || "",
			StartYearText: data.StartYearText || "",
			EndYearText: data.EndYearText || "",
		});
	if (e) touchLastUpdated(e.PersonID);
}
function deleteEdu(id) {
	const e = getDb().prepare(`SELECT PersonID FROM EduHistory WHERE EduHistID=?`).get(id);
	getDb().prepare(`DELETE FROM EduHistory WHERE EduHistID=?`).run(id);
	if (e) touchLastUpdated(e.PersonID);
}

// ── ORGANIZATION — now fully free-text ───────────────────────────
function createOrg(data) {
	// data: { PersonID, OrgNameText, Role, StartYearText, EndYearText }
	const id = getDb()
		.prepare(
			`
    INSERT INTO OrgHistory
      (PersonID, OrgID, OrgNameText, Role, StartYearText, EndYearText)
    VALUES
      (@PersonID, 1, @OrgNameText, @Role, @StartYearText, @EndYearText)
  `,
		)
		.run({
			PersonID: data.PersonID,
			OrgNameText: data.OrgNameText || "",
			Role: data.Role || "",
			StartYearText: data.StartYearText || "",
			EndYearText: data.EndYearText || "",
		}).lastInsertRowid;
	touchLastUpdated(data.PersonID);
	return id;
}
function updateOrg(id, data) {
	const o = getDb().prepare(`SELECT PersonID FROM OrgHistory WHERE OrgHistID=?`).get(id);
	getDb()
		.prepare(
			`
    UPDATE OrgHistory
    SET OrgNameText=@OrgNameText, Role=@Role,
        StartYearText=@StartYearText, EndYearText=@EndYearText
    WHERE OrgHistID=@id
  `,
		)
		.run({
			id,
			OrgNameText: data.OrgNameText || "",
			Role: data.Role || "",
			StartYearText: data.StartYearText || "",
			EndYearText: data.EndYearText || "",
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
	deleteSocial,
	createMedia,
	linkMedia,
	unlinkMedia,
};
