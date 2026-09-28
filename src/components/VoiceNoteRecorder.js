'use client'
import { useState, useRef, useEffect } from 'react'

function fmtDuration(s) {
  const m = Math.floor(s / 60)
  const sec = String(s % 60).padStart(2, '0')
  return `${m}:${sec}`
}

/**
 * Enregistrement vocal léger pour une note terrain — MediaRecorder navigateur
 * (HTTPS requis, déjà le cas en prod). Ne fait qu'exposer le Blob via
 * `onRecorded` : l'upload effectif (via uploadPieceJointe) se fait au moment
 * où la note entière est soumise, comme pour les photos.
 *
 * Transcription en direct via la Web Speech API du navigateur (gratuite,
 * aucune clé/API tierce) — best effort : si le navigateur ne la supporte pas
 * (Firefox notamment), l'enregistrement audio continue de fonctionner
 * normalement, juste sans remplissage automatique du texte.
 */
export default function VoiceNoteRecorder({ onRecorded, onClear, onTranscript }) {
  const [status, setStatus] = useState('idle') // idle | recording | recorded | error
  const [seconds, setSeconds] = useState(0)
  const [previewUrl, setPreviewUrl] = useState(null)
  const mediaRecorderRef = useRef(null)
  const chunksRef = useRef([])
  const timerRef = useRef(null)
  const streamRef = useRef(null)
  const recognitionRef = useRef(null)
  const [transcriptSupported, setTranscriptSupported] = useState(false)

  useEffect(() => {
    setTranscriptSupported(!!(window.SpeechRecognition || window.webkitSpeechRecognition))
  }, [])

  useEffect(() => () => {
    clearInterval(timerRef.current)
    streamRef.current?.getTracks().forEach(t => t.stop())
    try { recognitionRef.current?.stop() } catch {}
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const startTranscription = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition || !onTranscript) return
    const recognition = new SpeechRecognition()
    recognition.lang = 'fr-FR'
    recognition.continuous = true
    recognition.interimResults = false
    recognition.onresult = (e) => {
      let text = ''
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) text += e.results[i][0].transcript
      }
      if (text.trim()) onTranscript(text.trim())
    }
    recognition.onerror = () => {} // best effort, non bloquant pour l'enregistrement
    try { recognition.start() } catch {}
    recognitionRef.current = recognition
  }

  const start = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      const recorder = new MediaRecorder(stream)
      chunksRef.current = []
      recorder.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data) }
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' })
        const url = URL.createObjectURL(blob)
        setPreviewUrl(url)
        setStatus('recorded')
        onRecorded(blob)
        stream.getTracks().forEach(t => t.stop())
      }
      mediaRecorderRef.current = recorder
      recorder.start()
      startTranscription()
      setStatus('recording')
      setSeconds(0)
      timerRef.current = setInterval(() => setSeconds(s => s + 1), 1000)
    } catch {
      setStatus('error')
    }
  }

  const stop = () => {
    clearInterval(timerRef.current)
    mediaRecorderRef.current?.stop()
    try { recognitionRef.current?.stop() } catch {}
  }

  const reset = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setPreviewUrl(null)
    setStatus('idle')
    setSeconds(0)
    onClear?.()
  }

  if (status === 'idle') {
    return (
      <button onClick={start} type="button" className="btn2" style={{ fontSize: 12.5 }}>🎙️ Enregistrer un vocal</button>
    )
  }
  if (status === 'error') {
    return <div style={{ fontSize: 12, color: '#f87171' }}>Micro indisponible ou refusé. <button onClick={reset} type="button" className="btn2" style={{ fontSize: 11, padding: '3px 8px' }}>Réessayer</button></div>
  }
  if (status === 'recording') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#ef4444', animation: 'voiceRecPulse 1s infinite' }} />
        <span style={{ fontSize: 12.5, color: 'var(--text-s)', fontVariantNumeric: 'tabular-nums' }}>{fmtDuration(seconds)}</span>
        <button onClick={stop} type="button" className="btn2" style={{ fontSize: 12.5 }}>⏹ Arrêter</button>
        {transcriptSupported && <span style={{ fontSize: 11, color: 'var(--text-m)' }}>🔤 transcription en direct…</span>}
        <style>{`@keyframes voiceRecPulse{0%,100%{opacity:1}50%{opacity:.25}}`}</style>
      </div>
    )
  }
  // recorded
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
      <audio src={previewUrl} controls style={{ height: 32 }} />
      <button onClick={reset} type="button" className="btn2" style={{ fontSize: 12, padding: '4px 10px' }}>🗑️ Recommencer</button>
    </div>
  )
}
