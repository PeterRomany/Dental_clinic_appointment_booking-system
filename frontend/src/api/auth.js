const BASE = '/api'

export async function loginRequest(username, password) {
  const formData = new URLSearchParams()
  formData.append('username', username)
  formData.append('password', password)

  const res = await fetch(`${BASE}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: formData,
  })

  if (!res.ok) {
    const body = await res.text().catch(() => '')
    const err = new Error(body || `HTTP ${res.status}`)
    err.status = res.status
    throw err
  }

  return res.json()
}
