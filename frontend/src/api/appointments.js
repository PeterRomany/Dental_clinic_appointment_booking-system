import { fetchWithAuth } from './fetchWithAuth'

const BASE = '/api'

async function handleResponse(res) {
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    const err = new Error(body || `HTTP ${res.status}`)
    err.status = res.status
    throw err
  }
  return res.json()
}

export async function getTodayAppointments() {
  const res = await fetchWithAuth(`${BASE}/appointments`)
  return handleResponse(res)
}

export async function getScheduleAppointments(fromDate) {
  const params = fromDate ? `?from=${fromDate}` : ''
  const res = await fetchWithAuth(`${BASE}/appointments${params}`)
  return handleResponse(res)
}

export async function createAppointment({ patient_name, patient_phone, appointment_date, appointment_time }) {
  const res = await fetchWithAuth(`${BASE}/appointments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ patient_name, patient_phone, appointment_date, appointment_time }),
  })
  return handleResponse(res)
}

export async function updateAppointment(id, { patient_name, patient_phone, appointment_date, appointment_time }) {
  const res = await fetchWithAuth(`${BASE}/appointments/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ patient_name, patient_phone, appointment_date, appointment_time }),
  })
  return handleResponse(res)
}

export async function getPendingAppointments() {
  const res = await fetchWithAuth(`${BASE}/appointments/pending`)
  return handleResponse(res)
}

export async function updateAppointmentStatus(id, status) {
  const res = await fetchWithAuth(`${BASE}/appointments/${id}/status`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  })
  return handleResponse(res)
}

export async function checkSlotAvailability(date, time, excludeId) {
  const params = new URLSearchParams({ date, time })
  if (excludeId) params.set('exclude', excludeId)
  const res = await fetchWithAuth(`${BASE}/appointments/check?${params}`)
  const data = await handleResponse(res)
  return data.available
}
