const express = require('express');
const router = express.Router();
const Driver = require('../models/Driver');
const Booking = require('../models/Booking');
const Complaint = require('../models/Complaint');
const pool = require('../db');

const ADMIN_KEY = process.env.ADMIN_KEY;
if (!ADMIN_KEY) throw new Error('ADMIN_KEY environment variable is required.');

function requireAdmin(req, res, next) {
  const key = req.headers['x-admin-key'] || req.query.key;
  if (key !== ADMIN_KEY) return res.status(401).json({ message: 'Unauthorized' });
  next();
}

router.use(requireAdmin);

router.get('/ping', (req, res) => res.json({ ok: true }));

router.get('/financial-settings', async (req, res) => {
  try {
    await pool.query("CREATE TABLE IF NOT EXISTS financial_settings (id INTEGER PRIMARY KEY CHECK (id = 1), commissionRate REAL NOT NULL DEFAULT 10, registrationFeeUGX REAL NOT NULL DEFAULT 0, updatedAt TEXT DEFAULT CURRENT_TIMESTAMP)");
    await pool.query("INSERT OR IGNORE INTO financial_settings (id, commissionRate, registrationFeeUGX) VALUES (1, 10, 0)");
    const [rows] = await pool.query("SELECT commissionRate, registrationFeeUGX, updatedAt FROM financial_settings WHERE id = 1");
    if (!rows.length) return res.json({ commissionRate: 10, registrationFeeUGX: 0 });
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.patch('/financial-settings', async (req, res) => {
  try {
    const commissionRate = Number(req.body.commissionRate);
    const registrationFeeUGX = Number(req.body.registrationFeeUGX);
    await pool.query("UPDATE financial_settings SET commissionRate = ?, registrationFeeUGX = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = 1", [commissionRate, registrationFeeUGX]);
    const [updated] = await pool.query("SELECT commissionRate, registrationFeeUGX, updatedAt FROM financial_settings WHERE id = 1");
    res.json({ message: 'Financial settings saved', settings: updated[0] });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.get('/drivers', async (req, res) => {
  try {
    const drivers = await Driver.all();
    drivers.forEach((d) => { delete d.password; d.isSuspended = d.availability === 'suspended'; });
    res.json({ count: drivers.length, drivers });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.post('/drivers', async (req, res) => {
  try {
    const { name, email, phone, password, truckType } = req.body;
    if (!name || !email || !phone || !password || !truckType) return res.status(400).json({ message: 'All fields required' });
    const cleanEmail = email.toLowerCase().trim();
    const cleanPhone = phone.trim();
    if (await Driver.findByEmail(cleanEmail)) return res.status(400).json({ message: 'Email already registered' });
    if (await Driver.findByPhone(cleanPhone)) return res.status(400).json({ message: 'Phone already registered' });
    
    const driver = await Driver.create({ name: name.trim(), email: cleanEmail, phone: cleanPhone, password: password.trim(), truckType: truckType.trim() });
    delete driver.password;
    res.status(201).json({ message: 'Driver registered by admin', driver });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.patch('/drivers/:id/suspend', async (req, res) => {
  try {
    await pool.query(`UPDATE drivers SET availability = 'suspended' WHERE id = ?`, [req.params.id]);
    const updatedDriver = await Driver.findById(req.params.id);
    if (!updatedDriver) return res.status(404).json({ message: 'Driver not found' });
    delete updatedDriver.password; updatedDriver.isSuspended = true;
    res.json({ message: 'Driver suspended', driver: updatedDriver });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.patch('/drivers/:id/unsuspend', async (req, res) => {
  try {
    await pool.query(`UPDATE drivers SET availability = 'offline' WHERE id = ?`, [req.params.id]);
    const updatedDriver = await Driver.findById(req.params.id);
    if (!updatedDriver) return res.status(404).json({ message: 'Driver not found' });
    delete updatedDriver.password; updatedDriver.isSuspended = false;
    res.json({ message: 'Driver reactivated', driver: updatedDriver });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.delete('/drivers/:id', async (req, res) => {
  try {
    const driver = await Driver.findById(req.params.id);
    if (!driver) return res.status(404).json({ message: 'Driver not found' });
    await pool.query(`DELETE FROM drivers WHERE id = ?`, [req.params.id]);
    res.json({ message: 'Driver deleted successfully' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.get('/bookings', async (req, res) => {
  try {
    const bookings = await Booking.all();
    res.json({ count: bookings.length, bookings });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.patch('/bookings/:id/payment', async (req, res) => {
  try {
    const booking = await Booking.update(req.params.id, { paymentStatus: req.body.paymentStatus, paidAt: req.body.paymentStatus === 'paid' ? new Date().toISOString() : null });
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    res.json({ message: 'Payment updated', booking });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

/* COMPLAINTS */
router.get('/complaints', async (req, res) => {
  try {
    const includeTrash = req.query.trash === 'true';
    const complaints = await Complaint.all({ includeTrash });
    res.json({ count: complaints.length, complaints });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.patch('/complaints/:id/trash', async (req, res) => {
  try {
    const complaint = await Complaint.moveToTrash(req.params.id);
    if (!complaint) return res.status(404).json({ message: 'Complaint not found' });
    res.json({ message: 'Complaint moved to History', complaint });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.patch('/complaints/:id/restore', async (req, res) => {
  try {
    const complaint = await Complaint.restore(req.params.id);
    if (!complaint) return res.status(404).json({ message: 'Complaint not found' });
    res.json({ message: 'Complaint restored', complaint });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.delete('/complaints/:id/permanent', async (req, res) => {
  try {
    const deleted = await Complaint.permanentlyDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Complaint not found' });
    res.json({ message: 'Complaint permanently deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.patch('/complaints/:id', async (req, res) => {
  try {
    const complaint = await Complaint.update(req.params.id, { status: req.body.status, adminNote: req.body.adminNote });
    if (!complaint) return res.status(404).json({ message: 'Complaint not found' });
    res.json({ message: 'Complaint updated', complaint });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;