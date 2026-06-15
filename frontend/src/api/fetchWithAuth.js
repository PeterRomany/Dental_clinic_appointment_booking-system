export async function fetchWithAuth(url, options = {}) {
  const token = localStorage.getItem('token')
  const headers = { ...options.headers }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const res = await fetch(url, { ...options, headers })

  if (res.status === 401) {
    localStorage.removeItem('token')
    localStorage.removeItem('role')
    window.location.href = '/login'
    throw new Error('Unauthorized')
  }

  return res
}
