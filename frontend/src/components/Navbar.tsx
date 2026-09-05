import React from 'react'
import { Shield, Bell, Moon, Sun, Search, FileText, AlertTriangle, Layers, User, LogOut } from 'lucide-react'

interface NavbarProps {
  currentRoute: string
  onRouteChange: (route: string) => void
  theme: 'dark' | 'light'
  onToggleTheme: () => void
  unreadAlertCount: number
  userEmail: string
  onLogout: () => void
}

export function Navbar({
  currentRoute,
  onRouteChange,
  theme,
  onToggleTheme,
  unreadAlertCount,
  userEmail,
  onLogout,
}: NavbarProps) {
  const [userMenuOpen, setUserMenuOpen] = React.useState(false)

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Layers },
    { id: 'trace', label: 'Trace Tool', icon: Search },
    { id: 'complaints', label: 'Complaints', icon: FileText },
    { id: 'alerts', label: 'Alerts', icon: AlertTriangle, badge: unreadAlertCount },
    { id: 'reports', label: 'Reports', icon: Shield },
  ]

  return (
    <header style={{
      position: 'sticky',
      top: 0,
      zIndex: 50,
      backgroundColor: 'var(--surface-card)',
      backdropFilter: 'var(--glass-blur)',
      borderBottom: '1px solid var(--surface-card-border)',
      padding: '0.75rem 2rem',
    }}>
      <div style={{
        maxWidth: '1440px',
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        {/* Brand Logo */}
        <div
          onClick={() => onRouteChange('dashboard')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            cursor: 'pointer',
          }}
        >
          <div style={{
            background: 'var(--primary-gradient)',
            padding: '0.4rem',
            borderRadius: '8px',
            color: '#040508',
            display: 'flex',
            boxShadow: '0 0 12px rgba(0, 242, 254, 0.4)',
          }}>
            <Shield size={20} />
          </div>
          <span style={{
            fontFamily: 'var(--font-heading)',
            fontSize: '1.25rem',
            fontWeight: 700,
            letterSpacing: '-0.02em',
          }}>
            Crypto<span style={{ color: 'var(--primary)' }}>Trace</span>
          </span>
          <span className="badge badge-medium" style={{ fontSize: '0.65rem', padding: '0.1rem 0.4rem' }}>
            I4C
          </span>
        </div>

        {/* Center Nav Links */}
        <nav style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          backgroundColor: 'var(--surface-hover)',
          padding: '0.3rem 0.5rem',
          borderRadius: '10px',
          border: '1px solid var(--surface-card-border)',
        }}>
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = currentRoute === item.id || (item.id === 'trace' && currentRoute.startsWith('trace'))
            return (
              <button
                key={item.id}
                onClick={() => onRouteChange(item.id)}
                style={{
                  background: isActive ? (theme === 'dark' ? 'rgba(0, 242, 254, 0.15)' : 'var(--surface)') : 'transparent',
                  color: isActive ? 'var(--primary)' : 'var(--text-secondary)',
                  border: isActive ? '1px solid var(--surface-card-border)' : '1px solid transparent',
                  borderRadius: '6px',
                  padding: '0.45rem 0.9rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  fontSize: '0.85rem',
                  fontWeight: isActive ? 600 : 500,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  position: 'relative',
                }}
              >
                <Icon size={16} />
                <span>{item.label}</span>
                {Boolean(item.badge && item.badge > 0) && (
                  <span style={{
                    backgroundColor: 'var(--critical)',
                    color: '#FFF',
                    fontSize: '0.65rem',
                    fontWeight: 700,
                    padding: '0.1rem 0.35rem',
                    borderRadius: '10px',
                    marginLeft: '0.2rem',
                  }}>
                    {item.badge}
                  </span>
                )}
              </button>
            )
          })}
        </nav>

        {/* Right Tools: Alerts, Theme, User */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
          {/* Notification Bell */}
          <button
            onClick={() => onRouteChange('alerts')}
            title="Real-time Alerts"
            style={{
              position: 'relative',
              background: 'transparent',
              border: '1px solid var(--surface-card-border)',
              borderRadius: '8px',
              padding: '0.5rem',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              display: 'flex',
            }}
          >
            <Bell size={18} />
            {unreadAlertCount > 0 && (
              <span style={{
                position: 'absolute',
                top: '-4px',
                right: '-4px',
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                backgroundColor: 'var(--critical)',
                boxShadow: '0 0 8px var(--critical)',
              }} />
            )}
          </button>

          {/* Theme Toggle */}
          <button
            onClick={onToggleTheme}
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
            style={{
              background: 'transparent',
              border: '1px solid var(--surface-card-border)',
              borderRadius: '8px',
              padding: '0.5rem',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              display: 'flex',
            }}
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          {/* User Profile */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                background: 'var(--surface-hover)',
                border: '1px solid var(--surface-card-border)',
                borderRadius: '8px',
                padding: '0.4rem 0.8rem',
                color: 'var(--text-primary)',
                fontSize: '0.8rem',
                cursor: 'pointer',
              }}
            >
              <div style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                background: 'var(--primary-gradient)',
                color: '#040508',
                fontWeight: 700,
                fontSize: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                {userEmail.slice(0, 1).toUpperCase()}
              </div>
              <span style={{ maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {userEmail.split('@')[0]}
              </span>
            </button>

            {userMenuOpen && (
              <div
                className="glass-panel"
                style={{
                  position: 'absolute',
                  right: 0,
                  top: '115%',
                  width: '200px',
                  padding: '0.5rem',
                  zIndex: 100,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.25rem',
                }}
              >
                <div style={{ padding: '0.5rem', borderBottom: '1px solid var(--surface-card-border)', fontSize: '0.75rem' }}>
                  <div style={{ color: 'var(--text-muted)' }}>Signed in as</div>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)', wordBreak: 'break-all' }}>{userEmail}</div>
                </div>
                <button
                  onClick={() => {
                    setUserMenuOpen(false)
                    onLogout()
                  }}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--critical)',
                    padding: '0.5rem',
                    textAlign: 'left',
                    borderRadius: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                  }}
                >
                  <LogOut size={14} /> Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
