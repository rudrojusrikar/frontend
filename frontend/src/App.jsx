import { useState, useEffect } from 'react'
import { api } from './api'

function Auth({ onAuth }) {
  const [mode, setMode] = useState('login')
  const [f, setF] = useState({ name: '', email: '', password: '', role: 'PATIENT', specialization: '', availability: '' })
  const [err, setErr] = useState('')
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })
  const submit = async () => {
    try {
      if (mode === 'register') await api.register(f)
      onAuth(await api.login({ email: f.email, password: f.password }))
    } catch (e) { setErr(e.message) }
  }
  return (
    <div className="card auth">
      <h2>{mode === 'login' ? 'Login' : 'Register'}</h2>
      {mode === 'register' && <>
        <input placeholder="Full name" value={f.name} onChange={set('name')} />
        <select value={f.role} onChange={set('role')}><option value="PATIENT">Patient</option><option value="DOCTOR">Doctor</option></select>
        {f.role === 'DOCTOR' && <>
          <input placeholder="Specialization (e.g. Cardiology)" value={f.specialization} onChange={set('specialization')} />
          <input placeholder="Availability (e.g. Mon-Fri 09:00-17:00)" value={f.availability} onChange={set('availability')} />
        </>}
      </>}
      <input placeholder="Email" value={f.email} onChange={set('email')} />
      <input type="password" placeholder="Password" value={f.password} onChange={set('password')} />
      {err && <p className="err">{err}</p>}
      <button onClick={submit}>{mode === 'login' ? 'Login' : 'Create account'}</button>
      <a href="#" onClick={(e) => { e.preventDefault(); setErr(''); setMode(mode === 'login' ? 'register' : 'login') }}>
        {mode === 'login' ? 'New here? Register' : 'Have an account? Login'}</a>
    </div>
  )
}

function Patient({ user }) {
  const [docs, setDocs] = useState([]), [q, setQ] = useState(''), [list, setList] = useState([])
  const [sel, setSel] = useState(null), [form, setForm] = useState({ date: '', time: '', reason: '' }), [msg, setMsg] = useState('')
  const load = () => api.forPatient(user.id).then(setList)
  useEffect(() => { api.doctors(q).then(setDocs) }, [q])
  useEffect(() => { load() }, [])
  const book = async () => {
    try { await api.book({ ...form, doctorId: sel.id, patientId: user.id }); setMsg('Appointment booked!'); setSel(null); setForm({ date: '', time: '', reason: '' }); load() }
    catch (e) { setMsg(e.message) }
  }
  return (<>
    <div className="card"><h3>Find a doctor</h3>
      <input placeholder="Search by specialization" value={q} onChange={(e) => setQ(e.target.value)} />
      <div className="grid">{docs.map((d) => (
        <div className="doc" key={d.id}><b>Dr. {d.name}</b><span>{d.specialization}</span><small>{d.availability}</small>
          <button onClick={() => { setSel(d); setMsg('') }}>Book</button></div>))}
        {!docs.length && <p>No doctors found.</p>}</div></div>
    {sel && <div className="card"><h3>Book with Dr. {sel.name}</h3>
      <input type="date" min={new Date().toISOString().slice(0, 10)} value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
      <input type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} />
      <input placeholder="Reason for visit" value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} />
      <button onClick={book}>Confirm</button> <button className="ghost" onClick={() => setSel(null)}>Cancel</button></div>}
    {msg && <p className="msg">{msg}</p>}
    <div className="card"><h3>My appointments</h3>
      <Table rows={list} who="doctorName" actions={(a) => a.status === 'BOOKED' && <button className="ghost" onClick={() => api.setStatus(a.id, 'CANCELLED').then(load)}>Cancel</button>} /></div>
  </>)
}

function Doctor({ user }) {
  const [list, setList] = useState([])
  const load = () => api.forDoctor(user.id).then(setList)
  useEffect(() => { load() }, [])
  return (<div className="card"><h3>My schedule</h3><p>{user.specialization} · {user.availability}</p>
    <Table rows={list} who="patientName" actions={(a) => a.status === 'BOOKED' && <>
      <button onClick={() => api.setStatus(a.id, 'COMPLETED').then(load)}>Complete</button>{' '}
      <button className="ghost" onClick={() => api.setStatus(a.id, 'CANCELLED').then(load)}>Cancel</button></>} /></div>)
}

function Table({ rows, who, actions }) {
  if (!rows.length) return <p>No appointments yet.</p>
  return (<table><thead><tr><th>{who === 'doctorName' ? 'Doctor' : 'Patient'}</th><th>Date</th><th>Time</th><th>Reason</th><th>Status</th><th></th></tr></thead>
    <tbody>{rows.map((a) => (<tr key={a.id}><td>{a[who]}</td><td>{a.date}</td><td>{a.time}</td><td>{a.reason}</td>
      <td><span className={'tag ' + a.status}>{a.status}</span></td><td>{actions(a)}</td></tr>))}</tbody></table>)
}

export default function App() {
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('user') || 'null'))
  const auth = (u) => { localStorage.setItem('user', JSON.stringify(u)); setUser(u) }
  const logout = () => { localStorage.removeItem('user'); setUser(null) }
  return (<div className="wrap">
    <header><h1>🩺 Online Doctor Appointment System</h1>
      {user && <div>{user.name} ({user.role}) <button className="ghost" onClick={logout}>Logout</button></div>}</header>
    {!user ? <Auth onAuth={auth} /> : user.role === 'DOCTOR' ? <Doctor user={user} /> : <Patient user={user} />}
  </div>)
}
