const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbDir = path.join(__dirname, '../../data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'coding_gym.db');
const db = new Database(dbPath);

// Enable WAL mode for high performance offline local usage
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function initDb() {
  const schemaPath = path.join(__dirname, 'schema.sql');
  const schemaSql = fs.readFileSync(schemaPath, 'utf8');
  db.exec(schemaSql);

  // Initialize default user_profile if empty
  const user = db.prepare("SELECT * FROM user_profile WHERE id = 'me'").get();
  if (!user) {
    db.prepare(`
      INSERT INTO user_profile (id, xp, level, streak_days, last_active_date, daily_goal_problems, daily_goal_minutes)
      VALUES ('me', 0, 1, 0, date('now', 'localtime'), 3, 30)
    `).run();
  }
}

initDb();

module.exports = db;
