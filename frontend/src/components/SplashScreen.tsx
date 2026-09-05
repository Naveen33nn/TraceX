import React, { useEffect, useState } from 'react'

export function SplashScreen({ onFinish }: { onFinish: () => void }) {
  const [step, setStep] = useState(0)

  useEffect(() => {
    // Sequence:
    // [0.0s] Black screen
    // [0.3s] Glowing dot appears center-screen
    // [0.8s] Dot expands into a neon ring
    // [1.2s] Ring morphs into a shield outline
    // [1.8s] Shield fills with gradient
    // [2.2s] Text fades in: "CryptoTrace"
    // [2.7s] Tagline slides up: "Real-Time Blockchain Intelligence"
    // [3.2s] Particle burst
    // [3.6s] Finish & redirect
    const timers = [
      setTimeout(() => setStep(1), 300),
      setTimeout(() => setStep(2), 800),
      setTimeout(() => setStep(3), 1200),
      setTimeout(() => setStep(4), 1800),
      setTimeout(() => setStep(5), 2200),
      setTimeout(() => setStep(6), 2700),
      setTimeout(() => setStep(7), 3200),
      setTimeout(() => {
        onFinish()
      }, 3700),
    ]

    return () => timers.forEach(clearTimeout)
  }, [onFinish])

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: '#040508',
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#FFFFFF',
      fontFamily: 'var(--font-heading)',
      transition: 'opacity 0.5s ease',
      opacity: step === 7 ? 0 : 1,
      pointerEvents: step === 7 ? 'none' : 'auto'
    }}>
      {/* Central Symbol */}
      <div style={{ position: 'relative', width: '120px', height: '120px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {/* Step 1: Glowing Dot */}
        {step >= 1 && (
          <div style={{
            position: 'absolute',
            width: step >= 2 ? '100px' : '14px',
            height: step >= 2 ? '100px' : '14px',
            borderRadius: '50%',
            background: step >= 2 ? 'transparent' : 'radial-gradient(circle, #00F2FE 0%, #4FACFE 100%)',
            border: step >= 2 ? '2px solid #00F2FE' : 'none',
            boxShadow: '0 0 35px #00F2FE',
            transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
            opacity: step >= 3 ? 0.3 : 1,
          }} />
        )}

        {/* Step 3+: Shield SVG */}
        {step >= 3 && (
          <svg
            width="84"
            height="84"
            viewBox="0 0 24 24"
            fill={step >= 4 ? 'url(#shieldGrad)' : 'none'}
            stroke="#00F2FE"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              filter: 'drop-shadow(0 0 16px rgba(0, 242, 254, 0.8))',
              transform: step >= 4 ? 'scale(1.08) rotate(0deg)' : 'scale(0.9) rotate(-10deg)',
              transition: 'all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
            }}
          >
            <defs>
              <linearGradient id="shieldGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#00F2FE" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#4FACFE" stopOpacity="0.4" />
              </linearGradient>
            </defs>
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            <path d="M9 12l2 2 4-4" stroke={step >= 4 ? '#040508' : '#00FFA3'} strokeWidth="2" />
          </svg>
        )}

        {/* Step 7: Particles burst */}
        {step >= 6 && (
          <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
            {[...Array(12)].map((_, i) => {
              const angle = (i * 30 * Math.PI) / 180
              const dist = 60
              const x = Math.cos(angle) * dist
              const y = Math.sin(angle) * dist
              return (
                <div
                  key={i}
                  style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    width: '4px',
                    height: '4px',
                    borderRadius: '50%',
                    backgroundColor: i % 2 === 0 ? '#00F2FE' : '#00FFA3',
                    boxShadow: '0 0 8px currentColor',
                    transform: `translate(${x}px, ${y}px)`,
                    opacity: step === 7 ? 0 : 0.8,
                    transition: 'all 0.6s ease-out',
                  }}
                />
              )
            })}
          </div>
        )}
      </div>

      {/* Brand Text Reveal */}
      <div style={{ marginTop: '2rem', textAlign: 'center' }}>
        <h1 style={{
          fontSize: '2.5rem',
          fontWeight: 700,
          letterSpacing: '-0.03em',
          background: 'linear-gradient(135deg, #FFFFFF 0%, #94A3B8 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          opacity: step >= 5 ? 1 : 0,
          transform: step >= 5 ? 'translateY(0)' : 'translateY(15px)',
          transition: 'all 0.4s ease',
          display: 'flex',
          alignItems: 'center',
          gap: '0.4rem',
        }}>
          Crypto<span style={{
            background: 'var(--primary-gradient)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>Trace</span>
        </h1>

        <p style={{
          marginTop: '0.5rem',
          fontSize: '0.875rem',
          fontFamily: 'var(--font-mono)',
          color: '#00F2FE',
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          opacity: step >= 6 ? 1 : 0,
          transform: step >= 6 ? 'translateY(0)' : 'translateY(10px)',
          transition: 'all 0.4s ease',
        }}>
          Real-Time Blockchain Intelligence
        </p>

        <p style={{
          marginTop: '0.5rem',
          fontSize: '0.75rem',
          color: '#8B9EB7',
          opacity: step >= 6 ? 0.7 : 0,
          transition: 'opacity 0.4s ease',
        }}>
          Indian Cyber Crime Coordination Centre (I4C)
        </p>
      </div>

      {/* Skip button */}
      <button
        onClick={onFinish}
        style={{
          position: 'absolute',
          bottom: '2rem',
          background: 'transparent',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          borderRadius: '4px',
          color: '#8B9EB7',
          padding: '0.4rem 0.8rem',
          fontSize: '0.75rem',
          fontFamily: 'var(--font-mono)',
          cursor: 'pointer',
        }}
      >
        Skip [ESC] →
      </button>
    </div>
  )
}
