require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());

const aiBookingRoutes = require('./routes/aiBooking');
app.use('/api/ai-booking', aiBookingRoutes);

const driverRoutes = require('./routes/drivers');
app.use('/api/drivers', driverRoutes);

const customerRoutes = require('./routes/customers');
app.use('/api/customers', customerRoutes);

const bookingRoutes = require('./routes/bookings');
app.use('/api/bookings', bookingRoutes);
app.use('/api/bookings', require('./routes/chatMessages'));

const adminRoutes = require('./routes/admin');
app.use('/api/admin', adminRoutes);
app.use('/api/driver-features', require('./routes/driverFeatures'));

module.exports = app;

if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server on port ${PORT}`);
  });
}

