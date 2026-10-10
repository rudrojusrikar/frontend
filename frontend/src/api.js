const BASE = 'http://localhost:8080/api'
async function call(path, method = 'GET', body) {
  const res = await fetch(BASE + path, { method, headers: { 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || 'Request failed')
  return data
}
export const api = {
  register: (u) => call('/auth/register', 'POST', u),
  login: (u) => call('/auth/login', 'POST', u),
  doctors: (s = '') => call('/doctors?specialization=' + encodeURIComponent(s)),
  book: (a) => call('/appointments', 'POST', a),
  forPatient: (id) => call('/appointments/patient/' + id),
  forDoctor: (id) => call('/appointments/doctor/' + id),
  setStatus: (id, status) => call(`/appointments/${id}/status`, 'PUT', { status }),
}
