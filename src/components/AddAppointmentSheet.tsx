import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import type { Appointment, AppointmentInput, Settings } from '../types'
import {
  DURATION_PRESETS,
  getClientSuggestions,
  toDateKey,
} from '../lib/time'
import { DateCalendar } from './DateCalendar'
import { TimeWheel } from './TimeWheel'

interface Props {
  open: boolean
  initialDate: Date
  settings: Settings
  appointments: Appointment[]
  appointment?: Appointment | null
  error?: string | null
  onClose: () => void
  onSave: (input: AppointmentInput) => Promise<void>
  onDelete?: () => Promise<void>
  onMarkDone?: () => Promise<void>
  onCancelAppt?: () => Promise<void>
}

export function AddAppointmentSheet({
  open,
  initialDate,
  settings,
  appointments,
  appointment,
  error,
  onClose,
  onSave,
  onDelete,
  onMarkDone,
  onCancelAppt,
}: Props) {
  const editing = Boolean(appointment)
  const [clientName, setClientName] = useState('')
  const [phone, setPhone] = useState('')
  const [date, setDate] = useState(toDateKey(initialDate))
  const [startTime, setStartTime] = useState(settings.openTime)
  const [durationMinutes, setDurationMinutes] = useState(45)
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const nameWrapRef = useRef<HTMLDivElement>(null)

  const clients = useMemo(
    () => getClientSuggestions(appointments),
    [appointments],
  )

  const filteredClients = useMemo(() => {
    const q = clientName.trim().toLowerCase()
    if (!q) return clients.slice(0, 10)
    return clients
      .filter((c) => c.name.toLowerCase().includes(q))
      .slice(0, 10)
  }, [clientName, clients])

  useEffect(() => {
    if (!open) return
    setLocalError(null)
    setShowSuggestions(false)
    if (appointment) {
      setClientName(appointment.clientName)
      setPhone(appointment.phone)
      setDate(appointment.date)
      setStartTime(appointment.startTime)
      setDurationMinutes(appointment.durationMinutes)
      setNotes(appointment.notes)
    } else {
      setClientName('')
      setPhone('')
      setDate(toDateKey(initialDate))
      setStartTime(settings.openTime)
      setDurationMinutes(45)
      setNotes('')
    }
  }, [open, appointment, initialDate, settings.openTime])

  useEffect(() => {
    function onPointerDown(e: PointerEvent) {
      if (!nameWrapRef.current?.contains(e.target as Node)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [])

  function pickClient(name: string, nextPhone: string) {
    setClientName(name)
    if (nextPhone) setPhone(nextPhone)
    setShowSuggestions(false)
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    setLocalError(null)
    try {
      await onSave({
        clientName,
        phone,
        date,
        startTime,
        durationMinutes,
        notes,
      })
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Could not save')
    } finally {
      setSaving(false)
    }
  }

  const displayError = localError || error

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.button
            type="button"
            className="sheet-backdrop"
            aria-label="Close"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          <motion.div
            className="sheet"
            role="dialog"
            aria-modal="true"
            aria-labelledby="sheet-title"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 32 }}
          >
            <div className="sheet__handle" />
            <header className="sheet__header">
              <h2 id="sheet-title">
                {editing ? 'Edit appointment' : 'Add appointment'}
              </h2>
              <button type="button" className="ghost-btn" onClick={onClose}>
                Close
              </button>
            </header>

            <form className="sheet__form" onSubmit={handleSubmit}>
              <div className="field autocomplete" ref={nameWrapRef}>
                <span>Client name</span>
                <input
                  required
                  autoFocus
                  autoComplete="off"
                  value={clientName}
                  onChange={(e) => {
                    setClientName(e.target.value)
                    setShowSuggestions(true)
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  placeholder="Who is coming in?"
                  aria-autocomplete="list"
                  aria-expanded={showSuggestions && filteredClients.length > 0}
                />
                <AnimatePresence>
                  {showSuggestions && filteredClients.length > 0 && (
                    <motion.ul
                      className="suggest-list"
                      role="listbox"
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                    >
                      {filteredClients.map((client) => (
                        <li key={client.name}>
                          <button
                            type="button"
                            role="option"
                            className="suggest-item"
                            onClick={() => pickClient(client.name, client.phone)}
                          >
                            <span>{client.name}</span>
                            {client.phone && <small>{client.phone}</small>}
                          </button>
                        </li>
                      ))}
                    </motion.ul>
                  )}
                </AnimatePresence>
              </div>

              <fieldset className="field">
                <legend>Date</legend>
                <DateCalendar
                  value={date}
                  openDays={settings.openDays}
                  onChange={setDate}
                />
              </fieldset>

              <fieldset className="field">
                <legend>Start time</legend>
                <TimeWheel
                  value={startTime}
                  openTime={settings.openTime}
                  closeTime={settings.closeTime}
                  onChange={setStartTime}
                />
              </fieldset>

              <fieldset className="field">
                <legend>Duration</legend>
                <div className="duration-chips">
                  {DURATION_PRESETS.map((preset) => (
                    <button
                      key={preset.minutes}
                      type="button"
                      className={`chip${durationMinutes === preset.minutes ? ' is-active' : ''}`}
                      onClick={() => setDurationMinutes(preset.minutes)}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </fieldset>

              <label className="field">
                <span>Phone (optional)</span>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="For a quick call-back"
                />
              </label>

              <label className="field">
                <span>Notes (optional)</span>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Fade, beard trim…"
                />
              </label>

              <AnimatePresence>
                {displayError && (
                  <motion.p
                    className="form-error"
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                  >
                    {displayError}
                  </motion.p>
                )}
              </AnimatePresence>

              <button type="submit" className="primary-btn" disabled={saving}>
                {saving ? 'Saving…' : editing ? 'Save changes' : 'Book appointment'}
              </button>

              {editing && (
                <div className="sheet__actions">
                  {appointment?.status === 'booked' && onMarkDone && (
                    <button
                      type="button"
                      className="secondary-btn"
                      onClick={() => onMarkDone()}
                    >
                      Mark done
                    </button>
                  )}
                  {appointment?.status === 'booked' && onCancelAppt && (
                    <button
                      type="button"
                      className="secondary-btn"
                      onClick={() => onCancelAppt()}
                    >
                      Cancel booking
                    </button>
                  )}
                  {onDelete && (
                    <button
                      type="button"
                      className="danger-btn"
                      onClick={() => onDelete()}
                    >
                      Delete
                    </button>
                  )}
                </div>
              )}
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
