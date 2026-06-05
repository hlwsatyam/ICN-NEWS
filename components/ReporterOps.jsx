'use client'
import { useState, useEffect, useRef } from 'react'
import { toast } from 'sonner'
import {
  Bell, ClipboardList, HelpCircle, Send, X, Loader2, Plus, Pin, Trash2,
  Camera, Calendar, MapPin, AlertTriangle, CheckCircle2, Clock, User, FileText, Image as ImageIcon, Video, Edit
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Card, CardContent } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const API = (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_BASE_URL) ? `${process.env.NEXT_PUBLIC_BASE_URL}/api` : '/api'

const fmt = (d) => d ? new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''

/* ============================================================
   NEW UPDATES DIALOG (read-only list for reporters)
   ============================================================ */
const UpdatesDialog = ({ open, onClose, token }) => {
  const [updates, setUpdates] = useState([])
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    if (!open) return
    setLoading(true)
    fetch(`${API}/updates`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => { setUpdates(d.updates || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [open, token])

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="bg-zinc-950 border-zinc-800 text-white max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black flex items-center gap-2"><Bell className="h-6 w-6 text-orange-400" /> New Updates</DialogTitle>
          <DialogDescription className="text-zinc-400">Company announcements and important news for the team.</DialogDescription>
        </DialogHeader>
        {loading ? <div className="py-12 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto text-zinc-500" /></div> :
        updates.length === 0 ? <p className="text-zinc-500 text-center py-10 text-sm">No updates yet — admin will post here.</p> :
        <div className="space-y-3">
          {updates.map(u => (
            <div key={u.id} className={`rounded-xl border p-4 ${u.pinned ? 'border-yellow-700/60 bg-yellow-950/20' : 'border-zinc-800 bg-zinc-900'}`}>
              <div className="flex items-start gap-3 mb-2">
                {u.pinned && <Pin className="h-4 w-4 text-yellow-400 mt-0.5 flex-shrink-0" />}
                <div className="flex-1 min-w-0">
                  <h3 className="font-black text-white text-base">{u.title}</h3>
                  <p className="text-[11px] text-zinc-500 mt-0.5">{fmt(u.createdAt)}</p>
                </div>
                <Badge className={u.type === 'alert' ? 'bg-red-700' : u.type === 'success' ? 'bg-green-700' : 'bg-blue-700'}>{u.type || 'info'}</Badge>
              </div>
              {u.body && <p className="text-sm text-zinc-300 whitespace-pre-wrap leading-relaxed">{u.body}</p>}
            </div>
          ))}
        </div>}
      </DialogContent>
    </Dialog>
  )
}

/* ============================================================
   OPERATIONS DIALOG (reporter sees assigned tasks + submits reports)
   ============================================================ */
const OperationsDialog = ({ open, onClose, token }) => {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [reportTask, setReportTask] = useState(null)

  const load = () => {
    setLoading(true)
    fetch(`${API}/tasks/my`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => { setTasks(d.tasks || []); setLoading(false) })
      .catch(() => setLoading(false))
  }

  useEffect(() => { if (open) load() }, [open])

  return (
    <>
      <Dialog open={open && !reportTask} onOpenChange={(o) => !o && onClose()}>
        <DialogContent className="bg-zinc-950 border-zinc-800 text-white max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black flex items-center gap-2"><ClipboardList className="h-6 w-6 text-blue-400" /> Operations — My Assigned Tasks</DialogTitle>
            <DialogDescription className="text-zinc-400">Tasks assigned to you by the admin. Submit reports as you progress.</DialogDescription>
          </DialogHeader>
          {loading ? <div className="py-12 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto text-zinc-500" /></div> :
          tasks.length === 0 ? <p className="text-zinc-500 text-center py-10 text-sm">No tasks assigned yet.</p> :
          <div className="space-y-3">
            {tasks.map(t => (
              <Card key={t.id} className={`bg-zinc-900 ${t.priority === 'high' ? 'border-red-700/60' : 'border-zinc-800'}`}>
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-black text-white">{t.title}</h4>
                      {t.description && <p className="text-sm text-zinc-400 mt-1 whitespace-pre-wrap">{t.description}</p>}
                    </div>
                    <div className="flex flex-col gap-1 items-end">
                      <Badge className={t.status === 'completed' ? 'bg-green-700' : t.status === 'in-progress' ? 'bg-blue-700' : 'bg-yellow-700'}>{t.status}</Badge>
                      <Badge variant="outline" className={`text-[10px] ${t.priority === 'high' ? 'border-red-700 text-red-400' : t.priority === 'low' ? 'border-zinc-700 text-zinc-400' : 'border-yellow-700 text-yellow-400'}`}>{t.priority}</Badge>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-3 text-[11px] text-zinc-500">
                    {t.deadline && <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> Deadline: {fmt(t.deadline)}</span>}
                    {t.location && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {t.location}</span>}
                    <span className="flex items-center gap-1"><FileText className="h-3 w-3" /> {t.reports?.length || 0} reports</span>
                  </div>
                  {(t.reports || []).length > 0 && (
                    <div className="mt-2 space-y-1.5">
                      {t.reports.map((r, i) => (
                        <div key={r.id} className="bg-zinc-950/60 border border-zinc-800 rounded-md p-2 text-xs">
                          <p className="text-zinc-400 mb-1"><strong className="text-white">Report #{i + 1}</strong> • {fmt(r.createdAt)} • {r.status}</p>
                          <p className="text-zinc-300 whitespace-pre-wrap">{r.summary}</p>
                        </div>
                      ))}
                    </div>
                  )}
                  <Button onClick={() => setReportTask(t)} size="sm" className="bg-red-600 hover:bg-red-700 mt-2">
                    <Send className="h-3 w-3 mr-1" /> Submit a Report
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>}
        </DialogContent>
      </Dialog>

      {/* Submit Report sub-dialog */}
      {reportTask && <SubmitReportDialog task={reportTask} token={token} onClose={(r) => { setReportTask(null); if (r) load() }} />}
    </>
  )
}

/* ============================================================
   SUBMIT REPORT DIALOG
   ============================================================ */
const SubmitReportDialog = ({ task, token, onClose }) => {
  const [form, setForm] = useState({ summary: '', findings: '', location: '', peopleInvolved: '', timeSpent: '', status: 'submitted' })
  const [media, setMedia] = useState([])
  const [busy, setBusy] = useState(false)

  const onMedia = async (e) => {
    const files = Array.from(e.target.files || []).slice(0, 5)
    const out = []
    for (const f of files) {
      if (f.size > 8 * 1024 * 1024) { toast.error(`${f.name} > 8MB`); continue }
      out.push({ name: f.name, type: f.type, data: await new Promise(res => { const r = new FileReader(); r.onload = () => res(r.result); r.readAsDataURL(f) }) })
    }
    setMedia(m => [...m, ...out].slice(0, 5))
  }

  const submit = async () => {
    if (!form.summary || form.summary.length < 5) { toast.error('Summary required (min 5 chars)'); return }
    setBusy(true)
    const r = await fetch(`${API}/tasks/${task.id}/report`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ ...form, media })
    }).then(r => r.json())
    if (r.ok) { toast.success('Report submitted successfully!'); onClose(true) }
    else { toast.error(r.error || 'Submission failed'); setBusy(false) }
  }

  return (
    <Dialog open={true} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="bg-zinc-950 border-zinc-800 text-white max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-black flex items-center gap-2"><Send className="h-5 w-5 text-red-500" /> Submit Report</DialogTitle>
          <DialogDescription className="text-zinc-400 text-xs">For task: <span className="text-white font-semibold">{task.title}</span></DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-zinc-400 block mb-1">Summary <span className="text-red-500">*</span></label>
            <Textarea rows={3} placeholder="Brief overview of what you accomplished / observed..." value={form.summary} onChange={e => setForm({ ...form, summary: e.target.value })} className="bg-zinc-900 border-zinc-800 text-white resize-none" />
          </div>
          <div>
            <label className="text-xs text-zinc-400 block mb-1">Detailed Findings</label>
            <Textarea rows={4} placeholder="Full details, observations, evidence, witness statements..." value={form.findings} onChange={e => setForm({ ...form, findings: e.target.value })} className="bg-zinc-900 border-zinc-800 text-white resize-none" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-zinc-400 block mb-1">Location</label>
              <Input placeholder="Where it happened" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} className="bg-zinc-900 border-zinc-800 text-white" />
            </div>
            <div>
              <label className="text-xs text-zinc-400 block mb-1">Time Spent</label>
              <Input placeholder="e.g. 2 hours" value={form.timeSpent} onChange={e => setForm({ ...form, timeSpent: e.target.value })} className="bg-zinc-900 border-zinc-800 text-white" />
            </div>
          </div>
          <div>
            <label className="text-xs text-zinc-400 block mb-1">People Involved (names/roles)</label>
            <Input placeholder="e.g. Officer Verma (Police), Witness A, etc." value={form.peopleInvolved} onChange={e => setForm({ ...form, peopleInvolved: e.target.value })} className="bg-zinc-900 border-zinc-800 text-white" />
          </div>
          <div>
            <label className="text-xs text-zinc-400 block mb-1">Status</label>
            <Select value={form.status} onValueChange={v => setForm({ ...form, status: v })}>
              <SelectTrigger className="bg-zinc-900 border-zinc-800 text-white"><SelectValue /></SelectTrigger>
              <SelectContent className="bg-zinc-950 border-zinc-800 text-white">
                <SelectItem value="submitted">Submitted (Progress Update)</SelectItem>
                <SelectItem value="completed">Completed (Task Done)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs text-zinc-400 block mb-1">Media (photos/videos, max 5 × 8MB)</label>
            <input type="file" multiple accept="image/*,video/*" id="task-media" onChange={onMedia} className="hidden" />
            <label htmlFor="task-media" className="cursor-pointer flex items-center justify-center gap-2 border-2 border-dashed border-zinc-700 hover:border-red-500 hover:bg-red-950/20 rounded-lg p-3 text-sm text-zinc-400 transition-colors">
              <Camera className="h-4 w-4" /> Attach Evidence ({media.length}/5)
            </label>
            {media.length > 0 && (
              <div className="grid grid-cols-5 gap-2 mt-2">
                {media.map((m, i) => (
                  <div key={i} className="relative aspect-square bg-zinc-900 rounded-md overflow-hidden border border-zinc-800">
                    {m.type.startsWith('image/') ? <img src={m.data} className="w-full h-full object-cover" /> : <div className="h-full flex flex-col items-center justify-center text-zinc-500 text-[9px]"><Video className="h-5 w-5" /><span className="truncate px-1">{m.name.slice(0, 8)}</span></div>}
                    <button onClick={() => setMedia(media.filter((_, j) => j !== i))} className="absolute top-0.5 right-0.5 bg-red-600 rounded-full p-0.5"><X className="h-2.5 w-2.5 text-white" /></button>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="flex gap-2 pt-2">
            <Button variant="outline" onClick={() => onClose()} className="flex-1 border-zinc-700 bg-zinc-900 text-white">Cancel</Button>
            <Button onClick={submit} disabled={busy} className="flex-1 bg-red-600 hover:bg-red-700">{busy ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Send className="h-4 w-4 mr-1" />} Submit Report</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

/* ============================================================
   FAQs DIALOG (Public — Q in RED, A in BLUE)
   ============================================================ */
const FAQsDialog = ({ open, onClose }) => {
  const [faqs, setFaqs] = useState([])
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    if (!open) return
    setLoading(true)
    fetch(`${API}/faqs`).then(r => r.json()).then(d => { setFaqs(d.faqs || []); setLoading(false) }).catch(() => setLoading(false))
  }, [open])
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="bg-zinc-950 border-zinc-800 text-white max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black flex items-center gap-2"><HelpCircle className="h-6 w-6 text-purple-400" /> FAQs</DialogTitle>
          <DialogDescription className="text-zinc-400">Frequently Asked Questions</DialogDescription>
        </DialogHeader>
        {loading ? <div className="py-12 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto text-zinc-500" /></div> :
        faqs.length === 0 ? <p className="text-zinc-500 text-center py-10 text-sm">No FAQs yet. Admin will add them here.</p> :
        <div className="space-y-4">
          {faqs.map((f, i) => (
            <div key={f.id} className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 space-y-2">
              <p className="text-red-500 font-bold text-base leading-snug">
                <span className="opacity-70 mr-1">Q{i + 1}.</span>{f.question}
              </p>
              <p className="text-blue-400 text-sm whitespace-pre-wrap leading-relaxed pl-4 border-l-2 border-blue-700/40">
                <span className="opacity-70 mr-1">A.</span>{f.answer}
              </p>
            </div>
          ))}
        </div>}
      </DialogContent>
    </Dialog>
  )
}

/* ============================================================
   THREE-BUTTON QUICK-ACTION BAR (rendered in Reporter Dashboard)
   ============================================================ */
export default function ReporterQuickActions({ token }) {
  const [show, setShow] = useState(null) // 'updates' | 'ops' | 'faqs' | null
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 my-6">
        <button onClick={() => setShow('updates')} className="text-left bg-gradient-to-br from-orange-600 to-red-700 hover:from-orange-500 hover:to-red-600 rounded-xl p-4 shadow-xl transition-all hover:-translate-y-1 group">
          <div className="flex items-center gap-3 mb-1">
            <Bell className="h-6 w-6 text-white" />
            <span className="font-black text-white text-lg">New Updates</span>
          </div>
          <p className="text-white/80 text-xs">Company announcements & important notices</p>
        </button>
        <button onClick={() => setShow('ops')} className="text-left bg-gradient-to-br from-blue-600 to-indigo-700 hover:from-blue-500 hover:to-indigo-600 rounded-xl p-4 shadow-xl transition-all hover:-translate-y-1 group">
          <div className="flex items-center gap-3 mb-1">
            <ClipboardList className="h-6 w-6 text-white" />
            <span className="font-black text-white text-lg">Operations</span>
          </div>
          <p className="text-white/80 text-xs">Your assigned tasks & submitted reports</p>
        </button>
        <button onClick={() => setShow('faqs')} className="text-left bg-gradient-to-br from-purple-600 to-fuchsia-700 hover:from-purple-500 hover:to-fuchsia-600 rounded-xl p-4 shadow-xl transition-all hover:-translate-y-1 group">
          <div className="flex items-center gap-3 mb-1">
            <HelpCircle className="h-6 w-6 text-white" />
            <span className="font-black text-white text-lg">FAQs</span>
          </div>
          <p className="text-white/80 text-xs">Frequently asked questions</p>
        </button>
      </div>
      <UpdatesDialog open={show === 'updates'} onClose={() => setShow(null)} token={token} />
      <OperationsDialog open={show === 'ops'} onClose={() => setShow(null)} token={token} />
      <FAQsDialog open={show === 'faqs'} onClose={() => setShow(null)} />
    </>
  )
}

/* ============================================================
   ADMIN MANAGEMENT — Updates, Tasks, FAQs (3 sub-sections)
   ============================================================ */
export const AdminOpsManagement = ({ token }) => {
  const [tab, setTab] = useState('updates')
  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        <Button size="sm" onClick={() => setTab('updates')} className={tab === 'updates' ? 'bg-orange-600 hover:bg-orange-700' : 'bg-zinc-800 hover:bg-zinc-700'}>
          <Bell className="h-3.5 w-3.5 mr-1" /> Updates
        </Button>
        <Button size="sm" onClick={() => setTab('tasks')} className={tab === 'tasks' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-zinc-800 hover:bg-zinc-700'}>
          <ClipboardList className="h-3.5 w-3.5 mr-1" /> Operations / Tasks
        </Button>
        <Button size="sm" onClick={() => setTab('faqs')} className={tab === 'faqs' ? 'bg-purple-600 hover:bg-purple-700' : 'bg-zinc-800 hover:bg-zinc-700'}>
          <HelpCircle className="h-3.5 w-3.5 mr-1" /> FAQs
        </Button>
      </div>
      {tab === 'updates' && <AdminUpdates token={token} />}
      {tab === 'tasks' && <AdminTasks token={token} />}
      {tab === 'faqs' && <AdminFAQs token={token} />}
    </div>
  )
}

const AdminUpdates = ({ token }) => {
  const [items, setItems] = useState([])
  const [form, setForm] = useState({ title: '', body: '', type: 'info', pinned: false })
  const load = () => fetch(`${API}/updates`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()).then(d => setItems(d.updates || []))
  useEffect(load, [])
  const add = async () => {
    if (!form.title) { toast.error('Title required'); return }
    const r = await fetch(`${API}/admin/updates`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(form) }).then(r => r.json())
    if (r.ok) { toast.success('Update posted!'); setForm({ title: '', body: '', type: 'info', pinned: false }); load() }
    else toast.error(r.error)
  }
  const del = async (id) => {
    if (!window.confirm('Delete this update?')) return
    await fetch(`${API}/admin/updates/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
    toast.success('Deleted'); load()
  }
  return (
    <div className="space-y-3">
      <Card className="bg-zinc-950 border-zinc-800">
        <CardContent className="p-4 space-y-2">
          <Input placeholder="Title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="bg-zinc-900 border-zinc-800 text-white" />
          <Textarea rows={3} placeholder="Body / Description" value={form.body} onChange={e => setForm({ ...form, body: e.target.value })} className="bg-zinc-900 border-zinc-800 text-white resize-none" />
          <div className="flex gap-2 flex-wrap">
            <Select value={form.type} onValueChange={v => setForm({ ...form, type: v })}>
              <SelectTrigger className="bg-zinc-900 border-zinc-800 text-white w-32"><SelectValue /></SelectTrigger>
              <SelectContent className="bg-zinc-950 border-zinc-800 text-white">
                <SelectItem value="info">Info</SelectItem>
                <SelectItem value="alert">Alert</SelectItem>
                <SelectItem value="success">Success</SelectItem>
              </SelectContent>
            </Select>
            <label className="flex items-center gap-1 text-zinc-300 text-sm cursor-pointer">
              <input type="checkbox" checked={form.pinned} onChange={e => setForm({ ...form, pinned: e.target.checked })} /> Pinned
            </label>
            <Button onClick={add} className="bg-orange-600 hover:bg-orange-700 ml-auto"><Plus className="h-4 w-4 mr-1" /> Post Update</Button>
          </div>
        </CardContent>
      </Card>
      <div className="space-y-2">
        {items.map(u => (
          <Card key={u.id} className={`bg-zinc-950 ${u.pinned ? 'border-yellow-700/60' : 'border-zinc-800'}`}>
            <CardContent className="p-3 flex items-start gap-2">
              {u.pinned && <Pin className="h-4 w-4 text-yellow-400 mt-1" />}
              <div className="flex-1 min-w-0">
                <p className="text-white font-bold flex items-center gap-2">{u.title} <Badge className={u.type === 'alert' ? 'bg-red-700' : u.type === 'success' ? 'bg-green-700' : 'bg-blue-700'}>{u.type}</Badge></p>
                {u.body && <p className="text-xs text-zinc-400 mt-1">{u.body}</p>}
                <p className="text-[10px] text-zinc-500 mt-1">{fmt(u.createdAt)}</p>
              </div>
              <Button size="sm" variant="outline" onClick={() => del(u.id)} className="border-red-700 bg-red-950/30 text-red-400"><Trash2 className="h-3 w-3" /></Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

const AdminTasks = ({ token }) => {
  const [tasks, setTasks] = useState([])
  const [reporters, setReporters] = useState([])
  const [form, setForm] = useState({ title: '', description: '', assignedTo: '', deadline: '', priority: 'medium', location: '' })
  const [viewTask, setViewTask] = useState(null)
  const load = () => {
    fetch(`${API}/admin/tasks`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()).then(d => setTasks(d.tasks || []))
    fetch(`${API}/users?role=reporter`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()).then(d => setReporters(d.users || []))
  }
  useEffect(load, [])
  const add = async () => {
    if (!form.title || !form.assignedTo) { toast.error('Title and assignee required'); return }
    const r = await fetch(`${API}/admin/tasks`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(form) }).then(r => r.json())
    if (r.ok) { toast.success('Task assigned!'); setForm({ title: '', description: '', assignedTo: '', deadline: '', priority: 'medium', location: '' }); load() }
    else toast.error(r.error)
  }
  const del = async (id) => {
    if (!window.confirm('Delete task and all its reports?')) return
    await fetch(`${API}/admin/tasks/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
    toast.success('Deleted'); load()
  }
  return (
    <div className="space-y-3">
      <Card className="bg-zinc-950 border-zinc-800">
        <CardContent className="p-4 space-y-2">
          <Input placeholder="Task Title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="bg-zinc-900 border-zinc-800 text-white" />
          <Textarea rows={3} placeholder="Detailed instructions" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="bg-zinc-900 border-zinc-800 text-white resize-none" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <Select value={form.assignedTo} onValueChange={v => setForm({ ...form, assignedTo: v })}>
              <SelectTrigger className="bg-zinc-900 border-zinc-800 text-white"><SelectValue placeholder="Assign to Reporter *" /></SelectTrigger>
              <SelectContent className="bg-zinc-950 border-zinc-800 text-white max-h-72">
                {reporters.map(u => <SelectItem key={u.id} value={u.id}>{u.name} • {u.state || ''} {u.district ? '/ ' + u.district : ''}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={form.priority} onValueChange={v => setForm({ ...form, priority: v })}>
              <SelectTrigger className="bg-zinc-900 border-zinc-800 text-white"><SelectValue /></SelectTrigger>
              <SelectContent className="bg-zinc-950 border-zinc-800 text-white">
                <SelectItem value="high">High Priority</SelectItem>
                <SelectItem value="medium">Medium Priority</SelectItem>
                <SelectItem value="low">Low Priority</SelectItem>
              </SelectContent>
            </Select>
            <Input type="date" value={form.deadline} onChange={e => setForm({ ...form, deadline: e.target.value })} className="bg-zinc-900 border-zinc-800 text-white" />
            <Input placeholder="Location (optional)" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} className="bg-zinc-900 border-zinc-800 text-white" />
          </div>
          <Button onClick={add} className="bg-blue-600 hover:bg-blue-700 w-full"><Plus className="h-4 w-4 mr-1" /> Assign Task</Button>
        </CardContent>
      </Card>
      <div className="space-y-2">
        {tasks.map(t => (
          <Card key={t.id} className="bg-zinc-950 border-zinc-800">
            <CardContent className="p-3">
              <div className="flex items-start gap-2 flex-wrap">
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-white">{t.title}</p>
                  {t.assignee && <p className="text-xs text-zinc-400 mt-0.5">→ {t.assignee.name} ({t.assignee.state || 'India'})</p>}
                  <div className="flex flex-wrap gap-2 mt-1">
                    <Badge className={t.status === 'completed' ? 'bg-green-700' : t.status === 'in-progress' ? 'bg-blue-700' : 'bg-yellow-700'}>{t.status}</Badge>
                    <Badge variant="outline" className={`text-[10px] ${t.priority === 'high' ? 'border-red-700 text-red-400' : ''}`}>{t.priority}</Badge>
                    {t.deadline && <span className="text-[10px] text-zinc-500 flex items-center gap-0.5"><Calendar className="h-3 w-3" /> {new Date(t.deadline).toLocaleDateString()}</span>}
                    <span className="text-[10px] text-blue-400 flex items-center gap-0.5"><FileText className="h-3 w-3" /> {t.reports?.length || 0} reports</span>
                  </div>
                </div>
                <Button size="sm" onClick={() => setViewTask(t)} className="bg-zinc-800 hover:bg-zinc-700 text-white"><FileText className="h-3 w-3 mr-1" /> View</Button>
                <Button size="sm" variant="outline" onClick={() => del(t.id)} className="border-red-700 bg-red-950/30 text-red-400"><Trash2 className="h-3 w-3" /></Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      {viewTask && (
        <Dialog open onOpenChange={() => setViewTask(null)}>
          <DialogContent className="bg-zinc-950 border-zinc-800 text-white max-w-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2"><FileText className="h-5 w-5 text-blue-400" /> {viewTask.title}</DialogTitle>
              <DialogDescription className="text-zinc-400">Assigned to: <span className="text-white font-semibold">{viewTask.assignee?.name}</span></DialogDescription>
            </DialogHeader>
            {viewTask.description && <div className="bg-zinc-900 rounded-md p-3 text-sm text-zinc-300 whitespace-pre-wrap mb-3">{viewTask.description}</div>}
            <h4 className="font-bold text-white mb-2">Reports ({viewTask.reports?.length || 0})</h4>
            {(viewTask.reports || []).length === 0 ? <p className="text-zinc-500 text-sm">No reports yet.</p> :
              <div className="space-y-2">
                {viewTask.reports.map((r, i) => (
                  <div key={r.id} className="bg-zinc-900 border border-zinc-800 rounded-lg p-3 space-y-2">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <p className="text-sm font-bold text-white">Report #{i + 1}</p>
                      <div className="flex gap-1 items-center">
                        <Badge className={r.status === 'completed' ? 'bg-green-700' : 'bg-blue-700'}>{r.status}</Badge>
                        <span className="text-[10px] text-zinc-500">{fmt(r.createdAt)}</span>
                      </div>
                    </div>
                    <p className="text-sm text-zinc-300 whitespace-pre-wrap"><strong>Summary:</strong> {r.summary}</p>
                    {r.findings && <p className="text-sm text-zinc-400 whitespace-pre-wrap"><strong>Findings:</strong> {r.findings}</p>}
                    <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-zinc-500">
                      {r.location && <span>📍 {r.location}</span>}
                      {r.peopleInvolved && <span>👥 {r.peopleInvolved}</span>}
                      {r.timeSpent && <span>⏱ {r.timeSpent}</span>}
                    </div>
                    {(r.media || []).length > 0 && (
                      <div className="grid grid-cols-4 gap-1">
                        {r.media.map((m, j) => (
                          m.type?.startsWith('image/')
                            ? <img key={j} src={m.data} className="aspect-square object-cover rounded" />
                            : <div key={j} className="aspect-square bg-zinc-950 rounded flex items-center justify-center text-[10px] text-zinc-500"><Video className="h-5 w-5" /></div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>}
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

const AdminFAQs = ({ token }) => {
  const [items, setItems] = useState([])
  const [form, setForm] = useState({ question: '', answer: '', order: 0 })
  const [editId, setEditId] = useState(null)
  const load = () => fetch(`${API}/faqs`).then(r => r.json()).then(d => setItems(d.faqs || []))
  useEffect(load, [])
  const reset = () => { setForm({ question: '', answer: '', order: 0 }); setEditId(null) }
  const save = async () => {
    if (!form.question || !form.answer) { toast.error('Both fields required'); return }
    const r = editId
      ? await fetch(`${API}/admin/faqs/${editId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(form) }).then(r => r.json())
      : await fetch(`${API}/admin/faqs`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(form) }).then(r => r.json())
    if (r.ok) { toast.success(editId ? 'Updated!' : 'FAQ added!'); reset(); load() }
    else toast.error(r.error)
  }
  const del = async (id) => {
    if (!window.confirm('Delete this FAQ?')) return
    await fetch(`${API}/admin/faqs/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
    toast.success('Deleted'); load()
  }
  return (
    <div className="space-y-3">
      <Card className="bg-zinc-950 border-zinc-800">
        <CardContent className="p-4 space-y-2">
          <Input placeholder="Question (will appear in RED)" value={form.question} onChange={e => setForm({ ...form, question: e.target.value })} className="bg-zinc-900 border-zinc-800 text-red-300 placeholder:text-zinc-600 font-semibold" />
          <Textarea rows={3} placeholder="Answer (will appear in BLUE)" value={form.answer} onChange={e => setForm({ ...form, answer: e.target.value })} className="bg-zinc-900 border-zinc-800 text-blue-300 placeholder:text-zinc-600 resize-none" />
          <div className="flex gap-2 items-center">
            <Input type="number" placeholder="Order" value={form.order} onChange={e => setForm({ ...form, order: parseInt(e.target.value || 0) })} className="bg-zinc-900 border-zinc-800 text-white w-24" />
            <Button onClick={save} className="bg-purple-600 hover:bg-purple-700 flex-1">{editId ? 'Update FAQ' : <><Plus className="h-4 w-4 mr-1" /> Add FAQ</>}</Button>
            {editId && <Button variant="outline" onClick={reset} className="border-zinc-700 bg-zinc-900 text-white">Cancel</Button>}
          </div>
        </CardContent>
      </Card>
      <div className="space-y-2">
        {items.map((f, i) => (
          <Card key={f.id} className="bg-zinc-950 border-zinc-800">
            <CardContent className="p-3 space-y-1">
              <p className="text-red-500 font-bold text-sm">Q{i + 1}. {f.question}</p>
              <p className="text-blue-400 text-sm pl-3">A. {f.answer}</p>
              <div className="flex justify-end gap-1 pt-1">
                <Button size="sm" variant="outline" onClick={() => { setEditId(f.id); setForm({ question: f.question, answer: f.answer, order: f.order || 0 }) }} className="border-zinc-700 bg-zinc-900 text-white"><Edit className="h-3 w-3" /></Button>
                <Button size="sm" variant="outline" onClick={() => del(f.id)} className="border-red-700 bg-red-950/30 text-red-400"><Trash2 className="h-3 w-3" /></Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
