// Atelier tunnel SAV (27/11) — Kevin et Quentin dessinent les flux de l'app
// SAV en cartes, à deux et en direct.
//
// Données : table Supabase atelier_tunnel_sav (cf. supabase/create-atelier-tunnel-sav.sql),
// une ligne par carte (flux, id) + une ligne id = '_flux' pour le nom du flux.
// Direct : Supabase Realtime en broadcast (curseurs, déplacements, « j'ai
// modifié tel flux ») ; en secours, relecture de la base toutes les 3 s.
//
// L'éditeur (src/components/tunnelSav/editeurTunnelSav.js) parle à trois
// petits adaptateurs : db (doc / collection / onSnapshot), room (presence /
// onPeers) et user (profiles), construits ici.
import { getTrainerAvatarKey } from '@/lib/constants'

const SB_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const SB_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''
const TABLE = 'atelier_tunnel_sav'
const SUJET = 'realtime:atelier-tunnel-sav'
const RELECTURE_MS = 3000
const PRESENCE_MS = 2000
const PERIME_MS = 7000

export const ACCES_TUNNEL_SAV = ['kevin', 'quentin']
export const peutUtiliserTunnelSav = pName => ACCES_TUNNEL_SAV.includes(getTrainerAvatarKey(pName))

const entetes = () => ({ apikey: SB_KEY, Authorization: 'Bearer ' + SB_KEY, 'Content-Type': 'application/json' })
const cap = s => (s ? s.charAt(0).toUpperCase() + s.slice(1) : '')

async function lire(filtre) {
  const r = await fetch(`${SB_URL}/rest/v1/${TABLE}?select=flux,id,data,supprime&${filtre}`, { headers: entetes(), cache: 'no-store' })
  if (!r.ok) throw new Error('lecture ' + r.status)
  return r.json()
}

async function ecrire(ligne) {
  const r = await fetch(`${SB_URL}/rest/v1/${TABLE}?on_conflict=flux,id`, {
    method: 'POST',
    headers: { ...entetes(), Prefer: 'resolution=merge-duplicates,return=minimal' },
    body: JSON.stringify(ligne),
  })
  if (!r.ok) {
    const err = await r.json().catch(() => ({}))
    throw new Error(err?.message || 'écriture ' + r.status)
  }
}

// « tunnels/T » → { flux: T, id: '_flux' } ; « tunnels/T/cases/C » → { flux: T, id: C }
function cle(chemin) {
  const p = chemin.split('/')
  if (p[0] !== 'tunnels') return null
  if (p.length === 2) return { flux: p[1], id: '_flux' }
  if (p.length === 4 && p[2] === 'cases') return { flux: p[1], id: p[3] }
  return null
}

export function creerBackend({ moi, cleFormateur }) {
  const peer = Math.random().toString(36).slice(2, 10)
  const abonnements = new Set()
  let ws = null, ref = 1, battement = null, relecture = null, presenceTimer = null, ferme = false
  let maPresence = {}
  const pairs = new Map() // peer → { by, presence, vu }
  const ecouteursPairs = new Set()

  /* ---------- temps réel (Phoenix / Supabase Realtime) ---------- */
  function envoyer(event, payload) {
    if (!ws || ws.readyState !== 1) return
    ws.send(JSON.stringify({ topic: SUJET, event: 'broadcast', payload: { type: 'broadcast', event, payload }, ref: String(ref++) }))
  }
  function connecter() {
    if (ferme || !SB_URL) return
    try {
      ws = new WebSocket(SB_URL.replace(/^http/, 'ws') + '/realtime/v1/websocket?apikey=' + SB_KEY + '&vsn=1.0.0')
    } catch { setTimeout(connecter, 3000); return }
    ws.onopen = () => {
      ws.send(JSON.stringify({ topic: SUJET, event: 'phx_join', ref: String(ref++),
        payload: { config: { broadcast: { self: false, ack: false }, presence: { key: '' }, private: false }, access_token: SB_KEY } }))
      clearInterval(battement)
      battement = setInterval(() => { if (ws && ws.readyState === 1) ws.send(JSON.stringify({ topic: 'phoenix', event: 'heartbeat', payload: {}, ref: String(ref++) })) }, 25000)
      envoyer('pres', { peer, by: cleFormateur, presence: maPresence })
    }
    ws.onmessage = e => {
      let m; try { m = JSON.parse(e.data) } catch { return }
      if (m.event !== 'broadcast' || !m.payload) return
      const { event, payload } = m.payload
      if (event === 'pres' && payload && payload.peer && payload.peer !== peer) {
        pairs.set(payload.peer, { by: payload.by, presence: payload.presence || {}, vu: Date.now() })
        signalerPairs()
      } else if (event === 'depart' && payload && payload.peer) {
        pairs.delete(payload.peer); signalerPairs()
      } else if (event === 'maj' && payload && payload.flux) {
        abonnements.forEach(a => { if (a.flux === payload.flux || a.flux === null) a.relire() })
      }
    }
    ws.onclose = () => { clearInterval(battement); if (!ferme) setTimeout(connecter, 3000) }
    ws.onerror = () => { try { ws.close() } catch { /* déjà fermé */ } }
  }
  function signalerPairs() {
    const maintenant = Date.now()
    pairs.forEach((p, k) => { if (maintenant - p.vu > PERIME_MS) pairs.delete(k) })
    const liste = [{ peer, by: cleFormateur, isMe: true, kind: 'viewer', presence: maPresence }]
      .concat([...pairs.entries()].map(([k, p]) => ({ peer: k, by: p.by, isMe: false, kind: 'viewer', presence: p.presence })))
    ecouteursPairs.forEach(fn => { try { fn({ peers: liste }) } catch { /* écouteur en erreur */ } })
  }

  /* ---------- base : abonnements relus régulièrement ---------- */
  function abonner(fluxOuNull, filtre, versDocs, fn, onErr) {
    const a = { flux: fluxOuNull, signature: null }
    a.relire = async () => {
      try {
        const lignes = await lire(filtre)
        const docs = versDocs(lignes)
        const sig = JSON.stringify(docs.map(d => [d.id, d._brut]))
        if (sig === a.signature) return
        a.signature = sig
        fn({ docs: docs.map(d => ({ id: d.id, data: () => d._brut })), metadata: { fromCache: false } })
      } catch (e) { if (onErr) onErr(e) }
    }
    abonnements.add(a)
    a.relire()
    return () => abonnements.delete(a)
  }

  const db = {
    doc(chemin) {
      const k = cle(chemin)
      return {
        set: o => k ? ecrire({ flux: k.flux, id: k.id, data: o, supprime: false, maj_par: moi }).then(() => envoyer('maj', { flux: k.id === '_flux' ? null : k.flux })) : Promise.reject(new Error('chemin')),
        delete: () => k ? ecrire({ flux: k.flux, id: k.id, supprime: true, maj_par: moi }).then(() => envoyer('maj', { flux: k.id === '_flux' ? null : k.flux })) : Promise.reject(new Error('chemin')),
      }
    },
    collection(chemin) {
      const p = chemin.split('/')
      return {
        onSnapshot(fn, onErr) {
          if (chemin === 'tunnels') {
            return abonner(null, 'id=eq._flux&supprime=eq.false', lignes => lignes.map(l => ({ id: l.flux, _brut: l.data })), fn, onErr)
          }
          if (p[0] === 'tunnels' && p[2] === 'cases') {
            const flux = p[1]
            return abonner(flux, `flux=eq.${encodeURIComponent(flux)}&id=neq._flux&supprime=eq.false`, lignes => lignes.map(l => ({ id: l.id, _brut: l.data })), fn, onErr)
          }
          return () => {}
        },
      }
    },
  }

  const room = {
    presence(patch) {
      maPresence = { ...maPresence, ...patch }
      envoyer('pres', { peer, by: cleFormateur, presence: maPresence })
      return Promise.resolve()
    },
    onPeers(fn) { ecouteursPairs.add(fn); signalerPairs(); return () => ecouteursPairs.delete(fn) },
  }

  const user = {
    profiles(ids) {
      const r = {}
      ids.forEach(id => { r[id] = { id, name: cap(id) } })
      return Promise.resolve(r)
    },
  }

  connecter()
  relecture = setInterval(() => abonnements.forEach(a => a.relire()), RELECTURE_MS)
  presenceTimer = setInterval(() => { envoyer('pres', { peer, by: cleFormateur, presence: maPresence }); signalerPairs() }, PRESENCE_MS)

  return {
    use: nom => Promise.resolve(nom === 'db' ? db : nom === 'room' ? room : nom === 'user' ? user : null),
    fermer() {
      ferme = true
      envoyer('depart', { peer })
      clearInterval(relecture); clearInterval(presenceTimer); clearInterval(battement)
      abonnements.clear(); ecouteursPairs.clear()
      try { ws && ws.close() } catch { /* déjà fermé */ }
    },
  }
}
