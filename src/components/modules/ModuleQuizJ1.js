'use client'
import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import { sbUpdate, sbDelete, getActiveSessionCode, setSharedState, clearQuizStarts, compterReponsesPrecedentes, effacerReponsesPrecedentes, getRoomSharedState } from '@/lib/supabase'
import { fetchTrainerQuizAnswers } from '@/lib/participantNames'
import { fetchOpenAnswers } from '@/lib/supabase'
import { saveModuleQuizAnswer } from '@/lib/formationSave'
import { useAutoRevealCorrection } from '@/lib/useAutoRevealCorrection'
import { countVotesPerOption } from '@/lib/quizVotes'
import { QUIZ_J1 } from '@/lib/quizJ1Data'
import { tauxParFamille, statutFamille, themeForAnswer, FAMILLE_LABELS } from '@/lib/quizThemeMap'
import { useQuizCountdown, QUIZ_TIME_LIMIT_SEC } from '@/components/ParticipantModuleView'

const MODULE_ID = 'quiz-j1'
import { QUIZ_OPTION_COLORS as OPTION_COLORS } from '@/lib/constants'

const STYLES = `
  @keyframes j1FadeIn {
    from { opacity: 0; transform: translateY(8px); }
    to   { opacity: 1; transform: translateY(0); }
  }
`

// ── Lobby ────────────────────────────────────────────────────────────
function Lobby({ onStart, onBack }) {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #03112a 0%, #0a2a5c 55%, #0d3b7a 100%)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', padding: '40px 24px', textAlign: 'center',
    }}>
      <Image src="/assets/logo-lpt-blanc.png" alt="LPT" width={90} height={34} style={{ objectFit: 'contain', marginBottom: 32 }} />
      <div style={{
        display: 'inline-block', background: 'rgba(0,171,233,0.15)', border: '1px solid rgba(0,171,233,0.35)',
        borderRadius: 20, padding: '6px 24px', fontSize: 12, fontWeight: 700, color: '#00abe9',
        textTransform: 'uppercase', letterSpacing: 2, marginBottom: 16,
      }}>Quiz Jour 1</div>
      <h1 style={{ fontSize: 30, fontWeight: 800, color: '#fff', marginBottom: 8 }}>
        Les fondamentaux de l&apos;optique
      </h1>
      <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.45)', marginBottom: 36, lineHeight: 1.6 }}>
        Entreprise · Optique · Ordonnances · Montures<br />
        {QUIZ_J1.length} questions · Classements toutes les 5 questions
      </p>
      <button onClick={onStart} style={{
        background: 'linear-gradient(135deg, #0070a8, #00abe9)',
        border: 'none', color: '#fff', padding: '16px 48px',
        borderRadius: 16, fontSize: 17, fontWeight: 700, cursor: 'pointer',
        boxShadow: '0 8px 32px rgba(0,171,233,0.35)', fontFamily: 'inherit', marginBottom: 16,
      }}>▶ Lancer le quiz</button>
      <button onClick={onBack} style={{
        background: 'none', border: '1px solid rgba(255,255,255,0.15)',
        color: 'rgba(255,255,255,0.4)', padding: '10px 24px', borderRadius: 12,
        fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
      }}>← Retour</button>
    </div>
  )
}

// ══ Écran formateur épuré (style validé par Kevin le 16/11) ═══════════
// Même disposition que la TV : réponses en direct à gauche, question à
// droite (avec la réponse attendue, visible du formateur seulement), barre
// d'actions en bas. Seul l'affichage change : la logique (validation,
// correction auto, forcer, ordonnance, remise à zéro) est inchangée.
const F_NAVY = '#03112a', F_OR = '#c9a227', F_VERT = '#4ade80', F_ROUGE = '#f87171', F_AMBRE = '#fbbf24'
const fT = (px, vh) => `min(${px}px, ${vh}vh)`
const fPetitTitre = { fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)' }

// Ce que la TV affiche en ce moment (question ou correction)
function useEtatTV(quizQ) {
  const [enCorrection, setEnCorrection] = useState(false)
  useEffect(() => {
    let actif = true
    const lire = () => getRoomSharedState(getActiveSessionCode()).then(st => { if (actif) setEnCorrection(!!st?.quiz_show_correction) }).catch(() => {})
    lire()
    const t = setInterval(lire, 1500)
    return () => { actif = false; clearInterval(t) }
  }, [quizQ])
  return enCorrection
}

function FChrono({ quizQ, secondes }) {
  const restant = useQuizCountdown({ enabled: true, moduleId: MODULE_ID, qIdx: quizQ, sessionCode: getActiveSessionCode(), seconds: secondes })
  const urgent = restant <= 15
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <div style={{ width: 120, height: 2, background: 'rgba(255,255,255,0.12)' }}>
        <div style={{ width: `${Math.max(0, Math.min(1, restant / secondes)) * 100}%`, height: '100%', background: urgent ? '#ef4444' : '#fff', transition: 'width .25s linear' }} />
      </div>
      <span style={{ fontVariantNumeric: 'tabular-nums', fontSize: 20, fontWeight: 600, color: urgent ? F_ROUGE : '#fff' }}>{Math.floor(restant / 60)}:{String(restant % 60).padStart(2, '0')}</span>
    </div>
  )
}

function FEntete({ quizQ, q, enCorrection }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <Image src="/assets/logo-lpt-blanc.png" alt="LPT" width={80} height={30} style={{ objectFit: 'contain', height: 26, width: 'auto' }} />
        <span style={{ fontSize: 12, letterSpacing: 4, textTransform: 'uppercase', color: 'rgba(255,255,255,0.45)' }}>Quiz Jour 1 · Vue formateur</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
        <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)' }}>📺 Sur la TV : <b style={{ color: '#fff' }}>{enCorrection ? 'la correction' : 'la question'}</b></span>
        <span style={{ fontSize: 12, letterSpacing: 4, textTransform: 'uppercase', color: 'rgba(255,255,255,0.45)' }}>Question {quizQ + 1} / {QUIZ_J1.length}</span>
        {enCorrection
          ? <span style={{ fontSize: 12, letterSpacing: 4, textTransform: 'uppercase', color: F_VERT, fontWeight: 700 }}>✓ Correction</span>
          : <FChrono quizQ={quizQ} secondes={q.timeLimitSec || QUIZ_TIME_LIMIT_SEC} />}
      </div>
    </div>
  )
}

function fReponseAttendue(q) {
  const type = q.type || 'qcm'
  if (q.options) {
    const bonnes = Array.isArray(q.correct) ? q.correct : [q.correct]
    return bonnes.map(i => q.options[i]).join(' · ')
  }
  if (type === 'ordonnance-fill') return 'Les valeurs de l’ordonnance, à l’identique'
  return q.hint || '—'
}

function FOrdonnance({ q }) {
  const ord = q.ordonnance
  if (!ord) return null
  const ligne = (d) => {
    let t = d.sph || '—'
    if (d.cyl) t += q.cylInParens ? `   (${d.cyl}) ${d.axe}°` : `   ${d.cyl}   ${d.axe}°`
    if (d.add) t += `   Add ${d.add}`
    return t
  }
  return (
    <div style={{ marginTop: '3vh', borderTop: `1px solid ${F_OR}`, paddingTop: '1.2vh' }}>
      <div style={{ fontSize: 11, letterSpacing: 4, color: F_OR, textTransform: 'uppercase', marginBottom: '0.6vh' }}>Ordonnance</div>
      {q.ordoLabel && (
        <div style={{ margin: '0.6vh 0 1vh', padding: '8px 12px', borderLeft: `3px solid ${F_OR}`, background: 'rgba(201,162,39,0.12)', fontSize: 18, fontWeight: 700 }}>👓 {q.ordoLabel}</div>
      )}
      {['od', 'og'].map(o => (
        <div key={o} style={{ display: 'flex', gap: 18, padding: '1vh 0', borderBottom: '1px solid rgba(255,255,255,0.08)', fontSize: fT(24, 2.6), fontWeight: 300, whiteSpace: 'pre', fontVariantNumeric: 'tabular-nums' }}>
          <span style={{ fontSize: 12, letterSpacing: 3, color: 'rgba(255,255,255,0.45)', alignSelf: 'center' }}>{o.toUpperCase()}</span>{ligne(ord[o])}
        </div>
      ))}
    </div>
  )
}

function FQuestion({ q, quizQ }) {
  const famille = FAMILLE_LABELS[themeForAnswer(MODULE_ID, quizQ)] || 'Quiz Jour 1'
  return (
    <div style={{ borderRight: `2px solid ${F_OR}`, paddingRight: '2.5vw', minWidth: 0 }}>
      <div style={{ fontSize: fT(13, 1.4), letterSpacing: 5, textTransform: 'uppercase', color: F_OR }}>{famille}</div>
      <div style={{ fontWeight: 700, fontSize: q.question.length > 90 ? fT(32, 3.6) : fT(38, 4.2), lineHeight: 1.15, letterSpacing: -0.5, marginTop: '2vh' }}>{q.question}</div>
      <FOrdonnance q={q} />
      {/* Visible uniquement sur l'écran formateur */}
      <div style={{ marginTop: '3.5vh', padding: '14px 18px', border: '1px dashed rgba(201,162,39,0.5)', borderRadius: 10 }}>
        <div style={{ fontSize: 11, letterSpacing: 3, textTransform: 'uppercase', color: F_OR, marginBottom: 6 }}>Réponse attendue · visible par vous seulement</div>
        <div style={{ fontSize: fT(19, 2.1), color: '#fff', lineHeight: 1.35 }}>{fReponseAttendue(q)}</div>
      </div>
    </div>
  )
}

function FPasRepondu({ noms }) {
  if (!noms?.length) return null
  return (
    <div style={{ marginTop: '2.2vh', display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
      <span style={{ fontSize: 12, letterSpacing: 2, textTransform: 'uppercase', color: F_AMBRE, marginRight: 4 }}>Pas encore répondu</span>
      {noms.map(n => <span key={n} style={{ fontSize: 13, padding: '4px 10px', border: '1px solid rgba(251,191,36,0.35)', color: F_AMBRE, borderRadius: 999 }}>{n}</span>)}
    </div>
  )
}

function FBouton({ children, ton = 'neutre', onClick, disabled, title }) {
  const styles = {
    neutre: { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.18)', color: 'rgba(255,255,255,0.85)', padding: '9px 14px', fontSize: 13 },
    actif: { background: 'rgba(255,255,255,0.16)', border: '1px solid rgba(255,255,255,0.45)', color: '#fff', padding: '9px 14px', fontSize: 13 },
    discret: { background: 'transparent', border: '1px solid transparent', color: 'rgba(255,255,255,0.5)', padding: '9px 10px', fontSize: 13 },
    correction: { background: disabled ? 'rgba(255,255,255,0.04)' : 'rgba(251,191,36,0.14)', border: `1px solid ${disabled ? 'rgba(255,255,255,0.1)' : 'rgba(251,191,36,0.55)'}`, color: disabled ? 'rgba(255,255,255,0.35)' : F_AMBRE, padding: '13px 22px', fontSize: 15 },
    suivant: { background: '#fff', border: '1px solid #fff', color: F_NAVY, padding: '13px 26px', fontSize: 15 },
    terminer: { background: F_VERT, border: `1px solid ${F_VERT}`, color: F_NAVY, padding: '13px 26px', fontSize: 15 },
  }[ton]
  return <button onClick={onClick} disabled={disabled} title={title} style={{ ...styles, borderRadius: 10, fontWeight: 700, fontFamily: 'inherit', cursor: disabled ? 'default' : 'pointer', whiteSpace: 'nowrap' }}>{children}</button>
}

function FCadre({ entete, gauche, droite, actionsGauche, actionsDroite }) {
  return (
    <div style={{ minHeight: '100vh', background: F_NAVY, color: '#fff', display: 'flex', flexDirection: 'column', padding: '3vh 3.5vw 0' }}>
      <style>{STYLES}</style>
      {entete}
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4vw', alignItems: 'start', alignContent: 'center', padding: '3vh 0' }}>
        <div style={{ minWidth: 0 }}>{gauche}</div>
        {droite}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '16px 0 20px', borderTop: '1px solid rgba(255,255,255,0.1)', flexWrap: 'wrap' }}>
        {actionsGauche}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>{actionsDroite}</div>
      </div>
    </div>
  )
}

// ── Détail d'une réponse, case par case (formateur) ─────────────────────
// Pour voir OÙ un formé s'est trompé : chaque case / paire / valeur saisie
// est comparée à l'attendu (mêmes mots-clés que la correction automatique).
const fSansAccents = (t) => String(t || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
const fContient = (texte, groupe) => (groupe || []).some(kw => fSansAccents(texte).includes(fSansAccents(kw)))
const fNombre = (v) => { const n = parseFloat(String(v ?? '').replace(',', '.')); return Number.isNaN(n) ? 0 : n }
const fDioptrie = (v) => { const n = fNombre(v); return (n > 0 ? '+' : '') + n.toFixed(2).replace('.', ',') }
const fIcone = (ok) => ok == null ? null : <span style={{ color: ok ? F_VERT : F_ROUGE, fontWeight: 800, fontSize: 16 }}>{ok ? '✓' : '✗'}</span>

function FLigneDetail({ libelle, valeur, ok, attendu }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr auto', gap: 12, alignItems: 'baseline', padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
      <span style={{ fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)' }}>{libelle}</span>
      <span style={{ fontSize: 16, color: ok === false ? F_ROUGE : '#fff', overflowWrap: 'anywhere' }}>
        {valeur || <i style={{ color: 'rgba(255,255,255,0.35)' }}>vide</i>}
        {ok === false && attendu && <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginLeft: 10 }}>attendu : {attendu}</span>}
      </span>
      {fIcone(ok)}
    </div>
  )
}

function FDetailReponse({ q, brut }) {
  const type = q.type || 'qcm'
  if (type === 'text-open-multi') {
    const cases = String(brut || '').split('||').map(x => x.trim())
    const groupes = q.autoCorrectEach || []
    return <>
      {cases.map((c, i) => {
        const ok = !groupes.length ? null : q.autoCorrectOrdered ? fContient(c, groupes[i]) : groupes.some(g => fContient(c, g))
        return <FLigneDetail key={i} libelle={q.fieldLabels?.[i] || `Case ${i + 1}`} valeur={c} ok={ok} attendu={q.autoCorrectOrdered ? groupes[i]?.[0] : null} />
      })}
      <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginTop: 8 }}>Attendu : {q.hint}</div>
    </>
  }
  if (type === 'text-open-pairs') {
    const morceaux = String(brut || '').split('||').map(x => x.trim())
    const paires = []
    for (let i = 0; i < morceaux.length; i += 2) paires.push([morceaux[i] || '', morceaux[i + 1] || ''])
    const [gauche, droite] = q.pairLabels || ['Élément', 'Détail']
    return <>
      {paires.map(([g, d], i) => {
        const ok = q.answerPairs?.length ? q.answerPairs.some(c => fContient(g, c.keys) && fContient(d, c.defKeys)) : null
        return <FLigneDetail key={i} libelle={`${gauche} ${i + 1}`} valeur={`${g || '—'}  →  ${d || '—'}`} ok={ok} />
      })}
      <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginTop: 8 }}>Attendu ({droite.toLowerCase()}) : {q.hint}</div>
    </>
  }
  if (type === 'ordonnance-fill') {
    let saisie = null
    try { saisie = JSON.parse(brut) } catch { /* ancienne réponse sans détail */ }
    if (!saisie) return <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.45)', fontStyle: 'italic' }}>Détail non disponible pour cette réponse.</div>
    const champs = saisie.champs || ['sph', 'cyl', 'axe', 'add']
    const noms = { sph: 'Sphère', cyl: 'Cylindre', axe: 'Axe', add: 'Addition' }
    const affiche = (champ, v) => champ === 'axe' ? `${Math.round(fNombre(v))}°` : fDioptrie(v)
    return <>{['od', 'og'].flatMap(o => champs.map(c => {
      const attendu = q.ordonnance[o]?.[c]
      const ok = c === 'axe' ? Math.round(fNombre(saisie[o]?.[c])) === Math.round(fNombre(attendu)) : Math.abs(fNombre(saisie[o]?.[c]) - fNombre(attendu)) < 0.001
      return <FLigneDetail key={o + c} libelle={`${o.toUpperCase()} · ${noms[c]}`} valeur={affiche(c, saisie[o]?.[c])} ok={ok} attendu={affiche(c, attendu)} />
    }))}</>
  }
  if (type === 'power-selector') {
    let saisie = null
    try { saisie = JSON.parse(brut) } catch { /* ancienne réponse sans détail */ }
    if (!saisie) return <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.45)', fontStyle: 'italic' }}>Détail non disponible pour cette réponse.</div>
    return <>
      <FLigneDetail libelle="Positif max" valeur={fDioptrie(saisie.pos)} ok={Math.abs(fNombre(saisie.pos) - q.correctPosVal) < 0.001} attendu={fDioptrie(q.correctPosVal)} />
      <FLigneDetail libelle="Négatif max" valeur={fDioptrie(saisie.neg)} ok={Math.abs(fNombre(saisie.neg) - q.correctNegVal) < 0.001} attendu={fDioptrie(q.correctNegVal)} />
    </>
  }
  return <div style={{ fontSize: 17, color: '#fff' }}>{brut}</div>
}

// Ligne repliable « un formé » : bonne réponse repliée, fausse ou à valider
// dépliée d'office ; un clic ouvre / ferme le détail.
export function FLigneFormé({ nom, statut, auto, resume, q, brut, actions }) {
  const [ouvert, setOuvert] = useState(statut !== true)
  useEffect(() => { if (statut === false) setOuvert(true) }, [statut])
  const couleur = statut === true ? F_VERT : statut === false ? F_ROUGE : F_AMBRE
  const etiquette = statut === true ? (auto ? 'Juste · validé auto' : 'Juste') : statut === false ? 'Faux' : 'À valider'
  return (
    <div style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', borderLeft: `3px solid ${couleur}`, animation: 'j1FadeIn .3s ease' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', alignItems: 'center', gap: 12, padding: '1.2vh 0 1.2vh 14px' }}>
        <button onClick={() => setOuvert(o => !o)} style={{ all: 'unset', cursor: 'pointer', minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>{nom}</span>
            <span style={{ fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase', color: couleur }}>{etiquette}</span>
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>{ouvert ? '▴ masquer' : '▾ voir le détail'}</span>
          </div>
          {!ouvert && <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.55)', marginTop: 3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{resume}</div>}
        </button>
        {actions}
      </div>
      {ouvert && <div style={{ padding: '0 0 1.4vh 14px' }}><FDetailReponse q={q} brut={brut} /></div>}
    </div>
  )
}

export function fResume(q, brut) {
  const type = q.type || 'qcm'
  if (type === 'ordonnance-fill' || type === 'power-selector') {
    try { const v = JSON.parse(brut); return type === 'power-selector' ? `${fDioptrie(v.pos)} / ${fDioptrie(v.neg)}` : `OD ${fDioptrie(v.od?.sph)} · OG ${fDioptrie(v.og?.sph)}` } catch { return '' }
  }
  return String(brut || '').split('||').map(x => x.trim()).filter(Boolean).join(' · ')
}

// ── Contrôleur questions texte libre ────────────────────────────────
function TextOpenController({ quizQ, isLast, onNext, onEnd }) {
  const q = QUIZ_J1[quizQ]
  const [answers, setAnswers] = useState([])
  const [validations, setValidations] = useState({})
  const autoValidatedRef = useRef(new Set())

  useEffect(() => {
    setValidations({})
    setAnswers([])
    autoValidatedRef.current = new Set()

    const code = getActiveSessionCode()

    const autoValidate = (rows) => {
      if (!q) return
      for (const row of rows) {
        const name = row.participant_name
        if (autoValidatedRef.current.has(name)) continue
        const raw  = row.answer || ''
        const text = raw.trim().toLowerCase()
        const matchOr    = q.autoCorrect?.length     && q.autoCorrect.some(kw => text.includes(kw.toLowerCase()))
        const matchAnd   = q.autoCorrectAll?.length   && q.autoCorrectAll.every(kw => text.includes(kw.toLowerCase()))
        const matchAllOr = q.autoCorrectAllOr?.length && q.autoCorrectAllOr.every(group => group.some(kw => text.includes(kw.toLowerCase())))
        // Liste blanche de réponses exactes (accents/casse ignorés) — ex. Châtelet
        const sansAccents = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '')
        const matchExact = q.autoCorrectExact?.length && q.autoCorrectExact.some(kw => sansAccents(text) === sansAccents(kw.toLowerCase()))
        // autoCorrectOrdered : la case n doit contenir un mot du groupe n (schéma
        // du verre progressif : haut = loin, milieu = intermédiaire, bas = près)
        const matchEach  = q.autoCorrectEach?.length && (() => {
          if (q.autoCorrectOrdered) {
            const parts = raw.split('||').map(p => p.trim().toLowerCase())
            return q.autoCorrectEach.every((group, i) => group.some(kw => (parts[i] || '').includes(kw.toLowerCase())))
          }
          const parts = raw.split('||').map(p => p.trim().toLowerCase()).filter(Boolean)
          return q.autoCorrectEach.every(group => group.some(kw => parts.some(p => p.includes(kw.toLowerCase()))))
        })()
        const bloque = q.autoCorrectNot?.length && q.autoCorrectNot.some(kw => text.includes(kw.toLowerCase()))
        const matchPairs = q.answerPairs?.length && (() => {
          const parts = raw.split('||').map(p => p.trim().toLowerCase())
          const submittedPairs = []
          for (let i = 0; i < parts.length; i += 2) submittedPairs.push([parts[i] || '', parts[i + 1] || ''])
          return q.answerPairs.every(canon =>
            submittedPairs.some(([left, right]) =>
              canon.keys.some(k => left.includes(k.toLowerCase())) &&
              canon.defKeys.some(k => right.includes(k.toLowerCase()))
            )
          )
        })()
        if (!bloque && (matchOr || matchAnd || matchAllOr || matchExact || matchEach || matchPairs)) {
          autoValidatedRef.current.add(name)
          saveModuleQuizAnswer({
            sessionCode: code,
            moduleId: MODULE_ID,
            questionIdx: quizQ,
            collaborateur: name,
            answerIdx: 0,
            isCorrect: true,
          }).then(() => setValidations(v => ({ ...v, [name]: true }))).catch(() => { autoValidatedRef.current.delete(name) })
        }
      }
    }

    const poll = async () => {
      const rows = await fetchOpenAnswers(code, `quiz-j1:${quizQ}`)
      const latest = {}
      for (const row of rows || []) latest[row.participant_name] = row
      const deduped = Object.values(latest)
      setAnswers(deduped)
      autoValidate(deduped)
    }
    poll()
    const t = setInterval(poll, 1500)
    return () => clearInterval(t)
  }, [quizQ])

  const handleValidate = async (name, isCorrect) => {
    try {
      await saveModuleQuizAnswer({
        sessionCode: getActiveSessionCode(),
        moduleId: MODULE_ID,
        questionIdx: quizQ,
        collaborateur: name,
        answerIdx: 0,
        isCorrect,
      })
      setValidations(v => ({ ...v, [name]: isCorrect }))
    } catch { /* best-effort */ }
  }

  const correctCount = Object.values(validations).filter(Boolean).length

  // Filet de sécurité : si une ancienne réponse (test, répétition...) traîne
  // déjà en base pour cette question, le formé tombe direct sur la
  // correction sans avoir pu répondre. Ce bouton efface tout pour cette
  // question précise et repart à zéro.
  const handleResetQuestion = async () => {
    if (!window.confirm('Effacer toutes les réponses de cette question et repartir à zéro ?')) return
    const code = getActiveSessionCode()
    await Promise.all([
      sbDelete('open_answers', `session_code=eq.${encodeURIComponent(code)}&page_id=eq.${encodeURIComponent(`quiz-j1:${quizQ}`)}`),
      sbDelete('quiz_answers', `session_code=eq.${encodeURIComponent(code)}&module_id=eq.${MODULE_ID}&question_idx=eq.${quizQ}`),
      // Si CE bouton est utilisé parce qu'un formé "tombe direct sur la
      // correction", c'est souvent que quiz_show_correction est resté
      // bloqué à true depuis la question précédente — effacer seulement les
      // réponses ne réglait pas le vrai problème (incident du 19/08).
      setSharedState({ quiz_show_correction: false }),
    ]).catch(() => {})
    setAnswers([])
    setValidations({})
    autoValidatedRef.current = new Set()
  }

  const pendingCount = answers.filter(row => !(row.participant_name in validations)).length
  const confirmSkipPending = () => {
    if (pendingCount === 0) return true
    return window.confirm(
      `${pendingCount} réponse${pendingCount > 1 ? 's' : ''} pas encore validée${pendingCount > 1 ? 's' : ''} ✓/✗.\n\n` +
      `Si vous continuez maintenant, ${pendingCount > 1 ? 'elles compteront' : 'elle comptera'} comme fausse` +
      `${pendingCount > 1 ? 's' : ''} — même si la réponse était juste.\n\nContinuer quand même ?`
    )
  }

  // Auto-passage à la correction dès que tous les formés connectés ont
  // soumis une réponse — le bouton reste bloqué tant que ce n'est pas le
  // cas, avec un lien "Forcer" en secours si le décompte est erroné.
  const { connectedCount, notAnswered } = useAutoRevealCorrection({
    answeredNames: answers.map(row => row.participant_name),
    resetKey: quizQ,
    onReveal: () => setSharedState({ quiz_show_correction: true }).catch(() => {}),
  })
  const allAnswered = connectedCount > 0 && notAnswered.length === 0

  const formatAnswer = (answer) => {
    if (!answer) return '—'
    if (q?.type === 'text-open-pairs') {
      const parts = answer.split('||').map(s => s.trim())
      const pairs = []
      for (let i = 0; i < parts.length; i += 2) pairs.push(`${parts[i] || '—'} → ${parts[i + 1] || '—'}`)
      return pairs.join('  //  ')
    }
    if (q?.type === 'text-open-multi') {
      return answer.split('||').map(s => s.trim()).filter(Boolean).join(' // ')
    }
    return answer
  }

  const enCorrection = useEtatTV(quizQ)
  const refuses = Object.values(validations).filter(v => v === false).length

  return (
    <FCadre
      entete={<FEntete quizQ={quizQ} q={q} enCorrection={enCorrection} />}
      droite={<FQuestion q={q} quizQ={quizQ} />}
      gauche={<>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
          <span style={{ fontSize: fT(52, 5.6), fontWeight: 300, lineHeight: 1 }}>{answers.length}</span>
          <span style={{ fontSize: fT(19, 2), color: 'rgba(255,255,255,0.45)' }}>/ {connectedCount || '?'} ont répondu</span>
          <span style={{ marginLeft: 'auto', fontSize: 15 }}>
            <b style={{ color: F_VERT }}>{correctCount} ✓</b>
            <b style={{ color: F_ROUGE, marginLeft: 12 }}>{refuses} ✗</b>
          </span>
        </div>
        <div style={{ ...fPetitTitre, marginTop: '3vh', paddingBottom: '1.2vh', borderBottom: '1px solid rgba(255,255,255,0.15)', display: 'flex', justifyContent: 'space-between' }}>
          <span>Réponses à valider</span>{pendingCount > 0 && <span style={{ color: F_AMBRE }}>{pendingCount} en attente</span>}
        </div>
        <div style={{ maxHeight: '44vh', overflowY: 'auto' }}>
          {answers.length === 0 ? (
            <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 15, fontStyle: 'italic', padding: '3vh 0' }}>En attente des réponses des participants…</div>
          ) : answers.map(row => {
            const statut = validations[row.participant_name]
            const auto = statut === true && autoValidatedRef.current.has(row.participant_name)
            // Boutons toujours actifs — modifiables même après une validation automatique
            const boutons = (
              <div style={{ display: 'flex', gap: 6 }}>
                {[[true, '✓', F_VERT, 'Marquer correct'], [false, '✗', F_ROUGE, 'Marquer faux']].map(([v, l, c, titre]) => (
                  <button key={l} onClick={() => handleValidate(row.participant_name, v)} title={titre} style={{ width: 40, height: 40, borderRadius: 8, fontSize: 17, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', border: `1px solid ${statut === v ? c : 'rgba(255,255,255,0.18)'}`, background: statut === v ? `${c}26` : 'transparent', color: statut === v ? c : 'rgba(255,255,255,0.5)' }}>{l}</button>
                ))}
              </div>
            )
            if (q.type === 'text-open') {
              return (
                <div key={row.participant_name} style={{ display: 'grid', gridTemplateColumns: '1fr auto', alignItems: 'center', gap: 14, padding: '1.5vh 0 1.5vh 14px', borderBottom: '1px solid rgba(255,255,255,0.08)', borderLeft: `3px solid ${statut === true ? F_VERT : statut === false ? F_ROUGE : F_AMBRE}`, animation: 'j1FadeIn .3s ease' }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', color: 'rgba(255,255,255,0.45)' }}>
                      {row.participant_name}{auto && <span style={{ color: F_VERT, marginLeft: 8, letterSpacing: 1 }}>· validé auto</span>}
                    </div>
                    <div style={{ fontSize: fT(19, 2.1), marginTop: 4, color: '#fff', overflowWrap: 'anywhere' }}>{formatAnswer(row.answer)}</div>
                  </div>
                  {boutons}
                </div>
              )
            }
            return <FLigneFormé key={row.participant_name} nom={row.participant_name} statut={statut ?? null} auto={auto} q={q} brut={row.answer} resume={fResume(q, row.answer)} actions={boutons} />
          })}
        </div>
        <FPasRepondu noms={notAnswered} />
      </>}
      actionsGauche={answers.length > 0 && (
        <FBouton ton="discret" onClick={handleResetQuestion} title="Efface les réponses de cette question (utile si un formé tombe direct sur la correction)">↺ Effacer les réponses de cette question</FBouton>
      )}
      actionsDroite={<>
        {pendingCount > 0 && <span style={{ fontSize: 13, color: F_AMBRE, marginRight: 6 }}>⚠️ {pendingCount} réponse{pendingCount > 1 ? 's' : ''} à valider</span>}
        {!allAnswered && answers.length > 0 && !enCorrection && (
          <FBouton ton="discret" onClick={() => { if (window.confirm('Forcer l\'affichage de la correction maintenant ? Les formés qui n\'ont pas encore répondu verront les réponses des autres.')) setSharedState({ quiz_show_correction: true }).catch(() => {}) }}>Forcer la correction</FBouton>
        )}
        {answers.length > 0 && !enCorrection && (
          <FBouton ton="correction" disabled={!allAnswered} onClick={() => { if (allAnswered) setSharedState({ quiz_show_correction: true }).catch(() => {}) }}
            title={!allAnswered ? 'En attente de toutes les réponses — révéler maintenant permettrait à ceux qui n\'ont pas répondu de voir les réponses des autres' : undefined}>
            {allAnswered ? '🎯 Voir la correction' : `⏳ En attente (${answers.length}/${connectedCount || '?'})`}
          </FBouton>
        )}
        {isLast
          ? <FBouton ton="terminer" onClick={() => { if (confirmSkipPending()) onEnd() }}>✓ Terminer le quiz</FBouton>
          : <FBouton ton="suivant" onClick={async () => { if (!confirmSkipPending()) return; await setSharedState({ quiz_show_correction: false }).catch(() => {}); onNext() }}>Question suivante →</FBouton>}
      </>}
    />
  )
}

// ── Contrôleur questions standard (QCM, ordonnance, power) ──────────
function StandardController({ quizQ, isLast, onNext, onEnd }) {
  const q = QUIZ_J1[quizQ]
  const type = q.type || 'qcm'
  const [liveAnswers, setLiveAnswers] = useState([])
  const [ordoShown, setOrdoShown] = useState(false)

  useEffect(() => { setOrdoShown(false) }, [quizQ])

  useEffect(() => {
    const code = getActiveSessionCode()
    const poll = async () => {
      const rows = await fetchTrainerQuizAnswers(
        `session_code=eq.${code}&module_id=eq.${MODULE_ID}&question_idx=eq.${quizQ}`
      )
      setLiveAnswers(rows || [])
    }
    poll()
    const t = setInterval(poll, 1500)
    return () => clearInterval(t)
  }, [quizQ])

  const total = liveAnswers.length
  const correctCount = liveAnswers.filter(r => r.is_correct).length

  const hasOptions = !!q.options
  const counts = hasOptions ? countVotesPerOption(liveAnswers, q.options.length, type === 'qcm-multi') : []
  const correctIdx = hasOptions && !Array.isArray(q.correct) ? q.correct : null

  const handleShowCorrection = async () => {
    await setSharedState({ quiz_show_correction: true }).catch(() => {})
  }

  // Auto-passage à la correction dès que tous les formés connectés ont
  // répondu — avec lien "Forcer" en secours si le décompte est erroné.
  const { connectedCount, notAnswered } = useAutoRevealCorrection({
    answeredNames: liveAnswers.map(r => r.collaborateur),
    resetKey: quizQ,
    onReveal: handleShowCorrection,
  })
  const handleToggleOrdo = async () => {
    const next = !ordoShown
    setOrdoShown(next)
    await setSharedState({ quiz_ordo_show: next }).catch(() => {})
  }

  // Filet de sécurité : si une ancienne réponse (test, répétition...) traîne
  // déjà en base pour cette question, le formé tombe direct sur la
  // correction sans avoir pu répondre. Ce bouton efface tout pour cette
  // question précise et repart à zéro.
  const handleResetQuestion = async () => {
    if (!window.confirm('Effacer toutes les réponses de cette question et repartir à zéro ?')) return
    const code = getActiveSessionCode()
    await Promise.all([
      sbDelete('quiz_answers', `session_code=eq.${encodeURIComponent(code)}&module_id=eq.${MODULE_ID}&question_idx=eq.${quizQ}`),
      // Si CE bouton est utilisé parce qu'un formé "tombe direct sur la
      // correction", c'est souvent que quiz_show_correction est resté
      // bloqué à true depuis la question précédente — effacer seulement les
      // réponses ne réglait pas le vrai problème (incident du 19/08).
      setSharedState({ quiz_show_correction: false }),
    ]).catch(() => {})
    setLiveAnswers([])
  }

  const enCorrection = useEtatTV(quizQ)

  return (
    <FCadre
      entete={<FEntete quizQ={quizQ} q={q} enCorrection={enCorrection} />}
      droite={<FQuestion q={q} quizQ={quizQ} />}
      gauche={<>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
          <span style={{ fontSize: fT(52, 5.6), fontWeight: 300, lineHeight: 1, color: enCorrection ? F_VERT : '#fff' }}>{enCorrection ? correctCount : total}</span>
          <span style={{ fontSize: fT(19, 2), color: 'rgba(255,255,255,0.45)' }}>
            {enCorrection ? `/ ${total} bonne${correctCount > 1 ? 's' : ''} réponse${correctCount > 1 ? 's' : ''}` : `/ ${connectedCount || '?'} ont répondu`}
          </span>
        </div>
        {hasOptions ? (
          <>
            <div style={{ ...fPetitTitre, marginTop: '3vh', paddingBottom: '1.2vh', borderBottom: '1px solid rgba(255,255,255,0.15)' }}>
              Votes en direct{type === 'qcm-multi' && <span style={{ color: F_OR, marginLeft: 12, letterSpacing: 1, textTransform: 'none' }}>{q.instruction || 'Plusieurs réponses possibles'}</span>}
            </div>
            {q.options.map((opt, i) => {
              const count = counts[i] || 0
              const bonne = Array.isArray(q.correct) ? q.correct.includes(i) : i === correctIdx
              const pct = total > 0 ? (count / total) * 100 : 0
              const couleur = OPTION_COLORS[i] || '#94a3b8'
              return (
                <div key={i} style={{ padding: '1.6vh 0', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '40px 1fr auto', alignItems: 'center', gap: 14 }}>
                    <span style={{ width: 34, height: 34, borderRadius: 7, border: `2px solid ${bonne ? F_VERT : couleur}`, background: bonne && enCorrection ? F_VERT : 'transparent', color: bonne ? (enCorrection ? F_NAVY : F_VERT) : couleur, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 15 }}>{bonne ? '✓' : 'ABCDEFGH'[i]}</span>
                    <span style={{ fontSize: fT(21, 2.3), fontWeight: bonne ? 700 : 400, color: bonne ? '#fff' : 'rgba(255,255,255,0.65)' }}>{opt}</span>
                    <span style={{ fontSize: fT(22, 2.4), fontWeight: 300, color: bonne ? F_VERT : 'rgba(255,255,255,0.6)', fontVariantNumeric: 'tabular-nums' }}>{count}</span>
                  </div>
                  <div style={{ marginLeft: 54, marginTop: 8, height: 2, background: 'rgba(255,255,255,0.08)' }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: bonne ? F_VERT : 'rgba(255,255,255,0.35)', transition: 'width .5s ease' }} />
                  </div>
                </div>
              )
            })}
          </>
        ) : (
          // Ordonnance à recopier / roulettes : bonnes et mauvaises réponses
          <div style={{ display: 'flex', gap: '3vw', marginTop: '4vh' }}>
            <div><div style={{ fontSize: fT(48, 5.2), fontWeight: 300, color: F_VERT, lineHeight: 1 }}>{correctCount}</div><div style={{ ...fPetitTitre, marginTop: 6 }}>Correct{correctCount > 1 ? 's' : ''}</div></div>
            <div><div style={{ fontSize: fT(48, 5.2), fontWeight: 300, color: F_ROUGE, lineHeight: 1 }}>{total - correctCount}</div><div style={{ ...fPetitTitre, marginTop: 6 }}>Incorrect{total - correctCount > 1 ? 's' : ''}</div></div>
          </div>
        )}
        {!hasOptions && liveAnswers.length > 0 && (
          <>
            <div style={{ ...fPetitTitre, marginTop: '3vh', paddingBottom: '1.2vh', borderBottom: '1px solid rgba(255,255,255,0.15)' }}>Réponses par formé · cliquez pour voir ce qu&apos;il a saisi</div>
            <div style={{ maxHeight: '38vh', overflowY: 'auto' }}>
              {[...liveAnswers].sort((x, y) => Number(x.is_correct) - Number(y.is_correct)).map(r => (
                <FLigneFormé key={r.collaborateur} nom={r.collaborateur} statut={!!r.is_correct} q={q} brut={r.answer} resume={fResume(q, r.answer)} />
              ))}
            </div>
          </>
        )}
        {!enCorrection && <FPasRepondu noms={notAnswered} />}
      </>}
      actionsGauche={<>
        {liveAnswers.length > 0 && (
          <FBouton ton="discret" onClick={handleResetQuestion} title="Efface les réponses de cette question (utile si un formé tombe direct sur la correction)">↺ Effacer les réponses de cette question</FBouton>
        )}
        {q.ordonnance && (
          <FBouton ton={ordoShown ? 'actif' : 'neutre'} onClick={handleToggleOrdo}>{ordoShown ? '📋 Ordonnance affichée sur la TV' : '📋 Réafficher l\'ordonnance sur la TV'}</FBouton>
        )}
      </>}
      actionsDroite={<>
        {total > 0 && !enCorrection && <FBouton ton="correction" onClick={handleShowCorrection}>🎯 Voir la correction</FBouton>}
        {isLast
          ? <FBouton ton="terminer" onClick={onEnd}>✓ Terminer le quiz</FBouton>
          : <FBouton ton="suivant" onClick={async () => { await setSharedState({ quiz_show_correction: false, quiz_ordo_show: false }).catch(() => {}); onNext() }}>Question suivante →</FBouton>}
      </>}
    />
  )
}

// ── Résultats groupe ────────────────────────────────────────────────
function GroupResultsView({ onTerminate }) {
  const [answers, setAnswers] = useState([])
  const [loading, setLoading] = useState(true)
  const [phase, setPhase] = useState('podium')

  // Ordre de fin de quiz : 1) podium sur la TV (posé par handleEndQuiz),
  // 2) bouton → taux de réussite par famille, avec retour possible au podium.
  const voirFamilles = async () => { await setSharedState({ quiz_final_phase: 'familles' }).catch(() => {}); setPhase('familles') }
  const voirPodium = async () => { await setSharedState({ quiz_final_phase: 'podium' }).catch(() => {}); setPhase('podium') }

  useEffect(() => {
    const fetch = async () => {
      const rows = await fetchTrainerQuizAnswers(`session_code=eq.${getActiveSessionCode()}&module_id=eq.${MODULE_ID}`)
      setAnswers(rows || [])
      setLoading(false)
    }
    fetch()
  }, [])

  const participants = [...new Set((answers || []).map(r => r.collaborateur))]
  // Bilan par famille (Entreprise, Optique…) — remplace l'ancienne liste
  // « Points à retravailler » question par question. Même calcul que la TV.
  const familles = tauxParFamille(answers, QUIZ_J1, MODULE_ID)

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #03112a 0%, #0a2a5c 55%, #0d3b7a 100%)', display: 'flex', flexDirection: 'column', padding: '24px 28px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Image src="/assets/logo-lpt-blanc.png" alt="LPT" width={72} height={26} style={{ objectFit: 'contain' }} />
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>Bilan — Quiz Jour 1</span>
        </div>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>
          <span style={{ fontSize: 20, fontWeight: 800, color: '#fff', marginRight: 4 }}>{participants.length}</span>participant{participants.length > 1 ? 's' : ''}
        </div>
      </div>

      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#00abe9', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 8 }}>Résultats du groupe</div>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: '#fff', marginBottom: 4 }}>Taux de réussite par famille</h1>
        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>
          Sur la TV en ce moment : <b style={{ color: '#fff' }}>{phase === 'familles' ? 'le taux par famille' : 'le podium'}</b>
        </p>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 18, maxWidth: 760, width: '100%', margin: '0 auto 24px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.3)', padding: 40 }}>Chargement…</div>
        ) : familles.map(f => {
          const st = statutFamille(f.pct)
          return (
            <div key={f.id} style={{ display: 'grid', gridTemplateColumns: '200px 1fr 64px', alignItems: 'center', gap: 16 }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 800, color: '#fff' }}>{f.label}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginTop: 2 }}>{st.icon} {st.label} · {f.questions} question{f.questions > 1 ? 's' : ''}</div>
              </div>
              <div style={{ height: 20, background: 'rgba(255,255,255,0.06)', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${f.pct}%`, background: '#00abe9', borderRadius: '0 4px 4px 0' }} />
              </div>
              <div style={{ fontSize: 22, fontWeight: 900, color: '#fff', textAlign: 'right' }}>{f.pct}%</div>
            </div>
          )
        })}
      </div>

      <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
        {phase === 'familles' ? (
          <button onClick={voirPodium} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.8)', padding: '12px 28px', borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
            🏆 Revenir au podium
          </button>
        ) : (
          <button onClick={voirFamilles} style={{ background: 'linear-gradient(135deg, #0070a8, #00abe9)', border: 'none', color: '#fff', padding: '12px 28px', borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
            📊 Voir le taux par famille
          </button>
        )}
        <button onClick={onTerminate} style={{ background: 'rgba(255,80,80,0.12)', border: '1px solid rgba(255,80,80,0.3)', color: '#ff6b6b', padding: '12px 28px', borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>✕ Terminer</button>
      </div>
    </div>
  )
}

// ── Composant principal ──────────────────────────────────────────────
export default function ModuleQuizJ1({ pName, onBack }) {
  const [started, setStarted] = useState(false)
  const [quizQ, setQuizQ] = useState(0)
  const [showGroupResults, setShowGroupResults] = useState(false)

  useEffect(() => {
    const init = async () => {
      await setSharedState({ quiz_final_phase: null, quiz_interstitial_q: null, quiz_show_correction: false }).catch(() => {})
      await sbUpdate('sessions', { active_module: MODULE_ID, module_page: -1 }, `code=eq.${getActiveSessionCode()}`)
    }
    init()
  }, [])

  const handleBack = async () => {
    try {
      await sbUpdate('sessions', { active_module: null, module_page: 0 }, `code=eq.${getActiveSessionCode()}`)
      await setSharedState({ quiz_final_phase: null, quiz_interstitial_q: null, quiz_show_correction: false }).catch(() => {})
    } catch { /* best-effort */ }
    onBack()
  }

  const handleStart = async () => {
    // Réponses d'un passage précédent dans cette salle ? Le formateur décide.
    const code = getActiveSessionCode()
    const avant = await compterReponsesPrecedentes(code, MODULE_ID).catch(() => ({ reponses: 0, formes: 0 }))
    if (avant.reponses > 0 && window.confirm(
      `Des réponses d'un passage précédent existent pour ce quiz dans cette salle ` +
      `(${avant.reponses} réponse${avant.reponses > 1 ? 's' : ''}, ${avant.formes} formé${avant.formes > 1 ? 's' : ''}).\n\n` +
      `Les effacer avant de commencer ?\n\n` +
      `OK = repartir de zéro · Annuler = les garder (ex. quiz relancé après une coupure)`
    )) {
      await effacerReponsesPrecedentes(code, MODULE_ID).catch(() => {})
    }
    await setSharedState({ quiz_show_correction: false, quiz_interstitial_q: null, quiz_final_phase: null })
    await clearQuizStarts(getActiveSessionCode(), MODULE_ID).catch(() => {})
    await sbUpdate('sessions', { active_module: MODULE_ID, module_page: 100 }, `code=eq.${getActiveSessionCode()}`)
    setQuizQ(0)
    setStarted(true)
  }

  // Podium interstitiel toutes les 5 questions supprimé (faisait planter
  // l'appli) — on enchaîne directement, seul le podium final reste (cf.
  // handleEndQuiz). Le classement en temps réel, désormais privé, s'affiche
  // sur le téléphone de chaque formé après chaque correction.
  const handleNextQuestion = async () => {
    const next = quizQ + 1
    await setSharedState({ quiz_show_correction: false, quiz_ordo_show: false, quiz_interstitial_q: null }).catch(() => {})
    await sbUpdate('sessions', { active_module: MODULE_ID, module_page: 100 + next }, `code=eq.${getActiveSessionCode()}`)
    setQuizQ(next)
  }

  const handleEndQuiz = async () => {
    try {
      // Podium demandé AVANT de passer la TV en « résultats » : sinon elle
      // affiche une fraction de seconde le taux par famille avant le podium.
      await setSharedState({ quiz_interstitial_q: null, quiz_final_phase: 'podium', quiz_show_correction: false }).catch(() => {})
      await sbUpdate('sessions', { active_module: MODULE_ID, module_page: 200 }, `code=eq.${getActiveSessionCode()}`)
    } catch { /* best-effort */ }
    setShowGroupResults(true)
  }

  const handleTerminate = async () => {
    try {
      // quiz_show_correction reste sinon parfois bloqué à true si le quiz se
      // termine (ou est quitté) pendant que la correction d'une question est
      // affichée — le prochain quiz lancé dans cette salle en hériterait
      // (formés jetés direct sur un écran de correction, incident du 19/08).
      await setSharedState({ quiz_final_phase: 'ended', quiz_show_correction: false }).catch(() => {})
      await sbUpdate('sessions', { active_module: null, module_page: 0 }, `code=eq.${getActiveSessionCode()}`)
    } catch { /* best-effort */ }
    onBack()
  }

  if (!started) return (
    <>
      <style>{STYLES}</style>
      <Lobby onStart={handleStart} onBack={handleBack} />
    </>
  )

  if (showGroupResults) return (
    <>
      <style>{STYLES}</style>
      <GroupResultsView onTerminate={handleTerminate} />
    </>
  )

  const q = QUIZ_J1[quizQ]
  const type = q?.type || 'qcm'
  const isLast = quizQ >= QUIZ_J1.length - 1

  return (
    <>
      <style>{STYLES}</style>
      {(type === 'text-open' || type === 'text-open-multi' || type === 'text-open-pairs') ? (
        <TextOpenController quizQ={quizQ} isLast={isLast} onNext={handleNextQuestion} onEnd={handleEndQuiz} />
      ) : (
        <StandardController quizQ={quizQ} isLast={isLast} onNext={handleNextQuestion} onEnd={handleEndQuiz} />
      )}
    </>
  )
}
