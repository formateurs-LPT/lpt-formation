'use client'
import Image from 'next/image'
import { TRAINER_AVATARS, TRAINER_COLORS, TRAINER_INITIALS } from '@/lib/constants'

export default function TrainerAvatar({ name, size = 40 }) {
  const key = (name || '').toLowerCase()
  const avatarSrc = TRAINER_AVATARS[key]
  const color = TRAINER_COLORS[key] || '#555'
  const initials = TRAINER_INITIALS[key] || (name || '?').charAt(0).toUpperCase()
  const fs = Math.round(size * 0.38)

  const style = {
    width: size,
    height: size,
    borderRadius: '50%',
    flexShrink: 0,
    border: '2px solid rgba(255,255,255,.15)',
    overflow: 'hidden'
  }

  if (avatarSrc) {
    return (
      <div style={style}>
        <Image src={avatarSrc} alt={name} width={size} height={size} style={{ objectFit: 'cover', width: '100%', height: '100%' }} />
      </div>
    )
  }

  return (
    <div style={{
      ...style,
      background: color,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: fs,
      fontWeight: 700,
      color: '#fff'
    }}>
      {initials}
    </div>
  )
}
