const express = require('express');
const router = express.Router();

const db = require('../db');
const Booking = require('../models/Booking');
const requireCustomer = require('../middleware/requireCustomer');
const requireDriver = require('../middleware/requireDriver');

function requireChatParticipant(req, res, next) {
  const role = req.headers['x-chat-role'];

  if (role === 'customer') return requireCustomer(req, res, next);
  if (role === 'driver') return requireDriver(req, res, next);

  return res.status(401).json({ message: 'Chat authentication required.' });
}

async function checkBookingAccess(req, res) {
  const booking = await Booking.findById(req.params.id);

  if (!booking) {
    res.status(404).json({ message: 'Booking not found.' });
    return null;
  }

  const role = req.headers['x-chat-role'];

  const allowed = role === 'customer'
    ? Number(booking.customerId) === Number(req.customerId)
    : Number(booking.driverId) === Number(req.driverId);

  if (!allowed) {
    res.status(403).json({ message: 'You cannot access this booking chat.' });
    return null;
  }

  return booking;
}

router.get('/:id/messages', requireChatParticipant, async (req, res) => {
  try {
    const booking = await checkBookingAccess(req, res);
    if (!booking) return;

    const result = await db.query(
      'SELECT * FROM messages WHERE bookingId = ? ORDER BY id ASC',
      [req.params.id]
    );

    const messages = (result[0] || []).map(msg => ({
      ...msg,
      senderRole: msg.senderType,
      senderName: msg.senderType === 'driver'
        ? (booking.driverName || 'Driver')
        : (booking.customerName || 'Customer')
    }));

    res.json({ messages });
  } catch (error) {
    console.error('CHAT FETCH ERROR:', error);
    res.status(500).json({ message: 'Could not load messages.' });
  }
});

router.post('/:id/messages', requireChatParticipant, async (req, res) => {
  try {
    const booking = await checkBookingAccess(req, res);
    if (!booking) return;

    const message = String(req.body.message || '').trim();

    if (!message || message.length > 2000) {
      return res.status(400).json({
        message: 'Message must contain 1 to 2000 characters.'
      });
    }

    const role = req.headers['x-chat-role'];
    const senderId = role === 'customer' ? req.customerId : req.driverId;

    await db.query(
      'INSERT INTO messages (bookingId, senderId, senderType, message) VALUES (?, ?, ?, ?)',
      [req.params.id, senderId, role, message]
    );

    res.status(201).json({ message: 'Message sent successfully.' });
  } catch (error) {
    console.error('CHAT SEND ERROR:', error);
    res.status(500).json({ message: 'Could not send message.' });
  }
});

module.exports = router;
