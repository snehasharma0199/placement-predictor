import React, { useState } from 'react'
import { FileText, Star, AlertTriangle, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../utils/api'

export default function ResumeAnalyzer() {
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)

  const analyze = async () => {
    if (!text.trim()) { toast.error('Please paste your resume text!'); return }
    setLoading(true)
    setResult(null)
    try {
      const res = await api.post('/api/ai/analyze', {
        text: `Analyze this resume:\n\n${text}`,
        task: 'resume'
      })
      setResult(res.data)
      toast.success('Resume analyzed!')
    } catch (err) {
      toast.error('Analysis failed. Try again!')
    } finally {
      setLoading(false)
    }
  }

  const scoreColor = result ? (result.score >= 70 ? 'var(--green)' : result.score >= 50 ? 'var(--yellow)' : 'var(--red)') : 'var(--accent2)'

  return (
    <div className="page-enter">
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: '0.75rem', color: 'var(--text3)', fontFamily: 'var(--font-mono)', marginBottom: 4 }}>AI TOOL</div>
        <h1 style={{ fontSize: '1.7rem', fontWeight: 700, letterSpacing: '-0.03em' }}>Resume Score Analyzer 📄</h1>
        <p style={{ color: 'var(--text2)', fontSize: '0.88rem', marginTop: 2 }}>Paste your resume text and get instant AI feedback</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: result ? '1fr 1fr' : '1fr', gap: 20 }}>
        <div className="card">
          <div style={{ fontWeight: 600, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
            <FileText size={16} color="var(--accent2)" /> Paste Resume Text
          </div>
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Paste your resume content here...

Example:
Name: Sneha Sharma
Education: B.Tech CSE, 7.5 CGPA
Skills: Python, React, Machine Learning
Projects: Placement Predictor AI...
Internships: Data Science Intern at XYZ..."
            style={{
              width: '100%', minHeight: 320, background: 'var(--bg3)',
              border: '1px solid var(--border)', borderRadius: 10,
              padding: '14px', color: 'var(--text)', fontFamily: 'var(--font-body)',
              fontSize: '0.88rem', outline: 'none', resize: 'vertical', lineHeight: 1.6
            }}
          />
          <button className="btn btn-primary" style={{ marginTop: 14, width: '100%', justifyContent: 'center' }}
            onClick={analyze} disabled={loading || !text.trim()}>
            {loading ? <><span className="spinner" /> Analyzing...</> : <><Star size={16} /> Analyze Resume</>}
          </button>
        </div>

        {result && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, animation: 'fadeUp 0.4s ease' }}>
            <div className="card" style={{ textAlign: 'center', borderTop: `3px solid ${scoreColor}` }}>
              <div style={{ fontSize: 56, fontWeight: 700, color: scoreColor, fontFamily: 'var(--font-mono)', lineHeight: 1 }}>{result.score}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text3)', marginTop: 4 }}>Resume Score / 100</div>
              <div style={{ marginTop: 8 }}>
                <span style={{ fontSize: '1.5rem', fontWeight: 700, color: scoreColor }}>Grade: {result.grade}</span>
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text2)', marginTop: 10, lineHeight: 1.5 }}>{result.summary}</p>
            </div>

            <div className="card">
              <div style={{ fontWeight: 600, marginBottom: 10, color: 'var(--green)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <CheckCircle size={15} /> Strengths
              </div>
              {result.strengths?.map((s, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8, fontSize: '0.85rem', color: 'var(--text2)' }}>
                  <span style={{ color: 'var(--green)', flexShrink: 0 }}>✓</span>{s}
                </div>
              ))}
            </div>

            <div className="card">
              <div style={{ fontWeight: 600, marginBottom: 10, color: 'var(--yellow)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <AlertTriangle size={15} /> Improvements
              </div>
              {result.improvements?.map((s, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8, fontSize: '0.85rem', color: 'var(--text2)' }}>
                  <span style={{ color: 'var(--yellow)', flexShrink: 0 }}>→</span>{s}
                </div>
              ))}
            </div>

            {result.keywords_missing?.length > 0 && (
              <div className="card">
                <div style={{ fontWeight: 600, marginBottom: 10, color: 'var(--red)', fontSize: '0.9rem' }}>🔑 Missing Keywords</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {result.keywords_missing.map((kw, i) => <span key={i} className="badge badge-red">{kw}</span>)}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}