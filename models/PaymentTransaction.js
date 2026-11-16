
const pool = require('../db');
const crypto = require('crypto');

const ALLOWED_PROVIDERS = ['MTN', 'AIRTEL'];

const ALLOWED_STATUSES = [
  'Pending',
  'Processing',
  'Successful',
  'Failed',
  'Cancelled'
];

function generateTransactionReference() {
  return `LMPAY-${crypto.randomUUID()}`;
}

const PaymentTransaction = {
  // Create a payment record. This does not initiate a real payment.
  async create({
    bookingId,
    provider,
    amountUGX
  }) {
    const normalizedProvider = String(provider || '').toUpperCase();
    const numericBookingId = Number(bookingId);
    const numericAmount = Number(amountUGX);

    if (
      !Number.isSafeInteger(numericBookingId) ||
      numericBookingId <= 0
    ) {
      throw new Error('A valid booking ID is required.');
    }

    if (!ALLOWED_PROVIDERS.includes(normalizedProvider)) {
      throw new Error('Provider must be MTN or AIRTEL.');
    }

    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      throw new Error('A valid payment amount is required.');
    }

    const bookingResult = await pool.query(
      'SELECT id, agreedPrice, status FROM bookings WHERE id = ? LIMIT 1',
      [numericBookingId]
    );

    const booking = bookingResult[0][0];

    if (!booking) {
      throw new Error('Booking not found.');
    }

    if (booking.status !== 'Confirmed') {
      throw new Error('Booking must be confirmed before payment.');
    }

    const agreedPrice = Number(booking.agreedPrice);

    if (
      !Number.isFinite(agreedPrice) ||
      agreedPrice <= 0 ||
      Math.round(agreedPrice * 100) !== Math.round(numericAmount * 100)
    ) {
      throw new Error('Payment amount must match the confirmed booking price.');
    }

    const transactionReference = generateTransactionReference();

    const [result] = await pool.query(
      `INSERT INTO payment_transactions (
        bookingId,
        provider,
        transactionReference,
        amountUGX,
        currency,
        status
      ) VALUES (?, ?, ?, ?, 'UGX', 'Pending')`,
      [
        numericBookingId,
        normalizedProvider,
        transactionReference,
        numericAmount
      ]
    );

    return this.findById(result.insertId);
  },

  // Find a transaction by its database ID.
  async findById(id) {
    const [rows] = await pool.query(
      `SELECT id, bookingId, provider, transactionReference,
              providerTransactionId, amountUGX, currency, status,
              verificationMethod, verificationResponseCode,
              createdAt, verifiedAt
       FROM payment_transactions
       WHERE id = ?
       LIMIT 1`,
      [id]
    );

    return rows[0] || null;
  },

  // Find a transaction by its unique internal reference.
  async findByReference(reference) {
    const [rows] = await pool.query(
      `SELECT id, bookingId, provider, transactionReference,
              providerTransactionId, amountUGX, currency, status,
              verificationMethod, verificationResponseCode,
              createdAt, verifiedAt
       FROM payment_transactions
       WHERE transactionReference = ?
       LIMIT 1`,
      [reference]
    );

    return rows[0] || null;
  },

  // List transactions belonging to a booking.
  async findByBookingId(bookingId) {
    const [rows] = await pool.query(
      `SELECT id, bookingId, provider, transactionReference,
              providerTransactionId, amountUGX, currency, status,
              verificationMethod, verificationResponseCode,
              createdAt, verifiedAt
       FROM payment_transactions
       WHERE bookingId = ?
       ORDER BY createdAt DESC`,
      [bookingId]
    );

    return rows;
  },

  // Validate a status value for future trusted payment-service code.
  validateStatus(status) {
    return ALLOWED_STATUSES.includes(status);
  }
};

module.exports = PaymentTransaction;
