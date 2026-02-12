const db = require('../config/db');
const { validationResult } = require('express-validator');
const redisClient = require('../config/redis');

// exports.getAllTasks = async (req, res) => {
//   try {
//     let query = 'SELECT * FROM tasks';
//     let params = [];
//     if (req.user.role !== 'ADMIN') {
//       query += ' WHERE user_id = $1';
//       params.push(req.user.id);
//     }
//     query += ' ORDER BY created_at DESC';
//     const result = await db.query(query, params);
//     res.json(result.rows);
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: 'Server error fetching tasks' });
//   }
// };

exports.getTask = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await db.query('SELECT * FROM tasks WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }
    const task = result.rows[0];
    if (req.user.role !== 'ADMIN' && task.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    res.json(task);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

/**
 * Get All Tasks:
 * Implementation of access control
 */
exports.getAllTasks = async (req, res) => {
  try {
    const result = await db.query(
      'SELECT * FROM tasks WHERE user_id = $1',
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Get tasks error:', err);
    res.status(500).json({ error: 'Server error fetching tasks' });
  }
};

/**
 * Create Task:
 * Links the new resource to the authenticated user ID found in the JWT.
 */
exports.createTask = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { title, description, due_date } = req.body;

  try {
    const result = await db.query(
        'INSERT INTO tasks (title, description, user_id, due_date) VALUES ($1, $2, $3, $4)',
        [title, description || '', req.user.id, due_date || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error creating task' });
  }
};

/**
 * Update Task:
 * Checks existence.
 * Builds dynamic query to allow partial updates.
 */
exports.updateTask = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { id } = req.params;
  const { title, description, completed, due_date } = req.body;

  try {
    const taskCheck = await db.query('SELECT * FROM tasks WHERE id = $1', [id]);
    if (taskCheck.rows.length === 0) return res.status(404).json({ error: 'Task not found' });
    if (req.user.role !== 'ADMIN' && taskCheck.rows[0].user_id !== req.user.id) return res.status(403).json({ error: 'Not authorized' });

    const fields = [];
    const values = [];
    let idx = 1;

    if (title) { fields.push(`title = $${idx}`); values.push(title); idx++; }
    if (description !== undefined) { fields.push(`description = $${idx}`); values.push(description); idx++; }
    if (completed !== undefined) { fields.push(`completed = $${idx}`); values.push(completed); idx++; }
    if (due_date !== undefined) { fields.push(`due_date = $${idx}`); values.push(due_date); idx++; }

    if (fields.length === 0) return res.status(400).json({ error: 'No fields to update' });

    values.push(id);
    const query = `UPDATE tasks SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`;

    const result = await db.query(query, values);
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error updating task' });
  }
};

/**
 * Delete Task:
 * Removes a task and invalidates the Redis cache to ensure subsequent 
 * read requests fetch fresh data.
 */
exports.deleteTask = async (req, res) => {
  const { id } = req.params;

  try {
    const check = await db.query('SELECT * FROM tasks WHERE id = $1', [id]);
    if (check.rows.length === 0) return res.status(404).json({ error: 'Task not found' });

    if (req.user.role !== 'ADMIN' && check.rows[0].user_id !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    await db.query('DELETE FROM tasks WHERE id = $1', [id]);

    await redisClient.del('cache:GET:/api/v1/tasks').catch(() => {});

    res.json({ message: 'Task deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error deleting task' });
  }
};
