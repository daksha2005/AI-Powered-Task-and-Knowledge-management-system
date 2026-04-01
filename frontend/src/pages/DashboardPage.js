import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getTasks, getDocuments } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [docs, setDocs] = useState([]);
  const isAdmin = user?.role?.name === 'admin';

  useEffect(() => {
    getTasks().then((r) => setTasks(r.data)).catch(() => {});
    getDocuments().then((r) => setDocs(r.data)).catch(() => {});
  }, []);

  const pending = tasks.filter((t) => t.status === 'pending').length;
  const inProgress = tasks.filter((t) => t.status === 'in_progress').length;
  const completed = tasks.filter((t) => t.status === 'completed').length;

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Welcome back, {user?.name} 👋</h1>
        <p className="page-subtitle">Here's what's happening in your workspace</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Total Tasks</div>
          <div className="stat-value">{tasks.length}</div>
        </div>
        <div className="stat-card yellow">
          <div className="stat-label">Pending</div>
          <div className="stat-value">{pending}</div>
        </div>
        <div className="stat-card" style={{ borderLeftColor: '#3b82f6' }}>
          <div className="stat-label">In Progress</div>
          <div className="stat-value">{inProgress}</div>
        </div>
        <div className="stat-card green">
          <div className="stat-label">Completed</div>
          <div className="stat-value">{completed}</div>
        </div>
        <div className="stat-card" style={{ borderLeftColor: '#8b5cf6' }}>
          <div className="stat-label">Documents</div>
          <div className="stat-value">{docs.length}</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div className="card">
          <div className="card-title">Recent Tasks</div>
          {tasks.slice(0, 5).length === 0
            ? <div className="empty-state"><p>No tasks yet</p></div>
            : tasks.slice(0, 5).map((t) => (
              <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #f3f4f6' }}>
                <span style={{ fontSize: 14 }}>{t.title}</span>
                <span className={`badge badge-${t.status}`}>{t.status.replace('_', ' ')}</span>
              </div>
            ))}
          <button className="btn btn-outline btn-sm" style={{ marginTop: 12 }} onClick={() => navigate('/tasks')}>
            View all tasks →
          </button>
        </div>

        <div className="card">
          <div className="card-title">Quick Actions</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <button className="btn btn-primary" onClick={() => navigate('/search')}>
              🔍 AI Document Search
            </button>
            <button className="btn btn-outline" onClick={() => navigate('/tasks')}>
              ✅ View My Tasks
            </button>
            {isAdmin && (
              <>
                <button className="btn btn-outline" onClick={() => navigate('/documents')}>
                  📄 Upload Documents
                </button>
                <button className="btn btn-outline" onClick={() => navigate('/analytics')}>
                  📊 View Analytics
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
