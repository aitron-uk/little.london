import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useState, type FormEvent } from 'react'
import type { Settings } from '../types'

const DAY_OPTIONS = [
  { value: 1, label: 'Mon' },
  { value: 2, label: 'Tue' },
  { value: 3, label: 'Wed' },
  { value: 4, label: 'Thu' },
  { value: 5, label: 'Fri' },
  { value: 6, label: 'Sat' },
  { value: 0, label: 'Sun' },
]

interface Props {
  open: boolean
  settings: Settings
  onClose: () => void
  onSave: (settings: Settings) => Promise<void>
}

export function SettingsPanel({ open, settings, onClose, onSave }: Props) {
  const [draft, setDraft] = useState(settings)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) setDraft(settings)
  }, [open, settings])

  function toggleDay(day: number) {
    setDraft((prev) => {
      const has = prev.openDays.includes(day)
      return {
        ...prev,
        openDays: has
          ? prev.openDays.filter((d) => d !== day)
          : [...prev.openDays, day].sort((a, b) => {
              const order = (n: number) => (n === 0 ? 7 : n)
              return order(a) - order(b)
            }),
      }
    })
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      await onSave(draft)
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.button
            type="button"
            className="sheet-backdrop"
            aria-label="Close settings"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          <motion.div
            className="sheet sheet--settings"
            role="dialog"
            aria-modal="true"
            aria-labelledby="settings-title"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 32 }}
          >
            <div className="sheet__handle" />
            <header className="sheet__header">
              <h2 id="settings-title">Settings</h2>
              <button type="button" className="ghost-btn" onClick={onClose}>
                Close
              </button>
            </header>

            <form className="sheet__form" onSubmit={handleSubmit}>
              <label className="field">
                <span>Shop name</span>
                <input
                  value={draft.shopName}
                  onChange={(e) =>
                    setDraft((s) => ({ ...s, shopName: e.target.value }))
                  }
                />
              </label>

              <div className="field-row">
                <label className="field">
                  <span>Opens</span>
                  <input
                    type="time"
                    value={draft.openTime}
                    onChange={(e) =>
                      setDraft((s) => ({ ...s, openTime: e.target.value }))
                    }
                  />
                </label>
                <label className="field">
                  <span>Closes</span>
                  <input
                    type="time"
                    value={draft.closeTime}
                    onChange={(e) =>
                      setDraft((s) => ({ ...s, closeTime: e.target.value }))
                    }
                  />
                </label>
              </div>

              <fieldset className="field">
                <legend>Open days</legend>
                <div className="duration-chips">
                  {DAY_OPTIONS.map((day) => (
                    <button
                      key={day.value}
                      type="button"
                      className={`chip${draft.openDays.includes(day.value) ? ' is-active' : ''}`}
                      onClick={() => toggleDay(day.value)}
                    >
                      {day.label}
                    </button>
                  ))}
                </div>
              </fieldset>

              <p className="settings-note">
                Appointments are saved to a JSON file on this computer — no
                cloud fees.
              </p>

              <button type="submit" className="primary-btn" disabled={saving}>
                {saving ? 'Saving…' : 'Save settings'}
              </button>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
