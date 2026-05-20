'use client'
import { useState, useEffect } from 'react'
import { sbSelect, SESSION_CODE } from '@/lib/supabase'

export function useModuleSync(interval = 1500) {
  const [state, setState] = useState({ activeModule: null, modulePage: 0, loading: true })

  useEffect(() => {
    const poll = async () => {
      try {
        const rows = await sbSelect('sessions', 'code=eq.' + SESSION_CODE)
        if (rows?.[0]) {
          setState({
            activeModule: rows[0].active_module || null,
            modulePage: rows[0].module_page || 0,
            loading: false,
          })
        }
      } catch { setState(s => ({ ...s, loading: false })) }
    }
    poll()
    const t = setInterval(poll, interval)
    return () => clearInterval(t)
  }, [interval])

  return state
}
