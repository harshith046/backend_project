const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');

/* ─── AUTHENTICATION HANDLERS ───────────────────────────────────────────── */

/**
 * Register New User:
 * Validates input, checks for duplicates, hashes password, and creates account.
 * Security: Default role is strictly 'USER' to prevent privilege escalation.
 */
exports.register = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { username, email, password } = req.body;

  try {
    // Check for duplicate email
    const existing = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) return res.status(400).json({ error: 'Email already registered' });

    // Hash password securely (Salt factor: 10)
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);

    // Insert new user
    const result = await db.query(
      'INSERT INTO users (username, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id, username, email, role',
      [username, email, hash, 'USER']
    );

    res.status(201).json({ message: 'User registered', user: result.rows[0] });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Server error during registration' });
  }
};

/**
 * User Login:
 * Verifies credentials and issues a JWT for session management.
 * Audit: Updates 'last_login' timestamp.
 */
exports.login = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { email, password } = req.body;

  try {
    // Fetch user by email
    const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];
    
    // Generic error message prevents username enumeration attacks
    if (!user) return res.status(401).json({ error: 'Invalid email or password' });

    // Verify Password
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Invalid email or password' });

    // Update Audit Log
    await db.query('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1', [user.id]);

    // Issue JWT
    const token = jwt.sign(
      { id: user.id.toString(), role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        last_login: new Date().toISOString(),
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error during login' });
  }
};

/* ─── ADMINISTRATIVE HANDLERS ───────────────────────────────────────────── */

/**
 * Get All Users (Admin Only):
 * Returns a list of all users for the admin dashboard.
 */
exports.getAllUsers = async (req, res) => {
  if (req.user.role !== 'ADMIN') return res.status(403).json({ error: 'Admin access required' });

  try {
    const result = await db.query(
      'SELECT id, username, email, role, created_at, last_login FROM users ORDER BY created_at DESC'
    );

    res.json({
      totalMembers: result.rows.length,
      users: result.rows,
    });
  } catch (err) {
    console.error('Get users error:', err);
    res.status(500).json({ error: 'Server error fetching users' });
  }
};

/**
 * Update User (Admin Only):
 * Dynamically updates provided fields (username, email, role, password).
 */
exports.updateUser = async (req, res) => {
  if (req.user.role !== 'ADMIN') return res.status(403).json({ error: 'Admin access required' });

  const { id } = req.params;
  const { username, email, role, password } = req.body;

  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const check = await db.query('SELECT * FROM users WHERE id = $1', [id]);
    if (check.rows.length === 0) return res.status(404).json({ error: 'User not found' });

    const fields = [];
    const values = [];
    let idx = 1;

    if (username) { fields.push(`username = $${idx}`); values.push(username); idx++; }
    if (email) { fields.push(`email = $${idx}`); values.push(email); idx++; }
    if (role && ['USER', 'ADMIN'].includes(role)) { fields.push(`role = $${idx}`); values.push(role); idx++; }
    if (password) {
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash(password, salt);
      fields.push(`password_hash = $${idx}`); values.push(hash); idx++;
    }

    if (fields.length === 0) return res.status(400).json({ error: 'No fields to update' });

    values.push(id);
    const query = `UPDATE users SET ${fields.join(', ')} WHERE id = $${idx} RETURNING id, username, email, role, last_login`;

    const updated = await db.query(query, values);
    res.json({ message: 'User updated', user: updated.rows[0] });
  } catch (err) {
    console.error('Update user error:', err);
    res.status(500).json({ error: 'Server error updating user' });
  }
};

/**
 * Delete User (Admin Only):
 * Permanently removes a user. Includes safeguards against self-deletion.
 */
exports.deleteUser = async (req, res) => {
  if (req.user.role !== 'ADMIN') return res.status(403).json({ error: 'Admin access required' });

  const { id } = req.params;

  if (Number(id) === req.user.id) return res.status(400).json({ error: 'Cannot delete your own account' });

  try {
    const check = await db.query('SELECT * FROM users WHERE id = $1', [id]);
    if (check.rows.length === 0) return res.status(404).json({ error: 'User not found' });

    await db.query('DELETE FROM users WHERE id = $1', [id]);
    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    console.error('Delete user error:', err);
    res.status(500).json({ error: 'Server error deleting user' });
  }
};