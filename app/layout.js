import './globals.css'
import { Toaster } from '@/components/ui/sonner'

export const metadata = {
  title: 'IC News | सच्चाई की आवाज़',
  description: 'India\'s premier crime news network. Real-time updates, state-wise coverage, AI-powered journalism.',
  keywords: 'crime news India, breaking news, police, investigation, सच्चाई की आवाज़',
  manifest: '/manifest.json',
  themeColor: '#dc2626',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon-32.png', type: 'image/png', sizes: '32x32' },
      { url: '/favicon-64.png', type: 'image/png', sizes: '64x64' },
      { url: '/favicon-192.png', type: 'image/png', sizes: '192x192' },
      { url: '/branding/icn-logo.png', type: 'image/png', sizes: '2000x2000' }
    ],
    apple: [
      { url: '/favicon-192.png', sizes: '192x192', type: 'image/png' }
    ],
    shortcut: '/favicon.ico'
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black',
    title: 'IC News'
  },
  openGraph: {
    title: 'IC News - सच्चाई की आवाज़',
    description: 'India\'s biggest  news network',
    type: 'website'
  }
}

export const viewport = {
  themeColor: '#dc2626',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark">
      <body className="bg-black text-white antialiased">
        {children}
        <Toaster theme="dark" position="top-right" />
      </body>
    </html>
  )
}
