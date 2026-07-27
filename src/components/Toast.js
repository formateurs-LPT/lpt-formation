'use client'
import { useState } from 'react'

export function useToast() {
  const [message, setMessage] = useState(null)

  const toast = (msg) => {
    setMessage(msg)
    setTimeout(() => setMessage(null), 3000)
  }

  return { message, toast }
}

export default function Toast({ message }) {
  if (!message) return null
  return <div className="toast">{message}</div>
}
