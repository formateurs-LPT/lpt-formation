'use client'
import { useState, useEffect } from 'react'
import { sbUpsert, sbSelect, setSharedState } from '@/lib/supabase'
import { MODULE_DATA } from '@/lib/modulesData'
import { classifyMagasin } from '@/lib/formationCategories'

const THEMES_FRANCE   = ['entreprise','optique','types-verres','verre-progressif','montures','trame-accueil','offres','pdm','parcours-rembourses','remboursement-france','lpt-sante']
const THEMES_BELGIQUE = ['entreprise','optique','types-verres','verre-progressif','montures','trame-accueil','offres','pdm','mutuelles-inami']

const STAR_LABELS = ['', 'Difficile', 'Quelques notions', 'Correct', 'Bien maîtrisé', 'Maîtrisé !']
const STAR_COLORS = ['', '#dc2626', '#f97316', '#d97706', '#16a34a', '#22c55e']

function getWeekDate() {
  const d = new Date()
  const day = d.getDay()
  d.setDate(d.getDate() - day + (day === 0 ? -6 : 1))
  return d.toISOString().slice(0, 10)
}

function Card({ children, style }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: 18, overflow: 'hidden', marginBottom: 20, ...style,
    }}>
      {children}
    </div>
  )
}

function CardHead({ children }) {
  return (
    <div style={{ padding: '14px 18px', borderBottom: '1px solid rgba(255,255,255,0.08)', background: 'rgba(0,0,0,0.2)' }}>
      <span style={{ fontSize: 11, fontWeight: 800, color: '#00abe9', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
        {children}
      </span>
    </div>
  )
}

function TextArea({ value, onChange, placeholder, rows = 3 }) {
  return (
    <textarea
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      style={{
        width: '100%', padding: '12px 14px', borderRadius: 12,
        border: '1.5px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.07)',
        fontSize: 14, color: '#fff', resize: 'vertical',
        fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box',
        lineHeight: 1.5,
      }}
      onFocus={e => { e.target.style.borderColor = 'rgba(0,171,233,0.6)' }}
      onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.15)' }}
    />
  )
}

export default function AutoEvalParticipant({ pName, sharedState, sessionCode, onDone }) {
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState(null)

  const entrees  = sharedState?.entrees_data || []
  const myEntry  = entrees.find(e => (e.fullName || `${e.nom} ${e.prenom}`.trim()) === pName)
  const cat      = myEntry ? (classifyMagasin(myEntry.magasin) || 'province') : 'province'
  const themes   = cat === 'belgique' ? THEMES_BELGIQUE : THEMES_FRANCE

  const [themeStatus,    setThemeStatus]    = useState({})
  const [accompagnement, setAccompagnement] = useState([])
  const [suggestions,    setSuggestions]    = useState('')
  const [rating,         setRating]         = useState(0)
  const [ratingHover,    setRatingHover]    = useState(0)
  const [ratingComment,  setRatingComment]  = useState('')

  // Pré-remplissage au redo : charge les réponses précédentes dès le montage
  useEffect(() => {
    const redo = sharedState?.auto_eval_redo_names
    const isRedo = Array.isArray(redo) ? redo.includes(pName) : redo === 'all'
    if (!isRedo) return
    sbSelect('formation_reports',
      `collaborateur=eq.${encodeURIComponent(pName)}&week_date=eq.${getWeekDate()}&trainer_name=eq.__auto_eval__`
    ).then(data => {
      const ae = data?.[0]?.stats_snapshot?.auto_eval
      if (!ae) return
      setThemeStatus(ae.theme_self_assessments || {})
      setAccompagnement(ae.accompagnement_themes || [])
      setSuggestions(ae.suggestions || '')
      setRating(ae.rating || 0)
      setRatingComment(ae.rating_comment || '')
    }).catch(() => {})
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const setStars = (themeId, star) => {
    setThemeStatus(prev => ({ ...prev, [themeId]: prev[themeId] === star ? 0 : star }))
  }

  const toggleAccomp = (key) => {
    setAccompagnement(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key])
  }

  const handleSubmit = async () => {
    setSaving(true)
    setError(null)
    try {
      await sbUpsert('formation_reports', {
        collaborateur: pName,
        week_date: getWeekDate(),
        session_code: sessionCode || '',
        trainer_name: '__auto_eval__',
        status: 'draft',
        stats_snapshot: {
          auto_eval: {
            themes_list: themes,
            theme_self_assessments: themeStatus,
            accompagnement_themes: accompagnement,
            suggestions,
            rating: rating || null,
            rating_comment: ratingComment.trim() || null,
          },
        },
        updated_at: new Date().toISOString(),
      }, 'collaborateur,week_date,trainer_name')
      // Retire ce formé de la liste redo si présent
      const redo = sharedState?.auto_eval_redo_names
      if (Array.isArray(redo) && redo.includes(pName)) {
        const next = redo.filter(n => n !== pName)
        await setSharedState({ auto_eval_redo_names: next.length ? next : null }).catch(() => {})
      } else if (redo === 'all') {
        await setSharedState({ auto_eval_redo_names: null }).catch(() => {})
      }
      onDone()
    } catch (e) {
      console.error('[AutoEval] submit error', e)
      setError('Une erreur est survenue. Réessaie.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{
      minHeight: '100dvh',
      background: 'linear-gradient(160deg, #03112a 0%, #0a2a5c 100%)',
      overflowY: 'auto', padding: '28px 18px 100px',
    }}>
      <div style={{ maxWidth: 560, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: '#00abe9', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 8 }}>
            Auto-évaluation
          </div>
          <div style={{ fontSize: 24, fontWeight: 900, color: '#fff', marginBottom: 8 }}>Fin de formation</div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', lineHeight: 1.6 }}>
            Réponds honnêtement — tes réponses ne sont visibles que par le formateur
          </div>
        </div>

        {/* Section 1 — Thèmes */}
        <Card>
          <CardHead>Thèmes abordés — Ton niveau</CardHead>
          <div style={{ padding: '14px 16px' }}>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', marginBottom: 16, lineHeight: 1.5 }}>
              Donne-toi une note de 1 à 5 étoiles pour chaque thème
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              {themes.map((themeId, idx) => {
                const meta = MODULE_DATA[themeId]
                if (!meta) return null
                const current = themeStatus[themeId] || 0
                return (
                  <div key={themeId} style={{ paddingBottom: idx < themes.length - 1 ? 18 : 0, borderBottom: idx < themes.length - 1 ? '1px solid rgba(255,255,255,0.07)' : 'none' }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 12 }}>{meta.label}</div>
                    <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
                      {[1,2,3,4,5].map(star => (
                        <button
                          key={star}
                          onClick={() => setStars(themeId, star)}
                          style={{
                            background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px',
                            fontSize: 34, lineHeight: 1,
                            filter: star <= current ? 'none' : 'grayscale(1) brightness(0.3)',
                            transform: star <= current ? 'scale(1.15)' : 'scale(1)',
                            transition: 'all .15s',
                            WebkitTapHighlightColor: 'transparent',
                          }}
                        >⭐</button>
                      ))}
                    </div>
                    {current > 0 && (
                      <div style={{ textAlign: 'center', fontSize: 12, fontWeight: 700, color: STAR_COLORS[current], marginTop: 8 }}>
                        {STAR_LABELS[current]}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </Card>

        {/* Section 2 — Accompagnement (multi-select) */}
        <Card>
          <CardHead>Accompagnement souhaité</CardHead>
          <div style={{ padding: '14px 16px' }}>
            <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.8)', marginBottom: 12, lineHeight: 1.5 }}>
              Sur quels thèmes penses-tu avoir besoin de plus d'accompagnement après la formation ?
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {themes.map(themeId => {
                const meta = MODULE_DATA[themeId]
                const active = accompagnement.includes(themeId)
                return (
                  <button
                    key={themeId}
                    onClick={() => toggleAccomp(themeId)}
                    style={{
                      padding: '9px 16px', borderRadius: 20, fontSize: 13, fontWeight: 600,
                      border: `1.5px solid ${active ? '#00abe9' : 'rgba(255,255,255,0.18)'}`,
                      background: active ? 'rgba(0,171,233,0.22)' : 'rgba(255,255,255,0.05)',
                      color: active ? '#00abe9' : 'rgba(255,255,255,0.55)',
                      cursor: 'pointer', transition: 'all .15s',
                      WebkitTapHighlightColor: 'transparent',
                    }}
                  >
                    {meta?.label || themeId}
                  </button>
                )
              })}
            </div>
            {accompagnement.length > 0 && (
              <div style={{ marginTop: 10, fontSize: 12, color: '#00abe9', fontWeight: 600 }}>
                {accompagnement.length} thème{accompagnement.length > 1 ? 's' : ''} sélectionné{accompagnement.length > 1 ? 's' : ''}
              </div>
            )}
          </div>
        </Card>

        {/* Section 3 — Suggestions */}
        <Card>
          <CardHead>Suggestions</CardHead>
          <div style={{ padding: '14px 16px' }}>
            <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.8)', marginBottom: 10, lineHeight: 1.5 }}>
              As-tu des suggestions pour améliorer la formation ?<br />
              <span style={{ fontWeight: 400, fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>
                (thèmes à approfondir, idées de mini-jeux, rythme, contenu…)
              </span>
            </label>
            <TextArea
              value={suggestions}
              onChange={setSuggestions}
              placeholder="Tes idées sont précieuses pour nous aider à améliorer les prochaines formations…"
              rows={4}
            />
          </div>
        </Card>

        {/* Section 3 — Avis formation */}
        <Card>
          <CardHead>Ton avis sur la formation</CardHead>
          <div style={{ padding: '18px 16px' }}>
            <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.8)', marginBottom: 16, lineHeight: 1.5 }}>
              Note la formation
            </label>
            {/* Étoiles */}
            <div style={{ display: 'flex', gap: 10, marginBottom: 20, justifyContent: 'center' }}>
              {[1,2,3,4,5].map(star => {
                const filled = star <= (ratingHover || rating)
                return (
                  <button
                    key={star}
                    onClick={() => setRating(star === rating ? 0 : star)}
                    onMouseEnter={() => setRatingHover(star)}
                    onMouseLeave={() => setRatingHover(0)}
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                      fontSize: 44, lineHeight: 1,
                      filter: filled ? 'none' : 'grayscale(1) brightness(0.4)',
                      transform: filled ? 'scale(1.1)' : 'scale(1)',
                      transition: 'all .15s',
                      WebkitTapHighlightColor: 'transparent',
                    }}
                  >
                    ⭐
                  </button>
                )
              })}
            </div>
            {rating > 0 && (
              <div style={{ textAlign: 'center', fontSize: 13, color: rating >= 4 ? '#22c55e' : rating === 3 ? '#f59e0b' : '#f87171', fontWeight: 700, marginBottom: 16 }}>
                {['', 'Insuffisant', 'Passable', 'Bien', 'Très bien', 'Excellent !'][rating]}
              </div>
            )}
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.6)', marginBottom: 8 }}>
              Un commentaire ? <span style={{ fontWeight: 400, opacity: 0.6 }}>(facultatif)</span>
            </label>
            <TextArea
              value={ratingComment}
              onChange={setRatingComment}
              placeholder="Ce que tu as aimé, ce qui t'a manqué, un conseil pour les prochaines promos…"
              rows={3}
            />
          </div>
        </Card>

        {/* Error */}
        {error && (
          <div style={{ padding: '12px 16px', borderRadius: 12, background: 'rgba(248,113,113,0.15)', border: '1px solid rgba(248,113,113,0.35)', color: '#f87171', fontSize: 13, marginBottom: 16 }}>
            {error}
          </div>
        )}

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={saving}
          style={{
            width: '100%', padding: '18px 24px', borderRadius: 18,
            background: saving ? 'rgba(0,171,233,0.4)' : '#00abe9',
            color: '#fff', fontWeight: 800, fontSize: 16,
            border: 'none', cursor: saving ? 'not-allowed' : 'pointer',
            transition: 'background .2s', fontFamily: 'inherit',
            boxShadow: saving ? 'none' : '0 4px 20px rgba(0,171,233,0.35)',
          }}
        >
          {saving ? 'Envoi en cours…' : 'Envoyer mes réponses ✓'}
        </button>

      </div>
    </div>
  )
}
