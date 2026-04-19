import React, { useState } from 'react'
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer,
         LineChart, Line, XAxis, YAxis, Tooltip, Legend } from 'recharts'
import { Sparkles, TrendingUp, AlertTriangle, CheckCircle2, BrainCircuit } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../utils/api'

const IDEAL = { cgpa: 9, internships: 3, aptitude_score: 80, soft_skills: 8, projects: 5 }
const LABELS = ['CGPA', 'Internships', 'Aptitude', 'Soft Skills', 'Projects']

function GaugeArc({ prob }) {
  const angle = (prob / 100) * 180
  const r = 80
  const cx = 110, cy = 100
  const toRad = (deg) => (deg - 180) * Math.PI / 180
  const x = cx + r * Math.cos(toRad(angle))
  const y = cy + r * Math.sin(toRad(angle))
  const color = prob >= 70 ? '#22d3a0' : prob >= 50 ? '#fbbf24' : '#ff4d6d'

  return (
    <svg viewBox="0 0 220 120" style={{ width: '100%', maxWidth: 260 }}>
      <path d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
        fill="none" stroke="#2a2a40" strokeWidth="14" strokeLinecap="round" />
      <path d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${x} ${y}`}
        fill="none" stroke={color} strokeWidth="14" strokeLinecap="round" />
      <text x={cx} y={cy - 10} textAnchor="middle" fill={color}
        style={{ fontSize: 26, fontWeight: 700, fontFamily: 'Space Mono, monospace' }}>
        {prob.toFixed(1)}%
      </text>
      <text x={cx} y={cy + 14} textAnchor="middle" fill="#5a5a7a"
        style={{ fontSize: 11, fontFamily: 'DM Sans, sans-serif' }}>
        Placement Probability
      </text>
    </svg>
  )
}

export default function Dashboard() {
  const username = localStorage.getItem('username') || 'User'
  const [form, setForm] = useState({ cgpa: 7.0, internships: 1, aptitude_score: 60, soft_skills: 6, projects: 2 })
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: parseFloat(e.target.value) || 0 })
  }

  const handlePredict = async () => {
    setLoading(true)
    try {
      const res = await api.post('/api/predict/single', form)
      setResult(res.data)
      toast.success('Prediction complete!')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Prediction failed')
    } finally {
      setLoading(false)
    }
  }

  const radarData = LABELS.map((label, i) => {
    const keys = ['cgpa', 'internships', 'aptitude_score', 'soft_skills', 'projects']
    const maxes = [10, 5, 100, 10, 10]
    const you = (form[keys[i]] / maxes[i]) * 10
    const ideal = (IDEAL[keys[i]] / maxes[i]) * 10
    return { label, You: parseFloat(you.toFixed(1)), Ideal: parseFloat(ideal.toFixed(1)) }
  })

  const lineData = LABELS.map((label, i) => {
    const keys = ['cgpa', 'internships', 'aptitude_score', 'soft_skills', 'projects']
    const maxes = [10, 5, 100, 10, 10]
    return {
      label,
      You: parseFloat(((form[keys[i]] / maxes[i]) * 10).toFixed(1)),
      Ideal: parseFloat(((IDEAL[keys[i]] / maxes[i]) * 10).toFixed(1))
    }
  })

  const fields = [
    { key: 'cgpa', label: 'CGPA', min: 0, max: 10, step: 0.1 },
    { key: 'internships', label: 'Internships', min: 0, max: 10, step: 1 },
    { key: 'aptitude_score', label: 'Aptitude Score (0-100)', min: 0, max: 100, step: 1 },
    { key: 'soft_skills', label: 'Soft Skills (0-10)', min: 0, max: 10, step: 0.5 },
    { key: 'projects', label: 'Projects', min: 0, max: 20, step: 1 },
  ]

  return (
    <div className="page-enter">
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontSize: '0.8rem', color: 'var(--text3)', fontFamily: 'var(--font-mono)', marginBottom: 4 }}>
          WELCOME BACK
        </div>
        <h1 style={{ fontSize: '1.9rem', fontWeight: 700, letterSpacing: '-0.03em' }}>
          Hey, {username} 👋
        </h1>
        <p style={{ color: 'var(--text2)', marginTop: 4 }}>Enter your details to predict placement probability</p>
      </div>

      {/* Input form */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <BrainCircuit size={18} color="var(--accent2)" />
          <span style={{ fontWeight: 600 }}>Student Profile</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
          {fields.map(({ key, label, min, max, step }) => (
            <div className="input-group" key={key}>
              <label>{label}</label>
              <input
                type="number"
                name={key}
                min={min} max={max} step={step}
                value={form[key]}
                onChange={handleChange}
              />
            </div>
          ))}
        </div>

        <button
          className="btn btn-primary"
          style={{ marginTop: 24 }}
          onClick={handlePredict}
          disabled={loading}
        >
          {loading ? <span className="spinner" /> : <><Sparkles size={16} /> Predict Placement</>}
        </button>
      </div>

      {/* Results */}
      {result && (
        <div className="page-enter">
          {/* Prediction result card */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20, marginBottom: 24 }}>

            {/* Gauge */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <GaugeArc prob={result.probability} />
              <div style={{ marginTop: 8 }}>
                <span className={`badge ${result.prediction === 'Placed' ? 'badge-green' : 'badge-red'}`} style={{ fontSize: '1rem', padding: '8px 20px' }}>
                  {result.prediction === 'Placed' ? '✅ ' : '❌ '}{result.prediction}
                </span>
              </div>
            </div>

            {/* Tips */}
            <div className="card">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, fontWeight: 600 }}>
                <TrendingUp size={16} color="var(--accent2)" /> Improvement Tips
              </div>
              {result.tips.length === 0 ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--green)' }}>
                  <CheckCircle2 size={16} /> Strong profile! Keep it up 🔥
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {result.tips.map((tip, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, color: 'var(--text2)', fontSize: '0.9rem' }}>
                      <AlertTriangle size={14} color="var(--yellow)" style={{ marginTop: 3, flexShrink: 0 }} />
                      {tip}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Charts */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
            {/* Radar */}
            <div className="card">
              <div style={{ fontWeight: 600, marginBottom: 16, fontSize: '0.9rem' }}>📡 Skill Radar</div>
              <ResponsiveContainer width="100%" height={250}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#2a2a40" />
                  <PolarAngleAxis dataKey="label" tick={{ fill: '#9898b8', fontSize: 11 }} />
                  <Radar name="You" dataKey="You" stroke="#7c6aff" fill="#7c6aff" fillOpacity={0.25} />
                  <Radar name="Ideal" dataKey="Ideal" stroke="#22d3a0" fill="#22d3a0" fillOpacity={0.1} />
                  <Legend wrapperStyle={{ fontSize: 11, color: '#9898b8' }} />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            {/* Line */}
            <div className="card">
              <div style={{ fontWeight: 600, marginBottom: 16, fontSize: '0.9rem' }}>📈 Profile vs Ideal</div>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={lineData}>
                  <XAxis dataKey="label" tick={{ fill: '#9898b8', fontSize: 10 }} />
                  <YAxis tick={{ fill: '#9898b8', fontSize: 10 }} domain={[0, 10]} />
                  <Tooltip
                    contentStyle={{ background: '#1a1a26', border: '1px solid #2a2a40', borderRadius: 8 }}
                    labelStyle={{ color: '#e8e8f0' }}
                  />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line type="monotone" dataKey="You" stroke="#7c6aff" strokeWidth={2} dot={{ fill: '#7c6aff', r: 4 }} />
                  <Line type="monotone" dataKey="Ideal" stroke="#22d3a0" strokeWidth={2} strokeDasharray="5 5" dot={{ fill: '#22d3a0', r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
