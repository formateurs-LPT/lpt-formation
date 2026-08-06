'use client'
import { useState, useEffect } from 'react'
import { sbSelect, getActiveSessionCode } from '@/lib/supabase'
import { isTrainerAccount } from '@/lib/participantNames'

/**
 * Classement complet (nombre de bonnes réponses, pas les points) pour le
 * formateur — affiché pendant le podium interstitiel toutes les 5 questions,
 * pendant que le diffuseur montre le podium top 3 et que chaque formé voit
 * sa position personnelle sur son téléphone.
 */
export function useTrainerQuizRanking(moduleId, qIdx) {
  const [ranking, setRanking] = useState([])

  useEffect(() => {
    if (qIdx == null) return
    let cancelled = false
    const load = async () => {
      try {
        const code = getActiveSessionCode()
        const rows = await sbSelect('quiz_answers', `session_code=eq.${encodeURIComponent(code)}&module_id=eq.${encodeURIComponent(moduleId)}`)
        const grouped = {}
        ;(rows || [])
          .filter(r => r.question_idx <= qIdx && !isTrainerAccount(r.collaborateur))
          .forEach(r => {
            if (!(r.collaborateur in grouped)) grouped[r.collaborateur] = 0
            if (r.is_correct) grouped[r.collaborateur]++
          })
        const sorted = Object.entries(grouped)
          .map(([name, score]) => ({ name, score }))
          .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name))
        if (!cancelled) setRanking(sorted)
      } catch { /* best-effort */ }
    }
    load()
    const t = setInterval(load, 2000)
    return () => { cancelled = true; clearInterval(t) }
  }, [moduleId, qIdx])

  return ranking
}

export function TrainerQuizRankingList({ moduleId, qIdx, accent = '#00abe9' }) {
  const ranking = useTrainerQuizRanking(moduleId, qIdx)
  const MEDALS = ['🥇', '🥈', '🥉']

  return (
    <div style={{ width: '100%', maxWidth: 460, display: 'flex', flexDirection: 'column', gap: 8, maxHeight: '46vh', overflowY: 'auto', padding: '0 4px' }}>
      {ranking.length === 0 ? (
        <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: 13, padding: '16px 0' }}>Aucune réponse pour l&apos;instant</div>
      ) : ranking.map((p, i) => (
        <div key={p.name} style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
          background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)',
          borderRadius: 12, padding: '10px 16px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
            <span style={{ fontSize: 16, width: 26, textAlign: 'center', flexShrink: 0 }}>{i < 3 ? MEDALS[i] : `${i + 1}.`}</span>
            <span style={{ fontSize: 14, fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</span>
          </div>
          <span style={{ fontSize: 14, fontWeight: 800, color: accent, flexShrink: 0 }}>{p.score} bonne{p.score > 1 ? 's' : ''} réponse{p.score > 1 ? 's' : ''}</span>
        </div>
      ))}
    </div>
  )
}
