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
	const r = getDb()
		.prepare(`UPDATE Quote SET Quote=@Quote, Date=@Date WHERE QuoteID=@id`)
		.run({ ...data, id });
	// Need PersonID to touch — fetch it first
	const q = getDb().prepare(`SELECT PersonID FROM Quote WHERE QuoteID=?`).get(id);
	if (q) touchLastUpdated(q.PersonID);
	return r;
}
function deleteQuote(id) {
	const q = getDb().prepare(`SELECT PersonID FROM Quote WHERE QuoteID=?`).get(id);
	const r = getDb().prepare(`DELETE FROM Quote WHERE QuoteID=?`).run(id);
	if (q) touchLastUpdated(q.PersonID);
	return r;
}

// ── WORDMOUTH ────────────────────────────────────────────────────
function createWordMouth(data) {
	const id = getDb().prepare(`INSERT INTO WordMouth (PersonID,SayerID,Quote,Date) VALUES (@PersonID,@SayerID,@Quote,@Date)`).run(data).lastInsertRowid;
	touchLastUpdated(data.PersonID);
	return id;
}
function updateWordMouth(id, data) {
	const w = getDb().prepare(`SELECT PersonID FROM WordMouth WHERE WordMouthID=?`).get(id);
	const r = getDb()
		.prepare(`UPDATE WordMouth SET SayerID=@SayerID, Quote=@Quote, Date=@Date WHERE WordMouthID=@id`)
		.run({ ...data, id });
	if (w) touchLastUpdated(w.PersonID);
	return r;
}
function deleteWordMouth(id) {
	const w = getDb().prepare(`SELECT PersonID FROM WordMouth WHERE WordMouthID=?`).get(id);
	const r = getDb().prepare(`DELETE FROM WordMouth WHERE WordMouthID=?`).run(id);
	if (w) touchLastUpdated(w.PersonID);
	return r;
}

// ── NOTES ────────────────────────────────────────────────────────
function createNote(data) {
	const id = getDb().prepare(`INSERT INTO Notes (PersonID,Note) VALUES (@PersonID,@Note)`).run(data).lastInsertRowid;
	touchLastUpdated(data.PersonID);
	return id;
}
function updateNote(id, data) {
	const n = getDb().prepare(`SELECT PersonID FROM Notes WHERE NotesID=?`).get(id);
	const r = getDb()
		.prepare(`UPDATE Notes SET Note=@Note WHERE NotesID=@id`)
		.run({ ...data, id });
	if (n) touchLastUpdated(n.PersonID);
	return r;
}
function deleteNote(id) {
	const n = getDb().prepare(`SELECT PersonID FROM Notes WHERE NotesID=?`).get(id);
	const r = getDb().prepare(`DELETE FROM Notes WHERE NotesID=?`).run(id);
	if (n) touchLastUpdated(n.PersonID);
	return r;
}

// ── SPECIFICS ────────────────────────────────────────────────────
function createSpecific(data) {
	const id = getDb().prepare(`INSERT INTO Specifics (PersonID,PointID,SpecificNote) VALUES (@PersonID,@PointID,@SpecificNote)`).run(data).lastInsertRowid;
	touchLastUpdated(data.PersonID);
	return id;
}
function updateSpecific(id, data) {
	const s = getDb().prepare(`SELECT PersonID FROM Specifics WHERE SpecificsID=?`).get(id);
	const r = getDb()
		.prepare(`UPDATE Specifics SET PointID=@PointID, SpecificNote=@SpecificNote WHERE SpecificsID=@id`)
		.run({ ...data, id });
	if (s) touchLastUpdated(s.PersonID);
	return r;
}
function deleteSpecific(id) {
	const s = getDb().prepare(`SELECT PersonID FROM Specifics WHERE SpecificsID=?`).get(id);
	const r = getDb().prepare(`DELETE FROM Specifics WHERE SpecificsID=?`).run(id);
	if (s) touchLastUpdated(s.PersonID);
	return r;
}

// ── EDU HISTORY ──────────────────────────────────────────────────
function createEdu(data) {
	const id = getDb()
		.prepare(`INSERT INTO EduHistory (PersonID,InstID,EduLevelID,StartYear,EndYear,FieldOfStudy) VALUES (@PersonID,@InstID,@EduLevelID,@StartYear,@EndYear,@FieldOfStudy)`)
		.run(data).lastInsertRowid;
	touchLastUpdated(data.PersonID);
	return id;
}
function updateEdu(id, data) {
	const e = getDb().prepare(`SELECT PersonID FROM EduHistory WHERE EduHistID=?`).get(id);
	const r = getDb()
		.prepare(`UPDATE EduHistory SET InstID=@InstID, EduLevelID=@EduLevelID, StartYear=@StartYear, EndYear=@EndYear, FieldOfStudy=@FieldOfStudy WHERE EduHistID=@id`)
		.run({ ...data, id });
	if (e) touchLastUpdated(e.PersonID);
	return r;
}
function deleteEdu(id) {
	const e = getDb().prepare(`SELECT PersonID FROM EduHistory WHERE EduHistID=?`).get(id);
	const r = getDb().prepare(`DELETE FROM EduHistory WHERE EduHistID=?`).run(id);
	if (e) touchLastUpdated(e.PersonID);
	return r;
}

// ── ORG HISTORY ──────────────────────────────────────────────────
function createOrg(data) {
	const id = getDb().prepare(`INSERT INTO OrgHistory (PersonID,OrgID,Division,StartYear,EndYear) VALUES (@PersonID,@OrgID,@Division,@StartYear,@EndYear)`).run(data).lastInsertRowid;
	touchLastUpdated(data.PersonID);
	return id;
}
function updateOrg(id, data) {
	const o = getDb().prepare(`SELECT PersonID FROM OrgHistory WHERE OrgHistID=?`).get(id);
	const r = getDb()
		.prepare(`UPDATE OrgHistory SET OrgID=@OrgID, Division=@Division, StartYear=@StartYear, EndYear=@EndYear WHERE OrgHistID=@id`)
		.run({ ...data, id });
	if (o) touchLastUpdated(o.PersonID);
	return r;
}
function deleteOrg(id) {
	const o = getDb().prepare(`SELECT PersonID FROM OrgHistory WHERE OrgHistID=?`).get(id);
	const r = getDb().prepare(`DELETE FROM OrgHistory WHERE OrgHistID=?`).run(id);
	if (o) touchLastUpdated(o.PersonID);
	return r;
}

// ── SOCIAL ACCOUNT ───────────────────────────────────────────────
function createSocial(data) {
	const id = getDb().prepare(`INSERT INTO SocialAccount (PersonID,PlatformID,AccountTag) VALUES (@PersonID,@PlatformID,@AccountTag)`).run(data).lastInsertRowid;
	touchLastUpdated(data.PersonID);
	return id;
}
function deleteSocial(id) {
	const s = getDb().prepare(`SELECT PersonID FROM SocialAccount WHERE SocialID=?`).get(id);
	const r = getDb().prepare(`DELETE FROM SocialAccount WHERE SocialID=?`).run(id);
	if (s) touchLastUpdated(s.PersonID);
	return r;
}

// ── MEDIA ────────────────────────────────────────────────────────
function createMedia(data) {
	return getDb().prepare(`INSERT INTO Media (FilePath,Date) VALUES (@FilePath,@Date)`).run(data).lastInsertRowid;
	// Note: lastInsertRowid returned BEFORE linkMedia is called, so touch happens in linkMedia
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
	createSpecific,
	updateSpecific,
	deleteSpecific,
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
