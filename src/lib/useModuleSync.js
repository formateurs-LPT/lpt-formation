'use client'
import { useState, useEffect } from 'react'
import { sbSelect, SESSION_CODE } from '@/lib/supabase'

export function useModuleSync(interval = 1200) {
  const [state, setState] = useState({ activeModule: null, modulePage: 0, loading: true })

  useEffect(() => {
    const poll = async () => {
      try {
        const rows = await sbSelect('sessions', 'code=eq.' + SESSION_CODE)
        if (rows && rows.length > 0) {
          setState({
            activeModule: rows[0].active_module ?? null,
            modulePage: rows[0].module_page ?? 0,
            loading: false,
          })
        } else {
          // rows vide : on sort du loading mais pas de module actif
          setState(s => ({ ...s, loading: false }))
          console.warn('[useModuleSync] Aucune session trouvée pour', SESSION_CODE)
        }
      } catch(e) {
        setState(s => ({ ...s, loading: false }))
        console.error('[useModuleSync] Erreur polling:', e)
      }
    }
    poll()
    const t = setInterval(poll, interval)
    return () => clearInterval(t)
  }, [interval])

  return state
}
