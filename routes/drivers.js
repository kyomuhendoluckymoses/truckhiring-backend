const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const Driver = require('../models/Driver');
const db = require('../db');
const requireDriver = require('../middleware/requireDriver');

const TOKEN_SECRET = process.env.DRIVER_TOKEN_SECRET;

if (!TOKEN_SECRET) {
  throw new Error('DRIVER_TOKEN_SECRET environment variable is required.');
}

// GET ALL DRIVERS
router.get('/', async (req, res) => {
  try {
    const drivers = await Driver.all();

    // Never send driver passwords to the frontend
    const safeDrivers = drivers.map(({ password, ...driver }) => driver);

    return res.json({ drivers: safeDrivers });

  } catch (err) {
    console.error('GET DRIVERS ERROR:', err);

    return res.status(500).json({
      message: 'Could not load drivers.'
    });
  }
});

// DRIVER LOGIN
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: 'Email and password are required.'
      });
    }

    const driver = await Driver.findByEmail(email);

    if (!driver) {
      return res.status(401).json({
        message: 'Invalid email or password.'
      });
    }

    if (driver.availability === 'suspended') {
      return res.status(403).json({
        message: 'Your account has been suspended. Please contact Lucky Movers Admin.'
      });
    }

    const valid = await bcrypt.compare(password, driver.password);

    if (!valid) {
      return res.status(401).json({
        message: 'Invalid email or password.'
      });
    }

    const payload = {
      role: 'driver',
      id: driver.id,
      expiresAt: Date.now() + 24 * 60 * 60 * 1000
    };

    const payloadB64 = Buffer
      .from(JSON.stringify(payload))
      .toString('base64url');

    const signature = crypto
      .createHmac('sha256', TOKEN_SECRET)
      .update(payloadB64)
      .digest('base64url');

    const token = `${payloadB64}.${signature}`;

    return res.json({
      message: 'Login successful.',
      token,
      driver: {
        id: driver.id,
        name: driver.name,
        email: driver.email,
        phone: driver.phone,
        truckType: driver.truckType,
        availability: driver.availability
      }
    });

  } catch (err) {
    console.error('DRIVER LOGIN ERROR:', err);

    return res.status(500).json({
      message: 'Could not log in.'
    });
  }
});

// UPDATE DRIVER GPS LOCATION
router.patch('/location', requireDriver, async (req, res) => {
  try {
    const latitude = Number(req.body.latitude);
    const longitude = Number(req.body.longitude);

    if (
      !Number.isFinite(latitude) ||
      !Number.isFinite(longitude) ||
      latitude < -90 || latitude > 90 ||
      longitude < -180 || longitude > 180
    ) {
      return res.status(400).json({
        message: 'Invalid GPS coordinates.'
      });
    }

    const driver = await Driver.updateLocation(
      req.driverId,
      latitude,
      longitude
    );

    if (!driver) {
      return res.status(404).json({
        message: 'Driver not found.'
      });
    }

    return res.json({
      message: 'Driver location updated.'
    });

  } catch (err) {
    console.error('UPDATE DRIVER LOCATION ERROR:', err);

    return res.status(500).json({
      message: 'Could not update driver location.'
    });
  }
});

// GET DRIVER PROFILE
router.get('/me', requireDriver, async (req, res) => {
  try {
    const driver = await Driver.findById(req.driverId);

    if (!driver) {
      return res.status(404).json({
        message: 'Driver not found.'
      });
    }

    const { password, ...safeDriver } = driver;

    return res.json({
      driver: safeDriver
    });

  } catch (err) {
    console.error('GET DRIVER PROFILE ERROR:', err);

    return res.status(500).json({
      message: 'Could not load profile.'
    });
  }
});

// TOGGLE DRIVER AVAILABILITY
router.patch('/me/availability', requireDriver, async (req, res) => {
  try {
    const { availability } = req.body;

    const allowedStatuses = [
      'available',
      'offline',
      'busy'
    ];

    if (!allowedStatuses.includes(availability)) {
      return res.status(400).json({
        message: 'Invalid availability status.'
      });
    }

    const updatedDriver = await Driver.updateAvailability(
      req.driverId,
      availability
    );

    if (!updatedDriver) {
      return res.status(404).json({
        message: 'Driver not found.'
      });
    }

    return res.json({
      message: 'Availability updated.',
      driver: updatedDriver
    });

  } catch (err) {
    console.error('UPDATE AVAILABILITY ERROR:', err);

    return res.status(500).json({
      message: 'Could not update availability.'
    });
  }
});

// REGISTER DRIVER
router.post('/register', async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      password,
      truckType,
      truckPlate
    } = req.body;

    if (!name || !email || !phone || !password || !truckType) {
      return res.status(400).json({
        message: 'Please fill all required fields.'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        message: 'Password must contain at least 6 characters.'
      });
    }

    const existing = await Driver.findByEmail(email);

    if (existing) {
      return res.status(400).json({
        message: 'Email already registered.'
      });
    }

    const driver = await Driver.create({
      name,
      email,
      phone,
      password,
      truckType,
      truckPlate: truckPlate || ''
    });

    const { password: savedPassword, ...safeDriver } = driver;

    return res.status(201).json({
      message: 'Driver registered successfully.',
      driver: safeDriver
    });

  } catch (err) {
    console.error('DRIVER REGISTER ERROR:', err);

    return res.status(500).json({
      message: 'Could not register driver.'
    });
  }
});

module.exports = router;