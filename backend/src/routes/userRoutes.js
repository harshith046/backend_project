const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticateToken } = require('../middleware/authMiddleware');
const { body } = require('express-validator');

router.post('/register', [
  body('username').trim().isLength({ min: 3, max: 50 }),
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }),
], userController.register);

router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }),
], userController.login);

router.get('/', authenticateToken, userController.getAllUsers);

router.put('/:id', authenticateToken, [
  body('username').optional().trim().isLength({ min: 3, max: 50 }),
  body('email').optional().isEmail().normalizeEmail(),
  body('role').optional().isIn(['USER', 'ADMIN']),
  body('password').optional().isLength({ min: 8 }),
], userController.updateUser);

router.delete('/:id', authenticateToken, userController.deleteUser);

module.exports = router;