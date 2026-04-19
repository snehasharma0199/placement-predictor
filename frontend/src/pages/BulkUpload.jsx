import React, { useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { Upload, Download, FileText, Users } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../utils/api'

export default function BulkUpload() {
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [threshold, setThreshold] = useState(70)

  const handleFile = (e) => {
    const f = e.target.files[0]
    if (f && f.name.endsWith('.csv')) setFile(f)
    else toast.error('Please upload a CSV file')
  }

  const handlePredict = async () => {
    if (!file) { toast.error('Please select a CSV file'); return }
    setLoading(true)
    const formData = new FormData()
    formData.append('file', file)
    try {
      const res = await api.post('/api/predict/bulk', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      setResult(res.data)
      toast.success(`Predicted ${res.data.total} students!`)
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Bulk prediction failed')
    } finally {
      setLoading(false)
    }
  }

  const downloadCSV = () => {
    if (!result) return
    const headers = Object.keys(result.results[0]).join(',')
    const rows = result.results.map(r => Object.values(r).join(',')).join('\n')
    const blob = new Blob([headers + '\n' + rows], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'placement_predictions.csv'
    a.click()
  }

  const probBuckets = result ? (() => {
    const buckets = { 'Low (0-40%)': 0, 'Average (40-60%)': 0, 'Good (60-80%)': 0, 'High (80-100%)': 0 }
    result.results.forEach(r => {
      const p = r.Probability
      if (p < 40) buckets['Low (0-40%)']++
      else if (p < 60) buckets['Average (40-60%)']++
      else if (p < 80) buckets['Good (60-80%)']++
      else buckets['High (80-100%)']++
    })
    return Object.entries(buckets).map(([name, value]) => ({ name, value }))
  })() : []

  const filtered = result ? result.results.filter(r => r.Probability >= threshold) : []

  return (
    <div className="page-enter">
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontSize: '0.8rem', color: 'var(--text3)', fontFamily: 'var(--font-mono)', marginBottom: 4 }}>BULK ANALYSIS</div>
        <h1 style={{ fontSize: '1.9rem', fontWeight: 700, letterSpacing: '-0.03em' }}>Bulk Prediction</h1>
        <p style={{ color: 'var(--text2)', marginTop: 4 }}>Upload a CSV to predict placement for multiple students</p>
      </div>

      {/* CSV Format hint */}
      <div className="card" style={{ marginBottom: 20, borderColor: 'rgba(124,106,255,0.3)', background: 'rgba(124,106,255,0.05)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, fontWeight: 600, color: 'var(--accent2)' }}>
          <FileText size={16} /> Required CSV Columns
        </div>
        <code style={{ fontSize: '0.82rem', color: 'var(--text2)', fontFamily: 'var(--font-mono)' }}>
          CGPA, Internships, Aptitude_Test_Score, Soft_Skills_Rating, Projects
        </code>
      </div>

      {/* Upload */}
      <div className="card" style={{ marginBottom: 24 }}>
        <label style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
          padding: 40, border: '2px dashed var(--border)', borderRadius: 10,
          cursor: 'pointer', transition: 'border-color 0.2s',
        }}
          onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'}
          onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
        >
          <Upload size={32} color="var(--text3)" />
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontWeight: 600 }}>{file ? file.name : 'Click to upload CSV'}</div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text3)', marginTop: 4 }}>
              {file ? `${(file.size / 1024).toFixed(1)} KB` : 'CSV files only'}
            </div>
          </div>
          <input type="file" accept=".csv" onChange={handleFile} style={{ display: 'none' }} />
        </label>

        <button
          className="btn btn-primary"
          style={{ marginTop: 20 }}
          onClick={handlePredict}
          disabled={loading || !file}
        >
          {loading ? <span className="spinner" /> : <><Sparkles size={16} /> Run Predictions</>}
        </button>
      </div>

      {result && (
        <div className="page-enter">
          {/* Summary */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 16, marginBottom: 24 }}>
            {[
              { label: 'Total Students', value: result.total, color: 'var(--accent2)' },
              { label: 'Placed', value: result.placed, color: 'var(--green)' },
              { label: 'Not Placed', value: result.not_placed, color: 'var(--red)' },
              { label: 'Placement Rate', value: `${((result.placed / result.total) * 100).toFixed(1)}%`, color: 'var(--yellow)' },
            ].map(({ label, value, color }) => (
              <div key={label} className="card" style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.8rem', fontWeight: 700, color, fontFamily: 'var(--font-mono)' }}>{value}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text3)', marginTop: 4 }}>{label}</div>
              </div>
            ))}
          </div>

          {/* Bar chart */}
          <div className="card" style={{ marginBottom: 24 }}>
            <div style={{ fontWeight: 600, marginBottom: 16, fontSize: '0.9rem' }}>🎯 Probability Distribution</div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={probBuckets}>
                <XAxis dataKey="name" tick={{ fill: '#9898b8', fontSize: 11 }} />
                <YAxis tick={{ fill: '#9898b8', fontSize: 11 }} />
                <Tooltip contentStyle={{ background: '#1a1a26', border: '1px solid #2a2a40', borderRadius: 8 }} />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {probBuckets.map((entry, i) => (
                    <Cell key={i} fill={['#ff4d6d', '#fbbf24', '#7c6aff', '#22d3a0'][i]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Top 5 */}
          <div className="card" style={{ marginBottom: 24 }}>
            <div style={{ fontWeight: 600, marginBottom: 16, fontSize: '0.9rem' }}>🏆 Top 5 Candidates</div>
            <div style={{ overflowX: 'auto' }}>
              <table>
                <thead>
                  <tr>
                    <th>Rank</th><th>CGPA</th><th>Internships</th><th>Aptitude</th><th>Soft Skills</th><th>Projects</th><th>Probability</th><th>Result</th>
                  </tr>
                </thead>
                <tbody>
                  {[...result.results].sort((a, b) => a.Rank - b.Rank).slice(0, 5).map((r, i) => (
                    <tr key={i}>
                      <td><span className="badge badge-purple">#{r.Rank}</span></td>
                      <td>{r.CGPA}</td><td>{r.Internships}</td>
                      <td>{r.Aptitude_Test_Score}</td><td>{r.Soft_Skills_Rating}</td><td>{r.Projects}</td>
                      <td><span style={{ color: 'var(--green)', fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>{r.Probability}%</span></td>
                      <td><span className={`badge ${r.Prediction === 'Placed' ? 'badge-green' : 'badge-red'}`}>{r.Prediction}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Threshold filter */}
          <div className="card" style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                <Users size={16} style={{ display: 'inline', marginRight: 6 }} />
                Filter by Probability ≥ {threshold}%
                <span className="badge badge-purple" style={{ marginLeft: 10 }}>{filtered.length} students</span>
              </div>
              <input
                type="range" min={0} max={100} value={threshold}
                onChange={e => setThreshold(Number(e.target.value))}
                style={{ width: 140, accentColor: 'var(--accent)' }}
              />
            </div>
            <div style={{ overflowX: 'auto', maxHeight: 300, overflowY: 'auto' }}>
              <table>
                <thead>
                  <tr><th>CGPA</th><th>Internships</th><th>Aptitude</th><th>Soft Skills</th><th>Projects</th><th>Probability</th><th>Result</th></tr>
                </thead>
                <tbody>
                  {filtered.map((r, i) => (
                    <tr key={i}>
                      <td>{r.CGPA}</td><td>{r.Internships}</td>
                      <td>{r.Aptitude_Test_Score}</td><td>{r.Soft_Skills_Rating}</td><td>{r.Projects}</td>
                      <td><span style={{ color: 'var(--green)', fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>{r.Probability}%</span></td>
                      <td><span className={`badge ${r.Prediction === 'Placed' ? 'badge-green' : 'badge-red'}`}>{r.Prediction}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Download */}
          <button className="btn btn-outline" onClick={downloadCSV}>
            <Download size={16} /> Download Results CSV
          </button>
        </div>
      )}
    </div>
  )
}

// Missing import fix
function Sparkles({ size }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3z"/><path d="M5 17l.75 2.25L8 20l-2.25.75L5 23l-.75-2.25L2 20l2.25-.75L5 17z"/></svg>
}
