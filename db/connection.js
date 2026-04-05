// db/connection.js
const Database = require('better-sqlite3');
const path = require('path');
const { app } = require('electron');

let db = null;

function getDb() {
  if (!db) {
    // In dev, store DB next to the project. In prod, use userData.
    const dbPath = process.env.NODE_ENV === 'development'
      ? path.join(__dirname, '..', 'lookup-dev.db')
      : path.join(app.getPath('userData'), 'lookup.db');

    db = new Database(dbPath);

    // ENCRYPTION HOOK: Replace `new Database(dbPath)` above with an
    // encrypted driver (e.g. @journeyapps/sqlcipher) when ready.
    // All read/write goes through this one object — nothing else changes.

    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');

    console.log('[DB] Connected to:', dbPath);
  }
  return db;
}

function closeDb() {
  if (db) {
    db.close();
    db = null;
  }
}

module.exports = { getDb, closeDb };