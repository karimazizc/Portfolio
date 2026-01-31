'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { galleryApi, GalleryMedia } from '@/lib/api'
import { X, Play, Loader2 } from 'lucide-react'

export default function GalleryPage() {
  const [isLightboxOpen, setIsLightboxOpen] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState<number>(0)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const mediaRefs = useRef<(HTMLDivElement | null)[]>([])

  const { data, isLoading, error } = useQuery({
    queryKey: ['gallery'],
    queryFn: () => galleryApi.getAll(),
  })

  const mediaItems = data?.media || []

  const openLightbox = (index: number) => {
    setSelectedIndex(index)
    setIsLightboxOpen(true)
  }

  const closeLightbox = () => {
    setIsLightboxOpen(false)
  }

  // Scroll to the selected image when lightbox opens
  useEffect(() => {
    if (isLightboxOpen && scrollContainerRef.current && mediaRefs.current[selectedIndex]) {
      // Small delay to ensure DOM is ready
      setTimeout(() => {
        mediaRefs.current[selectedIndex]?.scrollIntoView({
          behavior: 'instant',
          block: 'center',
        })
      }, 50)
    }
  }, [isLightboxOpen, selectedIndex])

  // Update selected index based on scroll position
  const handleScroll = useCallback(() => {
    if (!scrollContainerRef.current) return

    const container = scrollContainerRef.current
    const containerRect = container.getBoundingClientRect()
    const containerCenter = containerRect.top + containerRect.height / 2

    let closestIndex = 0
    let closestDistance = Infinity

    mediaRefs.current.forEach((ref, index) => {
      if (ref) {
        const rect = ref.getBoundingClientRect()
        const elementCenter = rect.top + rect.height / 2
        const distance = Math.abs(elementCenter - containerCenter)
        
        if (distance < closestDistance) {
          closestDistance = distance
          closestIndex = index
        }
      }
    })

    setSelectedIndex(closestIndex)
  }, [])

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') closeLightbox()
    if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
      e.preventDefault()
      if (selectedIndex > 0) {
        mediaRefs.current[selectedIndex - 1]?.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        })
      }
    }
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
      e.preventDefault()
      if (selectedIndex < mediaItems.length - 1) {
        mediaRefs.current[selectedIndex + 1]?.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        })
      }
    }
  }

  // Prevent body scroll when lightbox is open
  useEffect(() => {
    if (isLightboxOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isLightboxOpen])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <p className="text-muted-foreground">Failed to load gallery</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black pb-20">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-black/90 backdrop-blur-sm border-b border-border">
        <div className="max-w-lg mx-auto px-4 py-4">
          <h1 className="text-xl font-bold text-center text-white">Gallery</h1>
        </div>
      </header>

      {/* Grid */}
      <div className="max-w-lg mx-auto">
        {mediaItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-4">
            <p className="text-muted-foreground text-center">
              No photos or videos yet
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-0.5">
            {mediaItems.map((media, index) => (
              <button
                key={media.id}
                onClick={() => openLightbox(index)}
                className="relative aspect-square bg-zinc-900 overflow-hidden group focus:outline-none focus:ring-2 focus:ring-white focus:ring-inset"
              >
                {media.media_type === 'video' ? (
                  <>
                    {/* Video thumbnail or placeholder */}
                    {media.thumbnail_url ? (
                      <img
                        src={media.thumbnail_url}
                        alt={media.caption || 'Video thumbnail'}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <video
                        src={media.url}
                        className="w-full h-full object-cover"
                        muted
                        playsInline
                        preload="metadata"
                      />
                    )}
                    {/* Play indicator */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-10 h-10 rounded-full bg-black/50 flex items-center justify-center">
                        <Play className="w-5 h-5 text-white fill-white ml-0.5" />
                      </div>
                    </div>
                  </>
                ) : (
                  <img
                    src={media.url}
                    alt={media.caption || 'Gallery image'}
                    className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                    loading="lazy"
                  />
                )}
                
                {/* Hover overlay */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Infinite Scroll Lightbox */}
      {isLightboxOpen && (
        <div
          className="fixed inset-0 z-50 bg-black"
          onKeyDown={handleKeyDown}
          tabIndex={0}
        >
          {/* Close button */}
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 p-2 text-white/80 hover:text-white z-20 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Counter */}
          <div className="absolute top-4 left-4 text-white/60 text-sm z-20">
            {selectedIndex + 1} / {mediaItems.length}
          </div>

          {/* Scroll hint */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/40 text-xs z-20 flex flex-col items-center gap-1">
            <span>Scroll to browse</span>
            <div className="flex flex-col items-center animate-bounce">
              <div className="w-0.5 h-3 bg-white/40 rounded-full" />
              <div className="w-2 h-2 border-b border-r border-white/40 rotate-45 -mt-1" />
            </div>
          </div>

          {/* Scrollable container */}
          <div
            ref={scrollContainerRef}
            className="h-full overflow-y-auto snap-y snap-mandatory scrollbar-hide"
            onScroll={handleScroll}
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {mediaItems.map((media, index) => (
              <div
                key={media.id}
                ref={(el) => { mediaRefs.current[index] = el }}
                className="h-screen w-full flex flex-col items-center justify-center snap-center px-4"
              >
                <div className="max-w-4xl w-full flex flex-col items-center">
                  {media.media_type === 'video' ? (
                    <video
                      src={media.url}
                      controls
                      autoPlay={index === selectedIndex}
                      muted={index !== selectedIndex}
                      className="max-w-full max-h-[80vh] object-contain"
                      playsInline
                    />
                  ) : (
                    <img
                      src={media.url}
                      alt={media.caption || 'Gallery image'}
                      className="max-w-full max-h-[80vh] object-contain"
                      loading={Math.abs(index - selectedIndex) <= 2 ? 'eager' : 'lazy'}
                    />
                  )}
                  
                  {/* Caption */}
                  {media.caption && (
                    <p className="text-white/80 text-center mt-4 text-sm max-w-md">
                      {media.caption}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Side dots indicator */}
          <div className="absolute right-4 top-1/2 -translate-y-1/2 z-20 flex flex-col gap-1.5">
            {mediaItems.map((_, index) => (
              <button
                key={index}
                onClick={() => {
                  mediaRefs.current[index]?.scrollIntoView({
                    behavior: 'smooth',
                    block: 'center',
                  })
                }}
                className={`w-1.5 h-1.5 rounded-full transition-all ${
                  index === selectedIndex
                    ? 'bg-white scale-125'
                    : 'bg-white/30 hover:bg-white/50'
                }`}
                aria-label={`Go to image ${index + 1}`}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}