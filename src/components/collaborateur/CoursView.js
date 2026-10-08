'use client'
import { useState, useEffect } from 'react'
import { getSkillItems, isBelgiqueStore } from '@/lib/storeFollowupData'
import { sectionPourPoste } from '@/lib/collaborateurProgressConfig'
import { getMagasinSlug, getCoursParTheme, getLecturesCollaborateur, marquerCoursLu } from '@/lib/collaborateurFormationApi'

const cardStyle = { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 16, padding: 20, boxShadow: '0 1px 2px rgba(16,24,40,0.03)' }

function BlocContenu({ bloc }) {
  if (bloc.type === 'image') {
    return (
      <figure style={{ margin: '0 0 16px' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={bloc.url} alt={bloc.legende || ''} style={{ width: '100%', borderRadius: 12, display: 'block' }} />
        {bloc.legende && <figcaption style={{ fontSize: 12, color: '#9aa1ac', marginTop: 6, textAlign: 'center' }}>{bloc.legende}</figcaption>}
      </figure>
    )
  }
  return <p style={{ fontSize: 14.5, color: '#374151', lineHeight: 1.7, margin: '0 0 16px', whiteSpace: 'pre-wrap' }}>{bloc.valeur}</p>
}

function LectureCours({ cours, lu, onBack, onMarquerLu }) {
  return (
    <div>
      <button onClick={onBack} className="detail-back" style={{ marginBottom: 16 }}>← Cours</button>
      <div style={cardStyle}>
        <div style={{ fontSize: 18, fontWeight: 800, color: '#14161a', marginBottom: 18 }}>{cours.titre}</div>
        {(cours.contenu || []).map((bloc, i) => <BlocContenu key={i} bloc={bloc} />)}
        <button
          onClick={onMarquerLu}
          disabled={lu}
          style={{
            marginTop: 8, width: '100%', minHeight: 44, padding: '12px', borderRadius: 12, border: 'none',
            background: lu ? '#dcfce7' : 'linear-gradient(135deg,#0089ba,#00abe9)',
            color: lu ? '#15803d' : '#fff', fontWeight: 700, fontSize: 14, cursor: lu ? 'default' : 'pointer', fontFamily: 'inherit',
          }}
        >{lu ? '✓ Cours lu' : 'Marquer comme lu'}</button>
      </div>
    </div>
  )
}

export default function CoursView({ session, initialThemeId, onConsumedInitialTheme }) {
  const [loading, setLoading] = useState(true)
  const [items, setItems] = useState([])
  const [coursParTheme, setCoursParTheme] = useState({})
  const [lectures, setLectures] = useState({})
  const [openCours, setOpenCours] = useState(null)
  const [filtreThemeId, setFiltreThemeId] = useState(initialThemeId || null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      const sectionId = sectionPourPoste(session.poste)
      if (!sectionId) { if (!cancelled) { setItems([]); setLoading(false) } return }
      const storeSlug = await getMagasinSlug(session.magasinId)
      const isBelgique = storeSlug ? isBelgiqueStore(storeSlug) : false
      const skillItems = getSkillItems(sectionId, isBelgique)
      const [cours, lues] = await Promise.all([
        getCoursParTheme(skillItems.map(it => it.id)),
        getLecturesCollaborateur(session.id),
      ])
      if (!cancelled) { setItems(skillItems); setCoursParTheme(cours); setLectures(lues); setLoading(false) }
    })()
    return () => { cancelled = true }
  }, [session.poste, session.magasinId, session.id])

  const marquerLu = async (coursId) => {
    setLectures(l => ({ ...l, [coursId]: new Date().toISOString() }))
    await marquerCoursLu(coursId, session.id)
  }

  if (loading) return <div style={{ color: '#9aa1ac', fontSize: 13, textAlign: 'center', padding: '40px 0' }}>Chargement…</div>

  if (openCours) {
    return <LectureCours cours={openCours} lu={!!lectures[openCours.id]} onBack={() => setOpenCours(null)} onMarquerLu={() => marquerLu(openCours.id)} />
  }

  if (items.length === 0) {
    return (
      <div style={{ ...cardStyle, textAlign: 'center', padding: '40px 24px' }}>
        <div style={{ fontSize: 36, marginBottom: 12 }}>📖</div>
        <div style={{ fontSize: 15, fontWeight: 700, color: '#14161a' }}>Bientôt disponible</div>
      </div>
    )
  }

  const themesAffiches = filtreThemeId ? items.filter(it => it.id === filtreThemeId) : items

  return (
    <div>
      {filtreThemeId && (
        <button
          onClick={() => { setFiltreThemeId(null); onConsumedInitialTheme?.() }}
          className="detail-back"
          style={{ marginBottom: 16 }}
        >← Tous les thèmes</button>
      )}
      {themesAffiches.map(theme => {
        const coursTheme = coursParTheme[theme.id] || []
        return (
          <div key={theme.id} style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: '#14161a', marginBottom: 10 }}>{theme.label}</div>
            {coursTheme.length === 0 ? (
              <div style={{ ...cardStyle, padding: '16px 18px', color: '#9aa1ac', fontSize: 13, fontStyle: 'italic' }}>Bientôt disponible</div>
            ) : (
              coursTheme.map(c => (
                <button
                  key={c.id}
                  onClick={() => setOpenCours(c)}
                  style={{ ...cardStyle, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, width: '100%', textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit', marginBottom: 8, padding: '14px 18px' }}
                >
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#14161a' }}>{c.titre}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                    {lectures[c.id] && <span style={{ fontSize: 11, fontWeight: 700, color: '#15803d', background: '#dcfce7', padding: '3px 9px', borderRadius: 20 }}>✓ Lu</span>}
                    <span style={{ color: '#c7cbd1', fontSize: 18 }}>›</span>
                  </div>
                </button>
              ))
            )}
          </div>
        )
      })}
    </div>
  )
}
