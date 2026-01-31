'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Disc3, LayoutGrid } from 'lucide-react'
import { cn } from '@/lib/utils'

const tabs = [
  { name: 'Home', href: '/', icon: Home },
  { name: 'Music', href: '/music', icon: Disc3 },
  { name: 'Gallery', href: '/gallery', icon: LayoutGrid },
]

export default function TabBar() {
  const pathname = usePathname()

  // Hide tab bar on admin page
  if (pathname.startsWith('/admin')) {
    return null
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-black/90 backdrop-blur-lg border-t border-border z-50">
      <div className="max-w-lg mx-auto px-4">
        <div className="flex justify-around items-center h-16">
          {tabs.map((tab) => {
            const isActive = pathname === tab.href
            const Icon = tab.icon

            return (
              <Link
                key={tab.name}
                href={tab.href}
                className={cn(
                  'flex flex-col items-center justify-center gap-1 px-4 py-2 rounded-lg transition-all duration-200',
                  isActive
                    ? 'text-white'
                    : 'text-muted-foreground hover:text-white'
                )}
              >
                <Icon
                  className={cn(
                    'w-6 h-6 transition-transform duration-200',
                    isActive && 'scale-110'
                  )}
                />
                <span className="text-xs font-medium">{tab.name}</span>
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
