import React, { useState, useEffect, useRef } from 'react'
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer,
         LineChart, Line, XAxis, YAxis, Tooltip, Legend, BarChart, Bar, Cell } from 'recharts'
import { Sparkles, TrendingUp, AlertTriangle, CheckCircle2, BrainCircuit,
         Target, Zap, Award, ChevronRight, Info } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../utils/api'

const IDEAL = { cgpa: 9, internships: 3, aptitude_score: 80, soft_skills: 8, projects: 5 }

// Animated counter hook
function useCountUp(target, duration = 1500, start = false) {
  const [count, setCount] = useState(0)
  useEffect(() => {
    if (!start) return
    let startTime = null
    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp
      const progress = Math.min((timestamp - startTime) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setCount(Math.floor(eased * target))
      if (progress < 1) requestAnimationFrame(animate)
      else setCount(target)
    }
    requestAnimationFrame(animate)
  }, [target, start, duration])
  return count
}

// Animated Progress Bar
function ProgressBar({ value, max, color, label, delay = 0 }) {
  const [width, setWidth] = useState(0)
  const pct = Math.round((value / max) * 100)
  useEffect(() => {
    const t = setTimeout(() => setWidth(pct), delay + 300)
    return () => clearTimeout(t)
  }, [pct, delay])
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
        <span style={{ fontSize: '0.82rem', color: 'var(--text2)', fontWeight: 500 }}>{label}</span>
        <span style={{ fontSize: '0.82rem', fontFamily: 'var(--font-mono)', color }}>
          {value}/{max}
        </span>
      </div>
      <div style={{ height: 8, background: 'var(--bg3)', borderRadius: 99, overflow: 'hidden' }}>
        <div style={{
          height: '100%', width: width + '%', background: color,
          borderRadius: 99, transition: 'width 1s cubic-bezier(0.34, 1.56, 0.64, 1)',
          boxShadow: `0 0 8px ${color}60`
        }} />
      </div>
    </div>
  )
}

// Gauge SVG
function GaugeArc({ prob, animate }) {
  const [displayProb, setDisplayProb] = useState(0)
  useEffect(() => {
    if (!animate) return
    let start = null
    const duration = 1500
    const step = (ts) => {
      if (!start) start = ts
      const p = Math.min((ts - start) / duration, 1)
      const eased = 1 - Math.pow(1 - p, 3)
      setDisplayProb(eased * prob)
      if (p < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }, [prob, animate])

  const r = 80, cx = 110, cy = 105
  const toRad = (deg) => (deg - 180) * Math.PI / 180
  const angle = (displayProb / 100) * 180
  const x = cx + r * Math.cos(toRad(angle))
  const y = cy + r * Math.sin(toRad(angle))
  const color = displayProb >= 70 ? '#22d3a0' : displayProb >= 50 ? '#fbbf24' : '#ff4d6d'
  const label = displayProb >= 70 ? 'High Chance!' : displayProb >= 50 ? 'Moderate' : 'Needs Work'

  return (
    <svg viewBox="0 0 220 130" style={{ width: '100%', maxWidth: 280 }}>
      <path d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
        fill="none" stroke="#2a2a40" strokeWidth="16" strokeLinecap="round" />
      {displayProb > 0 && (
        <path d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${x} ${y}`}
          fill="none" stroke={color} strokeWidth="16" strokeLinecap="round" />
      )}
      <circle cx={x} cy={y} r="6" fill={color} style={{ filter: `drop-shadow(0 0 6px ${color})` }} />
      <text x={cx} y={cy - 12} textAnchor="middle" fill={color}
        style={{ fontSize: 28, fontWeight: 700, fontFamily: 'Space Mono, monospace' }}>
        {Math.round(displayProb)}%
      </text>
      <text x={cx} y={cy + 10} textAnchor="middle" fill="#9898b8"
        style={{ fontSize: 12, fontFamily: 'DM Sans, sans-serif' }}>
        {label}
      </text>
    </svg>
  )
}

// Skill gap card
function SkillGapCard({ label, yours, ideal, max, color, delay }) {
  const gap = ideal - yours
  const pct = Math.round((yours / max) * 100)
  return (
    <div style={{
      background: 'var(--bg3)', borderRadius: 10, padding: '14px 16px',
      border: '1px solid var(--border)',
      animation: `fadeUp 0.4s ease ${delay}ms both`
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{label}</span>
        {gap > 0 ? (
          <span style={{ fontSize: '0.72rem', background: 'rgba(251,191,36,0.15)', color: '#fbbf24', padding: '2px 8px', borderRadius: 99, fontFamily: 'var(--font-mono)' }}>
            +{gap} needed
          </span>
        ) : (
          <span style={{ fontSize: '0.72rem', background: 'rgba(34,211,160,0.15)', color: '#22d3a0', padding: '2px 8px', borderRadius: 99 }}>
            ✓ Good
          </span>
        )}
      </div>
      <ProgressBar value={yours} max={max} color={gap > 0 ? '#fbbf24' : '#22d3a0'} label="" delay={delay} />
      <div style={{ fontSize: '0.75rem', color: 'var(--text3)' }}>
        Ideal: <span style={{ color: 'var(--accent2)' }}>{ideal}/{max}</span>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const username = localStorage.getItem('username') || 'User'
  const [form, setForm] = useState({ cgpa: 7.0, internships: 1, aptitude_score: 60, soft_skills: 6, projects: 2 })
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [showResults, setShowResults] = useState(false)

  const handleChange = (e) => setForm({ ...form, [e.target.name]: parseFloat(e.target.value) || 0 })

  const handlePredict = async () => {
    setLoading(true)
    setShowResults(false)
    try {
      const res = await api.post('/api/predict/single', form)
      setResult(res.data)
      setTimeout(() => setShowResults(true), 100)
      toast.success('Prediction ready!')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Prediction failed')
    } finally {
      setLoading(false)
    }
  }

  const radarData = ['CGPA', 'Internships', 'Aptitude', 'Soft Skills', 'Projects'].map((label, i) => {
    const keys = ['cgpa', 'internships', 'aptitude_score', 'soft_skills', 'projects']
    const maxes = [10, 5, 100, 10, 10]
    return {
      label,
      You: parseFloat(((form[keys[i]] / maxes[i]) * 10).toFixed(1)),
      Ideal: parseFloat(((IDEAL[keys[i]] / maxes[i]) * 10).toFixed(1))
    }
  })

  // Impact analysis
  const impactData = [
    { factor: 'CGPA', impact: Math.round((form.cgpa / 10) * 35), color: '#7c6aff' },
    { factor: 'Internships', impact: Math.round((form.internships / 5) * 25), color: '#22d3a0' },
    { factor: 'Aptitude', impact: Math.round((form.aptitude_score / 100) * 20), color: '#fbbf24' },
    { factor: 'Soft Skills', impact: Math.round((form.soft_skills / 10) * 12), color: '#a78bfa' },
    { factor: 'Projects', impact: Math.round((form.projects / 10) * 8), color: '#ff4d6d' },
  ]

  const fields = [
    { key: 'cgpa', label: 'CGPA', min: 0, max: 10, step: 0.1, icon: '🎓', max_val: 10 },
    { key: 'internships', label: 'Internships', min: 0, max: 10, step: 1, icon: '💼', max_val: 5 },
    { key: 'aptitude_score', label: 'Aptitude Score', min: 0, max: 100, step: 1, icon: '🧠', max_val: 100 },
    { key: 'soft_skills', label: 'Soft Skills (0-10)', min: 0, max: 10, step: 0.5, icon: '💬', max_val: 10 },
    { key: 'projects', label: 'Projects', min: 0, max: 20, step: 1, icon: '🚀', max_val: 10 },
  ]

  return (
    <div className="page-enter">
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: '0.75rem', color: 'var(--text3)', fontFamily: 'var(--font-mono)', marginBottom: 4, letterSpacing: '0.1em' }}>
          PLACEMENT AI DASHBOARD
        </div>
        <h1 style={{ fontSize: '1.9rem', fontWeight: 700, letterSpacing: '-0.03em' }}>
          Hey, {username} 👋
        </h1>
        <p style={{ color: 'var(--text2)', marginTop: 4, fontSize: '0.9rem' }}>
          Fill your profile below to get your AI-powered placement prediction
        </p>
      </div>

      {/* Input Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 20 }}>
        {fields.map(({ key, label, min, max, step, icon, max_val }) => (
          <div key={key} className="card" style={{ padding: '16px', position: 'relative', overflow: 'hidden' }}>
            <div style={{
              position: 'absolute', top: -10, right: -10, fontSize: 40, opacity: 0.08,
              userSelect: 'none', lineHeight: 1
            }}>{icon}</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text3)', fontFamily: 'var(--font-mono)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              {label}
            </div>
            <input
              type="number"
              name={key}
              min={min} max={max} step={step}
              value={form[key]}
              onChange={handleChange}
              style={{
                width: '100%', background: 'var(--bg3)', border: '1px solid var(--border)',
                borderRadius: 8, padding: '10px 12px', color: 'var(--text)',
                fontFamily: 'var(--font-mono)', fontSize: '1.1rem', fontWeight: 700,
                outline: 'none', transition: 'border-color 0.2s'
              }}
              onFocus={e => e.target.style.borderColor = 'var(--accent)'}
              onBlur={e => e.target.style.borderColor = 'var(--border)'}
            />
            <div style={{ marginTop: 8 }}>
              <div style={{ height: 4, background: 'var(--bg3)', borderRadius: 99, overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  width: Math.min((form[key] / max_val) * 100, 100) + '%',
                  background: 'linear-gradient(90deg, var(--accent), var(--accent2))',
                  borderRadius: 99, transition: 'width 0.3s ease'
                }} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <button
        className="btn btn-primary"
        style={{ marginBottom: 32, padding: '14px 32px', fontSize: '1rem' }}
        onClick={handlePredict}
        disabled={loading}
      >
        {loading ? <span className="spinner" /> : <><Zap size={16} /> Predict My Placement</>}
      </button>

      {/* Results */}
      {result && showResults && (
        <div style={{ animation: 'fadeUp 0.5s ease' }}>

          {/* Top row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20, marginBottom: 20 }}>

            {/* Gauge */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 28 }}>
              <GaugeArc prob={result.probability} animate={showResults} />
              <span className={`badge ${result.prediction === 'Placed' ? 'badge-green' : 'badge-red'}`}
                style={{ fontSize: '1rem', padding: '8px 24px', marginTop: 8 }}>
                {result.prediction === 'Placed' ? '✅ Placed' : '❌ Not Placed'}
              </span>
              <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, width: '100%' }}>
                {[
                  { label: 'Probability', value: result.probability + '%', color: 'var(--accent2)' },
                  { label: 'Profile Score', value: Math.round(form.cgpa * 10 + form.internships * 5 + form.aptitude_score * 0.3 + form.soft_skills * 5 + form.projects * 3), color: 'var(--green)' },
                ].map(({ label, value, color }) => (
                  <div key={label} style={{ background: 'var(--bg3)', borderRadius: 8, padding: '10px 12px', textAlign: 'center' }}>
                    <div style={{ fontSize: '1.2rem', fontWeight: 700, color, fontFamily: 'var(--font-mono)' }}>{value}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text3)', marginTop: 2 }}>{label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Why this prediction */}
            <div className="card">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, fontWeight: 600 }}>
                <Info size={16} color="var(--accent2)" /> Why this prediction?
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  { label: 'CGPA', value: form.cgpa, max: 10, weight: '35%', color: '#7c6aff' },
                  { label: 'Internships', value: form.internships, max: 5, weight: '25%', color: '#22d3a0' },
                  { label: 'Aptitude', value: form.aptitude_score, max: 100, weight: '20%', color: '#fbbf24' },
                  { label: 'Soft Skills', value: form.soft_skills, max: 10, weight: '12%', color: '#a78bfa' },
                  { label: 'Projects', value: form.projects, max: 10, weight: '8%', color: '#ff4d6d' },
                ].map(({ label, value, max, weight, color }, i) => (
                  <ProgressBar key={label} label={`${label} (${weight} weightage)`} value={value} max={max} color={color} delay={i * 100} />
                ))}
              </div>
            </div>
          </div>

          {/* Skill Gap Analysis */}
          <div className="card" style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, fontWeight: 600 }}>
              <Target size={16} color="var(--accent2)" /> Skill Gap Analysis
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
              {[
                { label: 'CGPA', key: 'cgpa', max: 10 },
                { label: 'Internships', key: 'internships', max: 5 },
                { label: 'Aptitude', key: 'aptitude_score', max: 100 },
                { label: 'Soft Skills', key: 'soft_skills', max: 10 },
                { label: 'Projects', key: 'projects', max: 10 },
              ].map(({ label, key, max }, i) => (
                <SkillGapCard
                  key={key}
                  label={label}
                  yours={form[key]}
                  ideal={IDEAL[key]}
                  max={max}
                  delay={i * 80}
                />
              ))}
            </div>
          </div>

          {/* Charts row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20, marginBottom: 20 }}>

            {/* Radar */}
            <div className="card">
              <div style={{ fontWeight: 600, marginBottom: 16, fontSize: '0.9rem' }}>📡 Skill Radar</div>
              <ResponsiveContainer width="100%" height={220}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#2a2a40" />
                  <PolarAngleAxis dataKey="label" tick={{ fill: '#9898b8', fontSize: 10 }} />
                  <Radar name="You" dataKey="You" stroke="#7c6aff" fill="#7c6aff" fillOpacity={0.25} />
                  <Radar name="Ideal" dataKey="Ideal" stroke="#22d3a0" fill="#22d3a0" fillOpacity={0.1} />
                  <Legend wrapperStyle={{ fontSize: 11, color: '#9898b8' }} />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            {/* Impact bar chart */}
            <div className="card">
              <div style={{ fontWeight: 600, marginBottom: 16, fontSize: '0.9rem' }}>📊 Factor Impact Score</div>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={impactData} layout="vertical">
                  <XAxis type="number" tick={{ fill: '#9898b8', fontSize: 10 }} domain={[0, 35]} />
                  <YAxis type="category" dataKey="factor" tick={{ fill: '#9898b8', fontSize: 11 }} width={70} />
                  <Tooltip contentStyle={{ background: '#1a1a26', border: '1px solid #2a2a40', borderRadius: 8 }} />
                  <Bar dataKey="impact" radius={[0, 6, 6, 0]}>
                    {impactData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Tips */}
          {result.tips.length > 0 && (
            <div className="card" style={{ borderLeft: '3px solid var(--yellow)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, fontWeight: 600 }}>
                <TrendingUp size={16} color="var(--yellow)" /> Improvement Roadmap
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 10 }}>
                {result.tips.map((tip, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    background: 'var(--bg3)', borderRadius: 8, padding: '10px 12px',
                    animation: `fadeUp 0.4s ease ${i * 100}ms both`
                  }}>
                    <div style={{
                      width: 24, height: 24, borderRadius: '50%',
                      background: 'rgba(251,191,36,0.15)', display: 'flex',
                      alignItems: 'center', justifyContent: 'center', flexShrink: 0
                    }}>
                      <AlertTriangle size={12} color="var(--yellow)" />
                    </div>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text2)' }}>{tip}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {result.tips.length === 0 && (
            <div className="card" style={{ borderLeft: '3px solid var(--green)', display: 'flex', alignItems: 'center', gap: 12 }}>
              <Award size={24} color="var(--green)" />
              <div>
                <div style={{ fontWeight: 600, color: 'var(--green)' }}>Strong Profile! 🔥</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text2)', marginTop: 2 }}>
                  Your profile meets all key placement criteria. Keep it up!
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
