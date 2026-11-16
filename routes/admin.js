const express = require('express');
const router = express.Router();
const pool = require('../db');
const bcrypt = require('bcryptjs');

// Verify Admin Key
const verifyAdmin = (req, res, next) => {
  const adminKey = req.headers.authorization?.replace('Bearer ', '');
  const expectedKey = process.env.ADMIN_KEY || 'luckymoses';
  
  if (adminKey !== expectedKey) {
    return res.status(401).json({ message: 'Invalid admin key. Please log in again.' });
  }
  next();
};

// GET ALL DRIVERS (For Admin)
router.get('/drivers', verifyAdmin, async (req, res) => {
  try {
    const [drivers] = await pool.query('SELECT id, name, email, phone, truckType, truckPlate, availability FROM drivers');
    return res.json({ drivers });
  } catch (err) {
    console.error('GET ADMIN DRIVERS ERROR:', err);
    return res.status(500).json({ message: 'Could not load drivers.' });
  }
});

// REGISTER A NEW DRIVER
router.post('/drivers', verifyAdmin, async (req, res) => {
  try {
    const { name, email, phone, password, truckType, truckPlate } = req.body;

    if (!name || !email || !phone || !password || !truckType) {
      return res.status(400).json({ message: 'Please fill all required fields.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await pool.query(
      `INSERT INTO drivers (name, email, phone, password, truckType, truckPlate, availability) 
       VALUES (?, ?, ?, ?, ?, ?, 'offline')`,
      [name, email, phone, hashedPassword, truckType, truckPlate || '']
    );

    return res.json({ message: 'Driver registered successfully.' });
  } catch (err) {
    console.error('REGISTER DRIVER ERROR:', err);
    if (err.message.includes('UNIQUE')) {
      return res.status(400).json({ message: 'Email or phone already exists.' });
    }
    return res.status(500).json({ message: 'Could not register driver.' });
  }
});

// DELETE A DRIVER (PERMANENT)
router.delete('/drivers/:id', verifyAdmin, async (req, res) => {
  try {
    const driverId = req.params.id;
    
    // 1. Clear their active booking requests
    await pool.query(`DELETE FROM booking_requests WHERE driverId = ?`, [driverId]);
    
    // 2. Clear their offered prices
    await pool.query(`DELETE FROM booking_offers WHERE driverId = ?`, [driverId]);
    
    // 3. Clear their messages (safely catch if table doesn't exist yet)
    try { 
      await pool.query(`DELETE FROM messages WHERE senderName IN (SELECT name FROM drivers WHERE id = ?)`, [driverId]); 
    } catch(e) { 
      console.log('Messages table cleanup skipped.'); 
    }
    
    // 4. Unassign them from any bookings
    await pool.query(`UPDATE bookings SET driverId = NULL, status = 'Broadcasting' WHERE driverId = ?`, [driverId]);
    
    // 5. Finally, delete the driver
    await pool.query(`DELETE FROM drivers WHERE id = ?`, [driverId]);
    
    return res.json({ message: 'Driver permanently deleted.' });
  } catch (err) {
    console.error('DELETE DRIVER ERROR:', err);
    return res.status(500).json({ message: 'Could not delete driver.' });
  }
});

// GET ADMIN STATS (Commission included)
router.get('/stats', verifyAdmin, async (req, res) => {
  try {
    const [bookings] = await pool.query('SELECT COUNT(*) as total, SUM(agreedPrice) as revenue FROM bookings WHERE status = ?', ['Accepted']);
    const [drivers] = await pool.query('SELECT COUNT(*) as total FROM drivers');
    const [customers] = await pool.query('SELECT COUNT(*) as total FROM customers');
    
    const revenue = bookings[0].revenue || 0;
    const commission = revenue * 0.10;
    const driverPayout = revenue * 0.90;

    return res.json({
      totalBookings: bookings[0].total || 0,
      totalDrivers: drivers[0].total || 0,
      totalCustomers: customers[0].total || 0,
      totalRevenue: revenue,
      adminCommission: commission,
      driverPayout: driverPayout
    });
  } catch (err) {
    return res.status(500).json({ message: 'Could not load stats.' });
  }
});

module.exports = router;