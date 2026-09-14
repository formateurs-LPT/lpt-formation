'use client'
import { useState, useEffect } from 'react'
import { sbSelect, sbUpsert, sbDelete } from '@/lib/supabase'
import { scoreToStatus, todayISO } from '@/lib/storeFollowupData'

// Couche données du suivi magasin — partagée par la vue formateur
// (StoreFollowupView) et la vue manager (/manager), pour qu'aucune des deux
// n'écrive dans store_followup_progress avec une logique divergente.
// `actorName` alimente `updated_by` (nom du formateur ou du manager).
export function useStoreFollowupProgress(storeId, actorName) {
  // progress : `${collaborateurId}:${itemId}` -> entrée la plus récente.
  // history : même clé -> entrées plus anciennes (audits précédents), jamais écrasées.
  const [progress, setProgress] = useState({})
  const [history, setHistory] = useState({})
  const [saveError, setSaveError] = useState(false)

  useEffect(() => {
    if (!storeId) return
    let cancelled = false
    sbSelect('store_followup_progress', `store=eq.${encodeURIComponent(storeId)}&order=audit_date.desc`).then(rows => {
      if (cancelled) return
      const byKey = {}
      for (const r of (rows || [])) {
        const key = `${r.collaborateur}:${r.item_id}`
        if (!byKey[key]) byKey[key] = []
        byKey[key].push(r)
      }
      const map = {}
      const hist = {}
      for (const [key, entries] of Object.entries(byKey)) {
        const [latest, ...rest] = entries
        map[key] = { status: latest.status, score: latest.score ?? null, note: latest.note || '', audit_date: latest.audit_date }
        hist[key] = rest
      }
      setProgress(map)
      setHistory(hist)
    }).catch(() => {})
    return () => { cancelled = true }
  }, [storeId])

  const persist = async (collabId, itemId, patch) => {
    const key = `${collabId}:${itemId}`
    const current = progress[key] || { status: 'non_acquis', score: null, note: '' }
    const today = todayISO()
    const next = { ...current, ...patch, audit_date: today }

    // Si la dernière valeur connue datait d'un jour précédent, elle bascule
    // dans l'historique local (visible immédiatement, sans recharger).
    if (current.audit_date && current.audit_date !== today) {
      setHistory(h => ({ ...h, [key]: [current, ...(h[key] || [])] }))
    }
    setProgress(p => ({ ...p, [key]: next }))

    const result = await sbUpsert('store_followup_progress', {
      store: storeId,
      collaborateur: collabId,
      item_id: itemId,
      audit_date: today,
      status: next.status,
      score: next.score ?? null,
      note: next.note || null,
      updated_by: actorName || null,
      updated_at: new Date().toISOString(),
    }, 'store,collaborateur,item_id,audit_date')
    setSaveError(result === null)
  }

  // La note (1-5) pilote seule le statut — pas de modification directe.
  const setScore = (collabId, itemId, score) => {
    persist(collabId, itemId, { score, status: scoreToStatus(score) })
  }

  const saveNote = (collabId, itemId, note) => {
    persist(collabId, itemId, { note })
  }

  // Supprime définitivement toute trace de cet item (note, statut, historique)
  // pour ce collaborateur — utile pour annuler un test ou une erreur de saisie.
  const reset = async (collabId, itemId) => {
    const key = `${collabId}:${itemId}`
    setProgress(p => { const n = { ...p }; delete n[key]; return n })
    setHistory(h => { const n = { ...h }; delete n[key]; return n })
    const ok = await sbDelete(
      'store_followup_progress',
      `store=eq.${encodeURIComponent(storeId)}&collaborateur=eq.${encodeURIComponent(collabId)}&item_id=eq.${encodeURIComponent(itemId)}`
    )
    setSaveError(!ok)
  }

  return { progress, history, saveError, setScore, saveNote, reset }
}
