'use client'
import { useState, useEffect } from 'react'
import { MasteryRing } from '@/components/StoreFollowupShared'
import { isBelgiqueStore } from '@/lib/storeFollowupData'
import { sectionPourPoste, statutPourPct, STATUT_META, STATUT_NON_EVALUE, STATUT_ACQUIS } from '@/lib/collaborateurProgressConfig'
import { getMagasinSlug, getProgressionCollaborateur } from '@/lib/collaborateurFormationApi'

const cardStyle = { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 16, padding: 20, boxShadow: '0 1px 2px rgba(16,24,40,0.03)' }

function phraseEncourageante(pct, aucuneDonnee) {
  if (aucuneDonnee) return "C'est le début de l'aventure — explore les cours et exercices pour commencer à progresser."
  if (pct >= 80) return 'Très belle maîtrise, continue comme ça !'
  if (pct >= 50) return 'Bonne dynamique, encore un peu de travail sur certains thèmes.'
  return 'Tu démarres bien — chaque thème travaillé te fait progresser.'
}

function ThemeCard({ item, onOpen }) {
  const statut = statutPourPct(item.pct)
  const meta = STATUT_META[statut]
  const pct = item.pct ?? 0
  return (
    <button onClick={() => onOpen(item.id)} style={{ ...cardStyle, display: 'flex', alignItems: 'center', gap: 14, width: '100%', textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit', marginBottom: 10 }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 8 }}>
          <div style={{ fontSize: 14.5, fontWeight: 700, color: '#14161a' }}>{item.label}</div>
          <span style={{ flexShrink: 0, fontSize: 11.5, fontWeight: 700, padding: '3px 10px', borderRadius: 20, color: meta.color, background: meta.bg, border: `1px solid ${meta.border}` }}>{meta.label}</span>
        </div>
        <div style={{ height: 6, background: '#eef0f2', borderRadius: 3, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${pct}%`, background: meta.color, borderRadius: 3, transition: 'width .3s' }} />
        </div>
      </div>
      <span style={{ color: '#c7cbd1', fontSize: 18, flexShrink: 0 }}>›</span>
    </button>
  )
}

function ThemeDetail({ item, onBack, onLireLeCours, onMExercer }) {
  const statut = statutPourPct(item.pct)
  const meta = STATUT_META[statut]
  return (
    <div>
      <button onClick={onBack} className="detail-back" style={{ marginBottom: 16 }}>← Ma progression</button>
      <div style={{ ...cardStyle, marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 14 }}>
          <div style={{ fontSize: 17, fontWeight: 800, color: '#14161a' }}>{item.label}</div>
          <span style={{ fontSize: 12, fontWeight: 700, padding: '4px 12px', borderRadius: 20, color: meta.color, background: meta.bg, border: `1px solid ${meta.border}` }}>{meta.label}</span>
        </div>
        <div style={{ height: 8, background: '#eef0f2', borderRadius: 4, overflow: 'hidden', marginBottom: 8 }}>
          <div style={{ height: '100%', width: `${item.pct ?? 0}%`, background: meta.color, borderRadius: 4 }} />
        </div>
        <div style={{ fontSize: 12.5, color: '#9aa1ac' }}>{item.pct != null ? `${item.pct}% de maîtrise` : 'Pas encore évalué sur ce thème'}</div>
        {item.note && (
          <div style={{ marginTop: 14, padding: '12px 14px', background: '#f5f6f8', borderRadius: 10, fontSize: 13, color: '#374151', lineHeight: 1.5 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#9aa1ac', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Retour de ton formateur/manager</div>
            {item.note}
          </div>
        )}
      </div>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <button onClick={() => onLireLeCours(item.id)} style={{ flex: 1, minWidth: 160, minHeight: 44, padding: '12px 18px', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg,#0089ba,#00abe9)', color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }}>📖 Lire le cours</button>
        <button onClick={() => onMExercer(item.id)} style={{ flex: 1, minWidth: 160, minHeight: 44, padding: '12px 18px', borderRadius: 12, border: '1.5px solid #e5e7eb', background: '#fff', color: '#14161a', fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }}>✅ M'exercer</button>
      </div>
    </div>
  )
}

export default function ProgressionView({ session, onLireLeCours, onMExercer }) {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState({ items: [], pctGlobal: 0, parThemeId: {} })
  const [selectedThemeId, setSelectedThemeId] = useState(null)

  useEffect(() => {
    let cancelled = false
    const sectionId = sectionPourPoste(session.poste)
    ;(async () => {
      setLoading(true)
      if (!sectionId) { if (!cancelled) { setData({ items: [], pctGlobal: 0, parThemeId: {} }); setLoading(false) } return }
      const storeSlug = await getMagasinSlug(session.magasinId)
      const isBelgique = storeSlug ? isBelgiqueStore(storeSlug) : false
      const result = await getProgressionCollaborateur({ storeSlug, collaborateurSlug: session.slug, sectionId, isBelgique })
      if (!cancelled) { setData(result); setLoading(false) }
    })()
    return () => { cancelled = true }
  }, [session.poste, session.magasinId, session.slug])

  if (loading) return <div style={{ color: '#9aa1ac', fontSize: 13, textAlign: 'center', padding: '40px 0' }}>Chargement…</div>

  if (selectedThemeId) {
    const item = data.parThemeId[selectedThemeId]
    if (item) {
      return <ThemeDetail item={item} onBack={() => setSelectedThemeId(null)} onLireLeCours={onLireLeCours} onMExercer={onMExercer} />
    }
  }

  const items = data.items
  const aucuneDonnee = items.length === 0

  if (aucuneDonnee) {
    return (
      <div style={{ ...cardStyle, textAlign: 'center', padding: '40px 24px' }}>
        <div style={{ fontSize: 36, marginBottom: 12 }}>🌱</div>
        <div style={{ fontSize: 15, fontWeight: 700, color: '#14161a', marginBottom: 6 }}>Tes thèmes de progression arrivent bientôt</div>
        <div style={{ fontSize: 13, color: '#9aa1ac', marginBottom: 20 }}>En attendant, va jeter un œil aux exercices disponibles.</div>
        <button onClick={() => onMExercer(null)} style={{ padding: '11px 22px', minHeight: 44, borderRadius: 12, border: 'none', background: 'linear-gradient(135deg,#0089ba,#00abe9)', color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }}>Voir les exercices</button>
      </div>
    )
  }

  const prioritaires = Object.values(data.parThemeId)
    .filter(it => {
      const s = statutPourPct(it.pct)
      return s !== STATUT_NON_EVALUE && s !== STATUT_ACQUIS
    })
    .sort((a, b) => (a.pct ?? 0) - (b.pct ?? 0))
    .slice(0, 3)

  const categories = {}
  for (const it of items) {
    const entry = data.parThemeId[it.id]
    if (!categories[it.category]) categories[it.category] = []
    categories[it.category].push(entry)
  }

  return (
    <div>
      <div style={{ ...cardStyle, display: 'flex', alignItems: 'center', gap: 20, marginBottom: 20 }}>
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <MasteryRing pct={data.pctGlobal} size={82} stroke={8} color="#0089ba" />
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 19, fontWeight: 800, color: '#14161a' }}>{data.pctGlobal}%</div>
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#9aa1ac', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Maîtrise globale</div>
          <div style={{ fontSize: 14, color: '#374151', lineHeight: 1.4 }}>{phraseEncourageante(data.pctGlobal, false)}</div>
        </div>
      </div>

      {prioritaires.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: '#14161a', marginBottom: 10 }}>🎯 À travailler en priorité</div>
          {prioritaires.map(it => <ThemeCard key={it.id} item={it} onOpen={setSelectedThemeId} />)}
        </div>
      )}

      {Object.entries(categories).map(([category, catItems]) => (
        <div key={category} style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#9aa1ac', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 }}>{category}</div>
          {catItems.map(it => <ThemeCard key={it.id} item={it} onOpen={setSelectedThemeId} />)}
        </div>
      ))}
    </div>
  )
}
