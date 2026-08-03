'use client'
import { useState } from 'react'
import {
  sbSelect, sbUpsert, sbUpdateIfMatch, getActiveSessionCode,
  getWeeklySharedState, TRAINER_STATE_WEEKLY_KEY,
} from '@/lib/supabase'
import { MODULE_DATA } from '@/lib/modulesData'
import { useIsMobile } from '@/lib/useIsMobile'

// ── Lecture / écriture Supabase ───────────────────────────────────
// Plusieurs formateurs peuvent voter/ajouter/supprimer des idées en même temps sur le
// même trainer_state (__weekly__). Un simple lire-modifier-écrire perdrait silencieusement
// la modification de l'un si les deux écrivent dans la même fenêtre de quelques centaines
// de ms : on utilise donc un verrou optimiste sur `updated_at` (comparer-et-échanger),
// avec relecture + nouvelle tentative en cas de collision.

export async function loadIdeesFromSupabase() {
  try {
    const state = await getWeeklySharedState()
    return Array.isArray(state?.lpt_idees) ? state.lpt_idees : []
  } catch {
    return []
  }
}

async function readWeeklyRowRaw() {
  const rows = await sbSelect('trainer_state', `trainer=eq.${encodeURIComponent(TRAINER_STATE_WEEKLY_KEY)}`)
  const row = rows?.[0]
  let state = row?.state ?? {}
  if (typeof state === 'string') {
    try { state = JSON.parse(state) } catch { state = {} }
  }
  if (!state || typeof state !== 'object') state = {}
  return {
    fullState: state,
    idees: Array.isArray(state.lpt_idees) ? state.lpt_idees : [],
    updatedAt: row?.updated_at || null,
  }
}

/** Applique mutateFn(idees) -> nouvellesIdees, avec verrou optimiste + réessais */
async function mutateIdees(mutateFn) {
  const MAX_ATTEMPTS = 6
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const { fullState, idees, updatedAt } = await readWeeklyRowRaw()
    const nextIdees = mutateFn(idees)
    const nextState = { ...fullState, lpt_idees: nextIdees }
    const now = new Date().toISOString()

    if (!updatedAt) {
      // Pas encore de ligne __weekly__ — création, pas de concurrence possible ici
      await sbUpsert('trainer_state', { trainer: TRAINER_STATE_WEEKLY_KEY, state: nextState, updated_at: now }, 'trainer')
      return
    }

    const wrote = await sbUpdateIfMatch(
      'trainer_state',
      { state: nextState, updated_at: now },
      `trainer=eq.${encodeURIComponent(TRAINER_STATE_WEEKLY_KEY)}&updated_at=eq.${encodeURIComponent(updatedAt)}`
    )
    if (wrote) return
    // Quelqu'un d'autre a écrit entre la lecture et l'écriture → on relit et on réessaie
  }
  console.error('[IdeesButton] mutateIdees: échec après plusieurs tentatives (collisions répétées)')
}

export async function deleteIdee(id) {
  await mutateIdees(idees => idees.filter(i => i.id !== id))
}

export async function updateIdee(id, updates) {
  await mutateIdees(idees => idees.map(i => i.id === id ? { ...i, ...updates } : i))
}

export async function voteIdee(id, pName, vote) {
  await mutateIdees(idees => idees.map(i => {
    if (i.id !== id) return i
    const votes = { ok: [...(i.votes?.ok || [])], pas_ok: [...(i.votes?.pas_ok || [])] }
    const opposite = vote === 'ok' ? 'pas_ok' : 'ok'
    votes[opposite] = votes[opposite].filter(n => n !== pName)
    votes[vote] = votes[vote].includes(pName)
      ? votes[vote].filter(n => n !== pName)
      : [...votes[vote], pName]
    return { ...i, votes }
  }))
}

export async function clearAllIdees() {
  await mutateIdees(() => [])
}

export async function addIdee({ text, moduleLabel, moduleId, auteur }) {
  const newIdee = {
    id: Date.now().toString(),
    text: text.trim(),
    moduleId: moduleId || 'libre',
    moduleLabel: moduleLabel || 'Thème libre',
    pageLabel: 'Ajout direct',
    auteur: auteur || 'Formateur',
    timestamp: new Date().toISOString(),
  }
  await mutateIdees(idees => [...idees, newIdee])
}

// ── Composant bouton flottant ─────────────────────────────────────
export default function IdeesButton({ moduleId, pName }) {
  const isMobile = useIsMobile()
  const [open, setOpen] = useState(false)
  const [text, setText] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const moduleData = MODULE_DATA[moduleId] || null

  const handleSave = async () => {
    if (!text.trim()) return
    setSaving(true)
    try {
      let pageIndex = 0
      try {
        const rows = await sbSelect('sessions', `code=eq.${getActiveSessionCode()}`)
        pageIndex = rows?.[0]?.module_page ?? 0
      } catch {}

      let pageLabel
      if (pageIndex === -1) {
        pageLabel = 'Lobby'
      } else if (pageIndex === 200) {
        pageLabel = 'Résultats'
      } else if (pageIndex >= 100) {
        const qIdx = pageIndex - 100
        const q = moduleData?.quiz?.[qIdx]
        pageLabel = q?.question
          ? `Quiz — Question ${qIdx + 1} : ${q.question.slice(0, 60)}${q.question.length > 60 ? '…' : ''}`
          : `Quiz — Question ${qIdx + 1}`
      } else {
        const page = moduleData?.pages?.[pageIndex]
        pageLabel = page?.titre
          ? `Slide ${pageIndex + 1} — ${page.titre}`
          : `Slide ${pageIndex + 1}`
      }

      const newIdee = {
        id: Date.now().toString(),
        text: text.trim(),
        moduleId,
        moduleLabel: moduleData?.label || moduleId,
        pageIndex,
        pageLabel,
        auteur: pName || 'Formateur',
        timestamp: new Date().toISOString(),
      }

      await mutateIdees(idees => [...idees, newIdee])

      setText('')
      setSaved(true)
      setTimeout(() => { setSaved(false); setOpen(false) }, 900)
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      {/* Bouton flottant */}
      <button
        onClick={() => setOpen(true)}
        title="Noter une idée"
        style={{
          position: 'fixed',
          bottom: isMobile ? 90 : 28,
          right: isMobile ? undefined : 28,
          left: isMobile ? 14 : undefined,
          zIndex: 900,
          width: isMobile ? 48 : 52, height: isMobile ? 48 : 52, borderRadius: '50%',
          background: 'linear-gradient(135deg, #d97706, #f59e0b)',
          border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 22, boxShadow: '0 4px 18px rgba(245,158,11,0.45)',
          transition: 'transform .15s, box-shadow .15s',
        }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.1)'; e.currentTarget.style.boxShadow = '0 6px 24px rgba(245,158,11,0.6)' }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 4px 18px rgba(245,158,11,0.45)' }}
      >
        💡
      </button>

      {/* Backdrop + modal */}
      {open && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
          onClick={() => setOpen(false)}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: '#0d1f3c', border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 20, padding: '28px 32px', width: 500, maxWidth: '92vw',
              boxShadow: '0 24px 60px rgba(0,0,0,0.5)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 20, fontWeight: 800, color: '#fff', marginBottom: 4 }}>💡 Nouvelle idée</div>
                {moduleData && (
                  <div style={{
                    display: 'inline-flex', alignItems: 'center',
                    background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.3)',
                    borderRadius: 20, padding: '2px 12px',
                    fontSize: 11, fontWeight: 700, color: '#f59e0b', letterSpacing: 0.8,
                  }}>
                    {moduleData.label}
                  </div>
                )}
              </div>
              <button
                onClick={() => setOpen(false)}
                style={{ background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: 8, width: 32, height: 32, cursor: 'pointer', color: 'rgba(255,255,255,0.5)', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >✕</button>
            </div>

            <textarea
              autoFocus
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder="Décrivez votre idée…"
              rows={4}
              style={{
                width: '100%', boxSizing: 'border-box',
                background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: 12, padding: '14px 16px', resize: 'vertical',
                color: '#fff', fontSize: 14, fontFamily: 'inherit', lineHeight: 1.6,
                outline: 'none',
              }}
              onFocus={e => { e.target.style.borderColor = 'rgba(245,158,11,0.5)' }}
              onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.15)' }}
              onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSave() }}
            />
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', marginTop: 6, marginBottom: 20 }}>
              ⌘/Ctrl + Entrée pour enregistrer
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button
                onClick={() => setOpen(false)}
                style={{
                  background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)',
                  color: 'rgba(255,255,255,0.6)', padding: '10px 20px', borderRadius: 10,
                  fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                }}
              >Annuler</button>
              <button
                onClick={handleSave}
                disabled={!text.trim() || saving}
                style={{
                  background: saved
                    ? 'rgba(74,222,128,0.2)'
                    : (!text.trim() || saving)
                      ? 'rgba(255,255,255,0.08)'
                      : 'linear-gradient(135deg, #d97706, #f59e0b)',
                  border: saved ? '1px solid rgba(74,222,128,0.4)' : 'none',
                  color: saved ? '#4ade80' : (!text.trim() || saving) ? 'rgba(255,255,255,0.3)' : '#fff',
                  padding: '10px 24px', borderRadius: 10, fontSize: 13, fontWeight: 700,
                  cursor: (!text.trim() || saving) ? 'default' : 'pointer', fontFamily: 'inherit',
                  transition: 'all .2s',
                }}
              >
                {saved ? '✓ Enregistré !' : saving ? '…' : 'Enregistrer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
