// electron/ipc/index.js
const registerPersonHandlers    = require("./person.handlers");
const registerChildHandlers     = require("./child.handlers");
const registerLookupHandlers    = require("./lookup.handlers");
const registerSpecificsHandlers = require("./specifics.handlers"); // Phase B

module.exports = function registerAllHandlers() {
	registerPersonHandlers();
	registerChildHandlers();
	registerLookupHandlers();
	registerSpecificsHandlers(); // Phase B
};
