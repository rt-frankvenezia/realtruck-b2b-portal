'use client'

import { useEffect, useState } from 'react'
import { DEMO_USERS, type DemoUser } from '@/lib/mock/session'

const ROLE_LABELS: Record<string, string> = {
  realtruck_admin: 'RT Admin',
  dealer_admin: 'Dealer Admin',
  location_admin: 'Location Admin',
  staff: 'Staff',
  customer: 'Customer',
}

export function DemoUserSwitcher() {
  const [current, setCurrent] = useState<DemoUser>(DEMO_USERS[0])
  const [open, setOpen] = useState(false)
  const [switching, setSwitching] = useState(false)

  useEffect(() => {
    const match = document.cookie.match(/demo_user=([^;]+)/)
    if (match) {
      const found = DEMO_USERS.find((u) => u.id === match[1])
      if (found) setCurrent(found)
    }
  }, [])

  async function switchUser(user: DemoUser) {
    if (user.id === current.id) {
      setOpen(false)
      return
    }
    setSwitching(true)
    await fetch('/api/demo-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.id }),
    })
    window.location.reload()
  }

  return (
    <div className="fixed bottom-4 left-4 z-50">
      <div
        style={{
          background: '#1E1E1E',
          border: '1px solid #333',
          borderRadius: 8,
          minWidth: 220,
          fontFamily: 'inherit',
          fontSize: 13,
          boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
        }}
      >
        <button
          onClick={() => setOpen((v) => !v)}
          disabled={switching}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '10px 12px',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: '#fff',
          }}
        >
          <span
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 30,
              height: 30,
              borderRadius: '50%',
              background: '#FFC60B',
              color: '#1E1E1E',
              fontWeight: 700,
              fontSize: 11,
              flexShrink: 0,
            }}
          >
            {current.avatarInitials}
          </span>
          <span style={{ flex: 1, textAlign: 'left' }}>
            <span style={{ display: 'block', fontWeight: 600, color: '#fff', lineHeight: 1.3 }}>
              {current.name}
            </span>
            <span
              style={{
                display: 'inline-block',
                marginTop: 2,
                padding: '1px 6px',
                borderRadius: 4,
                background: '#333',
                color: '#FFC60B',
                fontSize: 10,
                fontWeight: 600,
                letterSpacing: '0.03em',
              }}
            >
              {ROLE_LABELS[current.role] ?? current.role}
            </span>
          </span>
          <span style={{ color: '#888', fontSize: 10 }}>{open ? '▲' : '▼'}</span>
        </button>

        {open && (
          <div style={{ borderTop: '1px solid #333' }}>
            {DEMO_USERS.map((user) => (
              <button
                key={user.id}
                onClick={() => switchUser(user)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '8px 12px',
                  background: user.id === current.id ? '#2a2a2a' : 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#fff',
                  textAlign: 'left',
                }}
              >
                <span
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 26,
                    height: 26,
                    borderRadius: '50%',
                    background: user.id === current.id ? '#FFC60B' : '#444',
                    color: user.id === current.id ? '#1E1E1E' : '#ccc',
                    fontWeight: 700,
                    fontSize: 10,
                    flexShrink: 0,
                  }}
                >
                  {user.avatarInitials}
                </span>
                <span style={{ flex: 1 }}>
                  <span style={{ display: 'block', fontSize: 12, fontWeight: 500 }}>{user.name}</span>
                  <span style={{ display: 'block', fontSize: 10, color: '#888', marginTop: 1 }}>
                    {ROLE_LABELS[user.role] ?? user.role}
                    {user.company_id ? '' : ' · No company'}
                  </span>
                </span>
                {user.id === current.id && (
                  <span style={{ color: '#FFC60B', fontSize: 12 }}>✓</span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
