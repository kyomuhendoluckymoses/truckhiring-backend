const jwt = require('jsonwebtoken');

module.exports = function requireCustomer(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Customer login required.' });
  }

  const token = authHeader.slice(7);

  try {
    const payload = jwt.verify(
      token,
      process.env.CUSTOMER_TOKEN_SECRET || 'secret'
    );

    if (payload.role !== 'customer' || !payload.id) {
      return res.status(401).json({ message: 'Invalid customer token.' });
    }

    req.customerId = payload.id;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired customer token.' });
  }
};
