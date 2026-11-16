const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DB_FILE = path.join(__dirname, 'lucky_movers.db');

let db = null;
let ready = null;

function generateComplaintTrackingCode() {
  return `LM-${crypto.randomBytes(8).toString('hex').toUpperCase()}`;
}

function init() {
  if (ready) return ready;

  ready = initSqlJs()
    .then((SQL) => {
      if (fs.existsSync(DB_FILE)) {
        db = new SQL.Database(fs.readFileSync(DB_FILE));
      } else {
        db = new SQL.Database();
      }

      db.run(`
        CREATE TABLE IF NOT EXISTS drivers (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          email TEXT UNIQUE,
          phone TEXT UNIQUE,
          password TEXT NOT NULL,
          truckType TEXT,
          truckPlate TEXT,
          availability TEXT DEFAULT 'offline',
          suspensionReason TEXT,
          suspendedAt TEXT,
          createdAt TEXT DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS customers (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          email TEXT UNIQUE,
          phone TEXT UNIQUE,
          password TEXT NOT NULL,
          createdAt TEXT DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS bookings (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          customerId INTEGER,
          customerName TEXT,
          customerPhone TEXT,
          customerEmail TEXT,
          selectedTruck TEXT,
          offeredPrice REAL,
          agreedPrice REAL,
          pickupLocation TEXT,
          destination TEXT,
          pickupDate TEXT,
          cargoDescription TEXT,
          bookingCode TEXT,
          status TEXT DEFAULT 'Pending',
          driverId INTEGER,
          driverName TEXT,
          driverCounterPrice REAL,
          paymentMethod TEXT,
          paymentPhone TEXT,
          paymentStatus TEXT,
          paidAt TEXT,
          pickupCoords TEXT,
          destinationCoords TEXT,
          tripStartedAt TEXT,
          tripCompletedAt TEXT,
          createdAt TEXT DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS complaints (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          bookingId INTEGER,
          driverId INTEGER,
          customerName TEXT,
          customerPhone TEXT,
          subject TEXT,
          message TEXT,
          trackingCode TEXT UNIQUE,
          status TEXT DEFAULT 'Open',
          adminNote TEXT,
          createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
          deletedAt TEXT
        );

        CREATE TABLE IF NOT EXISTS booking_rejected_drivers (
          bookingId INTEGER,
          driverId INTEGER,
          PRIMARY KEY (bookingId, driverId)
        );

        CREATE TABLE IF NOT EXISTS driver_hidden_bookings (
          bookingId INTEGER NOT NULL,
          driverId INTEGER NOT NULL,
          hiddenAt TEXT DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (bookingId, driverId)
        );
        CREATE TABLE IF NOT EXISTS booking_offers (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          bookingId INTEGER NOT NULL,
          driverId INTEGER NOT NULL,
          driverName TEXT,
          driverPhone TEXT,
          price REAL NOT NULL,
          message TEXT,
          status TEXT DEFAULT 'pending',
          createdAt TEXT DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS booking_requests (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          bookingId INTEGER NOT NULL,
          driverId INTEGER NOT NULL,
          status TEXT NOT NULL DEFAULT 'pending',
          createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
          UNIQUE (bookingId, driverId)
        );

        CREATE TABLE IF NOT EXISTS financial_settings (
          id INTEGER PRIMARY KEY CHECK (id = 1),
          commissionRate REAL NOT NULL DEFAULT 10,
          registrationFeeUGX REAL NOT NULL DEFAULT 0,
          updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS payment_transactions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          bookingId INTEGER NOT NULL,
          provider TEXT NOT NULL
            CHECK (provider IN ('MTN', 'AIRTEL')),
          transactionReference TEXT NOT NULL UNIQUE,
          providerTransactionId TEXT,
          amountUGX REAL NOT NULL CHECK (amountUGX > 0),
          currency TEXT NOT NULL DEFAULT 'UGX'
            CHECK (currency = 'UGX'),
          status TEXT NOT NULL DEFAULT 'Pending'
            CHECK (
              status IN (
                'Pending',
                'Processing',
                'Successful',
                'Failed',
                'Cancelled'
              )
            ),
          verificationMethod TEXT,
          verificationResponseCode TEXT,
          createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
          verifiedAt TEXT,
          FOREIGN KEY (bookingId) REFERENCES bookings(id)
        );
      `);

      // Add missing GPS columns to existing drivers tables.
      const driverColumnsResult = db.exec('PRAGMA table_info(drivers)');
      const existingDriverColumns = driverColumnsResult.length
        ? driverColumnsResult[0].values.map((column) => column[1])
        : [];

      if (!existingDriverColumns.includes('latitude')) {
        db.run('ALTER TABLE drivers ADD COLUMN latitude REAL');
      }

      if (!existingDriverColumns.includes('longitude')) {
        db.run('ALTER TABLE drivers ADD COLUMN longitude REAL');
      }

      if (!existingDriverColumns.includes('locationUpdatedAt')) {
        db.run('ALTER TABLE drivers ADD COLUMN locationUpdatedAt TEXT');
      }


      // Add email verification fields to existing customers.
      const customerColumnsResult = db.exec('PRAGMA table_info(customers)');
      const existingCustomerColumns = customerColumnsResult.length
        ? customerColumnsResult[0].values.map((column) => column[1])
        : [];

      if (!existingCustomerColumns.includes('verificationCode')) {
        db.run('ALTER TABLE customers ADD COLUMN verificationCode TEXT');
      }

      if (!existingCustomerColumns.includes('verificationExpiresAt')) {
        db.run('ALTER TABLE customers ADD COLUMN verificationExpiresAt TEXT');
      }

      // Preserve access for existing customers.
      if (!existingCustomerColumns.includes('isVerified')) {
        db.run('ALTER TABLE customers ADD COLUMN isVerified INTEGER NOT NULL DEFAULT 1');
      }

      // Add is_verified to match frontend
      if (!existingCustomerColumns.includes('is_verified')) {
        db.run('ALTER TABLE customers ADD COLUMN is_verified INTEGER DEFAULT 1');
      }

      // Add customerId to existing bookings tables.
      const bookingColumnsResult = db.exec('PRAGMA table_info(bookings)');
      const existingBookingColumns = bookingColumnsResult.length
        ? bookingColumnsResult[0].values.map((column) => column[1])
        : [];

      if (!existingBookingColumns.includes('customerId')) {
        db.run('ALTER TABLE bookings ADD COLUMN customerId INTEGER');
      }

      if (!existingBookingColumns.includes('tripStartedAt')) {
        db.run('ALTER TABLE bookings ADD COLUMN tripStartedAt TEXT');
      }

      if (!existingBookingColumns.includes('tripCompletedAt')) {
        db.run('ALTER TABLE bookings ADD COLUMN tripCompletedAt TEXT');
      }

      if (!existingBookingColumns.includes('is_deleted')) {
        db.run('ALTER TABLE bookings ADD COLUMN is_deleted INTEGER NOT NULL DEFAULT 0');
      }

      // Add customer GPS fields safely to existing bookings.
      const customerGpsColumns = [
        ['customerLatitude', 'REAL'],
        ['customerLongitude', 'REAL'],
        ['customerLocationUpdatedAt', 'TEXT']
      ];

      for (const [columnName, columnType] of customerGpsColumns) {
        if (!existingBookingColumns.includes(columnName)) {
          db.run(
            `ALTER TABLE bookings ADD COLUMN ${columnName} ${columnType}`
          );
        }
      }

      // Add expiry time to existing booking requests.
      const requestColumnsResult = db.exec(
        'PRAGMA table_info(booking_requests)'
      );

      const existingRequestColumns = requestColumnsResult.length
        ? requestColumnsResult[0].values.map((column) => column[1])
        : [];

      if (!existingRequestColumns.includes('expiresAt')) {
        db.run(
          'ALTER TABLE booking_requests ADD COLUMN expiresAt TEXT'
        );
      }
      // Add missing complaint columns to existing databases.
      const complaintColumnsResult = db.exec('PRAGMA table_info(complaints)');
      const existingComplaintColumns = complaintColumnsResult.length
        ? complaintColumnsResult[0].values.map((column) => column[1])
        : [];

      if (!existingComplaintColumns.includes('trackingCode')) {
        db.run('ALTER TABLE complaints ADD COLUMN trackingCode TEXT');
      }

      if (!existingComplaintColumns.includes('deletedAt')) {
        db.run('ALTER TABLE complaints ADD COLUMN deletedAt TEXT');
      }

      if (!existingComplaintColumns.includes('adminNote')) {
        db.run('ALTER TABLE complaints ADD COLUMN adminNote TEXT');
      }

      // Generate tracking codes for older complaints that don't have one.
      const missingCodes = db.exec(
        `SELECT id FROM complaints
         WHERE trackingCode IS NULL OR trackingCode = ''`
      );

      if (missingCodes.length) {
        for (const [id] of missingCodes[0].values) {
          let trackingCode;
          let exists = true;

          while (exists) {
            trackingCode = generateComplaintTrackingCode();

            const existing = db.exec(
              'SELECT id FROM complaints WHERE trackingCode = ?',
              [trackingCode]
            );

            exists =
              existing.length > 0 &&
              existing[0].values.length > 0;
          }

          db.run(
            'UPDATE complaints SET trackingCode = ? WHERE id = ?',
            [trackingCode, id]
          );
        }
      }

      db.run(`
        CREATE UNIQUE INDEX IF NOT EXISTS
        idx_complaints_trackingCode
        ON complaints(trackingCode)
      `);

      db.run(`
        CREATE INDEX IF NOT EXISTS
        idx_payment_transactions_bookingId
        ON payment_transactions(bookingId)
      `);

      db.run(`
        CREATE INDEX IF NOT EXISTS
        idx_payment_transactions_status
        ON payment_transactions(status)
      `);

      // Indexes for driver booking requests.
      db.run(`
        CREATE INDEX IF NOT EXISTS
        idx_booking_requests_driverId
        ON booking_requests(driverId)
      `);

      db.run(`
        CREATE INDEX IF NOT EXISTS
        idx_booking_requests_bookingId
        ON booking_requests(bookingId)
      `);

      // Index for customer bookings.
      db.run(`
        CREATE INDEX IF NOT EXISTS
        idx_bookings_customerId
        ON bookings(customerId)
      `);

      db.run(`
        INSERT OR IGNORE INTO financial_settings
        (id, commissionRate, registrationFeeUGX)
        VALUES (1, 10, 0)
      `);

      save();

      console.log('Database initialized');

      return db;
    })
    .catch((error) => {
      ready = null;
      throw error;
    });

  return ready;
}

function save() {
  if (!db) return;

  const data = db.export();
  fs.writeFileSync(DB_FILE, Buffer.from(data));
}

async function query(sql, params = []) {
  await init();

  const trimmed = sql.trim().toLowerCase();

  if (
    trimmed.startsWith('select') ||
    trimmed.startsWith('pragma')
  ) {
    const stmt = db.prepare(sql);
    const rows = [];

    try {
      stmt.bind(params);

      while (stmt.step()) {
        rows.push(stmt.getAsObject());
      }
    } finally {
      stmt.free();
    }

    return [rows];
  }

  if (trimmed.startsWith('insert')) {
    db.run(sql, params);

    const idResult = db.exec(
      'SELECT last_insert_rowid() AS id'
    );

    const insertId = idResult.length
      ? idResult[0].values[0][0]
      : 0;

    save();

    return [{ insertId, affectedRows: 1 }];
  }

  db.run(sql, params);

  const changes = db.getRowsModified();

  save();

  return [{ insertId: 0, affectedRows: changes }];
}

module.exports = {
  query,
  init,
  generateComplaintTrackingCode
};

