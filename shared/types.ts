export type AppointmentStatus = 'booked' | 'done' | 'cancelled'

export interface Appointment {
  id: string
  clientName: string
  phone: string
  date: string
  startTime: string
  durationMinutes: number
  notes: string
  status: AppointmentStatus
}

export interface Settings {
  shopName: string
  openDays: number[]
  openTime: string
  closeTime: string
}

export interface StoreData {
  settings: Settings
  appointments: Appointment[]
}

export type AppointmentInput = Omit<Appointment, 'id' | 'status'> & {
  status?: AppointmentStatus
}
