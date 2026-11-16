const express = require('express');
const router = express.Router();

const paymentService = require('../services/paymentService');
const PaymentTransaction = require('../models/PaymentTransaction');

// Check payment integration status.
router.get('/status', (req, res) => {
  return res.json({
    message: 'Lucky Movers payment service is available.',
    paymentsEnabled: paymentService.isEnabled(),
    supportedProviders: ['MTN', 'AIRTEL', 'CASH'],
    realPaymentsAvailable: false
  });
});

// Initiate a payment — creates a Pending ledger row.
// Does not contact any provider. Admin confirms manually.
router.post('/initiate', async (req, res) => {
  try {
    const { bookingId, provider } = req.body || {};

    if (!bookingId || !provider) {
      return res.status(400).json({
        message: 'Booking ID and payment provider are required.'
      });
    }

    if (!paymentService.isEnabled()) {
      return res.status(503).json({
        message:
          'Payments are disabled. Set PAYMENTS_ENABLED=true in .env and restart the server.',
        paymentsEnabled: false
      });
    }

    const result = await paymentService.initiatePayment({ bookingId, provider });

    return res.status(201).json({
      message: 'Payment recorded. Admin will confirm shortly.',
      transactionReference: result.transactionReference,
      status: result.status
    });
  } catch (error) {
    console.error('PAYMENT INITIATE ERROR:', error.message);
    return res.status(400).json({
      message: error.message || 'Could not initiate payment.'
    });
  }
});

// Retrieve transaction information using an internal reference.
router.get('/transaction/:reference', async (req, res) => {
  try {
    if (!/^[a-zA-Z0-9-]{1,100}$/.test(req.params.reference)) {
      return res.status(400).json({
        message: 'Invalid transaction reference.'
      });
    }

    const transaction = await PaymentTransaction.findByReference(
      req.params.reference
    );

    if (!transaction) {
      return res.status(404).json({
        message: 'Transaction not found.'
      });
    }

    return res.json({ transaction });
  } catch (error) {
    console.error('PAYMENT TRANSACTION LOOKUP ERROR:', error.message);
    return res.status(500).json({
      message: 'Could not retrieve transaction.'
    });
  }
});

module.exports = router;