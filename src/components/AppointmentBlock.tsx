import { motion } from 'framer-motion'
import type { Appointment } from '../types'
import {
  endTime,
  formatDuration,
  formatTime12,
  timeToMinutes,
} from '../lib/time'

interface Props {
  appointment: Appointment
  openMinutes: number
  pxPerMinute: number
  onSelect: (appointment: Appointment) => void
  onMarkDone: (appointment: Appointment) => void
  onCancel: (appointment: Appointment) => void
  onDelete: (appointment: Appointment) => void
}

export function AppointmentBlock({
  appointment,
  openMinutes,
  pxPerMinute,
  onSelect,
  onMarkDone,
  onCancel,
  onDelete,
}: Props) {
  const start = timeToMinutes(appointment.startTime)
  const top = (start - openMinutes) * pxPerMinute
  const height = Math.max(appointment.durationMinutes * pxPerMinute, 56)
  const done = appointment.status === 'done'
  const cancelled = appointment.status === 'cancelled'
  const booked = appointment.status === 'booked'

  if (cancelled) return null

  return (
    <motion.div
      className={`appt-block${done ? ' is-done' : ''}`}
      style={{ top, height }}
      layout
      initial={{ opacity: 0, x: 24, scale: 0.96 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 380, damping: 28 }}
    >
      <button
        type="button"
        className="appt-block__main"
        onClick={() => onSelect(appointment)}
        aria-label={`Edit ${appointment.clientName}`}
      >
        <span className="appt-block__name">{appointment.clientName}</span>
        <span className="appt-block__meta">
          {formatTime12(appointment.startTime)} –{' '}
          {formatTime12(
            endTime(appointment.startTime, appointment.durationMinutes),
          )}
          {' · '}
          {formatDuration(appointment.durationMinutes)}
        </span>
        {done && <span className="appt-block__badge">Done</span>}
      </button>

      <div className="appt-actions" role="group" aria-label="Appointment actions">
        {booked && (
          <>
            <button
              type="button"
              className="appt-action appt-action--done"
              title="Mark done"
              aria-label={`Mark ${appointment.clientName} done`}
              onClick={(e) => {
                e.stopPropagation()
                onMarkDone(appointment)
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                  d="M5 12.5 10 17.5 19 7"
                  stroke="currentColor"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            <button
              type="button"
              className="appt-action appt-action--cancel"
              title="Cancel booking"
              aria-label={`Cancel ${appointment.clientName}`}
              onClick={(e) => {
                e.stopPropagation()
                onCancel(appointment)
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                  d="M6 6l12 12M18 6 6 18"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </>
        )}
        <button
          type="button"
          className="appt-action appt-action--delete"
          title="Delete"
          aria-label={`Delete ${appointment.clientName}`}
          onClick={(e) => {
            e.stopPropagation()
            onDelete(appointment)
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M4 7h16M9 7V5h6v2M8 7l1 12h6l1-12"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>
    </motion.div>
  )
}
