import { useMemo, useState } from 'react'
import { addDays, parseDateKey, toDateKey } from '../lib/time'

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

interface Props {
  value: string
  openDays: number[]
  onChange: (dateKey: string) => void
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

function monthLabel(date: Date): string {
  return date.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
}

function shiftMonth(date: Date, delta: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + delta, 1)
}

export function DateCalendar({ value, openDays, onChange }: Props) {
  const selected = parseDateKey(value)
  const [viewMonth, setViewMonth] = useState(() => startOfMonth(selected))
  const todayKey = toDateKey(new Date())

  const cells = useMemo(() => {
    const first = startOfMonth(viewMonth)
    const mondayOffset = (first.getDay() + 6) % 7
    const gridStart = addDays(first, -mondayOffset)
    return Array.from({ length: 42 }, (_, i) => addDays(gridStart, i))
  }, [viewMonth])

  return (
    <div className="cal">
      <div className="cal__toolbar">
        <button
          type="button"
          className="cal__nav"
          aria-label="Previous month"
          onClick={() => setViewMonth((m) => shiftMonth(m, -1))}
        >
          ‹
        </button>
        <p className="cal__month">{monthLabel(viewMonth)}</p>
        <button
          type="button"
          className="cal__nav"
          aria-label="Next month"
          onClick={() => setViewMonth((m) => shiftMonth(m, 1))}
        >
          ›
        </button>
      </div>

      <div className="cal__quick">
        <button
          type="button"
          className="cal__quick-btn"
          onClick={() => {
            const key = todayKey
            onChange(key)
            setViewMonth(startOfMonth(new Date()))
          }}
        >
          Today
        </button>
        <button
          type="button"
          className="cal__quick-btn"
          onClick={() => {
            const tomorrow = addDays(new Date(), 1)
            onChange(toDateKey(tomorrow))
            setViewMonth(startOfMonth(tomorrow))
          }}
        >
          Tomorrow
        </button>
      </div>

      <div className="cal__weekdays">
        {WEEKDAYS.map((d) => (
          <span key={d}>{d}</span>
        ))}
      </div>

      <div className="cal__grid" role="grid" aria-label="Choose date">
        {cells.map((day) => {
          const key = toDateKey(day)
          const inMonth = day.getMonth() === viewMonth.getMonth()
          const selectedDay = key === value
          const isToday = key === todayKey
          const closed = !openDays.includes(day.getDay())

          return (
            <button
              key={key}
              type="button"
              role="gridcell"
              aria-selected={selectedDay}
              className={[
                'cal__day',
                inMonth ? '' : 'is-outside',
                selectedDay ? 'is-selected' : '',
                isToday ? 'is-today' : '',
                closed ? 'is-closed' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              onClick={() => {
                onChange(key)
                setViewMonth(startOfMonth(day))
              }}
            >
              {day.getDate()}
            </button>
          )
        })}
      </div>
    </div>
  )
}
