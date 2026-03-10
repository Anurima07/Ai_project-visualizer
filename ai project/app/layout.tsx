import type { Metadata, Viewport } from 'next'
import { Geist, JetBrains_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { PWARegister } from '@/components/pwa-register'
import './globals.css'

const _geist = Geist({ subsets: ["latin"], variable: "--font-geist" });
const _jetbrainsMono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains" });

export const metadata: Metadata = {
  title: 'AI Search Visualizer',
  description: 'Interactive visualizations of classic AI search algorithms including Water Jug, N-Queens, N-Puzzle, Missionaries & Cannibals, and Vacuum Cleaner World.',
  generator: 'v0.app',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'AI Search Visualizer',
  },
  icons: {
    icon: [
      {
        url: '/icons/icon-192x192.jpg',
        sizes: '192x192',
        type: 'image/jpeg',
      },
      {
        url: '/icons/icon-512x512.jpg',
        sizes: '512x512',
        type: 'image/jpeg',
      },
    ],
    apple: '/icons/icon-192x192.jpg',
  },
}

export const viewport: Viewport = {
  themeColor: '#1a1a2e',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${_geist.variable} ${_jetbrainsMono.variable} font-sans antialiased`}>
        {children}
        <PWARegister />
        <Analytics />
      </body>
    </html>
  )
}
