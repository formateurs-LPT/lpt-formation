'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import Image from 'next/image'
import { sbSelect, sbUpsert, getActiveSessionCode } from '@/lib/supabase'
import { generatePin } from '@/lib/pin'
import { MODULES, PREFIXE_SESSION, urlModule } from '@/lib/modulesApresFormation'

// Module après-formation lancé en session : le formateur le lance depuis la
// journée (active_module = 'apf-<id>'), chaque formé le fait en autonomie sur
// son téléphone (cours, entraînement, test), et le score du test est
// enregistré dans module_results pour compter dans son score de formation.
// Même module HTML et mêmes ponts que /mes-modules.

const TOTAL_TEST = 12

function aujourdhui() {
  return new Date().toISOString().slice(0, 10)
}

/** Garde le meilleur score du jour (un formé peut repasser le test). Le
 * code de salle sert à l'écran du formateur ; le score, lui, compte dans la
 * formation du formé quelle que soit la salle (voir scoring.js). */
async function enregistrerTest(pName, module, score, sessionCode, details) {
  const nom = (pName || '').trim()
  if (!nom || !Number.isInteger(score) || score < 0 || score > TOTAL_TEST) return false
  const moduleId = PREFIXE_SESSION + module.id
  const jour = aujourdhui()
  const existants = await sbSelect('module_results', `collaborateur=eq.${encodeURIComponent(nom)}&module_id=eq.${moduleId}&week_date=eq.${jour}&select=score`)
  if ((existants?.[0]?.score ?? -1) >= score) return true
  const ligne = {
    collaborateur: nom,
    pin: generatePin(nom),
    week_date: jour,
    module_id: moduleId,
    score,
    score_total: TOTAL_TEST,
    xp: score * 10,
    completed_at: new Date().toISOString(),
    session_code: sessionCode || null,
  }
  // details = réponses du test (pour le récap du formateur) ; colonne
  // ajoutée par supabase/add-module-results-details.sql — sans elle, on
  // enregistre quand même le score.
  const avecDetails = Array.isArray(details) && details.length
    ? await sbUpsert('module_results', { ...ligne, details }, 'collaborateur,module_id,week_date')
    : null
  return avecDetails || sbUpsert('module_results', ligne, 'collaborateur,module_id,week_date')
}

/** Résultats du jour pour ce module dans la salle, relus régulièrement. */
function useResultatsDuJour(module, sessionCode, intervalleMs = 5000) {
  const [resultats, setResultats] = useState([])
  useEffect(() => {
    let annule = false
    const charger = async () => {
      const salle = sessionCode ? `&session_code=eq.${encodeURIComponent(sessionCode)}` : ''
      const rows = await sbSelect('module_results', `module_id=eq.${PREFIXE_SESSION}${module.id}&week_date=eq.${aujourdhui()}${salle}&order=score.desc`)
      if (!annule) setResultats(rows || [])
    }
    charger()
    const t = setInterval(charger, intervalleMs)
    return () => { annule = true; clearInterval(t) }
  }, [module.id, sessionCode, intervalleMs])
  return resultats
}

// ── Téléphone du formé ───────────────────────────────────────────────────
export function ModuleApresFormationParticipant({ module, pName, sessionCode }) {
  const iframeRef = useRef(null)
  const [alerte, setAlerte] = useState(null)
  // URL figée : la changer rechargerait le module en plein exercice. État
  // de départ vierge (bridge-avant.js), pour qu'un téléphone partagé ne
  // reprenne pas la progression de quelqu'un d'autre.
  const [src] = useState(() => urlModule(module, { faits: '', acquis: '0' }))

  const surMessage = useCallback(async data => {
    if (data.type !== 'test') return
    const score = Number(data.score)
    const details = Array.isArray(data.details)
      ? data.details.slice(0, TOTAL_TEST).map(d => ({ libelle: String(d?.libelle || '').slice(0, 500), correct: !!d?.correct }))
      : null
    const ok = await enregistrerTest(pName, module, score, sessionCode, details)
    setAlerte(!ok
      ? 'Ton résultat n\'a pas pu être enregistré. Repasse le test dans un instant.'
      : score >= 10 ? `✅ Test réussi : ${score}/${TOTAL_TEST}, c'est enregistré !` : `Test enregistré : ${score}/${TOTAL_TEST}. Tu peux le retenter.`)
    setTimeout(() => setAlerte(null), 4500)
  }, [pName, module, sessionCode])

  useEffect(() => {
    const ecouter = event => {
      if (event.origin !== window.location.origin) return
      if (event.source !== iframeRef.current?.contentWindow) return
      const data = event.data
      if (!data || data.source !== 'lpt-module' || data.module !== module.id) return
      surMessage(data)
    }
    window.addEventListener('message', ecouter)
    return () => window.removeEventListener('message', ecouter)
  }, [module.id, surMessage])

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1100, display: 'flex', flexDirection: 'column', background: '#f2f2f7', paddingTop: 'calc(env(safe-area-inset-top, 0px) + 56px)', boxSizing: 'border-box' }}>
      <iframe ref={iframeRef} src={src} title={module.nom} style={{ flex: 1, width: '100%', border: 0, display: 'block' }} />
      {alerte && (
        <div role="status" style={{
          position: 'fixed', left: 16, right: 16, bottom: 'calc(16px + env(safe-area-inset-bottom, 0px))', zIndex: 10,
          background: '#14161a', color: '#fff', borderRadius: 14, padding: '14px 16px', fontSize: 15, fontWeight: 600,
          textAlign: 'center', boxShadow: '0 10px 30px rgba(0,0,0,0.25)', fontFamily: 'inherit',
        }}>{alerte}</div>
      )}
    </div>
  )
}

// ── Écran du formateur ───────────────────────────────────────────────────
export default function ModuleApresFormationFormateur({ moduleId, onBack }) {
  const module = MODULES.find(m => PREFIXE_SESSION + m.id === moduleId)
  if (!module) return null
  return <EcranFormateur module={module} onBack={onBack} />
}

function erreursDe(r) {
  return Array.isArray(r.details) ? r.details.filter(d => !d.correct) : null
}

function EcranFormateur({ module, onBack }) {
  const [sessionCode] = useState(() => getActiveSessionCode())
  const resultats = useResultatsDuJour(module, sessionCode)
  const reussis = resultats.filter(r => r.score >= 10).length
  // Questions ratées par le groupe, de la plus ratée à la moins ratée.
  const parQuestion = {}
  for (const r of resultats) {
    for (const d of erreursDe(r) || []) (parQuestion[d.libelle] ||= []).push(r.collaborateur)
  }
  const plusRatees = Object.entries(parQuestion).sort((a, b) => b[1].length - a[1].length)

  return (
    <div style={{ minHeight: '100vh', background: '#03112a', color: '#fff', fontFamily: 'inherit', padding: '84px 24px 24px', boxSizing: 'border-box' }}>
      <button onClick={onBack} style={{
        background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.7)',
        fontSize: 13, fontWeight: 600, padding: '8px 16px', borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit',
      }}>← Terminer le module</button>

      <div style={{ maxWidth: 640, margin: '0 auto', paddingTop: 20, display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div>
          <div style={{ display: 'inline-block', fontSize: 10.5, fontWeight: 700, color: '#00abe9', background: 'rgba(0,171,233,0.12)', border: '1px solid rgba(0,171,233,0.3)', borderRadius: 20, padding: '4px 14px', letterSpacing: 1.5 }}>
            MODULE COMPLÉMENTAIRE · EN AUTONOMIE
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 900, margin: '14px 0 0', letterSpacing: -0.5 }}>{module.nom}</h1>
          <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.6)', lineHeight: 1.6, margin: '10px 0 0' }}>
            Le module est ouvert sur le téléphone de chaque formé connecté à la session. Ils avancent à leur rythme : le cours, l&apos;entraînement, puis le test (10/12 pour le valider). Le score du test compte dans leur score de formation. Quand tu termines le module, il se ferme sur leurs téléphones.
          </p>
        </div>

        <a href={urlModule(module)} target="_blank" rel="noreferrer" style={{
          alignSelf: 'flex-start', color: '#00abe9', fontSize: 14, fontWeight: 700, textDecoration: 'none',
        }}>Voir le module comme eux ↗</a>

        <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16, padding: '16px 18px' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 }}>
            <div style={{ fontSize: 15, fontWeight: 800 }}>Résultats au test</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', fontVariantNumeric: 'tabular-nums' }}>
              {resultats.length} terminé{resultats.length > 1 ? 's' : ''} · {reussis} validé{reussis > 1 ? 's' : ''}
            </div>
          </div>
          {resultats.length === 0 ? (
            <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.45)', marginTop: 12 }}>Personne n&apos;a encore passé le test. Les résultats s&apos;affichent ici en direct.</div>
          ) : (
            <div style={{ marginTop: 8 }}>
              {resultats.map(r => {
                const erreurs = erreursDe(r)
                return (
                  <div key={r.collaborateur} style={{ padding: '10px 0', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span style={{ flex: 1, fontSize: 15, fontWeight: 600 }}>{r.collaborateur}</span>
                      <span style={{ fontSize: 15, fontWeight: 800, fontVariantNumeric: 'tabular-nums', color: r.score >= 10 ? '#4ade80' : '#fbbf24' }}>{r.score}/{TOTAL_TEST}</span>
                    </div>
                    {erreurs && erreurs.length === 0 && (
                      <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', marginTop: 4 }}>Sans faute</div>
                    )}
                    {erreurs && erreurs.length > 0 && (
                      <ul style={{ margin: '6px 0 0', padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {erreurs.map((d, i) => (
                          <li key={i} style={{ display: 'flex', gap: 8, fontSize: 13.5, lineHeight: 1.45, color: 'rgba(255,255,255,0.8)' }}>
                            <span style={{ color: '#f87171', fontWeight: 800, flexShrink: 0 }}>✗</span>
                            <span>{d.libelle}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {plusRatees.length > 0 && (
          <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16, padding: '16px 18px' }}>
            <div style={{ fontSize: 15, fontWeight: 800 }}>Questions les plus ratées</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>À reprendre avec le groupe pour le débrief.</div>
            <div style={{ marginTop: 8 }}>
              {plusRatees.map(([libelle, noms]) => (
                <div key={libelle} style={{ padding: '10px 0', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                  <div style={{ fontSize: 14.5, lineHeight: 1.45 }}>{libelle}</div>
                  <div style={{ fontSize: 12.5, color: '#fbbf24', fontWeight: 700, marginTop: 3 }}>
                    Ratée par {noms.length} formé{noms.length > 1 ? 's' : ''} : {noms.join(', ')}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Écran TV / diffuseur ─────────────────────────────────────────────────
export function ModuleApresFormationTV({ module, sessionCode }) {
  const resultats = useResultatsDuJour(module, sessionCode)
  const reussis = resultats.filter(r => r.score >= 10).length
  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #03112a 0%, #0a2a5c 55%, #0d3b7a 100%)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 28, padding: 24, boxSizing: 'border-box' }}>
      <Image src="/assets/logo-lpt-blanc.png" alt="LPT" width={200} height={76} style={{ objectFit: 'contain', animation: 'logoBreathe 3.5s ease-in-out infinite' }} />
      <h1 style={{ fontSize: 44, fontWeight: 900, color: '#fff', textAlign: 'center', lineHeight: 1.2, maxWidth: 820, margin: 0 }}>{module.nom}</h1>
      <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.5)', textAlign: 'center', margin: 0 }}>Module en autonomie : à faire sur ton téléphone</p>
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 14, background: 'rgba(0,171,233,0.1)', border: '1px solid rgba(0,171,233,0.25)', borderRadius: 40, padding: '14px 32px' }}>
        <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#00abe9', animation: 'waitingPulse 1.5s ease-in-out infinite' }} />
        <span style={{ fontSize: 16, fontWeight: 600, color: 'rgba(255,255,255,0.75)', fontVariantNumeric: 'tabular-nums' }}>
          {resultats.length} test{resultats.length > 1 ? 's' : ''} terminé{resultats.length > 1 ? 's' : ''} · {reussis} validé{reussis > 1 ? 's' : ''}
        </span>
      </div>
    </div>
  )
}
