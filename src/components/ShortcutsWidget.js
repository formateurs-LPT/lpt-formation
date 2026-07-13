'use client'

const SHORTCUTS = [
  {
    label: 'Slack',
    url: 'https://app.slack.com/get-started?redir=%2Fgantry%2Fauth%3Fapp%3Dclient%26lc%3D1779297919%26return_to%3D%252Fclient%252FT022Y71C2F9%252FD0A7NJKB615%26teams%3D#/find',
    favicon: 'https://www.google.com/s2/favicons?domain=slack.com&sz=64',
    emoji: '💬',
    bg: '#fff',
  },
  {
    label: 'Skello',
    url: 'https://app.skello.io/users/sign_in?lang=fr',
    favicon: 'https://www.google.com/s2/favicons?domain=skello.io&sz=64',
    emoji: '📅',
    bg: '#fff',
  },
  {
    label: 'Back-End',
    url: 'https://admin.lpt-network.com/login',
    localLogo: '/assets/logo-lpt-blanc.png',
    emoji: '⚙️',
    bg: '#03112a',
  },
]

export default function ShortcutsWidget() {
  return (
    <div className="dash-tile" style={{ cursor: 'default' }}>
      <div className="dash-tile-top">
        <div className="dash-tile-icon">🔗</div>
        <span style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,.4)', letterSpacing: '.4px' }}>Raccourcis</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 14 }}>
        {SHORTCUTS.map(s => (
          <button
            key={s.label}
            onClick={() => window.open(s.url, '_blank', 'noopener,noreferrer')}
            style={{
              display: 'flex', alignItems: 'center', gap: 12,
              background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.08)',
              borderRadius: 10, padding: '10px 14px', cursor: 'pointer',
              transition: 'all .18s', width: '100%', textAlign: 'left',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,.12)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,.18)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,.06)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,.08)' }}
          >
            <div style={{
              width: 36, height: 36, borderRadius: 8, flexShrink: 0,
              background: s.bg || '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              overflow: 'hidden',
            }}>
              {s.localLogo ? (
                <img
                  src={s.localLogo}
                  alt={s.label}
                  width={26}
                  height={26}
                  style={{ objectFit: 'contain' }}
                />
              ) : (
                <>
                  <img
                    src={s.favicon}
                    alt={s.label}
                    width={24}
                    height={24}
                    style={{ objectFit: 'contain' }}
                    onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'block' }}
                  />
                  <span style={{ display: 'none', fontSize: 18 }}>{s.emoji}</span>
                </>
              )}
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>{s.label}</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,.35)', marginTop: 1 }}>Ouvrir l'application →</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
