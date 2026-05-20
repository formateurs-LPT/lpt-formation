'use client'
import { useState, useEffect } from 'react'
import { sbSelect, sbUpsert } from '@/lib/supabase'
import { WEATHER_PHRASES, WEATHER_PHRASES_DEFAULT } from '@/lib/constants'
import TrainerAvatar from './TrainerAvatar'

export default function WeatherWidget({ pName, onToast }) {
  const [rows, setRows] = useState([])
  const myTrainer = (pName || '').toLowerCase().split(' ')[0]

  const fetchWeather = async () => {
    const local = JSON.parse(localStorage.getItem('weather_local') || '{}')
    let sbRows = []
    try { sbRows = await sbSelect('trainer_weather') } catch (e) {}
    const merged = {}
    sbRows.forEach(r => { merged[r.trainer] = r })
    Object.values(local).forEach(r => { if (!merged[r.trainer]) merged[r.trainer] = r })
    setRows(Object.values(merged))
  }

  useEffect(() => {
    fetchWeather()
    const interval = setInterval(fetchWeather, 30000)
    return () => clearInterval(interval)
  }, [])

  const setWeather = async (emoji, label) => {
    const local = JSON.parse(localStorage.getItem('weather_local') || '{}')
    local[myTrainer] = { trainer: myTrainer, weather: emoji, label, updated_at: new Date().toISOString() }
    localStorage.setItem('weather_local', JSON.stringify(local))
    const result = await sbUpsert('trainer_weather', { trainer: myTrainer, weather: emoji, label, updated_at: new Date().toISOString() }, 'trainer').catch(() => null)
    if (!result) onToast(`⚠️ Sync Supabase échouée (trainer: ${myTrainer})`)
    else onToast(`Météo enregistrée : ${emoji} ${label}`)
    fetchWeather()
  }

  const myRow = rows.find(r => r.trainer === myTrainer)
  const activeMap = { '☀️': 'sun', '⛅': 'cloud', '🌧️': 'rain' }
  const activeBtn = myRow ? activeMap[myRow.weather] : null

  const trainers = ['kevin', 'quentin', 'nadege']
  const trainerRows = trainers.map(t => rows.find(r => r.trainer === t)).filter(Boolean)

  return (
    <div className="dash-tile" style={{ cursor: 'default' }}>
      <div className="dash-tile-top">
        <div className="dash-tile-icon">🌤️</div>
        <span style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,.4)', letterSpacing: '.4px' }}>Météo de la promo</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', gap: 4, margin: '10px 0 12px' }}>
        {[['☀️','Excellent','sun'],['⛅','Correct','cloud'],['🌧️','Difficile','rain']].map(([emoji, label, key]) => (
          <button key={key} className={`weather-btn ${activeBtn === key ? 'active' : ''}`} onClick={() => setWeather(emoji, label)}>
            {emoji}
          </button>
        ))}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {trainerRows.length === 0 ? (
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,.25)', textAlign: 'center', padding: '8px 0' }}>Cliquez sur une météo pour démarrer ☝️</p>
        ) : trainerRows.map(row => {
          const t = row.trainer
          const phrasesObj = WEATHER_PHRASES[t] || WEATHER_PHRASES_DEFAULT
          const pool = Array.isArray(phrasesObj[row.weather]) ? phrasesObj[row.weather] : []
          const seed = Math.floor(new Date(row.updated_at || 0).getTime() / 1000)
          const phrase = pool.length > 0 ? pool[seed % pool.length] : ''
          const timeStr = row.updated_at ? new Date(row.updated_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : ''
          const isMe = t === myTrainer
          return (
            <div key={t} style={{
              display: 'flex', alignItems: 'flex-start', gap: 9, padding: '8px 10px',
              borderRadius: 10,
              background: isMe ? 'rgba(0,171,233,.1)' : 'rgba(255,255,255,.04)',
              border: `1px solid ${isMe ? 'rgba(0,171,233,.25)' : 'transparent'}`
            }}>
              <TrainerAvatar name={t} size={28} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#fff' }}>{t.charAt(0).toUpperCase() + t.slice(1)}</span>
                  <span style={{ fontSize: 16, lineHeight: 1 }}>{row.weather}</span>
                  <span style={{ fontSize: 10, color: 'rgba(255,255,255,.3)', marginLeft: 'auto' }}>{row.label}{timeStr ? ' · ' + timeStr : ''}</span>
                </div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,.45)', lineHeight: 1.4 }}>{phrase}</div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
