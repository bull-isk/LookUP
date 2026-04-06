// db/repositories/lookup.repo.js
const { getDb } = require("../connection");

function getAllLookups() {
	const db = getDb();
	return {
		categories: db.prepare("SELECT * FROM Category ORDER BY CategoryName").all(),
		pronouns: db.prepare("SELECT * FROM Pronouns").all(),
		tags: db.prepare("SELECT * FROM Tags").all(),
		timezones: db.prepare("SELECT * FROM Timezones").all(),
		eduLevels: db.prepare("SELECT * FROM EduLevel").all(),
		orgs: db.prepare("SELECT * FROM Organization").all(),
		institutions: db.prepare("SELECT * FROM AcademicInst").all(),
		platforms: db.prepare("SELECT * FROM SocialPlatform").all(),
		subSpecifics: db.prepare("SELECT * FROM SubSpecifics").all(),
		specificsPts: db
			.prepare(
				`
      SELECT sp.PointID, sp.PointName, ss.SubSpecificsID, ss.SubName
      FROM SpecificsPts sp
      JOIN SubSpecifics ss ON sp.SubSpecificsID = ss.SubSpecificsID
      ORDER BY ss.SubName, sp.PointName
    `,
			)
			.all(),
		persons: db.prepare("SELECT PersonID, FullName FROM Person ORDER BY FullName").all(),
	};
}

function addCategory(data) {
	return getDb().prepare("INSERT INTO Category (CategoryName,SVGPath,HexCode) VALUES (@CategoryName,@SVGPath,@HexCode)").run(data).lastInsertRowid;
}
function addTag(name) {
	return getDb().prepare("INSERT INTO Tags (TagName) VALUES (?)").run(name).lastInsertRowid;
}
function addPronoun(text) {
	return getDb().prepare("INSERT INTO Pronouns (Pronouns) VALUES (?)").run(text).lastInsertRowid;
}
function addOrg(name) {
	return getDb().prepare("INSERT INTO Organization (OrgName) VALUES (?)").run(name).lastInsertRowid;
}
function addInstitution(data) {
	return getDb().prepare("INSERT INTO AcademicInst (InstitutionName,Link) VALUES (@InstitutionName,@Link)").run(data).lastInsertRowid;
}

module.exports = { getAllLookups, addCategory, addTag, addPronoun, addOrg, addInstitution };
