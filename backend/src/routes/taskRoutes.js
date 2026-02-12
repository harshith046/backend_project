const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const taskController = require('../controllers/taskController');
const { authenticateToken } = require('../middleware/authMiddleware');

router.get('/', authenticateToken, taskController.getAllTasks);
router.post('/', authenticateToken, [
  body('title').trim().isLength({ min: 1, max: 255 }).escape(),
  body('description').optional().trim().escape(),
  body('due_date').optional().isISO8601().toDate(), // validate date format
], taskController.createTask);
router.get('/:id', authenticateToken, taskController.getTask);
router.put('/:id', authenticateToken, [
  body('title').optional().trim().isLength({ min: 1, max: 255 }).escape(),
  body('description').optional().trim().escape(),
  body('completed').optional().isBoolean(),
  body('due_date').optional().isISO8601().toDate(),
], taskController.updateTask);
router.delete('/:id', authenticateToken, taskController.deleteTask);

module.exports = router;