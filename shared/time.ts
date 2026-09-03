import type { Appointment } from './types'

export const DURATION_PRESETS = [
  { minutes: 30, label: '30m' },
  { minutes: 45, label: '45m' },
  { minutes: 60, label: '1h' },
  { minutes: 75, label: '1h 15' },
  { minutes: 90, label: '1h 30' },
  { minutes: 105, label: '1h 45' },
  { minutes: 120, label: '2h' },
] as const

export function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

export function minutesToTime(total: number): string {
  const h = Math.floor(total / 60)
  const m = total % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

export function formatTime12(time: string): string {
  const [h, m] = time.split(':').map(Number)
  const period = h >= 12 ? 'pm' : 'am'
  const hour = h % 12 || 12
  return `${hour}:${String(m).padStart(2, '0')} ${period}`
}

export function formatDuration(minutes: number): string {
  const preset = DURATION_PRESETS.find((p) => p.minutes === minutes)
  if (preset) return preset.label
  if (minutes < 60) return `${minutes}m`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m === 0 ? `${h}h` : `${h}h ${m}`
}

export function endTime(startTime: string, durationMinutes: number): string {
  return minutesToTime(timeToMinutes(startTime) + durationMinutes)
}

export function rangesOverlap(
  aStart: number,
  aEnd: number,
  bStart: number,
  bEnd: number,
): boolean {
  return aStart < bEnd && bStart < aEnd
}

export function findOverlap(
  appointments: Appointment[],
  date: string,
  startTime: string,
  durationMinutes: number,
  excludeId?: string,
): Appointment | null {
  const start = timeToMinutes(startTime)
  const end = start + durationMinutes

  for (const appt of appointments) {
    if (appt.id === excludeId) continue
    if (appt.date !== date) continue
    if (appt.status === 'cancelled') continue

    const otherStart = timeToMinutes(appt.startTime)
    const otherEnd = otherStart + appt.durationMinutes

    if (rangesOverlap(start, end, otherStart, otherEnd)) {
      return appt
    }
  }

  return null
}

export function toDateKey(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function parseDateKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function addDays(date: Date, days: number): Date {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

export function startOfWeek(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  d.setHours(0, 0, 0, 0)
  return d
}

export function isSameDay(a: Date, b: Date): boolean {
  return toDateKey(a) === toDateKey(b)
}

export function formatDayLabel(date: Date): string {
  return date.toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
}

export function formatShortDay(date: Date): string {
  return date.toLocaleDateString('en-GB', { weekday: 'short' })
}

export function buildHourSlots(openTime: string, closeTime: string): number[] {
  const start = Math.floor(timeToMinutes(openTime) / 60)
  const end = Math.ceil(timeToMinutes(closeTime) / 60)
  const hours: number[] = []
  for (let h = start; h < end; h++) hours.push(h)
  return hours
}

export function buildTimeSlots(
  openTime: string,
  closeTime: string,
  stepMinutes = 15,
): string[] {
  const start = timeToMinutes(openTime)
  const end = timeToMinutes(closeTime)
  const slots: string[] = []
  for (let t = start; t < end; t += stepMinutes) {
    slots.push(minutesToTime(t))
  }
  return slots
}

export function formatFriendlyDate(dateKey: string, now = new Date()): string {
  const date = parseDateKey(dateKey)
  const today = toDateKey(now)
  const tomorrow = toDateKey(addDays(now, 1))
  const label = date.toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })
  if (dateKey === today) return `Today · ${label}`
  if (dateKey === tomorrow) return `Tomorrow · ${label}`
  return label
}

export interface ClientSuggestion {
  name: string
  phone: string
}

export function getClientSuggestions(
  appointments: Appointment[],
): ClientSuggestion[] {
  const byName = new Map<string, ClientSuggestion>()

  // Newest first so "top" suggestions are recent clients
  const ordered = [...appointments].sort((a, b) => {
    if (a.date !== b.date) return b.date.localeCompare(a.date)
    return timeToMinutes(b.startTime) - timeToMinutes(a.startTime)
  })

  for (const appt of ordered) {
    const name = appt.clientName.trim()
    if (!name) continue
    const key = name.toLowerCase()
    const existing = byName.get(key)
    if (!existing) {
      byName.set(key, { name, phone: appt.phone.trim() })
      continue
    }
    if (!existing.phone && appt.phone.trim()) {
      byName.set(key, { name: existing.name, phone: appt.phone.trim() })
    }
  }

  // Preserve insertion order (most recent unique clients first)
  return [...byName.values()]
}

export function getNextAppointment(
  appointments: Appointment[],
  dateKey: string,
  now: Date = new Date(),
): Appointment | null {
  const todayKey = toDateKey(now)
  if (dateKey !== todayKey) {
    const dayAppts = appointments
      .filter((a) => a.date === dateKey && a.status === 'booked')
      .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime))
    return dayAppts[0] ?? null
  }

  const nowMinutes = now.getHours() * 60 + now.getMinutes()
  const upcoming = appointments
    .filter(
      (a) =>
        a.date === dateKey &&
        a.status === 'booked' &&
        timeToMinutes(a.startTime) + a.durationMinutes > nowMinutes,
    )
    .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime))

  return upcoming[0] ?? null
}
