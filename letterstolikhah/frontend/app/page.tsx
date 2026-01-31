import { Suspense } from 'react'
import PostList from '@/components/PostList'
import LoadingSpinner from '@/components/LoadingSpinner'

export const revalidate = 60 // Revalidate every 60 seconds (ISR)

export default function HomePage() {
  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <header className="border-b border-border sticky top-0 bg-black/80 backdrop-blur-sm z-10">
        <div className="max-w-2xl mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold text-white">Letters to Likhah</h1>
          <p className="text-muted-foreground text-sm mt-1">
            by Karim
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 py-6">
        <Suspense fallback={<LoadingSpinner />}>
          <PostList />
        </Suspense>
      </main>
    </div>
  )
}
