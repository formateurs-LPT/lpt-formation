'use client'
import { useMemo } from 'react'
import {
  ReactFlow, Background, Controls, MiniMap, Handle, Position,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { APP_FLOW_NODES, APP_FLOW_EDGES } from '@/lib/appFlowData'

const KIND_STYLE = {
  root:    { border: '#e2e8f0', bg: 'rgba(226,232,240,0.08)', text: '#f1f5f9' },
  branch:  { border: '#00abe9', bg: 'rgba(0,171,233,0.1)',    text: '#7dd3fc' },
  module:  { border: 'rgba(255,255,255,0.25)', bg: 'rgba(255,255,255,0.04)', text: '#fff' },
  quiz:    { border: '#f59e0b', bg: 'rgba(245,158,11,0.12)',  text: '#fbbf24' },
  tool:    { border: '#7c3aed', bg: 'rgba(124,58,237,0.12)',  text: '#c4b5fd' },
  admin:   { border: '#14b8a6', bg: 'rgba(20,184,166,0.1)',   text: '#5eead4' },
  planned: { border: 'rgba(255,255,255,0.2)', bg: 'transparent', text: 'rgba(255,255,255,0.45)', dashed: true },
}

const FLAG_EMOJI = { fr: '🇫🇷', be: '🇧🇪' }

function FlowNode({ data }) {
  const style = KIND_STYLE[data.kind] || KIND_STYLE.module
  const small = !!data.sub
  return (
    <div
      title={data.note || undefined}
      style={{
        minWidth: small ? 140 : 160, maxWidth: small ? 160 : 180, padding: small ? '7px 12px' : '10px 14px', borderRadius: 12,
        background: style.bg, border: `1.5px ${style.dashed ? 'dashed' : 'solid'} ${style.border}`,
        boxShadow: data.kind === 'root' || data.kind === 'branch' ? `0 0 18px ${style.border}30` : 'none',
        opacity: small ? 0.9 : 1,
        position: 'relative', fontFamily: 'inherit',
      }}
    >
      <Handle type="target" position={Position.Left} style={{ background: style.border, border: 'none', width: 7, height: 7 }} />
      <Handle type="source" position={Position.Right} style={{ background: style.border, border: 'none', width: 7, height: 7 }} />

      {data.flag && (
        <span style={{ position: 'absolute', top: -10, right: -6, fontSize: 15 }}>{FLAG_EMOJI[data.flag]}</span>
      )}

      <div style={{
        fontSize: data.kind === 'root' || data.kind === 'branch' ? 13 : small ? 11 : 12,
        fontWeight: data.kind === 'root' || data.kind === 'branch' ? 800 : 700,
        color: style.text, lineHeight: 1.3,
      }}>
        {data.label}
      </div>

      {data.journee && (
        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', marginTop: 3, textTransform: 'uppercase', letterSpacing: 0.5 }}>{data.journee}</div>
      )}

      {data.hasQuiz && (
        <div style={{
          marginTop: 6, display: 'inline-flex', alignItems: 'center', gap: 4,
          background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.4)',
          borderRadius: 20, padding: '1px 8px', fontSize: 10, fontWeight: 700, color: '#fbbf24',
        }}>
          🧠 Quiz
        </div>
      )}

      {data.kind === 'planned' && (
        <div style={{ marginTop: 6, fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.4)' }}>🔜 Pas encore branché</div>
      )}

      {data.isolated && (
        <div style={{ marginTop: 6, fontSize: 10, fontWeight: 700, color: '#f87171' }}>⚠ Hors parcours Onboarding</div>
      )}
    </div>
  )
}

const NODE_TYPES = { flowNode: FlowNode }

function Legend() {
  const items = [
    { kind: 'branch',  label: 'Point d\'entrée / branche' },
    { kind: 'module',  label: 'Module de formation' },
    { kind: 'quiz',    label: 'Quiz' },
    { kind: 'tool',    label: 'Outil de session' },
    { kind: 'admin',   label: 'Outil formateur (hors session)' },
    { kind: 'planned', label: 'Prévu, pas encore fonctionnel' },
  ]
  return (
    <div style={{
      position: 'absolute', top: 16, right: 16, zIndex: 10,
      background: 'rgba(3,17,42,0.9)', border: '1px solid rgba(255,255,255,0.12)',
      borderRadius: 12, padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 8,
      backdropFilter: 'blur(8px)',
    }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 1 }}>Légende</div>
      {items.map(it => (
        <div key={it.kind} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 12, height: 12, borderRadius: 4, border: `2px solid ${KIND_STYLE[it.kind].border}`, background: KIND_STYLE[it.kind].bg, flexShrink: 0 }} />
          <span style={{ fontSize: 12, color: '#fff' }}>{it.label}</span>
        </div>
      ))}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 13 }}>🇫🇷 / 🇧🇪</span>
        <span style={{ fontSize: 12, color: '#fff' }}>Spécifique à un pays</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 13 }}>🧠</span>
        <span style={{ fontSize: 12, color: '#fff' }}>Contient un quiz interne</span>
      </div>
    </div>
  )
}

export default function AppFlowView({ onBack }) {
  const nodes = useMemo(() => APP_FLOW_NODES.map(n => ({
    id: n.id,
    type: 'flowNode',
    position: { x: n.x, y: n.y },
    data: n,
    draggable: true,
    width: n.sub ? 160 : 180,
    height: n.kind === 'root' || n.kind === 'branch' ? 46 : n.sub ? 50 : 66,
  })), [])

  const edges = useMemo(() => APP_FLOW_EDGES.map((e, i) => ({
    id: `e-${i}`,
    source: e.source,
    target: e.target,
    style: { stroke: 'rgba(255,255,255,0.25)', strokeWidth: 1.5 },
    type: 'smoothstep',
  })), [])

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#03112a', zIndex: 500 }}>
      <div style={{
        position: 'absolute', top: 16, left: 16, zIndex: 10,
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <button onClick={onBack} style={{
          background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)',
          color: '#fff', padding: '9px 18px', borderRadius: 10, fontSize: 13, fontWeight: 600,
          cursor: 'pointer', fontFamily: 'inherit',
        }}>← Retour au tableau de bord</button>
        <div>
          <div style={{ fontSize: 15, fontWeight: 800, color: '#fff' }}>🗺️ App Flow</div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>Cartographie des parcours de formation</div>
        </div>
      </div>

      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={NODE_TYPES}
        fitView
        fitViewOptions={{ padding: 0.15 }}
        minZoom={0.2}
        maxZoom={1.5}
        proOptions={{ hideAttribution: true }}
        colorMode="dark"
      >
        <Background color="rgba(255,255,255,0.08)" gap={24} />
        <Controls showInteractive={false} />
        <MiniMap
          style={{ background: 'rgba(3,17,42,0.9)' }}
          maskColor="rgba(3,17,42,0.6)"
          nodeColor={n => (KIND_STYLE[n.data?.kind] || KIND_STYLE.module).border}
        />
      </ReactFlow>

      <Legend />
    </div>
  )
}
