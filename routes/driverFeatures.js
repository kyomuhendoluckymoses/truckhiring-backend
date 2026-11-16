const express = require('express');
const router = express.Router();
const pool = require('../db');
const requireDriver = require('../middleware/requireDriver');

// GET DRIVER STATS
router.get('/stats', requireDriver, async (req, res) => {
  try {
    const driverId = req.driverId;
    
    const [trips] = await pool.query(
      'SELECT COUNT(*) as total FROM bookings WHERE driverId = ? AND status IN (?, ?)',
      [driverId, 'Accepted', 'Completed']
    );
    
    const [earnings] = await pool.query(
      'SELECT SUM(agreedPrice) as total FROM bookings WHERE driverId = ? AND status IN (?, ?)',
      [driverId, 'Accepted', 'Completed']
    );
    
    return res.json({
      totalTrips: Number(trips[0]?.total) || 0,
      totalEarnings: Number(earnings[0]?.total) || 0,
      rating: 4.9,
      acceptanceRate: 98
    });
  } catch (err) {
    console.error('STATS ERROR:', err);
    return res.json({ totalTrips: 0, totalEarnings: 0, rating: 4.9, acceptanceRate: 98 });
  }
});

// GET HIDDEN DRIVER TRIPS
router.get('/trips/hidden', requireDriver, async (req, res) => {
  try {
    const [trips] = await pool.query(
      `SELECT b.*,
              CASE
                WHEN r.driverId IS NOT NULL AND b.driverId != h.driverId
                THEN 'Rejected'
                ELSE b.status
              END AS historyStatus,
              h.hiddenAt
       FROM driver_hidden_bookings h
       INNER JOIN bookings b ON b.id = h.bookingId
       LEFT JOIN booking_rejected_drivers r
         ON r.bookingId = b.id AND r.driverId = h.driverId
       WHERE h.driverId = ?
         AND (b.driverId = h.driverId OR r.driverId IS NOT NULL)
       ORDER BY h.hiddenAt DESC`,
      [req.driverId]
    );

    return res.json({ trips });
  } catch (err) {
    console.error('HIDDEN DRIVER TRIPS ERROR:', err);
    return res.status(500).json({ message: 'Could not load hidden trips.' });
  }
});

// GET DRIVER TRIPS (Visible History)
router.get('/trips', requireDriver, async (req, res) => {
  try {
    const [trips] = await pool.query(
      `SELECT b.*, 'Rejected' AS historyStatus
       FROM bookings b
       INNER JOIN booking_rejected_drivers r
         ON r.bookingId = b.id
       WHERE r.driverId = ?
         AND NOT EXISTS (
           SELECT 1 FROM driver_hidden_bookings h
           WHERE h.bookingId = b.id AND h.driverId = ?
         )

       UNION ALL

       SELECT b.*, b.status AS historyStatus
       FROM bookings b
       WHERE b.driverId = ?
         AND NOT EXISTS (
           SELECT 1 FROM driver_hidden_bookings h
           WHERE h.bookingId = b.id AND h.driverId = ?
         )

       ORDER BY createdAt DESC`,
      [req.driverId, req.driverId, req.driverId, req.driverId]
    );

    return res.json({ trips });
  } catch (err) {
    console.error('DRIVER TRIPS ERROR:', err);
    return res.status(500).json({ message: 'Could not load trips.' });
  }
});

// HIDE A BOOKING FROM THIS DRIVER'S HISTORY
router.post('/:id/hide', requireDriver, async (req, res) => {
  try {
    const bookingId = Number(req.params.id);

    if (!Number.isInteger(bookingId) || bookingId <= 0) {
      return res.status(400).json({ message: 'Invalid booking ID.' });
    }

    const [allowed] = await pool.query(
      `SELECT b.id
       FROM bookings b
       LEFT JOIN booking_rejected_drivers r
         ON r.bookingId = b.id AND r.driverId = ?
       WHERE b.id = ?
         AND (b.driverId = ? OR r.driverId IS NOT NULL)`,
      [req.driverId, bookingId, req.driverId]
    );

    if (!allowed.length) {
      return res.status(404).json({ message: 'Booking not found in your history.' });
    }

    await pool.query(
      `INSERT OR IGNORE INTO driver_hidden_bookings (bookingId, driverId)
       VALUES (?, ?)`,
      [bookingId, req.driverId]
    );

    return res.json({ message: 'Booking hidden successfully.' });
  } catch (err) {
    console.error('HIDE DRIVER BOOKING ERROR:', err);
    return res.status(500).json({ message: 'Could not hide booking.' });
  }
});

// RESTORE A HIDDEN BOOKING
router.post('/:id/restore', requireDriver, async (req, res) => {
  try {
    const bookingId = Number(req.params.id);

    if (!Number.isInteger(bookingId) || bookingId <= 0) {
      return res.status(400).json({ message: 'Invalid booking ID.' });
    }

    const [result] = await pool.query(
      `DELETE FROM driver_hidden_bookings
       WHERE bookingId = ? AND driverId = ?`,
      [bookingId, req.driverId]
    );

    if (!result.affectedRows) {
      return res.status(404).json({ message: 'Hidden booking not found.' });
    }

    return res.json({ message: 'Booking restored successfully.' });
  } catch (err) {
    console.error('RESTORE DRIVER BOOKING ERROR:', err);
    return res.status(500).json({ message: 'Could not restore booking.' });
  }
});
// GET DRIVER EARNINGS
router.get('/earnings', requireDriver, async (req, res) => {
  try {
    const [earnings] = await pool.query(
      'SELECT SUM(agreedPrice) as total, COUNT(*) as trips FROM bookings WHERE driverId = ? AND status IN (?, ?)',
      [req.driverId, 'Accepted', 'Completed']
    );
    return res.json({
      totalEarnings: Number(earnings[0]?.total) || 0,
      totalTrips: Number(earnings[0]?.trips) || 0
    });
  } catch (err) {
    return res.status(500).json({ message: 'Could not load earnings.' });
  }
});

// UPDATE DRIVER TRUCK DETAILS
router.patch('/truck', requireDriver, async (req, res) => {
  try {
    const { truckType, truckPlate } = req.body;
    await pool.query(
      'UPDATE drivers SET truckType = ?, truckPlate = ? WHERE id = ?',
      [truckType, truckPlate, req.driverId]
    );
    return res.json({ message: 'Truck details updated.' });
  } catch (err) {
    return res.status(500).json({ message: 'Could not update truck.' });
  }
});

// GET DRIVER REVIEWS (Placeholder)
router.get('/reviews', requireDriver, async (req, res) => {
  return res.json({ reviews: [], rating: 4.9 });
});

module.exports = router;

