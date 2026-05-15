import './globals.css'
import { Toaster } from '@/components/ui/sonner'

export const metadata = {
  title: 'Indian Crime News | सच्चाई की आवाज़',
  description: 'India\'s premier crime news network. Real-time updates, state-wise coverage, AI-powered journalism.',
  keywords: 'crime news India, breaking news, police, investigation, सच्चाई की आवाज़',
  manifest: '/manifest.json',
  themeColor: '#dc2626',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black',
    title: 'ICN News'
  },
  openGraph: {
    title: 'Indian Crime News - सच्चाई की आवाज़',
    description: 'India\'s biggest crime news network',
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
