const cron = require('node-cron');
const pool = require('../db');
const router = require('../routes/bookings');

// Run this check every 10 seconds
cron.schedule('*/10 * * * * *', async () => {
  try {
    // Find requests that have been 'pending' for more than 60 seconds
    const [expired] = await pool.query(
      SELECT bookingId, driverId FROM booking_requests
       WHERE status = 'pending' AND expiresAt < datetime('now')
    );

    for (const row of expired) {
      console.log([Worker] Driver  timed out for booking .);
      
      // Mark as expired
      await pool.query(
        UPDATE booking_requests SET status = 'expired', expiresAt = NULL WHERE bookingId = ? AND driverId = ?,
        [row.bookingId, row.driverId]
      );

      // Trigger the function in bookings.js to send to the NEXT driver
      await router.advanceBookingToNextDriver(row.bookingId);
    }
  } catch (err) {
    console.error('[Worker] Expiry Worker Error:', err);
  }
});

console.log('🚀 Booking Request Expiry Worker started.');

