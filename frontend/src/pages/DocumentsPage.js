import React, { useEffect, useState, useRef } from 'react';
import { getDocuments, uploadDocument, deleteDocument } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function DocumentsPage() {
  const { user } = useAuth();
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [title, setTitle] = useState('');
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const fileRef = useRef();
  const isAdmin = user?.role?.name === 'admin';

  useEffect(() => {
    getDocuments().then((r) => setDocs(r.data)).finally(() => setLoading(false));
  }, []);

  const handleUpload = async () => {
    if (!title.trim() || !file) { setError('Title and file are required'); return; }
    setError(''); setSuccess(''); setUploading(true);
    try {
      const fd = new FormData();
      fd.append('title', title);
      fd.append('file', file);
      const res = await uploadDocument(fd);
      setDocs((prev) => [res.data, ...prev]);
      setTitle(''); setFile(null);
      if (fileRef.current) fileRef.current.value = '';
      setSuccess('Document uploaded and indexed successfully!');
    } catch (e) {
      setError(e.response?.data?.detail || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this document? This will also remove it from the search index.')) return;
    await deleteDocument(id);
    setDocs((prev) => prev.filter((d) => d.id !== id));
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Documents</h1>
        <p className="page-subtitle">Knowledge base — {docs.length} document{docs.length !== 1 ? 's' : ''} indexed</p>
      </div>

      {isAdmin && (
        <div className="card">
          <div className="card-title">Upload New Document</div>
          {error && <div className="alert alert-error">{error}</div>}
          {success && <div className="alert alert-success">{success}</div>}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Document Title *</label>
              <input className="form-control" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Company HR Policy 2024" />
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">File (.txt or .pdf) *</label>
              <input ref={fileRef} className="form-control" type="file" accept=".txt,.pdf" onChange={(e) => setFile(e.target.files[0])} />
            </div>
          </div>
          {file && (
            <div style={{ marginTop: 10, fontSize: 13, color: '#6b7280' }}>
              📎 {file.name} ({(file.size / 1024).toFixed(1)} KB)
            </div>
          )}
          <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={handleUpload} disabled={uploading}>
            {uploading ? '⏳ Uploading & Indexing…' : '📤 Upload & Index'}
          </button>
        </div>
      )}

      <div className="card" style={{ padding: 0 }}>
        <div className="table-wrap">
          {loading ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#9ca3af' }}>Loading documents…</div>
          ) : docs.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📄</div>
              <p>No documents uploaded yet</p>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Title</th>
                  <th>Filename</th>
                  <th>Uploaded</th>
                  {isAdmin && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {docs.map((doc) => (
                  <tr key={doc.id}>
                    <td style={{ color: '#9ca3af' }}>{doc.id}</td>
                    <td style={{ fontWeight: 500 }}>{doc.title}</td>
                    <td style={{ fontSize: 13, color: '#6b7280' }}>📎 {doc.filename}</td>
                    <td style={{ fontSize: 12, color: '#9ca3af' }}>{new Date(doc.created_at).toLocaleDateString()}</td>
                    {isAdmin && (
                      <td>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(doc.id)}>Delete</button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
