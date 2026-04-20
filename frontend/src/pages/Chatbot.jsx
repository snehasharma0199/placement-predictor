import React, { useState, useRef, useEffect } from 'react'
import { Send, Bot, User, RotateCcw } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../utils/api'

const SUGGESTIONS = [
  "How can I improve my placement chances?",
  "What skills should a CSE student have?",
  "How to crack HR interviews?",
  "What is the ideal CGPA for top companies?",
  "How to build a strong resume?",
  "What projects should I do to get placed?",
]

export default function Chatbot() {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: "Hi! 👋 I'm PlaceAI Assistant. I can help you with placement preparation, career advice, interview tips, and resume guidance. What would you like to know?" }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async (text) => {
    const userMsg = text || input.trim()
    if (!userMsg) return
    setInput('')
    const newMessages = [...messages, { role: 'user', content: userMsg }]
    setMessages(newMessages)
    setLoading(true)

    try {
      const res = await api.post('/api/ai/chat', {
        messages: newMessages,
        system: `You are PlaceAI Assistant, an expert career counselor specializing in campus placements in India. 
Help students with placement preparation, interview tips, resume advice, and career guidance. 
Be concise, practical and encouraging. Use bullet points when helpful.`
      })
      setMessages(prev => [...prev, { role: 'assistant', content: res.data.reply }])
    } catch (err) {
      toast.error('AI is unavailable right now. Try again!')
      setMessages(prev => [...prev, { role: 'assistant', content: "Sorry, I'm having trouble right now. Please try again in a moment!" }])
    } finally {
      setLoading(false)
    }
  }

  const reset = () => setMessages([{
    role: 'assistant',
    content: "Hi! 👋 I'm PlaceAI Assistant. How can I help you today?"
  }])

  return (
    <div className="page-enter" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 80px)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text3)', fontFamily: 'var(--font-mono)', marginBottom: 4 }}>AI ASSISTANT</div>
          <h1 style={{ fontSize: '1.7rem', fontWeight: 700, letterSpacing: '-0.03em' }}>Placement Chatbot 🤖</h1>
          <p style={{ color: 'var(--text2)', fontSize: '0.88rem', marginTop: 2 }}>Ask anything about placements, interviews, or career advice</p>
        </div>
        <button className="btn btn-outline" onClick={reset} style={{ padding: '8px 14px' }}>
          <RotateCcw size={14} /> Reset
        </button>
      </div>

      <div className="card" style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', padding: 0 }}>
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
          {messages.map((msg, i) => (
            <div key={i} style={{
              display: 'flex', gap: 12, marginBottom: 20,
              flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
              animation: 'fadeUp 0.3s ease'
            }}>
              <div style={{
                width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                background: msg.role === 'user' ? 'var(--accent)' : 'rgba(124,106,255,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                {msg.role === 'user' ? <User size={16} color="white" /> : <Bot size={16} color="var(--accent2)" />}
              </div>
              <div style={{
                maxWidth: '75%', padding: '12px 16px', borderRadius: 12,
                background: msg.role === 'user' ? 'var(--accent)' : 'var(--bg3)',
                borderBottomRightRadius: msg.role === 'user' ? 4 : 12,
                borderBottomLeftRadius: msg.role === 'assistant' ? 4 : 12,
                fontSize: '0.9rem', lineHeight: 1.6,
                color: msg.role === 'user' ? 'white' : 'var(--text)',
                whiteSpace: 'pre-wrap'
              }}>
                {msg.content}
              </div>
            </div>
          ))}

          {loading && (
            <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(124,106,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Bot size={16} color="var(--accent2)" />
              </div>
              <div style={{ background: 'var(--bg3)', padding: '14px 18px', borderRadius: '12px 12px 12px 4px', display: 'flex', gap: 6, alignItems: 'center' }}>
                {[0, 1, 2].map(i => (
                  <div key={i} style={{
                    width: 7, height: 7, borderRadius: '50%', background: 'var(--accent)',
                    animation: `bounce 1s ease ${i * 0.15}s infinite`
                  }} />
                ))}
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {messages.length === 1 && (
          <div style={{ padding: '0 20px 12px', display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {SUGGESTIONS.map((s, i) => (
              <button key={i} onClick={() => sendMessage(s)} style={{
                background: 'var(--bg3)', border: '1px solid var(--border)',
                borderRadius: 99, padding: '6px 12px', fontSize: '0.78rem',
                color: 'var(--text2)', cursor: 'pointer', transition: 'all 0.15s',
                fontFamily: 'var(--font-body)'
              }}
                onMouseEnter={e => { e.target.style.borderColor = 'var(--accent)'; e.target.style.color = 'var(--accent2)' }}
                onMouseLeave={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.color = 'var(--text2)' }}
              >
                {s}
              </button>
            ))}
          </div>
        )}

        <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border)', display: 'flex', gap: 10 }}>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
            placeholder="Ask about placements, interviews, resume..."
            style={{
              flex: 1, background: 'var(--bg3)', border: '1px solid var(--border)',
              borderRadius: 10, padding: '12px 16px', color: 'var(--text)',
              fontFamily: 'var(--font-body)', fontSize: '0.9rem', outline: 'none'
            }}
          />
          <button className="btn btn-primary" onClick={() => sendMessage()} disabled={loading || !input.trim()}>
            <Send size={16} />
          </button>
        </div>
      </div>

      <style>{`@keyframes bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-5px); } }`}</style>
    </div>
  )
}