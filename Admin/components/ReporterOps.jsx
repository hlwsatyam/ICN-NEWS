'use client'
import { useState, useEffect, useRef } from 'react'
import { toast } from 'sonner'
import {
  Bell, ClipboardList, HelpCircle, Send, X, Loader2, Plus, Pin, Trash2,
  Camera, Calendar, MapPin, XCircle, CheckCircle2, Clock, User, FileText, Image as ImageIcon, Video, Edit,
  IdCard, Upload, Download, Search, ChevronLeft, ChevronRight, ShieldCheck, ShieldX,
  Wallet
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
        <Button size="sm" onClick={() => setTab('press-cards')} className={tab === 'press-cards' ? 'bg-green-600 hover:bg-green-700' : 'bg-zinc-800 hover:bg-zinc-700'}>
          <IdCard className="h-3.5 w-3.5 mr-1" /> Press ID Cards
        </Button>
        <Button size="sm" onClick={() => setTab('members')} className={tab === 'members' ? 'bg-cyan-600 hover:bg-cyan-700' : 'bg-zinc-800 hover:bg-zinc-700'}>
          <User className="h-3.5 w-3.5 mr-1" /> Members
        </Button>
        <Button size="sm" onClick={() => setTab('faqs')} className={tab === 'faqs' ? 'bg-purple-600 hover:bg-purple-700' : 'bg-zinc-800 hover:bg-zinc-700'}>
          <HelpCircle className="h-3.5 w-3.5 mr-1" /> FAQs
        </Button>
      </div> 
   {tab === 'updates' && <AdminUpdates token={token} />}
      {/*    {tab === 'tasks' && <AdminTasks token={token} />} */}
      {tab === 'members' && <AdminMembers token={token} />}
      {tab === 'press-cards' && <AdminPressCards token={token} />}
      {tab === 'faqs' && <AdminFAQs token={token} />}
    </div>
  )
}

const AdminUpdates = ({ token }) => {
  const [items, setItems] = useState([])
  const [form, setForm] = useState({ title: '', body: '', type: 'info', pinned: false })
  
  const load = async () => {
    try {
      const r = await fetch(`${API}/updates`, { 
        headers: { Authorization: `Bearer ${token}` } 
      })
      if (!r.ok) throw new Error('Failed to fetch')
      const d = await r.json()
      setItems(d.updates || [])
    } catch (err) {
      console.error('Failed to load updates:', err)
      toast.error('Failed to load updates')
    }
  }
  
  useEffect(() => { 
    if (token) load()
  }, [token])
  
  const add = async () => {
    if (!form.title) { 
      toast.error('Title required')
      return 
    }
    try {
      const r = await fetch(`${API}/admin/updates`, { 
        method: 'POST', 
        headers: { 
          'Content-Type': 'application/json', 
          Authorization: `Bearer ${token}` 
        }, 
        body: JSON.stringify(form) 
      })
      const data = await r.json()
      if (data.ok) { 
        toast.success('Update posted!')
        setForm({ title: '', body: '', type: 'info', pinned: false })
        await load()
      } else {
        toast.error(data.error || 'Failed to post update')
      }
    } catch (err) {
      console.error('Add update error:', err)
      toast.error('Network error')
    }
  }
  
  const del = async (id) => {
    if (!window.confirm('Delete this update?')) return
    try {
      const r = await fetch(`${API}/admin/updates/${id}`, { 
        method: 'DELETE', 
        headers: { Authorization: `Bearer ${token}` } 
      })
      if (!r.ok) throw new Error('Delete failed')
      toast.success('Deleted')
      await load()
    } catch (err) {
      console.error('Delete error:', err)
      toast.error('Failed to delete')
    }
  }

  const formatDate = (dateString) => {
    try {
      if (!dateString) return ''
      const date = new Date(dateString)
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch {
      return dateString
    }
  }

  return (
    <div className="space-y-3">
      <Card className="bg-zinc-950 border-zinc-800">
        <CardContent className="p-4 space-y-2">
          <Input 
            placeholder="Title" 
            value={form.title} 
            onChange={e => setForm({ ...form, title: e.target.value })} 
            className="bg-zinc-900 border-zinc-800 text-white" 
          />
          <Textarea 
            rows={3} 
            placeholder="Body / Description" 
            value={form.body} 
            onChange={e => setForm({ ...form, body: e.target.value })} 
            className="bg-zinc-900 border-zinc-800 text-white resize-none" 
          />
          <div className="flex gap-2 flex-wrap">
            <Select value={form.type} onValueChange={v => setForm({ ...form, type: v })}>
              <SelectTrigger className="bg-zinc-900 border-zinc-800 text-white w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-zinc-950 border-zinc-800 text-white">
                <SelectItem value="info">Info</SelectItem>
                <SelectItem value="alert">Alert</SelectItem>
                <SelectItem value="success">Success</SelectItem>
              </SelectContent>
            </Select>
            <label className="flex items-center gap-1 text-zinc-300 text-sm cursor-pointer">
              <input 
                type="checkbox" 
                checked={form.pinned} 
                onChange={e => setForm({ ...form, pinned: e.target.checked })} 
                className="rounded border-zinc-700 bg-zinc-900" 
              /> 
              Pinned
            </label>
            <Button 
              onClick={add} 
              className="bg-orange-600 hover:bg-orange-700 ml-auto"
              disabled={!form.title}
            >
              <Plus className="h-4 w-4 mr-1" /> Post Update
            </Button>
          </div>
        </CardContent>
      </Card>
      
      <div className="space-y-2">
        {items.length === 0 ? (
          <p className="text-zinc-500 text-center py-4">No updates yet</p>
        ) : (
          items.map(u => (
            <Card 
              key={u.id || Math.random()} 
              className={`bg-zinc-950 ${u.pinned ? 'border-yellow-700/60' : 'border-zinc-800'}`}
            >
              <CardContent className="p-3 flex items-start gap-2">
                {u.pinned && <Pin className="h-4 w-4 text-yellow-400 mt-1 flex-shrink-0" />}
                <div className="flex-1 min-w-0">
                  <p className="text-white font-bold flex items-center gap-2 flex-wrap">
                    {u.title}
                    <Badge className={
                      u.type === 'alert' ? 'bg-red-700' : 
                      u.type === 'success' ? 'bg-green-700' : 
                      'bg-blue-700'
                    }>
                      {u.type}
                    </Badge>
                  </p>
                  {u.body && (
                    <p className="text-xs text-zinc-400 mt-1 break-words">{u.body}</p>
                  )}
                  <p className="text-[10px] text-zinc-500 mt-1">
                    {formatDate(u.createdAt)}
                  </p>
                </div>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => del(u.id)} 
                  className="border-red-700 bg-red-950/30 text-red-400 flex-shrink-0"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
} 

 

const AdminTasks = ({ token }) => {
  const [tasks, setTasks] = useState([])
  const [reporters, setReporters] = useState([])
  const [form, setForm] = useState({ 
    title: '', 
    description: '', 
    assignedTo: '', 
    deadline: '', 
    priority: 'medium', 
    location: '' 
  })
  const [viewTask, setViewTask] = useState(null)
  const [loading, setLoading] = useState(false)

  const load = async () => {
    try {
      setLoading(true)
      const [tasksRes, usersRes] = await Promise.all([
        fetch(`${API}/admin/tasks`, { 
          headers: { Authorization: `Bearer ${token}` } 
        }),
        fetch(`${API}/users?role=reporter`, { 
          headers: { Authorization: `Bearer ${token}` } 
        })
      ])
      
      if (!tasksRes.ok || !usersRes.ok) {
        throw new Error('Failed to fetch data')
      }
      
      const tasksData = await tasksRes.json()
      const usersData = await usersRes.json()
      
      setTasks(tasksData.tasks || [])
      setReporters(usersData.users || [])
    } catch (err) {
      console.error('Failed to load tasks:', err)
      toast.error('Failed to load tasks')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (token) load()
  }, [token])

  const add = async () => {
    if (!form.title || !form.assignedTo) { 
      toast.error('Title and assignee required')
      return 
    }
    
    try {
      setLoading(true)
      const r = await fetch(`${API}/admin/tasks`, { 
        method: 'POST', 
        headers: { 
          'Content-Type': 'application/json', 
          Authorization: `Bearer ${token}` 
        }, 
        body: JSON.stringify(form) 
      })
      
      if (!r.ok) throw new Error('Failed to create task')
      
      const data = await r.json()
      
      if (data.ok) { 
        toast.success('Task assigned!')
        setForm({ 
          title: '', 
          description: '', 
          assignedTo: '', 
          deadline: '', 
          priority: 'medium', 
          location: '' 
        })
        await load()
      } else {
        toast.error(data.error || 'Failed to assign task')
      }
    } catch (err) {
      console.error('Add task error:', err)
      toast.error('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const del = async (id) => {
    if (!window.confirm('Delete task and all its reports?')) return
    
    // Close modal if viewing the deleted task
    if (viewTask?.id === id) {
      setViewTask(null)
    }
    
    try {
      setLoading(true)
      const r = await fetch(`${API}/admin/tasks/${id}`, { 
        method: 'DELETE', 
        headers: { Authorization: `Bearer ${token}` } 
      })
      
      if (!r.ok) throw new Error('Delete failed')
      
      toast.success('Task deleted')
      await load()
    } catch (err) {
      console.error('Delete task error:', err)
      toast.error('Failed to delete task')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString) => {
    try {
      if (!dateString) return ''
      const date = new Date(dateString)
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    } catch {
      return dateString || ''
    }
  }

  const formatDateTime = (dateString) => {
    try {
      if (!dateString) return ''
      const date = new Date(dateString)
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch {
      return dateString || ''
    }
  }

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-700'
      case 'in-progress': return 'bg-blue-700'
      case 'pending': return 'bg-yellow-700'
      default: return 'bg-zinc-700'
    }
  }

  const getPriorityClass = (priority) => {
    switch (priority) {
      case 'high': return 'border-red-700 text-red-400'
      case 'medium': return 'border-yellow-700 text-yellow-400'
      case 'low': return 'border-green-700 text-green-400'
      default: return 'border-zinc-700 text-zinc-400'
    }
  }

  return (
    <div className="space-y-3">
      <Card className="bg-zinc-950 border-zinc-800">
        <CardContent className="p-4 space-y-2">
          <Input 
            placeholder="Task Title *" 
            value={form.title} 
            onChange={e => setForm({ ...form, title: e.target.value })} 
            className="bg-zinc-900 border-zinc-800 text-white" 
          />
          <Textarea 
            rows={3} 
            placeholder="Detailed instructions" 
            value={form.description} 
            onChange={e => setForm({ ...form, description: e.target.value })} 
            className="bg-zinc-900 border-zinc-800 text-white resize-none" 
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <Select value={form.assignedTo} onValueChange={v => setForm({ ...form, assignedTo: v })}>
              <SelectTrigger className="bg-zinc-900 border-zinc-800 text-white">
                <SelectValue placeholder="Assign to Reporter *" />
              </SelectTrigger>
              <SelectContent className="bg-zinc-950 border-zinc-800 text-white max-h-72">
                {reporters.length === 0 ? (
                  <div className="p-2 text-zinc-500 text-sm">No reporters available</div>
                ) : (
                  reporters.map(u => (
                    <SelectItem key={u.id || Math.random()} value={u.id}>
                      {u.name || 'Unknown'} {u.state ? `• ${u.state}` : ''} {u.district ? `/ ${u.district}` : ''}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            
            <Select value={form.priority} onValueChange={v => setForm({ ...form, priority: v })}>
              <SelectTrigger className="bg-zinc-900 border-zinc-800 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-zinc-950 border-zinc-800 text-white">
                <SelectItem value="high">🔴 High Priority</SelectItem>
                <SelectItem value="medium">🟡 Medium Priority</SelectItem>
                <SelectItem value="low">🟢 Low Priority</SelectItem>
              </SelectContent>
            </Select>
            
            <Input 
              type="date" 
              value={form.deadline} 
              onChange={e => setForm({ ...form, deadline: e.target.value })} 
              className="bg-zinc-900 border-zinc-800 text-white" 
            />
            
            <Input 
              placeholder="Location (optional)" 
              value={form.location} 
              onChange={e => setForm({ ...form, location: e.target.value })} 
              className="bg-zinc-900 border-zinc-800 text-white" 
            />
          </div>
          
          <Button 
            onClick={add} 
            className="bg-blue-600 hover:bg-blue-700 w-full"
            disabled={loading || !form.title || !form.assignedTo}
          >
            {loading ? (
              'Assigning...'
            ) : (
              <><Plus className="h-4 w-4 mr-1" /> Assign Task</>
            )}
          </Button>
        </CardContent>
      </Card>
      
      <div className="space-y-2">
        {loading && tasks.length === 0 ? (
          <div className="text-center py-8 text-zinc-400">Loading tasks...</div>
        ) : tasks.length === 0 ? (
          <div className="text-center py-8 text-zinc-500">No tasks assigned yet</div>
        ) : (
          tasks.map(t => (
            <Card key={t.id || Math.random()} className="bg-zinc-950 border-zinc-800 hover:border-zinc-700 transition-colors">
              <CardContent className="p-3">
                <div className="flex items-start gap-2 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-white break-words">{t.title || 'Untitled Task'}</p>
                    {t.assignee && (
                      <p className="text-xs text-zinc-400 mt-0.5">
                        → {t.assignee.name || 'Unknown'} ({t.assignee.state || 'India'})
                      </p>
                    )}
                    <div className="flex flex-wrap gap-2 mt-1.5">
                      <Badge className={getStatusBadgeClass(t.status)}>
                        {t.status || 'pending'}
                      </Badge>
                      <Badge variant="outline" className={`text-[10px] ${getPriorityClass(t.priority)}`}>
                        {t.priority || 'medium'}
                      </Badge>
                      {t.deadline && (
                        <span className="text-[10px] text-zinc-500 flex items-center gap-0.5">
                          <Calendar className="h-3 w-3" /> {formatDate(t.deadline)}
                        </span>
                      )}
                      <span className="text-[10px] text-blue-400 flex items-center gap-0.5">
                        <FileText className="h-3 w-3" /> {t.reports?.length || 0} reports
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button 
                      size="sm" 
                      onClick={() => setViewTask(t)} 
                      className="bg-zinc-800 hover:bg-zinc-700 text-white"
                      disabled={loading}
                    >
                      <FileText className="h-3 w-3 mr-1" /> View
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => del(t.id)} 
                      className="border-red-700 bg-red-950/30 text-red-400 hover:bg-red-950/50"
                      disabled={loading}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
      
      {/* Task Details Modal */}
      {viewTask && (
        <Dialog open={!!viewTask} onOpenChange={(open) => !open && setViewTask(null)}>
          <DialogContent className="bg-zinc-950 border-zinc-800 text-white max-w-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-lg">
                <FileText className="h-5 w-5 text-blue-400 flex-shrink-0" /> 
                <span className="break-words">{viewTask.title || 'Untitled Task'}</span>
              </DialogTitle>
              <DialogDescription className="text-zinc-400">
                Assigned to: <span className="text-white font-semibold">
                  {viewTask.assignee?.name || 'Unknown Reporter'}
                </span>
                {viewTask.assignee?.state && (
                  <span className="text-zinc-500"> ({viewTask.assignee.state})</span>
                )}
              </DialogDescription>
            </DialogHeader>
            
            {/* Task Meta Info */}
            <div className="flex flex-wrap gap-2 mb-3">
              <Badge className={getStatusBadgeClass(viewTask.status)}>
                {viewTask.status || 'pending'}
              </Badge>
              <Badge variant="outline" className={getPriorityClass(viewTask.priority)}>
                {viewTask.priority || 'medium'}
              </Badge>
              {viewTask.deadline && (
                <Badge variant="outline" className="border-zinc-700 text-zinc-400">
                  <Calendar className="h-3 w-3 mr-1" />
                  {formatDate(viewTask.deadline)}
                </Badge>
              )}
              {viewTask.location && (
                <Badge variant="outline" className="border-zinc-700 text-zinc-400">
                  📍 {viewTask.location}
                </Badge>
              )}
            </div>
            
            {viewTask.description && (
              <div className="bg-zinc-900 rounded-md p-3 text-sm text-zinc-300 whitespace-pre-wrap mb-4">
                {viewTask.description}
              </div>
            )}
            
            <div className="border-t border-zinc-800 pt-4">
              <h4 className="font-bold text-white mb-3">
                Reports ({viewTask.reports?.length || 0})
              </h4>
              
              {(viewTask.reports || []).length === 0 ? (
                <p className="text-zinc-500 text-sm text-center py-4">No reports submitted yet.</p>
              ) : (
                <div className="space-y-3">
                  {viewTask.reports.map((r, i) => (
                    <div 
                      key={r.id || `report-${i}`} 
                      className="bg-zinc-900 border border-zinc-800 rounded-lg p-3 space-y-2"
                    >
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <p className="text-sm font-bold text-white">
                          Report #{i + 1}
                        </p>
                        <div className="flex gap-2 items-center">
                          <Badge className={r.status === 'completed' ? 'bg-green-700' : 'bg-blue-700'}>
                            {r.status || 'pending'}
                          </Badge>
                          <span className="text-[10px] text-zinc-500">
                            {formatDateTime(r.createdAt)}
                          </span>
                        </div>
                      </div>
                      
                      {r.summary && (
                        <p className="text-sm text-zinc-300 whitespace-pre-wrap">
                          <strong>Summary:</strong> {r.summary}
                        </p>
                      )}
                      
                      {r.findings && (
                        <p className="text-sm text-zinc-400 whitespace-pre-wrap">
                          <strong>Findings:</strong> {r.findings}
                        </p>
                      )}
                      
                      <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-zinc-500">
                        {r.location && <span>📍 {r.location}</span>}
                        {r.peopleInvolved && <span>👥 {r.peopleInvolved}</span>}
                        {r.timeSpent && <span>⏱ {r.timeSpent}</span>}
                      </div>
                      
                      {(r.media || []).length > 0 && (
                        <div className="grid grid-cols-4 gap-1 mt-2">
                          {r.media.map((m, j) => (
                            m.type?.startsWith('image/') ? (
                              <img 
                                key={j} 
                                src={m.data} 
                                alt={`Report media ${j + 1}`}
                                className="aspect-square object-cover rounded cursor-pointer hover:opacity-80 transition-opacity"
                                onClick={() => window.open(m.data, '_blank')}
                                onError={(e) => {
                                  e.target.style.display = 'none'
                                }}
                              />
                            ) : (
                              <div 
                                key={j} 
                                className="aspect-square bg-zinc-950 rounded flex items-center justify-center text-[10px] text-zinc-500"
                              >
                                <Video className="h-5 w-5" />
                              </div>
                            )
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
/* ============================================================
   ADMIN PRESS CARDS — Manage Press ID Card PDFs for reporters
   ============================================================ */
const AdminPressCards = ({ token }) => {
  const [users, setUsers] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [loading, setLoading] = useState(false)
  const [uploadingFor, setUploadingFor] = useState(null) // userId being uploaded for
  const [uploadProgress, setUploadProgress] = useState(null) // { userId, fileName }
  const fileInputRefs = useRef({})

  const ITEMS_PER_PAGE = 15

  const load = async (p = 1) => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      params.set('page', p)
      params.set('limit', ITEMS_PER_PAGE)
      if (search) params.set('q', search)
      if (roleFilter) params.set('role', roleFilter)
      if (statusFilter) params.set('status', statusFilter)

      const r = await fetch(`${API}/users?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (!r.ok) throw new Error('Failed to fetch users')
      const d = await r.json()
      setUsers(d.users || [])
      setTotal(d.total || 0)
      setPage(d.page || 1)
      setHasMore(d.hasMore || false)
    } catch (err) {
      console.error('Failed to load users:', err)
      toast.error('Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (token) load(1)
  }, [token, roleFilter, statusFilter])

  // Debounced search
  useEffect(() => {
    if (!token) return
    const t = setTimeout(() => load(1), 400)
    return () => clearTimeout(t)
  }, [search])

  const handleUpload = async (userId, file) => {
    if (!file) return
    // Accept various PDF MIME types and also check file extension
    const isPdf = file.type === 'application/pdf' || 
                  file.type === 'application/x-pdf' || 
                  file.type === 'application/octet-stream' ||
                  file.name?.toLowerCase().endsWith('.pdf')
    if (!isPdf) {
      toast.error('Only PDF files are allowed')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be under 5MB')
      return
    }

    setUploadProgress({ userId, fileName: file.name })
    try {
      const formData = new FormData()
      formData.append('pressCard', file)

      const r = await fetch(`${API}/admin/users/${userId}/press-card`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      })
      const d = await r.json()
      if (d.ok) {
        toast.success('Press ID Card uploaded!')
        await load(page)
      } else {
        toast.error(d.error || 'Upload failed')
      }
    } catch (err) {
      console.error('Upload error:', err)
      toast.error('Upload failed. Try again.')
    } finally {
      setUploadProgress(null)
    }
  }

  const handleDelete = async (userId) => {
    if (!window.confirm('Remove this Press ID Card? The reporter will no longer be able to download it.')) return
    try {
      const r = await fetch(`${API}/admin/users/${userId}/press-card`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      })
      const d = await r.json()
      if (d.ok) {
        toast.success('Press ID Card removed')
        await load(page)
      } else {
        toast.error(d.error || 'Failed to remove')
      }
    } catch (err) {
      console.error('Delete error:', err)
      toast.error('Failed to remove Press ID Card')
    }
  }

  const totalPages = Math.ceil(total / ITEMS_PER_PAGE)

  return (
    <div className="space-y-4">
      {/* Header with stats */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <IdCard className="h-5 w-5 text-green-400" />
          <h3 className="text-white font-black text-lg">Press ID Cards</h3>
          <span className="text-xs text-zinc-500">({total} reporters)</span>
        </div>
        <span className="text-xs text-zinc-500">
          Upload official Press ID Card PDFs for reporters. Only PDF files allowed (max 5MB).
        </span>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
          <Input
            placeholder="Search by name, email, mobile, or ID..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-10 bg-zinc-950 border-zinc-800 text-white"
          />
        </div>
        <Select value={roleFilter || 'all'} onValueChange={v => setRoleFilter(v === 'all' ? '' : v)}>
          <SelectTrigger className="w-[140px] bg-zinc-950 border-zinc-800 text-white">
            <SelectValue placeholder="All Roles" />
          </SelectTrigger>
          <SelectContent className="bg-zinc-950 border-zinc-800 text-white">
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="reporter">Reporter</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="user">User</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter || 'all'} onValueChange={v => setStatusFilter(v === 'all' ? '' : v)}>
          <SelectTrigger className="w-[140px] bg-zinc-950 border-zinc-800 text-white">
            <SelectValue placeholder="Payment Status" />
          </SelectTrigger>
          <SelectContent className="bg-zinc-950 border-zinc-800 text-white">
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Users Table */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-900">
                <th className="text-left px-4 py-3 text-zinc-400 text-xs font-semibold uppercase tracking-wider">Reporter / Name</th>
                <th className="text-left px-4 py-3 text-zinc-400 text-xs font-semibold uppercase tracking-wider hidden md:table-cell">Email</th>
                <th className="text-left px-4 py-3 text-zinc-400 text-xs font-semibold uppercase tracking-wider hidden sm:table-cell">Mobile</th>
                <th className="text-left px-4 py-3 text-zinc-400 text-xs font-semibold uppercase tracking-wider">Reporter ID</th>
                <th className="text-center px-4 py-3 text-zinc-400 text-xs font-semibold uppercase tracking-wider">Status</th>
                <th className="text-center px-4 py-3 text-zinc-400 text-xs font-semibold uppercase tracking-wider">Press Card</th>
                <th className="text-center px-4 py-3 text-zinc-400 text-xs font-semibold uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading && users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-zinc-500" />
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-zinc-500">
                    No users found
                  </td>
                </tr>
              ) : (
                users.map(u => (
                  <tr key={u.id || u._id} className="border-b border-zinc-800/50 hover:bg-zinc-900/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                          {(u.name || 'U')[0].toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-white font-semibold truncate max-w-[180px]">{u.name || 'Unknown'}</p>
                          <p className="text-[10px] text-zinc-500 truncate max-w-[180px]">{u.state || 'India'}{u.district ? ` › ${u.district}` : ''}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-zinc-400 text-xs hidden md:table-cell max-w-[180px] truncate">
                      {u.email || '—'}
                    </td>
                    <td className="px-4 py-3 text-zinc-400 text-xs hidden sm:table-cell">
                      {u.mobile || '—'}
                    </td>
                    <td className="px-4 py-3">
                      <code className="text-[11px] bg-zinc-900 text-yellow-400 px-2 py-0.5 rounded font-mono">
                        {u.referralCode || u.id?.slice(0, 8) || '—'}
                      </code>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Badge className={u.paymentStatus === 'paid' ? 'bg-green-700' : 'bg-yellow-700'}>
                        {u.paymentStatus === 'paid' ? 'Paid' : u.paymentStatus === 'pending' ? 'Pending' : u.role}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {u.pressCardPath ? (
                        <Badge className="bg-green-700 flex items-center gap-1 w-fit mx-auto">
                          <CheckCircle2 className="h-3 w-3" /> Uploaded
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="border-zinc-700 text-zinc-400 flex items-center gap-1 w-fit mx-auto">
                          <ShieldX className="h-3 w-3" /> Not Issued
                        </Badge>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {/* Hidden file input */}
                        <input
                          ref={el => { fileInputRefs.current[u.id] = el }}
                          type="file"
                          accept=".pdf,application/pdf"
                          className="hidden"
                          onChange={e => {
                            const file = e.target.files?.[0]
                            if (file) handleUpload(u.id, file)
                            e.target.value = ''
                          }}
                        />

                        {uploadProgress?.userId === u.id ? (
                          <Button size="sm" disabled className="bg-green-700/50 text-xs">
                            <Loader2 className="h-3 w-3 animate-spin mr-1" /> Uploading...
                          </Button>
                        ) : (
                          <>
                            <Button
                              size="sm"
                              onClick={() => fileInputRefs.current[u.id]?.click()}
                              className="bg-green-600 hover:bg-green-700 h-7 text-xs"
                              title={u.pressCardPath ? 'Replace Press ID Card PDF' : 'Upload Press ID Card PDF'}
                            >
                              <Upload className="h-3 w-3 mr-1" />
                              {u.pressCardPath ? 'Replace' : 'Upload'}
                            </Button>
                            {u.pressCardPath && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDelete(u.id)}
                                className="border-red-700 bg-red-950/30 text-red-400 h-7 text-xs hover:bg-red-950/50"
                                title="Remove Press ID Card"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-zinc-800 bg-zinc-900/50">
            <span className="text-xs text-zinc-500">
              Page {page} of {totalPages} ({(page - 1) * ITEMS_PER_PAGE + 1}–{Math.min(page * ITEMS_PER_PAGE, total)} of {total})
            </span>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => load(page - 1)}
                disabled={page <= 1 || loading}
                className="border-zinc-700 bg-zinc-900 text-white h-7"
              >
                <ChevronLeft className="h-3 w-3 mr-1" /> Prev
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => load(page + 1)}
                disabled={!hasMore || loading}
                className="border-zinc-700 bg-zinc-900 text-white h-7"
              >
                Next <ChevronRight className="h-3 w-3 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Info card */}
      <Card className="bg-zinc-950 border-zinc-800">
        <CardContent className="p-4">
          <div className="flex items-start gap-3 text-sm">
            <ShieldCheck className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
            <div className="text-zinc-400">
              <p className="font-semibold text-white mb-1">Press ID Card Management</p>
              <ul className="text-xs space-y-1 list-disc list-inside">
                <li>Upload official Press ID Card PDF for each reporter</li>
                <li>Only PDF files are accepted (max 5MB)</li>
                <li>Reporters will see the uploaded PDF in their dashboard</li>
                <li>Replace or remove cards as needed</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

/* ============================================================
   ADMIN MEMBERS — Full user management (View, Edit, Password, Approve/Reject, Delete)
   ============================================================ */
const AdminMembers = ({ token }) => {
  const [users, setUsers] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [membershipFilter, setMembershipFilter] = useState('')
  const [loading, setLoading] = useState(false)
  const [busy, setBusy] = useState(false)
  const [viewUser, setViewUser] = useState(null)
  const [editUser, setEditUser] = useState(null)
  const [editForm, setEditForm] = useState({})
  const [passwordDialog, setPasswordDialog] = useState(null)
  const [newPassword, setNewPassword] = useState('')

  const ITEMS_PER_PAGE = 15

  const load = async (p = 1) => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      params.set('page', p)
      params.set('limit', ITEMS_PER_PAGE)
      if (search) params.set('q', search)
      if (roleFilter) params.set('role', roleFilter)
      if (membershipFilter) params.set('membershipStatus', membershipFilter)

      const r = await fetch(`${API}/users?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (!r.ok) throw new Error('Failed to fetch')
      const d = await r.json()
      setUsers(d.users || [])
      setTotal(d.total || 0)
      setPage(d.page || 1)
      setHasMore(d.hasMore || false)
    } catch (err) {
      console.error('Failed to load members:', err)
      toast.error('Failed to load members')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (token) load(1)
  }, [token, roleFilter, membershipFilter])

  // Debounced search
  useEffect(() => {
    if (!token) return
    const t = setTimeout(() => load(1), 400)
    return () => clearTimeout(t)
  }, [search])

  // View user details
  const handleView = async (userId) => {
    try {
      setBusy(true)
      const r = await fetch(`${API}/admin/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (!r.ok) throw new Error('Failed to fetch')
      const d = await r.json()
      setViewUser(d.user)
    } catch (err) {
      toast.error('Failed to load user details')
    } finally {
      setBusy(false)
    }
  }

  // Edit user — open dialog with current data
  const handleEditOpen = (user) => {
    setEditUser(user)
    setEditForm({
      name: user.name || '',
      email: user.email || '',
      mobile: user.mobile || '',
      state: user.state || '',
      district: user.district || '',
      city: user.city || '',
      role: user.role || 'user',
      designation: user.designation || '',
      bio: user.bio || '',
      experience: user.experience || '',
      address: user.address || '',
      paymentStatus: user.paymentStatus || 'pending',
      membershipStatus: user.membershipStatus || 'pending'
    })
  }

  const handleEditSave = async () => {
    if (!editUser) return
    try {
      setBusy(true)
      const r = await fetch(`${API}/admin/users/${editUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(editForm)
      })
      const d = await r.json()
      if (d.ok) {
        toast.success('User updated!')
        setEditUser(null)
        await load(page)
      } else {
        toast.error(d.error || 'Update failed')
      }
    } catch (err) {
      toast.error('Failed to update user')
    } finally {
      setBusy(false)
    }
  }

  // Change password
  const handleChangePassword = async () => {
    if (!passwordDialog || !newPassword || newPassword.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }
    try {
      setBusy(true)
      const r = await fetch(`${API}/admin/users/${passwordDialog}/change-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ newPassword })
      })
      const d = await r.json()
      if (d.ok) {
        toast.success('Password changed!')
        setPasswordDialog(null)
        setNewPassword('')
      } else {
        toast.error(d.error || 'Failed to change password')
      }
    } catch (err) {
      toast.error('Failed to change password')
    } finally {
      setBusy(false)
    }
  }

  // Approve payment (set paymentStatus to paid)
  const handleApprovePayment = async (userId, userName) => {
    if (!window.confirm(`Approve payment for ${userName || userId}? This will set their payment status to Paid.`)) return
    try {
      setBusy(true)
      const r = await fetch(`${API}/admin/users/${userId}/approve-payment`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      })
      const d = await r.json()
      if (d.ok) {
        toast.success('Payment approved!')
        await load(page)
      } else {
        toast.error(d.error || 'Approval failed')
      }
    } catch (err) {
      toast.error('Failed to approve payment')
    } finally {
      setBusy(false)
    }
  }

  // Approve membership
  const handleApprove = async (userId) => {
    if (!window.confirm('Approve this member? They will be granted full access.')) return
    try {
      setBusy(true)
      const r = await fetch(`${API}/admin/users/${userId}/approve`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      })
      const d = await r.json()
      if (d.ok) {
        toast.success('Member approved!')
        await load(page)
      } else {
        toast.error(d.error || 'Approval failed')
      }
    } catch (err) {
      toast.error('Failed to approve')
    } finally {
      setBusy(false)
    }
  }

  // Reject membership
  const handleReject = async (userId) => {
    if (!window.confirm('Reject this member? They will be marked as rejected.')) return
    try {
      setBusy(true)
      const r = await fetch(`${API}/admin/users/${userId}/reject`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      })
      const d = await r.json()
      if (d.ok) {
        toast.success('Member rejected')
        await load(page)
      } else {
        toast.error(d.error || 'Rejection failed')
      }
    } catch (err) {
      toast.error('Failed to reject')
    } finally {
      setBusy(false)
    }
  }

  // Delete user with double confirmation
  const handleDelete = async (userId, userName) => {
    // First confirm: show scary warning
    if (!window.confirm(`⚠️ DELETE "${userName || userId}"?\n\nThis will permanently remove the user and ALL their associated data:\n• News articles\n• Referrals\n• Payout history\n• Advertisements\n• Assigned tasks\n\nThis action CANNOT be undone!`)) return
    // Second: require typing DELETE
    const typed = prompt('Type "DELETE" to permanently remove this user:')
    if (typed !== 'DELETE') {
      toast.error('Deletion cancelled - you must type DELETE exactly')
      return
    }
    try {
      setBusy(true)
      const r = await fetch(`${API}/admin/users/${userId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      })
      const d = await r.json()
      if (d.ok) {
        toast.success('User deleted permanently')
        if (viewUser?.id === userId) setViewUser(null)
        if (editUser?.id === userId) setEditUser(null)
        await load(page)
      } else {
        toast.error(d.error || 'Delete failed')
      }
    } catch (err) {
      toast.error('Failed to delete user')
    } finally {
      setBusy(false)
    }
  }

  const totalPages = Math.ceil(total / ITEMS_PER_PAGE)
  const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <User className="h-5 w-5 text-cyan-400" />
          <h3 className="text-white font-black text-lg">Members</h3>
          <span className="text-xs text-zinc-500">({total} total)</span>
        </div>
        <span className="text-xs text-zinc-500">
          Manage all registered members — View, Edit, Approve/Reject, Change Password, Delete
        </span>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
          <Input
            placeholder="Search by name, email, mobile, or ID..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-10 bg-zinc-950 border-zinc-800 text-white"
          />
        </div>
        <Select value={roleFilter || 'all'} onValueChange={v => setRoleFilter(v === 'all' ? '' : v)}>
          <SelectTrigger className="w-[130px] bg-zinc-950 border-zinc-800 text-white">
            <SelectValue placeholder="All Roles" />
          </SelectTrigger>
          <SelectContent className="bg-zinc-950 border-zinc-800 text-white">
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="reporter">Reporter</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="user">User</SelectItem>
          </SelectContent>
        </Select>
        <Select value={membershipFilter || 'all'} onValueChange={v => setMembershipFilter(v === 'all' ? '' : v)}>
          <SelectTrigger className="w-[130px] bg-zinc-950 border-zinc-800 text-white">
            <SelectValue placeholder="Membership" />
          </SelectTrigger>
          <SelectContent className="bg-zinc-950 border-zinc-800 text-white">
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">⏳ Pending</SelectItem>
            <SelectItem value="approved">✅ Approved</SelectItem>
            <SelectItem value="rejected">❌ Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Members Table */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-900">
                <th className="text-left px-4 py-3 text-zinc-400 text-xs font-semibold uppercase tracking-wider">Name / Location</th>
                <th className="text-left px-4 py-3 text-zinc-400 text-xs font-semibold uppercase tracking-wider hidden md:table-cell">Email</th>
                <th className="text-left px-4 py-3 text-zinc-400 text-xs font-semibold uppercase tracking-wider hidden sm:table-cell">Mobile</th>
                <th className="text-left px-4 py-3 text-zinc-400 text-xs font-semibold uppercase tracking-wider hidden lg:table-cell">Role</th>
                <th className="text-center px-4 py-3 text-zinc-400 text-xs font-semibold uppercase tracking-wider">Membership</th>
                <th className="text-center px-4 py-3 text-zinc-400 text-xs font-semibold uppercase tracking-wider">Payment</th>
                <th className="text-right px-4 py-3 text-zinc-400 text-xs font-semibold uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-zinc-500" />
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-zinc-500">
                    No members found
                  </td>
                </tr>
              ) : (
                users.map(u => (
                  <tr key={u.id || u._id} className="border-b border-zinc-800/50 hover:bg-zinc-900/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-cyan-600 to-blue-800 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                          {(u.name || '?')[0].toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-white font-semibold truncate max-w-[160px]">{u.name || 'Unknown'}</p>
                          <p className="text-[10px] text-zinc-500 truncate max-w-[160px]">
                            {u.state || '—'}{u.district ? ` › ${u.district}` : ''}
                            {u.createdAt ? ` • ${fmtDate(u.createdAt)}` : ''}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-zinc-400 text-xs hidden md:table-cell max-w-[180px] truncate">
                      {u.email || '—'}
                    </td>
                    <td className="px-4 py-3 text-zinc-400 text-xs hidden sm:table-cell">
                      {u.mobile || '—'}
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <Badge variant="outline" className={`text-[10px] capitalize ${u.role === 'admin' ? 'border-red-700 text-red-400' : u.role === 'reporter' ? 'border-blue-700 text-blue-400' : 'border-zinc-700 text-zinc-400'}`}>
                        {u.role || 'user'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Badge className={
                        u.membershipStatus === 'approved' ? 'bg-green-700' :
                        u.membershipStatus === 'rejected' ? 'bg-red-700' :
                        'bg-yellow-700'
                      }>
                        {u.membershipStatus === 'approved' ? '✅ Approved' :
                         u.membershipStatus === 'rejected' ? '❌ Rejected' :
                         '⏳ Pending'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Badge className={u.paymentStatus === 'paid' ? 'bg-green-700' : 'bg-yellow-700'}>
                        {u.paymentStatus === 'paid' ? 'Paid' : u.paymentStatus === 'pending' ? 'Pending' : '—'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1 flex-wrap">
                        <Button size="sm" onClick={() => handleView(u.id)} className="bg-zinc-800 hover:bg-zinc-700 h-7 w-7 p-0" title="View Details">
                          <FileText className="h-3 w-3" />
                        </Button>
                        <Button size="sm" onClick={() => handleEditOpen(u)} className="bg-blue-800 hover:bg-blue-700 h-7 w-7 p-0" title="Edit User">
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button size="sm" onClick={() => { setPasswordDialog(u.id); setNewPassword('') }} className="bg-purple-800 hover:bg-purple-700 h-7 w-7 p-0" title="Change Password">
                          <ShieldCheck className="h-3 w-3" />
                        </Button>
                        {u.paymentStatus === 'pending' && (
                          <Button size="sm" onClick={() => handleApprovePayment(u.id, u.name)} className="bg-emerald-600 hover:bg-emerald-500 h-7 w-7 p-0" title="Approve Payment">
                            <Wallet className="h-3 w-3" />
                          </Button>
                        )}
                        {u.membershipStatus !== 'approved' && (
                          <Button size="sm" onClick={() => handleApprove(u.id)} className="bg-green-700 hover:bg-green-600 h-7 w-7 p-0" title="Approve Member">
                            <CheckCircle2 className="h-3 w-3" />
                          </Button>
                        )}
                        {u.membershipStatus !== 'rejected' && u.membershipStatus !== 'pending' && (
                          <Button size="sm" onClick={() => handleReject(u.id)} className="bg-red-800 hover:bg-red-700 h-7 w-7 p-0" title="Reject Member">
                            <XCircle className="h-3 w-3" />
                          </Button>
                        )}
                        <Button size="sm" onClick={() => handleDelete(u.id, u.name)} variant="outline" className="border-red-700 bg-red-950/30 text-red-400 h-7 w-7 p-0 hover:bg-red-950/50" title="Delete User">
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-zinc-800 bg-zinc-900/50">
            <span className="text-xs text-zinc-500">
              Page {page} of {totalPages} ({(page - 1) * ITEMS_PER_PAGE + 1}–{Math.min(page * ITEMS_PER_PAGE, total)} of {total})
            </span>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => load(page - 1)} disabled={page <= 1 || loading} className="border-zinc-700 bg-zinc-900 text-white h-7">
                <ChevronLeft className="h-3 w-3 mr-1" /> Prev
              </Button>
              <Button size="sm" variant="outline" onClick={() => load(page + 1)} disabled={!hasMore || loading} className="border-zinc-700 bg-zinc-900 text-white h-7">
                Next <ChevronRight className="h-3 w-3 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Info Card */}
      <Card className="bg-zinc-950 border-zinc-800">
        <CardContent className="p-4">
          <div className="flex items-start gap-3 text-sm">
            <User className="h-5 w-5 text-cyan-500 mt-0.5 flex-shrink-0" />
            <div className="text-zinc-400">
              <p className="font-semibold text-white mb-1">Member Management</p>
              <ul className="text-xs space-y-1 list-disc list-inside">
                <li>New members start as <span className="text-yellow-400">Pending</span> — admin must approve or reject them</li>
                <li>Edit any user's details including role, status, and personal info</li>
                <li>Change passwords securely without knowing the current one</li>
                <li>Deleting a user permanently removes all their associated data</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ============ VIEW USER DIALOG ============ */}
      {viewUser && (
        <Dialog open={!!viewUser} onOpenChange={(o) => !o && setViewUser(null)}>
          <DialogContent className="bg-zinc-950 border-zinc-800 text-white max-w-lg max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-cyan-400" />
                <span>{viewUser.name || 'User Details'}</span>
              </DialogTitle>
              <DialogDescription className="text-zinc-400">
                Full profile details — ID: {viewUser.id?.slice(0, 12)}...
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-4 bg-zinc-900 rounded-lg p-4">
                <div className="h-14 w-14 rounded-full bg-gradient-to-br from-cyan-600 to-blue-800 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                  {(viewUser.name || '?')[0].toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-white font-bold text-base">{viewUser.name}</p>
                  <p className="text-xs text-zinc-400">{viewUser.designation || viewUser.role || '—'} • {viewUser.state || '—'}{viewUser.district ? ` › ${viewUser.district}` : ''}</p>
                  <div className="flex gap-2 mt-1">
                    <Badge className={viewUser.membershipStatus === 'approved' ? 'bg-green-700' : viewUser.membershipStatus === 'rejected' ? 'bg-red-700' : 'bg-yellow-700'}>{viewUser.membershipStatus || 'pending'}</Badge>
                    <Badge variant="outline" className="border-zinc-700 text-zinc-300">{viewUser.role}</Badge>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="bg-zinc-900 rounded p-2.5">
                  <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Email</p>
                  <p className="text-white font-medium text-sm break-all">{viewUser.email || '—'}</p>
                </div>
                <div className="bg-zinc-900 rounded p-2.5">
                  <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Mobile</p>
                  <p className="text-white font-medium">{viewUser.mobile || '—'}</p>
                </div>
                <div className="bg-zinc-900 rounded p-2.5">
                  <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Referral Code</p>
                  <p className="text-yellow-400 font-mono font-medium">{viewUser.referralCode || '—'}</p>
                </div>
                <div className="bg-zinc-900 rounded p-2.5">
                  <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Wallet Balance</p>
                  <p className="text-green-400 font-bold">₹{(viewUser.walletBalance || 0).toLocaleString()}</p>
                </div>
                <div className="bg-zinc-900 rounded p-2.5">
                  <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Payment Status</p>
                  <p className="text-white font-medium capitalize">{viewUser.paymentStatus || '—'}</p>
                </div>
                <div className="bg-zinc-900 rounded p-2.5">
                  <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Membership</p>
                  <p className="text-white font-medium capitalize">{viewUser.membershipStatus || 'pending'}</p>
                </div>
                <div className="bg-zinc-900 rounded p-2.5">
                  <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Joined</p>
                  <p className="text-white font-medium">{fmtDate(viewUser.createdAt)}</p>
                </div>
                <div className="bg-zinc-900 rounded p-2.5">
                  <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Verified</p>
                  <p className="text-white font-medium">{viewUser.verified ? '✅ Yes' : '❌ No'}</p>
                </div>
              </div>

              {viewUser.bio && (
                <div className="bg-zinc-900 rounded p-2.5">
                  <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Bio</p>
                  <p className="text-zinc-300 text-sm">{viewUser.bio}</p>
                </div>
              )}
              {viewUser.aadhaar && (
                <div className="bg-zinc-900 rounded p-2.5">
                  <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Aadhaar / PAN</p>
                  <p className="text-zinc-300 font-mono text-xs">Aadhaar: {viewUser.aadhaar} {viewUser.pan ? `• PAN: ${viewUser.pan}` : ''}</p>
                </div>
              )}
              {viewUser.social && (
                <div className="bg-zinc-900 rounded p-2.5">
                  <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Social Links</p>
                  <div className="flex flex-wrap gap-2 mt-1 text-xs">
                    {viewUser.social?.facebook && <span className="text-blue-400">FB: {viewUser.social.facebook}</span>}
                    {viewUser.social?.twitter && <span className="text-sky-400">TW: {viewUser.social.twitter}</span>}
                    {viewUser.social?.instagram && <span className="text-pink-400">IG: {viewUser.social.instagram}</span>}
                    {viewUser.social?.youtube && <span className="text-red-400">YT: {viewUser.social.youtube}</span>}
                    {!viewUser.social?.facebook && !viewUser.social?.twitter && !viewUser.social?.instagram && !viewUser.social?.youtube && <span className="text-zinc-500">None</span>}
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* ============ EDIT USER DIALOG ============ */}
      {editUser && (
        <Dialog open={!!editUser} onOpenChange={(o) => !o && setEditUser(null)}>
          <DialogContent className="bg-zinc-950 border-zinc-800 text-white max-w-lg max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Edit className="h-5 w-5 text-blue-400" />
                <span>Edit: {editUser.name}</span>
              </DialogTitle>
              <DialogDescription className="text-zinc-400">Update user details and status</DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-zinc-400 block mb-1">Name</label>
                  <Input value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} className="bg-zinc-900 border-zinc-800 text-white" />
                </div>
                <div>
                  <label className="text-xs text-zinc-400 block mb-1">Email</label>
                  <Input value={editForm.email} onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))} className="bg-zinc-900 border-zinc-800 text-white" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-zinc-400 block mb-1">Mobile</label>
                  <Input value={editForm.mobile} onChange={e => setEditForm(f => ({ ...f, mobile: e.target.value }))} className="bg-zinc-900 border-zinc-800 text-white" />
                </div>
                <div>
                  <label className="text-xs text-zinc-400 block mb-1">Role</label>
                  <Select value={editForm.role} onValueChange={v => setEditForm(f => ({ ...f, role: v }))}>
                    <SelectTrigger className="bg-zinc-900 border-zinc-800 text-white"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-zinc-950 border-zinc-800 text-white">
                      <SelectItem value="reporter">Reporter</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="user">User</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-zinc-400 block mb-1">Designation</label>
                  <Input value={editForm.designation} onChange={e => setEditForm(f => ({ ...f, designation: e.target.value }))} className="bg-zinc-900 border-zinc-800 text-white" />
                </div>
                <div>
                  <label className="text-xs text-zinc-400 block mb-1">Membership Status</label>
                  <Select value={editForm.membershipStatus} onValueChange={v => setEditForm(f => ({ ...f, membershipStatus: v }))}>
                    <SelectTrigger className="bg-zinc-900 border-zinc-800 text-white"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-zinc-950 border-zinc-800 text-white">
                      <SelectItem value="pending">⏳ Pending</SelectItem>
                      <SelectItem value="approved">✅ Approved</SelectItem>
                      <SelectItem value="rejected">❌ Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-zinc-400 block mb-1">Payment Status</label>
                  <Select value={editForm.paymentStatus} onValueChange={v => setEditForm(f => ({ ...f, paymentStatus: v }))}>
                    <SelectTrigger className="bg-zinc-900 border-zinc-800 text-white"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-zinc-950 border-zinc-800 text-white">
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs text-zinc-400 block mb-1">State</label>
                  <Input value={editForm.state} onChange={e => setEditForm(f => ({ ...f, state: e.target.value }))} className="bg-zinc-900 border-zinc-800 text-white" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-zinc-400 block mb-1">District</label>
                  <Input value={editForm.district} onChange={e => setEditForm(f => ({ ...f, district: e.target.value }))} className="bg-zinc-900 border-zinc-800 text-white" />
                </div>
                <div>
                  <label className="text-xs text-zinc-400 block mb-1">City</label>
                  <Input value={editForm.city} onChange={e => setEditForm(f => ({ ...f, city: e.target.value }))} className="bg-zinc-900 border-zinc-800 text-white" />
                </div>
              </div>
              <div>
                <label className="text-xs text-zinc-400 block mb-1">Address</label>
                <Textarea value={editForm.address} onChange={e => setEditForm(f => ({ ...f, address: e.target.value }))} className="bg-zinc-900 border-zinc-800 text-white" rows={2} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-zinc-400 block mb-1">Bio</label>
                  <Textarea value={editForm.bio} onChange={e => setEditForm(f => ({ ...f, bio: e.target.value }))} className="bg-zinc-900 border-zinc-800 text-white" rows={2} />
                </div>
                <div>
                  <label className="text-xs text-zinc-400 block mb-1">Experience</label>
                  <Input value={editForm.experience} onChange={e => setEditForm(f => ({ ...f, experience: e.target.value }))} className="bg-zinc-900 border-zinc-800 text-white" />
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <Button variant="outline" onClick={() => setEditUser(null)} className="flex-1 border-zinc-800 bg-zinc-900 text-white" disabled={busy}>Cancel</Button>
                <Button onClick={handleEditSave} disabled={busy} className="flex-1 bg-blue-600 hover:bg-blue-700">
                  {busy ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null} Save Changes
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* ============ CHANGE PASSWORD DIALOG ============ */}
      {passwordDialog && (
        <Dialog open={!!passwordDialog} onOpenChange={(o) => { if (!o) { setPasswordDialog(null); setNewPassword('') } }}>
          <DialogContent className="bg-zinc-950 border-zinc-800 text-white max-w-sm">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-purple-400" />
                <span>Change Password</span>
              </DialogTitle>
              <DialogDescription className="text-zinc-400">
                Set a new password for this user. Min 6 characters.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <Input
                type="text"
                placeholder="New password (min 6 chars)"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                className="bg-zinc-900 border-zinc-800 text-white font-mono"
              />
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => { setPasswordDialog(null); setNewPassword('') }} className="flex-1 border-zinc-800 bg-zinc-900 text-white" disabled={busy}>Cancel</Button>
                <Button onClick={handleChangePassword} disabled={busy || newPassword.length < 6} className="flex-1 bg-purple-600 hover:bg-purple-700">
                  {busy ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null} Change Password
                </Button>
              </div>
            </div>
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
  const [loading, setLoading] = useState(false)

  const load = async () => {
    try {
      setLoading(true)
      const r = await fetch(`${API}/faqs`)
      if (!r.ok) throw new Error('Failed to fetch FAQs')
      const d = await r.json()
      setItems(d.faqs || [])
    } catch (err) {
      console.error('Failed to load FAQs:', err)
      toast.error('Failed to load FAQs')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (token) load()
  }, [token])

  const reset = () => { 
    setForm({ question: '', answer: '', order: 0 })
    setEditId(null) 
  }

  const save = async () => {
    if (!form.question || !form.answer) { 
      toast.error('Both fields required')
      return 
    }
    
    try {
      setLoading(true)
      const url = editId 
        ? `${API}/admin/faqs/${editId}` 
        : `${API}/admin/faqs`
      
      const method = editId ? 'PUT' : 'POST'
      
      const r = await fetch(url, { 
        method, 
        headers: { 
          'Content-Type': 'application/json', 
          Authorization: `Bearer ${token}` 
        }, 
        body: JSON.stringify(form) 
      })
      
      if (!r.ok) throw new Error('Request failed')
      
      const data = await r.json()
      
      if (data.ok) { 
        toast.success(editId ? 'FAQ updated!' : 'FAQ added!')
        reset()
        await load()
      } else {
        toast.error(data.error || 'Operation failed')
      }
    } catch (err) {
      console.error('Save FAQ error:', err)
      toast.error('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const del = async (id) => {
    if (!window.confirm('Delete this FAQ?')) return
    
    // If currently editing this FAQ, reset form
    if (editId === id) {
      reset()
    }
    
    try {
      setLoading(true)
      const r = await fetch(`${API}/admin/faqs/${id}`, { 
        method: 'DELETE', 
        headers: { Authorization: `Bearer ${token}` } 
      })
      
      if (!r.ok) throw new Error('Delete failed')
      
      toast.success('FAQ deleted')
      await load()
    } catch (err) {
      console.error('Delete FAQ error:', err)
      toast.error('Failed to delete FAQ')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (faq) => {
    setEditId(faq.id)
    setForm({ 
      question: faq.question || '', 
      answer: faq.answer || '', 
      order: faq.order || 0 
    })
    // Scroll to top to show the form
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="space-y-3">
      <Card className="bg-zinc-950 border-zinc-800">
        <CardContent className="p-4 space-y-2">
          <Input 
            placeholder="Question (will appear in RED)" 
            value={form.question} 
            onChange={e => setForm({ ...form, question: e.target.value })} 
            className="bg-zinc-900 border-zinc-800 text-red-300 placeholder:text-zinc-600 font-semibold" 
          />
          <Textarea 
            rows={3} 
            placeholder="Answer (will appear in BLUE)" 
            value={form.answer} 
            onChange={e => setForm({ ...form, answer: e.target.value })} 
            className="bg-zinc-900 border-zinc-800 text-blue-300 placeholder:text-zinc-600 resize-none" 
          />
          <div className="flex gap-2 items-center">
            <Input 
              type="number" 
              placeholder="Order" 
              value={form.order} 
              onChange={e => setForm({ ...form, order: parseInt(e.target.value || 0) })} 
              className="bg-zinc-900 border-zinc-800 text-white w-24" 
              min="0"
            />
            <Button 
              onClick={save} 
              className="bg-purple-600 hover:bg-purple-700 flex-1"
              disabled={loading || !form.question || !form.answer}
            >
              {loading ? (
                <span className="flex items-center">Loading...</span>
              ) : editId ? (
                'Update FAQ'
              ) : (
                <><Plus className="h-4 w-4 mr-1" /> Add FAQ</>
              )}
            </Button>
            {editId && (
              <Button 
                variant="outline" 
                onClick={reset} 
                className="border-zinc-700 bg-zinc-900 text-white"
                disabled={loading}
              >
                Cancel
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
      
      <div className="space-y-2">
        {loading && items.length === 0 ? (
          <div className="text-center py-8 text-zinc-400">Loading FAQs...</div>
        ) : items.length === 0 ? (
          <div className="text-center py-8 text-zinc-500">No FAQs yet. Add your first one above!</div>
        ) : (
          items.map((f, i) => (
            <Card 
              key={f.id || `faq-${i}`} 
              className={`bg-zinc-950 border-zinc-800 ${editId === f.id ? 'ring-2 ring-purple-600/50' : ''}`}
            >
              <CardContent className="p-3 space-y-1">
                <p className="text-red-500 font-bold text-sm">
                  Q{i + 1}. {f.question}
                </p>
                <p className="text-blue-400 text-sm pl-3">
                  A. {f.answer}
                </p>
                {f.order > 0 && (
                  <p className="text-[10px] text-zinc-600 pl-3">
                    Order: {f.order}
                  </p>
                )}
                <div className="flex justify-end gap-1 pt-1">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => handleEdit(f)} 
                    className="border-zinc-700 bg-zinc-900 text-white hover:bg-zinc-800"
                    disabled={loading}
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => del(f.id)} 
                    className="border-red-700 bg-red-950/30 text-red-400 hover:bg-red-950/50"
                    disabled={loading}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
