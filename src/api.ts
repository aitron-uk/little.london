import type { Appointment, AppointmentInput, Settings, StoreData } from './types'

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
    ...init,
  })

  if (!res.ok) {
    let message = 'Request failed'
    let conflict: Appointment | null = null
    try {
      const body = (await res.json()) as {
        error?: string
        conflict?: Appointment | null
      }
      message = body.error ?? message
      conflict = body.conflict ?? null
    } catch {
      /* ignore */
    }
    const error = new Error(message) as Error & {
      status: number
      conflict: Appointment | null
    }
    error.status = res.status
    error.conflict = conflict
    throw error
  }

  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

export function fetchStore(): Promise<StoreData> {
  return request<StoreData>('/api/store')
}

export function updateSettings(settings: Partial<Settings>): Promise<Settings> {
  return request<Settings>('/api/settings', {
    method: 'PUT',
    body: JSON.stringify(settings),
  })
}

export function createAppointment(
  input: AppointmentInput,
): Promise<Appointment> {
  return request<Appointment>('/api/appointments', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export function updateAppointment(
  id: string,
  input: Partial<AppointmentInput> & { status?: Appointment['status'] },
): Promise<Appointment> {
  return request<Appointment>(`/api/appointments/${id}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  })
}

export function deleteAppointment(id: string): Promise<void> {
  return request<void>(`/api/appointments/${id}`, { method: 'DELETE' })
}
