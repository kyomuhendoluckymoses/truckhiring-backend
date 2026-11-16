const express = require('express');
const router = express.Router();
const pool = require('../db');
const jwt = require('jsonwebtoken');

// REGISTER (No verification, returns token immediately)
router.post('/register', async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;
    if (!name || !email || !phone || !password) {
      return res.status(400).json({ message: 'All fields are required.' });
    }

    const [existing] = await pool.query('SELECT * FROM customers WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(400).json({ message: 'Email already registered. Please log in.' });
    }

    const [result] = await pool.query(
      'INSERT INTO customers (name, email, phone, password, is_verified) VALUES (?, ?, ?, ?, 1)',
      [name, email, phone, password]
    );

    const token = jwt.sign({ id: result.insertId, role: 'customer' }, process.env.CUSTOMER_TOKEN_SECRET || 'secret', { expiresIn: '7d' });

    return res.status(201).json({ 
      message: 'Registered successfully!', 
      token, 
      customer: { id: result.insertId, name, email, phone } 
    });
  } catch (err) {
    console.error('REGISTER ERROR:', err);
    return res.status(500).json({ message: err.message });
  }
});

// LOGIN (No verification check)
router.post('/login', async (req, res) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');

    const [rows] = await pool.query('SELECT * FROM customers WHERE email = ?', [email]);
    const customer = rows[0];

    if (!customer || customer.password !== password) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const token = jwt.sign({ id: customer.id, role: 'customer' }, process.env.CUSTOMER_TOKEN_SECRET || 'secret', { expiresIn: '7d' });
    return res.json({ message: 'Login successful.', token, customer });
  } catch (err) {
    return res.status(500).json({ message: 'Could not log in.' });
  }
});


// GET CUSTOMER PROFILE
router.get('/profile', async (req, res) => {
  try {
    // For testing, we fetch the first customer. In production, you would use a token to identify them.
    const [rows] = await pool.query('SELECT id, name, email, phone FROM customers LIMIT 1');
    const customer = rows[0];
    if (!customer) return res.status(404).json({ message: 'Customer not found.' });
    return res.json({ customer });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

module.exports = router;
