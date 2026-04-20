import React, { useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Upload, History, LogOut, BrainCircuit,
         MessageSquare, FileText, Wrench, Sun, Moon } from 'lucide-react'

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/bulk', icon: Upload, label: 'Bulk Upload' },
  { to: '/history', icon: History, label: 'History' },
  { to: '/chatbot', icon: MessageSquare, label: 'AI Chatbot' },
  { to: '/resume', icon: FileText, label: 'Resume Analyzer' },
  { to: '/tools', icon: Wrench, label: 'More Tools' },
]

export default function Layout() {
  const navigate = useNavigate()
  const username = localStorage.getItem('username') || 'User'
  const [dark, setDark] = useState(true)

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('username')
    navigate('/login')
  }

  const toggleTheme = () => {
    setDark(!dark)
    document.documentElement.setAttribute('data-theme', dark ? 'light' : 'dark')
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <aside style={{
        width: 230, background: 'var(--bg2)', borderRight: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column', padding: '24px 14px',
        position: 'sticky', top: 0, height: '100vh', flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 32, paddingLeft: 8 }}>
          <div style={{
            width: 34, height: 34, borderRadius: 10,
            background: 'linear-gradient(135deg, var(--accent), var(--accent2))',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <BrainCircuit size={18} color="white" />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.92rem', letterSpacing: '-0.02em' }}>PlaceAI</div>
            <div style={{ fontSize: '0.65rem', color: 'var(--text3)', fontFamily: 'var(--font-mono)' }}>v2.0</div>
          </div>
        </div>

        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to} style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '9px 12px', borderRadius: 9, textDecoration: 'none',
              fontWeight: 500, fontSize: '0.87rem', transition: 'all 0.15s',
              background: isActive ? 'rgba(124,106,255,0.12)' : 'transparent',
              color: isActive ? 'var(--accent2)' : 'var(--text2)',
              borderLeft: isActive ? '2px solid var(--accent)' : '2px solid transparent',
            })}>
              <Icon size={16} />{label}
            </NavLink>
          ))}
        </nav>

        <div style={{ borderTop: '1px solid var(--border)', paddingTop: 14, marginTop: 14 }}>
          <button onClick={toggleTheme} className="btn btn-outline"
            style={{ width: '100%', justifyContent: 'center', marginBottom: 8, padding: '8px' }}>
            {dark ? <Sun size={15} /> : <Moon size={15} />}
            {dark ? 'Light Mode' : 'Dark Mode'}
          </button>
          <div style={{ fontSize: '0.72rem', color: 'var(--text3)', marginBottom: 4, paddingLeft: 4, fontFamily: 'var(--font-mono)' }}>Logged in as</div>
          <div style={{ fontWeight: 600, fontSize: '0.88rem', paddingLeft: 4, marginBottom: 10, color: 'var(--accent2)' }}>{username}</div>
          <button className="btn btn-danger" style={{ width: '100%', justifyContent: 'center' }} onClick={logout}>
            <LogOut size={15} /> Logout
          </button>
        </div>
      </aside>

      <main style={{ flex: 1, padding: '32px', overflowY: 'auto', minWidth: 0 }}>
        <Outlet />
      </main>
    </div>
  )
}
