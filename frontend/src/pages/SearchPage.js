import React, { useState } from 'react';
import { searchDocuments } from '../services/api';

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [topK, setTopK] = useState(5);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState('');

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true); setError(''); setResults(null);
    try {
      const res = await searchDocuments(query.trim(), topK);
      setResults(res.data.results);
      setSearched(res.data.query);
    } catch (e) {
      setError('Search failed. Make sure documents are uploaded and indexed.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => { if (e.key === 'Enter') handleSearch(); };

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">🔍 AI-Powered Search</h1>
        <p className="page-subtitle">Semantic search using sentence embeddings + FAISS vector index</p>
      </div>

      <div className="card">
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
          <div style={{ flex: 1 }}>
            <label className="form-label">Search Query</label>
            <input
              className="form-control"
              placeholder="e.g. What is the leave policy? How do I request reimbursement?"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
            />
          </div>
          <div style={{ width: 120 }}>
            <label className="form-label">Top Results</label>
            <select className="form-control" value={topK} onChange={(e) => setTopK(Number(e.target.value))}>
              {[3, 5, 10].map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
          <button className="btn btn-primary" onClick={handleSearch} disabled={loading || !query.trim()} style={{ height: 38 }}>
            {loading ? 'Searching…' : 'Search'}
          </button>
        </div>

        <div style={{ marginTop: 12, fontSize: 13, color: '#9ca3af', display: 'flex', gap: 20 }}>
          <span>🧠 Model: all-MiniLM-L6-v2 (local)</span>
          <span>📦 Vector DB: FAISS (in-process)</span>
          <span>📐 Embeddings: 384-dim cosine similarity</span>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {results !== null && (
        <div>
          <div style={{ marginBottom: 16, fontSize: 14, color: '#6b7280' }}>
            {results.length === 0
              ? `No results found for "${searched}"`
              : `${results.length} result${results.length !== 1 ? 's' : ''} for "${searched}"`}
          </div>
          {results.map((r, i) => (
            <div key={i} className="search-result">
              <div className="search-result-title">📄 {r.title}</div>
              <div className="search-result-snippet">{r.snippet}</div>
              <div className="search-result-meta">
                Document #{r.document_id} &nbsp;·&nbsp;
                Relevance:
                <span
                  className="score-bar"
                  style={{ width: `${Math.round(r.score * 100)}px` }}
                />
                &nbsp;{(r.score * 100).toFixed(1)}%
              </div>
            </div>
          ))}
        </div>
      )}

      {results === null && !loading && (
        <div className="empty-state">
          <div className="empty-state-icon">🔎</div>
          <p>Enter a natural language query to semantically search documents</p>
        </div>
      )}
    </div>
  );
}
