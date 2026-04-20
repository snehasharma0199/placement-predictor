import React, { Suspense, lazy } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import Layout from './components/Layout'

const Login = lazy(() => import('./pages/Login'))
const Register = lazy(() => import('./pages/Register'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const BulkUpload = lazy(() => import('./pages/BulkUpload'))
const History = lazy(() => import('./pages/History'))
const Chatbot = lazy(() => import('./pages/Chatbot'))
const ResumeAnalyzer = lazy(() => import('./pages/ResumeAnalyzer'))
const Tools = lazy(() => import('./pages/Tools'))

const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('token')
  return token ? children : <Navigate to="/login" replace />
}

const Loader = () => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
    <span className="spinner" style={{ width: 36, height: 36, borderWidth: 3 }} />
  </div>
)

export default function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" toastOptions={{
        style: { background: '#1a1a26', color: '#e8e8f0', border: '1px solid #2a2a40', fontFamily: 'DM Sans, sans-serif' }
      }} />
      <Suspense fallback={<Loader />}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="bulk" element={<BulkUpload />} />
            <Route path="history" element={<History />} />
            <Route path="chatbot" element={<Chatbot />} />
            <Route path="resume" element={<ResumeAnalyzer />} />
            <Route path="tools" element={<Tools />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}
