import React, { useState } from 'react'
import { Shield, Lock, Mail, ArrowRight, CheckCircle2, Terminal } from 'lucide-react'

export function LoginPage({ onLoginSuccess }: { onLoginSuccess: (email: string) => void }) {
  const [email, setEmail] = useState('admin@i4c.gov.in')
  const [password, setPassword] = useState('cryptotrace')
  const [shake, setShake] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrorMsg('')

    setTimeout(() => {
      // Mock / Auth verification
      if (email.trim() && password === 'cryptotrace') {
        onLoginSuccess(email)
      } else {
        setShake(true)
        setErrorMsg('Invalid credentials. (Hint: password is "cryptotrace")')
        setTimeout(() => setShake(false), 500)
        setLoading(false)
      }
    }, 600)
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1.5rem',
      position: 'relative',
      zIndex: 1,
    }}>
      <div style={{
        width: '100%',
        maxWidth: '1120px',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        borderRadius: '16px',
        overflow: 'hidden',
        border: '1px solid var(--surface-card-border)',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
        backgroundColor: 'var(--surface-card)',
        backdropFilter: 'var(--glass-blur)',
      }}>
        {/* Left Side: 60% Animated Crypto Graphic */}
        <div style={{
          padding: '3rem 2.5rem',
          background: 'linear-gradient(135deg, rgba(4, 5, 8, 0.95) 0%, rgba(13, 17, 26, 0.85) 100%)',
          borderRight: '1px solid var(--surface-card-border)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* Subtle Grid / Orbit Area */}
          <div style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: 0.35,
            pointerEvents: 'none',
          }}>
            {/* Orbit rings */}
            <div style={{
              width: '320px',
              height: '320px',
              borderRadius: '50%',
              border: '1px dashed #00F2FE',
              animation: 'spin 30s linear infinite',
            }} />
            <div style={{
              position: 'absolute',
              width: '200px',
              height: '200px',
              borderRadius: '50%',
              border: '1px dotted #4FACFE',
              animation: 'spin 18s linear infinite reverse',
            }} />
          </div>

          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.5rem' }}>
              <div style={{
                background: 'var(--primary-gradient)',
                padding: '0.5rem',
                borderRadius: '8px',
                color: '#040508',
                display: 'flex',
              }}>
                <Shield size={24} />
              </div>
              <span style={{
                fontFamily: 'var(--font-heading)',
                fontSize: '1.4rem',
                fontWeight: 700,
                letterSpacing: '-0.02em',
              }}>
                Crypto<span style={{ color: 'var(--primary)' }}>Trace</span>
              </span>
              <span className="badge badge-medium" style={{ marginLeft: '0.5rem' }}>I4C FORENSICS</span>
            </div>

            <h2 style={{
              fontSize: '2rem',
              fontWeight: 700,
              lineHeight: 1.2,
              marginBottom: '1rem',
              color: 'var(--text-primary)',
            }}>
              Decentralized Fraud Attribution & Asset Tracking System
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.6, maxWidth: '440px' }}>
              Real-time multi-chain forensics engine engineered for law enforcement, AML compliance officers, and cyber cell investigators.
            </p>
          </div>

          {/* Floating crypto orbit nodes preview */}
          <div style={{ margin: '2rem 0', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <div className="glass-panel" style={{ padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <span style={{ color: '#F7931A', fontWeight: 700, fontSize: '1.1rem' }}>₿</span>
              <div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>BITCOIN UTXO</div>
                <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>Multi-Input Heuristics</div>
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <span style={{ color: '#627EEA', fontWeight: 700, fontSize: '1.1rem' }}>Ξ</span>
              <div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>EVM / ERC-20</div>
                <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>Smart Contract Tracing</div>
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <span style={{ color: '#FF0013', fontWeight: 700, fontSize: '1.1rem' }}>TRX</span>
              <div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>TRON TRC-20</div>
                <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>USDT Drainer Detection</div>
              </div>
            </div>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: '0.8rem',
            color: 'var(--emerald)',
            fontFamily: 'var(--font-mono)',
          }}>
            <CheckCircle2 size={15} />
            <span>CONNECTED TO VASP REPUTATION ORACLES & NEOPROTOCOL GRAPH</span>
          </div>
        </div>

        {/* Right Side: 40% Login Form */}
        <div style={{ padding: '3rem 2.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ marginBottom: '2rem' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              color: 'var(--primary)',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.75rem',
              marginBottom: '0.5rem',
            }}>
              <Terminal size={14} /> AUTHORIZED PERSONNEL ONLY
            </div>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              Sign In to Investigator Portal
            </h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
              Enter your law enforcement credentials to begin tracking
            </p>
          </div>

          <form onSubmit={handleSubmit} style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem',
            transform: shake ? 'translateX(6px)' : 'none',
            transition: 'transform 0.1s ease',
          }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                Officer Email / Badge ID
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@i4c.gov.in"
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem 0.75rem 2.8rem',
                    backgroundColor: 'rgba(7, 9, 14, 0.7)',
                    border: '1px solid var(--surface-card-border)',
                    borderRadius: '8px',
                    color: 'var(--text-primary)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.9rem',
                    outline: 'none',
                  }}
                />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-secondary)' }}>
                  Password
                </label>
                <span style={{ fontSize: '0.75rem', color: 'var(--primary)', cursor: 'pointer' }}>
                  Default: cryptotrace
                </span>
              </div>
              <div style={{ position: 'relative' }}>
                <Lock size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem 0.75rem 2.8rem',
                    backgroundColor: 'rgba(7, 9, 14, 0.7)',
                    border: '1px solid var(--surface-card-border)',
                    borderRadius: '8px',
                    color: 'var(--text-primary)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.9rem',
                    outline: 'none',
                  }}
                />
              </div>
            </div>

            {errorMsg && (
              <div style={{
                padding: '0.6rem',
                backgroundColor: 'rgba(255, 51, 102, 0.15)',
                border: '1px solid rgba(255, 51, 102, 0.3)',
                borderRadius: '6px',
                color: 'var(--critical)',
                fontSize: '0.8rem',
              }}>
                {errorMsg}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-cyber-primary"
              style={{ width: '100%', justifyContent: 'center', padding: '0.85rem' }}
            >
              {loading ? 'Authenticating Officer...' : (
                <>
                  Sign In to Workspace <ArrowRight size={16} />
                </>
              )}
            </button>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              margin: '0.5rem 0',
              color: 'var(--text-muted)',
              fontSize: '0.75rem',
            }}>
              <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--surface-card-border)' }} />
              <span>OR SINGLE SIGN-ON</span>
              <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--surface-card-border)' }} />
            </div>

            <button
              type="button"
              onClick={() => onLoginSuccess('officer@i4c.gov.in')}
              className="btn-cyber-secondary"
              style={{ width: '100%', justifyContent: 'center' }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.4 9 5 12 5z" />
                <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z" />
                <path fill="#FBBC05" d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12 0 14.5s.7 4.8 1.9 7.2l3.7-2.9z" />
                <path fill="#34A853" d="M12 23.5c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.4-6.4-5.2L1.9 16.5C3.7 20.4 7.5 23.5 12 23.5z" />
              </svg>
              Login via National Cyber Crime Portal (NCRP)
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
