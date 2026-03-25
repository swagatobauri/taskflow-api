const pool = require('../models/db');

// GET /api/v1/tasks — get all tasks for the logged-in user
const getTasks = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM tasks WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user.id]
    );
    return res.status(200).json({ success: true, data: result.rows });
  } catch (err) {
    console.error('getTasks error:', err.message);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// GET /api/v1/tasks/:id
const getTaskById = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM tasks WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Task not found.' });
    }
    return res.status(200).json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error('getTaskById error:', err.message);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// POST /api/v1/tasks
const createTask = async (req, res) => {
  const { title, description, status = 'todo' } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO tasks (user_id, title, description, status)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [req.user.id, title, description, status]
    );
    return res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error('createTask error:', err.message);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// PUT /api/v1/tasks/:id
const updateTask = async (req, res) => {
  const { title, description, status } = req.body;
  try {
    const result = await pool.query(
      `UPDATE tasks
       SET title = COALESCE($1, title),
           description = COALESCE($2, description),
           status = COALESCE($3, status),
           updated_at = NOW()
       WHERE id = $4 AND user_id = $5
       RETURNING *`,
      [title, description, status, req.params.id, req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Task not found.' });
    }
    return res.status(200).json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error('updateTask error:', err.message);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// DELETE /api/v1/tasks/:id
const deleteTask = async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM tasks WHERE id = $1 AND user_id = $2 RETURNING id',
      [req.params.id, req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Task not found.' });
    }
    return res.status(200).json({ success: true, data: { deleted: result.rows[0].id } });
  } catch (err) {
    console.error('deleteTask error:', err.message);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

module.exports = { getTasks, getTaskById, createTask, updateTask, deleteTask };
