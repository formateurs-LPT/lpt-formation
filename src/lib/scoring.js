export const LEVELS = [
  { name: 'Débutant',  icon: '🌱', color: '#6b7280', bg: 'rgba(107,114,128,0.15)', border: 'rgba(107,114,128,0.3)' },
  { name: 'Apprenti',  icon: '⭐', color: '#f59e0b', bg: 'rgba(245,158,11,0.15)',  border: 'rgba(245,158,11,0.35)' },
  { name: 'Confirmé',  icon: '🔥', color: '#f97316', bg: 'rgba(249,115,22,0.15)',  border: 'rgba(249,115,22,0.35)' },
  { name: 'Expert',    icon: '💎', color: '#3b82f6', bg: 'rgba(59,130,246,0.15)',  border: 'rgba(59,130,246,0.35)' },
  { name: 'Maître',    icon: '🏅', color: '#8b5cf6', bg: 'rgba(139,92,246,0.15)', border: 'rgba(139,92,246,0.35)' },
  { name: 'Légende',   icon: '👑', color: '#eab308', bg: 'rgba(234,179,8,0.15)',   border: 'rgba(234,179,8,0.35)'  },
]

// Seuils cumulés : L1=50, L2=110, L3=180, L4=260, L5=350
// formule : threshold(N) = 5*N*(N+9)
export function getLevelInfo(points) {
  let level = 0
  let needed = 50
  let accumulated = 0
  while (level < LEVELS.length - 1 && points >= accumulated + needed) {
    accumulated += needed
    needed += 10
    level++
  }
  const isMaxLevel = level >= LEVELS.length - 1
  const progressInLevel = points - accumulated
  return {
    level,
    levelDef: LEVELS[level],
    progressInLevel,
    ptsForLevel: needed,
    ptsToNext: isMaxLevel ? 0 : Math.max(0, needed - progressInLevel),
    progressPct: isMaxLevel ? 100 : Math.min(100, (progressInLevel / needed) * 100),
    isMaxLevel,
  }
}

export function getRankMessage(rank) {
  if (rank === 1) return { text: '🏆 Tu domines le classement ! Impressionnant.', color: '#fbbf24' }
  if (rank === 2) return { text: '🥈 Très proche du sommet ! La 1ère place est à portée.', color: '#94a3b8' }
  if (rank === 3) return { text: '🥉 Sur le podium ! Continue sur ta lancée.', color: '#cd7f32' }
  if (rank === 4) return { text: '4ème… le podium est juste là ! T\'as pas envie de les rejoindre ? 😏', color: '#00abe9' }
  return { text: '💪 Continue ! Chaque bonne réponse te rapproche du sommet.', color: 'rgba(255,255,255,0.55)' }
}
