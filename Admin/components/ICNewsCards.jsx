'use client'
import { useRef, useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Loader2, Download, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

// Helper: dynamically load html2canvas + jspdf scripts from CDN
const ensureCaptureLibs = async () => {
  if (!window.html2canvas) {
    await new Promise((res, rej) => {
      const s = document.createElement('script')
      s.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js'
      s.onload = res; s.onerror = rej
      document.head.appendChild(s)
    })
  }
  if (!window.jspdf) {
    await new Promise((res, rej) => {
      const s = document.createElement('script')
      s.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'
      s.onload = res; s.onerror = rej
      document.head.appendChild(s)
    })
  }
}

// Generate QR code via public API (no extra libs)
const qrUrl = (data, size = 240) =>
  `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&margin=2&data=${encodeURIComponent(data)}`

const formatDate = (d) => {
  const dt = d ? new Date(d) : new Date()
  return dt.toLocaleDateString('en-GB').replace(/\//g, '/')
}

/* ============================================================
   PRESS ID CARD (Front + Back) — Pixel-perfect to reference
   Native template size: 768 × 1024 per side
   ============================================================ */
export const PressIDCard = ({ user, onClose }) => {
  const frontRef = useRef(null)
  const backRef  = useRef(null)
  const [busy, setBusy] = useState(false)
  const [imgLoaded, setImgLoaded] = useState({ front: false, back: false })

  const idNo = (user?.referralCode || '00001').toString().padStart(5, '0').slice(-5)
  const designation = (user?.designation || 'REPORTER').toUpperCase()
  const cardIssued = formatDate(user?.joinedAt || user?.createdAt)
  const validUpto = formatDate(new Date(Date.now() + 365 * 24 * 3600000))
  const fullName = (user?.name || 'REPORTER').toUpperCase()
  const phone = user?.mobile ? `+91 ${user.mobile}` : '+91 0000000000'
  const profileUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/reporter/${user?.id || ''}`
    : `https://icnewsmedia.com/reporter/${user?.id || ''}`

  // Capture single side as canvas at scale=2 (HD)
  const captureSide = async (ref) => {
    await ensureCaptureLibs()
    return await window.html2canvas(ref.current, {
      scale: 2,
      backgroundColor: '#ffffff',
      useCORS: true,
      allowTaint: true,
      logging: false,
      width: 768,
      height: 1024
    })
  }

  const downloadPDF = async () => {
    if (!imgLoaded.front || !imgLoaded.back) { toast.error('Template still loading…'); return }
    setBusy(true)
    try {
      const fCanvas = await captureSide(frontRef)
      const bCanvas = await captureSide(backRef)
      const { jsPDF } = window.jspdf
      // 86×135 mm = standard ID-card-ish portrait but our ref aspect 768:1024 = 3:4 → use A6 portrait
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: [76.8, 102.4] })
      pdf.addImage(fCanvas.toDataURL('image/jpeg', 0.95), 'JPEG', 0, 0, 76.8, 102.4)
      pdf.addPage([76.8, 102.4], 'portrait')
      pdf.addImage(bCanvas.toDataURL('image/jpeg', 0.95), 'JPEG', 0, 0, 76.8, 102.4)
      pdf.save(`PressID_${fullName.replace(/\s+/g, '_')}.pdf`)
      toast.success('Press ID Card downloaded!')
    } catch (e) {
      console.error(e); toast.error('Download failed: ' + e.message)
    }
    setBusy(false)
  }

  const downloadPNG = async () => {
    if (!imgLoaded.front || !imgLoaded.back) { toast.error('Template still loading…'); return }
    setBusy(true)
    try {
      const fCanvas = await captureSide(frontRef)
      const bCanvas = await captureSide(backRef)
      const dl = (canvas, name) => {
        const a = document.createElement('a')
        a.href = canvas.toDataURL('image/png')
        a.download = name
        a.click()
      }
      dl(fCanvas, `PressID_${fullName.replace(/\s+/g, '_')}_FRONT.png`)
      setTimeout(() => dl(bCanvas, `PressID_${fullName.replace(/\s+/g, '_')}_BACK.png`), 350)
      toast.success('Front + Back PNGs downloaded!')
    } catch (e) { toast.error('Download failed: ' + e.message) }
    setBusy(false)
  }

  return (
    <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm overflow-y-auto flex flex-col items-center py-6 px-2">
      {/* Toolbar */}
      <div className="sticky top-0 z-20 w-full max-w-3xl mb-4 flex justify-between items-center bg-zinc-950/90 backdrop-blur-md border border-zinc-800 rounded-xl px-4 py-3">
        <h2 className="text-white font-black text-lg">Press ID Card — Front + Back</h2>
        <div className="flex gap-2">
          <Button onClick={downloadPNG} disabled={busy} size="sm" className="bg-blue-600 hover:bg-blue-700">
            {busy ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Download className="h-4 w-4 mr-1" />} PNG
          </Button>
          <Button onClick={downloadPDF} disabled={busy} size="sm" className="bg-red-600 hover:bg-red-700">
            {busy ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Download className="h-4 w-4 mr-1" />} PDF
          </Button>
          <Button onClick={onClose} size="sm" variant="outline" className="border-zinc-700 bg-zinc-900 text-white"><X className="h-4 w-4" /></Button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-start justify-center w-full">
        {/* ============ FRONT SIDE ============ */}
        <div className="bg-white shadow-2xl flex-shrink-0">
          <div
            ref={frontRef}
            style={{ position: 'relative', width: '768px', height: '1024px', overflow: 'hidden', fontFamily: 'Arial, Helvetica, sans-serif', transform: 'scale(0.42)', transformOrigin: 'top left', marginRight: '-445px', marginBottom: '-595px' }}
          >
            {/* Background template (CLEAN — sample data wiped) */}
            <img
              src="/templates/icnews_idcard_front_clean.png"
              alt="ID Front"
              crossOrigin="anonymous"
              onLoad={() => setImgLoaded(s => ({ ...s, front: true }))}
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
            />

            {/* Photo (rectangle) — skip user.photo if it's a dicebear placeholder URL */}
            <div style={{ position: 'absolute', left: '65px', top: '278px', width: '300px', height: '380px', overflow: 'hidden', background: '#f0f0f0' }}>
              {user?.photo && !user.photo.includes('dicebear')
                ? <img src={user.photo} crossOrigin="anonymous" alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <div style={{ width: '100%', height: '100%', background: '#e5e5e5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '90px', color: '#666', fontWeight: 'bold', fontFamily: 'Arial' }}>{fullName[0]}</div>}
            </div>

            {/* NAME — wraps to 2 lines if long */}
            <div style={{ position: 'absolute', left: '500px', top: '420px', width: '240px', color: '#dc2626', fontSize: '18px', fontWeight: 900, lineHeight: '20px', textTransform: 'uppercase', letterSpacing: '0.3px' }}>
              {fullName}
            </div>

            {/* DESIGNATION value */}
            <div style={{ position: 'absolute', left: '525px', top: '497px', color: '#dc2626', fontSize: '17px', fontWeight: 900, letterSpacing: '0.5px', lineHeight: 1 }}>
              {designation}
            </div>

            {/* ID NO. */}
            <div style={{ position: 'absolute', left: '515px', top: '555px', color: '#dc2626', fontSize: '17px', fontWeight: 900, lineHeight: 1 }}>
              {idNo}
            </div>

            {/* CARD ISSUED */}
            <div style={{ position: 'absolute', left: '540px', top: '600px', color: '#dc2626', fontSize: '17px', fontWeight: 900, lineHeight: 1 }}>
              {cardIssued}
            </div>

            {/* VALID UPTO */}
            <div style={{ position: 'absolute', left: '540px', top: '655px', color: '#dc2626', fontSize: '17px', fontWeight: 900, lineHeight: 1 }}>
              {validUpto}
            </div>

            {/* DESIGNATION badge (red rounded rect) */}
            <div style={{ position: 'absolute', left: '60px', top: '633px', width: '280px', height: '64px', background: '#b91c1c', borderRadius: '10px', boxShadow: '0 4px 8px rgba(0,0,0,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 900, fontSize: '17px', letterSpacing: '1.2px', textAlign: 'center', padding: '0 8px' }}>
              {designation}
            </div>

            {/* QR Code */}
            <div style={{ position: 'absolute', left: '555px', top: '720px', width: '180px', height: '160px', background: '#fff' }}>
              <img src={qrUrl(profileUrl, 240)} crossOrigin="anonymous" alt="QR" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </div>
          </div>
        </div>

        {/* ============ BACK SIDE ============ */}
        <div className="bg-white shadow-2xl flex-shrink-0">
          <div
            ref={backRef}
            style={{ position: 'relative', width: '768px', height: '1024px', overflow: 'hidden', fontFamily: 'Arial, Helvetica, sans-serif', transform: 'scale(0.42)', transformOrigin: 'top left', marginRight: '-445px', marginBottom: '-595px' }}
          >
            <img
              src="/templates/icnews_idcard_back_clean.png"
              alt="ID Back"
              crossOrigin="anonymous"
              onLoad={() => setImgLoaded(s => ({ ...s, back: true }))}
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
            />
            {/* PHONE — user's mobile */}
            <div style={{ position: 'absolute', left: '170px', top: '742px', color: '#000', fontWeight: 700, fontSize: '17px', lineHeight: 1 }}>
              {phone}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}


/* ============================================================
   SOCIAL MEDIA DP / Profile Frame — Circular 1254 × 1254
   ============================================================ */
export const SocialMediaDP = ({ user, onClose }) => {
  const dpRef = useRef(null)
  const [busy, setBusy] = useState(false)
  const [loaded, setLoaded] = useState(false)

  const fullName = (user?.name || 'REPORTER').toUpperCase()
  const designation = (user?.designation || 'REPORTER').toUpperCase()
  const idNo = (user?.referralCode || '00001').toString().padStart(5, '0').slice(-5)
  const assigned = [user?.district || user?.city, user?.state].filter(Boolean).join(', ').toUpperCase() || 'INDIA'
  const mobile = user?.mobile ? `+91 ${user.mobile}` : '+91 0000000000'
  const joined = formatDate(user?.joinedAt || user?.createdAt)
  const profileUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/reporter/${user?.id || ''}`
    : `https://icnewsmedia.com/reporter/${user?.id || ''}`

  const download = async (fmt = 'png') => {
    if (!loaded) { toast.error('Template still loading…'); return }
    setBusy(true)
    try {
      await ensureCaptureLibs()
      const canvas = await window.html2canvas(dpRef.current, {
        scale: 2,
        backgroundColor: null,
        useCORS: true,
        allowTaint: true,
        logging: false,
        width: 1254,
        height: 1254
      })
      if (fmt === 'pdf') {
        const { jsPDF } = window.jspdf
        const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: [125, 125] })
        pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, 125, 125)
        pdf.save(`SocialDP_${fullName.replace(/\s+/g, '_')}.pdf`)
      } else {
        const a = document.createElement('a')
        a.href = canvas.toDataURL('image/png')
        a.download = `SocialDP_${fullName.replace(/\s+/g, '_')}.png`
        a.click()
      }
      toast.success(`DP downloaded as ${fmt.toUpperCase()}!`)
    } catch (e) { console.error(e); toast.error('Download failed: ' + e.message) }
    setBusy(false)
  }

  return (
    <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm overflow-y-auto flex flex-col items-center py-6 px-2">
      <div className="sticky top-0 z-20 w-full max-w-2xl mb-4 flex justify-between items-center bg-zinc-950/90 backdrop-blur-md border border-zinc-800 rounded-xl px-4 py-3">
        <h2 className="text-white font-black text-lg">Social Media DP</h2>
        <div className="flex gap-2">
          <Button onClick={() => download('png')} disabled={busy} size="sm" className="bg-blue-600 hover:bg-blue-700">
            {busy ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Download className="h-4 w-4 mr-1" />} PNG
          </Button>
          <Button onClick={() => download('pdf')} disabled={busy} size="sm" className="bg-red-600 hover:bg-red-700">
            {busy ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Download className="h-4 w-4 mr-1" />} PDF
          </Button>
          <Button onClick={onClose} size="sm" variant="outline" className="border-zinc-700 bg-zinc-900 text-white"><X className="h-4 w-4" /></Button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-2xl" style={{ transform: 'scale(0.45)', transformOrigin: 'top center', marginTop: '-340px' }}>
        <div
          ref={dpRef}
          style={{ position: 'relative', width: '1254px', height: '1254px', fontFamily: 'Arial, Helvetica, sans-serif' }}
        >
          {/* Template */}
          <img
            src="/templates/icnews_dp_clean.png"
            alt="DP Template"
            crossOrigin="anonymous"
            onLoad={() => setLoaded(true)}
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
          />

          {/* USER PHOTO (circular) */}
          <div style={{ position: 'absolute', left: '140px', top: '465px', width: '425px', height: '425px', borderRadius: '50%', overflow: 'hidden', background: '#f0f0f0' }}>
            {user?.photo && !user.photo.includes('dicebear')
              ? <img src={user.photo} crossOrigin="anonymous" alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <div style={{ width: '100%', height: '100%', background: '#e5e5e5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '180px', color: '#666', fontWeight: 'bold' }}>{fullName[0]}</div>}
          </div>

          {/* NAME (single first name in big black bold) */}
          <div style={{ position: 'absolute', left: '620px', top: '510px', width: '420px', color: '#000', fontSize: '70px', fontWeight: 900, letterSpacing: '2px', lineHeight: 1, textAlign: 'left' }}>
            {fullName.split(' ')[0]}
          </div>

          {/* ID NO value */}
          <div style={{ position: 'absolute', left: '860px', top: '637px', color: '#000', fontWeight: 700, fontSize: '28px', letterSpacing: '0.5px', lineHeight: 1 }}>
            {idNo}
          </div>

          {/* DESIGNATION value */}
          <div style={{ position: 'absolute', left: '860px', top: '707px', color: '#000', fontWeight: 700, fontSize: '26px', lineHeight: 1 }}>
            {designation}
          </div>

          {/* ASSIGNED AREA value */}
          <div style={{ position: 'absolute', left: '860px', top: '777px', color: '#000', fontWeight: 700, fontSize: '24px', lineHeight: 1 }}>
            {assigned}
          </div>

          {/* MOBILE NO value */}
          <div style={{ position: 'absolute', left: '860px', top: '845px', color: '#000', fontWeight: 700, fontSize: '24px', lineHeight: 1 }}>
            {mobile}
          </div>

          {/* JOINED ON value */}
          <div style={{ position: 'absolute', left: '860px', top: '915px', color: '#000', fontWeight: 700, fontSize: '24px', lineHeight: 1 }}>
            {joined}
          </div>

          {/* QR Code */}
          <div style={{ position: 'absolute', left: '545px', top: '1010px', width: '190px', height: '155px', background: '#fff', padding: '4px', borderRadius: '6px' }}>
            <img src={qrUrl(profileUrl, 320)} crossOrigin="anonymous" alt="QR" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </div>
        </div>
      </div>
    </div>
  )
}
