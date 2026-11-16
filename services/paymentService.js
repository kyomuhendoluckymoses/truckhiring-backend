
const Booking = require('../models/Booking');
const PaymentTransaction = require('../models/PaymentTransaction');

// Keep real Mobile Money payments disabled during development.
const PAYMENTS_ENABLED = false;

const ALLOWED_PROVIDERS = ['MTN', 'AIRTEL'];

const paymentService = {
  isEnabled() {
    return PAYMENTS_ENABLED;
  },

  async validatePaymentRequest({ bookingId, provider }) {
    if (!PAYMENTS_ENABLED) {
      throw new Error(
        'Mobile Money payments are disabled while secure verification is being implemented.'
      );
    }

    const normalizedProvider = String(provider || '').toUpperCase();
    const numericBookingId = Number(bookingId);

    if (!ALLOWED_PROVIDERS.includes(normalizedProvider)) {
      throw new Error('Select MTN or AIRTEL Mobile Money.');
    }

    if (
      !Number.isSafeInteger(numericBookingId) ||
      numericBookingId <= 0
    ) {
      throw new Error('A valid booking ID is required.');
    }

    const booking = await Booking.findById(numericBookingId);

    if (!booking) {
      throw new Error('Booking not found.');
    }

    if (booking.status !== 'Confirmed') {
      throw new Error('The booking must be confirmed before payment.');
    }

    const amountUGX = Number(booking.agreedPrice);

    if (!Number.isFinite(amountUGX) || amountUGX <= 0) {
      throw new Error('The confirmed booking price is invalid.');
    }

    if (booking.paymentStatus === 'Paid') {
      throw new Error('This booking is already marked as paid.');
    }

    return {
      bookingId: booking.id,
      provider: normalizedProvider,
      amountUGX,
      currency: 'UGX'
    };
  },

  async initiatePayment() {
    throw new Error(
      'Payment initiation is disabled until provider integration and secure verification are implemented.'
    );
  },

  async verifyPayment() {
    throw new Error(
      'Payment verification is not implemented. No payment can be marked successful.'
    );
  }
};

module.exports = paymentService;
