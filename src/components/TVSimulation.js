'use client'
// Diffuseur de la simulation d'accueil (19/11) : photo de magasin floutée en
// fond, Lipto (le client) qui entre comme dans un jeu vidéo avec sa bulle,
// et à droite les réponses des collaborateurs puis la correction.
import { useState, useEffect } from 'react'
import Image from 'next/image'
import Lipto from '@/components/lipto/Lipto'
import { THEMES_TEL } from '@/lib/themeTelephone'
import { sbSelect, fetchOpenAnswers } from '@/lib/supabase'
import { fetchOnlineParticipantsList } from '@/lib/participantPresence'
import { countVotesPerOption } from '@/lib/quizVotes'
import { useQuizCountdown, QUIZ_TIME_LIMIT_SEC } from '@/components/ParticipantModuleView'
import { QUIZ_OPTION_COLORS } from '@/lib/constants'

const NAVY = '#03112a', OR = '#c9a227', VERT = '#4ade80'
const v = (px, vh) => `min(${px}px, ${vh}vh)`

// Fond : photo floutée, légèrement animée, assombrie côté texte
function FondMagasin({ image, children }) {
  return (
    <div style={{ position: 'relative', height: '100vh', overflow: 'hidden', background: NAVY, color: '#fff' }}>
      <div key={image} style={{
        position: 'absolute', inset: '-4%', backgroundImage: `url(${image})`, backgroundSize: 'cover', backgroundPosition: 'center',
        filter: 'blur(3px) saturate(1.1) brightness(0.95)', animation: 'simFond 1.2s ease both, simZoom 24s ease-in-out infinite alternate',
      }} />
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, rgba(3,17,42,0.12) 0%, rgba(3,17,42,0.3) 45%, rgba(3,17,42,0.85) 68%)' }} />
      <style>{CSS}</style>
      {children}
    </div>
  )
}

// Bulle qui s'écrit lettre par lettre
function BulleLipto({ texte, delai = 1.1 }) {
  const [n, setN] = useState(0)
  useEffect(() => {
    setN(0)
    let i = 0, t
    const demarrer = setTimeout(function suite() {
      i += 1; setN(i)
      if (i < texte.length) t = setTimeout(suite, 38)
    }, delai * 1000)
    return () => { clearTimeout(demarrer); clearTimeout(t) }
  }, [texte, delai])
  return (
    <div style={{ position: 'relative', background: '#fff', color: NAVY, borderRadius: 22, padding: `${v(20, 2.2)} ${v(26, 2.8)}`, maxWidth: 'min(420px, 23vw)', boxShadow: '0 10px 30px rgba(0,0,0,0.25)', animation: `simBulle .4s cubic-bezier(.2,.9,.3,1.3) ${delai - 0.3}s both` }}>
      <div style={{ fontSize: v(13, 1.4), letterSpacing: 2, textTransform: 'uppercase', color: '#7c5cff', fontWeight: 800 }}>Lipto · le client</div>
      <div style={{ fontSize: 'min(30px, 3.1vh, 1.9vw)', fontWeight: 700, lineHeight: 1.25, marginTop: 6, minHeight: '1.25em' }}>
        « {texte.slice(0, n)}<span style={{ opacity: n < texte.length ? 1 : 0, animation: 'simCurseur .8s steps(2) infinite' }}>|</span>{n >= texte.length ? ' »' : ''}
      </div>
      <div style={{ position: 'absolute', left: 40, bottom: -16, width: 0, height: 0, borderLeft: '14px solid transparent', borderRight: '14px solid transparent', borderTop: '18px solid #fff' }} />
    </div>
  )
}

function EnTete({ titre, sousTitre, droite }) {
  return (
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4vh 4vw', zIndex: 2 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
        <Image src="/assets/logo-lpt-blanc.png" alt="LPT" width={100} height={38} style={{ objectFit: 'contain', height: v(30, 3), width: 'auto' }} />
        <span style={{ fontSize: v(13, 1.3), letterSpacing: 4, textTransform: 'uppercase', color: 'rgba(255,255,255,0.75)' }}>{titre}{sousTitre && <span style={{ color: OR }}> · {sousTitre}</span>}</span>
      </div>
      {droite}
    </div>
  )
}

// Lipto entre par la gauche, comme un personnage de jeu vidéo
function LiptoScene({ pose, bulle, correction }) {
  return (
    <div style={{ position: 'absolute', left: '5vw', bottom: '5vh', display: 'flex', alignItems: 'flex-end', gap: '1.5vw', zIndex: 1 }}>
      <div style={{ animation: correction ? 'none' : 'simEntree 1.1s cubic-bezier(.25,.8,.3,1) both' }}>
        <Lipto key={pose + correction} pose={pose} anim={correction ? 'rebond' : 'reflexion'} taille={420} t={THEMES_TEL.clair} />
      </div>
      <div style={{ marginBottom: '28vh' }}><BulleLipto texte={bulle} delai={correction ? 0.3 : 1.2} /></div>
    </div>
  )
}

function useReponsesSimulation({ sessionCode, moduleId, qIdx, libre }) {
  const [etat, setEtat] = useState({ reponses: [], connectes: 0 })
  useEffect(() => {
    if (!sessionCode) return
    const lire = async () => {
      try {
        const [reponses, connectes] = await Promise.all([
          libre ? fetchOpenAnswers(sessionCode, `${moduleId}:${qIdx}`) : sbSelect('quiz_answers', `session_code=eq.${encodeURIComponent(sessionCode)}&module_id=eq.${encodeURIComponent(moduleId)}&question_idx=eq.${qIdx}`),
          fetchOnlineParticipantsList(sessionCode),
        ])
        setEtat({ reponses: reponses || [], connectes: (connectes || []).length })
      } catch { /* réessai au prochain tour */ }
    }
    lire()
    const t = setInterval(lire, 2000)
    return () => clearInterval(t)
  }, [sessionCode, moduleId, qIdx, libre])
  return etat
}

// Validations ✓ du formateur (réponse libre) — pour la correction
function useBonnesReponses({ sessionCode, moduleId, qIdx, actif }) {
  const [bonnes, setBonnes] = useState(0)
  useEffect(() => {
    if (!actif || !sessionCode) return
    const lire = () => sbSelect('quiz_answers', `session_code=eq.${encodeURIComponent(sessionCode)}&module_id=eq.${encodeURIComponent(moduleId)}&question_idx=eq.${qIdx}&is_correct=eq.true`).then(r => setBonnes((r || []).length)).catch(() => {})
    lire()
    const t = setInterval(lire, 2000)
    return () => clearInterval(t)
  }, [sessionCode, moduleId, qIdx, actif])
  return bonnes
}

function Chrono({ moduleId, qIdx, sessionCode, secondes }) {
  const reste = useQuizCountdown({ enabled: true, moduleId, qIdx, sessionCode, seconds: secondes })
  return <span style={{ fontVariantNumeric: 'tabular-nums', fontSize: v(24, 2.4), fontWeight: 700, color: reste <= 15 ? '#f87171' : '#fff' }}>{Math.floor(reste / 60)}:{String(reste % 60).padStart(2, '0')}</span>
}

// Ordonnance fictive que Lipto tend au vendeur — papier blanc, bien lisible de loin
function OrdonnancePapier({ ordo, compacte = false }) {
  const cel = { padding: '1.4vh 1vw', fontSize: v(26, 2.7), fontWeight: 600, textAlign: 'center', fontVariantNumeric: 'tabular-nums', borderBottom: '1px solid #e5e7eb' }
  const ent = { ...cel, fontSize: v(13, 1.35), fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', color: '#64748b' }
  return (
    <div style={{ background: '#fff', color: '#0f172a', borderRadius: 6, padding: '4vh 3vw', boxShadow: '0 24px 60px rgba(0,0,0,0.35)', transform: compacte ? 'scale(0.82) rotate(-1.5deg)' : 'rotate(-1.5deg)', transformOrigin: 'top left', animation: compacte ? 'simGlisseGauche .8s cubic-bezier(.2,.9,.3,1) both' : 'simOrdo .7s cubic-bezier(.2,.9,.3,1.2) both', fontFamily: 'Georgia, serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 20 }}>
        <div>
          <div style={{ fontSize: v(22, 2.3), fontWeight: 700 }}>Cabinet d’ophtalmologie</div>
          <div style={{ fontSize: v(14, 1.5), color: '#64748b', marginTop: 4 }}>Exemple de formation · document fictif</div>
        </div>
        <div style={{ fontSize: v(16, 1.7), color: '#334155' }}>Le {ordo.date}</div>
      </div>
      <div style={{ marginTop: '3vh', fontSize: v(18, 1.9) }}>Patient : <b style={{ letterSpacing: 2 }}>{ordo.patient}</b></div>
      <div style={{ marginTop: '1vh', fontSize: v(18, 1.9), fontStyle: 'italic' }}>Verres correcteurs :</div>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1.5vh', fontFamily: 'inherit' }}>
        <thead><tr>{['', 'Sphère', 'Cylindre', 'Axe', 'Addition'].map(h => <th key={h} style={ent}>{h}</th>)}</tr></thead>
        <tbody>
          {[['OD', ordo.od], ['OG', ordo.og]].map(([o, d]) => (
            <tr key={o}>
              <td style={{ ...cel, fontWeight: 800, color: '#0089ba' }}>{o}</td>
              <td style={cel}>{d.sph}</td><td style={cel}>({d.cyl})</td><td style={cel}>{d.axe}°</td><td style={cel}>{d.add}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <svg viewBox="0 0 220 60" style={{ display: 'block', marginLeft: 'auto', marginTop: '2.5vh', width: v(170, 17), height: 'auto' }} aria-hidden>
        <path d="M5 40 C 25 5, 40 55, 60 30 S 95 10, 110 35 S 150 50, 165 20 S 200 30, 215 25" fill="none" stroke="#1e3a8a" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
    </div>
  )
}

// Ticket d'examen de vue (papier thermique), même mise en avant que l'ordonnance
function TicketExamen({ t: tk }) {
  const mono = { fontFamily: '"Courier New", ui-monospace, monospace', letterSpacing: 2 }
  const ligne = (g, m, d) => (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '1.5vw', padding: '0.6vh 0' }}>
      <span>{g}</span><span style={{ textAlign: 'center' }}>{m}</span><span style={{ textAlign: 'right' }}>{d}</span>
    </div>
  )
  return (
    <div style={{
      ...mono, width: 'min(440px, 30vw)', margin: '0 auto', color: '#1f2937', fontSize: v(22, 2.3), fontWeight: 600, lineHeight: 1.35,
      background: 'linear-gradient(180deg, #ffffff 0%, #f4f6f8 100%)', padding: '4vh 2.4vw 3.5vh',
      borderRadius: '4px 4px 10px 10px', boxShadow: '0 24px 60px rgba(0,0,0,0.35)', transform: 'rotate(1.5deg)',
      animation: 'simTicket .8s cubic-bezier(.2,.9,.3,1.2) both',
    }}>
      <div>ID:</div>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>NAME: {tk.nom}</span><span>M/F</span></div>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>{tk.date}</span><span>{tk.heure}</span></div>
      <div style={{ textAlign: 'right' }}>WD={tk.wd}</div>
      <div style={{ marginTop: '2.5vh', display: 'flex', justifyContent: 'space-between' }}><span>--&lt;R&gt;-----</span><span>-----&lt;L&gt;--</span></div>
      <div>-- FAR --</div>
      {ligne(tk.od.sph, 'SPH', tk.og.sph)}
      {ligne(tk.od.cyl, 'CYL', tk.og.cyl)}
      {ligne(tk.od.axe, 'AXS', tk.og.axe)}
      <div style={{ textAlign: 'center', marginTop: '0.6vh' }}>PD</div>
      <div style={{ textAlign: 'center' }}>{tk.pd}</div>
      <div style={{ textAlign: 'center', marginTop: '3vh' }}>{tk.magasin[0]}</div>
      <div style={{ textAlign: 'center' }}>{tk.magasin[1]}</div>
    </div>
  )
}

// Lipto part en examen de vue : salle d'examen + « examen en cours » quelques secondes
function useAnimationExamen(actif, qIdx) {
  const [enCours, setEnCours] = useState(actif)
  useEffect(() => {
    if (!actif) { setEnCours(false); return }
    setEnCours(true)
    const t = setTimeout(() => setEnCours(false), 4000)
    return () => clearTimeout(t)
  }, [actif, qIdx])
  return enCours
}

export function TVSimulationScene({ question: q, qIdx, sessionCode, moduleId, correction, replique: repliqueChoisie }) {
  const sc = q.simulation
  const scene = q.type === 'scene' // Lipto parle, pas de question aux collaborateurs
  const examenEnCours = useAnimationExamen(!!sc.animationExamen, qIdx)
  // Question avec ordonnance (Lipto la tend) : 5 s d'ordonnance en grand, puis
  // ordonnance à gauche avec Lipto et réponses à droite
  const avecOrdo = !!(sc.ordonnance && q.options?.length)
  const [intro, setIntro] = useState(avecOrdo && !correction)
  useEffect(() => {
    if (!avecOrdo || correction) { setIntro(false); return }
    setIntro(true)
    const t = setTimeout(() => setIntro(false), (sc.ordonnanceIntroSec || 5) * 1000)
    return () => clearTimeout(t)
  }, [avecOrdo, correction, qIdx, sc.ordonnanceIntroSec])
  // Réplique choisie par le formateur pour CETTE scène (cf. FRepliquesLipto)
  const replique = correction && repliqueChoisie?.scene === qIdx ? sc.repliques?.find(r => r.id === repliqueChoisie.id) : null
  const libre = q.type === 'text-open'
  const { reponses, connectes } = useReponsesSimulation({ sessionCode, moduleId, qIdx, libre })
  const bonnesLibres = useBonnesReponses({ sessionCode, moduleId, qIdx, actif: libre && correction })
  const nb = reponses.length
  const votes = q.options ? countVotesPerOption(reponses, q.options.length, false) : []
  const bonnesQcm = reponses.filter(r => r.is_correct).length

  const pose = replique ? (replique.ordonnance ? 'bienvenue' : 'reflexion') : correction ? (sc.poseCorrection || (libre ? 'pouce' : 'reflexion')) : sc.pose
  const bulle = replique ? replique.texte
    : correction ? (libre ? 'En 10 minutes ? Avec ou sans ordonnance ? Génial !' : sc.repliqueCorrection || sc.bulle)
    : sc.bulle

  const panneau = { position: 'absolute', right: '4vw', top: '14vh', bottom: '6vh', width: 'min(640px, 42vw)', display: 'flex', flexDirection: 'column', justifyContent: 'center', zIndex: 2 }
  const petitTitre = { fontSize: v(13, 1.3), letterSpacing: 3, textTransform: 'uppercase', color: 'rgba(255,255,255,0.6)', paddingBottom: '1.2vh', borderBottom: '1px solid rgba(255,255,255,0.2)' }

  return (
    <FondMagasin image={correction ? sc.imageCorrection || sc.image : sc.image}>
      <EnTete titre="Simulation finale" sousTitre={sc.titre}
        droite={scene ? null : correction
          ? <span style={{ fontSize: v(13, 1.3), letterSpacing: 4, textTransform: 'uppercase', color: VERT, fontWeight: 700 }}>✓ Correction</span>
          : <Chrono moduleId={moduleId} qIdx={qIdx} sessionCode={sessionCode} secondes={q.timeLimitSec || QUIZ_TIME_LIMIT_SEC} />} />
      {examenEnCours ? (
        // Lipto est dans la salle d'examen : pas de Lipto à l'écran, juste l'attente
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 3, background: 'rgba(3,17,42,0.35)' }}>
          <div style={{ fontSize: v(70, 7), animation: 'simBulle .5s ease both' }}>👁️</div>
          <div style={{ fontSize: v(44, 4.6), fontWeight: 800, marginTop: '2vh', animation: 'simBulle .5s ease .2s both' }}>Examen de vue en cours…</div>
          <div style={{ width: 'min(420px, 40vw)', height: 4, background: 'rgba(255,255,255,0.25)', borderRadius: 4, marginTop: '4vh', overflow: 'hidden' }}>
            <div style={{ height: '100%', background: OR, animation: 'simProgression 3.8s linear both' }} />
          </div>
        </div>
      ) : avecOrdo && !intro ? (
        // Après l'intro : l'ordonnance à gauche, Lipto en petit en dessous
        <>
          <div style={{ position: 'absolute', left: '4vw', top: '15vh', width: 'min(640px, 46vw)', zIndex: 1 }}>
            <OrdonnancePapier ordo={sc.ordonnance} compacte />
          </div>
          <div style={{ position: 'absolute', left: '3vw', bottom: '3vh', zIndex: 1 }}>
            <Lipto pose="bienvenue" anim="apparition" taille={210} t={THEMES_TEL.clair} />
          </div>
        </>
      ) : (
        <LiptoScene pose={pose} bulle={bulle} correction={correction} />
      )}

      <div style={panneau}>
        {examenEnCours ? null : sc.ticket ? (
          <TicketExamen t={sc.ticket} />
        ) : avecOrdo && intro ? (
          <OrdonnancePapier ordo={sc.ordonnance} />
        ) : replique?.ordonnance ? (
          <OrdonnancePapier ordo={replique.ordonnance} />
        ) : scene ? (
          sc.ordonnance ? <OrdonnancePapier ordo={sc.ordonnance} /> : (
            <div style={{ animation: 'simBulle .5s ease 1.4s both' }}>
              <div style={petitTitre}>À vous de jouer</div>
              <div style={{ fontSize: v(40, 4.2), fontWeight: 800, lineHeight: 1.2, marginTop: '3vh' }}>Que répondez-vous à Lipto ?</div>
            </div>
          )
        ) : libre ? (
          <>
            <div style={petitTitre}>À vous de présenter le concept</div>
            <div style={{ fontSize: v(34, 3.6), fontWeight: 700, lineHeight: 1.3, marginTop: '3vh' }}>« Notre concept est simple : vous avez la possibilité d’avoir…</div>
            {correction
              ? <div style={{ fontSize: v(34, 3.6), fontWeight: 700, lineHeight: 1.3, marginTop: '1.5vh', color: VERT, animation: 'simBulle .5s ease both' }}>{q.hint.charAt(0).toLowerCase() + q.hint.slice(1)}. »</div>
              : <div style={{ fontSize: v(30, 3.2), marginTop: '1.5vh', color: OR, borderBottom: `2px dashed ${OR}`, paddingBottom: 6, fontStyle: 'italic' }}>… à compléter sur votre téléphone</div>}
            <div style={{ marginTop: '5vh', display: 'flex', alignItems: 'baseline', gap: 12 }}>
              <span style={{ fontSize: v(60, 6), fontWeight: 300, lineHeight: 1, color: correction ? VERT : '#fff' }}>{correction ? bonnesLibres : nb}</span>
              <span style={{ fontSize: v(20, 2), color: 'rgba(255,255,255,0.6)' }}>{correction ? `/ ${nb} bonne${bonnesLibres > 1 ? 's' : ''} réponse${bonnesLibres > 1 ? 's' : ''}` : `/ ${connectes || '?'} ont répondu`}</span>
            </div>
          </>
        ) : (
          <>
            {avecOrdo && (
              // Question de lecture d'ordonnance : l'intitulé en grand
              <div style={{ fontSize: v(34, 3.6), fontWeight: 800, lineHeight: 1.2, marginBottom: '2.5vh', animation: 'simOption .4s ease both' }}>{sc.questionTV || 'Quels sont les problèmes visuels de Lipto\u00a0?'}</div>
            )}
            <div style={petitTitre}>{correction ? (Array.isArray(q.correct) ? 'Les bonnes réponses' : 'La bonne réponse') : avecOrdo ? 'Réponses' : 'Que lui répondez-vous ?'}</div>
            {q.options.map((o, i) => {
              const bonne = Array.isArray(q.correct) ? q.correct.includes(i) : i === q.correct
              const couleur = QUIZ_OPTION_COLORS[i] || '#94a3b8'
              const eteinte = correction && !bonne
              return (
                <div key={i} style={{ padding: '1.6vh 0', borderBottom: '1px solid rgba(255,255,255,0.12)', animation: `simOption .4s ease ${0.6 + i * 0.12}s both` }}>
                  <div style={{ opacity: eteinte ? 0.5 : 1, display: 'grid', gridTemplateColumns: 'min(46px, 4.6vh) 1fr auto', gap: '1.2vw', alignItems: 'center' }}>
                    <span style={{ width: v(40, 4), height: v(40, 4), borderRadius: 8, border: `2px solid ${correction && bonne ? VERT : couleur}`, background: correction && bonne ? VERT : 'transparent', color: correction && bonne ? NAVY : couleur, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: v(18, 1.9) }}>{correction && bonne ? '✓' : 'ABCD'[i]}</span>
                    <span style={{ fontSize: v(26, 2.7), fontWeight: correction && bonne ? 800 : 500, lineHeight: 1.25 }}>{o}</span>
                    {correction && <span style={{ fontSize: v(24, 2.4), fontWeight: 300, color: bonne ? VERT : 'rgba(255,255,255,0.7)' }}>{votes[i] || 0}</span>}
                  </div>
                  {correction && sc.pourquoi?.[i] && (
                    <div style={{ marginLeft: 'calc(min(46px, 4.6vh) + 1.2vw)', marginTop: '0.8vh', fontSize: v(16, 1.7), color: bonne ? VERT : 'rgba(255,255,255,0.7)' }}>{sc.pourquoi[i].replace(/^[A-D] — /, '')}</div>
                  )}
                </div>
              )
            })}
            <div style={{ marginTop: '3vh', display: 'flex', alignItems: 'baseline', gap: 12 }}>
              <span style={{ fontSize: v(52, 5.2), fontWeight: 300, lineHeight: 1, color: correction ? VERT : '#fff' }}>{correction ? bonnesQcm : nb}</span>
              <span style={{ fontSize: v(20, 2), color: 'rgba(255,255,255,0.6)' }}>{correction ? `/ ${nb} bonne${bonnesQcm > 1 ? 's' : ''} réponse${bonnesQcm > 1 ? 's' : ''}` : `/ ${connectes || '?'} ont répondu`}</span>
            </div>
          </>
        )}
      </div>
    </FondMagasin>
  )
}

// Page d'attente : le magasin, Lipto devant la porte, les collaborateurs connectés
export function TVSimulationLobby({ sessionCode }) {
  const [noms, setNoms] = useState([])
  useEffect(() => {
    if (!sessionCode) return
    const lire = () => fetchOnlineParticipantsList(sessionCode).then(l => setNoms((l || []).map(p => p.name).filter(Boolean))).catch(() => {})
    lire()
    const t = setInterval(lire, 3000)
    return () => clearInterval(t)
  }, [sessionCode])
  return (
    <FondMagasin image="/assets/magasins/magasin-comptoir.webp">
      <EnTete titre="Simulation finale" />
      <div style={{ position: 'absolute', left: '6vw', bottom: '6vh', zIndex: 1, animation: 'simEntree 1.1s cubic-bezier(.25,.8,.3,1) both' }}>
        <Lipto pose="bienvenue" anim="reflexion" taille={400} t={THEMES_TEL.clair} />
      </div>
      <div style={{ position: 'absolute', right: '5vw', top: 0, bottom: 0, width: 'min(640px, 46vw)', display: 'flex', flexDirection: 'column', justifyContent: 'center', zIndex: 2 }}>
        <div style={{ fontSize: v(14, 1.4), letterSpacing: 5, textTransform: 'uppercase', color: OR, fontWeight: 700 }}>Bientôt en magasin…</div>
        <div style={{ fontSize: v(58, 6), fontWeight: 800, lineHeight: 1.1, marginTop: '2vh' }}>Lipto va entrer.<br />Saurez-vous l’accueillir ?</div>
        <div style={{ fontSize: v(14, 1.4), letterSpacing: 3, textTransform: 'uppercase', color: 'rgba(255,255,255,0.6)', marginTop: '5vh', paddingBottom: '1.2vh', borderBottom: '1px solid rgba(255,255,255,0.2)' }}>Connectés · {noms.length}</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: '2vh' }}>
          {noms.length === 0
            ? <span style={{ fontSize: v(20, 2), color: 'rgba(255,255,255,0.6)', fontStyle: 'italic' }}>Connectez-vous sur votre téléphone…</span>
            : noms.map(n => <span key={n} style={{ fontSize: v(20, 2), padding: '0.8vh 1.2vw', borderRadius: 999, background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.25)', animation: 'simBulle .4s ease both' }}>{n}</span>)}
        </div>
      </div>
    </FondMagasin>
  )
}

const CSS = `
@keyframes simFond { from { opacity: 0; } to { opacity: 1; } }
@keyframes simZoom { from { transform: scale(1); } to { transform: scale(1.06) translateX(-1%); } }
@keyframes simEntree {
  0% { transform: translateX(-70vw); }
  55% { transform: translateX(2vw); }
  70% { transform: translateX(-1vw) translateY(-14px); }
  85% { transform: translateX(0) translateY(0); }
  92% { transform: translateY(-6px); }
  100% { transform: none; }
}
@keyframes simBulle { from { opacity: 0; transform: scale(.85) translateY(10px); } to { opacity: 1; transform: none; } }
@keyframes simOption { from { opacity: 0; transform: translateX(14px); } to { opacity: 1; transform: none; } }
@keyframes simCurseur { 50% { opacity: 0; } }
@keyframes simGlisseGauche { from { opacity: 0; transform: translateX(40vw) scale(1) rotate(-1.5deg); } to { opacity: 1; transform: scale(0.82) rotate(-1.5deg); } }
@keyframes simTicket { from { opacity: 0; transform: translateY(-40vh) rotate(-8deg); } to { opacity: 1; transform: rotate(1.5deg); } }
@keyframes simProgression { from { width: 0; } to { width: 100%; } }
@keyframes simOrdo { from { opacity: 0; transform: translateX(-30vw) rotate(-14deg) scale(.6); } to { opacity: 1; transform: rotate(-1.5deg); } }
@media (prefers-reduced-motion: reduce) { [style*="simEntree"], [style*="simZoom"] { animation: none !important; } }
`
