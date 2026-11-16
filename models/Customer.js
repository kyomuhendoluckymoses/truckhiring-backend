
const pool = require('../db');
const bcrypt = require('bcryptjs');

const Customer = {
  async findById(id) {
    const [rows] = await pool.query(
      `SELECT id, name, email, phone, createdAt
       FROM customers
       WHERE id = ?
       LIMIT 1`,
      [id]
    );

    return rows[0] || null;
  },

  async findByEmail(email) {
    const [rows] = await pool.query(
      'SELECT * FROM customers WHERE email = ? LIMIT 1',
      [email]
    );

    return rows[0] || null;
  },

  async findByPhone(phone) {
    const [rows] = await pool.query(
      'SELECT * FROM customers WHERE phone = ? LIMIT 1',
      [phone]
    );

    return rows[0] || null;
  },

  async create({ name, email, phone, password }) {
    const hash = await bcrypt.hash(password, 10);

    const [result] = await pool.query(
      `INSERT INTO customers
       (name, email, phone, password)
       VALUES (?, ?, ?, ?)`,
      [name, email, phone, hash]
    );

    return this.findById(result.insertId);
  },

  async updateProfile(id, { name, email, phone }) {
    await pool.query(
      `UPDATE customers
       SET name = ?, email = ?, phone = ?
       WHERE id = ?`,
      [name, email, phone, id]
    );

    return this.findById(id);
  },

  async comparePassword(plain, hash) {
    return bcrypt.compare(plain, hash);
  }
};

module.exports = Customer;
