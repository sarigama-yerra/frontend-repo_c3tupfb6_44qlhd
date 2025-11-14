import { useEffect, useMemo, useState } from 'react'

const API = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'

function useAuth() {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState('')

  const login = async (email, password) => {
    const res = await fetch(`${API}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    })
    if (!res.ok) throw new Error('Login failed')
    const data = await res.json()
    setUser({ id: data.user_id, name: data.full_name, role: data.role })
    setToken(data.token)
  }

  const authHeader = useMemo(() => token ? { Authorization: `Bearer ${token}` } : {}, [token])

  return { user, token, login, authHeader }
}

function Login({ onLogin, error }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  return (
    <div className="max-w-md w-full bg-white p-6 rounded-xl shadow">
      <h2 className="text-2xl font-semibold mb-4">Sign in</h2>
      <div className="space-y-3">
        <input className="w-full border rounded px-3 py-2" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} />
        <input type="password" className="w-full border rounded px-3 py-2" placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)} />
        <button onClick={() => onLogin(email, password)} className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">Login</button>
        {error && <p className="text-red-600 text-sm">{error}</p>}
      </div>
      <p className="text-xs text-gray-500 mt-3">Tip: Use the seeder below to create demo users.</p>
    </div>
  )
}

function Seeder() {
  const [role, setRole] = useState('HR')
  const [email, setEmail] = useState('hr@example.com')
  const [name, setName] = useState('Alex HR')
  const [password, setPassword] = useState('password')
  const [message, setMessage] = useState('')

  const seed = async () => {
    setMessage('')
    const res = await fetch(`${API}/seed/user`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, full_name: name, role, password }) })
    const data = await res.json()
    setMessage(`${data.message} (${data.id || ''})`)
  }

  return (
    <div className="bg-white p-4 rounded-xl shadow space-y-2">
      <div className="flex gap-2">
        <select className="border rounded px-2 py-1" value={role} onChange={e=>setRole(e.target.value)}>
          <option>HR</option>
          <option>Manager</option>
          <option>Employee</option>
        </select>
        <input className="border rounded px-2 py-1 flex-1" value={email} onChange={e=>setEmail(e.target.value)} />
      </div>
      <div className="flex gap-2">
        <input className="border rounded px-2 py-1 flex-1" value={name} onChange={e=>setName(e.target.value)} />
        <input className="border rounded px-2 py-1" value={password} onChange={e=>setPassword(e.target.value)} />
      </div>
      <button onClick={seed} className="bg-gray-800 text-white px-3 py-1 rounded">Seed user</button>
      {message && <p className="text-xs text-gray-600">{message}</p>}
    </div>
  )
}

function HRPanel({ auth }) {
  const [deps, setDeps] = useState([])
  const [form, setForm] = useState({ name: '', description: '', manager_id: '' })
  const [empForm, setEmpForm] = useState({ email: '', full_name: '', password: 'password', joining_date: '', department_id: '', designation: '', manager_user_id: '' })
  const [employees, setEmployees] = useState([])

  const load = async () => {
    const r1 = await fetch(`${API}/departments`, { headers: { 'Content-Type': 'application/json', ...auth.authHeader } })
    const d1 = await r1.json(); setDeps(d1)
    const r2 = await fetch(`${API}/employees`, { headers: { 'Content-Type': 'application/json', ...auth.authHeader } })
    if (r2.ok) { const d2 = await r2.json(); setEmployees(d2) }
  }
  useEffect(()=>{ load() },[])

  const createDep = async () => {
    await fetch(`${API}/departments`, { method:'POST', headers: { 'Content-Type': 'application/json', ...auth.authHeader }, body: JSON.stringify(form) })
    setForm({ name:'', description:'', manager_id:'' })
    load()
  }

  const createEmp = async () => {
    await fetch(`${API}/employees`, { method:'POST', headers: { 'Content-Type': 'application/json', ...auth.authHeader }, body: JSON.stringify(empForm) })
    setEmpForm({ email:'', full_name:'', password:'password', joining_date:'', department_id:'', designation:'', manager_user_id:'' })
    load()
  }

  const removeEmp = async (user_id) => {
    await fetch(`${API}/employees/${user_id}`, { method:'DELETE', headers: { ...auth.authHeader } })
    load()
  }

  return (
    <div className="space-y-6">
      <div className="bg-white p-4 rounded-xl shadow">
        <h3 className="font-semibold mb-3">Departments</h3>
        <div className="flex gap-2 mb-3">
          <input className="border rounded px-2 py-1" placeholder="Name" value={form.name} onChange={e=>setForm({ ...form, name:e.target.value })} />
          <input className="border rounded px-2 py-1" placeholder="Description" value={form.description} onChange={e=>setForm({ ...form, description:e.target.value })} />
          <input className="border rounded px-2 py-1" placeholder="Manager User ID" value={form.manager_id} onChange={e=>setForm({ ...form, manager_id:e.target.value })} />
          <button onClick={createDep} className="bg-blue-600 text-white px-3 rounded">Add</button>
        </div>
        <ul className="text-sm text-gray-700 list-disc ml-5">
          {deps.map(d => <li key={d._id}>{d.name} — manager: {d.manager_id || 'unset'}</li>)}
        </ul>
      </div>

      <div className="bg-white p-4 rounded-xl shadow">
        <h3 className="font-semibold mb-3">Add Employee</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          {Object.entries({ Email:'email', Name:'full_name', Password:'password', Joining:'joining_date', Department:'department_id', Designation:'designation', Manager:'manager_user_id' }).map(([label,key]) => (
            <input key={key} className="border rounded px-2 py-1" placeholder={label} value={empForm[key]} onChange={e=>setEmpForm({ ...empForm, [key]: e.target.value })} />
          ))}
        </div>
        <button onClick={createEmp} className="mt-3 bg-blue-600 text-white px-3 py-1 rounded">Create</button>
      </div>

      <div className="bg-white p-4 rounded-xl shadow">
        <h3 className="font-semibold mb-3">Employees</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b">
                <th className="py-2">Name</th>
                <th>Email</th>
                <th>Department</th>
                <th>Designation</th>
                <th>Manager</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {employees.map(e=> (
                <tr key={e.user_id} className="border-b">
                  <td className="py-2">{e.full_name}</td>
                  <td>{e.email}</td>
                  <td>{e.department_id || '-'}</td>
                  <td>{e.designation || '-'}</td>
                  <td>{e.manager_user_id || '-'}</td>
                  <td>
                    <button onClick={()=>removeEmp(e.user_id)} className="text-red-600">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function EmployeePanel({ auth }) {
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [type, setType] = useState('Annual')
  const [reason, setReason] = useState('')
  const [history, setHistory] = useState([])

  const load = async () => {
    const res = await fetch(`${API}/leaves`, { headers: { ...auth.authHeader } })
    if (res.ok) setHistory(await res.json())
  }
  useEffect(()=>{ load() },[])

  const submit = async () => {
    await fetch(`${API}/leaves`, { method:'POST', headers: { 'Content-Type': 'application/json', ...auth.authHeader }, body: JSON.stringify({ start_date: from, end_date: to, type, reason }) })
    setFrom(''); setTo(''); setReason(''); setType('Annual'); load()
  }

  return (
    <div className="space-y-6">
      <div className="bg-white p-4 rounded-xl shadow">
        <h3 className="font-semibold mb-3">Request Leave</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
          <input type="date" className="border rounded px-2 py-1" value={from} onChange={e=>setFrom(e.target.value)} />
          <input type="date" className="border rounded px-2 py-1" value={to} onChange={e=>setTo(e.target.value)} />
          <select className="border rounded px-2 py-1" value={type} onChange={e=>setType(e.target.value)}>
            {['Annual','Sick','Casual','Unpaid','Other'].map(t=> <option key={t}>{t}</option>)}
          </select>
          <input className="border rounded px-2 py-1" placeholder="Reason" value={reason} onChange={e=>setReason(e.target.value)} />
        </div>
        <button onClick={submit} className="mt-3 bg-blue-600 text-white px-3 py-1 rounded">Submit</button>
      </div>

      <div className="bg-white p-4 rounded-xl shadow">
        <h3 className="font-semibold mb-3">My Leave History</h3>
        <ul className="text-sm space-y-1">
          {history.map(l => (
            <li key={l._id} className="border rounded p-2 flex justify-between">
              <span>{l.type} • {l.start_date} → {l.end_date}</span>
              <span className={l.status === 'Approved' ? 'text-green-600' : l.status === 'Rejected' ? 'text-red-600' : 'text-yellow-600'}>{l.status}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

function ManagerPanel({ auth }) {
  const [pending, setPending] = useState([])

  const load = async () => {
    const res = await fetch(`${API}/leaves?status=Pending`, { headers: { ...auth.authHeader } })
    if (res.ok) setPending(await res.json())
  }
  useEffect(()=>{ load() },[])

  const act = async (id, action) => {
    await fetch(`${API}/leaves/${id}/action`, { method:'POST', headers: { 'Content-Type': 'application/json', ...auth.authHeader }, body: JSON.stringify({ action }) })
    load()
  }

  return (
    <div className="space-y-6">
      <div className="bg-white p-4 rounded-xl shadow">
        <h3 className="font-semibold mb-3">Pending Approvals</h3>
        <ul className="space-y-2">
          {pending.map(p => (
            <li key={p._id} className="border rounded p-3">
              <div className="flex justify-between items-center">
                <div className="text-sm">
                  <div className="font-medium">{p.type} • {p.start_date} → {p.end_date}</div>
                  <div className="text-gray-600">Reason: {p.reason || '-'}</div>
                </div>
                <div className="flex gap-2">
                  <button onClick={()=>act(p._id, 'Approve')} className="bg-green-600 text-white px-3 py-1 rounded">Approve</button>
                  <button onClick={()=>act(p._id, 'Reject')} className="bg-red-600 text-white px-3 py-1 rounded">Reject</button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

function Notifications({ auth }) {
  const [items, setItems] = useState([])
  const load = async () => {
    const res = await fetch(`${API}/notifications`, { headers: { ...auth.authHeader } })
    if (res.ok) setItems(await res.json())
  }
  useEffect(()=>{ load() },[])
  return (
    <div className="bg-white p-4 rounded-xl shadow">
      <h3 className="font-semibold mb-3">Notifications</h3>
      <ul className="space-y-1 text-sm">
        {items.map(n => (
          <li key={n._id} className="border rounded p-2">
            <div className="font-medium">{n.title}</div>
            <div className="text-gray-600">{n.message}</div>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default function App() {
  const auth = useAuth()
  const [error, setError] = useState('')

  const onLogin = async (email, password) => {
    try { setError(''); await auth.login(email, password) } catch(e) { setError(e.message) }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <header className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">HRMS</h1>
          {!auth.user && <span className="text-sm text-gray-600">Please sign in</span>}
          {auth.user && <div className="text-sm">Signed in as <b>{auth.user.name}</b> ({auth.user.role})</div>}
        </header>

        {!auth.user && (
          <div className="grid md:grid-cols-2 gap-6">
            <Login onLogin={onLogin} error={error} />
            <Seeder />
          </div>
        )}

        {auth.user && (
          <div className="grid md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-6">
              {auth.user.role === 'HR' && <HRPanel auth={auth} />}
              {auth.user.role === 'Employee' && <EmployeePanel auth={auth} />}
              {auth.user.role === 'Manager' && <ManagerPanel auth={auth} />}
            </div>
            <div className="space-y-6">
              <Notifications auth={auth} />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
