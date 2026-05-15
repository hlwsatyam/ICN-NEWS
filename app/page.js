'use client'

import { useEffect, useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { ScrollArea } from '@/components/ui/scroll-area'
import { toast } from 'sonner'
import {
  Newspaper, Sparkles, TrendingUp, Eye, Share2, Bell, Search, LogIn, LogOut,
  UserPlus, LayoutDashboard, Shield, Flame, Clock, MapPin, Send, Loader2,
  CheckCircle2, XCircle, Trash2, Plus, Radio, Image as ImageIcon, Menu, X,
  ArrowLeft, Wallet, FileText, Award, Bike, IdCard, Cloud
} from 'lucide-react'

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

// ============ LOGO ============
const Logo = ({ size = 'md' }) => {
  const s = size === 'lg' ? 'h-12 w-12 text-2xl' : 'h-10 w-10 text-xl'
  return (
    <div className="flex items-center gap-2">
      <div className={`${s} bg-gradient-to-br from-red-600 to-red-800 rounded-lg flex items-center justify-center font-black text-white shadow-lg shadow-red-900/50`}>
        ICN
      </div>
      <div className="flex flex-col leading-tight">
        <span className="font-black text-base md:text-lg text-white">Indian Crime News</span>
        <span className="text-[10px] md:text-xs text-red-500 font-bold tracking-wide">सच्चाई की आवाज़</span>
      </div>
    </div>
  )
}

// ============ HEADER ============
const Header = ({ user, onLogout, onNav, view }) => {
  const [time, setTime] = useState(new Date())
  const [menuOpen, setMenuOpen] = useState(false)
  useEffect(() => { const t = setInterval(() => setTime(new Date()), 1000); return () => clearInterval(t) }, [])

  return (
    <header className="sticky top-0 z-50 bg-black/95 backdrop-blur-xl border-b border-red-900/50">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
        <button onClick={() => onNav('home')} className="flex-shrink-0">
          <Logo />
        </button>

        <div className="hidden md:flex items-center gap-1 text-xs">
          <Badge variant="destructive" className="bg-red-600 animate-pulse gap-1 px-2 py-1">
            <Radio className="h-3 w-3" /> LIVE
          </Badge>
          <span className="text-zinc-400 ml-2 flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {time.toLocaleTimeString('en-IN', { hour12: true })}
          </span>
          <span className="text-zinc-500 mx-1">•</span>
          <span className="text-zinc-400 flex items-center gap-1"><Cloud className="h-3 w-3" /> 32°C Delhi</span>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="text-white hover:bg-red-950 relative">
            <Bell className="h-5 w-5" />
            <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full animate-ping" />
          </Button>
          {user ? (
            <>
              {user.role === 'admin' && (
                <Button onClick={() => onNav('admin')} variant="ghost" size="sm" className="hidden md:flex text-white hover:bg-red-950">
                  <Shield className="h-4 w-4 mr-1" /> Admin
                </Button>
              )}
              <Button onClick={() => onNav('dashboard')} variant="ghost" size="sm" className="hidden md:flex text-white hover:bg-red-950">
                <LayoutDashboard className="h-4 w-4 mr-1" /> Dashboard
              </Button>
              <Avatar className="h-9 w-9 border-2 border-red-600 cursor-pointer" onClick={() => onNav('dashboard')}>
                <AvatarImage src={user.photo} />
                <AvatarFallback className="bg-red-700 text-white text-xs">{user.name?.[0]}</AvatarFallback>
              </Avatar>
              <Button onClick={onLogout} variant="ghost" size="icon" className="text-white hover:bg-red-950">
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <>
              <Button onClick={() => onNav('login')} variant="ghost" size="sm" className="text-white hover:bg-red-950">
                <LogIn className="h-4 w-4 mr-1" /> Login
              </Button>
              <Button onClick={() => onNav('join')} size="sm" className="bg-red-600 hover:bg-red-700 shadow-lg shadow-red-900/50">
                <UserPlus className="h-4 w-4 mr-1" /> Join Now
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  )
}

// ============ BREAKING TICKER ============
const BreakingTicker = ({ items }) => {
  if (!items?.length) return null
  return (
    <div className="bg-gradient-to-r from-red-700 via-red-600 to-red-700 border-y border-red-900 overflow-hidden">
      <div className="max-w-7xl mx-auto flex items-center">
        <div className="bg-black text-red-500 font-black px-4 py-2 text-sm flex items-center gap-2 flex-shrink-0">
          <Flame className="h-4 w-4 animate-pulse" /> BREAKING
        </div>
        <div className="relative flex-1 overflow-hidden h-10">
          <div className="absolute inset-0 flex items-center animate-marquee whitespace-nowrap">
            {[...items, ...items].map((b, i) => (
              <span key={i} className="text-white font-semibold text-sm mx-8 inline-flex items-center">
                <span className="h-2 w-2 bg-yellow-300 rounded-full mr-3 animate-pulse" />
                {b.text}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ============ NEWS CARD ============
const NewsCard = ({ news, onClick, featured }) => {
  const cat = news.category || 'crime'
  return (
    <Card
      onClick={() => onClick(news)}
      className={`group bg-zinc-950 border-zinc-800 hover:border-red-600/70 transition-all duration-300 cursor-pointer overflow-hidden hover:shadow-2xl hover:shadow-red-950/40 hover:-translate-y-1 ${featured ? 'md:col-span-2' : ''}`}
    >
      <div className={`relative overflow-hidden ${featured ? 'h-72 md:h-96' : 'h-52'}`}>
        {news.images?.[0] ? (
          <img src={news.images[0]} alt={news.headline} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" loading="lazy" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-red-950 to-black flex items-center justify-center">
            <Newspaper className="h-16 w-16 text-red-800/50" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
        <div className="absolute top-3 left-3 flex gap-2">
          <Badge className="bg-red-600 hover:bg-red-700 capitalize font-bold">{cat}</Badge>
          {news.trending && <Badge className="bg-orange-600 gap-1"><TrendingUp className="h-3 w-3" /> Trending</Badge>}
        </div>
        <div className="absolute bottom-3 left-3 right-3 flex items-center gap-1.5 text-xs text-white/90">
          <MapPin className="h-3 w-3 text-red-400" />
          <span className="font-medium">{news.state}</span>
          {news.district && <><span className="text-white/40">›</span><span>{news.district}</span></>}
        </div>
      </div>
      <CardContent className="p-4 space-y-3">
        <h3 className={`font-black text-white leading-tight line-clamp-3 group-hover:text-red-400 transition-colors ${featured ? 'text-xl md:text-2xl' : 'text-base'}`}>
          {news.headline}
        </h3>
        {news.summary && <p className="text-sm text-zinc-400 line-clamp-2">{news.summary}</p>}
        <div className="flex items-center justify-between pt-2 border-t border-zinc-800">
          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6 border border-red-600/50">
              <AvatarImage src={news.reporterPhoto} />
              <AvatarFallback className="bg-red-700 text-[10px]">{news.reporterName?.[0]}</AvatarFallback>
            </Avatar>
            <span className="text-xs text-zinc-300 font-medium">{news.reporterName}</span>
          </div>
          <div className="flex items-center gap-3 text-xs text-zinc-500">
            <span className="flex items-center gap-1"><Eye className="h-3 w-3" /> {(news.views || 0).toLocaleString()}</span>
            <span>{fmtTime(news.createdAt)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

const SkeletonCard = () => (
  <Card className="bg-zinc-950 border-zinc-800 overflow-hidden">
    <Skeleton className="h-52 w-full bg-zinc-900" />
    <CardContent className="p-4 space-y-3">
      <Skeleton className="h-5 w-full bg-zinc-900" />
      <Skeleton className="h-5 w-3/4 bg-zinc-900" />
      <Skeleton className="h-4 w-1/2 bg-zinc-900" />
    </CardContent>
  </Card>
)

// ============ HOME FEED ============
const HomeFeed = ({ onArticle }) => {
  const [news, setNews] = useState([])
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [loading, setLoading] = useState(false)
  const [category, setCategory] = useState('')
  const [stateFilter, setStateFilter] = useState('')
  const [categories, setCategories] = useState([])
  const [states, setStates] = useState([])
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetch(`${API}/categories`).then(r => r.json()).then(d => setCategories(d.categories || []))
    fetch(`${API}/states`).then(r => r.json()).then(d => setStates(d.states || []))
  }, [])

  const loadNews = async (p = 1, reset = false) => {
    setLoading(true)
    const params = new URLSearchParams()
    params.set('page', p)
    params.set('limit', '8')
    if (category) params.set('category', category)
    if (stateFilter) params.set('state', stateFilter)
    if (search) params.set('q', search)
    const r = await fetch(`${API}/news?${params}`).then(r => r.json())
    setNews(reset ? r.news : [...news, ...r.news])
    setHasMore(r.hasMore)
    setLoading(false)
  }

  useEffect(() => { setPage(1); loadNews(1, true) }, [category, stateFilter, search])

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Filter Bar */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
          <Input
            placeholder="Search news, locations, categories..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-zinc-950 border-zinc-800 text-white"
          />
        </div>
        <Select value={category || 'all'} onValueChange={(v) => setCategory(v === 'all' ? '' : v)}>
          <SelectTrigger className="w-[160px] bg-zinc-950 border-zinc-800 text-white"><SelectValue placeholder="Category" /></SelectTrigger>
          <SelectContent className="bg-zinc-950 border-zinc-800 text-white">
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map(c => <SelectItem key={c.key} value={c.key}>{c.emoji} {c.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={stateFilter || 'all'} onValueChange={(v) => setStateFilter(v === 'all' ? '' : v)}>
          <SelectTrigger className="w-[160px] bg-zinc-950 border-zinc-800 text-white"><SelectValue placeholder="State" /></SelectTrigger>
          <SelectContent className="bg-zinc-950 border-zinc-800 text-white">
            <SelectItem value="all">All States</SelectItem>
            {states.map(s => <SelectItem key={s.name} value={s.name}>{s.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Section Title */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl md:text-3xl font-black text-white flex items-center gap-2">
          <Flame className="h-6 w-6 text-red-500" /> Latest Crime News
        </h2>
        <span className="text-xs text-zinc-500">Live Feed • Auto-Updated</span>
      </div>

      {/* News Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {news.map((n, i) => <NewsCard key={n.id} news={n} onClick={onArticle} featured={i === 0 && page === 1} />)}
        {loading && Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
      </div>

      {!loading && news.length === 0 && (
        <div className="text-center py-20 text-zinc-500">
          <Newspaper className="h-16 w-16 mx-auto mb-3 opacity-30" />
          <p>No news found. Try changing filters.</p>
        </div>
      )}

      {hasMore && !loading && news.length > 0 && (
        <div className="flex justify-center mt-8">
          <Button onClick={() => { const p = page + 1; setPage(p); loadNews(p) }} size="lg" className="bg-red-600 hover:bg-red-700 shadow-xl shadow-red-900/50">
            Load More News <Plus className="h-4 w-4 ml-2" />
          </Button>
        </div>
      )}
    </div>
  )
}

// ============ ARTICLE VIEW ============
const ArticleView = ({ news, onBack }) => {
  useEffect(() => { fetch(`${API}/news/${news.id}`).catch(() => {}) }, [news.id])
  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <Button onClick={onBack} variant="ghost" className="mb-4 text-white hover:bg-red-950">
        <ArrowLeft className="h-4 w-4 mr-2" /> Back to Feed
      </Button>
      <article className="bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl">
        {news.images?.[0] && (
          <div className="relative h-72 md:h-[28rem]">
            <img src={news.images[0]} alt={news.headline} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
            <div className="absolute bottom-0 p-6 md:p-8 space-y-3">
              <div className="flex flex-wrap gap-2">
                <Badge className="bg-red-600 capitalize">{news.category}</Badge>
                <Badge variant="outline" className="text-white border-white/30 backdrop-blur-sm">
                  <MapPin className="h-3 w-3 mr-1" /> {news.state} › {news.district}
                </Badge>
              </div>
              <h1 className="text-2xl md:text-4xl font-black text-white leading-tight">{news.headline}</h1>
            </div>
          </div>
        )}
        <div className="p-6 md:p-8 space-y-6">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12 border-2 border-red-600">
                <AvatarImage src={news.reporterPhoto} />
                <AvatarFallback className="bg-red-700">{news.reporterName?.[0]}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-bold text-white">{news.reporterName}</p>
                <p className="text-xs text-zinc-500">Reporter • {fmtTime(news.createdAt)}</p>
              </div>
            </div>
            <div className="flex items-center gap-4 text-sm text-zinc-400">
              <span className="flex items-center gap-1"><Eye className="h-4 w-4" /> {(news.views || 0).toLocaleString()}</span>
              <Button size="sm" variant="ghost" className="text-zinc-400 hover:text-white"><Share2 className="h-4 w-4" /></Button>
            </div>
          </div>
          {news.summary && (
            <p className="text-lg text-zinc-300 font-medium leading-relaxed border-l-4 border-red-600 pl-4 italic">
              {news.summary}
            </p>
          )}
          <div className="prose prose-invert max-w-none text-zinc-200 whitespace-pre-wrap leading-relaxed text-base md:text-lg">
            {news.content}
          </div>
        </div>
      </article>
    </div>
  )
}

// ============ LOGIN ============
const LoginForm = ({ onLogin, onNav }) => {
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
    <div className="max-w-md mx-auto px-4 py-12">
      <Card className="bg-zinc-950 border-zinc-800 shadow-2xl shadow-red-950/30">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto"><Logo size="lg" /></div>
          <CardTitle className="text-white text-2xl">Login to Continue</CardTitle>
          <CardDescription className="text-zinc-400">Reporter / Admin login portal</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} className="bg-zinc-900 border-zinc-800 text-white" />
          <Input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} className="bg-zinc-900 border-zinc-800 text-white" />
          <Button onClick={submit} disabled={loading} className="w-full bg-red-600 hover:bg-red-700">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Login'}
          </Button>
          <div className="text-xs text-zinc-500 text-center space-y-1 pt-2 border-t border-zinc-800">
            <p className="font-semibold text-zinc-400">Demo Credentials:</p>
            <p>Admin: admin@icn.com / admin123</p>
            <p>Reporter: reporter@icn.com / reporter123</p>
          </div>
          <Button onClick={() => onNav('join')} variant="ghost" className="w-full text-zinc-400 hover:text-white">
            Don't have account? <span className="text-red-500 ml-1 font-semibold">Join Now</span>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

// ============ JOIN FORM ============
const JoinForm = ({ onLogin, onNav }) => {
  const [form, setForm] = useState({ name: '', email: '', password: '', mobile: '', state: '', district: '' })
  const [states, setStates] = useState([])
  const [loading, setLoading] = useState(false)
  const [registered, setRegistered] = useState(null)

  useEffect(() => { fetch(`${API}/states`).then(r => r.json()).then(d => setStates(d.states || [])) }, [])
  const districts = states.find(s => s.name === form.state)?.districts || []

  const submit = async () => {
    if (!form.name || !form.email || !form.password) { toast.error('Please fill all fields'); return }
    setLoading(true)
    const r = await fetch(`${API}/auth/register`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, role: 'reporter' })
    }).then(r => r.json())
    setLoading(false)
    if (r.token) {
      localStorage.setItem('icn_token', r.token)
      localStorage.setItem('icn_user', JSON.stringify(r.user))
      setRegistered(r.user)
      toast.success('Account created! Complete payment to activate.')
    } else {
      toast.error(r.error || 'Registration failed')
    }
  }

  const payNow = async () => {
    const order = await fetch(`${API}/payment/create-order`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: 500 })
    }).then(r => r.json())

    if (order.error) {
      toast.error('Payment gateway not configured. Skipping payment for demo.')
      onLogin(registered)
      return
    }

    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.onload = () => {
      const rzp = new window.Razorpay({
        key: order.keyId,
        amount: order.amount,
        currency: 'INR',
        name: 'Indian Crime News',
        description: 'Reporter Joining Fee',
        order_id: order.orderId,
        handler: async (resp) => {
          await fetch(`${API}/payment/verify`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...resp, userId: registered.id })
          })
          toast.success('Payment successful! Welcome aboard.')
          onLogin(registered)
        },
        theme: { color: '#dc2626' },
        prefill: { name: registered.name, email: registered.email, contact: registered.mobile }
      })
      rzp.open()
    }
    document.body.appendChild(script)
  }

  if (registered) {
    return (
      <div className="max-w-md mx-auto px-4 py-12">
        <Card className="bg-zinc-950 border-zinc-800 shadow-2xl shadow-red-950/30">
          <CardHeader className="text-center">
            <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-2" />
            <CardTitle className="text-white text-2xl">Almost There!</CardTitle>
            <CardDescription className="text-zinc-400">
              Complete payment of ₹500 to activate your reporter account
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-zinc-900 rounded-lg p-4 space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-zinc-400">Name:</span><span className="text-white font-semibold">{registered.name}</span></div>
              <div className="flex justify-between"><span className="text-zinc-400">Email:</span><span className="text-white">{registered.email}</span></div>
              <div className="flex justify-between"><span className="text-zinc-400">Referral Code:</span><span className="text-red-500 font-mono">{registered.referralCode}</span></div>
              <div className="flex justify-between border-t border-zinc-800 pt-2 mt-2"><span className="text-zinc-400">Joining Fee:</span><span className="text-white font-bold">₹500</span></div>
            </div>
            <Button onClick={payNow} className="w-full bg-red-600 hover:bg-red-700 shadow-lg shadow-red-900/50">
              Pay ₹500 with Razorpay
            </Button>
            <Button onClick={() => onLogin(registered)} variant="ghost" className="w-full text-zinc-400">
              Skip payment (demo) →
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <Card className="bg-zinc-950 border-zinc-800 shadow-2xl shadow-red-950/30">
        <CardHeader className="text-center">
          <div className="mx-auto"><Logo size="lg" /></div>
          <CardTitle className="text-white text-2xl mt-2">Become a Reporter</CardTitle>
          <CardDescription className="text-zinc-400">Join India's biggest crime news network</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input placeholder="Full Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="bg-zinc-900 border-zinc-800 text-white" />
          <Input type="email" placeholder="Email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="bg-zinc-900 border-zinc-800 text-white" />
          <Input type="password" placeholder="Password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} className="bg-zinc-900 border-zinc-800 text-white" />
          <Input placeholder="Mobile Number" value={form.mobile} onChange={e => setForm({ ...form, mobile: e.target.value })} className="bg-zinc-900 border-zinc-800 text-white" />
          <Select value={form.state} onValueChange={(v) => setForm({ ...form, state: v, district: '' })}>
            <SelectTrigger className="bg-zinc-900 border-zinc-800 text-white"><SelectValue placeholder="Select State" /></SelectTrigger>
            <SelectContent className="bg-zinc-950 border-zinc-800 text-white">
              {states.map(s => <SelectItem key={s.name} value={s.name}>{s.name}</SelectItem>)}
            </SelectContent>
          </Select>
          {form.state && (
            <Select value={form.district} onValueChange={(v) => setForm({ ...form, district: v })}>
              <SelectTrigger className="bg-zinc-900 border-zinc-800 text-white"><SelectValue placeholder="Select District" /></SelectTrigger>
              <SelectContent className="bg-zinc-950 border-zinc-800 text-white">
                {districts.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
              </SelectContent>
            </Select>
          )}
          <Button onClick={submit} disabled={loading} className="w-full bg-red-600 hover:bg-red-700">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Register & Continue'}
          </Button>
          <Button onClick={() => onNav('login')} variant="ghost" className="w-full text-zinc-400">
            Already have account? <span className="text-red-500 ml-1 font-semibold">Login</span>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

// ============ DASHBOARD ============
const Dashboard = ({ user, token }) => {
  const [stats, setStats] = useState({})
  const [myNews, setMyNews] = useState([])
  const [creating, setCreating] = useState(false)

  const loadData = async () => {
    const [s, n] = await Promise.all([
      fetch(`${API}/stats`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
      fetch(`${API}/news?status=all&reporterId=${user.id}`).then(r => r.json())
    ])
    setStats(s)
    setMyNews(n.news || [])
  }
  useEffect(() => { loadData() }, [])

  const downloads = [
    { name: 'Press ID Card', icon: IdCard, color: 'from-red-600 to-red-800' },
    { name: 'Joining Letter', icon: FileText, color: 'from-blue-600 to-blue-800' },
    { name: 'Certificate', icon: Award, color: 'from-yellow-600 to-yellow-800' },
    { name: 'Social Media DP', icon: ImageIcon, color: 'from-purple-600 to-purple-800' },
    { name: 'Bike Sticker', icon: Bike, color: 'from-green-600 to-green-800' },
    { name: 'Press Sticker', icon: Shield, color: 'from-pink-600 to-pink-800' }
  ]

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* Profile Card */}
      <Card className="bg-gradient-to-r from-red-950/40 via-zinc-950 to-zinc-950 border-red-900/50">
        <CardContent className="p-6 flex items-center gap-4">
          <Avatar className="h-20 w-20 border-4 border-red-600 shadow-xl shadow-red-900/50">
            <AvatarImage src={user.photo} />
            <AvatarFallback className="bg-red-700 text-2xl">{user.name?.[0]}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h2 className="text-2xl font-black text-white">{user.name}</h2>
            <p className="text-zinc-400 text-sm">{user.designation || 'Reporter'} • {user.state} › {user.district}</p>
            <div className="flex flex-wrap gap-2 mt-2">
              <Badge className="bg-red-600 capitalize">{user.role}</Badge>
              <Badge variant="outline" className="text-zinc-300 border-zinc-700">📱 {user.mobile || 'No mobile'}</Badge>
              <Badge variant="outline" className="text-zinc-300 border-zinc-700">🎫 {user.referralCode}</Badge>
            </div>
          </div>
          <Button onClick={() => setCreating(true)} className="bg-red-600 hover:bg-red-700 shadow-lg shadow-red-900/50">
            <Plus className="h-4 w-4 mr-1" /> Publish News
          </Button>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total News', value: stats.total || 0, icon: Newspaper, color: 'text-blue-500' },
          { label: 'Approved', value: stats.approved || 0, icon: CheckCircle2, color: 'text-green-500' },
          { label: 'Pending', value: stats.pending || 0, icon: Clock, color: 'text-yellow-500' },
          { label: 'Total Views', value: (stats.totalViews || 0).toLocaleString(), icon: Eye, color: 'text-red-500' }
        ].map(s => (
          <Card key={s.label} className="bg-zinc-950 border-zinc-800">
            <CardContent className="p-4">
              <s.icon className={`h-6 w-6 ${s.color} mb-2`} />
              <p className="text-xs text-zinc-500 uppercase tracking-wider">{s.label}</p>
              <p className="text-2xl font-black text-white">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Income Wallet */}
      <Card className="bg-gradient-to-br from-green-950/40 to-zinc-950 border-green-900/40">
        <CardContent className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Wallet className="h-10 w-10 text-green-500" />
            <div>
              <p className="text-xs text-zinc-400 uppercase tracking-wider">Wallet Balance</p>
              <p className="text-3xl font-black text-white">₹{(user.walletBalance || 0).toLocaleString()}</p>
            </div>
          </div>
          <div className="text-right text-xs text-zinc-500 space-y-1">
            <p>Ad Income: ₹{Math.floor((user.walletBalance || 0) * 0.6).toLocaleString()}</p>
            <p>Referral: ₹{Math.floor((user.walletBalance || 0) * 0.3).toLocaleString()}</p>
            <p>Joining: ₹{Math.floor((user.walletBalance || 0) * 0.1).toLocaleString()}</p>
          </div>
        </CardContent>
      </Card>

      {/* Download Center */}
      <div>
        <h3 className="text-xl font-black text-white mb-3 flex items-center gap-2">
          <FileText className="h-5 w-5 text-red-500" /> Download Center
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {downloads.map(d => (
            <button key={d.name} onClick={() => toast.info(`${d.name} download coming soon!`)} className={`bg-gradient-to-br ${d.color} rounded-xl p-4 text-left hover:scale-105 transition-transform shadow-lg`}>
              <d.icon className="h-6 w-6 text-white mb-2" />
              <p className="font-bold text-white text-sm">{d.name}</p>
              <p className="text-xs text-white/70">Tap to download</p>
            </button>
          ))}
        </div>
      </div>

      {/* My News */}
      <div>
        <h3 className="text-xl font-black text-white mb-3">My News Articles</h3>
        <div className="space-y-2">
          {myNews.length === 0 && <p className="text-zinc-500 text-sm">No news published yet. Click "Publish News" to start.</p>}
          {myNews.map(n => (
            <Card key={n.id} className="bg-zinc-950 border-zinc-800">
              <CardContent className="p-3 flex items-center gap-3">
                {n.images?.[0] && <img src={n.images[0]} className="h-14 w-20 object-cover rounded" />}
                <div className="flex-1 min-w-0">
                  <p className="text-white font-semibold text-sm line-clamp-1">{n.headline}</p>
                  <p className="text-xs text-zinc-500">{n.state} • {fmtTime(n.createdAt)} • {(n.views||0).toLocaleString()} views</p>
                </div>
                <Badge className={n.status === 'approved' ? 'bg-green-700' : n.status === 'pending' ? 'bg-yellow-700' : 'bg-red-700'}>
                  {n.status}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {creating && <NewsEditor token={token} user={user} onClose={() => { setCreating(false); loadData() }} />}
    </div>
  )
}

// ============ NEWS EDITOR (with AI) ============
const NewsEditor = ({ token, user, onClose }) => {
  const [form, setForm] = useState({
    headline: '', summary: '', content: '', category: '', state: user.state || '', district: user.district || '',
    images: [], metaTitle: '', metaDescription: ''
  })
  const [aiLoading, setAiLoading] = useState(false)
  const [seoLoading, setSeoLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [categories, setCategories] = useState([])
  const [states, setStates] = useState([])
  const fileRef = useRef()

  useEffect(() => {
    fetch(`${API}/categories`).then(r => r.json()).then(d => setCategories(d.categories || []))
    fetch(`${API}/states`).then(r => r.json()).then(d => setStates(d.states || []))
  }, [])
  const districts = states.find(s => s.name === form.state)?.districts || []

  const generateHeadline = async () => {
    if (!form.content) { toast.error('Write some content first to use AI'); return }
    setAiLoading(true)
    const r = await fetch(`${API}/ai/generate-headline`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: form.content, state: form.state, district: form.district, category: form.category })
    }).then(r => r.json())
    setAiLoading(false)
    if (r.headline) { setForm({ ...form, headline: r.headline }); toast.success('AI headline generated!') }
    else toast.error('AI failed')
  }

  const generateSEO = async () => {
    if (!form.headline || !form.content) { toast.error('Need headline and content'); return }
    setSeoLoading(true)
    const r = await fetch(`${API}/ai/generate-meta`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ headline: form.headline, content: form.content })
    }).then(r => r.json())
    setSeoLoading(false)
    setForm({ ...form, metaTitle: r.metaTitle || form.headline, metaDescription: r.metaDescription || form.summary })
    toast.success('SEO meta generated!')
  }

  const handleImage = async (e) => {
    const files = Array.from(e.target.files).slice(0, 5)
    const urls = await Promise.all(files.map(f => new Promise(res => {
      const reader = new FileReader()
      reader.onload = () => res(reader.result)
      reader.readAsDataURL(f)
    })))
    setForm({ ...form, images: [...form.images, ...urls].slice(0, 5) })
  }

  const submit = async () => {
    if (!form.headline || !form.content || !form.state || !form.category) { toast.error('Fill all required fields'); return }
    setSubmitting(true)
    const r = await fetch(`${API}/news`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(form)
    }).then(r => r.json())
    setSubmitting(false)
    if (r.news) { toast.success(user.role === 'admin' ? 'Published!' : 'Submitted for review!'); onClose() }
    else toast.error(r.error || 'Failed')
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-3xl bg-zinc-950 border-zinc-800 text-white max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black flex items-center gap-2">
            <Newspaper className="h-6 w-6 text-red-500" /> Publish News
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-semibold mb-1 flex items-center justify-between">
              <span>News Content <span className="text-red-500">*</span></span>
              <span className="text-xs text-zinc-500">Write your story first, then let AI write the headline</span>
            </label>
            <Textarea
              value={form.content}
              onChange={e => setForm({ ...form, content: e.target.value })}
              placeholder="Type or paste your full news content here (WhatsApp paste supported)..."
              className="bg-zinc-900 border-zinc-800 text-white min-h-[180px]"
            />
          </div>

          <div>
            <label className="text-sm font-semibold mb-1 flex items-center justify-between">
              <span>Headline <span className="text-red-500">*</span></span>
              <Button onClick={generateHeadline} disabled={aiLoading} size="sm" className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 h-7">
                {aiLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <><Sparkles className="h-3 w-3 mr-1" /> AI Generate</>}
              </Button>
            </label>
            <Input value={form.headline} onChange={e => setForm({ ...form, headline: e.target.value })} placeholder="Bilingual headline (Hindi + English)" className="bg-zinc-900 border-zinc-800 text-white text-base font-bold" />
          </div>

          <div>
            <label className="text-sm font-semibold mb-1 block">Summary (optional)</label>
            <Textarea value={form.summary} onChange={e => setForm({ ...form, summary: e.target.value })} placeholder="1-2 sentence summary" className="bg-zinc-900 border-zinc-800 text-white" rows={2} />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Select value={form.category} onValueChange={v => setForm({ ...form, category: v })}>
              <SelectTrigger className="bg-zinc-900 border-zinc-800"><SelectValue placeholder="Category *" /></SelectTrigger>
              <SelectContent className="bg-zinc-950 border-zinc-800 text-white">
                {categories.map(c => <SelectItem key={c.key} value={c.key}>{c.emoji} {c.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={form.state} onValueChange={v => setForm({ ...form, state: v, district: '' })}>
              <SelectTrigger className="bg-zinc-900 border-zinc-800"><SelectValue placeholder="State *" /></SelectTrigger>
              <SelectContent className="bg-zinc-950 border-zinc-800 text-white">
                {states.map(s => <SelectItem key={s.name} value={s.name}>{s.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={form.district} onValueChange={v => setForm({ ...form, district: v })}>
              <SelectTrigger className="bg-zinc-900 border-zinc-800"><SelectValue placeholder="District" /></SelectTrigger>
              <SelectContent className="bg-zinc-950 border-zinc-800 text-white">
                {districts.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-semibold mb-1 block">Images (up to 5)</label>
            <input ref={fileRef} type="file" accept="image/*" multiple onChange={handleImage} className="hidden" />
            <Button onClick={() => fileRef.current?.click()} variant="outline" className="border-zinc-800 text-white bg-zinc-900 hover:bg-zinc-800">
              <ImageIcon className="h-4 w-4 mr-2" /> Upload Images
            </Button>
            {form.images.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {form.images.map((src, i) => (
                  <div key={i} className="relative">
                    <img src={src} className="h-16 w-24 object-cover rounded border border-zinc-700" />
                    <button onClick={() => setForm({ ...form, images: form.images.filter((_, j) => j !== i) })} className="absolute -top-1 -right-1 bg-red-600 rounded-full p-0.5">
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="border-t border-zinc-800 pt-4">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-semibold">SEO Meta (auto-fill with AI)</label>
              <Button onClick={generateSEO} disabled={seoLoading} size="sm" className="bg-gradient-to-r from-blue-600 to-cyan-600 h-7">
                {seoLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <><Sparkles className="h-3 w-3 mr-1" /> AI SEO</>}
              </Button>
            </div>
            <Input value={form.metaTitle} onChange={e => setForm({ ...form, metaTitle: e.target.value })} placeholder="SEO Title" className="bg-zinc-900 border-zinc-800 text-white mb-2" />
            <Textarea value={form.metaDescription} onChange={e => setForm({ ...form, metaDescription: e.target.value })} placeholder="Meta Description" className="bg-zinc-900 border-zinc-800 text-white" rows={2} />
          </div>

          <div className="flex gap-3 pt-2">
            <Button onClick={onClose} variant="outline" className="flex-1 border-zinc-800 bg-zinc-900 text-white hover:bg-zinc-800">Cancel</Button>
            <Button onClick={submit} disabled={submitting} className="flex-1 bg-red-600 hover:bg-red-700">
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Send className="h-4 w-4 mr-2" /> Publish</>}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ============ ADMIN PANEL ============
const AdminPanel = ({ token, user }) => {
  const [pending, setPending] = useState([])
  const [stats, setStats] = useState({})
  const [breaking, setBreaking] = useState([])
  const [newBreak, setNewBreak] = useState('')

  const load = async () => {
    const [n, s, b] = await Promise.all([
      fetch(`${API}/news?status=pending`).then(r => r.json()),
      fetch(`${API}/stats`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
      fetch(`${API}/breaking`).then(r => r.json())
    ])
    setPending(n.news || [])
    setStats(s)
    setBreaking(b.breaking || [])
  }
  useEffect(() => { load() }, [])

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
        <TabsList className="bg-zinc-950 border border-zinc-800">
          <TabsTrigger value="pending" className="data-[state=active]:bg-red-600">Pending News ({pending.length})</TabsTrigger>
          <TabsTrigger value="breaking" className="data-[state=active]:bg-red-600">Breaking News</TabsTrigger>
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
      </Tabs>
    </div>
  )
}

// ============ MAIN APP ============
const App = () => {
  const [view, setView] = useState('home')
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)
  const [article, setArticle] = useState(null)
  const [breaking, setBreaking] = useState([])

  useEffect(() => {
    const t = localStorage.getItem('icn_token')
    const u = localStorage.getItem('icn_user')
    if (t && u) { setToken(t); setUser(JSON.parse(u)) }
    fetch(`${API}/breaking`).then(r => r.json()).then(d => setBreaking(d.breaking || []))
  }, [])

  const onLogin = (u) => {
    setUser(u)
    setToken(localStorage.getItem('icn_token'))
    setView(u.role === 'admin' ? 'admin' : 'dashboard')
  }
  const onLogout = () => {
    localStorage.removeItem('icn_token')
    localStorage.removeItem('icn_user')
    setUser(null); setToken(null); setView('home')
    toast.info('Logged out')
  }
  const onArticle = (n) => { setArticle(n); setView('article') }

  return (
    <div className="min-h-screen bg-black">
      <Header user={user} onLogout={onLogout} onNav={setView} view={view} />
      <BreakingTicker items={breaking} />

      {view === 'home' && <HomeFeed onArticle={onArticle} />}
      {view === 'article' && article && <ArticleView news={article} onBack={() => setView('home')} />}
      {view === 'login' && <LoginForm onLogin={onLogin} onNav={setView} />}
      {view === 'join' && <JoinForm onLogin={onLogin} onNav={setView} />}
      {view === 'dashboard' && user && <Dashboard user={user} token={token} />}
      {view === 'admin' && user?.role === 'admin' && <AdminPanel token={token} user={user} />}

      <footer className="mt-16 border-t border-zinc-900 bg-black py-8 px-4">
        <div className="max-w-7xl mx-auto text-center space-y-2">
          <Logo />
          <p className="text-zinc-500 text-sm mt-3">© 2025 Indian Crime News • सच्चाई की आवाज़</p>
          <p className="text-zinc-600 text-xs">India's biggest crime news network • AI-Powered Journalism</p>
        </div>
      </footer>
    </div>
  )
}

export default App
