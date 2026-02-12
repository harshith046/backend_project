const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const userController = require('../controllers/userController');

router.post('/register', [
  body('username').trim().isLength({ min: 3, max: 50 }).escape(),
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }),
], userController.register);

router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }),
], userController.login);

module.exports = router;