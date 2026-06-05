'use client'
import { useState, useEffect, useRef } from 'react'
import { toast } from 'sonner'
import {
  Youtube, Instagram, HelpCircle, Phone, MapPin, Mail, Send, X, Camera,
  Headphones, Clock, Loader2, Play, Image as ImageIcon, Video, FileText
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'

const API = (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_BASE_URL) ? `${process.env.NEXT_PUBLIC_BASE_URL}/api` : '/api'

/* ============================================================
   YOUTUBE 6-VIDEO GRID (Sticky thumbnails → in-place player)
   ============================================================ */
const YouTubeGrid = ({ videos }) => {
  const [playing, setPlaying] = useState({}) // idx -> true if playing
  const list = (videos || []).slice(0, 6)
  if (list.length === 0) return null
  return (
    <section className="mt-8">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xl md:text-2xl font-black text-white flex items-center gap-2">
          <Youtube className="h-6 w-6 text-red-600" /> YouTube Channel
          <span className="text-xs bg-red-600 text-white px-2 py-0.5 rounded-full font-bold ml-1">LIVE</span>
        </h2>
        <a
          href="https://youtube.com/@indiancrimenews"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-red-400 hover:text-red-300 font-semibold underline"
        >
          Subscribe →
        </a>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {list.map((v, i) => {
          const id = v.id
          return (
            <div
              key={id + i}
              className="relative aspect-video rounded-xl overflow-hidden bg-black border border-zinc-800 hover:border-red-600 transition-all shadow-lg group cursor-pointer"
              onClick={() => setPlaying(p => ({ ...p, [i]: true }))}
            >
              {playing[i] ? (
                <iframe
                  src={`https://www.youtube.com/embed/${id}?autoplay=1&rel=0`}
                  title={v.title || `Video ${i + 1}`}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  className="absolute inset-0 w-full h-full"
                />
              ) : (
                <>
                  <img
                    src={`https://img.youtube.com/vi/${id}/mqdefault.jpg`}
                    alt={v.title || `Video ${i + 1}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                    onError={(e) => { e.target.src = `https://img.youtube.com/vi/${id}/hqdefault.jpg` }}
                  />
                  <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 transition-colors" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="bg-red-600 group-hover:bg-red-500 rounded-full w-12 h-12 flex items-center justify-center shadow-2xl group-hover:scale-110 transition-all">
                      <Play className="h-5 w-5 text-white fill-white ml-0.5" />
                    </div>
                  </div>
                  {v.title && (
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/95 to-transparent p-2">
                      <p className="text-[11px] text-white font-semibold line-clamp-2">{v.title}</p>
                    </div>
                  )}
                </>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}

/* ============================================================
   INSTAGRAM SECTION
   ============================================================ */
const InstagramBox = ({ instagram }) => {
  if (!instagram?.url) return null
  return (
    <a
      href={instagram.url}
      target="_blank"
      rel="noopener noreferrer"
      className="mt-6 block rounded-2xl overflow-hidden bg-gradient-to-br from-purple-700 via-pink-600 to-orange-500 hover:scale-[1.01] transition-transform shadow-2xl"
    >
      <div className="flex items-center gap-4 p-5 md:p-6">
        <div className="bg-white/20 backdrop-blur-md rounded-2xl p-3 md:p-4 border border-white/30">
          <Instagram className="h-9 w-9 md:h-12 md:w-12 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white/80 text-xs font-bold uppercase tracking-wider">Follow us on Instagram</p>
          <p className="text-white text-xl md:text-2xl font-black truncate">{instagram.label || 'Indian Crime News'}</p>
          <p className="text-white/90 text-sm font-semibold">{instagram.handle || '@icnewsmedia'}</p>
        </div>
        <div className="bg-white text-purple-700 px-4 py-2 rounded-full font-bold text-sm shadow-lg hover:bg-zinc-100 transition-colors hidden sm:block">
          Follow
        </div>
      </div>
    </a>
  )
}

/* ============================================================
   HELP DIALOG — Hindi placeholders, media upload (photos + videos)
   ============================================================ */
const HelpDialog = ({ open, onClose }) => {
  const [form, setForm] = useState({ name: '', contact: '', query: '' })
  const [media, setMedia] = useState([]) // [{name, type, data(base64)}]
  const [busy, setBusy] = useState(false)
  const fileRef = useRef(null)

  const handleMedia = async (e) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return
    const newMedia = []
    for (const f of files) {
      if (f.size > 10 * 1024 * 1024) { toast.error(`${f.name} (10MB से बड़ी फ़ाइलें allowed नहीं)`); continue }
      const data = await new Promise(res => {
        const r = new FileReader()
        r.onload = () => res(r.result)
        r.readAsDataURL(f)
      })
      newMedia.push({ name: f.name, type: f.type, size: f.size, data })
    }
    setMedia(m => [...m, ...newMedia].slice(0, 5)) // max 5
    if (fileRef.current) fileRef.current.value = ''
  }

  const submit = async () => {
    if (!form.name || !form.contact || !form.query) {
      toast.error('कृपया Name, Contact और Query भरें')
      return
    }
    setBusy(true)
    try {
      const r = await fetch(`${API}/help`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, media })
      }).then(r => r.json())
      if (r.ok) {
        toast.success(r.message || 'धन्यवाद! आपका सन्देश भेज दिया गया है।')
        setForm({ name: '', contact: '', query: '' }); setMedia([])
        onClose()
      } else toast.error(r.error || 'सबमिट करने में समस्या आई')
    } catch { toast.error('Network error — कृपया दोबारा कोशिश करें') }
    setBusy(false)
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="bg-zinc-950 border-zinc-800 text-white max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black flex items-center gap-2">
            <HelpCircle className="h-6 w-6 text-red-500" /> सहायता / Help
          </DialogTitle>
          <DialogDescription className="text-zinc-400 text-sm">
            कृपया अपनी समस्या नीचे लिखें — हमारी टीम जल्द ही आपसे संपर्क करेगी।
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-zinc-400 mb-1 block">नाम <span className="text-red-500">*</span></label>
            <Input
              placeholder="अपना पूरा नाम लिखें (Eg: राजेश कुमार)"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              className="bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-600"
            />
          </div>
          <div>
            <label className="text-xs text-zinc-400 mb-1 block">संपर्क नंबर <span className="text-red-500">*</span></label>
            <Input
              placeholder="10 अंकों का मोबाइल नंबर लिखें (Eg: 9876543210)"
              value={form.contact}
              onChange={e => setForm({ ...form, contact: e.target.value })}
              className="bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-600"
              inputMode="numeric"
            />
          </div>
          <div>
            <label className="text-xs text-zinc-400 mb-1 block">समस्या / प्रश्न <span className="text-red-500">*</span></label>
            <Textarea
              rows={4}
              placeholder="कृपया अपनी समस्या या प्रश्न विस्तार से लिखें — जैसे, 'मुझे रिपोर्टर ज्वाइनिंग में दिक्कत आ रही है' या 'अपनी न्यूज़ अपडेट करनी है'..."
              value={form.query}
              onChange={e => setForm({ ...form, query: e.target.value })}
              className="bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-600 resize-none"
            />
          </div>
          {/* Media uploader */}
          <div>
            <label className="text-xs text-zinc-400 mb-1 block">फ़ोटो / वीडियो (वैकल्पिक) — Maximum 5 files, 10MB each</label>
            <input
              ref={fileRef}
              type="file"
              accept="image/*,video/*"
              multiple
              onChange={handleMedia}
              className="hidden"
              id="help-media"
            />
            <label
              htmlFor="help-media"
              className="cursor-pointer flex items-center justify-center gap-2 border-2 border-dashed border-red-900/50 hover:border-red-500 hover:bg-red-950/20 rounded-lg p-3 text-sm text-zinc-400 transition-colors"
            >
              <Camera className="h-4 w-4" /> फ़ोटो / वीडियो जोड़ें
            </label>
            {media.length > 0 && (
              <div className="mt-2 grid grid-cols-3 gap-2">
                {media.map((m, i) => (
                  <div key={i} className="relative aspect-square bg-zinc-900 rounded-md overflow-hidden border border-zinc-800">
                    {m.type.startsWith('image/') ? (
                      <img src={m.data} alt={m.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-zinc-500">
                        <Video className="h-7 w-7" />
                        <span className="text-[9px] mt-1 px-1 truncate">{m.name.slice(0, 12)}</span>
                      </div>
                    )}
                    <button
                      onClick={() => setMedia(media.filter((_, j) => j !== i))}
                      className="absolute top-1 right-1 bg-red-600 hover:bg-red-700 rounded-full p-0.5"
                    >
                      <X className="h-3 w-3 text-white" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="flex gap-2 pt-2">
            <Button variant="outline" onClick={onClose} className="flex-1 border-zinc-700 bg-zinc-900 text-white">रद्द करें</Button>
            <Button onClick={submit} disabled={busy} className="flex-1 bg-red-600 hover:bg-red-700">
              {busy ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Send className="h-4 w-4 mr-1" />}
              भेजें / Submit
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

/* ============================================================
   SUPPORT TEAM DIALOG
   ============================================================ */
const SupportTeamDialog = ({ open, onClose, supportTeam }) => {
  const members = supportTeam?.members || []
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="bg-zinc-950 border-zinc-800 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black flex items-center gap-2">
            <Headphones className="h-6 w-6 text-green-500" /> Support Team
          </DialogTitle>
          <DialogDescription className="text-zinc-400 text-sm flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" /> कार्य समय: {supportTeam?.timeStart || '11:00 AM'} – {supportTeam?.timeEnd || '6:00 PM'}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          {members.length === 0 && <p className="text-zinc-500 text-sm py-4 text-center">कोई सहायक उपलब्ध नहीं</p>}
          {members.map((m, i) => (
            <a
              key={i}
              href={`tel:${(m.mobile || '').replace(/\s/g, '')}`}
              className="flex items-center gap-3 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-xl p-3 transition-colors"
            >
              <div className="bg-green-600/20 border border-green-600/40 rounded-full p-2.5">
                <Phone className="h-5 w-5 text-green-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-white truncate">{m.name}</p>
                <p className="text-xs text-zinc-500">{m.role || 'Support Member'}</p>
              </div>
              <span className="text-green-400 font-mono font-semibold text-sm">{m.mobile}</span>
            </a>
          ))}
        </div>
        <p className="text-[11px] text-zinc-500 text-center pt-2">
          कृपया कार्य समय में ही कॉल करें।
        </p>
      </DialogContent>
    </Dialog>
  )
}

/* ============================================================
   QUICK-ACTION CARDS (HELP, SUPPORT, CONTACT)
   ============================================================ */
const QuickActionCards = ({ contact, supportTeam, onHelp, onSupport }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-6">
      {/* HELP */}
      <button
        onClick={onHelp}
        className="text-left bg-gradient-to-br from-red-700 to-red-900 hover:from-red-600 hover:to-red-800 rounded-2xl p-5 shadow-xl transition-all hover:-translate-y-1 group"
      >
        <div className="flex items-center gap-3 mb-2">
          <div className="bg-white/20 rounded-full p-2.5"><HelpCircle className="h-6 w-6 text-white" /></div>
          <span className="text-white text-xl font-black">HELP</span>
        </div>
        <p className="text-red-100 text-sm">कोई समस्या? सहायता के लिए संपर्क करें — हमें अपनी क्वेरी, फोटो और वीडियो भेजें।</p>
        <p className="text-white/90 text-xs mt-2 font-semibold opacity-0 group-hover:opacity-100 transition-opacity">Open Help Form →</p>
      </button>

      {/* SUPPORT TEAM */}
      <button
        onClick={onSupport}
        className="text-left bg-gradient-to-br from-green-700 to-emerald-900 hover:from-green-600 hover:to-emerald-800 rounded-2xl p-5 shadow-xl transition-all hover:-translate-y-1 group"
      >
        <div className="flex items-center gap-3 mb-2">
          <div className="bg-white/20 rounded-full p-2.5"><Headphones className="h-6 w-6 text-white" /></div>
          <span className="text-white text-xl font-black">SUPPORT TEAM</span>
        </div>
        <p className="text-green-100 text-sm">{(supportTeam?.members || []).length} सहायक उपलब्ध</p>
        <p className="text-white/90 text-xs mt-1 flex items-center gap-1">
          <Clock className="h-3 w-3" /> {supportTeam?.timeStart || '11 AM'} – {supportTeam?.timeEnd || '6 PM'}
        </p>
      </button>

      {/* CONTACT US — info card (not a popup) */}
      <div className="bg-gradient-to-br from-zinc-800 to-zinc-900 border border-zinc-700 rounded-2xl p-5 shadow-xl">
        <div className="flex items-center gap-3 mb-3">
          <div className="bg-yellow-600/20 border border-yellow-600/40 rounded-full p-2.5"><Send className="h-5 w-5 text-yellow-400" /></div>
          <span className="text-white text-xl font-black">CONTACT US</span>
        </div>
        <div className="space-y-2 text-sm">
          {contact?.address && (
            <div className="flex items-start gap-2 text-zinc-300">
              <MapPin className="h-3.5 w-3.5 text-red-400 mt-0.5 flex-shrink-0" />
              <span className="text-xs leading-relaxed">{contact.address}</span>
            </div>
          )}
          {contact?.email && (
            <a href={`mailto:${contact.email}`} className="flex items-center gap-2 text-zinc-300 hover:text-yellow-400">
              <Mail className="h-3.5 w-3.5 text-blue-400 flex-shrink-0" />
              <span className="text-xs truncate">{contact.email}</span>
            </a>
          )}
          {(contact?.phones || []).map((p, i) => (
            <a key={i} href={`tel:${p.replace(/\s/g, '')}`} className="flex items-center gap-2 text-zinc-300 hover:text-yellow-400">
              <Phone className="h-3.5 w-3.5 text-green-400 flex-shrink-0" />
              <span className="text-xs font-mono">{p}</span>
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ============================================================
   MAIN EXPORT — community sections to render below "Load More News"
   ============================================================ */
export default function CommunitySections() {
  const [settings, setSettings] = useState(null)
  const [showHelp, setShowHelp] = useState(false)
  const [showSupport, setShowSupport] = useState(false)

  useEffect(() => {
    fetch(`${API}/site-settings`).then(r => r.json()).then(setSettings).catch(() => {})
  }, [])

  if (!settings) return null
  return (
    <>
      <YouTubeGrid videos={settings.youtubeVideos} />
      <InstagramBox instagram={settings.instagram} />
      <QuickActionCards
        contact={settings.contact}
        supportTeam={settings.supportTeam}
        onHelp={() => setShowHelp(true)}
        onSupport={() => setShowSupport(true)}
      />
      <HelpDialog open={showHelp} onClose={() => setShowHelp(false)} />
      <SupportTeamDialog open={showSupport} onClose={() => setShowSupport(false)} supportTeam={settings.supportTeam} />
    </>
  )
}

/* ============================================================
   ADMIN SITE SETTINGS EDITOR — Manage YouTube/Insta/Support/Contact
   ============================================================ */
export const AdminSiteSettings = ({ token }) => {
  const [s, setS] = useState(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    fetch(`${API}/site-settings`).then(r => r.json()).then(setS).catch(() => {})
  }, [])

  const save = async () => {
    setBusy(true)
    const r = await fetch(`${API}/site-settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(s)
    }).then(r => r.json())
    if (r.ok) {
      toast.success('Site Settings saved! Logo/branding updated site-wide.')
      // Notify any global listeners to re-fetch site identity (logo/name/tagline)
      window.dispatchEvent(new CustomEvent('site-settings-updated'))
    }
    else toast.error(r.error || 'Save failed')
    setBusy(false)
  }

  if (!s) return <div className="text-zinc-500 p-4">Loading...</div>

  const update = (path, val) => setS(prev => {
    const next = JSON.parse(JSON.stringify(prev))
    const keys = path.split('.')
    let cur = next
    for (let i = 0; i < keys.length - 1; i++) cur = cur[keys[i]]
    cur[keys[keys.length - 1]] = val
    return next
  })

  return (
    <div className="space-y-6">
      {/* BRANDING — Logo, Site Name, Tagline */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4">
        <h3 className="font-bold text-white mb-3 flex items-center gap-2"><FileText className="h-5 w-5 text-red-500" /> Branding (Logo & Site Identity)</h3>
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-shrink-0 flex flex-col items-center gap-2">
            <div className="w-32 h-32 rounded-xl bg-zinc-900 border border-zinc-800 overflow-hidden flex items-center justify-center">
              {s.logo ? <img src={s.logo} alt="Logo" className="w-full h-full object-contain" /> : <span className="text-zinc-600 text-xs">No logo</span>}
            </div>
            <input
              type="file"
              accept="image/*"
              id="logo-upload"
              className="hidden"
              onChange={async (e) => {
                const f = e.target.files?.[0]
                if (!f) return
                if (f.size > 5 * 1024 * 1024) { toast.error('Max 5MB allowed'); return }
                const data = await new Promise(res => { const r = new FileReader(); r.onload = () => res(r.result); r.readAsDataURL(f) })
                update('logo', data)
                toast.success('Logo loaded — click "Save All" to apply site-wide')
              }}
            />
            <label htmlFor="logo-upload" className="text-xs text-red-400 hover:text-red-300 cursor-pointer underline">Upload new logo</label>
            {s.logo && (
              <button onClick={() => update('logo', '')} className="text-[10px] text-zinc-500 hover:text-red-400">Remove</button>
            )}
          </div>
          <div className="flex-1 space-y-2">
            <div>
              <label className="text-[11px] text-zinc-400 block mb-1">Site Name</label>
              <Input placeholder="e.g. Indian Crime News" value={s.siteName || ''} onChange={e => update('siteName', e.target.value)} className="bg-zinc-900 border-zinc-800 text-white" />
            </div>
            <div>
              <label className="text-[11px] text-zinc-400 block mb-1">Tagline (Hindi/English)</label>
              <Input placeholder="e.g. सच्चाई की आवाज़" value={s.tagline || ''} onChange={e => update('tagline', e.target.value)} className="bg-zinc-900 border-zinc-800 text-white" />
            </div>
            <p className="text-[11px] text-zinc-500">PNG/JPG/SVG up to 5MB. Transparent PNG recommended.</p>
          </div>
        </div>
      </div>

      {/* YOUTUBE */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4">
        <h3 className="font-bold text-white mb-3 flex items-center gap-2"><Youtube className="h-5 w-5 text-red-500" /> YouTube Videos (6 thumbnails)</h3>
        <div className="space-y-2">
          {(s.youtubeVideos || Array(6).fill({ id: '', title: '' })).slice(0, 6).map((v, i) => (
            <div key={i} className="flex gap-2 items-start">
              <span className="text-zinc-500 text-xs w-6 pt-2">#{i + 1}</span>
              <Input
                placeholder="YouTube Video ID (eg: dQw4w9WgXcQ) or full URL"
                value={v.id || ''}
                onChange={e => {
                  const raw = e.target.value
                  const m = raw.match(/(?:v=|youtu\.be\/|embed\/)([a-zA-Z0-9_-]{11})/)
                  const id = m ? m[1] : raw
                  const arr = [...(s.youtubeVideos || [])]; arr[i] = { ...arr[i], id }
                  setS({ ...s, youtubeVideos: arr })
                }}
                className="bg-zinc-900 border-zinc-800 text-white font-mono text-sm"
              />
              <Input
                placeholder="Title (optional)"
                value={v.title || ''}
                onChange={e => {
                  const arr = [...(s.youtubeVideos || [])]; arr[i] = { ...arr[i], title: e.target.value }
                  setS({ ...s, youtubeVideos: arr })
                }}
                className="bg-zinc-900 border-zinc-800 text-white text-sm"
              />
            </div>
          ))}
        </div>
      </div>

      {/* INSTAGRAM */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4">
        <h3 className="font-bold text-white mb-3 flex items-center gap-2"><Instagram className="h-5 w-5 text-pink-500" /> Instagram</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <Input placeholder="URL (e.g. https://instagram.com/icnewsmedia)" value={s.instagram?.url || ''} onChange={e => update('instagram.url', e.target.value)} className="bg-zinc-900 border-zinc-800 text-white" />
          <Input placeholder="Handle (e.g. @icnewsmedia)" value={s.instagram?.handle || ''} onChange={e => update('instagram.handle', e.target.value)} className="bg-zinc-900 border-zinc-800 text-white" />
          <Input placeholder="Display Label" value={s.instagram?.label || ''} onChange={e => update('instagram.label', e.target.value)} className="bg-zinc-900 border-zinc-800 text-white" />
        </div>
      </div>

      {/* SUPPORT TEAM */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4">
        <h3 className="font-bold text-white mb-3 flex items-center gap-2"><Headphones className="h-5 w-5 text-green-500" /> Support Team</h3>
        <div className="grid grid-cols-2 gap-2 mb-3">
          <Input placeholder="Start Time (e.g. 11:00 AM)" value={s.supportTeam?.timeStart || ''} onChange={e => update('supportTeam.timeStart', e.target.value)} className="bg-zinc-900 border-zinc-800 text-white" />
          <Input placeholder="End Time (e.g. 6:00 PM)" value={s.supportTeam?.timeEnd || ''} onChange={e => update('supportTeam.timeEnd', e.target.value)} className="bg-zinc-900 border-zinc-800 text-white" />
        </div>
        <div className="space-y-2">
          {(s.supportTeam?.members || []).map((m, i) => (
            <div key={i} className="grid grid-cols-12 gap-2 items-center">
              <Input placeholder="Name" value={m.name || ''} onChange={e => { const arr = [...s.supportTeam.members]; arr[i] = { ...m, name: e.target.value }; update('supportTeam.members', arr) }} className="col-span-3 bg-zinc-900 border-zinc-800 text-white" />
              <Input placeholder="Role" value={m.role || ''} onChange={e => { const arr = [...s.supportTeam.members]; arr[i] = { ...m, role: e.target.value }; update('supportTeam.members', arr) }} className="col-span-3 bg-zinc-900 border-zinc-800 text-white" />
              <Input placeholder="Mobile (+91 ...)" value={m.mobile || ''} onChange={e => { const arr = [...s.supportTeam.members]; arr[i] = { ...m, mobile: e.target.value }; update('supportTeam.members', arr) }} className="col-span-5 bg-zinc-900 border-zinc-800 text-white font-mono" />
              <Button size="sm" variant="outline" className="col-span-1 border-red-700 bg-red-950/30 text-red-400" onClick={() => { update('supportTeam.members', s.supportTeam.members.filter((_, j) => j !== i)) }}>
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}
          <Button size="sm" variant="outline" className="border-green-700 bg-green-950/30 text-green-400 hover:bg-green-900/40" onClick={() => update('supportTeam.members', [...(s.supportTeam?.members || []), { name: '', role: '', mobile: '' }])}>
            + Add Support Member
          </Button>
        </div>
      </div>

      {/* CONTACT */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4">
        <h3 className="font-bold text-white mb-3 flex items-center gap-2"><Send className="h-5 w-5 text-yellow-500" /> Contact Us</h3>
        <Textarea rows={3} placeholder="Full Address" value={s.contact?.address || ''} onChange={e => update('contact.address', e.target.value)} className="bg-zinc-900 border-zinc-800 text-white mb-2 resize-none" />
        <Input placeholder="Email" value={s.contact?.email || ''} onChange={e => update('contact.email', e.target.value)} className="bg-zinc-900 border-zinc-800 text-white mb-2" />
        <div className="space-y-1">
          {(s.contact?.phones || []).map((p, i) => (
            <div key={i} className="flex gap-2">
              <Input placeholder="Phone (e.g. +91 9876543210)" value={p} onChange={e => { const arr = [...s.contact.phones]; arr[i] = e.target.value; update('contact.phones', arr) }} className="bg-zinc-900 border-zinc-800 text-white font-mono" />
              <Button size="sm" variant="outline" className="border-red-700 bg-red-950/30 text-red-400" onClick={() => update('contact.phones', s.contact.phones.filter((_, j) => j !== i))}><X className="h-3 w-3" /></Button>
            </div>
          ))}
          <Button size="sm" variant="outline" className="border-green-700 bg-green-950/30 text-green-400 hover:bg-green-900/40" onClick={() => update('contact.phones', [...(s.contact?.phones || []), ''])}>
            + Add Phone
          </Button>
        </div>
      </div>

      <Button onClick={save} disabled={busy} className="w-full bg-red-600 hover:bg-red-700 font-bold">
        {busy ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />} Save All Site Settings
      </Button>
    </div>
  )
}
