'use client'
import { useState } from 'react'
import Image from 'next/image'
import {
  getTrainerAvatarSrc,
  getTrainerAvatarKey,
  TRAINER_COLORS,
  TRAINER_INITIALS,
} from '@/lib/constants'

export default function TrainerAvatar({ pName, size = 80, alt, style, className }) {
  const [failed, setFailed] = useState(false)
  const key = getTrainerAvatarKey(pName)
  const src = getTrainerAvatarSrc(pName)
  const label = alt || pName || 'Formateur'
  const initial = TRAINER_INITIALS[key] || (pName || '?').charAt(0).toUpperCase()
  const color = TRAINER_COLORS[key] || '#0089ba'

  if (failed) {
    return (
      <div
        className={className}
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: color,
          color: '#fff',
          fontWeight: 800,
          fontSize: Math.round(size * 0.38),
          ...style,
        }}
        aria-label={label}
      >
        {initial}
      </div>
    )
  }

  return (
    <Image
      src={src}
      alt={label}
      width={size}
      height={size}
      className={className}
      onError={() => setFailed(true)}
      style={{ objectFit: 'cover', width: '100%', height: '100%', ...style }}
    />
  )
}
