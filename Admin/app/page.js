'use client'

import { useEffect, useState } from 'react'
import { AdminSiteSettings } from '@/components/CommunitySections'
import { AdminOpsManagement } from '@/components/ReporterOps'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import {
  Shield, CheckCircle2, XCircle, Trash2, Plus, Building2, UserPlus, Award,
  Megaphone, BarChart3, Loader2, X, LogOut
} from 'lucide-react'
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'

const API = '/api'

const fmtTime = (d) => {
  const diff = Date.now() - new Date(d).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'अभी'
  if (mins < 60) return `${mins} min ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return new Date(d).toLocaleDateString('en-IN')
}

let _siteIdentity = { logo: '/branding/icn-logo.png', siteName: 'IC News', tagline: 'सच्चाई की आवाज़' }
const siteIdentityListeners = new Set()
const useSiteIdentity = () => {
  const [s, setS] = useState(_siteIdentity)
  useEffect(() => {
    siteIdentityListeners.add(setS)
    return () => siteIdentityListeners.delete(setS)
  }, [])
  return s
}
const refreshSiteIdentity = async () => {
  try {
    const r = await fetch(`${API}/site-settings`).then(r => r.json())
    _siteIdentity = {
      logo: r.logo || '/branding/icn-logo.png',
      siteName: r.siteName || 'IC News',
      tagline: r.tagline || 'सच्चाई की आवाज़'
    }
    siteIdentityListeners.forEach(fn => fn(_siteIdentity))
  } catch {}
}

const Logo = ({ size = 'md' }) => {
  const ident = useSiteIdentity()
  const dim = size === 'lg' ? 'h-12 w-12' : 'h-10 w-10'
  return (
    <div className="flex items-center gap-2">
      {ident.logo ? (
        <img src={ident.logo} alt={ident.siteName} className={`${dim} rounded-lg object-contain shadow-lg shadow-red-900/30 bg-black/50`} />
      ) : (
        <div className={`${dim} bg-gradient-to-br from-red-600 to-red-800 rounded-lg flex items-center justify-center font-black text-white shadow-lg shadow-red-900/50 text-xl`}>
          ICN
        </div>
      )}
      <div className="flex flex-col leading-tight">
        <span className="font-black text-base md:text-lg text-white">{ident.siteName}</span>
        <span className="text-[10px] md:text-xs text-red-500 font-bold tracking-wide">{ident.tagline}</span>
      </div>
    </div>
  )
}


// ============ HEADER (Admin Only) ============
const Header = ({ user, onLogout }) => {
  return (
    <header className="sticky top-0 z-50 bg-black/95 backdrop-blur-xl border-b border-red-900/50">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
        <div className="flex-shrink-0">
          <Logo />
        </div>
        <div className="flex items-center gap-2">
          {user ? (
            <>
              <Badge variant="destructive" className="bg-red-600 gap-1 px-2 py-1">
                <Shield className="h-3 w-3" /> Admin
              </Badge>
              <Avatar className="h-9 w-9 border-2 border-red-600">
                <AvatarImage src={user.photo} />
                <AvatarFallback className="bg-red-700 text-white text-xs">{user.name?.[0]}</AvatarFallback>
              </Avatar>
              <Button onClick={onLogout} variant="ghost" size="icon" className="text-white hover:bg-red-950">
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          ) : null}
        </div>
      </div>
    </header>
  )
}

// ============ LOGIN (Admin Only) ============
const LoginForm = ({ onLogin }) => {
  const [email, setEmail] = useState('admin@icn.com')
  const [password, setPassword] = useState('admin123')
  const [loading, setLoading] = useState(false)

  const submit = async () => {
    setLoading(true)
    const r = await fetch(`${API}/auth/login`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    }).then(r => r.json())
    setLoading(false)
    if (r.token) {
      localStorage.setItem('icn_token', r.token)
      localStorage.setItem('icn_user', JSON.stringify(r.user))
      onLogin(r.user)
      toast.success(`स्वागत है, ${r.user.name}!`)
    } else {
      toast.error(r.error || 'Login failed')
    }
  }

  return (
    <div className="max-w-md mx-auto px-4 py-12 min-h-screen flex items-center">
      <Card className="bg-zinc-950 border-zinc-800 shadow-2xl shadow-red-950/30 w-full">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto"><Logo size="lg" /></div>
          <CardTitle className="text-white text-2xl">Admin Login</CardTitle>
          <CardDescription className="text-zinc-400">IC News Admin Panel</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} className="bg-zinc-900 border-zinc-800 text-white" />
          <Input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} className="bg-zinc-900 border-zinc-800 text-white" />
          <Button onClick={submit} disabled={loading} className="w-full bg-red-600 hover:bg-red-700">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Login'}
          </Button>
          <div className="text-xs text-zinc-500 text-center pt-2 border-t border-zinc-800">
            <p className="font-semibold text-zinc-400">Admin Credentials:</p>
            <p>admin@icn.com / admin123</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

const AdminPanel = ({ token, user }) => {
  const [pending, setPending] = useState([])
  const [stats, setStats] = useState({})
  const [breaking, setBreaking] = useState([])
  const [newBreak, setNewBreak] = useState('')
  const [payouts, setPayouts] = useState([])
  const [payoutSummary, setPayoutSummary] = useState({})
  const [pendingAds, setPendingAds] = useState([])
  const [allAds, setAllAds] = useState([])
  const [posts, setPosts] = useState([])
  const [applications, setApplications] = useState([])
  const [showJobDialog, setShowJobDialog] = useState(false)

  const load = async () => {
    const [n, s, b, p, ap, aa, jp, apps] = await Promise.all([
      fetch(`${API}/news?status=pending`).then(r => r.json()),
      fetch(`${API}/stats`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
      fetch(`${API}/breaking`).then(r => r.json()),
      fetch(`${API}/payouts?all=true`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
      fetch(`${API}/ads?status=pending`).then(r => r.json()),
      fetch(`${API}/ads?status=approved`).then(r => r.json()),
      fetch(`${API}/posts`).then(r => r.json()),
      fetch(`${API}/applications/pending`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json())
    ])
    setPending(n.news || []); setStats(s); setBreaking(b.breaking || [])
    setPayouts(p.payouts || []); setPayoutSummary(p.summary || {})
    setPendingAds(ap.ads || []); setAllAds(aa.ads || [])
    setPosts(jp.posts || []); setApplications(apps.applications || [])
  }
  useEffect(() => { load() }, [])

  const moderateAd = async (id, status) => {
    const note = status === 'rejected' ? prompt('Rejection reason:') : null
    await fetch(`${API}/ads/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ status, adminNote: note })
    })
    toast.success(`Ad ${status}`)
    load()
  }

  const deleteAd = async (id) => {
    if (!confirm('Delete this ad permanently?')) return
    await fetch(`${API}/ads/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
    load()
  }

  const deletePost = async (id) => {
    if (!confirm('Delete this job post?')) return
    await fetch(`${API}/posts/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
    toast.success('Post deleted'); load()
  }

  const approveApplication = async (userId) => {
    await fetch(`${API}/users/${userId}/approve-application`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } })
    toast.success('Application approved'); load()
  }

  const processPayout = async (id, status) => {
    let txn = null
    if (status === 'paid') {
      txn = prompt('Enter Transaction ID / UTR Number:')
      if (!txn) return
    }
    const note = status === 'rejected' ? prompt('Reason for rejection:') : null
    await fetch(`${API}/payouts/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ status, transactionId: txn, adminNote: note })
    })
    toast.success(`Payout ${status}`)
    load()
  }

  const moderate = async (id, status) => {
    await fetch(`${API}/news/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ status })
    })
    toast.success(`News ${status}`)
    load()
  }

  const addBreaking = async () => {
    if (!newBreak.trim()) return
    await fetch(`${API}/breaking`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ text: newBreak })
    })
    setNewBreak('')
    toast.success('Breaking news added!')
    load()
  }

  const delBreaking = async (id) => {
    await fetch(`${API}/breaking/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
    load()
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-black text-white flex items-center gap-2">
          <Shield className="h-8 w-8 text-red-500" /> Admin Control Center
        </h1>
        <Badge className="bg-red-600">Super Admin</Badge>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: 'Total News', value: stats.total || 0, color: 'text-blue-500' },
          { label: 'Pending', value: stats.pending || 0, color: 'text-yellow-500' },
          { label: 'Approved', value: stats.approved || 0, color: 'text-green-500' },
          { label: 'Total Reporters', value: stats.totalReporters || 0, color: 'text-purple-500' },
          { label: 'Total Views', value: (stats.totalViews || 0).toLocaleString(), color: 'text-red-500' }
        ].map(s => (
          <Card key={s.label} className="bg-zinc-950 border-zinc-800">
            <CardContent className="p-3">
              <p className="text-xs text-zinc-500 uppercase">{s.label}</p>
              <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="bg-zinc-950 border border-zinc-800 flex-wrap h-auto">
          <TabsTrigger value="pending" className="data-[state=active]:bg-red-600">News ({pending.length})</TabsTrigger>
          <TabsTrigger value="ads" className="data-[state=active]:bg-red-600">Ads ({pendingAds.length})</TabsTrigger>
          <TabsTrigger value="jobs" className="data-[state=active]:bg-red-600">Jobs ({posts.length})</TabsTrigger>
          <TabsTrigger value="apps" className="data-[state=active]:bg-red-600">Apps ({applications.length})</TabsTrigger>
          <TabsTrigger value="breaking" className="data-[state=active]:bg-red-600">Breaking</TabsTrigger>
          <TabsTrigger value="payouts" className="data-[state=active]:bg-red-600">Payouts ({payouts.filter(p => p.status === 'pending').length})</TabsTrigger>
          <TabsTrigger value="analytics" className="data-[state=active]:bg-red-600">Analytics</TabsTrigger>
          <TabsTrigger value="ops" className="data-[state=active]:bg-red-600">Ops & FAQ</TabsTrigger>
          <TabsTrigger value="site" className="data-[state=active]:bg-red-600">Site Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-3 mt-4">
          {pending.length === 0 && <p className="text-zinc-500 text-center py-12">No pending news. All caught up! 🎉</p>}
          {pending.map(n => (
            <Card key={n.id} className="bg-zinc-950 border-zinc-800">
              <CardContent className="p-4 flex gap-4">
                {n.images?.[0] && <img src={n.images[0]} className="h-24 w-32 object-cover rounded" />}
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-white">{n.headline}</h4>
                  <p className="text-xs text-zinc-500 mt-1">{n.reporterName} • {n.state} › {n.district} • <Badge variant="outline" className="text-xs">{n.category}</Badge></p>
                  <p className="text-sm text-zinc-400 mt-2 line-clamp-2">{n.summary || n.content}</p>
                </div>
                <div className="flex flex-col gap-2">
                  <Button onClick={() => moderate(n.id, 'approved')} size="sm" className="bg-green-700 hover:bg-green-800"><CheckCircle2 className="h-4 w-4 mr-1" /> Approve</Button>
                  <Button onClick={() => moderate(n.id, 'rejected')} size="sm" variant="destructive"><XCircle className="h-4 w-4 mr-1" /> Reject</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="breaking" className="space-y-3 mt-4">
          <Card className="bg-zinc-950 border-zinc-800">
            <CardContent className="p-4 flex gap-2">
              <Input value={newBreak} onChange={e => setNewBreak(e.target.value)} placeholder="Add breaking news headline..." className="bg-zinc-900 border-zinc-800 text-white" />
              <Button onClick={addBreaking} className="bg-red-600 hover:bg-red-700"><Plus className="h-4 w-4" /></Button>
            </CardContent>
          </Card>
          {breaking.map(b => (
            <Card key={b.id} className="bg-zinc-950 border-zinc-800">
              <CardContent className="p-3 flex items-center justify-between">
                <span className="text-white">{b.text}</span>
                <Button onClick={() => delBreaking(b.id)} size="icon" variant="ghost" className="text-red-500"><Trash2 className="h-4 w-4" /></Button>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="analytics" className="mt-4">
          <AnalyticsPanel token={token} />
        </TabsContent>

        <TabsContent value="jobs" className="mt-4 space-y-3">
          <div className="flex justify-between items-center flex-wrap gap-2">
            <h3 className="text-white font-bold flex items-center gap-2"><Award className="h-4 w-4 text-yellow-500" /> Recruitment Posts</h3>
            <div className="flex gap-2 flex-wrap">
              <Button
                onClick={async () => {
                  if (!window.confirm('Auto-seed STATE LEVEL vacancies for ALL 36 India States/UTs?\n\n• 10 posts × 36 states = 360 job templates\n• 43 vacancies per state (1548 total seats)\n• Re-running is safe (idempotent — updates existing).')) return
                  const r = await fetch(`${API}/admin/seed-state-posts`, {
                    method: 'POST',
                    headers: { Authorization: `Bearer ${token}` }
                  }).then(r => r.json())
                  if (r.ok) {
                    toast.success(`✅ ${r.message}`)
                    load()
                  } else toast.error(r.error || 'Seeding failed')
                }}
                size="sm"
                variant="outline"
                className="border-yellow-700 bg-yellow-950/30 text-yellow-300 hover:bg-yellow-900/40 hover:text-yellow-200"
              >
                <Building2 className="h-4 w-4 mr-1" /> Auto-Seed All 36 States (360 posts)
              </Button>
              <Button onClick={() => setShowJobDialog(true)} size="sm" className="bg-red-600 hover:bg-red-700"><Plus className="h-4 w-4 mr-1" /> Create Post</Button>
            </div>
          </div>
          {posts.length === 0 && <p className="text-zinc-500 text-center py-8">No job posts. Click "Create Post" to add.</p>}
          {posts.map(p => (
            <Card key={p.id} className="bg-zinc-950 border-zinc-800">
              <CardContent className="p-4 flex flex-col md:flex-row gap-4 items-start">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <p className="font-bold text-white">{p.name}</p>
                    <Badge className="bg-yellow-600">₹{p.joiningFee}</Badge>
                    <Badge variant="outline" className="capitalize text-red-400 border-red-900">{p.levelType}</Badge>
                  </div>
                  <p className="text-xs text-zinc-400">📍 {[p.state, p.district, p.city].filter(Boolean).join(' › ')}</p>
                  <p className="text-sm text-zinc-300 mt-1">{p.description}</p>
                  <div className="flex gap-4 mt-2 text-xs">
                    <span className="text-green-500">Available: {p.availableSeats}</span>
                    <span className="text-yellow-500">Filled: {p.filledSeats || 0}</span>
                    <span className="text-zinc-400">Total: {p.totalVacancy}</span>
                  </div>
                </div>
                <Button onClick={() => deletePost(p.id)} size="icon" variant="ghost" className="text-red-500"><Trash2 className="h-4 w-4" /></Button>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="apps" className="mt-4 space-y-3">
          <h3 className="text-white font-bold flex items-center gap-2"><UserPlus className="h-4 w-4 text-blue-500" /> Pending Applications</h3>
          {applications.length === 0 && <p className="text-zinc-500 text-center py-8">No pending applications.</p>}
          {applications.map(a => (
            <Card key={a.id} className="bg-zinc-950 border-zinc-800">
              <CardContent className="p-4 flex items-center gap-3">
                <Avatar className="h-12 w-12 border border-red-600">
                  <AvatarImage src={a.photo} />
                  <AvatarFallback className="bg-red-700">{a.name?.[0]}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-white">{a.name}</p>
                  <p className="text-xs text-zinc-400">📱 {a.mobile} • 📧 {a.email}</p>
                  <p className="text-xs text-zinc-500">Applied for: <span className="text-yellow-400">{a.appliedPostName}</span> • {a.state}{a.district ? ` › ${a.district}` : ''}</p>
                  {a.bio && <p className="text-xs italic text-zinc-500 mt-1">"{a.bio}"</p>}
                </div>
                <Button onClick={() => approveApplication(a.id)} size="sm" className="bg-green-700 hover:bg-green-800"><CheckCircle2 className="h-4 w-4 mr-1" /> Approve</Button>
              </CardContent>
            </Card>
          ))}
        </TabsContent>


        <TabsContent value="payouts" className="mt-4 space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <Card className="bg-zinc-950 border-zinc-800">
              <CardContent className="p-3">
                <p className="text-xs text-zinc-500 uppercase">Total Requested</p>
                <p className="text-2xl font-black text-white">₹{(payoutSummary.totalRequested || 0).toLocaleString()}</p>
              </CardContent>
            </Card>
            <Card className="bg-zinc-950 border-zinc-800">
              <CardContent className="p-3">
                <p className="text-xs text-zinc-500 uppercase">Pending</p>
                <p className="text-2xl font-black text-yellow-500">₹{(payoutSummary.totalPending || 0).toLocaleString()}</p>
              </CardContent>
            </Card>
            <Card className="bg-zinc-950 border-zinc-800">
              <CardContent className="p-3">
                <p className="text-xs text-zinc-500 uppercase">Paid Out</p>
                <p className="text-2xl font-black text-green-500">₹{(payoutSummary.totalPaid || 0).toLocaleString()}</p>
              </CardContent>
            </Card>
          </div>

          {payouts.length === 0 && <p className="text-zinc-500 text-center py-12">No payout requests yet.</p>}
          {payouts.map(p => (
            <Card key={p.id} className="bg-zinc-950 border-zinc-800">
              <CardContent className="p-4 flex flex-col md:flex-row gap-4 md:items-center">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Avatar className="h-8 w-8"><AvatarFallback className="bg-red-700 text-xs">{p.userName?.[0]}</AvatarFallback></Avatar>
                    <span className="font-bold text-white">{p.userName}</span>
                    <Badge className={
                      p.status === 'paid' ? 'bg-green-700' :
                      p.status === 'approved' ? 'bg-blue-700' :
                      p.status === 'rejected' ? 'bg-red-700' : 'bg-yellow-700'
                    }>{p.status}</Badge>
                  </div>
                  <p className="text-2xl font-black text-green-400">₹{p.amount.toLocaleString()} <span className="text-xs text-zinc-500 font-normal">via {p.method.toUpperCase()}</span></p>
                  <div className="text-xs text-zinc-400 mt-1 space-y-0.5">
                    {p.method === 'upi' ? <p>UPI: <span className="font-mono text-white">{p.upiId}</span></p> : (
                      <>
                        <p>Holder: <span className="text-white">{p.accountHolder}</span></p>
                        <p>A/C: <span className="font-mono text-white">{p.accountNumber}</span> • IFSC: <span className="font-mono text-white">{p.ifsc}</span></p>
                      </>
                    )}
                    <p>📱 {p.userMobile} • {fmtTime(p.createdAt)}</p>
                    {p.notes && <p className="italic">"{p.notes}"</p>}
                    {p.transactionId && <p className="text-green-500">TXN: <span className="font-mono">{p.transactionId}</span></p>}
                    {p.adminNote && <p className="text-red-400">Admin Note: {p.adminNote}</p>}
                  </div>
                </div>
                {p.status === 'pending' && (
                  <div className="flex md:flex-col gap-2">
                    <Button onClick={() => processPayout(p.id, 'paid')} size="sm" className="bg-green-700 hover:bg-green-800">
                      <CheckCircle2 className="h-4 w-4 mr-1" /> Mark Paid
                    </Button>
                    <Button onClick={() => processPayout(p.id, 'rejected')} size="sm" variant="destructive">
                      <XCircle className="h-4 w-4 mr-1" /> Reject
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="ads" className="mt-4 space-y-3">
          <h3 className="text-white font-bold flex items-center gap-2"><Megaphone className="h-4 w-4 text-yellow-500" /> Pending Advertisements</h3>
          {pendingAds.length === 0 && <p className="text-zinc-500 text-center py-8">No pending ads.</p>}
          {pendingAds.map(a => (
            <Card key={a.id} className="bg-zinc-950 border-zinc-800">
              <CardContent className="p-4 flex flex-col md:flex-row gap-4">
                <img src={a.banner} className={`${a.type === 'bottom' ? 'h-24 w-48' : 'h-32 w-44'} object-cover rounded`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <Badge className="bg-yellow-700 capitalize">{a.type} ad</Badge>
                    <Badge variant="outline" className="text-zinc-300 border-zinc-700">₹{a.amountPaid || 299} paid</Badge>
                    <Badge variant="outline" className="text-zinc-300 border-zinc-700">{a.duration}d</Badge>
                  </div>
                  {a.link && <p className="text-xs text-zinc-400 mt-1">🔗 <a href={a.link} target="_blank" rel="noopener" className="text-blue-400">{a.link}</a></p>}
                  {a.ctaText && <p className="text-xs text-zinc-400">CTA: <span className="text-white">{a.ctaText}</span></p>}
                  <p className="text-xs text-zinc-500 mt-2">Reporter: {a.reporterId?.slice(0, 8)}... • {fmtTime(a.createdAt)}</p>
                </div>
                <div className="flex md:flex-col gap-2">
                  <Button onClick={() => moderateAd(a.id, 'approved')} size="sm" className="bg-green-700 hover:bg-green-800"><CheckCircle2 className="h-4 w-4 mr-1" /> Approve</Button>
                  <Button onClick={() => moderateAd(a.id, 'rejected')} size="sm" variant="destructive"><XCircle className="h-4 w-4 mr-1" /> Reject</Button>
                </div>
              </CardContent>
            </Card>
          ))}

          {allAds.length > 0 && (
            <div className="pt-4">
              <h3 className="text-white font-bold mb-2">Active Ads ({allAds.length})</h3>
              {allAds.map(a => (
                <Card key={a.id} className="bg-zinc-950 border-zinc-800 mb-2">
                  <CardContent className="p-3 flex items-center gap-3">
                    <img src={a.banner} className="h-12 w-20 object-cover rounded" />
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm capitalize font-bold">{a.type} Ad</p>
                      <p className="text-xs text-zinc-500">{a.impressions || 0} views • {a.clicks || 0} clicks</p>
                    </div>
                    <Badge className="bg-green-700">Live</Badge>
                    <Button onClick={() => deleteAd(a.id)} size="icon" variant="ghost" className="text-red-500"><Trash2 className="h-4 w-4" /></Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="site" className="mt-4">
          <AdminSiteSettings token={token} />
        </TabsContent>

        <TabsContent value="ops" className="mt-4">
          <AdminOpsManagement token={token} />
        </TabsContent>
      </Tabs>

      {showJobDialog && <JobPostDialog token={token} onClose={(refresh) => { setShowJobDialog(false); if (refresh) load() }} />}
    </div>
  )
}

// ============ STATE PAGE ============

const AnalyticsPanel = ({ token }) => {
  const [data, setData] = useState(null)
  useEffect(() => {
    fetch(`${API}/analytics`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()).then(setData)
  }, [])
  if (!data) return <Skeleton className="h-96 w-full bg-zinc-900" />
  const COLORS = ['#dc2626', '#f59e0b', '#10b981', '#3b82f6', '#a855f7', '#ec4899', '#06b6d4', '#f97316']
  return (
    <div className="space-y-5">
      <Card className="bg-zinc-950 border-zinc-800">
        <CardHeader><CardTitle className="text-white flex items-center gap-2"><BarChart3 className="h-5 w-5 text-red-500" /> News Timeline (Last 7 Days)</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={data.timeline}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
              <XAxis dataKey="date" stroke="#a1a1aa" />
              <YAxis stroke="#a1a1aa" />
              <Tooltip contentStyle={{ background: '#09090b', border: '1px solid #27272a' }} />
              <Legend />
              <Line type="monotone" dataKey="news" stroke="#dc2626" strokeWidth={3} />
              <Line type="monotone" dataKey="views" stroke="#f59e0b" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Card className="bg-zinc-950 border-zinc-800">
          <CardHeader><CardTitle className="text-white">News by Category</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={data.byCategory} dataKey="count" nameKey="category" outerRadius={80} label>
                  {data.byCategory.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: '#09090b', border: '1px solid #27272a' }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-zinc-950 border-zinc-800">
          <CardHeader><CardTitle className="text-white">Top States by News</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={data.byState}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis dataKey="state" stroke="#a1a1aa" angle={-20} height={60} textAnchor="end" />
                <YAxis stroke="#a1a1aa" />
                <Tooltip contentStyle={{ background: '#09090b', border: '1px solid #27272a' }} />
                <Bar dataKey="count" fill="#dc2626" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-zinc-950 border-zinc-800">
        <CardHeader><CardTitle className="text-white flex items-center gap-2"><Award className="h-5 w-5 text-yellow-500" /> Top Reporters</CardTitle></CardHeader>
        <CardContent>
          {data.topReporters.map((r, i) => (
            <div key={i} className="flex items-center justify-between py-2 border-b border-zinc-800 last:border-0">
              <div className="flex items-center gap-3">
                <span className="text-xl font-black text-zinc-500 w-8">#{i + 1}</span>
                <Avatar className="h-8 w-8 border border-red-600"><AvatarFallback className="bg-red-700 text-xs">{r.name?.[0]}</AvatarFallback></Avatar>
                <span className="font-semibold text-white">{r.name}</span>
              </div>
              <div className="text-right">
                <p className="text-sm text-white font-bold">{r.news} news</p>
                <p className="text-xs text-zinc-500">{r.views?.toLocaleString()} views</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

// ============ JOB POST CREATE DIALOG (Admin) ============

const JobPostDialog = ({ token, onClose }) => {
  const [form, setForm] = useState({ name: '', joiningFee: 500, levelType: 'state', state: '', district: '', city: '', totalVacancy: 1, description: '', responsibilities: [] })
  const [respInput, setRespInput] = useState('')
  const [states, setStates] = useState([])
  const [submitting, setSubmitting] = useState(false)
  useEffect(() => { fetch(`${API}/states`).then(r => r.json()).then(d => setStates(d.states || [])) }, [])
  const districts = states.find(s => s.name === form.state)?.districts || []

  const addResp = () => {
    if (!respInput.trim()) return
    setForm({ ...form, responsibilities: [...form.responsibilities, respInput.trim()] })
    setRespInput('')
  }
  const submit = async () => {
    if (!form.name || !form.levelType) return toast.error('Name & Level required')
    setSubmitting(true)
    const r = await fetch(`${API}/posts`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(form)
    }).then(r => r.json())
    setSubmitting(false)
    if (r.post) { toast.success('Job post created!'); onClose(true) } else toast.error(r.error || 'Failed')
  }
  return (
    <Dialog open onOpenChange={() => onClose(false)}>
      <DialogContent className="max-w-2xl bg-zinc-950 border-zinc-800 text-white max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle className="flex items-center gap-2"><Award className="h-5 w-5 text-yellow-500" /> Create Recruitment Post</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <Input placeholder="Post Name (e.g. State Coordinator)" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="bg-zinc-900 border-zinc-800 text-white" />
          <div className="grid grid-cols-2 gap-2">
            <Input type="number" placeholder="Joining Fees (₹)" value={form.joiningFee} onChange={e => setForm({ ...form, joiningFee: e.target.value })} className="bg-zinc-900 border-zinc-800 text-white" />
            <Input type="number" placeholder="Total Vacancies" value={form.totalVacancy} onChange={e => setForm({ ...form, totalVacancy: e.target.value })} className="bg-zinc-900 border-zinc-800 text-white" />
          </div>
          <div>
            <p className="text-xs text-zinc-400 mb-1">Level Type</p>
            <div className="grid grid-cols-3 gap-2">
              {['state', 'district', 'city'].map(lt => (
                <Button key={lt} onClick={() => setForm({ ...form, levelType: lt, state: '', district: '', city: '' })} className={`capitalize ${form.levelType === lt ? 'bg-red-600 hover:bg-red-700' : 'bg-zinc-900 hover:bg-zinc-800'}`}>{lt} Level</Button>
              ))}
            </div>
          </div>
          {['state', 'district', 'city'].includes(form.levelType) && (
            <Select value={form.state} onValueChange={v => setForm({ ...form, state: v, district: '', city: '' })}>
              <SelectTrigger className="bg-zinc-900 border-zinc-800"><SelectValue placeholder="Select State *" /></SelectTrigger>
              <SelectContent className="bg-zinc-950 border-zinc-800 text-white">
                {states.map(s => <SelectItem key={s.name} value={s.name}>{s.name}</SelectItem>)}
              </SelectContent>
            </Select>
          )}
          {(form.levelType === 'district' || form.levelType === 'city') && form.state && (
            <Select value={form.district} onValueChange={v => setForm({ ...form, district: v, city: '' })}>
              <SelectTrigger className="bg-zinc-900 border-zinc-800"><SelectValue placeholder="Select District *" /></SelectTrigger>
              <SelectContent className="bg-zinc-950 border-zinc-800 text-white">
                {districts.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
              </SelectContent>
            </Select>
          )}
          {form.levelType === 'city' && form.district && (
            <Input placeholder="City Name *" value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} className="bg-zinc-900 border-zinc-800 text-white" />
          )}
          <Textarea placeholder="Post Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="bg-zinc-900 border-zinc-800 text-white" rows={3} />
          <div>
            <p className="text-xs text-zinc-400 mb-1">Responsibilities (add multiple)</p>
            <div className="flex gap-2">
              <Input placeholder="e.g. Crime reporting" value={respInput} onChange={e => setRespInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addResp())} className="bg-zinc-900 border-zinc-800 text-white" />
              <Button onClick={addResp} className="bg-red-600 hover:bg-red-700"><Plus className="h-4 w-4" /></Button>
            </div>
            <div className="space-y-1 mt-2">
              {form.responsibilities.map((r, i) => (
                <div key={i} className="flex items-center justify-between bg-zinc-900 px-2 py-1 rounded text-sm">
                  <span className="text-zinc-300">• {r}</span>
                  <button onClick={() => setForm({ ...form, responsibilities: form.responsibilities.filter((_, j) => j !== i) })} className="text-red-500"><X className="h-3 w-3" /></button>
                </div>
              ))}
            </div>
          </div>
          <Button onClick={submit} disabled={submitting} className="w-full bg-red-600 hover:bg-red-700">
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create Post'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ============ JOBS / CAREERS PAGE (Public) ============

// ============ APP ============
const App = () => {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)

  useEffect(() => {
    const t = localStorage.getItem('icn_token')
    const u = localStorage.getItem('icn_user')
    if (t && u) {
      const parsedUser = JSON.parse(u)
      if (parsedUser.role === 'admin') {
        setToken(t)
        setUser(parsedUser)
      }
    }
    refreshSiteIdentity()
  }, [])

  const onLogin = (u) => {
    setUser(u)
    setToken(localStorage.getItem('icn_token'))
    refreshSiteIdentity()
  }

  const onLogout = () => {
    localStorage.removeItem('icn_token')
    localStorage.removeItem('icn_user')
    setUser(null)
    setToken(null)
    toast.info('Logged out')
  }

  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-black">
        <Header />
        <LoginForm onLogin={onLogin} />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black">
      <Header user={user} onLogout={onLogout} />
      <AdminPanel token={token} user={user} />
    </div>
  )
}

export default App
