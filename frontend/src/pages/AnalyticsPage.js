import React, { useEffect, useState } from 'react';
import { getAnalytics } from '../services/api';

function BarChart({ data, maxVal }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {data.map((item, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 160, fontSize: 13, color: '#374151', textAlign: 'right', flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
               title={item.query}>
            {item.query}
          </div>
          <div style={{ flex: 1, background: '#f3f4f6', borderRadius: 4, height: 20, position: 'relative' }}>
            <div style={{
              width: `${maxVal ? (item.count / maxVal) * 100 : 0}%`,
              background: '#4f46e5', height: '100%', borderRadius: 4,
              transition: 'width 0.6s ease', minWidth: item.count > 0 ? 4 : 0
            }} />
          </div>
          <div style={{ width: 32, fontSize: 13, fontWeight: 600, color: '#4f46e5' }}>{item.count}</div>
        </div>
      ))}
    </div>
  );
}

function DonutStat({ value, max, color, label }) {
  const pct = max ? Math.round((value / max) * 100) : 0;
  const r = 40, cx = 50, cy = 50;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  return (
    <div style={{ textAlign: 'center' }}>
      <svg width={100} height={100} viewBox="0 0 100 100">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f3f4f6" strokeWidth={12} />
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth={12}
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
          transform="rotate(-90 50 50)" />
        <text x={cx} y={cy + 5} textAnchor="middle" fontSize={18} fontWeight="700" fill={color}>{value}</text>
      </svg>
      <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>{label}</div>
      <div style={{ fontSize: 11, color: '#9ca3af' }}>{pct}%</div>
    </div>
  );
}

export default function AnalyticsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAnalytics().then((r) => setData(r.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="page"><div style={{ padding: 40, textAlign: 'center', color: '#9ca3af' }}>Loading analytics…</div></div>;
  if (!data) return null;

  const maxSearch = data.top_searches.length > 0 ? Math.max(...data.top_searches.map((s) => s.count)) : 1;

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">📊 Analytics</h1>
        <p className="page-subtitle">System-wide metrics and usage insights</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card"><div className="stat-label">Total Tasks</div><div className="stat-value">{data.total_tasks}</div></div>
        <div className="stat-card yellow"><div className="stat-label">Pending</div><div className="stat-value">{data.pending_tasks}</div></div>
        <div className="stat-card" style={{ borderLeftColor: '#3b82f6' }}><div className="stat-label">In Progress</div><div className="stat-value">{data.in_progress_tasks}</div></div>
        <div className="stat-card green"><div className="stat-label">Completed</div><div className="stat-value">{data.completed_tasks}</div></div>
        <div className="stat-card" style={{ borderLeftColor: '#8b5cf6' }}><div className="stat-label">Documents</div><div className="stat-value">{data.total_documents}</div></div>
        <div className="stat-card" style={{ borderLeftColor: '#f59e0b' }}><div className="stat-label">Users</div><div className="stat-value">{data.total_users}</div></div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div className="card">
          <div className="card-title">Task Status Breakdown</div>
          {data.total_tasks === 0 ? (
            <div className="empty-state"><p>No tasks yet</p></div>
          ) : (
            <div style={{ display: 'flex', justifyContent: 'space-around', padding: '10px 0' }}>
              <DonutStat value={data.pending_tasks} max={data.total_tasks} color="#f59e0b" label="Pending" />
              <DonutStat value={data.in_progress_tasks} max={data.total_tasks} color="#3b82f6" label="In Progress" />
              <DonutStat value={data.completed_tasks} max={data.total_tasks} color="#10b981" label="Completed" />
            </div>
          )}
        </div>

        <div className="card">
          <div className="card-title">Top Searched Queries</div>
          {data.top_searches.length === 0 ? (
            <div className="empty-state"><p>No searches yet</p></div>
          ) : (
            <BarChart data={data.top_searches} maxVal={maxSearch} />
          )}
        </div>
      </div>
    </div>
  );
}
