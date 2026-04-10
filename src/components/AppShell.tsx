import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'

import { getTheme, setTheme } from '../app/storage'

const primaryNav = [
  { to: '/', label: 'Home', end: true, icon: HomeIcon, iconActive: HomeIconFill },
  { to: '/practice', label: 'Practice', end: false, icon: PracticeIcon, iconActive: PracticeIconFill },
  { to: '/exam/setup', label: 'Exam', end: false, icon: ExamIcon, iconActive: ExamIconFill },
  { to: '/review', label: 'Review', end: false, icon: ReviewIcon, iconActive: ReviewIconFill },
]

function getInitialTheme(): 'light' | 'dark' {
  const stored = getTheme()
  if (stored) return stored
  if (typeof window.matchMedia === 'function' && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark'
  }
  return 'light'
}

function applyTheme(theme: 'light' | 'dark') {
  const root = document.documentElement
  if (theme === 'dark') {
    root.setAttribute('data-theme', 'dark')
  } else {
    root.removeAttribute('data-theme')
  }
  setTheme(theme)
}

/* ── SVG Icons ── */
function SunIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="4"/>
      <line x1="12" y1="2" x2="12" y2="6"/>
      <line x1="12" y1="18" x2="12" y2="22"/>
      <line x1="4.22" y1="4.22" x2="7.05" y2="7.05"/>
      <line x1="16.95" y1="16.95" x2="19.78" y2="19.78"/>
      <line x1="2" y1="12" x2="6" y2="12"/>
      <line x1="18" y1="12" x2="22" y2="12"/>
      <line x1="4.22" y1="19.78" x2="7.05" y2="16.95"/>
      <line x1="16.95" y1="7.05" x2="19.78" y2="4.22"/>
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
    </svg>
  )
}

function BookIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
    </svg>
  )
}

/* Nav icons */
function HomeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
      <polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  )
}
function HomeIconFill() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="none" aria-hidden="true">
      <path d="M10.707 2.293a1 1 0 0 0-1.414 0l-7 7a1 1 0 0 0 1.414 1.414L4 10.414V21a1 1 0 0 0 1 1h4a1 1 0 0 0 1-1v-5h4v5a1 1 0 0 0 1 1h4a1 1 0 0 0 1-1V10.414l.293.293a1 1 0 0 0 1.414-1.414l-7-7z"/>
    </svg>
  )
}

function PracticeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 20h9"/>
      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/>
    </svg>
  )
}
function PracticeIconFill() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="none" aria-hidden="true">
      <path d="M21.731 2.269a2.625 2.625 0 0 0-3.712 0l-1.157 1.157 3.712 3.712 1.157-1.157a2.625 2.625 0 0 0 0-3.712zM19.513 8.199l-3.712-3.712-8.4 8.4a5.25 5.25 0 0 0-1.32 2.214l-.8 2.685a.75.75 0 0 0 .933.933l2.685-.8a5.25 5.25 0 0 0 2.214-1.32l8.4-8.4z"/>
      <path d="M5.25 5.25a3 3 0 0 0-3 3v10.5a3 3 0 0 0 3 3h10.5a3 3 0 0 0 3-3V13.5a.75.75 0 0 0-1.5 0v5.25a1.5 1.5 0 0 1-1.5 1.5H5.25a1.5 1.5 0 0 1-1.5-1.5V8.25a1.5 1.5 0 0 1 1.5-1.5h5.25a.75.75 0 0 0 0-1.5H5.25z"/>
    </svg>
  )
}

function ExamIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
      <line x1="8" y1="12" x2="16" y2="12"/>
      <line x1="8" y1="8" x2="11" y2="8"/>
      <line x1="8" y1="16" x2="11" y2="16"/>
    </svg>
  )
}
function ExamIconFill() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="none" aria-hidden="true">
      <path fillRule="evenodd" d="M5.625 1.5H9a3.75 3.75 0 0 1 3.75 3.75v1.875c0 1.036.84 1.875 1.875 1.875H16.5a3.75 3.75 0 0 1 3.75 3.75v7.875c0 1.035-.84 1.875-1.875 1.875H5.625a1.875 1.875 0 0 1-1.875-1.875V3.375c0-1.036.84-1.875 1.875-1.875zM9.75 17.25a.75.75 0 0 0-1.5 0V18a.75.75 0 0 0 1.5 0v-.75zm2.25-3a.75.75 0 0 1 .75.75v3a.75.75 0 0 1-1.5 0v-3a.75.75 0 0 1 .75-.75zm3.75-1.5a.75.75 0 0 0-1.5 0V18a.75.75 0 0 0 1.5 0v-5.25z" clipRule="evenodd"/>
      <path d="M14.25 5.25a5.23 5.23 0 0 0-1.279-3.434 9.768 9.768 0 0 1 6.963 6.963A5.23 5.23 0 0 0 16.5 7.5h-1.875a.375.375 0 0 1-.375-.375V5.25z"/>
    </svg>
  )
}

function ReviewIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
    </svg>
  )
}
function ReviewIconFill() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="none" aria-hidden="true">
      <path d="m11.645 20.91-.007-.003-.022-.012a15.247 15.247 0 0 1-.383-.218 25.18 25.18 0 0 1-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0 1 12 5.052 5.5 5.5 0 0 1 16.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 0 1-4.244 3.17 15.247 15.247 0 0 1-.383.219l-.022.012-.007.004-.003.001a.752.752 0 0 1-.704 0l-.003-.001z"/>
    </svg>
  )
}

export function AppShell() {
  const location = useLocation()
  const [theme, setThemeState] = useState<'light' | 'dark'>(getInitialTheme)
  const [headerOpacity, setHeaderOpacity] = useState(1)
  const hideQuestionSessionChrome = location.pathname === '/practice'
    || location.pathname === '/exam/session'
    || location.pathname === '/mock/session'

  useEffect(() => {
    applyTheme(theme)
  }, [theme])

  // Smooth fade-out header on scroll (home page only)
  const isHome = location.pathname === '/'
  useEffect(() => {
    if (!isHome || hideQuestionSessionChrome) {
      setHeaderOpacity(1)
      return
    }

    // Don't fade on mobile — keep full visibility
    if (window.innerWidth < 1024) {
      setHeaderOpacity(1)
      return
    }

    const FADE_START = 20     // px scrolled before fade begins
    const FADE_DISTANCE = 80  // px over which opacity goes 1 → 0

    let ticking = false

    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const y = window.scrollY
          if (y <= FADE_START) {
            setHeaderOpacity(1)
          } else if (y >= FADE_START + FADE_DISTANCE) {
            setHeaderOpacity(0)
          } else {
            const progress = (y - FADE_START) / FADE_DISTANCE
            // Ease-out curve for natural feel
            const eased = 1 - (1 - Math.pow(1 - progress, 3))
            setHeaderOpacity(Math.max(0, Math.min(1, 1 - eased)))
          }
          ticking = false
        })
        ticking = true
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()
    return () => window.removeEventListener('scroll', handleScroll)
  }, [isHome, hideQuestionSessionChrome])

  const toggleTheme = () => {
    setThemeState((prev) => (prev === 'dark' ? 'light' : 'dark'))
  }

  return (
    <div className={`app-shell${hideQuestionSessionChrome ? ' question-session-shell' : ''}`} style={isHome && !hideQuestionSessionChrome ? { '--header-opacity': headerOpacity } as React.CSSProperties : undefined}>
      {!hideQuestionSessionChrome && <header className="app-header">
        {/* Decorative gradient border line */}
        <div className="header-gradient-line" aria-hidden="true" />

        <div className="header-inner">
          {/* Brand block */}
          <div className="app-brand">
            {/* Icon with animated gradient ring */}
            <div className="app-brand-icon-wrap" aria-hidden="true">
              <div className="brand-icon-ring" />
              <div className="brand-icon-ring brand-icon-ring--2" />
              <div className="app-brand-icon">
                <BookIcon />
              </div>
            </div>

            <div className="brand-text">
              <p className="eyebrow">
                <span className="eyebrow-dot" aria-hidden="true" />
                2026 Spring
              </p>
              <h1 className="app-title">
                Strategic Management
              </h1>
              <p className="app-subtitle">
                Practice · Timed Exams · Review
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="header-actions">
            <div className="status-chip">
              <span className="status-dot" aria-hidden="true" />
              Local-first
            </div>
            <button
              type="button"
              className="ghost-button theme-toggle"
              onClick={toggleTheme}
              aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            >
              {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
            </button>
          </div>
        </div>
      </header>}

      {!hideQuestionSessionChrome && <nav className="top-nav" aria-label="Primary">
        {primaryNav.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) => (isActive ? 'nav-link is-active' : 'nav-link')}
          >
            {item.label}
          </NavLink>
        ))}
      </nav>}

      <main className="app-main">
        <Outlet />
      </main>

      <nav className="bottom-nav" aria-label="Mobile primary">
        {primaryNav.map((item) => {
          const IconDefault = item.icon
          const IconFilled = item.iconActive
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => (isActive ? 'bottom-link is-active' : 'bottom-link')}
            >
              {({ isActive }) => (
                <>
                  {isActive ? <IconFilled /> : <IconDefault />}
                  {item.label}
                </>
              )}
            </NavLink>
          )
        })}
      </nav>
    </div>
  )
}
