import { findOverlap } from '../shared/time.js'
import type {
  Appointment,
  AppointmentInput,
  Settings,
  StoreData,
} from '../shared/types.js'
import { supabase } from './supabase.js'

interface SettingsRow {
  shop_name: string
  open_days: number[]
  open_time: string
  close_time: string
}

interface AppointmentRow {
  id: string
  client_name: string
  phone: string
  date: string
  start_time: string
  duration_minutes: number
  notes: string
  status: Appointment['status']
}

function settingsFromRow(row: SettingsRow): Settings {
  return {
    shopName: row.shop_name,
    openDays: row.open_days,
    openTime: row.open_time,
    closeTime: row.close_time,
  }
}

function appointmentFromRow(row: AppointmentRow): Appointment {
  return {
    id: row.id,
    clientName: row.client_name,
    phone: row.phone,
    date: row.date,
    startTime: row.start_time,
    durationMinutes: row.duration_minutes,
    notes: row.notes,
    status: row.status,
  }
}

export class StoreError extends Error {
  status: number
  conflict?: Appointment

  constructor(message: string, status = 400, conflict?: Appointment) {
    super(message)
    this.status = status
    this.conflict = conflict
  }
}

async function fetchSettings(): Promise<Settings> {
  const { data, error } = await supabase
    .from('settings')
    .select('*')
    .eq('id', 1)
    .single()
  if (error) throw new StoreError(error.message, 500)
  return settingsFromRow(data)
}

async function fetchAppointments(date?: string): Promise<Appointment[]> {
  let query = supabase.from('appointments').select('*')
  if (date) query = query.eq('date', date)
  const { data, error } = await query
  if (error) throw new StoreError(error.message, 500)
  return (data ?? []).map(appointmentFromRow)
}

export async function getStore(): Promise<StoreData> {
  const [settings, appointments] = await Promise.all([
    fetchSettings(),
    fetchAppointments(),
  ])
  return { settings, appointments }
}

export function getSettings(): Promise<Settings> {
  return fetchSettings()
}

export async function updateSettings(
  partial: Partial<Settings>,
): Promise<Settings> {
  const row: Partial<SettingsRow> = {}
  if (partial.shopName !== undefined) row.shop_name = partial.shopName
  if (partial.openDays !== undefined) row.open_days = partial.openDays
  if (partial.openTime !== undefined) row.open_time = partial.openTime
  if (partial.closeTime !== undefined) row.close_time = partial.closeTime

  const { data, error } = await supabase
    .from('settings')
    .update(row)
    .eq('id', 1)
    .select()
    .single()
  if (error) throw new StoreError(error.message, 500)
  return settingsFromRow(data)
}

export function listAppointments(date?: string): Promise<Appointment[]> {
  return fetchAppointments(date)
}

function validateInput(input: AppointmentInput): void {
  if (!input.clientName?.trim()) {
    throw new StoreError('Client name is required')
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.date)) {
    throw new StoreError('Invalid date')
  }
  if (!/^\d{2}:\d{2}$/.test(input.startTime)) {
    throw new StoreError('Invalid start time')
  }
  if (!Number.isFinite(input.durationMinutes) || input.durationMinutes <= 0) {
    throw new StoreError('Invalid duration')
  }
}

export async function createAppointment(
  input: AppointmentInput,
): Promise<Appointment> {
  validateInput(input)

  const sameDay = await fetchAppointments(input.date)
  const conflict = findOverlap(
    sameDay,
    input.date,
    input.startTime,
    input.durationMinutes,
  )
  if (conflict) {
    throw new StoreError(
      `That slot overlaps with ${conflict.clientName} at ${conflict.startTime}`,
      409,
      conflict,
    )
  }

  const { data, error } = await supabase
    .from('appointments')
    .insert({
      client_name: input.clientName.trim(),
      phone: input.phone?.trim() ?? '',
      date: input.date,
      start_time: input.startTime,
      duration_minutes: input.durationMinutes,
      notes: input.notes?.trim() ?? '',
      status: input.status ?? 'booked',
    })
    .select()
    .single()
  if (error) throw new StoreError(error.message, 500)
  return appointmentFromRow(data)
}

export async function updateAppointment(
  id: string,
  input: Partial<AppointmentInput> & { status?: Appointment['status'] },
): Promise<Appointment> {
  const { data: currentRow, error: fetchError } = await supabase
    .from('appointments')
    .select('*')
    .eq('id', id)
    .maybeSingle()
  if (fetchError) throw new StoreError(fetchError.message, 500)
  if (!currentRow) throw new StoreError('Appointment not found', 404)

  const current = appointmentFromRow(currentRow)
  const next: Appointment = {
    ...current,
    ...input,
    clientName: (input.clientName ?? current.clientName).trim(),
    phone: (input.phone ?? current.phone).trim(),
    notes: (input.notes ?? current.notes).trim(),
  }

  validateInput(next)

  if (next.status !== 'cancelled') {
    const sameDay = await fetchAppointments(next.date)
    const conflict = findOverlap(
      sameDay,
      next.date,
      next.startTime,
      next.durationMinutes,
      id,
    )
    if (conflict) {
      throw new StoreError(
        `That slot overlaps with ${conflict.clientName} at ${conflict.startTime}`,
        409,
        conflict,
      )
    }
  }

  const { data, error } = await supabase
    .from('appointments')
    .update({
      client_name: next.clientName,
      phone: next.phone,
      date: next.date,
      start_time: next.startTime,
      duration_minutes: next.durationMinutes,
      notes: next.notes,
      status: next.status,
    })
    .eq('id', id)
    .select()
    .single()
  if (error) throw new StoreError(error.message, 500)
  return appointmentFromRow(data)
}

export async function deleteAppointment(id: string): Promise<void> {
  const { error, count } = await supabase
    .from('appointments')
    .delete({ count: 'exact' })
    .eq('id', id)
  if (error) throw new StoreError(error.message, 500)
  if (!count) throw new StoreError('Appointment not found', 404)
}
