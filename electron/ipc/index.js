// electron/ipc/index.js
const registerPersonHandlers = require('./person.handlers');
const registerChildHandlers  = require('./child.handlers');
const registerLookupHandlers = require('./lookup.handlers');

module.exports = function registerAllHandlers() {
  registerPersonHandlers();
  registerChildHandlers();
  registerLookupHandlers();
};