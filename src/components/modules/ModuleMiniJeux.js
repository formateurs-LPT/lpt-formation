'use client'
import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import Image from 'next/image'
import { getActiveSessionCode, setSharedState, getSharedState } from '@/lib/supabase'
import { fetchOnlineParticipantsList } from '@/lib/participantPresence'
import { ENTRAINEMENT_QUESTIONS, ENTRAINEMENT_QUESTIONS_J2 } from '@/lib/modulesData'
import { QuestionsGameTrainerPanel } from '@/components/QuestionsGamePanel'

const THEMES = [
  'Un client qui veut du progressif mais n\'en a jamais porté',
  'Un client qui souhaite faire un test de vue pour la première fois',
  'Un client qui dit ne pas avoir besoin de correction',
  'Un client qui rentre avec une ordonnance en main',
  'Un client qui rentre et connaît déjà le concept LPT',
  'Une personne qui rentre et qui est déjà cliente',
  'Un client qui veut une paire à 10 € en 10 minutes',
  'Un client avec une correction de -10 : un vrai défi technique',
  'Un client presbyte qui a des appréhensions sur le verre progressif',
  'Un client qui souhaite une paire solaire à sa vue',
]

export const RULES_ACCUEIL = [
  { icon: '🎰', text: 'La machine désigne aléatoirement un Vendeur et un Client parmi les participants connectés' },
  { icon: '🎭', text: 'Le Vendeur réalise l\'accueil complet selon la trame LPT — de l\'entrée à la découverte du besoin' },
  { icon: '⏱️', text: 'Durée du jeu de rôle : 3 à 5 minutes en conditions réelles' },
  { icon: '👁️', text: 'Le groupe observe en silence et prend mentalement des notes' },
  { icon: '💬', text: 'Debriefing collectif et feedback à chaud à la fin du jeu de rôle' },
]

const STYLES = `
  @keyframes slotScroll {
    from { transform: translateY(0); }
    to   { transform: translateY(-33.333%); }
  }
  @keyframes slotBrake {
    from { transform: translateY(0); }
    to   { transform: translateY(-33.333%); }
  }
  @keyframes resultBounce {
    0%   { transform: scale(0.82); opacity: 0; }
    65%  { transform: scale(1.06); opacity: 1; }
    100% { transform: scale(1);    opacity: 1; }
  }
  @keyframes mjFadeUp {
    from { opacity: 0; transform: translateY(12px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes mjPulse {
    0%, 100% { opacity: 1; }
    50%       { opacity: 0.5; }
  }
`

// ── Slot Reel with smooth brake ────────────────────────────────────
function SlotReel({ items, reelState, result, label, color, large = false }) {
  const ITEM_H = large ? 88 : 68
  // 3x pour boucle seamless avec translateY(-33.333%)
  const repeated = useMemo(() => [...items, ...items, ...items], [items])
  // Vitesse constante ~700px/s quelle que soit la liste
  const spinDuration = useMemo(() => `${((items.length * ITEM_H) / 580).toFixed(2)}s`, [items.length, ITEM_H])
  const brakeDuration = '0.8s'
  const isDone  = reelState === 'done'
  const isBrake = reelState === 'brake'
  const isSpin  = reelState === 'spin'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
      <div style={{ fontSize: 10, fontWeight: 700, color, textTransform: 'uppercase', letterSpacing: 2 }}>
        {label}
      </div>
      <div style={{
        width: large ? 240 : 190,
        height: ITEM_H * 3,
        background: 'rgba(0,0,0,0.5)',
        border: `2px solid ${isDone ? color : color + '44'}`,
        borderRadius: 20,
        overflow: 'hidden',
        position: 'relative',
        boxShadow: isDone
          ? `0 0 40px ${color}55, inset 0 0 20px rgba(0,0,0,0.3)`
          : `0 0 18px ${color}20, inset 0 0 20px rgba(0,0,0,0.5)`,
        transition: 'border-color 0.4s, box-shadow 0.4s',
      }}>
        {isDone ? (
          /* Résultat : affichage propre, plus de liste derrière */
          <div style={{
            height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: `radial-gradient(ellipse at center, ${color}22 0%, #050d1e 100%)`,
            animation: 'resultBounce 0.5s cubic-bezier(0.34,1.56,0.64,1)',
          }}>
            <div style={{
              fontSize: large ? 22 : 16, fontWeight: 900, color: '#fff',
              padding: '0 18px', textAlign: 'center', lineHeight: 1.25,
            }}>
              {result}
            </div>
          </div>
        ) : (
          <>
            {/* Fade masks */}
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: ITEM_H, background: 'linear-gradient(to bottom, rgba(0,0,0,0.92), transparent)', zIndex: 2, pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: ITEM_H, background: 'linear-gradient(to top, rgba(0,0,0,0.92), transparent)', zIndex: 2, pointerEvents: 'none' }} />
            {/* Center highlight */}
            <div style={{
              position: 'absolute', top: '50%', left: 0, right: 0,
              height: ITEM_H, transform: 'translateY(-50%)',
              border: `1px solid ${color}44`,
              background: `${color}08`,
              zIndex: 1, pointerEvents: 'none', borderRadius: 10,
            }} />
            {/* Scrolling reel */}
            <div style={{
              display: 'flex', flexDirection: 'column',
              willChange: 'transform',
              backfaceVisibility: 'hidden',
              animation:
                isSpin  ? `slotScroll ${spinDuration} linear infinite` :
                isBrake ? `slotBrake ${brakeDuration} ease-out 1 forwards` :
                'none',
            }}>
              {repeated.map((name, i) => (
                <div key={i} style={{
                  height: ITEM_H, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: large ? 20 : 15, fontWeight: 600, color: 'rgba(255,255,255,0.75)',
                  padding: '0 16px', textAlign: 'center', lineHeight: 1.2,
                }}>
                  {name}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ── Theme Reel ─────────────────────────────────────────────────────
function ThemeReel({ reelState, result, large = false }) {
  const COLOR  = '#00abe9'
  const ITEM_H = large ? 90 : 76
  const repeated = useMemo(() => [...THEMES, ...THEMES, ...THEMES], [])
  const spinDuration = `${((THEMES.length * ITEM_H) / 580).toFixed(2)}s`
  const brakeDuration = '0.8s'
  const isDone  = reelState === 'done'
  const isBrake = reelState === 'brake'
  const isSpin  = reelState === 'spin'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: COLOR, textTransform: 'uppercase', letterSpacing: 2 }}>
        Scénario client
      </div>
      <div style={{
        width: '100%', maxWidth: large ? 820 : 640, height: ITEM_H,
        background: 'rgba(0,0,0,0.5)',
        border: `2px solid ${isDone ? COLOR : COLOR + '44'}`,
        borderRadius: 18, overflow: 'hidden', position: 'relative',
        boxShadow: isDone ? `0 0 32px ${COLOR}50` : `0 0 16px ${COLOR}18`,
        transition: 'border-color 0.4s, box-shadow 0.4s',
      }}>
        {isDone ? (
          <div style={{
            height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: `radial-gradient(ellipse at center, ${COLOR}1a 0%, #050d1e 100%)`,
            animation: 'resultBounce 0.5s cubic-bezier(0.34,1.56,0.64,1)',
            padding: '0 28px', textAlign: 'center',
          }}>
            <div style={{ fontSize: large ? 20 : 16, fontWeight: 700, color: '#fff', lineHeight: 1.4 }}>
              {result}
            </div>
          </div>
        ) : (
          <>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 22, background: 'linear-gradient(to bottom, rgba(0,0,0,0.88), transparent)', zIndex: 2, pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 22, background: 'linear-gradient(to top, rgba(0,0,0,0.88), transparent)', zIndex: 2, pointerEvents: 'none' }} />
            <div style={{
              animation:
                isSpin  ? `slotScroll ${spinDuration} linear infinite` :
                isBrake ? `slotBrake ${brakeDuration} ease-out 1 forwards` :
                'none',
              display: 'flex', flexDirection: 'column',
              willChange: 'transform',
              backfaceVisibility: 'hidden',
            }}>
              {repeated.map((t, i) => (
                <div key={i} style={{
                  height: ITEM_H, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: large ? 20 : 15, fontWeight: 600, color: 'rgba(255,255,255,0.85)',
                  padding: '0 28px', textAlign: 'center', lineHeight: 1.35,
                }}>
                  {t}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ── Roulette view (formateur + TV partagent la même logique) ───────
export function RouletteView({ participants, phase, vendeur, client, theme, reel1State, reel2State, reelTState, onLaunch, onDebrief, onTerminer, isTV = false }) {
  const isRunning = phase === 'spinning' || phase === 'vendeur' || phase === 'client'

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      gap: isTV ? 52 : 36,
      padding: isTV ? '64px 80px' : '36px 40px',
      minHeight: isTV ? '100vh' : 'calc(100vh - 100px)',
      background: isTV ? 'radial-gradient(ellipse at 30% 20%, #1a0a3a 0%, #03112a 50%, #0a0a1a 100%)' : undefined,
    }}>
      {isTV && (
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#8b5cf6', textTransform: 'uppercase', letterSpacing: 3, marginBottom: 10 }}>
            Mini Jeux · Accueil moi si tu peux 🎰
          </div>
        </div>
      )}
      {!isTV && (
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#8b5cf6', textTransform: 'uppercase', letterSpacing: 3, marginBottom: 6 }}>Accueil moi si tu peux</div>
          <div style={{ fontSize: 26, fontWeight: 900, color: '#fff' }}>🎰 La machine tourne…</div>
        </div>
      )}

      {/* Reels Vendeur / Client */}
      <div style={{ display: 'flex', alignItems: 'center', gap: isTV ? 72 : 48 }}>
        <SlotReel items={participants} reelState={reel1State} result={vendeur} label="🧑‍💼 Vendeur" color="#8b5cf6" large={isTV} />
        <div style={{ fontSize: isTV ? 40 : 28, color: 'rgba(255,255,255,0.15)', fontWeight: 900 }}>VS</div>
        <SlotReel items={participants} reelState={reel2State} result={client}  label="🛍️ Client"  color="#f59e0b" large={isTV} />
      </div>

      {/* Theme reel */}
      <div style={{ width: '100%', maxWidth: isTV ? 820 : 640 }}>
        <ThemeReel reelState={reelTState} result={theme} large={isTV} />
      </div>

      {/* Boutons (formateur seulement) */}
      {!isTV && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
          {phase === 'revealed' && (
            <button onClick={onDebrief} style={{
              background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
              border: 'none', color: '#fff', padding: '13px 28px', borderRadius: 13,
              fontSize: 15, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit',
              boxShadow: '0 4px 20px rgba(124,58,237,0.45)',
            }}>
              🎭 Lancer le débrief
            </button>
          )}
          {phase === 'debrief' && (
            <button onClick={onTerminer} style={{
              background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.2)',
              color: 'rgba(255,255,255,0.65)', padding: '13px 26px', borderRadius: 13,
              fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
            }}>
              ↺ Nouveau tour
            </button>
          )}
          {phase === 'idle' && (
            <button onClick={onLaunch} disabled={participants.length < 2} style={{
              background: participants.length < 2
                ? 'rgba(139,92,246,0.25)'
                : 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
              border: 'none', color: participants.length < 2 ? 'rgba(255,255,255,0.35)' : '#fff',
              padding: '16px 48px', borderRadius: 14,
              fontSize: 17, fontWeight: 800, cursor: participants.length < 2 ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit',
              boxShadow: participants.length < 2 ? 'none' : '0 8px 32px rgba(139,92,246,0.5)',
            }}>
              🎰 Lancer la machine !
            </button>
          )}
          {isRunning && (
            <div style={{ padding: '16px 32px', color: 'rgba(255,255,255,0.45)', fontSize: 15, fontWeight: 600, animation: 'mjPulse 0.9s ease-in-out infinite' }}>
              🎰 En cours…
            </div>
          )}
          </div>
          {phase === 'debrief' && (
            <div style={{ padding: '10px 20px', background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.3)', borderRadius: 10, fontSize: 13, color: '#a78bfa', fontWeight: 600 }}>
              📺 Les remarques des observateurs s'affichent sur le diffuseur
            </div>
          )}
        </div>
      )}

      {/* Résumé (formateur, après reveal ou débrief) */}
      {!isTV && (phase === 'revealed' || phase === 'debrief') && vendeur && client && theme && (
        <div style={{
          width: '100%', maxWidth: 580,
          background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)',
          borderRadius: 20, padding: '24px 28px', textAlign: 'center',
          animation: 'mjFadeUp 0.5s ease',
        }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 14 }}>Résumé du tirage</div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 28, marginBottom: 18 }}>
            <div>
              <div style={{ fontSize: 10, color: '#8b5cf6', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Vendeur</div>
              <div style={{ fontSize: 20, fontWeight: 900, color: '#fff' }}>{vendeur}</div>
            </div>
            <div style={{ color: 'rgba(255,255,255,0.2)', fontSize: 22, fontWeight: 900 }}>↔</div>
            <div>
              <div style={{ fontSize: 10, color: '#f59e0b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Client</div>
              <div style={{ fontSize: 20, fontWeight: 900, color: '#fff' }}>{client}</div>
            </div>
          </div>
          <div style={{ height: 1, background: 'rgba(255,255,255,0.07)', marginBottom: 16 }} />
          <div style={{ fontSize: 10, color: '#00abe9', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Scénario</div>
          <div style={{ fontSize: 15, fontWeight: 600, color: '#fff', lineHeight: 1.45 }}>"{theme}"</div>
        </div>
      )}
    </div>
  )
}

// ── Rules view ─────────────────────────────────────────────────────
function RulesView({ participants, excluded, onToggle, onStart }) {
  const active = participants.filter(p => !excluded.has(p))
  const canStart = active.length >= 2

  return (
    <div style={{ display: 'flex', gap: 40, padding: '36px 40px', minHeight: 'calc(100vh - 100px)', alignItems: 'flex-start' }}>
      {/* Gauche : règles */}
      <div style={{ flex: 1 }}>
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#8b5cf6', textTransform: 'uppercase', letterSpacing: 3, marginBottom: 8 }}>Règles du jeu</div>
          <div style={{ fontSize: 30, fontWeight: 900, color: '#fff', lineHeight: 1.1, marginBottom: 6 }}>Accueil moi si tu peux 🎰</div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)' }}>Jeu de rôle — trame d'accueil LPT</div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 40 }}>
          {RULES_ACCUEIL.map((rule, i) => (
            <div key={i} style={{
              display: 'flex', gap: 16, alignItems: 'flex-start',
              background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 14, padding: '15px 20px',
              animation: `mjFadeUp 0.35s ease ${i * 0.06}s both`,
            }}>
              <span style={{ fontSize: 22, flexShrink: 0, marginTop: 1 }}>{rule.icon}</span>
              <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.72)', lineHeight: 1.55 }}>{rule.text}</div>
            </div>
          ))}
        </div>

        <button
          onClick={onStart}
          disabled={!canStart}
          style={{
            background: canStart ? 'linear-gradient(135deg, #8b5cf6, #7c3aed)' : 'rgba(139,92,246,0.2)',
            border: 'none', color: canStart ? '#fff' : 'rgba(255,255,255,0.35)',
            padding: '18px 52px', borderRadius: 16, fontSize: 18, fontWeight: 800,
            cursor: canStart ? 'pointer' : 'not-allowed', fontFamily: 'inherit',
            boxShadow: canStart ? '0 8px 32px rgba(139,92,246,0.5)' : 'none',
            transition: 'all .2s',
          }}
        >
          {canStart
            ? '🎰 Démarrer le jeu'
            : `Minimum 2 participants (${active.length} actif${active.length > 1 ? 's' : ''})`}
        </button>
      </div>

      {/* Droite : liste participants */}
      <div style={{ width: 310, flexShrink: 0 }}>
        <div style={{
          background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 20, padding: 22,
          position: 'sticky', top: 20,
        }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 16 }}>
            Participants — {active.length} actif{active.length > 1 ? 's' : ''} / {participants.length}
          </div>
          {participants.length === 0 ? (
            <div style={{ color: 'rgba(255,255,255,0.25)', fontSize: 13, textAlign: 'center', padding: '24px 0', animation: 'mjPulse 1.5s ease-in-out infinite' }}>
              En attente de connexions…
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7, maxHeight: 440, overflowY: 'auto' }}>
              {participants.map(p => {
                const isExcluded = excluded.has(p)
                return (
                  <div key={p} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '9px 13px', borderRadius: 10,
                    background: isExcluded ? 'rgba(255,255,255,0.02)' : 'rgba(139,92,246,0.1)',
                    border: `1px solid ${isExcluded ? 'rgba(255,255,255,0.06)' : 'rgba(139,92,246,0.22)'}`,
                    opacity: isExcluded ? 0.4 : 1,
                    transition: 'all 0.18s',
                  }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#fff', flex: 1, marginRight: 8 }}>{p}</span>
                    <button
                      onClick={() => onToggle(p)}
                      title={isExcluded ? 'Réintégrer' : 'Exclure du tirage'}
                      style={{
                        background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                        color: isExcluded ? '#10b981' : '#ef4444',
                        fontSize: 18, fontWeight: 700, padding: '2px 6px', borderRadius: 6, lineHeight: 1,
                        flexShrink: 0,
                      }}
                    >
                      {isExcluded ? '+' : '×'}
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Game list ──────────────────────────────────────────────────────
function GameListView({ onSelect }) {
  return (
    <div style={{ padding: '44px 40px' }}>
      <div style={{ marginBottom: 36 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#8b5cf6', textTransform: 'uppercase', letterSpacing: 3, marginBottom: 8 }}>Mini Jeux · Formation LPT</div>
        <div style={{ fontSize: 30, fontWeight: 900, color: '#fff' }}>Choisissez un jeu 🎮</div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 20, maxWidth: 860 }}>
        <div
          onClick={() => onSelect('accueil')}
          style={{
            background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.25)',
            borderRadius: 22, padding: '28px 24px', cursor: 'pointer', transition: 'all 0.18s',
            animation: 'mjFadeUp 0.4s ease',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(139,92,246,0.16)'; e.currentTarget.style.borderColor = 'rgba(139,92,246,0.5)' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(139,92,246,0.08)'; e.currentTarget.style.borderColor = 'rgba(139,92,246,0.25)' }}
        >
          <div style={{ fontSize: 38, marginBottom: 14 }}>🎰</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: '#fff', marginBottom: 8 }}>Accueil moi si tu peux</div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', lineHeight: 1.55, marginBottom: 18 }}>
            Jeu de rôle — trame d'accueil client<br />2 participants minimum · 3 à 5 min
          </div>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#8b5cf6' }}>Jouer →</div>
        </div>

        <div
          onClick={() => onSelect('questions')}
          style={{
            background: 'rgba(0,171,233,0.08)', border: '1px solid rgba(0,171,233,0.25)',
            borderRadius: 22, padding: '28px 24px', cursor: 'pointer', transition: 'all 0.18s',
            animation: 'mjFadeUp 0.4s ease',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,171,233,0.16)'; e.currentTarget.style.borderColor = 'rgba(0,171,233,0.5)' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(0,171,233,0.08)'; e.currentTarget.style.borderColor = 'rgba(0,171,233,0.25)' }}
        >
          <div style={{ fontSize: 38, marginBottom: 14 }}>🗣️</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: '#fff', marginBottom: 8 }}>Questions</div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', lineHeight: 1.55, marginBottom: 18 }}>
            Posez une question, récupérez les réponses en direct et validez-les
          </div>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#00abe9' }}>Jouer →</div>
        </div>

        <div
          onClick={() => onSelect('questions-j2')}
          style={{
            background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.25)',
            borderRadius: 22, padding: '28px 24px', cursor: 'pointer', transition: 'all 0.18s',
            animation: 'mjFadeUp 0.4s ease',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(124,58,237,0.16)'; e.currentTarget.style.borderColor = 'rgba(124,58,237,0.5)' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(124,58,237,0.08)'; e.currentTarget.style.borderColor = 'rgba(124,58,237,0.25)' }}
        >
          <div style={{ fontSize: 38, marginBottom: 14 }}>🗣️</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: '#fff', marginBottom: 8 }}>Questions Jour 2</div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', lineHeight: 1.55, marginBottom: 18 }}>
            Même jeu, sur le contenu du Jour 2 (offres, 1=1, montures, verre progressif)
          </div>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#a78bfa' }}>Jouer →</div>
        </div>
      </div>
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────
export default function ModuleMiniJeux({ pName, onBack }) {
  const [view, setView]           = useState('list')
  const [participants, setParticipants] = useState([])
  const [excluded, setExcluded]   = useState(new Set())
  const [phase, setPhase]         = useState('idle')
  const [vendeur, setVendeur]     = useState(null)
  const [client, setClient]       = useState(null)
  const [theme, setTheme]         = useState(null)
  const [reel1State, setReel1]    = useState('idle')
  const [reel2State, setReel2]    = useState('idle')
  const [reelTState, setReelT]    = useState('idle')
  const vendeurPoolRef = useRef([]) // participants qui n'ont pas encore été vendeur ce cycle
  const clientPoolRef = useRef([]) // participants qui n'ont pas encore été client ce cycle

  const activeParticipants = useMemo(
    () => participants.filter(p => !excluded.has(p)),
    [participants, excluded]
  )

  // Uniquement les formés réellement en ligne au moment du jeu (heartbeat < 90s,
  // left_at non renseigné) — un compte qui a juste ouvert la session une fois puis
  // fermé l'onglet ne doit pas rester éligible indéfiniment.
  const loadParticipants = useCallback(async () => {
    const rows = await fetchOnlineParticipantsList(getActiveSessionCode())
    setParticipants((rows || []).map(r => r.name || r.participant_name || r.collaborateur).filter(Boolean))
  }, [])

  useEffect(() => {
    loadParticipants()
    const iv = setInterval(loadParticipants, 8000)
    return () => clearInterval(iv)
  }, [loadParticipants])

  // Reset TV on unmount
  useEffect(() => {
    return () => {
      setSharedState({
        minijeu_vendeur: null, minijeu_client: null, minijeu_theme: null, minijeu_phase: 'idle', minijeu_game: null,
        mjq_q: null, mjq_vf_correct: null, mjq_clear_ts: null, mjq_custom_q_text: null,
        mjq2_q: null, mjq2_vf_correct: null, mjq2_clear_ts: null, mjq2_custom_q_text: null,
      }).catch(() => {})
    }
  }, [])

  const handleSelectGame = async (game) => {
    if (game === 'questions' || game === 'questions-j2') {
      // Écrit et ATTEND avant de monter QuestionsGameTrainerPanel (setView) :
      // ce panneau fait lui-même un setSharedState de reset à son montage
      // (mjq_q/mjq2_q à null...). setRoomSharedState est un lire-puis-écrire
      // sans verrou — si les deux écritures partent en même temps, celle du
      // panneau peut lire l'état AVANT celle-ci et écraser minijeu_phase/
      // minijeu_game en réécrivant par-dessus l'ancien état (le jeu ne
      // s'active jamais côté diffuseur/formés, incident du 19/08). Attendre
      // ici avant setView() les rend séquentielles au lieu de concurrentes.
      await setSharedState({ minijeu_phase: 'questions', minijeu_game: game }).catch(() => {})
      setView(game)
      return
    }
    setView('rules')
    await setSharedState({ minijeu_phase: 'rules', minijeu_game: game }).catch(() => {})
  }

  const handleToggle = (name) => {
    setExcluded(prev => {
      const next = new Set(prev)
      next.has(name) ? next.delete(name) : next.add(name)
      return next
    })
  }

  const BRAKE_MS = 800

  const stopReel = useCallback((setFn, onDone) => {
    setFn('brake')
    setTimeout(() => { setFn('done'); onDone?.() }, BRAKE_MS)
  }, [])

  // Entrer dans la vue jeu — reels idle, pas de spin
  const handleEnterGame = async () => {
    const active = participants.filter(p => !excluded.has(p))
    if (active.length < 2) return
    setView('game')
    setPhase('idle')
    vendeurPoolRef.current = [...active] // initialise le pool : tout le monde peut être vendeur
    clientPoolRef.current = [...active] // initialise le pool : tout le monde peut être client
    // TV affiche les roues en attente (sans spin)
    await setSharedState({ minijeu_phase: 'game_ready', minijeu_vendeur: null, minijeu_client: null, minijeu_theme: null }).catch(() => {})
  }

  // Lancer le spin — appelé par le bouton dans GameView
  const handleLaunch = useCallback(async () => {
    const active = participants.filter(p => !excluded.has(p))
    if (active.length < 2) return

    // Pool tournant : seuls ceux qui n'ont pas encore été vendeur ce cycle
    let pool = vendeurPoolRef.current.filter(p => active.includes(p))
    if (pool.length === 0) {
      // Tout le monde est passé → nouveau cycle
      pool = [...active]
    }

    const vendeurIdx = Math.floor(Math.random() * pool.length)
    const p1 = pool[vendeurIdx]
    vendeurPoolRef.current = pool.filter((_, i) => i !== vendeurIdx)

    // Client : pool tournant (sans répétition ce cycle), en excluant le vendeur de ce tour
    let clientPool = clientPoolRef.current.filter(p => active.includes(p) && p !== p1)
    if (clientPool.length === 0) {
      // Tout le monde est passé (ou seul candidat restant était le vendeur) → nouveau cycle
      clientPoolRef.current = [...active]
      clientPool = active.filter(p => p !== p1)
    }
    const clientIdx = Math.floor(Math.random() * clientPool.length)
    const p2 = clientPool[clientIdx]
    clientPoolRef.current = clientPoolRef.current.filter(p => p !== p2)
    const t  = THEMES[Math.floor(Math.random() * THEMES.length)]

    setPhase('spinning')
    setReel1('spin'); setReel2('spin'); setReelT('spin')
    setVendeur(null); setClient(null); setTheme(null)

    await setSharedState({ minijeu_phase: 'spinning', minijeu_vendeur: null, minijeu_client: null, minijeu_theme: null }).catch(() => {})

    // 1.5s → stop vendeur (brake 0.8s) → 0.3s → stop client (brake 0.8s) → 0.3s → stop theme
    // Total : 1.5 + 0.8 + 0.3 + 0.8 + 0.3 + 0.8 = 4.5s
    setTimeout(() => {
      stopReel(setReel1, () => {
        setVendeur(p1)
        setPhase('vendeur')
        setSharedState({ minijeu_phase: 'vendeur', minijeu_vendeur: p1 }).catch(() => {})

        setTimeout(() => {
          stopReel(setReel2, () => {
            setClient(p2)
            setPhase('client')
            setSharedState({ minijeu_phase: 'client', minijeu_client: p2 }).catch(() => {})

            setTimeout(() => {
              stopReel(setReelT, () => {
                setTheme(t)
                setPhase('revealed')
                setSharedState({ minijeu_phase: 'revealed', minijeu_theme: t }).catch(() => {})
              })
            }, 300)
          })
        }, 300)
      })
    }, 1500)
  }, [participants, excluded, stopReel])

  const handleDebrief = async () => {
    setPhase('debrief')
    await setSharedState({ minijeu_phase: 'debrief' }).catch(() => {})
  }

  const handleTerminer = useCallback(async () => {
    try {
      const state = await getSharedState()
      const patch = { minijeu_vendeur: null, minijeu_client: null, minijeu_theme: null, minijeu_phase: 'game_ready' }
      Object.keys(state || {}).filter(k => k.startsWith('mj_obs__')).forEach(k => { patch[k] = null })
      await setSharedState(patch)
    } catch {}
    setPhase('idle')
    setReel1('idle'); setReel2('idle'); setReelT('idle')
    setVendeur(null); setClient(null); setTheme(null)
    setTimeout(() => handleLaunch(), 80)
  }, [handleLaunch])

  const handleBack = async () => {
    if (view === 'game') {
      setView('rules')
      setPhase('idle'); setReel1('idle'); setReel2('idle'); setReelT('idle')
      await setSharedState({ minijeu_phase: 'rules', minijeu_game: 'accueil' }).catch(() => {})
    } else if (view === 'rules') {
      setView('list')
      await setSharedState({ minijeu_phase: 'idle', minijeu_game: null }).catch(() => {})
    } else if (view === 'questions') {
      // Attendre avant setView('list') : ce dernier démonte QuestionsGameTrainerPanel,
      // dont l'effet de nettoyage écrit lui aussi dans le shared state — même
      // risque de course que dans handleSelectGame (cf. commentaire là-bas).
      await setSharedState({
        minijeu_phase: 'idle', minijeu_game: null,
        mjq_q: null, mjq_vf_correct: null, mjq_clear_ts: null, mjq_custom_q_text: null,
      }).catch(() => {})
      setView('list')
    } else if (view === 'questions-j2') {
      await setSharedState({
        minijeu_phase: 'idle', minijeu_game: null,
        mjq2_q: null, mjq2_vf_correct: null, mjq2_clear_ts: null, mjq2_custom_q_text: null,
      }).catch(() => {})
      setView('list')
    } else {
      onBack()
    }
  }

  // Le jeu "Questions" a son propre écran plein (topbar + Quitter inclus) — pas besoin
  // du header/contenu standard de mini-jeux par-dessus.
  if (view === 'questions') {
    return (
      <>
        <style>{STYLES}</style>
        <QuestionsGameTrainerPanel
          pName={pName}
          moduleId="minijeu-questions"
          sharedKeyPrefix="mjq"
          questions={ENTRAINEMENT_QUESTIONS}
          header="Mini Jeux · Questions"
          onExit={handleBack}
        />
      </>
    )
  }
  if (view === 'questions-j2') {
    return (
      <>
        <style>{STYLES}</style>
        <QuestionsGameTrainerPanel
          pName={pName}
          moduleId="minijeu-questions-j2"
          sharedKeyPrefix="mjq2"
          questions={ENTRAINEMENT_QUESTIONS_J2}
          header="Mini Jeux · Questions Jour 2"
          onExit={handleBack}
        />
      </>
    )
  }

  return (
    <>
      <style>{STYLES}</style>
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #03112a 0%, #0a0a1a 100%)', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 40px', borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Image src="/assets/logo-lpt-blanc.png" alt="LPT" width={80} height={30} style={{ objectFit: 'contain' }} />
            <div style={{ width: 1, height: 18, background: 'rgba(255,255,255,0.15)' }} />
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.38)' }}>
              Mini Jeux{view !== 'list' ? ' · Accueil moi si tu peux' : ''}
            </span>
          </div>
          <button
            onClick={handleBack}
            style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.14)', color: 'rgba(255,255,255,0.5)', padding: '7px 16px', borderRadius: 10, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,80,80,0.15)'; e.currentTarget.style.color = '#ff6b6b' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.color = 'rgba(255,255,255,0.5)' }}
          >
            {view === 'list' ? '✕ Quitter' : '← Retour'}
          </button>
        </div>

        {/* Content */}
        <div style={{ flex: 1 }}>
          {view === 'list' && <GameListView onSelect={handleSelectGame} />}
          {view === 'rules' && (
            <RulesView
              participants={participants}
              excluded={excluded}
              onToggle={handleToggle}
              onStart={handleEnterGame}
            />
          )}
          {view === 'game' && (
            <RouletteView
              participants={activeParticipants}
              phase={phase}
              vendeur={vendeur}
              client={client}
              theme={theme}
              reel1State={reel1State}
              reel2State={reel2State}
              reelTState={reelTState}
              onLaunch={handleLaunch}
              onDebrief={handleDebrief}
              onTerminer={handleTerminer}
            />
          )}
        </div>
      </div>
    </>
  )
}
