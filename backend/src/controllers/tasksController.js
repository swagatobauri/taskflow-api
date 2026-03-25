const pool = require('../models/db');

const isAdmin = (req) => req.user.role === 'admin';

// GET /api/v1/tasks — admin sees all tasks, regular user sees only their own
const getTasks = async (req, res) => {
  try {
    let query, params;
    if (isAdmin(req)) {
      query = 'SELECT * FROM tasks ORDER BY created_at DESC';
      params = [];
    } else {
      query = 'SELECT * FROM tasks WHERE user_id = $1 ORDER BY created_at DESC';
      params = [req.user.id];
    }
    const result = await pool.query(query, params);
    return res.status(200).json({ success: true, data: result.rows });
  } catch (err) {
    console.error('getTasks error:', err.message);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// GET /api/v1/tasks/:id — admin can fetch any task, user only their own
const getTaskById = async (req, res) => {
  try {
    let query, params;
    if (isAdmin(req)) {
      query = 'SELECT * FROM tasks WHERE id = $1';
      params = [req.params.id];
    } else {
      query = 'SELECT * FROM tasks WHERE id = $1 AND user_id = $2';
      params = [req.params.id, req.user.id];
    }
    const result = await pool.query(query, params);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Task not found.' });
    }
    return res.status(200).json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error('getTaskById error:', err.message);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// POST /api/v1/tasks — always creates under the requesting user's id
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

// PUT /api/v1/tasks/:id — admin can update any task, user only their own
const updateTask = async (req, res) => {
  const { title, description, status } = req.body;
  try {
    let query, params;
    if (isAdmin(req)) {
      query = `UPDATE tasks
               SET title = COALESCE($1, title),
                   description = COALESCE($2, description),
                   status = COALESCE($3, status),
                   updated_at = NOW()
               WHERE id = $4
               RETURNING *`;
      params = [title, description, status, req.params.id];
    } else {
      query = `UPDATE tasks
               SET title = COALESCE($1, title),
                   description = COALESCE($2, description),
                   status = COALESCE($3, status),
                   updated_at = NOW()
               WHERE id = $4 AND user_id = $5
               RETURNING *`;
      params = [title, description, status, req.params.id, req.user.id];
    }
    const result = await pool.query(query, params);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Task not found.' });
    }
    return res.status(200).json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error('updateTask error:', err.message);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// DELETE /api/v1/tasks/:id — admin can delete any task, user only their own
const deleteTask = async (req, res) => {
  try {
    let query, params;
    if (isAdmin(req)) {
      query = 'DELETE FROM tasks WHERE id = $1 RETURNING id';
      params = [req.params.id];
    } else {
      query = 'DELETE FROM tasks WHERE id = $1 AND user_id = $2 RETURNING id';
      params = [req.params.id, req.user.id];
    }
    const result = await pool.query(query, params);
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

