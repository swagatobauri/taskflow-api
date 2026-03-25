import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

const STATUS_OPTIONS = ['todo', 'in-progress', 'done'];

const badgeClass = {
  todo: 'badge badge-todo',
  'in-progress': 'badge badge-in-progress',
  done: 'badge badge-done',
};

const formatDate = (iso) =>
  new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

/* ─── Modal for Add / Edit ──────────────────────────────────── */
function TaskModal({ initial, onSave, onClose }) {
  const [form, setForm] = useState(
    initial || { title: '', description: '', status: 'todo' }
  );
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await onSave(form);
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong.');
      setLoading(false);
    }
  };

  return (
    <div className="overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <h2>{initial ? 'Edit task' : 'New task'}</h2>
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={submit}>
          <div className="form-group">
            <label htmlFor="title">Title</label>
            <input
              id="title"
              name="title"
              value={form.title}
              onChange={handle}
              placeholder="What needs to be done?"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="description">Description (optional)</label>
            <textarea
              id="description"
              name="description"
              value={form.description}
              onChange={handle}
              placeholder="More details…"
            />
          </div>
          <div className="form-group">
            <label htmlFor="status">Status</label>
            <select id="status" name="status" value={form.status} onChange={handle}>
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-cancel" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" style={{ width: 'auto' }} disabled={loading}>
              {loading ? 'Saving…' : 'Save task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─── Dashboard ─────────────────────────────────────────────── */
export default function Dashboard() {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');
  const [modal, setModal] = useState(null); // null | 'add' | { task }
  const [confirmDelete, setConfirmDelete] = useState(null); // task id

  /* Fetch tasks on mount */
  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    setFetchError('');
    try {
      const { data } = await api.get('/tasks');
      setTasks(data.data);
    } catch (err) {
      if (err.response?.status === 401) {
        logout();
      } else {
        setFetchError('Failed to load tasks.');
      }
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  /* Add task */
  const handleAdd = async (form) => {
    const { data } = await api.post('/tasks', form);
    setTasks((prev) => [data.data, ...prev]);
    setModal(null);
  };

  /* Edit task */
  const handleEdit = async (form) => {
    const { data } = await api.put(`/tasks/${modal.task.id}`, form);
    setTasks((prev) => prev.map((t) => (t.id === data.data.id ? data.data : t)));
    setModal(null);
  };

  /* Delete task */
  const handleDelete = async (id) => {
    await api.delete(`/tasks/${id}`);
    setTasks((prev) => prev.filter((t) => t.id !== id));
    setConfirmDelete(null);
  };

  return (
    <div className="page" style={{ alignItems: 'flex-start', paddingTop: '40px' }}>
      <div className="container">
        {/* Top bar */}
        <div className="topbar">
          <h1>My Tasks</h1>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="btn btn-sm btn-ghost" onClick={() => setModal('add')}>
              + Add task
            </button>
            <button className="btn btn-sm btn-cancel" onClick={logout}>
              Logout
            </button>
          </div>
        </div>

        {fetchError && <div className="alert alert-error">{fetchError}</div>}

        {/* Task list */}
        {loading ? (
          <div className="loading">Loading tasks…</div>
        ) : tasks.length === 0 ? (
          <div className="empty">No tasks yet. Add your first one!</div>
        ) : (
          <div className="task-list">
            {tasks.map((task) => (
              <div key={task.id} className="task-item">
                <div className="task-info">
                  <div className="task-title">{task.title}</div>
                  {task.description && (
                    <div className="task-desc">{task.description}</div>
                  )}
                  <div className="task-meta">
                    <span className={badgeClass[task.status] || 'badge'}>
                      {task.status}
                    </span>
                    <span className="task-date">{formatDate(task.created_at)}</span>
                  </div>

                  {/* Inline delete confirm */}
                  {confirmDelete === task.id && (
                    <div className="confirm-row" style={{ marginTop: '10px' }}>
                      <span>Delete this task?</span>
                      <button
                        className="btn btn-sm btn-confirm-delete"
                        onClick={() => handleDelete(task.id)}
                      >
                        Yes, delete
                      </button>
                      <button
                        className="btn btn-sm btn-cancel"
                        onClick={() => setConfirmDelete(null)}
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>

                <div className="task-actions">
                  <button
                    className="btn btn-sm btn-edit"
                    onClick={() => { setConfirmDelete(null); setModal({ task }); }}
                  >
                    Edit
                  </button>
                  <button
                    className="btn btn-sm btn-delete"
                    onClick={() => { setModal(null); setConfirmDelete(task.id); }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add modal */}
      {modal === 'add' && (
        <TaskModal onSave={handleAdd} onClose={() => setModal(null)} />
      )}

      {/* Edit modal */}
      {modal && modal.task && (
        <TaskModal
          initial={modal.task}
          onSave={handleEdit}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}
