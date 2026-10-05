'use client'

function fmtDateFr(d) {
  if (!d) return null
  try { return new Date(d + 'T12:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) }
  catch { return d }
}

function EntreeCard({ e }) {
  return (
    <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14, padding: '16px 18px', boxShadow: '0 1px 2px rgba(16,24,40,0.03)', display: 'flex', alignItems: 'center', gap: 14 }}>
      <div style={{
        flexShrink: 0, width: 40, height: 40, borderRadius: '50%', background: '#f7fee7',
        border: '1.5px solid #d9f99d', display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 15, fontWeight: 800, color: '#65a30d',
      }}>🌱</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#14161a' }}>{e.prenom} {e.nom}</div>
        <div style={{ fontSize: 12.5, color: '#6b7280', marginTop: 2 }}>
          {e.magasin || 'Magasin non renseigné'}{e.poste && ` · ${e.poste}`}
        </div>
      </div>
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        {e.date_entree && <div style={{ fontSize: 12.5, fontWeight: 700, color: '#14161a' }}>{fmtDateFr(e.date_entree)}</div>}
        {e.heures && <div style={{ fontSize: 11, color: '#9aa1ac', marginTop: 2 }}>{e.heures}h/sem.</div>}
      </div>
    </div>
  )
}

export default function FutursEntreesView({ entrees }) {
  return (
    <div>
      <h2 style={{ fontSize: 20, fontWeight: 800, color: '#14161a', margin: '0 0 4px' }}>🌱 Futurs entrées</h2>
      <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 20 }}>
        Entrées validées par la RH (semaine en cours + suivante) — la liste se construit en direct au fil de la semaine.
      </div>
      {entrees.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '56px 24px', background: '#fff', borderRadius: 14, border: '1.5px solid #e5e7eb' }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>🌱</div>
          <div style={{ fontSize: 15, fontWeight: 600, color: '#64748b' }}>Rien pour l&apos;instant côté RH</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {entrees.map(e => <EntreeCard key={e.id} e={e} />)}
        </div>
      )}
    </div>
  )
}
