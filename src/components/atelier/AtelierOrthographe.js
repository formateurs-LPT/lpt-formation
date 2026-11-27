'use client'
// Menu « ✍️ Orthographe » de la barre du projet (correcteur maison, 24/11) :
// la liste des fautes, la correction en un clic, un clic sur le texte emmène
// à la case. Le dictionnaire n'est chargé qu'à la première ouverture.
import { useMemo, useState } from 'react'
import { chargerDico, verifierProjet } from '@/lib/atelierOrthographe'

const NAVY = '#03112a', TRAIT = '#e3e6ee', DOUX = '#64748b', VIOLET = '#7c3aed'
const CLE_IGNORES = 'atelier_orthographe_ignores'

const lireIgnores = () => {
  try { return new Set(JSON.parse(localStorage.getItem(CLE_IGNORES) || '[]')) } catch { return new Set() }
}

export default function AtelierOrthographe({ projet, lectureSeule, onAllerCase, onCorriger }) {
  const [ouvert, setOuvert] = useState(false)
  const [dico, setDico] = useState(null)
  const [etat, setEtat] = useState('rien') // rien | chargement | pret | erreur
  const [ignores, setIgnores] = useState(lireIgnores)

  const fautes = useMemo(() => (dico ? verifierProjet(projet, dico, ignores) : []), [projet, dico, ignores])

  const ouvrir = async () => {
    setOuvert(o => !o)
    if (dico || etat === 'chargement') return
    setEtat('chargement')
    try { setDico(await chargerDico()); setEtat('pret') } catch { setEtat('erreur') }
  }
  const ignorer = mot => {
    const n = new Set(ignores); n.add(mot.toLowerCase()); setIgnores(n)
    try { localStorage.setItem(CLE_IGNORES, JSON.stringify([...n])) } catch { /* navigation privée */ }
  }

  const libelle = etat === 'chargement' ? '✍️ Lecture…' : !dico ? '✍️ Orthographe'
    : fautes.length ? `✍️ ${fautes.length} faute${fautes.length > 1 ? 's' : ''} ?` : '✍️ Aucune faute'
  return (
    <div style={{ position: 'relative', flexShrink: 0, whiteSpace: 'nowrap' }}>
      <button onClick={ouvrir} className="at-alerte" title="Vérifier l’orthographe de toute la simulation"
        style={{ color: dico ? (fautes.length ? VIOLET : '#16a34a') : DOUX, fontWeight: dico ? 800 : 600 }}>
        {libelle} <span style={{ fontSize: 10 }}>{ouvert ? '▲' : '▼'}</span>
      </button>
      {ouvert && (
        <>
          <div onClick={() => setOuvert(false)} style={{ position: 'fixed', inset: 0, zIndex: 40 }} />
          <div style={{ position: 'absolute', top: 30, left: 0, zIndex: 41, width: 440, maxHeight: 460, overflowY: 'auto', background: '#fff', borderRadius: 14, boxShadow: '0 18px 50px rgba(3,17,42,0.22)', border: `1px solid ${TRAIT}`, padding: 6, whiteSpace: 'normal', animation: 'atApparait .15s ease both' }}>
            <div style={{ fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', color: DOUX, fontWeight: 700, padding: '8px 10px 6px' }}>
              Orthographe · {lectureSeule ? 'lecture seule' : 'clique sur la correction'}
            </div>
            {etat === 'chargement' && <div style={{ padding: '10px 12px', fontSize: 14, color: DOUX }}>Chargement du dictionnaire…</div>}
            {etat === 'erreur' && <div style={{ padding: '10px 12px', fontSize: 14, color: '#dc2626' }}>Le dictionnaire n’a pas pu être chargé. Vérifie ta connexion et réessaie.</div>}
            {dico && !fautes.length && <div style={{ padding: '10px 12px', fontSize: 14, color: '#16a34a', fontWeight: 700 }}>✓ Aucune faute trouvée dans la simulation.</div>}
            {fautes.map(f => {
              const avant = f.texte.slice(Math.max(0, f.debut - 32), f.debut), apres = f.texte.slice(f.fin, f.fin + 32)
              return (
                <div key={f.cle} style={{ padding: '8px 10px', borderRadius: 9, borderBottom: `1px solid ${TRAIT}` }}>
                  <button onClick={() => { setOuvert(false); onAllerCase(f.id) }} title="Aller à la case"
                    style={{ display: 'block', width: '100%', textAlign: 'left', border: 'none', background: 'none', padding: 0, cursor: 'pointer', fontFamily: 'inherit', color: NAVY }}>
                    <span style={{ display: 'block', fontSize: 11, fontWeight: 700, color: DOUX, textTransform: 'uppercase', letterSpacing: 1 }}>{f.champ} →</span>
                    <span style={{ display: 'block', fontSize: 14, lineHeight: 1.4, marginTop: 2 }}>
                      {f.debut > 32 && '…'}{avant}
                      <mark style={{ background: '#ede9fe', color: VIOLET, fontWeight: 800, borderRadius: 3, padding: '0 2px', textDecoration: 'underline wavy #a78bfa' }}>{f.extrait.trim() ? f.extrait : '␣'}</mark>
                      {apres}{f.fin + 32 < f.texte.length && '…'}
                    </span>
                    <span style={{ display: 'block', fontSize: 12, color: DOUX, marginTop: 2 }}>{f.message}</span>
                  </button>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
                    {!lectureSeule && f.suggestions.map(s => (
                      <button key={s} onClick={() => onCorriger(f, s)} style={{ border: 'none', background: '#16a34a', color: '#fff', borderRadius: 7, padding: '4px 10px', fontSize: 13, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>
                        {s === '' ? 'Supprimer' : s.trim() ? `→ ${s}` : 'Un seul espace'}
                      </button>
                    ))}
                    <button onClick={() => ignorer(f.extrait)} title="Ne plus signaler ce mot sur cet ordinateur" style={{ border: `1px solid ${TRAIT}`, background: '#fff', color: DOUX, borderRadius: 7, padding: '4px 10px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Ignorer</button>
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
