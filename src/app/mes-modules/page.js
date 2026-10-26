'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import Image from 'next/image'
import { sbSelect } from '@/lib/supabase'
import { apiGetCollaborateurByLogin, apiChangerCode, getCollaborateurById } from '@/lib/collaborateursApi'
import {
  MODULE_GROUPES, MODULES, NB_FORMATS, niveauPour, prochainNiveau,
  etatModules, statutModule, getResultatsModules, enregistrerResultatModule, modulesOuverts,
} from '@/lib/modulesApresFormation'

// Page autonome (comme /espace-collaborateur) — modules après-formation pour
// les collaborateurs déjà en magasin. Aucune dépendance à la formation
// initiale (page.js / Dashboard.js) : seules les tables collaborateurs,
// magasins et module_resultats sont lues ou écrites.
const SESSION_KEY = 'mes_modules_session'

const inputStyle = {
  width: '100%', boxSizing: 'border-box', padding: '12px 14px', marginBottom: 12,
  background: 'rgba(255,255,255,0.07)', border: '1.5px solid rgba(255,255,255,0.15)',
  borderRadius: 10, color: '#fff', fontSize: 16, fontFamily: 'inherit', outline: 'none',
}
const fondConnexion = { minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, background: 'linear-gradient(160deg,#0f1923 0%,#1a2535 60%,#00abe9 100%)' }
const carteConnexion = { background: 'linear-gradient(175deg,#0099d0 0%,#0d2538 42%,#091520 100%)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 22, width: '100%', maxWidth: 400, boxShadow: '0 28px 80px rgba(0,0,0,0.5)', padding: '32px 28px' }
const erreurStyle = { color: '#f87171', fontSize: 13, marginTop: 12, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, padding: '9px 12px' }
const cardStyle = { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 16, padding: 18, boxShadow: '0 1px 2px rgba(16,24,40,0.03)' }

function boutonPrincipal(actif) {
  return { width: '100%', marginTop: 18, padding: 13, border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 700, fontFamily: 'inherit', color: '#fff', cursor: actif ? 'pointer' : 'default', background: actif ? 'linear-gradient(135deg, #0089ba, #00abe9)' : 'rgba(255,255,255,0.15)' }
}

function sauverSession(session) {
  try { localStorage.setItem(SESSION_KEY, JSON.stringify(session)) } catch {}
}

// ── Connexion ─────────────────────────────────────────────────────────────
function Connexion({ onLogin }) {
  const [login, setLogin] = useState('')
  const [code, setCode] = useState('')
  const [erreur, setErreur] = useState('')
  const [chargement, setChargement] = useState(false)

  const submit = async e => {
    e.preventDefault()
    if (!login.trim() || !code.trim() || chargement) return
    setChargement(true); setErreur('')
    const row = await apiGetCollaborateurByLogin(login.trim().toLowerCase(), code.trim())
    if (!row) { setChargement(false); setErreur('Identifiant ou code incorrect.'); return }
    const magasins = await sbSelect('magasins', `id=eq.${row.magasin_id}&select=id,nom`)
    setChargement(false)
    const session = {
      id: row.id, prenom: row.prenom, nom: row.nom, poste: row.poste,
      magasinNom: magasins?.[0]?.nom || '—', doitChangerCode: row.doit_changer_code,
    }
    sauverSession(session)
    onLogin(session)
  }

  return (
    <div style={fondConnexion}>
      <form onSubmit={submit} style={carteConnexion}>
        <div style={{ textAlign: 'center', marginBottom: 22 }}>
          <Image src="/assets/logo-lpt-blanc.png" alt="Lunettes Pour Tous" width={140} height={52} style={{ objectFit: 'contain', margin: '0 auto 18px' }} />
          <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.45)', letterSpacing: 2.5, textTransform: 'uppercase', marginBottom: 6 }}>Après la formation</div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#fff' }}>Mes modules</h1>
        </div>
        <label htmlFor="mm-login" style={{ display: 'none' }}>Identifiant</label>
        <input id="mm-login" value={login} onChange={e => setLogin(e.target.value)} placeholder="Identifiant" autoCapitalize="off" autoCorrect="off" autoComplete="username" style={inputStyle} />
        <label htmlFor="mm-code" style={{ display: 'none' }}>Code</label>
        <input id="mm-code" value={code} onChange={e => setCode(e.target.value)} placeholder="Code" type="password" autoComplete="current-password" style={{ ...inputStyle, marginBottom: 0 }} />
        {erreur && <div style={erreurStyle}>{erreur}</div>}
        <button type="submit" disabled={chargement} style={boutonPrincipal(!chargement)}>
          {chargement ? 'Connexion…' : 'Se connecter →'}
        </button>
        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', marginTop: 16, textAlign: 'center', lineHeight: 1.5 }}>
          Ton formateur t&apos;a donné ton identifiant et ton code provisoire.
        </p>
      </form>
    </div>
  )
}

// ── Choix du code personnel (1re connexion) ──────────────────────────────
function ChangerCode({ session, onChanged }) {
  const [code1, setCode1] = useState('')
  const [code2, setCode2] = useState('')
  const [erreur, setErreur] = useState('')
  const [enregistrement, setEnregistrement] = useState(false)

  const submit = async e => {
    e.preventDefault()
    if (!/^\d{6}$/.test(code1)) { setErreur('Le code doit contenir exactement 6 chiffres.'); return }
    if (code1 !== code2) { setErreur('Les deux codes ne correspondent pas.'); return }
    setEnregistrement(true); setErreur('')
    const ok = await apiChangerCode(session.id, code1)
    setEnregistrement(false)
    if (!ok) { setErreur('Le code n\'a pas pu être enregistré. Vérifie ta connexion et réessaie.'); return }
    const maj = { ...session, doitChangerCode: false }
    sauverSession(maj)
    onChanged(maj)
  }

  return (
    <div style={fondConnexion}>
      <form onSubmit={submit} style={carteConnexion}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.45)', letterSpacing: 2.5, textTransform: 'uppercase', marginBottom: 6, textAlign: 'center' }}>1re connexion</div>
        <h1 style={{ margin: '0 0 8px', fontSize: 20, fontWeight: 700, color: '#fff', textAlign: 'center' }}>Choisis ton code personnel</h1>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', textAlign: 'center', marginBottom: 20 }}>Un code à 6 chiffres, à garder pour tes prochaines connexions.</p>
        <input id="mm-code1" value={code1} onChange={e => setCode1(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="Nouveau code (6 chiffres)" type="password" inputMode="numeric" autoComplete="new-password" style={inputStyle} />
        <input id="mm-code2" value={code2} onChange={e => setCode2(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="Confirme le code" type="password" inputMode="numeric" autoComplete="new-password" style={{ ...inputStyle, marginBottom: 0 }} />
        {erreur && <div style={erreurStyle}>{erreur}</div>}
        <button type="submit" disabled={enregistrement} style={boutonPrincipal(!enregistrement)}>
          {enregistrement ? 'Enregistrement…' : 'Valider mon code →'}
        </button>
      </form>
    </div>
  )
}

// ── Dashboard ─────────────────────────────────────────────────────────────
const STATUTS = {
  'acquis': { label: '✓ Acquis', bg: '#dcfce7', color: '#15803d' },
  'en-cours': { label: 'En cours', bg: '#fff7ed', color: '#c2410c' },
  'a-faire': { label: 'À faire', bg: '#f3f4f6', color: '#6b7280' },
}

function CarteNiveau({ nbAcquis, nbOuverts }) {
  const niveau = niveauPour(nbAcquis)
  const suivant = prochainNiveau(nbAcquis)
  const pct = nbOuverts ? Math.round((nbAcquis / nbOuverts) * 100) : 0
  return (
    <div style={{ ...cardStyle, marginBottom: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#9aa1ac', textTransform: 'uppercase', letterSpacing: 0.6 }}>Mon niveau</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: niveau.couleur }}>{niveau.nom}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#14161a', fontVariantNumeric: 'tabular-nums' }}>{nbAcquis}<span style={{ color: '#9aa1ac', fontSize: 15 }}> / {nbOuverts}</span></div>
          <div style={{ fontSize: 12, color: '#6b7280' }}>modules acquis</div>
        </div>
      </div>
      <div style={{ height: 8, background: '#eef0f3', borderRadius: 99, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: niveau.couleur, borderRadius: 99, transition: 'width .4s' }} />
      </div>
      <div style={{ fontSize: 12.5, color: '#6b7280' }}>
        {suivant
          ? `Encore ${suivant.min - nbAcquis} module${suivant.min - nbAcquis > 1 ? 's' : ''} acquis pour passer ${suivant.nom}. Un module est acquis quand tu réussis son test (10/12).`
          : 'Tu as atteint le niveau maximum, bravo !'}
      </div>
    </div>
  )
}

function LigneModule({ module, etat, onOuvrir }) {
  const statut = STATUTS[statutModule(etat)]
  return (
    <button onClick={onOuvrir} style={{ ...cardStyle, width: '100%', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left', padding: '14px 16px' }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14.5, fontWeight: 700, color: '#14161a' }}>{module.nom}</div>
        <div style={{ fontSize: 12, color: '#6b7280', marginTop: 3, fontVariantNumeric: 'tabular-nums' }}>
          Entraînement {etat.formats.size}/{NB_FORMATS}
          {etat.meilleurScore !== null && ` · Meilleur test ${etat.meilleurScore}/12`}
        </div>
      </div>
      <span style={{ fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 20, background: statut.bg, color: statut.color, flexShrink: 0 }}>{statut.label}</span>
      <span style={{ color: '#9aa1ac', fontSize: 18, flexShrink: 0 }}>→</span>
    </button>
  )
}

function LecteurModule({ module, etat, onFermer, onMessage }) {
  const iframeRef = useRef(null)
  // L'URL est figée à l'ouverture : la mettre à jour rechargerait le module en
  // plein exercice. L'état initial vient de la base (bridge-avant.js).
  const [src] = useState(() => {
    const p = new URLSearchParams({ m: module.id, faits: [...etat.formats].join(','), acquis: etat.acquis ? '1' : '0' })
    return `/modules-apres-formation/${module.fichier}?${p}`
  })

  useEffect(() => {
    const ecouter = event => {
      if (event.origin !== window.location.origin) return
      if (event.source !== iframeRef.current?.contentWindow) return
      const data = event.data
      if (!data || data.source !== 'lpt-module' || data.module !== module.id) return
      onMessage(data)
    }
    window.addEventListener('message', ecouter)
    return () => window.removeEventListener('message', ecouter)
  }, [module.id, onMessage])

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, background: '#F3F6F4', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', paddingTop: 'max(10px, env(safe-area-inset-top))', background: '#fff', borderBottom: '1px solid #e5e7eb' }}>
        <button onClick={onFermer} style={{ padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: 10, background: '#fff', color: '#0089ba', fontWeight: 700, fontSize: 13.5, cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0 }}>← Mes modules</button>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#14161a', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{module.nom}</div>
      </div>
      <iframe ref={iframeRef} src={src} title={module.nom} style={{ flex: 1, width: '100%', border: 0, display: 'block' }} />
    </div>
  )
}

function Dashboard({ session, onLogout }) {
  const [resultats, setResultats] = useState(null)
  const [ouverts, setOuverts] = useState([])
  const [moduleOuvert, setModuleOuvert] = useState(null)
  const [alerte, setAlerte] = useState(null)

  const charger = useCallback(async () => {
    const [fiche, res] = await Promise.all([getCollaborateurById(session.id), getResultatsModules(session.id)])
    setOuverts(modulesOuverts(fiche))
    setResultats(res)
  }, [session.id])

  useEffect(() => { charger() }, [charger])

  // Le formateur ouvre les modules depuis sa fiche, souvent pendant que le
  // collaborateur a la page ouverte : on rafraîchit régulièrement la liste
  // (hors module en cours, pour ne jamais recharger un exercice).
  useEffect(() => {
    if (moduleOuvert) return
    const rafraichir = () => { if (document.visibilityState === 'visible') charger() }
    const t = setInterval(rafraichir, 20000)
    document.addEventListener('visibilitychange', rafraichir)
    return () => { clearInterval(t); document.removeEventListener('visibilitychange', rafraichir) }
  }, [moduleOuvert, charger])

  const surMessage = useCallback(async message => {
    const ok = await enregistrerResultatModule(session.id, message)
    if (!ok) {
      setAlerte('⚠️ Ton résultat n\'a pas pu être enregistré. Préviens ton formateur.')
      setTimeout(() => setAlerte(null), 6000)
      return
    }
    if (message.type === 'test') {
      setAlerte(message.score >= 10 ? `✅ Test réussi : ${message.score}/12, module acquis !` : `Test enregistré : ${message.score}/12`)
      setTimeout(() => setAlerte(null), 4000)
    }
    charger()
  }, [session.id, charger])

  const etats = etatModules(resultats || [])
  const nbAcquis = ouverts.filter(id => etats[id]?.acquis).length
  const moduleActif = MODULES.find(m => m.id === moduleOuvert && ouverts.includes(m.id))
  const groupesVisibles = MODULE_GROUPES
    .map(g => ({ ...g, modules: g.modules.filter(m => ouverts.includes(m.id)) }))
    .filter(g => g.modules.length)

  return (
    <div style={{ minHeight: '100dvh', background: '#f5f6f8' }}>
      <div style={{ background: '#fff', borderBottom: '1px solid #e5e7eb', padding: '18px 20px', display: 'flex', justifyContent: 'center' }}>
        <Image src="/assets/logo-lpt.png" alt="Lunettes Pour Tous" width={150} height={56} style={{ objectFit: 'contain' }} />
      </div>
      <div style={{ padding: '24px 16px 48px' }}>
        <div style={{ maxWidth: 640, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
            <div>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#14161a' }}>Bonjour {session.prenom} 👋</div>
              <div style={{ fontSize: 13, color: '#6b7280', marginTop: 2 }}>{session.poste ? `${session.poste} · ` : ''}Magasin {session.magasinNom}</div>
            </div>
            <button onClick={onLogout} style={{ padding: '8px 14px', border: '1px solid #e5e7eb', borderRadius: 8, background: '#fff', color: '#6b7280', fontWeight: 600, fontSize: 12.5, cursor: 'pointer', fontFamily: 'inherit' }}>Se déconnecter</button>
          </div>

          {resultats === null ? (
            <div style={{ color: '#9aa1ac', fontSize: 13 }}>Chargement…</div>
          ) : (
            <>
              {ouverts.length === 0 ? (
                <div style={{ ...cardStyle, textAlign: 'center', padding: '32px 22px' }}>
                  <div style={{ fontSize: 30, marginBottom: 10 }}>🎓</div>
                  <div style={{ fontSize: 15.5, fontWeight: 700, color: '#14161a', marginBottom: 6 }}>Tes modules arrivent bientôt</div>
                  <div style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.6 }}>Ton formateur va t&apos;ouvrir tes premiers modules. Ils apparaîtront ici automatiquement.</div>
                </div>
              ) : (
              <>
              <CarteNiveau nbAcquis={nbAcquis} nbOuverts={ouverts.length} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
                {groupesVisibles.map(groupe => (
                  <div key={groupe.titre}>
                    <div style={{ fontSize: 11.5, fontWeight: 800, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>{groupe.titre}</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {groupe.modules.map(m => (
                        <LigneModule key={m.id} module={m} etat={etats[m.id]} onOuvrir={() => setModuleOuvert(m.id)} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <p style={{ fontSize: 12.5, color: '#9aa1ac', textAlign: 'center', marginTop: 24, lineHeight: 1.6 }}>
                Chaque module : un cours, des exercices d&apos;entraînement, puis un test. Il faut 10/12 au test pour l&apos;acquérir.
              </p>
              </>
              )}
            </>
          )}
        </div>
      </div>

      {moduleActif && resultats !== null && (
        <LecteurModule
          key={moduleActif.id}
          module={moduleActif}
          etat={etats[moduleActif.id]}
          onFermer={() => { setModuleOuvert(null); charger() }}
          onMessage={surMessage}
        />
      )}

      {alerte && (
        <div role="status" style={{ position: 'fixed', left: '50%', bottom: 'max(20px, env(safe-area-inset-bottom))', transform: 'translateX(-50%)', zIndex: 60, background: '#14161a', color: '#fff', padding: '11px 18px', borderRadius: 12, fontSize: 13.5, fontWeight: 600, boxShadow: '0 10px 30px rgba(0,0,0,0.3)', maxWidth: 'calc(100% - 32px)' }}>
          {alerte}
        </div>
      )}
    </div>
  )
}

export default function MesModulesPage() {
  const [session, setSession] = useState(undefined)

  useEffect(() => {
    let annule = false
    ;(async () => {
      let brut = null
      try { brut = localStorage.getItem(SESSION_KEY) } catch {}
      if (!brut) { if (!annule) setSession(null); return }
      let enCache = null
      try { enCache = JSON.parse(brut) } catch {}
      if (!enCache?.id) { if (!annule) setSession(null); return }
      // Revérifie à chaque chargement : un code régénéré par le formateur
      // redemande le choix d'un code personnel.
      const frais = await getCollaborateurById(enCache.id)
      if (annule) return
      if (!frais) { setSession(enCache); return }
      const maj = { ...enCache, doitChangerCode: frais.doit_changer_code }
      sauverSession(maj)
      setSession(maj)
    })()
    return () => { annule = true }
  }, [])

  const onLogout = () => {
    try { localStorage.removeItem(SESSION_KEY) } catch {}
    setSession(null)
  }

  if (session === undefined) return null
  if (!session) return <Connexion onLogin={setSession} />
  if (session.doitChangerCode) return <ChangerCode session={session} onChanged={setSession} />
  return <Dashboard session={session} onLogout={onLogout} />
}
