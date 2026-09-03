import { useCallback, useEffect, useState } from 'react'
import {
  createAppointment,
  deleteAppointment,
  fetchStore,
  updateAppointment,
  updateSettings,
} from './api'
import { AddAppointmentSheet } from './components/AddAppointmentSheet'
import { SettingsPanel } from './components/SettingsPanel'
import { DayView } from './pages/DayView'
import type { Appointment, AppointmentInput, Settings, StoreData } from './types'
import { parseDateKey, toDateKey } from './lib/time'
import logo from './assets/logo.png'

const DEFAULT_SETTINGS: Settings = {
  shopName: 'Little London',
  openDays: [1, 2, 3, 4, 5, 6],
  openTime: '10:00',
  closeTime: '19:00',
}

export default function App() {
  const [selectedDate, setSelectedDate] = useState(() => new Date())
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS)
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [editing, setEditing] = useState<Appointment | null>(null)
  const [flashId, setFlashId] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      const store: StoreData = await fetchStore()
      setSettings(store.settings)
      setAppointments(store.appointments)
      setLoadError(null)
    } catch {
      setLoadError(
        'Could not reach the local server. Run npm run dev and keep that window open.',
      )
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  function openAdd() {
    setEditing(null)
    setSheetOpen(true)
  }

  function openEdit(appointment: Appointment) {
    setEditing(appointment)
    setSheetOpen(true)
  }

  function closeSheet() {
    setSheetOpen(false)
    setEditing(null)
  }

  async function handleSave(input: AppointmentInput) {
    if (editing) {
      const updated = await updateAppointment(editing.id, input)
      setAppointments((prev) =>
        prev.map((a) => (a.id === updated.id ? updated : a)),
      )
      pulse(updated.id)
    } else {
      const created = await createAppointment(input)
      setAppointments((prev) => [...prev, created])
      setSelectedDate(parseDateKey(created.date))
      pulse(created.id)
    }
    closeSheet()
  }

  function pulse(id: string) {
    setFlashId(id)
    window.setTimeout(() => setFlashId(null), 700)
  }

  async function handleDeleteAppointment(appointment: Appointment) {
    await deleteAppointment(appointment.id)
    setAppointments((prev) => prev.filter((a) => a.id !== appointment.id))
    if (editing?.id === appointment.id) closeSheet()
  }

  async function handleMarkDoneAppointment(appointment: Appointment) {
    const updated = await updateAppointment(appointment.id, { status: 'done' })
    setAppointments((prev) =>
      prev.map((a) => (a.id === updated.id ? updated : a)),
    )
    if (editing?.id === appointment.id) closeSheet()
  }

  async function handleCancelAppointment(appointment: Appointment) {
    const updated = await updateAppointment(appointment.id, {
      status: 'cancelled',
    })
    setAppointments((prev) =>
      prev.map((a) => (a.id === updated.id ? updated : a)),
    )
    if (editing?.id === appointment.id) closeSheet()
  }

  async function handleDelete() {
    if (!editing) return
    await handleDeleteAppointment(editing)
  }

  async function handleMarkDone() {
    if (!editing) return
    await handleMarkDoneAppointment(editing)
  }

  async function handleCancelAppt() {
    if (!editing) return
    await handleCancelAppointment(editing)
  }

  async function handleSettingsSave(next: Settings) {
    const saved = await updateSettings(next)
    setSettings(saved)
  }

  if (loading) {
    return (
      <div className="boot">
        <img src={logo} alt="Little London" className="boot__logo" />
        <span>Loading appointments…</span>
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="boot boot--error">
        <img src={logo} alt="Little London" className="boot__logo" />
        <p>{loadError}</p>
        <button type="button" className="primary-btn" onClick={() => void load()}>
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="app-shell">
      <div className="atmosphere" aria-hidden="true" />
      <DayView
        selectedDate={selectedDate}
        settings={settings}
        appointments={appointments}
        onSelectDate={setSelectedDate}
        onSelectAppointment={openEdit}
        onMarkDone={handleMarkDoneAppointment}
        onCancelAppointment={handleCancelAppointment}
        onDeleteAppointment={handleDeleteAppointment}
        onAdd={openAdd}
        onOpenSettings={() => setSettingsOpen(true)}
        flashId={flashId}
      />
      <AddAppointmentSheet
        open={sheetOpen}
        initialDate={selectedDate}
        settings={settings}
        appointments={appointments}
        appointment={editing}
        onClose={closeSheet}
        onSave={handleSave}
        onDelete={editing ? handleDelete : undefined}
        onMarkDone={editing ? handleMarkDone : undefined}
        onCancelAppt={editing ? handleCancelAppt : undefined}
      />
      <SettingsPanel
        open={settingsOpen}
        settings={settings}
        onClose={() => setSettingsOpen(false)}
        onSave={handleSettingsSave}
      />
      <p className="sr-only">Selected {toDateKey(selectedDate)}</p>
    </div>
  )
}
