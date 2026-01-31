'use client'

import { useState } from 'react'
import { Play, Pause, SkipForward, SkipBack, X, Music as MusicIcon } from 'lucide-react'
import { useMusicPlayer } from '@/contexts/MusicPlayerContext'
import { cn } from '@/lib/utils'
import { usePathname } from 'next/navigation'

export default function MiniPlayer() {
  const {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    togglePlay,
    nextTrack,
    previousTrack,
    tracks,
    currentTrackIndex,
    pause,
  } = useMusicPlayer()
  
  const [isExpanded, setIsExpanded] = useState(false)
  const pathname = usePathname()

  // Hide on admin page or music page
  if (pathname.startsWith('/admin') || pathname === '/music' || !currentTrack) {
    return null
  }

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  const handleStop = () => {
    pause()
    setIsExpanded(false)
  }

  return (
    <div className={cn(
      "fixed left-0 right-0 z-40 transition-all duration-300",
      isExpanded ? "bottom-16" : "bottom-16"
    )}>
      <div className="max-w-lg mx-auto px-4">
        <div className={cn(
          "bg-zinc-900/95 backdrop-blur-lg border border-border rounded-xl overflow-hidden transition-all duration-300",
          isExpanded ? "shadow-2xl" : "shadow-lg"
        )}>
          {/* Progress bar */}
          <div className="h-0.5 bg-zinc-800 relative">
            <div
              className="h-full bg-white transition-all duration-100"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Compact view */}
          <div
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-3 p-3 cursor-pointer"
          >
            {/* Cover */}
            <div className="w-10 h-10 rounded-lg overflow-hidden bg-zinc-800 flex-shrink-0">
              {currentTrack.cover_url ? (
                <img
                  src={currentTrack.cover_url}
                  alt={currentTrack.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <MusicIcon className="w-5 h-5 text-zinc-600" />
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {currentTrack.title}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {currentTrack.artist || 'Unknown Artist'}
              </p>
            </div>

            {/* Play/Pause */}
            <button
              onClick={(e) => {
                e.stopPropagation()
                togglePlay()
              }}
              className="w-8 h-8 rounded-full bg-white flex items-center justify-center hover:bg-gray-100 transition-colors flex-shrink-0"
            >
              {isPlaying ? (
                <Pause className="w-4 h-4 text-black" />
              ) : (
                <Play className="w-4 h-4 text-black ml-0.5" />
              )}
            </button>
          </div>

          {/* Expanded view */}
          {isExpanded && (
            <div className="px-4 pb-4 space-y-3 border-t border-border pt-3">
              {/* Time */}
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>

              {/* Controls */}
              <div className="flex items-center justify-center gap-4">
                <button
                  onClick={previousTrack}
                  disabled={currentTrackIndex === 0}
                  className={cn(
                    'p-2 transition-colors',
                    currentTrackIndex === 0
                      ? 'text-zinc-700 cursor-not-allowed'
                      : 'text-white/80 hover:text-white'
                  )}
                >
                  <SkipBack className="w-5 h-5" />
                </button>

                <button
                  onClick={togglePlay}
                  className="w-12 h-12 rounded-full bg-white flex items-center justify-center hover:bg-gray-100 transition-colors"
                >
                  {isPlaying ? (
                    <Pause className="w-5 h-5 text-black" />
                  ) : (
                    <Play className="w-5 h-5 text-black ml-0.5" />
                  )}
                </button>

                <button
                  onClick={nextTrack}
                  disabled={currentTrackIndex === tracks.length - 1}
                  className={cn(
                    'p-2 transition-colors',
                    currentTrackIndex === tracks.length - 1
                      ? 'text-zinc-700 cursor-not-allowed'
                      : 'text-white/80 hover:text-white'
                  )}
                >
                  <SkipForward className="w-5 h-5" />
                </button>

                <button
                  onClick={handleStop}
                  className="p-2 text-white/60 hover:text-white transition-colors"
                  title="Stop"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
