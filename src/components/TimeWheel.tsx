import { useEffect, useMemo, useRef } from 'react'
import { buildTimeSlots, formatTime12, timeToMinutes } from '../lib/time'

const ITEM_H = 48

interface Props {
  value: string
  openTime: string
  closeTime: string
  onChange: (time: string) => void
}

function nearestSlot(slots: string[], value: string): string {
  if (!slots.length) return value
  if (slots.includes(value)) return value
  const target = timeToMinutes(value)
  return slots.reduce((best, slot) =>
    Math.abs(timeToMinutes(slot) - target) <
    Math.abs(timeToMinutes(best) - target)
      ? slot
      : best,
  )
}

export function TimeWheel({ value, openTime, closeTime, onChange }: Props) {
  const listRef = useRef<HTMLDivElement>(null)
  const timer = useRef<number | null>(null)
  const syncing = useRef(false)

  const slots = useMemo(
    () => buildTimeSlots(openTime, closeTime, 15),
    [openTime, closeTime],
  )

  const selected = nearestSlot(slots, value)

  useEffect(() => {
    if (!slots.length) return
    if (selected !== value) onChange(selected)
  }, [selected, value, slots, onChange])

  useEffect(() => {
    const el = listRef.current
    if (!el || !slots.length) return
    const index = Math.max(0, slots.indexOf(selected))
    syncing.current = true
    el.scrollTo({ top: index * ITEM_H, behavior: 'auto' })
    const t = window.setTimeout(() => {
      syncing.current = false
    }, 120)
    return () => window.clearTimeout(t)
  }, [selected, slots])

  function onScrollEnd(el: HTMLDivElement) {
    if (syncing.current || !slots.length) return
    const index = Math.round(el.scrollTop / ITEM_H)
    const clamped = Math.min(Math.max(index, 0), slots.length - 1)
    el.scrollTo({ top: clamped * ITEM_H, behavior: 'smooth' })
    const next = slots[clamped]
    if (next && next !== value) onChange(next)
  }

  if (!slots.length) {
    return (
      <div className="wheel">
        <p className="wheel__hint">No times available in shop hours.</p>
      </div>
    )
  }

  return (
    <div className="wheel">
      <div className="wheel__preview">{formatTime12(selected)}</div>
      <div
        className="wheel__body wheel__body--single"
        aria-label="Choose start time"
      >
        <div className="wheel__highlight" aria-hidden="true" />
        <div
          className="wheel__col"
          ref={listRef}
          onScroll={(e) => {
            const el = e.currentTarget
            if (timer.current) window.clearTimeout(timer.current)
            timer.current = window.setTimeout(() => onScrollEnd(el), 90)
          }}
        >
          <div className="wheel__pad" />
          {slots.map((slot) => (
            <button
              key={slot}
              type="button"
              className={`wheel__item${slot === selected ? ' is-active' : ''}`}
              onClick={() => {
                onChange(slot)
                const index = slots.indexOf(slot)
                listRef.current?.scrollTo({
                  top: index * ITEM_H,
                  behavior: 'smooth',
                })
              }}
            >
              {formatTime12(slot)}
            </button>
          ))}
          <div className="wheel__pad" />
        </div>
      </div>
      <div className="wheel__jump">
        <button
          type="button"
          className="wheel__jump-btn"
          onClick={() => {
            const morning = slots.find((s) => timeToMinutes(s) < 12 * 60)
            if (morning) onChange(morning)
          }}
        >
          Morning
        </button>
        <button
          type="button"
          className="wheel__jump-btn"
          onClick={() => {
            const afternoon = slots.find((s) => timeToMinutes(s) >= 12 * 60)
            if (afternoon) onChange(afternoon)
          }}
        >
          Afternoon
        </button>
      </div>
      <p className="wheel__hint">Scroll or tap a time</p>
    </div>
  )
}
