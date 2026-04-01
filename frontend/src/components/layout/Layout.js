import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const navItems = [
  { path: '/', label: '🏠 Dashboard', roles: ['admin', 'user'] },
  { path: '/tasks', label: '✅ Tasks', roles: ['admin', 'user'] },
  { path: '/documents', label: '📄 Documents', roles: ['admin', 'user'] },
  { path: '/search', label: '🔍 AI Search', roles: ['admin', 'user'] },
  { path: '/analytics', label: '📊 Analytics', roles: ['admin'] },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const role = user?.role?.name || 'user';

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <span>🧠</span> KnowledgeAI
        </div>
        <nav className="sidebar-nav">
          {navItems
            .filter((item) => item.roles.includes(role))
            .map((item) => (
              <div
                key={item.path}
                className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
                onClick={() => navigate(item.path)}
              >
                {item.label}
              </div>
            ))}
        </nav>
        <div className="sidebar-footer">
          <div className="sidebar-user">{user?.name}</div>
          <div className="sidebar-role">{role}</div>
          <button className="logout-btn" onClick={logout}>Sign out</button>
        </div>
      </aside>
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
