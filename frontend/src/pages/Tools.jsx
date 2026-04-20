import React, { useState } from 'react'
import { Mic, DollarSign, Lightbulb, ChevronRight, Star } from 'lucide-react'

// --- Interview Readiness Checker ---
function InterviewChecker() {
  const [answers, setAnswers] = useState({})
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)

  const questions = [
    { id: 'dsa', label: 'DSA & Coding (Arrays, Trees, DP)' },
    { id: 'os', label: 'OS, DBMS, CN concepts' },
    { id: 'project', label: 'Can explain your projects confidently' },
    { id: 'hr', label: 'HR questions (Tell me about yourself, strengths/weaknesses)' },
    { id: 'aptitude', label: 'Aptitude & Logical Reasoning' },
    { id: 'communication', label: 'English communication skills' },
    { id: 'resume', label: 'Resume is up to date and clean' },
    { id: 'mock', label: 'Given mock interviews before' },
  ]

  const analyze = async () => {
    setLoading(true)
    try {
      const summary = questions.map(q => `${q.label}: ${answers[q.id] || 'Not Ready'}`).join('\n')
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 800,
          system: `You are an interview coach. Return ONLY JSON:
{
  "readiness_score": <0-100>,
  "level": "<Ready/Almost Ready/Needs Preparation>",
  "top_focus": ["<area1>", "<area2>", "<area3>"],
  "tips": ["<tip1>", "<tip2>", "<tip3>"],
  "message": "<motivational 1-2 sentence message>"
}`,
          messages: [{ role: 'user', content: `Student's interview readiness:\n${summary}` }]
        })
      })
      const data = await res.json()
      const clean = data.content?.[0]?.text?.replace(/```json|```/g, '').trim()
      setResult(JSON.parse(clean))
    } catch { setResult({ readiness_score: 50, level: 'Needs Preparation', top_focus: [], tips: ['Try again'], message: 'Keep preparing!' }) }
    finally { setLoading(false) }
  }

  const options = ['Not Started', 'Beginner', 'Intermediate', 'Confident']
  const colors = { 'Not Started': 'var(--red)', 'Beginner': 'var(--yellow)', 'Intermediate': 'var(--accent2)', 'Confident': 'var(--green)' }

  return (
    <div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
        {questions.map(q => (
          <div key={q.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text2)', flex: 1 }}>{q.label}</span>
            <div style={{ display: 'flex', gap: 6 }}>
              {options.map(opt => (
                <button key={opt} onClick={() => setAnswers({ ...answers, [q.id]: opt })}
                  style={{
                    padding: '4px 10px', borderRadius: 6, fontSize: '0.72rem', cursor: 'pointer',
                    border: '1px solid', fontFamily: 'var(--font-body)',
                    borderColor: answers[q.id] === opt ? colors[opt] : 'var(--border)',
                    background: answers[q.id] === opt ? `${colors[opt]}20` : 'transparent',
                    color: answers[q.id] === opt ? colors[opt] : 'var(--text3)',
                    transition: 'all 0.15s'
                  }}>
                  {opt}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <button className="btn btn-primary" onClick={analyze} disabled={loading} style={{ marginBottom: 16 }}>
        {loading ? <span className="spinner" /> : <><Mic size={15} /> Check Readiness</>}
      </button>

      {result && (
        <div style={{ animation: 'fadeUp 0.4s ease' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            <div style={{ background: 'var(--bg3)', borderRadius: 10, padding: 16, textAlign: 'center' }}>
              <div style={{ fontSize: 40, fontWeight: 700, color: 'var(--accent2)', fontFamily: 'var(--font-mono)' }}>{result.readiness_score}%</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text3)' }}>Readiness Score</div>
            </div>
            <div style={{ background: 'var(--bg3)', borderRadius: 10, padding: 16, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <div style={{ fontWeight: 600, color: result.level === 'Ready' ? 'var(--green)' : result.level === 'Almost Ready' ? 'var(--yellow)' : 'var(--red)' }}>
                {result.level}
              </div>
              <p style={{ fontSize: '0.82rem', color: 'var(--text2)', marginTop: 6, lineHeight: 1.4 }}>{result.message}</p>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div style={{ background: 'var(--bg3)', borderRadius: 10, padding: 14 }}>
              <div style={{ fontWeight: 600, marginBottom: 8, fontSize: '0.85rem', color: 'var(--red)' }}>🎯 Focus Areas</div>
              {result.top_focus?.map((f, i) => <div key={i} style={{ fontSize: '0.82rem', color: 'var(--text2)', marginBottom: 4 }}>• {f}</div>)}
            </div>
            <div style={{ background: 'var(--bg3)', borderRadius: 10, padding: 14 }}>
              <div style={{ fontWeight: 600, marginBottom: 8, fontSize: '0.85rem', color: 'var(--green)' }}>💡 Quick Tips</div>
              {result.tips?.map((t, i) => <div key={i} style={{ fontSize: '0.82rem', color: 'var(--text2)', marginBottom: 4 }}>• {t}</div>)}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// --- Package Predictor ---
function PackagePredictor() {
  const [form, setForm] = useState({ cgpa: 7.5, college_tier: 'Tier 2', branch: 'CSE', internships: 1, skills: '', projects: 2 })
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)

  const predict = async () => {
    setLoading(true)
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 600,
          system: `You are a salary prediction expert for Indian IT campus placements. Return ONLY JSON:
{
  "min_package": "<X LPA>",
  "max_package": "<Y LPA>",
  "expected_package": "<Z LPA>",
  "companies": ["<company1>", "<company2>", "<company3>"],
  "tips_to_increase": ["<tip1>", "<tip2>"]
}`,
          messages: [{ role: 'user', content: `Predict package for: ${JSON.stringify(form)}` }]
        })
      })
      const data = await res.json()
      const clean = data.content?.[0]?.text?.replace(/```json|```/g, '').trim()
      setResult(JSON.parse(clean))
    } catch { setResult(null) }
    finally { setLoading(false) }
  }

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 16 }}>
        {[
          { key: 'cgpa', label: 'CGPA', type: 'number', min: 0, max: 10, step: 0.1 },
          { key: 'projects', label: 'Projects', type: 'number', min: 0, max: 20, step: 1 },
          { key: 'internships', label: 'Internships', type: 'number', min: 0, max: 10, step: 1 },
        ].map(f => (
          <div className="input-group" key={f.key}>
            <label>{f.label}</label>
            <input type={f.type} name={f.key} min={f.min} max={f.max} step={f.step}
              value={form[f.key]} onChange={e => setForm({ ...form, [f.key]: e.target.value })} />
          </div>
        ))}
        <div className="input-group">
          <label>College Tier</label>
          <select value={form.college_tier} onChange={e => setForm({ ...form, college_tier: e.target.value })}
            style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 8, padding: '12px 16px', color: 'var(--text)', fontFamily: 'var(--font-body)', fontSize: '0.95rem', outline: 'none' }}>
            {['IIT/NIT', 'Tier 1', 'Tier 2', 'Tier 3'].map(t => <option key={t}>{t}</option>)}
          </select>
        </div>
        <div className="input-group">
          <label>Branch</label>
          <select value={form.branch} onChange={e => setForm({ ...form, branch: e.target.value })}
            style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 8, padding: '12px 16px', color: 'var(--text)', fontFamily: 'var(--font-body)', fontSize: '0.95rem', outline: 'none' }}>
            {['CSE', 'IT', 'ECE', 'EEE', 'ME', 'CE'].map(b => <option key={b}>{b}</option>)}
          </select>
        </div>
      </div>
      <div className="input-group" style={{ marginBottom: 16 }}>
        <label>Key Skills (comma separated)</label>
        <input value={form.skills} onChange={e => setForm({ ...form, skills: e.target.value })} placeholder="Python, React, ML, DSA..." />
      </div>

      <button className="btn btn-primary" onClick={predict} disabled={loading} style={{ marginBottom: 16 }}>
        {loading ? <span className="spinner" /> : <><DollarSign size={15} /> Predict Package</>}
      </button>

      {result && (
        <div style={{ animation: 'fadeUp 0.4s ease' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 12 }}>
            {[
              { label: 'Min Package', value: result.min_package, color: 'var(--red)' },
              { label: 'Expected', value: result.expected_package, color: 'var(--green)' },
              { label: 'Max Package', value: result.max_package, color: 'var(--accent2)' },
            ].map(({ label, value, color }) => (
              <div key={label} style={{ background: 'var(--bg3)', borderRadius: 10, padding: 14, textAlign: 'center' }}>
                <div style={{ fontSize: '1.3rem', fontWeight: 700, color, fontFamily: 'var(--font-mono)' }}>{value}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text3)', marginTop: 4 }}>{label}</div>
              </div>
            ))}
          </div>
          <div style={{ background: 'var(--bg3)', borderRadius: 10, padding: 14, marginBottom: 10 }}>
            <div style={{ fontWeight: 600, marginBottom: 8, fontSize: '0.85rem' }}>🏢 Target Companies</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {result.companies?.map((c, i) => <span key={i} className="badge badge-purple">{c}</span>)}
            </div>
          </div>
          <div style={{ background: 'var(--bg3)', borderRadius: 10, padding: 14 }}>
            <div style={{ fontWeight: 600, marginBottom: 8, fontSize: '0.85rem', color: 'var(--green)' }}>💡 To Increase Package</div>
            {result.tips_to_increase?.map((t, i) => <div key={i} style={{ fontSize: '0.82rem', color: 'var(--text2)', marginBottom: 4 }}>• {t}</div>)}
          </div>
        </div>
      )}
    </div>
  )
}

// --- Skill Recommendations ---
function SkillRecommender() {
  const [branch, setBranch] = useState('CSE')
  const [goal, setGoal] = useState('Software Developer')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)

  const getRecommendations = async () => {
    setLoading(true)
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 800,
          system: `Return ONLY JSON skill roadmap:
{
  "must_have": ["<skill1>", "<skill2>", "<skill3>", "<skill4>"],
  "good_to_have": ["<skill1>", "<skill2>", "<skill3>"],
  "projects_to_build": ["<project1>", "<project2>", "<project3>"],
  "certifications": ["<cert1>", "<cert2>"],
  "timeline": "<X months roadmap summary>"
}`,
          messages: [{ role: 'user', content: `Skills for ${branch} student targeting ${goal} role in India` }]
        })
      })
      const data = await res.json()
      const clean = data.content?.[0]?.text?.replace(/```json|```/g, '').trim()
      setResult(JSON.parse(clean))
    } catch { setResult(null) }
    finally { setLoading(false) }
  }

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
        <div className="input-group">
          <label>Your Branch</label>
          <select value={branch} onChange={e => setBranch(e.target.value)}
            style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 8, padding: '12px 16px', color: 'var(--text)', fontFamily: 'var(--font-body)', fontSize: '0.95rem', outline: 'none' }}>
            {['CSE', 'IT', 'ECE', 'EEE', 'ME', 'CE', 'MCA', 'BCA'].map(b => <option key={b}>{b}</option>)}
          </select>
        </div>
        <div className="input-group">
          <label>Target Role</label>
          <select value={goal} onChange={e => setGoal(e.target.value)}
            style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 8, padding: '12px 16px', color: 'var(--text)', fontFamily: 'var(--font-body)', fontSize: '0.95rem', outline: 'none' }}>
            {['Software Developer', 'Data Scientist', 'ML Engineer', 'DevOps Engineer', 'Full Stack Developer', 'Cybersecurity Analyst', 'Cloud Engineer'].map(r => <option key={r}>{r}</option>)}
          </select>
        </div>
      </div>

      <button className="btn btn-primary" onClick={getRecommendations} disabled={loading} style={{ marginBottom: 16 }}>
        {loading ? <span className="spinner" /> : <><Lightbulb size={15} /> Get Roadmap</>}
      </button>

      {result && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, animation: 'fadeUp 0.4s ease' }}>
          <div style={{ background: 'var(--bg3)', borderRadius: 10, padding: 14 }}>
            <div style={{ fontWeight: 600, marginBottom: 8, fontSize: '0.85rem', color: 'var(--accent2)' }}>⭐ Must Have Skills</div>
            {result.must_have?.map((s, i) => <div key={i} className="badge badge-purple" style={{ display: 'block', marginBottom: 6, textAlign: 'center' }}>{s}</div>)}
          </div>
          <div style={{ background: 'var(--bg3)', borderRadius: 10, padding: 14 }}>
            <div style={{ fontWeight: 600, marginBottom: 8, fontSize: '0.85rem', color: 'var(--green)' }}>✨ Good to Have</div>
            {result.good_to_have?.map((s, i) => <div key={i} className="badge badge-green" style={{ display: 'block', marginBottom: 6, textAlign: 'center' }}>{s}</div>)}
          </div>
          <div style={{ background: 'var(--bg3)', borderRadius: 10, padding: 14 }}>
            <div style={{ fontWeight: 600, marginBottom: 8, fontSize: '0.85rem', color: 'var(--yellow)' }}>🚀 Projects to Build</div>
            {result.projects_to_build?.map((p, i) => <div key={i} style={{ fontSize: '0.82rem', color: 'var(--text2)', marginBottom: 6 }}>• {p}</div>)}
          </div>
          <div style={{ background: 'var(--bg3)', borderRadius: 10, padding: 14 }}>
            <div style={{ fontWeight: 600, marginBottom: 8, fontSize: '0.85rem', color: 'var(--red)' }}>📜 Certifications</div>
            {result.certifications?.map((c, i) => <div key={i} style={{ fontSize: '0.82rem', color: 'var(--text2)', marginBottom: 6 }}>• {c}</div>)}
            {result.timeline && (
              <div style={{ marginTop: 10, padding: '8px 10px', background: 'rgba(124,106,255,0.1)', borderRadius: 8, fontSize: '0.8rem', color: 'var(--accent2)' }}>
                ⏱ {result.timeline}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// --- Main Tools Page ---
const TOOLS = [
  { id: 'interview', icon: '🎤', label: 'Interview Readiness', desc: 'Check how prepared you are', component: InterviewChecker },
  { id: 'package', icon: '💰', label: 'Package Predictor', desc: 'Estimate your salary range', component: PackagePredictor },
  { id: 'skills', icon: '🤖', label: 'Skill Recommendations', desc: 'Get your learning roadmap', component: SkillRecommender },
]

export default function Tools() {
  const [active, setActive] = useState('interview')
  const ActiveComponent = TOOLS.find(t => t.id === active)?.component

  return (
    <div className="page-enter">
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: '0.75rem', color: 'var(--text3)', fontFamily: 'var(--font-mono)', marginBottom: 4 }}>AI TOOLS</div>
        <h1 style={{ fontSize: '1.7rem', fontWeight: 700, letterSpacing: '-0.03em' }}>More AI Tools 🧰</h1>
        <p style={{ color: 'var(--text2)', fontSize: '0.88rem', marginTop: 2 }}>Powerful tools to boost your placement preparation</p>
      </div>

      {/* Tool tabs */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        {TOOLS.map(t => (
          <button key={t.id} onClick={() => setActive(t.id)} style={{
            display: 'flex', alignItems: 'center', gap: 10, padding: '12px 18px',
            borderRadius: 12, border: '1px solid', cursor: 'pointer',
            borderColor: active === t.id ? 'var(--accent)' : 'var(--border)',
            background: active === t.id ? 'rgba(124,106,255,0.12)' : 'var(--bg2)',
            color: active === t.id ? 'var(--accent2)' : 'var(--text2)',
            fontFamily: 'var(--font-body)', fontWeight: 500, fontSize: '0.9rem',
            transition: 'all 0.15s'
          }}>
            <span>{t.icon}</span>
            <div style={{ textAlign: 'left' }}>
              <div>{t.label}</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text3)', marginTop: 1 }}>{t.desc}</div>
            </div>
          </button>
        ))}
      </div>

      <div className="card">
        {ActiveComponent && <ActiveComponent />}
      </div>
    </div>
  )
}
