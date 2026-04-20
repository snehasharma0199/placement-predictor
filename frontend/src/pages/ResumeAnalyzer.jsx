import React, { useState } from 'react'
import { Upload, FileText, Star, AlertTriangle, CheckCircle, Download } from 'lucide-react'

export default function ResumeAnalyzer() {
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)

  const analyze = async () => {
    if (!text.trim()) return
    setLoading(true)
    setResult(null)

    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          system: `You are a professional resume reviewer for Indian campus placements. 
Analyze the resume text and return ONLY a JSON object with this exact structure:
{
  "score": <number 0-100>,
  "grade": "<A/B/C/D>",
  "strengths": ["<point1>", "<point2>", "<point3>"],
  "improvements": ["<point1>", "<point2>", "<point3>"],
  "keywords_missing": ["<keyword1>", "<keyword2>", "<keyword3>"],
  "summary": "<2 sentence overall feedback>"
}
Return ONLY the JSON, no other text.`,
          messages: [{ role: 'user', content: `Analyze this resume:\n\n${text}` }]
        })
      })

      const data = await res.json()
      const raw = data.content?.[0]?.text || '{}'
      const clean = raw.replace(/```json|```/g, '').trim()
      setResult(JSON.parse(clean))
    } catch (err) {
      setResult({ score: 0, grade: 'N/A', strengths: [], improvements: ['Could not analyze. Please try again.'], keywords_missing: [], summary: 'Analysis failed.' })
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
        {/* Input */}
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
Projects: Placement Predictor AI - Built a full stack ML app...
Internships: Data Science Intern at XYZ Company..."
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

        {/* Results */}
        {result && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, animation: 'fadeUp 0.4s ease' }}>

            {/* Score card */}
            <div className="card" style={{ textAlign: 'center', borderTop: `3px solid ${scoreColor}` }}>
              <div style={{ fontSize: 56, fontWeight: 700, color: scoreColor, fontFamily: 'var(--font-mono)', lineHeight: 1 }}>
                {result.score}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text3)', marginTop: 4 }}>Resume Score / 100</div>
              <div style={{ marginTop: 8 }}>
                <span style={{ fontSize: '1.5rem', fontWeight: 700, color: scoreColor }}>Grade: {result.grade}</span>
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text2)', marginTop: 10, lineHeight: 1.5 }}>{result.summary}</p>
            </div>

            {/* Strengths */}
            <div className="card">
              <div style={{ fontWeight: 600, marginBottom: 10, color: 'var(--green)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <CheckCircle size={15} /> Strengths
              </div>
              {result.strengths?.map((s, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 8, fontSize: '0.85rem', color: 'var(--text2)' }}>
                  <span style={{ color: 'var(--green)', marginTop: 1, flexShrink: 0 }}>✓</span>{s}
                </div>
              ))}
            </div>

            {/* Improvements */}
            <div className="card">
              <div style={{ fontWeight: 600, marginBottom: 10, color: 'var(--yellow)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <AlertTriangle size={15} /> Improvements
              </div>
              {result.improvements?.map((s, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 8, fontSize: '0.85rem', color: 'var(--text2)' }}>
                  <span style={{ color: 'var(--yellow)', marginTop: 1, flexShrink: 0 }}>→</span>{s}
                </div>
              ))}
            </div>

            {/* Missing Keywords */}
            {result.keywords_missing?.length > 0 && (
              <div className="card">
                <div style={{ fontWeight: 600, marginBottom: 10, color: 'var(--red)', fontSize: '0.9rem' }}>
                  🔑 Missing Keywords
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {result.keywords_missing.map((kw, i) => (
                    <span key={i} className="badge badge-red">{kw}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
