import React, { useEffect, useState } from 'react'
import { Clock, RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../utils/api'

export default function History() {
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchHistory = async () => {
    setLoading(true)
    try {
      const res = await api.get('/api/predict/history')
      setHistory(res.data)
    } catch {
      toast.error('Failed to load history')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchHistory() }, [])

  const formatDate = (ts) => {
    const d = new Date(ts)
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="page-enter">
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 32 }}>
        <div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text3)', fontFamily: 'var(--font-mono)', marginBottom: 4 }}>PAST RECORDS</div>
          <h1 style={{ fontSize: '1.9rem', fontWeight: 700, letterSpacing: '-0.03em' }}>Prediction History</h1>
          <p style={{ color: 'var(--text2)', marginTop: 4 }}>Your last 20 predictions</p>
        </div>
        <button className="btn btn-outline" onClick={fetchHistory} disabled={loading}>
          <RefreshCw size={15} className={loading ? 'spin' : ''} /> Refresh
        </button>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
          <span className="spinner" style={{ width: 36, height: 36, borderWidth: 3 }} />
        </div>
      ) : history.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 60, color: 'var(--text3)' }}>
          <Clock size={40} style={{ marginBottom: 12, opacity: 0.4 }} />
          <div>No predictions yet. Go to Dashboard to make your first prediction!</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {history.map((item, i) => (
            <div key={i} className="card" style={{
              display: 'flex', flexWrap: 'wrap', gap: 20, alignItems: 'center',
              borderLeft: `3px solid ${item.prediction === 'Placed' ? 'var(--green)' : 'var(--red)'}`,
            }}>
              {/* Result badge */}
              <div style={{ minWidth: 100 }}>
                <span className={`badge ${item.prediction === 'Placed' ? 'badge-green' : 'badge-red'}`} style={{ fontSize: '0.85rem', padding: '6px 14px' }}>
                  {item.prediction === 'Placed' ? '✅' : '❌'} {item.prediction}
                </span>
                <div style={{ fontSize: '0.8rem', color: 'var(--accent2)', marginTop: 6, fontFamily: 'var(--font-mono)' }}>
                  {item.probability?.toFixed(1)}%
                </div>
              </div>

              {/* Input stats */}
              <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', flex: 1 }}>
                {[
                  ['CGPA', item.input?.cgpa],
                  ['Internships', item.input?.internships],
                  ['Aptitude', item.input?.aptitude_score],
                  ['Soft Skills', item.input?.soft_skills],
                  ['Projects', item.input?.projects],
                ].map(([label, val]) => (
                  <div key={label}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text3)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase' }}>{label}</div>
                    <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{val ?? '—'}</div>
                  </div>
                ))}
              </div>

              {/* Timestamp */}
              <div style={{ fontSize: '0.78rem', color: 'var(--text3)', display: 'flex', alignItems: 'center', gap: 5 }}>
                <Clock size={12} /> {formatDate(item.timestamp)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
