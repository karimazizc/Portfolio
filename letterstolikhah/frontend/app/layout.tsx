import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'
import TabBar from '@/components/TabBar'
import MiniPlayer from '@/components/MiniPlayer'
import { MusicPlayerProvider } from '@/contexts/MusicPlayerContext'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Letters to Likhah',
  description: 'A collection of letters and thoughts',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-black text-white min-h-screen`}>
        <Providers>
          <MusicPlayerProvider>
            <main className="pb-20">
              {children}
            </main>
            <MiniPlayer />
            <TabBar />
          </MusicPlayerProvider>
        </Providers>
      </body>
    </html>
  )
}
