'use client'

import { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import RichEditor from '@/components/RichEditor'
import IndiaLocationPicker from '@/components/IndiaLocation'
import { PressIDCard, SocialMediaDP } from '@/components/ICNewsCards'
import CommunitySections, { AdminSiteSettings } from '@/components/CommunitySections'
import ReporterQuickActions, { AdminOpsManagement } from '@/components/ReporterOps'
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
  ArrowLeft, Wallet, FileText, Award, Bike, IdCard, Cloud, Download,
  BarChart3, MessageCircle, Building2, Home, User, Heart, Play, AlertTriangle,
  CheckCheck, Facebook, Twitter, Instagram, Youtube, Camera, Megaphone, EyeOff, Star,
  ChevronLeft, ChevronRight, Pause, Maximize2
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

const fmtRemaining = (until) => {
  if (!until) return ''
  const diff = new Date(until).getTime() - Date.now()
  if (diff <= 0) return 'Expired'
  const h = Math.floor(diff / 3600000)
  const m = Math.floor((diff % 3600000) / 60000)
  return h > 0 ? `${h}h ${m}m left` : `${m}m left`
}

// Pay ₹499 to feature a news on homepage Top 10 for 24h
const featureNewsPayment = async (token, news, onSuccess) => {
  if (!news?.id) { toast.error('News not selected'); return }
  // 1. Pre-check slots
  const status = await fetch(`${API}/featured`).then(r => r.json()).catch(() => ({}))
  if (status?.full) { toast.error('All 10 featured slots are full. Try again later.'); return }

  // 2. Create order
  const order = await fetch(`${API}/featured/order`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ newsId: news.id })
  }).then(r => r.json())

  if (order.error) {
    // Demo fallback when Razorpay isn't configured (dev only)
    if ((order.error || '').toLowerCase().includes('razorpay not configured')) {
      const conf = window.confirm('Razorpay not configured. Activate featuring in DEMO mode (no payment)?')
      if (!conf) return
      const act = await fetch(`${API}/featured/activate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ newsId: news.id, demo: true })
      }).then(r => r.json())
      if (act.ok) { toast.success('Featured for 24 hours! (demo)'); onSuccess?.() }
      else toast.error(act.error || 'Activation failed')
      return
    }
    toast.error(order.error)
    return
  }

  // 3. Open Razorpay checkout
  const openRzp = () => {
    const rzp = new window.Razorpay({
      key: order.keyId,
      amount: order.amount,
      currency: 'INR',
      name: 'Indian Crime News',
      description: `Feature "${(news.headline || '').slice(0, 40)}" for 24h`,
      order_id: order.orderId,
      handler: async (response) => {
        const verify = await fetch(`${API}/featured/activate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
            newsId: news.id
          })
        }).then(r => r.json())
        if (verify.ok) { toast.success('🌟 News featured for 24 hours!'); onSuccess?.() }
        else toast.error(verify.error || 'Activation failed')
      },
      theme: { color: '#dc2626' }
    })
    rzp.open()
  }

  if (typeof window.Razorpay === 'undefined') {
    const s = document.createElement('script')
    s.src = 'https://checkout.razorpay.com/v1/checkout.js'
    s.onload = openRzp
    s.onerror = () => toast.error('Could not load payment SDK')
    document.head.appendChild(s)
  } else {
    openRzp()
  }
}

// ============ LOGO ============
// Global site identity (logo URL, site name, tagline) — fetched once at app boot
let _siteIdentity = { logo: '/branding/icn-logo.png', siteName: 'Indian Crime News', tagline: 'सच्चाई की आवाज़' }
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
      siteName: r.siteName || 'Indian Crime News',
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
          <Button onClick={() => onNav('jobs')} variant="ghost" size="sm" className="hidden md:flex text-white hover:bg-red-950">
            <Award className="h-4 w-4 mr-1" /> Careers
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
            </>
          )}
        </div>
      </div>
    </header>
  )
}

// ============ BREAKING TICKER (Sticky BOTTOM bar) ============
const BreakingTicker = ({ items }) => {
  if (!items?.length) return null
  return (
    <div className="fixed bottom-14 md:bottom-0 left-0 right-0 z-40 bg-gradient-to-r from-red-700 via-red-600 to-red-700 border-y border-red-900 overflow-hidden shadow-2xl shadow-red-900/50 pb-safe">
      <div className="max-w-7xl mx-auto flex items-center h-9 md:h-10">
        <div className="bg-black text-red-500 font-black px-3 md:px-4 h-full text-xs md:text-sm flex items-center gap-1.5 flex-shrink-0 border-r-2 border-red-700">
          <Flame className="h-3.5 w-3.5 animate-pulse" /> <span className="hidden sm:inline">BREAKING</span><span className="sm:hidden">LIVE</span>
        </div>
        <div className="relative flex-1 overflow-hidden h-full group" onMouseEnter={(e) => e.currentTarget.querySelector('.marquee')?.classList.add('paused')} onMouseLeave={(e) => e.currentTarget.querySelector('.marquee')?.classList.remove('paused')}>
          <div className="marquee absolute inset-0 flex items-center animate-marquee whitespace-nowrap">
            {[...items, ...items].map((b, i) => (
              <span key={i} className="text-white font-semibold text-xs md:text-sm mx-6 inline-flex items-center">
                <span className="h-1.5 w-1.5 bg-yellow-300 rounded-full mr-2 animate-pulse" />
                {b.text}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ============ MOBILE BOTTOM NAV ============
const MobileBottomNav = ({ view, onNav, user }) => {
  const items = [
    { key: 'home', icon: Home, label: 'Home' },
    { key: 'social', icon: Play, label: 'Reels' },
    { key: user ? 'publish' : 'join', icon: Plus, label: user ? 'Post' : 'Join', primary: true },
    { key: 'dashboard', icon: user ? LayoutDashboard : LogIn, label: user ? 'Dashboard' : 'Login' },
    { key: 'more', icon: User, label: 'Profile' }
  ]
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-xl border-t border-zinc-800 pb-safe">
      <div className="flex items-center justify-around h-14">
        {items.map(it => {
          const active = view === it.key
          if (it.primary) return (
            <button key={it.key} onClick={() => onNav(it.key === 'publish' ? 'publish' : it.key)} className="-mt-6 h-14 w-14 rounded-full bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center shadow-xl shadow-red-900/60 ring-4 ring-black">
              <it.icon className="h-6 w-6 text-white" />
            </button>
          )
          return (
            <button key={it.key} onClick={() => onNav(it.key === 'more' ? (user ? 'dashboard' : 'login') : it.key)} className={`flex flex-col items-center justify-center flex-1 h-full gap-0.5 ${active ? 'text-red-500' : 'text-zinc-500'}`}>
              <it.icon className="h-5 w-5" />
              <span className="text-[10px] font-medium">{it.label}</span>
            </button>
          )
        })}
      </div>
    </nav>
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

// ============ REPORTER INFO CARD (Article Bottom) ============
const ReporterInfoCard = ({ reporter, onFollow }) => {
  if (!reporter) return null
  return (
    <div className="mt-6 space-y-3">
      <div className="bg-yellow-950/30 border border-yellow-700/50 rounded-xl p-3 flex items-start gap-2">
        <AlertTriangle className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-yellow-200 font-medium">
          इस समाचार की सम्पूर्ण जिम्मेदारी संबंधित रिपोर्टर की होगी।
        </p>
      </div>
      <div className="backdrop-blur-xl bg-gradient-to-br from-zinc-900/80 to-zinc-950/80 border border-red-900/40 rounded-2xl p-5 shadow-2xl shadow-red-950/30">
        <div className="flex items-start gap-4">
          <div className="relative">
            <Avatar className="h-16 w-16 border-2 border-red-600 ring-2 ring-red-950">
              <AvatarImage src={reporter.photo} />
              <AvatarFallback className="bg-red-700 text-lg">{reporter.name?.[0]}</AvatarFallback>
            </Avatar>
            {reporter.verified && (
              <div className="absolute -bottom-1 -right-1 bg-blue-500 rounded-full p-0.5 border-2 border-zinc-900">
                <CheckCheck className="h-3 w-3 text-white" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="font-black text-white text-lg">{reporter.name}</h4>
              {reporter.verified && <Badge className="bg-blue-600 gap-1 text-xs"><CheckCheck className="h-3 w-3" /> Verified</Badge>}
            </div>
            <p className="text-sm text-zinc-400 mt-1">{reporter.designation || 'Reporter'} • {reporter.district}, {reporter.state}</p>
            {reporter.bio && <p className="text-xs text-zinc-500 mt-2 italic">"{reporter.bio}"</p>}
            <div className="flex flex-wrap gap-3 mt-3 text-xs text-zinc-400">
              <span className="flex items-center gap-1"><MessageCircle className="h-3 w-3" /> {reporter.mobile || '—'}</span>
              <span className="flex items-center gap-1">📧 {reporter.email || '—'}</span>
              <span className="flex items-center gap-1"><Newspaper className="h-3 w-3" /> {reporter.newsCount || 0} reports</span>
            </div>
            <div className="flex items-center gap-2 mt-3 flex-wrap">
              <Button onClick={onFollow} size="sm" className="bg-red-600 hover:bg-red-700"><Heart className="h-3 w-3 mr-1" /> Follow</Button>
              {reporter.social?.facebook && <a href={reporter.social.facebook} target="_blank" rel="noopener"><Button size="icon" variant="ghost" className="h-7 w-7 text-zinc-300 hover:text-blue-500"><Facebook className="h-4 w-4" /></Button></a>}
              {reporter.social?.twitter && <a href={reporter.social.twitter} target="_blank" rel="noopener"><Button size="icon" variant="ghost" className="h-7 w-7 text-zinc-300 hover:text-sky-400"><Twitter className="h-4 w-4" /></Button></a>}
              {reporter.social?.instagram && <a href={reporter.social.instagram} target="_blank" rel="noopener"><Button size="icon" variant="ghost" className="h-7 w-7 text-zinc-300 hover:text-pink-500"><Instagram className="h-4 w-4" /></Button></a>}
              {reporter.social?.youtube && <a href={reporter.social.youtube} target="_blank" rel="noopener"><Button size="icon" variant="ghost" className="h-7 w-7 text-zinc-300 hover:text-red-500"><Youtube className="h-4 w-4" /></Button></a>}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ============ ADVERTISEMENT COMPONENTS ============
const AdSlot = ({ slot = 'bottom', reporter, ads }) => {
  // Find an ad matching this slot OR placement === 'both'
  const ad = ads?.find(a => a.placement === slot || a.placement === 'both' || a.type === slot)
  const trackClick = () => { if (ad?.id) fetch(`${API}/ads/${ad.id}/click`, { method: 'POST' }) }
  const sizes = slot === 'bottom'
    ? 'h-32 md:h-44 max-w-[1200px]'
    : 'h-44 md:h-56 max-w-[900px]'

  if (ad) {
    const inner = (
      <div className={`relative w-full ${sizes} mx-auto rounded-xl overflow-hidden border border-zinc-800 hover:border-red-600 transition-colors shadow-xl group cursor-pointer`}>
        <img src={ad.banner} alt={ad.title || 'Ad'} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
        {ad.ctaText && (
          <div className="absolute bottom-3 right-3 bg-red-600 text-white text-xs px-3 py-1.5 rounded-full font-bold">{ad.ctaText} →</div>
        )}
        <div className="absolute top-2 left-2 bg-black/60 backdrop-blur text-yellow-400 text-[10px] px-2 py-0.5 rounded">Ad{ad.title ? ` • ${ad.title}` : ''}</div>
      </div>
    )
    return ad.link ? <a href={ad.link} target="_blank" rel="noopener noreferrer" onClick={trackClick}>{inner}</a> : inner
  }

  return (
    <div className={`relative w-full ${sizes} mx-auto rounded-xl border-2 border-dashed border-red-900/50 bg-gradient-to-br from-red-950/40 to-zinc-950 flex flex-col items-center justify-center text-center p-4 shadow-inner`}>
      <Megaphone className="h-8 w-8 md:h-10 md:w-10 text-red-500/70 mb-2" />
      <p className="text-white font-black text-base md:text-lg">विज्ञापन के लिए संपर्क करें</p>
      <p className="text-zinc-400 text-xs md:text-sm mt-1">For advertisement, contact:</p>
      <p className="text-red-400 font-semibold text-sm mt-1">{reporter?.name || 'Reporter'} {reporter?.mobile && `• ${reporter.mobile}`}</p>
      {reporter?.mobile && (
        <a href={`https://wa.me/91${reporter.mobile.replace(/\D/g, '').slice(-10)}?text=${encodeURIComponent('Hello, I want to place an advertisement on Indian Crime News.')}`} target="_blank" rel="noopener" className="mt-2">
          <Button size="sm" className="bg-green-600 hover:bg-green-700 h-7 text-xs"><MessageCircle className="h-3 w-3 mr-1" /> WhatsApp</Button>
        </a>
      )}
    </div>
  )
}

// ============ CITY REPORTER CHECK (Used in JoinForm) ============
const CityReporterCheck = ({ state, district }) => {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  useEffect(() => {
    if (!state || !district) { setData(null); return }
    setLoading(true)
    const t = setTimeout(() => {
      fetch(`${API}/reporters/by-city?state=${encodeURIComponent(state)}&district=${encodeURIComponent(district)}`)
        .then(r => r.json()).then(d => { setData(d); setLoading(false) })
    }, 400) // debounce
    return () => clearTimeout(t)
  }, [state, district])

  if (!state || !district) return null
  if (loading) return <div className="text-xs text-zinc-500 flex items-center gap-2"><Loader2 className="h-3 w-3 animate-spin" /> Checking reporters in {district}...</div>
  if (!data) return null

  if (data.canApply) {
    return (
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-green-950/30 border border-green-700 rounded-xl p-3 flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-green-600/30 flex items-center justify-center flex-shrink-0">
          <CheckCircle2 className="h-5 w-5 text-green-400" />
        </div>
        <div>
          <p className="text-green-400 font-bold text-sm">✅ Position Available!</p>
          <p className="text-xs text-zinc-400">No reporter in <span className="text-white">{district}</span> yet. You can apply!</p>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
      <div className="bg-yellow-950/30 border border-yellow-700 rounded-xl p-3 flex items-center gap-2">
        <AlertTriangle className="h-4 w-4 text-yellow-500 flex-shrink-0" />
        <p className="text-sm text-yellow-200">This city already has <strong>{data.totalInCity}</strong> active reporter{data.totalInCity > 1 ? 's' : ''}.</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto">
        {data.reporters.map((r, i) => (
          <motion.div key={r.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
            className="bg-zinc-900 border border-zinc-800 rounded-lg p-2 flex items-center gap-2">
            <Avatar className="h-9 w-9 border border-red-600">
              <AvatarImage src={r.photo} />
              <AvatarFallback className="bg-red-700 text-xs">{r.name?.[0]}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-white text-xs font-bold flex items-center gap-1 truncate">
                {r.name}
                {r.verified && <CheckCheck className="h-3 w-3 text-blue-500" />}
              </p>
              <p className="text-[10px] text-zinc-500">{r.mobile || '—'} • {r.newsCount} news</p>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}

// ============ SOCIAL FEED ============
const SocialFeed = () => {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  useEffect(() => { fetch(`${API}/social`).then(r => r.json()).then(d => { setPosts(d.posts || []); setLoading(false) }) }, [])
  const like = (id) => { fetch(`${API}/social/${id}/like`, { method: 'POST' }); setPosts(p => p.map(x => x.id === id ? { ...x, likes: (x.likes || 0) + 1 } : x)) }
  if (loading) return <div className="py-8 text-center text-zinc-500"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></div>
  if (!posts.length) return (
    <div className="py-12 text-center text-zinc-500">
      <Play className="h-12 w-12 mx-auto mb-2 opacity-30" />
      <p>No social videos yet. Reporters can submit YouTube/Instagram reels from their dashboard.</p>
    </div>
  )
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
      {posts.map(p => (
        <motion.div key={p.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden hover:border-red-600 transition-colors">
          <div className="aspect-[9/16] bg-black relative">
            {p.platform === 'youtube' && p.embedId ? (
              <iframe src={`https://www.youtube.com/embed/${p.embedId}`} className="w-full h-full" allowFullScreen />
            ) : (
              <a href={p.url} target="_blank" rel="noopener" className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-red-950 to-black">
                <Play className="h-12 w-12 text-red-500" />
                <span className="absolute bottom-2 left-2 text-xs text-white bg-red-600/80 px-2 py-0.5 rounded capitalize">{p.platform}</span>
              </a>
            )}
          </div>
          <div className="p-2">
            {p.caption && <p className="text-white text-xs line-clamp-2 mb-1">{p.caption}</p>}
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-500 truncate">{p.reporterName}</span>
              <button onClick={() => like(p.id)} className="text-red-500 flex items-center gap-1"><Heart className="h-3 w-3" /> {p.likes || 0}</button>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  )
}

// ============ HOME FEED ============
const HomeFeed = ({ onArticle, onState, onNav, user }) => {
  const [news, setNews] = useState([])
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [loading, setLoading] = useState(false)
  const [category, setCategory] = useState('')
  const [stateFilter, setStateFilter] = useState('')
  const [categories, setCategories] = useState([])
  const [states, setStates] = useState([])
  const [search, setSearch] = useState('')
  const [featured, setFeatured] = useState([])
  const [featuredStatus, setFeaturedStatus] = useState({ slotsUsed: 0, slotsTotal: 10 })

  useEffect(() => {
    fetch(`${API}/categories`).then(r => r.json()).then(d => setCategories(d.categories || []))
    fetch(`${API}/states`).then(r => r.json()).then(d => setStates(d.states || []))
    loadFeatured()
    // Refresh featured every 60s so expired ones drop off
    const t = setInterval(loadFeatured, 60000)
    return () => clearInterval(t)
  }, [])

  const loadFeatured = () => {
    fetch(`${API}/featured`).then(r => r.json()).then(d => {
      setFeatured(d.featured || [])
      setFeaturedStatus({ slotsUsed: d.slotsUsed || 0, slotsTotal: d.slotsTotal || 10, slotsAvailable: d.slotsAvailable, full: d.full })
    }).catch(() => {})
  }

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

      {/* TOP 10 FEATURED — Paid premium slots (24h) */}
      {featured.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl md:text-2xl font-black text-white flex items-center gap-2">
              <Star className="h-5 w-5 md:h-6 md:w-6 text-yellow-400 fill-yellow-400" />
              Top 10 Featured News
              <Badge className="bg-yellow-600 text-black text-[10px] font-bold ml-1">PREMIUM</Badge>
            </h2>
            <span className="text-[11px] text-zinc-500">{featured.length}/{featuredStatus.slotsTotal} slots • 24h promo</span>
          </div>
          <div className="-mx-4 px-4 overflow-x-auto">
            <div className="flex gap-3 pb-2 min-w-min snap-x snap-mandatory">
              {featured.map(n => (
                <motion.div
                  key={n.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={() => onArticle(n)}
                  className="snap-start cursor-pointer flex-shrink-0 w-[260px] md:w-[300px] bg-gradient-to-br from-yellow-950/40 via-zinc-950 to-zinc-950 border border-yellow-700/40 hover:border-yellow-500 rounded-xl overflow-hidden shadow-xl hover:shadow-yellow-900/40 transition-all hover:-translate-y-1 group"
                >
                  <div className="relative h-36 md:h-40 overflow-hidden">
                    {(n.thumbnail || n.images?.[0]) ? (
                      <img src={n.thumbnail || n.images?.[0]} alt={n.headline} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                    ) : (
                      <div className="w-full h-full bg-zinc-900 flex items-center justify-center"><Newspaper className="h-10 w-10 text-zinc-700" /></div>
                    )}
                    <div className="absolute top-2 left-2 flex items-center gap-1">
                      <Badge className="bg-yellow-500 text-black font-black text-[10px] shadow-lg flex items-center gap-0.5">
                        <Star className="h-2.5 w-2.5 fill-black" /> FEATURED
                      </Badge>
                    </div>
                    <div className="absolute top-2 right-2">
                      <Badge className="bg-black/70 backdrop-blur-md text-white text-[10px] capitalize border border-white/20">{n.category}</Badge>
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
                    <div className="absolute bottom-1.5 left-2.5 right-2.5 text-[10px] text-yellow-200/90 flex items-center justify-between">
                      <span className="flex items-center gap-1"><MapPin className="h-2.5 w-2.5" /> {n.state}</span>
                      <span className="flex items-center gap-1"><Eye className="h-2.5 w-2.5" /> {(n.views || 0).toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="p-3">
                    <h3 className="text-sm font-bold text-white line-clamp-2 leading-snug group-hover:text-yellow-300 transition-colors">{n.headline}</h3>
                    <p className="text-[11px] text-zinc-500 mt-1.5">{fmtTime(n.createdAt)}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Section Title */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl md:text-3xl font-black text-white flex items-center gap-2">
          <Flame className="h-6 w-6 text-red-500" /> Latest Crime News
        </h2>
        <span className="text-xs text-zinc-500">Live Feed • Auto-Updated</span>
      </div>

      {/* State Quick Nav */}
      <div className="mb-6 -mx-4 px-4 overflow-x-auto">
        <div className="flex gap-2 pb-2 min-w-min">
          {states.slice(0, 10).map(s => (
            <button
              key={s.name}
              onClick={() => onState?.(s.name)}
              className="flex-shrink-0 px-4 py-2 rounded-full bg-zinc-950 border border-zinc-800 hover:border-red-600 hover:bg-red-950/30 text-sm text-white transition-colors flex items-center gap-1.5"
            >
              <Building2 className="h-3 w-3 text-red-500" /> {s.name}
            </button>
          ))}
        </div>
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

      {/* COMMUNITY SECTIONS: YouTube, Instagram, Join CTA (if not logged in), Help, Support, Contact */}
      <CommunitySections onJoinClick={() => onNav && onNav('join')} hideJoinCTA={!!user} />
    </div>
  )
}

// ============ ARTICLE VIEW ============
// ============ IMAGE CAROUSEL (Professional Slider for Article Hero) ============
const ImageCarousel = ({ images, headline, category, state, district, onState, pdfMode = false }) => {
  const [idx, setIdx] = useState(0)
  const [playing, setPlaying] = useState(true)
  const [loaded, setLoaded] = useState({})
  const touchX = useRef(null)
  const total = images?.length || 0

  // Autoplay every 4s
  useEffect(() => {
    if (!playing || total <= 1 || pdfMode) return
    const t = setTimeout(() => setIdx(i => (i + 1) % total), 4000)
    return () => clearTimeout(t)
  }, [idx, playing, total, pdfMode])

  // Keyboard navigation
  useEffect(() => {
    if (total <= 1 || pdfMode) return
    const onKey = (e) => {
      if (e.key === 'ArrowLeft') setIdx(i => (i - 1 + total) % total)
      else if (e.key === 'ArrowRight') setIdx(i => (i + 1) % total)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [total, pdfMode])

  if (total === 0) return null

  const goNext = () => setIdx(i => (i + 1) % total)
  const goPrev = () => setIdx(i => (i - 1 + total) % total)

  const onTouchStart = (e) => { touchX.current = e.touches[0].clientX }
  const onTouchEnd = (e) => {
    if (touchX.current == null) return
    const dx = e.changedTouches[0].clientX - touchX.current
    if (Math.abs(dx) > 50) (dx < 0 ? goNext : goPrev)()
    touchX.current = null
  }

  // PDF mode: render all images stacked vertically with overlay only on first
  if (pdfMode) {
    return (
      <div>
        {images.map((src, i) => (
          <div key={i} className="relative w-full" style={{ height: i === 0 ? '28rem' : '22rem' }}>
            <img src={src} alt={`${headline} ${i + 1}`} className="w-full h-full object-cover" crossOrigin="anonymous" />
            {i === 0 && (
              <>
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
                <div className="absolute bottom-0 p-6 md:p-8 space-y-3">
                  <div className="flex flex-wrap gap-2">
                    <Badge className="bg-red-600 capitalize">{category}</Badge>
                    <Badge variant="outline" className="text-white border-white/30 backdrop-blur-sm">
                      <MapPin className="h-3 w-3 mr-1" /> {state} › {district}
                    </Badge>
                  </div>
                  <h1 className="text-2xl md:text-4xl font-black text-white leading-tight">{headline}</h1>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="relative bg-black">
      {/* Main image stage */}
      <div
        className="relative h-72 md:h-[28rem] overflow-hidden select-none group"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        onMouseEnter={() => total > 1 && setPlaying(false)}
        onMouseLeave={() => total > 1 && setPlaying(true)}
      >
        <AnimatePresence initial={false} mode="wait">
          <motion.img
            key={idx}
            src={images[idx]}
            alt={`${headline} - ${idx + 1}`}
            className="absolute inset-0 w-full h-full object-cover"
            crossOrigin="anonymous"
            initial={{ opacity: 0, scale: 1.04 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.45, ease: 'easeOut' }}
            onLoad={() => setLoaded(s => ({ ...s, [idx]: true }))}
            draggable={false}
          />
        </AnimatePresence>

        {/* Bottom gradient + headline overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent pointer-events-none" />
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8 space-y-3 z-10 pointer-events-none">
          <div className="flex flex-wrap gap-2 pointer-events-auto">
            <Badge className="bg-red-600 capitalize">{category}</Badge>
            <Badge
              variant="outline"
              className="text-white border-white/30 backdrop-blur-sm cursor-pointer hover:bg-red-700/40"
              onClick={(e) => { e.stopPropagation(); onState?.(state) }}
            >
              <MapPin className="h-3 w-3 mr-1" /> {state} › {district}
            </Badge>
          </div>
          <h1 className="text-2xl md:text-4xl font-black text-white leading-tight drop-shadow-2xl">{headline}</h1>
        </div>

        {total > 1 && (
          <>
            {/* Prev / Next buttons */}
            <button
              onClick={goPrev}
              aria-label="Previous image"
              className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 z-20 h-10 w-10 md:h-12 md:w-12 rounded-full bg-black/55 hover:bg-red-600 backdrop-blur-md border border-white/20 flex items-center justify-center text-white shadow-xl transition-all"
            >
              <ChevronLeft className="h-5 w-5 md:h-6 md:w-6" />
            </button>
            <button
              onClick={goNext}
              aria-label="Next image"
              className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 z-20 h-10 w-10 md:h-12 md:w-12 rounded-full bg-black/55 hover:bg-red-600 backdrop-blur-md border border-white/20 flex items-center justify-center text-white shadow-xl transition-all"
            >
              <ChevronRight className="h-5 w-5 md:h-6 md:w-6" />
            </button>

            {/* Top-right controls: Counter + Play/Pause */}
            <div className="absolute top-3 right-3 z-20 flex items-center gap-2">
              <button
                onClick={() => setPlaying(p => !p)}
                aria-label={playing ? 'Pause slideshow' : 'Play slideshow'}
                className="h-8 w-8 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-white flex items-center justify-center hover:bg-red-600 transition-all"
              >
                {playing ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
              </button>
              <div className="h-8 px-3 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-white text-xs flex items-center font-bold">
                <Camera className="h-3 w-3 mr-1.5" /> {idx + 1} / {total}
              </div>
            </div>

            {/* Dot indicators (animated progress) */}
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-20 flex gap-1.5">
              {images.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setIdx(i)}
                  aria-label={`Go to image ${i + 1}`}
                  className={`h-1.5 rounded-full transition-all ${i === idx ? 'w-8 bg-red-500 shadow-lg shadow-red-500/50' : 'w-1.5 bg-white/60 hover:bg-white/90'}`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Thumbnails Strip */}
      {total > 1 && (
        <div className="bg-zinc-900/95 border-t border-zinc-800 px-3 py-2.5 overflow-x-auto">
          <div className="flex gap-2 min-w-max items-center">
            {images.map((src, i) => (
              <button
                key={i}
                onClick={() => setIdx(i)}
                aria-label={`Show image ${i + 1}`}
                className={`relative h-14 w-20 md:h-16 md:w-24 rounded-md overflow-hidden flex-shrink-0 transition-all duration-200 ${i === idx ? 'ring-2 ring-red-500 scale-105 shadow-lg shadow-red-500/30' : 'opacity-55 hover:opacity-100 ring-1 ring-zinc-700'}`}
              >
                <img src={src} alt={`thumbnail ${i + 1}`} className="w-full h-full object-cover" loading="lazy" />
                {i === idx && <div className="absolute inset-0 ring-2 ring-red-500 ring-inset rounded-md" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}


const ArticleView = ({ news, onBack, onState }) => {
  const [ads, setAds] = useState([])
  const [reporter, setReporter] = useState(null)
  const [generating, setGenerating] = useState(false)
  const articleRef = useRef()

  useEffect(() => {
    fetch(`${API}/news/${news.id}`).catch(() => {})
    fetch(`${API}/ads?status=approved`).then(r => r.json()).then(d => setAds(d.ads || []))
    fetch(`${API}/reporter/${news.reporterId}`).then(r => r.json()).then(d => setReporter({ ...d.user, newsCount: d.newsCount }))
  }, [news.id])

  const downloadAsPDF = async () => {
    if (!articleRef.current) return
    setGenerating(true)
    try {
      // Load html2pdf.js from CDN (more reliable than dynamic ESM import)
      if (!window.html2pdf) {
        await new Promise((resolve, reject) => {
          const s = document.createElement('script')
          s.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js'
          s.onload = resolve
          s.onerror = () => reject(new Error('Could not load PDF library'))
          document.head.appendChild(s)
        })
      }
      const opt = {
        margin: 5,
        filename: `news-${(news.slug || news.id).slice(0, 50)}.pdf`,
        image: { type: 'jpeg', quality: 0.92 },
        html2canvas: { scale: 2, useCORS: true, backgroundColor: '#0a0a0a', allowTaint: true, logging: false },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
      }
      await window.html2pdf().set(opt).from(articleRef.current).save()
      toast.success('PDF downloaded!')
    } catch (e) {
      toast.error('PDF failed: ' + (e.message || 'unknown'))
      console.error(e)
    }
    setGenerating(false)
  }

  const paragraphs = (news.content || '').split(/\n+/).filter(Boolean)
  const middleIdx = Math.min(2, Math.floor(paragraphs.length / 2))

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl mx-auto px-4 py-6 pb-24 md:pb-16">
      <div className="flex items-center justify-between mb-4">
        <Button onClick={onBack} variant="ghost" className="text-white hover:bg-red-950">
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Feed
        </Button>
        <div className="flex items-center gap-1">
          <Button onClick={downloadAsPDF} disabled={generating} size="sm" className="bg-red-600 hover:bg-red-700">
            {generating ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Download className="h-4 w-4 mr-1" />} PDF
          </Button>
          <a href={`https://wa.me/?text=${encodeURIComponent(news.headline + ' - ' + (typeof window !== 'undefined' ? window.location.href : ''))}`} target="_blank" rel="noopener noreferrer">
            <Button size="sm" className="bg-green-600 hover:bg-green-700"><MessageCircle className="h-4 w-4 mr-1" /> Share</Button>
          </a>
        </div>
      </div>
      <article ref={articleRef} className="bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl">
        {(() => {
          // Merge thumbnail (if not duplicate) with images list; cap at 5
          const allImgs = [...new Set([news.thumbnail, ...(news.images || [])].filter(Boolean))].slice(0, 5)
          if (allImgs.length === 0) return null
          return (
            <ImageCarousel
              images={allImgs}
              headline={news.headline}
              category={news.category}
              state={news.state}
              district={news.district}
              onState={onState}
              pdfMode={generating}
            />
          )
        })()}
        <div className="p-6 md:p-8 space-y-6">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-4 flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12 border-2 border-red-600">
                <AvatarImage src={news.reporterPhoto} />
                <AvatarFallback className="bg-red-700">{news.reporterName?.[0]}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-bold text-white">{news.reporterName}</p>
                <p className="text-xs text-zinc-500">{reporter?.designation || 'Reporter'} • {fmtTime(news.createdAt)}</p>
              </div>
            </div>
            <div className="text-sm text-zinc-400">
              <span className="flex items-center gap-1"><Eye className="h-4 w-4" /> {(news.views || 0).toLocaleString()} views</span>
            </div>
          </div>
          {news.summary && <p className="text-lg text-zinc-300 font-medium leading-relaxed border-l-4 border-red-600 pl-4 italic">{news.summary}</p>}

          {news.contentHtml && news.contentHtml !== news.content ? (
            <div className="prose prose-invert max-w-none text-zinc-200 ProseMirror" dangerouslySetInnerHTML={{ __html: news.contentHtml }} />
          ) : (
            <div className="prose prose-invert max-w-none">
              {paragraphs.map((p, i) => (
                <div key={i}>
                  <p className="whitespace-pre-wrap leading-relaxed text-base md:text-lg my-3 text-zinc-200">{p}</p>
                  {i === middleIdx && (
                    <div className="my-6"><AdSlot slot="middle" reporter={reporter} ads={ads} /></div>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="pt-4"><AdSlot slot="bottom" reporter={reporter} ads={ads} /></div>
          <ReporterInfoCard reporter={reporter} onFollow={() => toast.success('You are now following ' + reporter?.name)} />
        </div>
      </article>
    </motion.div>
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
// ============ JOIN FORM (Post-Driven Flow) ============
const JoinForm = ({ onLogin, onNav }) => {
  const [step, setStep] = useState(0) // 0=type, 1=location, 2=post-select, 3=profile, 4=pay
  const [joinType, setJoinType] = useState('') // state|district|city
  const [location, setLocation] = useState({ state: '', district: '', city: '' })
  const [availablePosts, setAvailablePosts] = useState([])
  const [selectedPost, setSelectedPost] = useState(null)
  const [postDetail, setPostDetail] = useState(null)
  const [form, setForm] = useState({
    name: '', email: '', password: '', mobile: '', referralCode: '',
    aadhaar: '', pan: '', address: '', bio: '', experience: '',
    aadhaarFront: '', aadhaarBack: '',
    profilePhoto: '', coverBanner: '',
    socialFacebook: '', socialTwitter: '', socialInstagram: '', socialYoutube: ''
  })
  const [states, setStates] = useState([])
  const [loading, setLoading] = useState(false)
  const [registered, setRegistered] = useState(null)
  const profileRef = useRef()
  const bannerRef = useRef()

  useEffect(() => {
    fetch(`${API}/states`).then(r => r.json()).then(d => setStates(d.states || []))
    if (typeof window !== 'undefined') {
      const refFromUrl = new URLSearchParams(window.location.search).get('ref')
      if (refFromUrl) setForm(f => ({ ...f, referralCode: refFromUrl }))
    }
  }, [])
  const districts = states.find(s => s.name === location.state)?.districts || []

  // Load available posts when location is complete
  useEffect(() => {
    if (!joinType) return
    const ready = joinType === 'state' ? location.state
      : joinType === 'district' ? (location.state && location.district)
      : (location.state && location.district && location.city)
    if (!ready) return
    const params = new URLSearchParams()
    if (location.state) params.set('state', location.state)
    if (location.district && joinType !== 'state') params.set('district', location.district)
    if (location.city && joinType === 'city') params.set('city', location.city)
    fetch(`${API}/posts?${params}`)
      .then(r => r.json())
      .then(d => setAvailablePosts((d.posts || []).filter(p => p.levelType === joinType)))
  }, [joinType, location])

  // When post selected, fetch details (members + seats)
  const selectPost = async (post) => {
    setSelectedPost(post)
    const r = await fetch(`${API}/posts/${post.id}`).then(r => r.json())
    setPostDetail(r)
    if (r.availableSeats > 0) setStep(3)
  }

  const handleImg = async (e, field) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setForm(f => ({ ...f, [field]: reader.result }))
    reader.readAsDataURL(file)
  }

  const submit = async () => {
    if (!form.name || !form.email || !form.password) { toast.error('Name, email, password required'); return }
    if (!form.mobile || form.mobile.length < 10) { toast.error('Valid mobile number required'); return }
    if (!form.aadhaar || form.aadhaar.replace(/\D/g, '').length !== 12) { toast.error('Valid 12-digit Aadhaar number required'); return }
    if (!form.aadhaarFront || !form.aadhaarBack) { toast.error('Aadhaar Front & Back photos are mandatory'); return }
    setLoading(true)
    const payload = {
      ...form, role: 'reporter',
      state: location.state,
      district: location.district || location.city,
      city: location.village || location.city,
      pincode: location.pincode,
      village: location.village,
      appliedPostId: selectedPost?.id, appliedPostName: selectedPost?.name,
      joiningType: joinType
    }
    const r = await fetch(`${API}/auth/register`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).then(r => r.json())
    if (r.token && r.user) {
      localStorage.setItem('icn_token', r.token)
      localStorage.setItem('icn_user', JSON.stringify(r.user))
      // Auto-apply
      await fetch(`${API}/posts/${selectedPost.id}/apply`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${r.token}` }
      })
      setRegistered(r.user)
      setStep(4)
      toast.success('Account created! Pay joining fee to complete application.')
    } else { toast.error(r.error || 'Registration failed') }
    setLoading(false)
  }

  const payJoiningFee = () => {
    const amount = selectedPost?.joiningFee || 500
    fetch(`${API}/payment/create-order`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount })
    }).then(r => r.json()).then(order => {
      if (order.error) { toast.error('Payment gateway not configured. Skipping for demo.'); onLogin(registered); return }
      const script = document.createElement('script')
      script.src = 'https://checkout.razorpay.com/v1/checkout.js'
      script.onload = () => {
        const rzp = new window.Razorpay({
          key: order.keyId, amount: order.amount, currency: 'INR',
          name: 'Indian Crime News', description: `${selectedPost.name} Joining Fee`,
          order_id: order.orderId,
          handler: async (resp) => {
            await fetch(`${API}/payment/verify`, {
              method: 'POST', headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ ...resp, userId: registered.id })
            })
            toast.success('Payment successful! Awaiting admin approval.')
            onLogin(registered)
          },
          theme: { color: '#dc2626' },
          prefill: { name: registered.name, email: registered.email, contact: registered.mobile }
        })
        rzp.open()
      }
      document.body.appendChild(script)
    })
  }

  // ===== Render =====
  const totalSteps = 5
  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-24 md:pb-8">
      <Card className="bg-zinc-950 border-zinc-800 shadow-2xl shadow-red-950/30">
        <CardHeader className="text-center">
          <div className="mx-auto"><Logo size="lg" /></div>
          <CardTitle className="text-white text-xl mt-2">Become a Reporter</CardTitle>
          <CardDescription className="text-zinc-400">Step {step + 1} of {totalSteps}</CardDescription>
          <div className="flex gap-1 mt-3">
            {Array.from({ length: totalSteps }).map((_, i) => <div key={i} className={`h-1.5 flex-1 rounded-full ${step >= i ? 'bg-red-600' : 'bg-zinc-800'}`} />)}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">

          {/* STEP 0: Joining Type */}
          {step === 0 && (
            <>
              <p className="text-sm text-zinc-400 mb-2">Select your joining level:</p>
              {[
                { key: 'state', label: 'State Level', desc: 'Lead state-wide team', icon: '🏛️' },
                { key: 'district', label: 'District Level', desc: 'Manage district reporting', icon: '🏙️' },
                { key: 'city', label: 'City Level', desc: 'Report from your city', icon: '📍' }
              ].map(opt => (
                <button key={opt.key} onClick={() => { setJoinType(opt.key); setLocation({ state: '', district: '', city: '' }); setStep(1) }}
                  className={`w-full p-4 rounded-xl border-2 text-left transition-all ${joinType === opt.key ? 'border-red-600 bg-red-950/30' : 'border-zinc-800 bg-zinc-900 hover:border-red-700'}`}>
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">{opt.icon}</div>
                    <div className="flex-1">
                      <p className="font-bold text-white">{opt.label}</p>
                      <p className="text-xs text-zinc-400">{opt.desc}</p>
                    </div>
                  </div>
                </button>
              ))}
            </>
          )}

          {/* STEP 1: Location */}
          {step === 1 && (
            <>
              <p className="text-sm text-zinc-400 mb-1">Select location for <span className="text-red-400 capitalize font-bold">{joinType} level</span> joining:</p>
              <IndiaLocationPicker
                value={location}
                onChange={setLocation}
                requireVillage={joinType === 'city'}
                level={joinType}
              />
              {joinType === 'city' && location.district && !(location.city || location.village) && (
                <p className="text-[11px] text-yellow-500 -mt-1">Tip: Type your village/locality above for precise matching. You can still view available posts in this district below.</p>
              )}
              <div className="flex gap-2">
                <Button onClick={() => setStep(0)} variant="outline" className="flex-1 border-zinc-800 bg-zinc-900 text-white">← Back</Button>
                <Button
                  onClick={() => setStep(2)}
                  disabled={!location.state || (joinType !== 'state' && !location.district)}
                  className="flex-1 bg-red-600 hover:bg-red-700"
                >
                  View Available Posts →
                </Button>
              </div>
            </>
          )}

          {/* STEP 2: Post Selection */}
          {step === 2 && (
            <>
              <p className="text-sm text-zinc-400 mb-1">
                Available <span className="text-red-400 capitalize font-bold">{joinType}</span> posts in{' '}
                <span className="text-white">{[location.state, location.district, location.city].filter(Boolean).join(' › ')}</span>
              </p>
              {availablePosts.length === 0 ? (
                <div className="text-center py-8">
                  <AlertTriangle className="h-10 w-10 mx-auto text-yellow-500 mb-2" />
                  <p className="text-white font-bold">No posts available here</p>
                  <p className="text-xs text-zinc-500 mt-1">Admin has not created any {joinType}-level posts for this location yet.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {/* Expand each post into N rows where N = totalVacancy. Each row represents a single seat/slot. */}
                  {availablePosts.flatMap(p => {
                    const total = Math.max(1, Number(p.totalVacancy) || 1)
                    const filledSeats = Math.min(total, Number(p.filledSeats) || 0)
                    return Array.from({ length: total }, (_, i) => {
                      const seatNo = i + 1
                      const isFilled = seatNo <= filledSeats
                      return (
                        <button
                          key={`${p.id}-seat-${seatNo}`}
                          onClick={() => selectPost(p)}
                          className={`w-full p-3 rounded-xl border-2 text-left ${isFilled ? 'border-zinc-800 bg-zinc-900 opacity-70' : 'border-red-900/50 bg-red-950/20 hover:border-red-600'}`}
                        >
                          <div className="flex items-center justify-between flex-wrap gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className={`inline-flex h-6 min-w-[3rem] px-2 items-center justify-center rounded-md text-[10px] font-black ${isFilled ? 'bg-zinc-800 text-zinc-400' : 'bg-red-700 text-white'}`}>
                                Seat {seatNo}/{total}
                              </span>
                              <p className="font-bold text-white truncate">{p.name}</p>
                            </div>
                            <Badge className="bg-yellow-600">₹{p.joiningFee}</Badge>
                          </div>
                          <p className="text-xs text-zinc-400 mt-1">{p.description?.slice(0, 80)}</p>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-xs text-zinc-500">{p.filledSeats || 0}/{total} filled overall</span>
                            {isFilled
                              ? <Badge className="bg-red-700">⛔ Filled</Badge>
                              : <Badge className="bg-green-700">✅ Open</Badge>}
                          </div>
                        </button>
                      )
                    })
                  })}
                </div>
              )}

              {/* Show members if a filled post is selected */}
              {selectedPost && postDetail && postDetail.availableSeats === 0 && (
                <div className="mt-4 space-y-2">
                  <div className="bg-yellow-950/30 border border-yellow-700 rounded-lg p-3">
                    <p className="text-yellow-300 font-bold text-sm">⛔ All vacancies for {selectedPost.name} in {[location.state, location.district, location.city].filter(Boolean).join(' › ')} are already filled.</p>
                  </div>
                  <p className="text-xs text-zinc-400">Existing active members:</p>
                  {postDetail.members.map(m => (
                    <div key={m.id} className="flex items-center gap-2 p-2 bg-zinc-900 rounded">
                      <Avatar className="h-9 w-9 border border-red-600"><AvatarImage src={m.photo} /><AvatarFallback className="bg-red-700 text-xs">{m.name?.[0]}</AvatarFallback></Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-bold">{m.name}</p>
                        <p className="text-xs text-zinc-500">{m.designation} • 📱 {m.mobile}</p>
                      </div>
                      {m.verified && <CheckCheck className="h-4 w-4 text-blue-500" />}
                    </div>
                  ))}
                </div>
              )}

              <Button onClick={() => setStep(1)} variant="outline" className="w-full border-zinc-800 bg-zinc-900 text-white mt-2">← Back</Button>
            </>
          )}

          {/* STEP 3: Profile */}
          {step === 3 && (
            <>
              <div className="bg-green-950/30 border border-green-700 rounded-lg p-2 mb-2">
                <p className="text-green-300 text-xs">✅ Applying for: <span className="font-bold">{selectedPost?.name}</span> • {[location.state, location.district, location.city].filter(Boolean).join(' › ')} • Fee: ₹{selectedPost?.joiningFee}</p>
              </div>
              <p className="text-xs text-zinc-500">Basic Information</p>
              <Input placeholder="Full Name *" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="bg-zinc-900 border-zinc-800 text-white" />
              <Input type="email" placeholder="Email *" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="bg-zinc-900 border-zinc-800 text-white" />
              <Input type="password" placeholder="Password *" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} className="bg-zinc-900 border-zinc-800 text-white" />
              <Input placeholder="Mobile Number *" value={form.mobile} onChange={e => setForm({ ...form, mobile: e.target.value })} className="bg-zinc-900 border-zinc-800 text-white" />
              <div className="grid grid-cols-2 gap-2">
                <Input placeholder="Aadhaar Number * (12 digits)" value={form.aadhaar} maxLength={12} onChange={e => setForm({ ...form, aadhaar: e.target.value.replace(/\D/g, '').slice(0, 12) })} className="bg-zinc-900 border-zinc-800 text-white font-mono" />
                <Input placeholder="PAN" value={form.pan} onChange={e => setForm({ ...form, pan: e.target.value.toUpperCase() })} className="bg-zinc-900 border-zinc-800 text-white font-mono" />
              </div>

              {/* AADHAAR CARD PHOTOS — MANDATORY */}
              <div className="bg-red-950/20 border border-red-900/50 rounded-lg p-3 space-y-2">
                <p className="text-xs font-bold text-red-300 flex items-center gap-1.5">
                  <IdCard className="h-3.5 w-3.5" /> Aadhaar Card Photos <span className="text-red-500">*</span>
                  <span className="text-[10px] text-zinc-400 font-normal">(both sides mandatory)</span>
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-[11px] text-zinc-400 mb-1">Front Side *</p>
                    <input type="file" accept="image/*" id="aadhaarFront" onChange={e => handleImg(e, 'aadhaarFront')} className="hidden" />
                    <label htmlFor="aadhaarFront" className="block cursor-pointer">
                      <div className="w-full aspect-[16/10] bg-zinc-900 border-2 border-dashed border-red-900/50 hover:border-red-500 rounded-lg flex items-center justify-center overflow-hidden transition-colors">
                        {form.aadhaarFront ? (
                          <img src={form.aadhaarFront} alt="Aadhaar Front" className="w-full h-full object-cover" />
                        ) : (
                          <div className="flex flex-col items-center text-zinc-500">
                            <IdCard className="h-7 w-7 mb-1" />
                            <span className="text-[10px]">Upload Front</span>
                          </div>
                        )}
                      </div>
                    </label>
                  </div>
                  <div>
                    <p className="text-[11px] text-zinc-400 mb-1">Back Side *</p>
                    <input type="file" accept="image/*" id="aadhaarBack" onChange={e => handleImg(e, 'aadhaarBack')} className="hidden" />
                    <label htmlFor="aadhaarBack" className="block cursor-pointer">
                      <div className="w-full aspect-[16/10] bg-zinc-900 border-2 border-dashed border-red-900/50 hover:border-red-500 rounded-lg flex items-center justify-center overflow-hidden transition-colors">
                        {form.aadhaarBack ? (
                          <img src={form.aadhaarBack} alt="Aadhaar Back" className="w-full h-full object-cover" />
                        ) : (
                          <div className="flex flex-col items-center text-zinc-500">
                            <IdCard className="h-7 w-7 mb-1" />
                            <span className="text-[10px]">Upload Back</span>
                          </div>
                        )}
                      </div>
                    </label>
                  </div>
                </div>
                <p className="text-[10px] text-zinc-500 flex items-center gap-1">
                  <Shield className="h-3 w-3 text-green-500" /> Your documents are encrypted and used only for verification.
                </p>
              </div>
              <Textarea placeholder="Address" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} className="bg-zinc-900 border-zinc-800 text-white" rows={2} />
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-xs text-zinc-400 mb-1">Profile Photo</p>
                  <input ref={profileRef} type="file" accept="image/*" onChange={e => handleImg(e, 'profilePhoto')} className="hidden" />
                  <button onClick={() => profileRef.current?.click()} className="w-full aspect-square bg-zinc-900 border-2 border-dashed border-zinc-700 hover:border-red-600 rounded-lg flex items-center justify-center overflow-hidden">
                    {form.profilePhoto ? <img src={form.profilePhoto} className="w-full h-full object-cover" /> : <Camera className="h-6 w-6 text-zinc-500" />}
                  </button>
                </div>
                <div>
                  <p className="text-xs text-zinc-400 mb-1">Cover Banner</p>
                  <input ref={bannerRef} type="file" accept="image/*" onChange={e => handleImg(e, 'coverBanner')} className="hidden" />
                  <button onClick={() => bannerRef.current?.click()} className="w-full aspect-square bg-zinc-900 border-2 border-dashed border-zinc-700 hover:border-red-600 rounded-lg flex items-center justify-center overflow-hidden">
                    {form.coverBanner ? <img src={form.coverBanner} className="w-full h-full object-cover" /> : <ImageIcon className="h-6 w-6 text-zinc-500" />}
                  </button>
                </div>
              </div>
              <Textarea placeholder="Bio" value={form.bio} onChange={e => setForm({ ...form, bio: e.target.value })} className="bg-zinc-900 border-zinc-800 text-white" rows={2} />
              <Input placeholder="Experience" value={form.experience} onChange={e => setForm({ ...form, experience: e.target.value })} className="bg-zinc-900 border-zinc-800 text-white" />
              <Input placeholder="Referral Code (optional)" value={form.referralCode} onChange={e => setForm({ ...form, referralCode: e.target.value.toUpperCase() })} className="bg-zinc-900 border-purple-900/50 text-white font-mono" />
              <div className="flex gap-2">
                <Button onClick={() => setStep(2)} variant="outline" className="flex-1 border-zinc-800 bg-zinc-900 text-white">← Back</Button>
                <Button onClick={submit} disabled={loading} className="flex-1 bg-red-600 hover:bg-red-700">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Submit & Pay'}
                </Button>
              </div>
            </>
          )}

          {/* STEP 4: Payment */}
          {step === 4 && registered && (
            <>
              <div className="text-center space-y-3">
                <CheckCircle2 className="h-14 w-14 text-green-500 mx-auto" />
                <h3 className="text-xl font-black text-white">Application Submitted!</h3>
                <p className="text-sm text-zinc-400">Your application for <span className="text-red-400 font-bold">{selectedPost?.name}</span> is pending. Complete payment of ₹{selectedPost?.joiningFee} to activate.</p>
                <div className="bg-zinc-900 rounded-lg p-3 text-left text-sm space-y-1">
                  <div className="flex justify-between"><span className="text-zinc-400">Post:</span><span className="text-white">{selectedPost?.name}</span></div>
                  <div className="flex justify-between"><span className="text-zinc-400">Location:</span><span className="text-white">{[location.state, location.district, location.city].filter(Boolean).join(' › ')}</span></div>
                  <div className="flex justify-between"><span className="text-zinc-400">Referral:</span><span className="text-red-400 font-mono">{registered.referralCode}</span></div>
                  <div className="flex justify-between border-t border-zinc-800 pt-1 mt-1"><span className="text-zinc-400">Joining Fee:</span><span className="font-black text-green-400">₹{selectedPost?.joiningFee}</span></div>
                </div>
                <Button onClick={payJoiningFee} className="w-full bg-red-600 hover:bg-red-700"><Send className="h-4 w-4 mr-2" /> Pay ₹{selectedPost?.joiningFee} with Razorpay</Button>
                <Button onClick={() => onLogin(registered)} variant="ghost" className="w-full text-zinc-400">Skip payment (demo) →</Button>
              </div>
            </>
          )}

          <Button onClick={() => onNav('login')} variant="ghost" className="w-full text-zinc-400 hover:text-white">
            Already have account? <span className="text-red-500 ml-1 font-semibold">Login</span>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}


// ============ AD CREATION DIALOG (Reporter Paid Flow) ============
const AdCreatorDialog = ({ token, user, onClose }) => {
  const [step, setStep] = useState(1) // 1=info, 2=pay, 3=upload
  const [placement, setPlacement] = useState('both')
  const [form, setForm] = useState({ banner: '', title: '', link: '', ctaText: '', duration: 7 })
  const [paymentId, setPaymentId] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const fileRef = useRef()

  const pay = async () => {
    const order = await fetch(`${API}/payment/create-order`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: 299 })
    }).then(r => r.json())
    if (order.error) { toast.error('Razorpay not configured. Skipping for demo.'); setPaymentId('demo_' + Date.now()); setStep(3); return }
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.onload = () => {
      const rzp = new window.Razorpay({
        key: order.keyId, amount: order.amount, currency: 'INR',
        name: 'Indian Crime News', description: `Advertisement (₹299, covers Middle + Bottom)`,
        order_id: order.orderId,
        handler: async (resp) => {
          await fetch(`${API}/payment/verify`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...resp, userId: user.id })
          })
          setPaymentId(resp.razorpay_payment_id)
          toast.success('Payment successful! Upload your banner now.')
          setStep(3)
        },
        theme: { color: '#dc2626' },
        prefill: { name: user.name, email: user.email, contact: user.mobile }
      })
      rzp.open()
    }
    document.body.appendChild(script)
  }

  const handleUpload = (e) => {
    const f = e.target.files[0]
    if (!f) return
    const reader = new FileReader()
    reader.onload = () => setForm(prev => ({ ...prev, banner: reader.result }))
    reader.readAsDataURL(f)
  }

  const submit = async () => {
    if (!form.banner) { toast.error('Upload a banner first'); return }
    setSubmitting(true)
    const r = await fetch(`${API}/ads`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ placement, ...form, paymentId })
    }).then(r => r.json())
    setSubmitting(false)
    if (r.ad) { toast.success('Advertisement submitted for admin approval!'); onClose(true) }
    else toast.error(r.error || 'Failed')
  }

  return (
    <Dialog open onOpenChange={() => onClose(false)}>
      <DialogContent className="max-w-lg bg-zinc-950 border-zinc-800 text-white max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl"><Megaphone className="h-5 w-5 text-red-500" /> Create Advertisement</DialogTitle>
          <CardDescription className="text-zinc-400">One payment of ₹299 covers your choice of placement.</CardDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex gap-1">
            {[1, 2, 3].map(i => <div key={i} className={`h-1.5 flex-1 rounded-full ${step >= i ? 'bg-red-600' : 'bg-zinc-800'}`} />)}
          </div>

          {step === 1 && (
            <>
              <p className="text-sm text-zinc-400">Choose placement:</p>
              {[
                { key: 'middle', label: '📰 Middle Banner Only', desc: 'Shows between news paragraphs', size: '900x300 / 1080x400' },
                { key: 'bottom', label: '📍 Bottom Banner Only', desc: 'Shows at end of news article', size: '1200x200 / 1080x250' },
                { key: 'both', label: '🌟 Both Middle + Bottom', desc: 'Same banner in BOTH positions (Best value)', size: 'Use 900x300 or 1200x300' }
              ].map(opt => (
                <button key={opt.key} onClick={() => setPlacement(opt.key)} className={`w-full p-3 rounded-xl border-2 text-left ${placement === opt.key ? 'border-red-600 bg-red-950/30' : 'border-zinc-800 bg-zinc-900'}`}>
                  <p className="font-bold text-white">{opt.label}</p>
                  <p className="text-xs text-zinc-400 mt-0.5">{opt.desc}</p>
                  <p className="text-xs text-yellow-500 mt-0.5">Recommended: {opt.size}</p>
                </button>
              ))}
              <div className="bg-green-950/30 border border-green-700 rounded-lg p-3 text-center">
                <p className="text-zinc-400 text-xs">One-time payment</p>
                <p className="text-2xl font-black text-green-400">₹299</p>
                <p className="text-[10px] text-zinc-500">(Covers selected placements)</p>
              </div>
              <Button onClick={() => setStep(2)} className="w-full bg-red-600 hover:bg-red-700">Continue → Pay ₹299</Button>
            </>
          )}

          {step === 2 && (
            <>
              <div className="bg-zinc-900 rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm"><span className="text-zinc-400">Placement:</span><span className="text-white font-bold capitalize">{placement}</span></div>
                <div className="flex justify-between border-t border-zinc-800 pt-2"><span className="text-zinc-400">Amount:</span><span className="text-2xl font-black text-green-400">₹299</span></div>
              </div>
              <Button onClick={pay} className="w-full bg-green-600 hover:bg-green-700"><Send className="h-4 w-4 mr-2" /> Pay with Razorpay</Button>
              <Button onClick={() => setStep(1)} variant="outline" className="w-full border-zinc-800 bg-zinc-900 text-white">← Back</Button>
            </>
          )}

          {step === 3 && (
            <>
              <Badge className="bg-green-700 gap-1"><CheckCircle2 className="h-3 w-3" /> Payment verified</Badge>
              <Input placeholder="Ad Title (optional)" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="bg-zinc-900 border-zinc-800 text-white" />
              <div>
                <p className="text-sm font-semibold mb-2">Upload Banner</p>
                <input ref={fileRef} type="file" accept="image/*,image/gif" onChange={handleUpload} className="hidden" />
                {form.banner ? (
                  <div className="relative">
                    <img src={form.banner} className="w-full rounded-lg border border-zinc-700" />
                    <button onClick={() => { setForm({ ...form, banner: '' }); if (fileRef.current) fileRef.current.value = '' }} className="absolute top-2 right-2 bg-red-600 rounded-full p-1.5"><X className="h-3 w-3" /></button>
                  </div>
                ) : (
                  <button onClick={() => fileRef.current?.click()} className="w-full aspect-video border-2 border-dashed border-zinc-700 rounded-lg flex flex-col items-center justify-center text-zinc-500 hover:border-red-600 hover:text-red-500">
                    <ImageIcon className="h-8 w-8 mb-2" />
                    <p>Click to upload banner</p>
                  </button>
                )}
              </div>
              <Input placeholder="Optional Redirect URL (makes ad clickable)" value={form.link} onChange={e => setForm({ ...form, link: e.target.value })} className="bg-zinc-900 border-zinc-800 text-white" />
              {form.link && <Input placeholder="CTA Button Text" value={form.ctaText} onChange={e => setForm({ ...form, ctaText: e.target.value })} className="bg-zinc-900 border-zinc-800 text-white" />}
              <div>
                <p className="text-xs text-zinc-500 mb-1">Duration</p>
                <Select value={String(form.duration)} onValueChange={v => setForm({ ...form, duration: parseInt(v) })}>
                  <SelectTrigger className="bg-zinc-900 border-zinc-800"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-zinc-950 border-zinc-800 text-white">
                    <SelectItem value="7">7 days</SelectItem>
                    <SelectItem value="15">15 days</SelectItem>
                    <SelectItem value="30">30 days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={submit} disabled={submitting} className="w-full bg-red-600 hover:bg-red-700">
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Send className="h-4 w-4 mr-2" /> Submit for Approval</>}
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}


// ============ SOCIAL POST DIALOG ============
const SocialPostDialog = ({ token, onClose }) => {
  const [url, setUrl] = useState('')
  const [caption, setCaption] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const submit = async () => {
    if (!url) return toast.error('URL required')
    setSubmitting(true)
    const r = await fetch(`${API}/social`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ url, caption })
    }).then(r => r.json())
    setSubmitting(false)
    if (r.post) { toast.success('Reel posted to social feed!'); onClose(true) }
    else toast.error(r.error || 'Failed')
  }
  return (
    <Dialog open onOpenChange={() => onClose(false)}>
      <DialogContent className="max-w-md bg-zinc-950 border-zinc-800 text-white">
        <DialogHeader><DialogTitle className="flex items-center gap-2"><Play className="h-5 w-5 text-red-500" /> Add Video / Reel</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <Input placeholder="YouTube / Instagram / Facebook / Twitter URL" value={url} onChange={e => setUrl(e.target.value)} className="bg-zinc-900 border-zinc-800 text-white" />
          <Textarea placeholder="Caption (optional)" value={caption} onChange={e => setCaption(e.target.value)} className="bg-zinc-900 border-zinc-800 text-white" rows={3} />
          <p className="text-xs text-zinc-500">Platform auto-detected. YouTube videos will embed inline.</p>
          <Button onClick={submit} disabled={submitting} className="w-full bg-red-600 hover:bg-red-700">
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Post to Social Feed'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ============ PAYOUT REQUEST DIALOG ============
const PayoutDialog = ({ token, walletBalance, onClose }) => {
  const [form, setForm] = useState({ amount: '', method: 'upi', upiId: '', accountNumber: '', ifsc: '', accountHolder: '', notes: '' })
  const [submitting, setSubmitting] = useState(false)

  const submit = async () => {
    setSubmitting(true)
    const r = await fetch(`${API}/payouts`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(form)
    }).then(r => r.json())
    setSubmitting(false)
    if (r.payout) { toast.success(r.message || 'Payout requested!'); onClose(true) }
    else toast.error(r.error || 'Failed')
  }

  return (
    <Dialog open onOpenChange={() => onClose(false)}>
      <DialogContent className="max-w-md bg-zinc-950 border-zinc-800 text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl"><Wallet className="h-5 w-5 text-green-500" /> Request Withdrawal</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="bg-green-950/30 border border-green-900 rounded-lg p-3 text-sm">
            <p className="text-zinc-400 text-xs">Available Balance</p>
            <p className="text-2xl font-black text-green-400">₹{walletBalance.toLocaleString()}</p>
          </div>

          <div>
            <label className="text-sm font-semibold block mb-1">Amount (min ₹100)</label>
            <Input type="number" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} placeholder="500" max={walletBalance} className="bg-zinc-900 border-zinc-800 text-white" />
          </div>

          <div>
            <label className="text-sm font-semibold block mb-2">Method</label>
            <div className="flex gap-2">
              <Button onClick={() => setForm({ ...form, method: 'upi' })} className={`flex-1 ${form.method === 'upi' ? 'bg-red-600 hover:bg-red-700' : 'bg-zinc-900 hover:bg-zinc-800'}`}>UPI</Button>
              <Button onClick={() => setForm({ ...form, method: 'bank' })} className={`flex-1 ${form.method === 'bank' ? 'bg-red-600 hover:bg-red-700' : 'bg-zinc-900 hover:bg-zinc-800'}`}>Bank Transfer</Button>
            </div>
          </div>

          {form.method === 'upi' ? (
            <div>
              <label className="text-sm font-semibold block mb-1">UPI ID</label>
              <Input value={form.upiId} onChange={e => setForm({ ...form, upiId: e.target.value })} placeholder="yourname@paytm" className="bg-zinc-900 border-zinc-800 text-white" />
            </div>
          ) : (
            <>
              <Input value={form.accountHolder} onChange={e => setForm({ ...form, accountHolder: e.target.value })} placeholder="Account Holder Name" className="bg-zinc-900 border-zinc-800 text-white" />
              <Input value={form.accountNumber} onChange={e => setForm({ ...form, accountNumber: e.target.value })} placeholder="Account Number" className="bg-zinc-900 border-zinc-800 text-white" />
              <Input value={form.ifsc} onChange={e => setForm({ ...form, ifsc: e.target.value.toUpperCase() })} placeholder="IFSC Code (e.g. HDFC0001234)" className="bg-zinc-900 border-zinc-800 text-white font-mono" />
            </>
          )}

          <Textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Notes (optional)" className="bg-zinc-900 border-zinc-800 text-white" rows={2} />

          <p className="text-xs text-zinc-500">⚠️ Amount will be held in escrow until admin approves. Refunded to wallet if rejected. Processing time: 1-3 business days.</p>

          <div className="flex gap-2">
            <Button onClick={() => onClose(false)} variant="outline" className="flex-1 border-zinc-800 bg-zinc-900 text-white hover:bg-zinc-800">Cancel</Button>
            <Button onClick={submit} disabled={submitting} className="flex-1 bg-green-600 hover:bg-green-700">
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Submit Request'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ============ DASHBOARD ============
const Dashboard = ({ user, token }) => {
  const [stats, setStats] = useState({})
  const [myNews, setMyNews] = useState([])
  const [creating, setCreating] = useState(false)
  const [showPayout, setShowPayout] = useState(false)
  const [showAdCreator, setShowAdCreator] = useState(false)
  const [showSocial, setShowSocial] = useState(false)
  const [showIdCard, setShowIdCard] = useState(false)
  const [showDp, setShowDp] = useState(false)
  const [payouts, setPayouts] = useState([])
  const [myAds, setMyAds] = useState([])
  const [refData, setRefData] = useState({ referrals: [], totalEarned: 0, totalReferrals: 0, referralCode: user.referralCode, walletBalance: user.walletBalance || 0 })

  const loadData = async () => {
    const [s, n, r, p, a] = await Promise.all([
      fetch(`${API}/stats`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
      fetch(`${API}/news?status=all&reporterId=${user.id}`).then(r => r.json()),
      fetch(`${API}/referrals`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
      fetch(`${API}/payouts`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
      fetch(`${API}/ads/my`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json())
    ])
    setStats(s); setMyNews(n.news || []); setRefData(r); setPayouts(p.payouts || []); setMyAds(a.ads || [])
  }
  useEffect(() => { loadData() }, [])

  const referralLink = typeof window !== 'undefined'
    ? `${window.location.origin}/?ref=${refData.referralCode}`
    : ''
  const copyRef = () => {
    navigator.clipboard.writeText(referralLink)
    toast.success('Referral link copied! Share to earn ₹100 per signup.')
  }
  const shareWA = () => {
    const text = `Join India's biggest crime news network as a Reporter! Earn money daily. Use my referral code: ${refData.referralCode} - ${referralLink}`
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
  }

  const downloads = [
    { name: 'Press ID Card', icon: IdCard, color: 'from-red-600 to-red-800', onClick: () => setShowIdCard(true), info: 'Front + Back • PDF/PNG' },
    { name: 'Social Media DP', icon: ImageIcon, color: 'from-purple-600 to-purple-800', onClick: () => setShowDp(true), info: 'Circular • PNG/PDF' },
    { name: 'Joining Letter', icon: FileText, color: 'from-blue-600 to-blue-800', url: `${API}/pdf/certificate/${user.id}`, info: 'PDF' },
    { name: 'Certificate', icon: Award, color: 'from-yellow-600 to-yellow-800', url: `${API}/pdf/certificate/${user.id}`, info: 'PDF' },
    { name: 'Bike Sticker', icon: Bike, color: 'from-green-600 to-green-800', url: `${API}/pdf/certificate/${user.id}`, info: 'PDF' },
    { name: 'Press Sticker', icon: Shield, color: 'from-pink-600 to-pink-800', onClick: () => setShowIdCard(true), info: 'Press Card' }
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

      {/* HERO QUICK ACTIONS - super visible */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <button onClick={() => setCreating(true)} className="bg-gradient-to-br from-red-600 to-red-800 rounded-2xl p-5 text-left hover:scale-[1.02] transition-transform shadow-2xl shadow-red-900/40 border-2 border-red-500/30">
          <Newspaper className="h-8 w-8 text-white mb-2" />
          <p className="font-black text-white text-base">📰 Publish News</p>
          <p className="text-xs text-white/80 mt-1">Free • Auto-publishes instantly</p>
        </button>
        <button onClick={() => setShowAdCreator(true)} className="bg-gradient-to-br from-yellow-500 to-orange-700 rounded-2xl p-5 text-left hover:scale-[1.02] transition-transform shadow-2xl shadow-orange-900/40 border-2 border-yellow-400/40 relative">
          <div className="absolute -top-2 -right-2 bg-green-600 text-white text-xs font-black px-2 py-1 rounded-full shadow-lg">₹299</div>
          <Megaphone className="h-8 w-8 text-white mb-2" />
          <p className="font-black text-white text-base">🎯 Create Advertisement</p>
          <p className="text-xs text-white/90 mt-1">Bottom or Middle banner • Pay ₹299</p>
        </button>
        <button onClick={() => setShowSocial(true)} className="bg-gradient-to-br from-pink-600 to-purple-700 rounded-2xl p-5 text-left hover:scale-[1.02] transition-transform shadow-2xl shadow-purple-900/40 border-2 border-pink-400/30">
          <Play className="h-8 w-8 text-white mb-2" />
          <p className="font-black text-white text-base">🎬 Post Reel / Video</p>
          <p className="text-xs text-white/80 mt-1">YouTube / Insta / FB / Twitter</p>
        </button>
      </div>

      {/* My Ads */}
      <Card className="bg-zinc-950 border-zinc-800">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-white text-base flex items-center gap-2"><Megaphone className="h-4 w-4 text-yellow-500" /> My Advertisements ({myAds.length})</CardTitle>
          <Button onClick={() => setShowAdCreator(true)} size="sm" className="bg-yellow-600 hover:bg-yellow-700 h-7"><Plus className="h-3 w-3 mr-1" /> New Ad ₹299</Button>
        </CardHeader>
        <CardContent className="space-y-2">
          {myAds.length === 0 && (
            <div className="text-center py-6">
              <Megaphone className="h-10 w-10 mx-auto text-zinc-700 mb-2" />
              <p className="text-zinc-500 text-sm">No advertisements yet</p>
              <Button onClick={() => setShowAdCreator(true)} size="sm" className="bg-red-600 hover:bg-red-700 mt-3">Create Your First Ad — ₹299</Button>
            </div>
          )}
          {myAds.map(a => (
            <div key={a.id} className="flex items-center gap-3 p-2 bg-zinc-900 rounded">
              <img src={a.banner} className="h-14 w-24 object-cover rounded flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-bold capitalize">{a.type} Ad</p>
                <p className="text-xs text-zinc-500">{a.impressions || 0} views • {a.clicks || 0} clicks • {a.duration}d</p>
                {a.adminNote && <p className="text-xs text-red-400 mt-1">Reason: {a.adminNote}</p>}
              </div>
              <div className="flex flex-col items-end gap-1">
                <Badge className={a.status === 'approved' ? 'bg-green-700' : a.status === 'pending' ? 'bg-yellow-700' : 'bg-red-700'}>{a.status}</Badge>
                <Button onClick={async () => {
                  if (!confirm('Delete this ad? You will need to pay ₹299 again to create a new one.')) return
                  await fetch(`${API}/ads/${a.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
                  toast.success('Ad deleted. Click "New Ad ₹299" to create another.')
                  loadData()
                }} size="icon" variant="ghost" className="h-7 w-7 text-red-500 hover:bg-red-950"><Trash2 className="h-3.5 w-3.5" /></Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Income Wallet */}
      <Card className="bg-gradient-to-br from-green-950/40 to-zinc-950 border-green-900/40">
        <CardContent className="p-6 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <Wallet className="h-10 w-10 text-green-500" />
            <div>
              <p className="text-xs text-zinc-400 uppercase tracking-wider">Wallet Balance</p>
              <p className="text-3xl font-black text-white">₹{(refData.walletBalance || 0).toLocaleString()}</p>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Button onClick={() => setShowPayout(true)} disabled={(refData.walletBalance || 0) < 100} className="bg-green-600 hover:bg-green-700 shadow-lg shadow-green-900/50">
              <Download className="h-4 w-4 mr-2" /> Withdraw to UPI/Bank
            </Button>
            <div className="text-right text-xs text-zinc-500 space-y-0.5">
              <p>Referral Earnings: ₹{(refData.totalEarned || 0).toLocaleString()}</p>
              <p>Total Referrals: {refData.totalReferrals}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payout History */}
      {payouts.length > 0 && (
        <Card className="bg-zinc-950 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2 text-base"><Download className="h-4 w-4 text-green-500" /> Withdrawal History</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {payouts.map(p => (
              <div key={p.id} className="flex items-center justify-between p-2 bg-zinc-900 rounded text-sm">
                <div>
                  <p className="text-white font-semibold">₹{p.amount.toLocaleString()} via {p.method.toUpperCase()}</p>
                  <p className="text-xs text-zinc-500">
                    {p.method === 'upi' ? p.upiId : `Acc: ****${p.accountNumber?.slice(-4)}`}
                    {' • '}{fmtTime(p.createdAt)}
                  </p>
                  {p.transactionId && <p className="text-xs text-green-500">TXN: {p.transactionId}</p>}
                </div>
                <Badge className={
                  p.status === 'paid' ? 'bg-green-700' :
                  p.status === 'approved' ? 'bg-blue-700' :
                  p.status === 'rejected' ? 'bg-red-700' : 'bg-yellow-700'
                }>{p.status}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Referral System */}
      <Card className="bg-gradient-to-br from-purple-950/40 via-zinc-950 to-zinc-950 border-purple-900/40">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Share2 className="h-5 w-5 text-purple-400" /> Referral Earnings
            <Badge className="bg-purple-600 ml-2">₹100 per signup</Badge>
          </CardTitle>
          <CardDescription className="text-zinc-400">Share your unique link. Every reporter who joins via your code earns you ₹100 instantly.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="bg-zinc-900 rounded-lg p-3 space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xs text-zinc-500 uppercase">Your Code:</span>
              <code className="font-mono font-bold text-purple-400 bg-purple-950/40 px-2 py-1 rounded">{refData.referralCode}</code>
            </div>
            <div className="flex items-center gap-2">
              <Input readOnly value={referralLink} className="bg-zinc-950 border-zinc-800 text-xs text-zinc-300 font-mono" />
              <Button onClick={copyRef} size="sm" className="bg-purple-600 hover:bg-purple-700 flex-shrink-0">
                <Share2 className="h-4 w-4 mr-1" /> Copy
              </Button>
              <Button onClick={shareWA} size="sm" className="bg-green-600 hover:bg-green-700 flex-shrink-0">
                <MessageCircle className="h-4 w-4 mr-1" /> WhatsApp
              </Button>
            </div>
          </div>
          {refData.referrals.length > 0 && (
            <div>
              <p className="text-sm font-semibold text-white mb-2">Your Referrals ({refData.totalReferrals})</p>
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {refData.referrals.map(r => (
                  <div key={r.id} className="flex items-center justify-between p-2 bg-zinc-900 rounded">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-7 w-7"><AvatarFallback className="bg-purple-700 text-xs">{r.referredUserName?.[0]}</AvatarFallback></Avatar>
                      <div>
                        <p className="text-sm text-white">{r.referredUserName}</p>
                        <p className="text-xs text-zinc-500">{fmtTime(r.createdAt)}</p>
                      </div>
                    </div>
                    <Badge className="bg-green-700">+₹{r.bonus}</Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Download Center */}
      <div>
        <h3 className="text-xl font-black text-white mb-3 flex items-center gap-2">
          <FileText className="h-5 w-5 text-red-500" /> Download Center
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {downloads.map(d => {
            const inner = (
              <>
                <d.icon className="h-6 w-6 text-white mb-2" />
                <p className="font-bold text-white text-sm">{d.name}</p>
                <p className="text-xs text-white/70 flex items-center gap-1"><Download className="h-3 w-3" /> {d.info || 'Download'}</p>
              </>
            )
            return d.onClick ? (
              <button key={d.name} onClick={d.onClick} className={`bg-gradient-to-br ${d.color} rounded-xl p-4 text-left hover:scale-105 transition-transform shadow-lg block w-full`}>
                {inner}
              </button>
            ) : (
              <a key={d.name} href={d.url} target="_blank" rel="noopener noreferrer" className={`bg-gradient-to-br ${d.color} rounded-xl p-4 text-left hover:scale-105 transition-transform shadow-lg block`}>
                {inner}
              </a>
            )
          })}
        </div>
      </div>

      {/* QUICK ACTIONS: New Updates, Operations, FAQs */}
      <ReporterQuickActions token={token} />

      {/* My News */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xl font-black text-white">My News Articles</h3>
          <Badge className="bg-yellow-600/90 text-black text-[10px] flex items-center gap-1">
            <Star className="h-3 w-3 fill-black" /> Feature any news for ₹499 (24h)
          </Badge>
        </div>
        <div className="space-y-2">
          {myNews.length === 0 && <p className="text-zinc-500 text-sm">No news published yet. Click "Publish News" to start.</p>}
          {myNews.map(n => {
            const featuredActive = n.isFeatured && n.featuredUntil && new Date(n.featuredUntil) > new Date()
            return (
              <Card key={n.id} className={`bg-zinc-950 ${featuredActive ? 'border-yellow-600/60 shadow-lg shadow-yellow-900/20' : 'border-zinc-800'}`}>
                <CardContent className="p-3 flex items-center gap-3 flex-wrap">
                  {n.images?.[0] && <img src={n.images[0]} className="h-14 w-20 object-cover rounded" />}
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-semibold text-sm line-clamp-1 flex items-center gap-1.5">
                      {featuredActive && <Star className="h-3 w-3 text-yellow-400 fill-yellow-400 flex-shrink-0" />}
                      {n.headline}
                    </p>
                    <p className="text-xs text-zinc-500">
                      {n.state} • {fmtTime(n.createdAt)} • {(n.views || 0).toLocaleString()} views
                      {featuredActive && <span className="ml-2 text-yellow-400 font-semibold">• Featured • {fmtRemaining(n.featuredUntil)}</span>}
                    </p>
                  </div>
                  <Badge className={n.status === 'approved' ? 'bg-green-700' : n.status === 'pending' ? 'bg-yellow-700' : 'bg-red-700'}>
                    {n.status}
                  </Badge>
                  {n.status === 'approved' && !featuredActive && (
                    <Button
                      size="sm"
                      onClick={() => featureNewsPayment(token, n, loadData)}
                      className="bg-gradient-to-r from-yellow-600 to-amber-600 hover:from-yellow-500 hover:to-amber-500 text-black font-bold text-xs h-8"
                    >
                      <Star className="h-3 w-3 mr-1 fill-black" /> Feature ₹499
                    </Button>
                  )}
                  {featuredActive && (
                    <Badge className="bg-yellow-500 text-black font-bold text-[10px] flex items-center gap-1">
                      <Star className="h-3 w-3 fill-black" /> FEATURED
                    </Badge>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      {creating && <NewsEditor token={token} user={user} onClose={() => { setCreating(false); loadData() }} />}
      {showPayout && <PayoutDialog token={token} walletBalance={refData.walletBalance || 0} onClose={(refresh) => { setShowPayout(false); if (refresh) loadData() }} />}
      {showAdCreator && <AdCreatorDialog token={token} user={user} onClose={(refresh) => { setShowAdCreator(false); if (refresh) loadData() }} />}
      {showSocial && <SocialPostDialog token={token} onClose={(refresh) => { setShowSocial(false); if (refresh) loadData() }} />}
      {showIdCard && <PressIDCard user={user} onClose={() => setShowIdCard(false)} />}
      {showDp && <SocialMediaDP user={user} onClose={() => setShowDp(false)} />}
    </div>
  )
}

// ============ NEWS EDITOR (with AI) ============
const NewsEditor = ({ token, user, onClose }) => {
  const [form, setForm] = useState({
    headline: '', summary: '', content: '', contentHtml: '', category: '', state: user.state || '', district: user.district || '',
    images: [], thumbnail: '', metaTitle: '', metaDescription: ''
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
    // AI spam check first
    try {
      const spamCheck = await fetch(`${API}/ai/spam-check`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ headline: form.headline, content: form.content })
      }).then(r => r.json())
      if (spamCheck.isSpam && spamCheck.confidence > 70) {
        toast.warning(`⚠️ AI Spam Warning (${spamCheck.confidence}%): ${spamCheck.reason}. Still submitting...`)
      }
    } catch {}
    const r = await fetch(`${API}/news`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(form)
    }).then(r => r.json())
    setSubmitting(false)
    if (r.news) {
      toast.success(user.role === 'admin' ? 'Published!' : 'Submitted for review!')
      // Offer to feature it (only when news is already approved — admin or auto-publish)
      if (r.news.status === 'approved') {
        const featStatus = await fetch(`${API}/featured`).then(r => r.json()).catch(() => ({}))
        if (!featStatus?.full) {
          setTimeout(() => {
            if (window.confirm(`✨ Want to feature this news on the Top 10 Featured section for 24 hours?\n\nPay just ₹499 to boost visibility now.\n\n${featStatus?.slotsUsed || 0}/10 slots currently filled.`)) {
              featureNewsPayment(token, r.news, onClose)
              return
            }
            onClose()
          }, 600)
          return
        }
      }
      onClose()
    }
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
              <span className="text-xs text-zinc-500">Rich editor with embeds (YouTube/Image)</span>
            </label>
            <RichEditor
              value={form.contentHtml || form.content}
              onChange={({ html, text }) => setForm({ ...form, contentHtml: html, content: text })}
              placeholder="Type or paste your full news content here (WhatsApp paste supported). Use the toolbar for headings, lists, images, YouTube embeds..."
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
                  <div key={i} className="relative group">
                    <img src={src} className={`h-20 w-28 object-cover rounded border-2 ${form.thumbnail === src ? 'border-yellow-500' : 'border-zinc-700'} cursor-pointer`} onClick={() => setForm({ ...form, thumbnail: src })} />
                    {form.thumbnail === src && <Badge className="absolute -top-2 left-1 bg-yellow-500 text-black text-[10px] gap-0.5"><Star className="h-2.5 w-2.5" /> Cover</Badge>}
                    <button onClick={() => setForm({ ...form, images: form.images.filter((_, j) => j !== i), thumbnail: form.thumbnail === src ? '' : form.thumbnail })} className="absolute -top-1 -right-1 bg-red-600 rounded-full p-0.5">
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
                <p className="text-[10px] text-zinc-500 w-full">Click an image to set as cover thumbnail ⭐</p>
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
const StatePage = ({ stateName, onBack, onArticle }) => {
  const [data, setData] = useState(null)
  useEffect(() => {
    fetch(`${API}/state/${encodeURIComponent(stateName)}`).then(r => r.json()).then(setData)
  }, [stateName])
  if (!data) return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-4">
      {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32 w-full bg-zinc-900" />)}
    </div>
  )
  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <Button onClick={onBack} variant="ghost" className="mb-4 text-white hover:bg-red-950">
        <ArrowLeft className="h-4 w-4 mr-2" /> Back
      </Button>
      <div className="bg-gradient-to-r from-red-700 to-red-900 rounded-2xl p-6 mb-6 shadow-2xl shadow-red-950/50">
        <div className="flex items-center gap-3">
          <Building2 className="h-10 w-10 text-white" />
          <div>
            <h1 className="text-3xl md:text-4xl font-black text-white">{stateName}</h1>
            <p className="text-red-100">{data.total} News Articles • {data.reporters.length} Reporters • {data.districts.length} Districts</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 mt-4">
          {data.districts.map(d => <Badge key={d} variant="outline" className="text-white border-white/40">{d}</Badge>)}
        </div>
      </div>

      <h2 className="text-2xl font-black text-white mb-4">Team in {stateName}</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        {data.reporters.length === 0 && (
          <Card className="bg-zinc-950 border-zinc-800 col-span-full">
            <CardContent className="p-6 text-center">
              <UserPlus className="h-8 w-8 mx-auto text-red-500 mb-2" />
              <p className="text-white font-bold">Vacancy Open!</p>
              <p className="text-zinc-400 text-sm mb-3">Be the first reporter in {stateName}</p>
              <Badge className="bg-red-600 animate-pulse">JOIN NOW</Badge>
            </CardContent>
          </Card>
        )}
        {data.reporters.map(r => (
          <Card key={r.id} className="bg-zinc-950 border-zinc-800 hover:border-red-600 transition-colors">
            <CardContent className="p-4 text-center">
              <Avatar className="h-16 w-16 mx-auto border-2 border-red-600 mb-2">
                <AvatarImage src={r.photo} />
                <AvatarFallback className="bg-red-700">{r.name?.[0]}</AvatarFallback>
              </Avatar>
              <p className="font-bold text-white text-sm">{r.name}</p>
              <p className="text-xs text-zinc-500">{r.designation}</p>
              <p className="text-xs text-red-500 mt-1">{r.district}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <h2 className="text-2xl font-black text-white mb-4">Latest News from {stateName}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {data.news.map(n => <NewsCard key={n.id} news={n} onClick={onArticle} />)}
      </div>
    </div>
  )
}

// ============ ANALYTICS PANEL ============
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
const JobsPage = ({ user, token, onBack }) => {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const load = async () => {
    setLoading(true)
    const r = await fetch(`${API}/posts`).then(r => r.json())
    setPosts(r.posts || []); setLoading(false)
  }
  useEffect(() => { load() }, [])

  const apply = async (postId) => {
    if (!user) return toast.error('Please login first')
    if (!token) return
    const r = await fetch(`${API}/posts/${postId}/apply`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
    }).then(r => r.json())
    if (r.ok) toast.success(r.message)
    else toast.error(r.error || 'Failed')
    load()
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 pb-24 md:pb-12">
      <Button onClick={onBack} variant="ghost" className="mb-4 text-white"><ArrowLeft className="h-4 w-4 mr-2" /> Back</Button>
      <div className="bg-gradient-to-r from-red-700 to-red-900 rounded-2xl p-6 mb-6 shadow-2xl shadow-red-950/50">
        <h1 className="text-3xl font-black text-white">Open Vacancies & Careers</h1>
        <p className="text-red-100 mt-1">Join India's biggest crime news network as a Reporter, Coordinator, or Member.</p>
      </div>
      {loading && <div className="text-center py-8"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></div>}
      {!loading && posts.length === 0 && <p className="text-zinc-500 text-center py-12">No open positions right now. Check back soon!</p>}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {posts.map(p => {
          const filled = p.availableSeats <= 0
          return (
            <Card key={p.id} className={`bg-zinc-950 border ${filled ? 'border-zinc-800' : 'border-red-900/40'} hover:border-red-600 transition-colors`}>
              <CardHeader>
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <CardTitle className="text-white text-lg">{p.name}</CardTitle>
                  <Badge className="bg-yellow-600">₹{p.joiningFee} fees</Badge>
                </div>
                <CardDescription className="text-zinc-400 flex items-center gap-2 flex-wrap">
                  <Badge variant="outline" className="capitalize text-red-400 border-red-900">{p.levelType} level</Badge>
                  {p.state && <span>📍 {p.state}{p.district ? ` › ${p.district}` : ''}{p.city ? ` › ${p.city}` : ''}</span>}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {p.description && <p className="text-sm text-zinc-300">{p.description}</p>}
                {p.responsibilities?.length > 0 && (
                  <div>
                    <p className="text-xs font-bold text-zinc-400 mb-1">Responsibilities:</p>
                    <ul className="space-y-0.5 text-sm text-zinc-300">
                      {p.responsibilities.map((r, i) => <li key={i}>• {r}</li>)}
                    </ul>
                  </div>
                )}
                <div className="bg-zinc-900 rounded-lg p-3 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-zinc-500">Vacancy</p>
                    <p className="text-lg font-black text-white">{p.filledSeats || 0} / {p.totalVacancy}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-zinc-500">Available Seats</p>
                    <p className={`text-lg font-black ${filled ? 'text-red-500' : 'text-green-500'}`}>{p.availableSeats}</p>
                  </div>
                </div>
                {filled ? (
                  <>
                    <Badge className="w-full justify-center bg-red-800 py-2">⛔ All Positions Filled</Badge>
                    <p className="text-xs text-zinc-500 italic text-center">This posting is occupied by approved members.</p>
                  </>
                ) : (
                  <Button onClick={() => apply(p.id)} className="w-full bg-red-600 hover:bg-red-700">Apply Now • ₹{p.joiningFee}</Button>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
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
  const [activeState, setActiveState] = useState(null)
  const [showPublish, setShowPublish] = useState(false)

  useEffect(() => {
    const t = localStorage.getItem('icn_token')
    const u = localStorage.getItem('icn_user')
    if (t && u) { setToken(t); setUser(JSON.parse(u)) }
    refreshSiteIdentity()  // boot-time logo/site name/tagline fetch (auto-seeds on backend if absent)
    const fetchBreaking = () => fetch(`${API}/breaking`).then(r => r.json()).then(d => setBreaking(d.breaking || []))
    fetchBreaking()
    const interval = setInterval(fetchBreaking, 15000)
    const onSettingsUpdate = () => refreshSiteIdentity()
    window.addEventListener('site-settings-updated', onSettingsUpdate)
    return () => { clearInterval(interval); window.removeEventListener('site-settings-updated', onSettingsUpdate) }
  }, [])

  const onLogin = (u) => {
    setUser(u)
    setToken(localStorage.getItem('icn_token'))
    setView(u.role === 'admin' ? 'admin' : 'dashboard')
    // Re-fetch identity on login (admin login auto-seeds site-settings via GET below)
    refreshSiteIdentity()
  }
  const onLogout = () => {
    localStorage.removeItem('icn_token')
    localStorage.removeItem('icn_user')
    setUser(null); setToken(null); setView('home')
    toast.info('Logged out')
  }
  const onArticle = (n) => { setArticle(n); setView('article'); window.scrollTo(0, 0) }
  const onState = (s) => { setActiveState(s); setView('state'); window.scrollTo(0, 0) }

  const handleNav = (v) => {
    if (v === 'publish') {
      if (!user) { setView('login'); toast.info('Please login first to publish'); return }
      setShowPublish(true)
    } else {
      setView(v)
      window.scrollTo(0, 0)
    }
  }

  return (
    <div className="min-h-screen bg-black pb-20 md:pb-12">
      <Header user={user} onLogout={onLogout} onNav={handleNav} view={view} />

      <AnimatePresence mode="wait">
        <motion.div key={view} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
          {view === 'home' && <HomeFeed onArticle={onArticle} onState={onState} onNav={handleNav} user={user} />}
          {view === 'article' && article && <ArticleView news={article} onBack={() => setView('home')} onState={onState} />}
          {view === 'state' && activeState && <StatePage stateName={activeState} onBack={() => setView('home')} onArticle={onArticle} />}
          {view === 'social' && (
            <div className="max-w-7xl mx-auto px-4 py-6 pb-24 md:pb-6">
              <h2 className="text-2xl md:text-3xl font-black text-white mb-4 flex items-center gap-2"><Play className="h-6 w-6 text-red-500" /> Reels & Video Feed</h2>
              <SocialFeed />
            </div>
          )}
          {view === 'jobs' && <JobsPage user={user} token={token} onBack={() => setView('home')} />}
          {view === 'login' && <LoginForm onLogin={onLogin} onNav={setView} />}
          {view === 'join' && <JoinForm onLogin={onLogin} onNav={setView} />}
          {view === 'dashboard' && user && <Dashboard user={user} token={token} />}
          {view === 'admin' && user?.role === 'admin' && <AdminPanel token={token} user={user} />}
        </motion.div>
      </AnimatePresence>

      {/* Floating publish button (mobile-friendly extra) */}
      {user && !showPublish && view !== 'dashboard' && (
        <button onClick={() => setShowPublish(true)} className="hidden md:flex fixed bottom-16 right-6 z-30 h-14 w-14 rounded-full bg-gradient-to-br from-red-600 to-red-800 items-center justify-center shadow-2xl shadow-red-900/60 hover:scale-110 transition-transform">
          <Plus className="h-7 w-7 text-white" />
        </button>
      )}

      {showPublish && user && <NewsEditor token={token} user={user} onClose={() => setShowPublish(false)} />}

      <BreakingTicker items={breaking} />
      <MobileBottomNav view={view} onNav={handleNav} user={user} />

      <footer className="hidden md:block mt-16 border-t border-zinc-900 bg-black py-8 px-4">
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
