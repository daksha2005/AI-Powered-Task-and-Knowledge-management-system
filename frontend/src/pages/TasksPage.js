import React, { useEffect, useState, useCallback } from 'react';
import { getTasks, createTask, updateTaskStatus, deleteTask, getUsers } from '../services/api';
import { useAuth } from '../context/AuthContext';

const STATUS_OPTIONS = ['pending', 'in_progress', 'completed'];

function CreateTaskModal({ users, onClose, onCreated }) {
  const [form, setForm] = useState({ title: '', description: '', assigned_to: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!form.title.trim()) { setError('Title is required'); return; }
    setLoading(true);
    try {
      const payload = { ...form, assigned_to: form.assigned_to ? parseInt(form.assigned_to) : null };
      const res = await createTask(payload);
      onCreated(res.data);
      onClose();
    } catch (e) {
      setError(e.response?.data?.detail || 'Failed to create task');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h2 className="modal-title">Create New Task</h2>
        {error && <div className="alert alert-error">{error}</div>}
        <div className="form-group">
          <label className="form-label">Title *</label>
          <input className="form-control" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Task title" />
        </div>
        <div className="form-group">
          <label className="form-label">Description</label>
          <textarea className="form-control" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Optional description" />
        </div>
        <div className="form-group">
          <label className="form-label">Assign To</label>
          <select className="form-control" value={form.assigned_to} onChange={(e) => setForm({ ...form, assigned_to: e.target.value })}>
            <option value="">— Unassigned —</option>
            {users.map((u) => <option key={u.id} value={u.id}>{u.name} ({u.role.name})</option>)}
          </select>
        </div>
        <div className="modal-footer">
          <button className="btn btn-outline" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={loading}>
            {loading ? 'Creating…' : 'Create Task'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function TasksPage() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterUser, setFilterUser] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const isAdmin = user?.role?.name === 'admin';

  const fetchTasks = useCallback(() => {
    const params = {};
    if (filterStatus) params.status = filterStatus;
    if (filterUser) params.assigned_to = filterUser;
    setLoading(true);
    getTasks(params).then((r) => setTasks(r.data)).finally(() => setLoading(false));
  }, [filterStatus, filterUser]);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);
  useEffect(() => { if (isAdmin) getUsers().then((r) => setUsers(r.data)).catch(() => {}); }, [isAdmin]);

  const handleStatusChange = async (taskId, status) => {
    try {
      const res = await updateTaskStatus(taskId, { status });
      setTasks((prev) => prev.map((t) => t.id === taskId ? res.data : t));
    } catch (e) { alert('Failed to update status'); }
  };

  const handleDelete = async (taskId) => {
    if (!window.confirm('Delete this task?')) return;
    await deleteTask(taskId);
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
  };

  return (
    <div className="page">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">Tasks</h1>
          <p className="page-subtitle">{isAdmin ? 'Manage and assign tasks' : 'Your assigned tasks'}</p>
        </div>
        {isAdmin && (
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ New Task</button>
        )}
      </div>

      <div className="filters">
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
          <option value="">All statuses</option>
          {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
        </select>
        {isAdmin && (
          <select value={filterUser} onChange={(e) => setFilterUser(e.target.value)}>
            <option value="">All users</option>
            {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
        )}
        <button className="btn btn-outline btn-sm" onClick={fetchTasks}>Refresh</button>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <div className="table-wrap">
          {loading ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#9ca3af' }}>Loading tasks…</div>
          ) : tasks.length === 0 ? (
            <div className="empty-state"><div className="empty-state-icon">✅</div><p>No tasks found</p></div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Title</th>
                  <th>Status</th>
                  {isAdmin && <th>Assigned To</th>}
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map((task) => (
                  <tr key={task.id}>
                    <td style={{ color: '#9ca3af' }}>{task.id}</td>
                    <td>
                      <div style={{ fontWeight: 500 }}>{task.title}</div>
                      {task.description && <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>{task.description.slice(0, 60)}{task.description.length > 60 ? '…' : ''}</div>}
                    </td>
                    <td><span className={`badge badge-${task.status}`}>{task.status.replace('_', ' ')}</span></td>
                    {isAdmin && <td style={{ fontSize: 13 }}>{users.find((u) => u.id === task.assigned_to)?.name || '—'}</td>}
                    <td style={{ fontSize: 12, color: '#9ca3af' }}>{new Date(task.created_at).toLocaleDateString()}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {task.status !== 'completed' && (
                          <select
                            style={{ fontSize: 12, padding: '4px 8px', border: '1px solid #d1d5db', borderRadius: 4 }}
                            value={task.status}
                            onChange={(e) => handleStatusChange(task.id, e.target.value)}
                          >
                            {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                          </select>
                        )}
                        {isAdmin && (
                          <button className="btn btn-danger btn-sm" onClick={() => handleDelete(task.id)}>Delete</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {showModal && (
        <CreateTaskModal
          users={users}
          onClose={() => setShowModal(false)}
          onCreated={(task) => setTasks((prev) => [task, ...prev])}
        />
      )}
    </div>
  );
}
