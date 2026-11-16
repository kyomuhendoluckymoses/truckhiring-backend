const crypto = require('crypto');
const Driver = require('../models/Driver');

const TOKEN_SECRET = process.env.DRIVER_TOKEN_SECRET;

if (!TOKEN_SECRET) {
  throw new Error('DRIVER_TOKEN_SECRET environment variable is required.');
}

async function requireDriver(req, res, next) {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ')
      ? authHeader.slice(7)
      : '';

    const parts = token.split('.');

    if (parts.length !== 2 || !parts[0] || !parts[1]) {
      return res.status(401).json({
        message: 'Driver login required.',
      });
    }

    const [payload, suppliedSignature] = parts;

    const expectedSignature = crypto
      .createHmac('sha256', TOKEN_SECRET)
      .update(payload)
      .digest();

    const actualSignature = Buffer.from(
      suppliedSignature,
      'base64url'
    );

    if (
      actualSignature.length !== expectedSignature.length ||
      !crypto.timingSafeEqual(actualSignature, expectedSignature)
    ) {
      return res.status(401).json({
        message: 'Invalid driver token.',
      });
    }

    const data = JSON.parse(
      Buffer.from(payload, 'base64url').toString('utf8')
    );

    if (
      data.role !== 'driver' ||
      !data.id ||
      !Number.isFinite(data.expiresAt) ||
      data.expiresAt <= Date.now()
    ) {
      return res.status(401).json({
        message: 'Driver token expired or invalid.',
      });
    }

    const driver = await Driver.findById(data.id);

    if (!driver) {
      return res.status(401).json({
        message: 'Driver account not found.',
      });
    }

    if (driver.availability === 'suspended') {
      return res.status(403).json({
        message: 'Driver account suspended.',
      });
    }

    req.driverId = String(driver.id);
    req.driver = driver;

    return next();
  } catch (err) {
    console.error('DRIVER AUTHENTICATION ERROR:', err);

    return res.status(401).json({
      message: 'Invalid driver token.',
    });
  }
}

module.exports = requireDriver;