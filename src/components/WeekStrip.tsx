import { motion } from 'framer-motion'
import {
  addDays,
  formatShortDay,
  isSameDay,
  startOfWeek,
  toDateKey,
} from '../lib/time'

interface Props {
  selected: Date
  openDays: number[]
  onSelect: (date: Date) => void
}

export function WeekStrip({ selected, openDays, onSelect }: Props) {
  const weekStart = startOfWeek(selected)
  const today = new Date()
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  return (
    <div className="week-strip" role="tablist" aria-label="Week days">
      {days.map((day, index) => {
        const jsDay = day.getDay()
        const closed = !openDays.includes(jsDay)
        const active = isSameDay(day, selected)
        const isToday = isSameDay(day, today)

        return (
          <motion.button
            key={toDateKey(day)}
            type="button"
            role="tab"
            aria-selected={active}
            className={`week-day${active ? ' is-active' : ''}${isToday ? ' is-today' : ''}${closed ? ' is-closed' : ''}`}
            onClick={() => onSelect(day)}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.03 }}
            whileTap={{ scale: 0.96 }}
          >
            <span className="week-day__name">{formatShortDay(day)}</span>
            <span className="week-day__num">{day.getDate()}</span>
          </motion.button>
        )
      })}
    </div>
  )
}
