
const express = require('express');
const router = express.Router();
const requireDriver = require('../middleware/requireDriver');
const requireCustomer = require('../middleware/requireCustomer');

const Booking = require('../models/Booking');
const Driver = require('../models/Driver');
const pool = require('../db');
const { sendCustomerBookingEmail } = require('../mailer');

// FORMAT BOOKING COORDINATES
function formatBooking(booking) {
  if (!booking) return booking;

  const result = { ...booking };

  for (const field of ['pickupCoords', 'destinationCoords']) {
    if (typeof result[field] === 'string') {
      try {
        result[field] = JSON.parse(result[field]);
      } catch {
        result[field] = null;
      }
    }
  }

  return result;
}

// VALIDATE BOOKING ID
function validBookingId(value) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

// ACTIVATE THE NEXT AVAILABLE DRIVER IN THE QUEUE
async function advanceBookingToNextDriver(bookingId) {
  const booking = await Booking.findById(bookingId);

  if (
    !booking ||
    booking.driverId ||
    booking.status !== 'Broadcasting'
  ) {
    return null;
  }

  const [pendingOffers] = await pool.query(
    `SELECT id FROM booking_offers
     WHERE bookingId = ? AND status = 'pending'`,
    [bookingId]
  );

  if (pendingOffers.length) return null;

  const [queuedRows] = await pool.query(
    `SELECT driverId FROM booking_requests
     WHERE bookingId = ? AND status = 'queued'
     ORDER BY id ASC`,
    [bookingId]
  );

  const availableDrivers = await Driver.available();

  const availableIds = new Set(
    availableDrivers
      .filter(driver => driver.truckType === booking.selectedTruck)
      .map(driver => Number(driver.id))
  );

  const nextDriver = queuedRows.find(
    row => availableIds.has(Number(row.driverId))
  );

  if (!nextDriver) {
    await Booking.update(bookingId, { status: 'Pending' });
    return null;
  }

  const expiresAt = new Date(Date.now() + 60000).toISOString();

  await pool.query(
    `UPDATE booking_requests
     SET status = 'pending', expiresAt = ?
     WHERE bookingId = ? AND driverId = ? AND status = 'queued'`,
    [expiresAt, bookingId, nextDriver.driverId]
  );

  return nextDriver.driverId;
}

// SEND A NEW BOOKING TO THE FIRST MATCHING AVAILABLE DRIVER
async function broadcastBookingToDrivers(bookingId) {
  const booking = await Booking.findById(bookingId);

  if (!booking) {
    return {
      sent: false,
      driverCount: 0,
      message: 'Booking not found.'
    };
  }

  if (booking.driverId) {
    return {
      sent: false,
      driverCount: 0,
      message: 'Booking already assigned.'
    };
  }

  const [rejectedRows] = await pool.query(
    `SELECT driverId
     FROM booking_rejected_drivers
     WHERE bookingId = ?`,
    [bookingId]
  );

  const rejectedIds = rejectedRows.map(
    row => Number(row.driverId)
  );

  const drivers = await Driver.available();

  const matchingDrivers = drivers.filter(driver =>
    driver.truckType === booking.selectedTruck &&
    !rejectedIds.includes(Number(driver.id))
  );

  if (!matchingDrivers.length) {
    await Booking.update(bookingId, {
      status: 'Pending'
    });

    return {
      sent: false,
      driverCount: 0,
      message: 'No available drivers match this truck type.'
    };
  }

  // Save all matching drivers in the queue.
  for (const driver of matchingDrivers) {
    await pool.query(
      `INSERT OR IGNORE INTO booking_requests
       (bookingId, driverId, status)
       VALUES (?, ?, 'queued')`,
      [bookingId, driver.id]
    );

    await pool.query(
      `UPDATE booking_requests
       SET status = 'queued', expiresAt = NULL
       WHERE bookingId = ? AND driverId = ?`,
      [bookingId, driver.id]
    );
  }

  // Activate only the first driver for 60 seconds.
  const firstDriver = matchingDrivers[0];
  const expiresAt = new Date(Date.now() + 60000).toISOString();

  await pool.query(
    `UPDATE booking_requests
     SET status = 'pending', expiresAt = ?
     WHERE bookingId = ? AND driverId = ? AND status = 'queued'`,
    [expiresAt, bookingId, firstDriver.id]
  );

  await Booking.update(bookingId, {
    status: 'Broadcasting'
  });

  return {
    sent: true,
    driverCount: matchingDrivers.length,
    message: 'Booking sent to available drivers.'
  };
}

// CREATE CUSTOMER BOOKING
router.post('/', requireCustomer, async (req, res) => {
  try {
    const {
      customerName,
      customerPhone,
      customerEmail,
      selectedTruck,
      offeredPrice,
      pickupLocation,
      destination,
      pickupDate,
      cargoDescription,
      pickupCoords,
      destinationCoords
    } = req.body || {};

    if (
      !customerName ||
      !customerPhone ||
      !customerEmail ||
      !selectedTruck ||
      !pickupLocation ||
      !destination ||
      !pickupDate ||
      !cargoDescription
    ) {
      return res.status(400).json({
        message: 'Please fill all required fields.'
      });
    }

    if (
      offeredPrice !== '' &&
      offeredPrice != null &&
      (!Number.isFinite(Number(offeredPrice)) ||
        Number(offeredPrice) < 0)
    ) {
      return res.status(400).json({
        message: 'Please enter a valid offered price.'
      });
    }

    const booking = await Booking.create({
      ...req.body,
      customerId: req.customerId,
      offeredPrice:
        offeredPrice === '' || offeredPrice == null
          ? null
          : Number(offeredPrice),
      pickupCoords: pickupCoords
        ? JSON.stringify(pickupCoords)
        : null,
      destinationCoords: destinationCoords
        ? JSON.stringify(destinationCoords)
        : null,
      status: 'Pending'
    });

    // Automatically send the booking to matching available drivers.
    const broadcastResult = await broadcastBookingToDrivers(booking.id);

    await sendCustomerBookingEmail(
      customerEmail,
      'Lucky Movers - Booking Confirmation',
      'Hello ' + customerName +
      ',\n\nYour booking has been received successfully.' +
      '\n\nPickup: ' + pickupLocation +
      '\nDestination: ' + destination +
      '\nPickup date: ' + pickupDate +
      '\nTruck: ' + selectedTruck +
      '\n\nOur team will contact you about your booking.' +
      '\n\nThank you for choosing Lucky Movers.'
    );

    const latestBooking = await Booking.findById(booking.id);

    return res.status(201).json({
      message: broadcastResult.sent
        ? 'Booking created and sent to available drivers.'
        : 'Booking created. No matching driver is currently available.',
      booking: formatBooking(latestBooking || booking),
      broadcast: broadcastResult
    });
  } catch (err) {
    console.error('CREATE BOOKING ERROR:', err);
    return res.status(500).json({
      message: 'Could not create booking.'
    });
  }
});

// GET BOOKINGS FOR THE LOGGED-IN CUSTOMER
router.get('/mine', requireCustomer, async (req, res) => {
  try {
    const bookings = await Booking.allForCustomer(req.customerId);

    return res.json({
      bookings: bookings.map(formatBooking)
    });
  } catch (err) {
    console.error('CUSTOMER BOOKINGS ERROR:', err);
    return res.status(500).json({
      message: 'Could not load your bookings.'
    });
  }
});

// LIST ALL BOOKINGS
// TODO: Add administrator/driver authorization and filtering.
router.get('/', async (req, res) => {
  try {
    const bookings = await Booking.all();

    return res.json({
      bookings: bookings.map(formatBooking)
    });
  } catch (err) {
    console.error('LIST BOOKINGS ERROR:', err);
    return res.status(500).json({
      message: 'Could not load bookings.'
    });
  }
});

// GET OFFERS FOR A BOOKING
// TODO: Add customer/admin authorization.
router.get('/:id/offers', async (req, res) => {
  try {
    const bookingId = validBookingId(req.params.id);

    if (!bookingId) {
      return res.status(400).json({
        message: 'Invalid booking ID.'
      });
    }

    const [offers] = await pool.query(
      `SELECT id, bookingId, driverId, driverName, driverPhone,
              price, message, status, createdAt
       FROM booking_offers
       WHERE bookingId = ?
       ORDER BY createdAt DESC`,
      [bookingId]
    );

    return res.json({ offers });
  } catch (err) {
    console.error('GET OFFERS ERROR:', err);
    return res.status(500).json({
      message: 'Could not load offers.'
    });
  }
});

// GET BOOKING REQUESTS FOR LOGGED-IN DRIVER
router.get('/driver/requests', requireDriver, async (req, res) => {
  try {
    const driverId = Number(req.driverId);

    const [requests] = await pool.query(
      `SELECT
         br.bookingId,
         br.status AS requestStatus,
         br.expiresAt,
         br.createdAt AS requestCreatedAt,
         b.customerName,
         b.pickupLocation,
         b.destination,
         b.pickupDate,
         b.selectedTruck,
         b.cargoDescription,
         b.status AS bookingStatus
       FROM booking_requests br
       INNER JOIN bookings b ON b.id = br.bookingId
       WHERE br.driverId = ?
         AND br.status IN ('pending', 'offered')
         AND b.driverId IS NULL
         AND b.status IN ('Broadcasting', 'Negotiating', 'Open')
       ORDER BY br.createdAt DESC`,
      [driverId]
    );

    return res.json({ requests });
  } catch (err) {
    console.error('GET DRIVER REQUESTS ERROR:', err);
    return res.status(500).json({
      message: 'Could not load your booking requests.'
    });
  }
});

// GET ACCEPTED AND ASSIGNED BOOKINGS FOR LOGGED-IN DRIVER
router.get('/driver/accepted', requireDriver, async (req, res) => {
  try {
    const driverId = Number(req.driverId);

    const [bookings] = await pool.query(
      `SELECT *
       FROM bookings
       WHERE driverId = ?
         AND status IN (
           'Accepted',
           'Negotiating',
           'Confirmed',
           'In Progress',
           'Completed'
         )
       ORDER BY id DESC`,
      [driverId]
    );

    return res.json({
      bookings: bookings.map(formatBooking)
    });
  } catch (err) {
    console.error('GET DRIVER ACCEPTED BOOKINGS ERROR:', err);
    return res.status(500).json({
      message: 'Could not load your accepted bookings.'
    });
  }
});

// BROADCAST BOOKING TO MATCHING AVAILABLE DRIVERS
// TODO: Restrict this endpoint to authorized administrators.
router.post('/:id/broadcast-job', async (req, res) => {
  try {
    const bookingId = validBookingId(req.params.id);

    if (!bookingId) {
      return res.status(400).json({
        message: 'Invalid booking ID.'
      });
    }

    const result = await broadcastBookingToDrivers(bookingId);

    if (!result.sent) {
      return res.status(404).json(result);
    }

    return res.json(result);
  } catch (err) {
    console.error('BROADCAST BOOKING ERROR:', err);
    return res.status(500).json({
      message: 'Could not broadcast booking.'
    });
  }
});

// DRIVER ACCEPTS A BOOKING DIRECTLY
router.post(
  '/:id/accept-driver',
  requireDriver,
  async (req, res) => {
    try {
      const driver = req.driver;
      const bookingId = validBookingId(req.params.id);

      if (!bookingId) {
        return res.status(400).json({
          message: 'Invalid booking ID.'
        });
      }

      const booking = await Booking.findById(bookingId);

      if (!booking) {
        return res.status(404).json({
          message: 'Booking not found.'
        });
      }

      if (driver.truckType !== booking.selectedTruck) {
        return res.status(403).json({
          message: 'Your truck type does not match this booking.'
        });
      }

      const [requestRows] = await pool.query(
        `SELECT status
         FROM booking_requests
         WHERE bookingId = ? AND driverId = ?`,
        [booking.id, driver.id]
      );

      if (
        !requestRows.length ||
        requestRows[0].status !== 'pending'
      ) {
        return res.status(403).json({
          message: 'You do not have a pending request for this booking.'
        });
      }

      if (
        !['Broadcasting', 'Negotiating', 'Open'].includes(
          booking.status
        ) ||
        booking.driverId
      ) {
        return res.status(409).json({
          message: 'This booking is no longer available.'
        });
      }

      const updatedBooking = await Booking.claimForDriver(
        booking.id,
        driver.id,
        driver.name
      );

      if (!updatedBooking) {
        return res.status(409).json({
          message: 'Another driver already took this booking.'
        });
      }

      // Keep the accepted driver's request available for sending a price.
      await pool.query(
        `UPDATE booking_requests
         SET status = CASE
           WHEN driverId = ? THEN 'accepted'
           ELSE 'closed'
         END
         WHERE bookingId = ?`,
        [driver.id, booking.id]
      );

      return res.json({
        message: 'Booking accepted. You can now send your price.',
        booking: formatBooking(updatedBooking)
      });
    } catch (err) {
      console.error('ACCEPT DRIVER ERROR:', err);
      return res.status(500).json({
        message: 'Could not accept booking.'
      });
    }
  }
);

// DRIVER REJECTS OR HIDES A BOOKING
router.post(
  '/:id/reject-driver',
  requireDriver,
  async (req, res) => {
    try {
      const driver = req.driver;
      const bookingId = validBookingId(req.params.id);

      if (!bookingId) {
        return res.status(400).json({
          message: 'Invalid booking ID.'
        });
      }

      const booking = await Booking.findById(bookingId);

      if (!booking) {
        return res.status(404).json({
          message: 'Booking not found.'
        });
      }

      if (driver.truckType !== booking.selectedTruck) {
        return res.status(403).json({
          message: 'This booking does not match your truck type.'
        });
      }

      if (booking.driverId) {
        return res.status(409).json({
          message: 'This booking has already been assigned.'
        });
      }

      await pool.query(
        `INSERT OR IGNORE INTO booking_rejected_drivers
         (bookingId, driverId)
         VALUES (?, ?)`,
        [booking.id, driver.id]
      );

      await pool.query(
        `UPDATE booking_requests
         SET status = 'rejected', expiresAt = NULL
         WHERE bookingId = ? AND driverId = ?`,
        [booking.id, driver.id]
      );

      await advanceBookingToNextDriver(booking.id);

      return res.json({
        message: 'Booking hidden from this driver.'
      });
    } catch (err) {
      console.error('REJECT DRIVER ERROR:', err);
      return res.status(500).json({
        message: 'Could not hide booking.'
      });
    }
  }
);

// DRIVER SENDS A PRICE OFFER
router.post(
  '/:id/offer',
  requireDriver,
  async (req, res) => {
    try {
      const driver = req.driver;
      const { price, message } = req.body || {};
      const bookingId = validBookingId(req.params.id);

      if (!bookingId) {
        return res.status(400).json({
          message: 'Invalid booking ID.'
        });
      }

      if (
        price === '' ||
        price == null ||
        !Number.isFinite(Number(price)) ||
        Number(price) <= 0
      ) {
        return res.status(400).json({
          message: 'Please enter a valid offer price.'
        });
      }

      const booking = await Booking.findById(bookingId);

      if (!booking) {
        return res.status(404).json({
          message: 'Booking not found.'
        });
      }

      // Allow the driver who accepted the booking to send their price.
      const isAcceptedByThisDriver =
        Number(booking.driverId) === Number(driver.id) &&
        ['Accepted', 'Negotiating'].includes(booking.status);

      const isStillAvailable =
        !booking.driverId &&
        ['Broadcasting', 'Negotiating', 'Open'].includes(booking.status);

      if (!isAcceptedByThisDriver && !isStillAvailable) {
        return res.status(409).json({
          message: 'This booking is no longer available for offers.'
        });
      }

      if (driver.truckType !== booking.selectedTruck) {
        return res.status(403).json({
          message: 'Your truck type does not match this booking.'
        });
      }

      const [requestRows] = await pool.query(
        `SELECT status
         FROM booking_requests
         WHERE bookingId = ? AND driverId = ?`,
        [booking.id, driver.id]
      );

      if (
        !requestRows.length ||
        !['pending', 'accepted'].includes(requestRows[0].status)
      ) {
        return res.status(403).json({
          message: 'You do not have an active request for this booking.'
        });
      }

      const [result] = await pool.query(
        `INSERT INTO booking_offers
         (bookingId, driverId, driverName, driverPhone,
          price, message, status)
         VALUES (?, ?, ?, ?, ?, ?, 'pending')`,
        [
          booking.id,
          driver.id,
          driver.name,
          driver.phone,
          Number(price),
          typeof message === 'string' ? message.trim() : ''
        ]
      );

      await pool.query(
        `UPDATE booking_requests
         SET status = 'offered'
         WHERE bookingId = ? AND driverId = ?`,
        [booking.id, driver.id]
      );

      await Booking.update(booking.id, {
        status: 'Negotiating'
      });

      const [offers] = await pool.query(
        'SELECT * FROM booking_offers WHERE id = ?',
        [result.insertId]
      );

      return res.status(201).json({
        message: 'Price offer sent.',
        offer: offers[0]
      });
    } catch (err) {
      console.error('SEND OFFER ERROR:', err);
      return res.status(500).json({
        message: 'Could not send offer.'
      });
    }
  }
);

// CUSTOMER ACCEPTS A DRIVER'S OFFER
// TODO: Add customer authentication and booking ownership checks.
router.post('/:id/accept-offer', async (req, res) => {
  try {
    const bookingId = validBookingId(req.params.id);
    const { offerId } = req.body || {};

    if (!bookingId) {
      return res.status(400).json({
        message: 'Invalid booking ID.'
      });
    }

    if (!offerId) {
      return res.status(400).json({
        message: 'Offer ID is required.'
      });
    }

    const [rows] = await pool.query(
      `SELECT *
       FROM booking_offers
       WHERE id = ? AND bookingId = ? AND status = 'pending'`,
      [offerId, bookingId]
    );

    const offer = rows[0];

    if (!offer) {
      return res.status(404).json({
        message: 'Offer not found or no longer available.'
      });
    }

    const booking = await Booking.findById(bookingId);

    if (
      !booking ||
      (booking.driverId &&
        Number(booking.driverId) !== Number(offer.driverId))
    ) {
      return res.status(409).json({
        message: 'This booking has already been assigned to another driver.'
      });
    }

    await Booking.update(booking.id, {
      driverId: offer.driverId,
      driverName: offer.driverName,
      driverCounterPrice: Number(offer.price),
      agreedPrice: Number(offer.price),
      status: 'Confirmed'
    });

    await pool.query(
      `UPDATE booking_offers
       SET status = CASE
         WHEN id = ? THEN 'accepted'
         ELSE 'rejected'
       END
       WHERE bookingId = ?`,
      [offer.id, booking.id]
    );

    await pool.query(
      `UPDATE booking_requests
       SET status = CASE
         WHEN driverId = ? THEN 'accepted'
         ELSE 'closed'
       END
       WHERE bookingId = ?`,
      [offer.driverId, booking.id]
    );

    const updated = await Booking.findById(booking.id);

    return res.json({
      message: 'Booking confirmed.',
      booking: formatBooking(updated)
    });
  } catch (err) {
    console.error('ACCEPT OFFER ERROR:', err);
    return res.status(500).json({
      message: 'Could not accept offer.'
    });
  }
});

// CUSTOMER CHOOSES PAYMENT METHOD
// TODO: Verify customer ownership before production.
router.post('/:id/choose-payment', async (req, res) => {
  try {
    const bookingId = validBookingId(req.params.id);
    const { paymentMethod, paymentPhone } = req.body || {};

    if (!bookingId) {
      return res.status(400).json({
        message: 'Invalid booking ID.'
      });
    }

    if (!paymentMethod) {
      return res.status(400).json({
        message: 'Payment method required.'
      });
    }

    const booking = await Booking.findById(bookingId);

    if (!booking) {
      return res.status(404).json({
        message: 'Booking not found.'
      });
    }

    if (booking.status !== 'Confirmed') {
      return res.status(400).json({
        message: 'Confirm a driver and price before choosing payment.'
      });
    }

    if (
      paymentMethod !== 'Cash on pickup' &&
      (!paymentPhone || !String(paymentPhone).trim())
    ) {
      return res.status(400).json({
        message: 'Please provide a mobile money phone number.'
      });
    }

    const updated = await Booking.update(bookingId, {
      paymentMethod,
      paymentPhone: paymentPhone
        ? String(paymentPhone).trim()
        : null
    });

    return res.json({
      message: 'Payment method saved.',
      booking: formatBooking(updated)
    });
  } catch (err) {
    console.error('CHOOSE PAYMENT ERROR:', err);
    return res.status(500).json({
      message: 'Server error.'
    });
  }
});

// DRIVER CONFIRMS CASH RECEIVED AT PICKUP
router.post(
  '/:id/confirm-cash',
  requireDriver,
  async (req, res) => {
    try {
      const bookingId = validBookingId(req.params.id);
      const driverId = Number(req.driverId);

      if (!bookingId) {
        return res.status(400).json({ message: 'Invalid booking ID.' });
      }

      const booking = await Booking.findById(bookingId);

      if (!booking) {
        return res.status(404).json({ message: 'Booking not found.' });
      }

      if (Number(booking.driverId) !== driverId) {
        return res.status(403).json({ message: 'You are not assigned to this booking.' });
      }

      if (booking.status !== 'Confirmed') {
        return res.status(409).json({
          message: 'Cash can only be confirmed for a confirmed booking.'
        });
      }

      if (booking.paymentMethod !== 'Cash on pickup') {
        return res.status(400).json({
          message: 'This booking is not set to Cash on Pickup.'
        });
      }

      if (booking.paymentStatus === 'Paid') {
        return res.json({
          message: 'Cash has already been confirmed.',
          booking: formatBooking(booking)
        });
      }

      const [result] = await pool.query(
        `UPDATE bookings
         SET paymentStatus = 'Paid',
             paidAt = CURRENT_TIMESTAMP
         WHERE id = ?
           AND driverId = ?
           AND status = 'Confirmed'
           AND paymentMethod = 'Cash on pickup'
           AND (paymentStatus IS NULL OR paymentStatus <> 'Paid')`,
        [bookingId, driverId]
      );

      if (result.affectedRows === 0) {
        return res.status(409).json({
          message: 'Cash confirmation failed. Please refresh.'
        });
      }

      const updatedBooking = await Booking.findById(bookingId);

      return res.json({
        message: 'Cash received successfully. Payment confirmed.',
        booking: formatBooking(updatedBooking)
      });
    } catch (err) {
      console.error('CONFIRM CASH ERROR:', err);
      return res.status(500).json({
        message: 'Could not confirm cash payment.'
      });
    }
  }
);

// DRIVER STARTS AN ASSIGNED TRIP
router.post(
  '/:id/start-trip',
  requireDriver,
  async (req, res) => {
    try {
      const bookingId = validBookingId(req.params.id);
      const driverId = Number(req.driverId);

      if (!bookingId) {
        return res.status(400).json({
          message: 'Invalid booking ID.'
        });
      }

      const booking = await Booking.findById(bookingId);

      if (!booking) {
        return res.status(404).json({
          message: 'Booking not found.'
        });
      }

      if (Number(booking.driverId) !== driverId) {
        return res.status(403).json({
          message: 'You are not assigned to this booking.'
        });
      }

      if (
        booking.paymentMethod === 'Cash on pickup' &&
        booking.paymentStatus !== 'Paid'
      ) {
        return res.status(409).json({
          message: 'Please confirm cash received before starting the trip.'
        });
      }

      if (!['Accepted', 'Confirmed'].includes(booking.status)) {
        return res.status(409).json({
          message: 'This booking cannot be started in its current status.'
        });
      }

      const [result] = await pool.query(
        `UPDATE bookings
         SET status = 'In Progress',
             tripStartedAt = CURRENT_TIMESTAMP
         WHERE id = ?
           AND driverId = ?
           AND status IN ('Accepted', 'Confirmed')
           AND tripStartedAt IS NULL`,
        [bookingId, driverId]
      );

      if (result.affectedRows === 0) {
        return res.status(409).json({
          message: 'Trip could not be started. Please refresh and try again.'
        });
      }

      const updatedBooking = await Booking.findById(bookingId);

      return res.json({
        message: 'Trip started successfully.',
        booking: formatBooking(updatedBooking)
      });
    } catch (err) {
      console.error('START TRIP ERROR:', err);
      return res.status(500).json({
        message: 'Could not start trip.'
      });
    }
  }
);

// DRIVER COMPLETES AN ASSIGNED TRIP
router.post(
  '/:id/complete-trip',
  requireDriver,
  async (req, res) => {
    try {
      const bookingId = validBookingId(req.params.id);
      const driverId = Number(req.driverId);

      if (!bookingId) {
        return res.status(400).json({
          message: 'Invalid booking ID.'
        });
      }

      const booking = await Booking.findById(bookingId);

      if (!booking) {
        return res.status(404).json({
          message: 'Booking not found.'
        });
      }

      if (Number(booking.driverId) !== driverId) {
        return res.status(403).json({
          message: 'You are not assigned to this booking.'
        });
      }

      if (booking.status !== 'In Progress') {
        return res.status(409).json({
          message: 'Only an active trip can be completed.'
        });
      }

      const [result] = await pool.query(
        `UPDATE bookings
         SET status = 'Completed',
             tripCompletedAt = CURRENT_TIMESTAMP
         WHERE id = ?
           AND driverId = ?
           AND status = 'In Progress'
           AND tripCompletedAt IS NULL`,
        [bookingId, driverId]
      );

      if (result.affectedRows === 0) {
        return res.status(409).json({
          message: 'Trip could not be completed. Please refresh and try again.'
        });
      }

      const updatedBooking = await Booking.findById(bookingId);

      return res.json({
        message: 'Trip completed successfully.',
        booking: formatBooking(updatedBooking)
      });
    } catch (err) {
      console.error('COMPLETE TRIP ERROR:', err);
      return res.status(500).json({
        message: 'Could not complete trip.'
      });
    }
  }
);

router.advanceBookingToNextDriver = advanceBookingToNextDriver;

module.exports = router;
