require('dotenv').config();
const mysql = require('mysql2/promise');
const crypto = require('crypto');

function generateComplaintTrackingCode() {
  return `LM-${crypto.randomBytes(8).toString('hex').toUpperCase()}`;
}

let pool = null;

function getPool() {
  if (!pool) {
    pool = mysql.createPool({
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT || 4000),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      ssl: { minVersion: 'TLSv1.2', rejectUnauthorized: true },
      waitForConnections: true,
      connectionLimit: 5,
      connectTimeout: 15000,
      enableKeepAlive: true,
      dateStrings: true,
    });
  }
  return pool;
}

// Convert SQLite-style statements to MySQL/TiDB style.
function convertSql(sql) {
  return sql
    .replace(/^\s*insert\s+or\s+ignore\s+into/i, 'INSERT IGNORE INTO')
    .replace(/^\s*insert\s+or\s+replace\s+into/i, 'REPLACE INTO');
}

async function init() {
  await getPool().query('SELECT 1');
  return true;
}

async function query(sql, params = []) {
  const trimmed = sql.trim().toLowerCase();

  // PRAGMA is SQLite-only and not needed with TiDB.
  if (trimmed.startsWith('pragma')) return [[]];

  const safeParams = (params || []).map((p) => (p === undefined ? null : p));

  try {
    const [result] = await getPool().query(convertSql(sql), safeParams);

    if (Array.isArray(result)) return [result];

    return [{
      insertId: result.insertId || 0,
      affectedRows: result.affectedRows || 0,
    }];
  } catch (err) {
    // Keep the old error wording so existing duplicate checks still work.
    if (err.code === 'ER_DUP_ENTRY') {
      err.message = 'UNIQUE constraint failed: ' + err.message;
    }
    throw err;
  }
}

module.exports = {
  query,
  init,
  generateComplaintTrackingCode,
};
