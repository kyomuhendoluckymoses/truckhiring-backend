
const pool = require('../db');

const Booking = {
  // CREATE A BOOKING
  async create(data) {
    const bookingCode =
      data.bookingCode || `LM${Date.now().toString().slice(-8)}`;

    const selectedTruck = data.selectedTruck || data.truckType || null;

    const offeredPrice =
      data.offeredPrice === '' || data.offeredPrice == null
        ? null
        : Number(data.offeredPrice);

    const [result] = await pool.query(
      `INSERT INTO bookings (
        customerId, customerName, customerPhone, customerEmail,
        selectedTruck, offeredPrice, agreedPrice, pickupLocation,
        destination, pickupDate, cargoDescription, bookingCode,
        status, driverId, driverName, driverCounterPrice,
        paymentMethod, paymentPhone, paymentStatus, paidAt,
        pickupCoords, destinationCoords
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.customerId ?? null,
        data.customerName || null,
        data.customerPhone || null,
        data.customerEmail || null,
        selectedTruck,
        Number.isFinite(offeredPrice) ? offeredPrice : null,
        data.agreedPrice ?? null,
        data.pickupLocation || null,
        data.destination || null,
        data.pickupDate || null,
        data.cargoDescription || null,
        bookingCode,
        data.status || 'Pending',
        data.driverId ?? null,
        data.driverName || null,
        data.driverCounterPrice ?? null,
        data.paymentMethod || null,
        data.paymentPhone || null,
        data.paymentStatus || null,
        data.paidAt || null,
        data.pickupCoords || null,
        data.destinationCoords || null
      ]
    );

    return this.findById(result.insertId);
  },

  // GET ALL BOOKINGS
  async all() {
    const [rows] = await pool.query(
      'SELECT * FROM bookings ORDER BY createdAt DESC'
    );

    return rows;
  },

  // GET BOOKINGS FOR ONE CUSTOMER
  async allForCustomer(customerId) {
    const [rows] = await pool.query(
      'SELECT * FROM bookings WHERE customerId = ? ORDER BY createdAt DESC',
      [customerId]
    );

    return rows;
  },

  // COUNT A DRIVER'S ACTIVE BOOKINGS
  async countActiveForDriver(driverId) {
    const [rows] = await pool.query(
      `SELECT COUNT(*) AS total
       FROM bookings
       WHERE driverId = ?
       AND status IN ('Accepted', 'Confirmed', 'In Progress')`,
      [driverId]
    );

    return Number(rows[0]?.total || 0);
  },

  // FIND ONE BOOKING
  async findById(id) {
    const [rows] = await pool.query(
      'SELECT * FROM bookings WHERE id = ? LIMIT 1',
      [id]
    );

    return rows[0] || null;
  },

  // UPDATE A BOOKING
  async update(id, data) {
    const allowedFields = [
      'customerName',
      'customerPhone',
      'customerEmail',
      'selectedTruck',
      'offeredPrice',
      'agreedPrice',
      'pickupLocation',
      'destination',
      'pickupDate',
      'cargoDescription',
      'bookingCode',
      'status',
      'driverId',
      'driverName',
      'driverCounterPrice',
      'paymentMethod',
      'paymentPhone',
      'paymentStatus',
      'paidAt',
      'pickupCoords',
      'destinationCoords'
    ];

    const fields = Object.keys(data).filter(
      (field) => allowedFields.includes(field)
    );

    if (fields.length === 0) {
      return this.findById(id);
    }

    const values = fields.map((field) => data[field]);

    const setClause = fields
      .map((field) => `"${field}" = ?`)
      .join(', ');

    await pool.query(
      `UPDATE bookings SET ${setClause} WHERE id = ?`,
      [...values, id]
    );

    return this.findById(id);
  },

  // ASSIGN A BOOKING TO A DRIVER
  async claimForDriver(bookingId, driverId, driverName) {
    await pool.query(
      `UPDATE bookings
       SET driverId = ?, driverName = ?, status = 'Accepted'
       WHERE id = ?
       AND driverId IS NULL
       AND status IN (
         'Pending',
         'Open',
         'Broadcasting',
         'Negotiating'
       )`,
      [driverId, driverName, bookingId]
    );

    const booking = await this.findById(bookingId);

    if (
      !booking ||
      Number(booking.driverId) !== Number(driverId) ||
      booking.status !== 'Accepted'
    ) {
      return null;
    }

    return booking;
  }
};

module.exports = Booking;
