'use client'

import { useMusicPlayer } from '@/contexts/MusicPlayerContext'
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function MusicPage() {
  const {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    tracks,
    currentTrackIndex,
    togglePlay,
    previousTrack,
    nextTrack,
    seekTo,
    setVolume,
    toggleMute,
    playTrack,
  } = useMusicPlayer()

  // Format time
  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  if (!currentTrack || tracks.length === 0) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center pb-20">
        <div className="w-48 h-48 mb-8">
          <VinylRecord isPlaying={false} coverUrl={null} />
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Music</h1>
        <p className="text-muted-foreground">No tracks available</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center pb-20 px-4">
      {/* Vinyl Record */}
      <div className="w-64 h-64 sm:w-80 sm:h-80 mb-8">
        <VinylRecord isPlaying={isPlaying} coverUrl={currentTrack?.cover_url} />
      </div>

      {/* Track Info */}
      <div className="text-center mb-6 max-w-sm">
        <h2 className="text-xl sm:text-2xl font-bold text-white truncate">
          {currentTrack?.title || 'Unknown Track'}
        </h2>
        <p className="text-muted-foreground truncate">
          {currentTrack?.artist || 'Unknown Artist'}
        </p>
      </div>

      {/* Progress Bar */}
      <div className="w-full max-w-sm mb-4">
        <input
          type="range"
          min={0}
          max={duration || 100}
          value={currentTime}
          onChange={(e) => seekTo(parseFloat(e.target.value))}
          className="w-full h-1 bg-zinc-800 rounded-full appearance-none cursor-pointer accent-white
            [&::-webkit-slider-thumb]:appearance-none
            [&::-webkit-slider-thumb]:w-3
            [&::-webkit-slider-thumb]:h-3
            [&::-webkit-slider-thumb]:rounded-full
            [&::-webkit-slider-thumb]:bg-white"
        />
        <div className="flex justify-between text-xs text-muted-foreground mt-1">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-6 mb-6">
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
          <SkipBack className="w-6 h-6" />
        </button>

        <button
          onClick={togglePlay}
          className="w-16 h-16 rounded-full bg-white flex items-center justify-center hover:bg-white/90 transition-colors"
        >
          {isPlaying ? (
            <Pause className="w-7 h-7 text-black" />
          ) : (
            <Play className="w-7 h-7 text-black ml-1" />
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
          <SkipForward className="w-6 h-6" />
        </button>
      </div>

      {/* Volume Control */}
      <div className="flex items-center gap-2 w-full max-w-[200px]">
        <button
          onClick={toggleMute}
          className="text-white/60 hover:text-white transition-colors"
        >
          {isMuted || volume === 0 ? (
            <VolumeX className="w-5 h-5" />
          ) : (
            <Volume2 className="w-5 h-5" />
          )}
        </button>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={isMuted ? 0 : volume}
          onChange={(e) => setVolume(parseFloat(e.target.value))}
          className="flex-1 h-1 bg-zinc-800 rounded-full appearance-none cursor-pointer accent-white
            [&::-webkit-slider-thumb]:appearance-none
            [&::-webkit-slider-thumb]:w-3
            [&::-webkit-slider-thumb]:h-3
            [&::-webkit-slider-thumb]:rounded-full
            [&::-webkit-slider-thumb]:bg-white"
        />
      </div>

      {/* Track List (collapsible on mobile) */}
      {tracks.length > 1 && (
        <div className="w-full max-w-sm mt-8">
          <h3 className="text-sm font-medium text-white/60 mb-3">Playlist</h3>
          <div className="space-y-1 max-h-40 overflow-y-auto">
            {tracks.map((track, index) => (
              <button
                key={track.id}
                onClick={() => {
                  playTrack(index)
                }}
                className={cn(
                  'w-full flex items-center gap-3 p-2 rounded-lg transition-colors text-left',
                  index === currentTrackIndex
                    ? 'bg-white/10 text-white'
                    : 'hover:bg-white/5 text-white/70'
                )}
              >
                {track.cover_url ? (
                  <img
                    src={track.cover_url}
                    alt={track.title}
                    className="w-10 h-10 rounded object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded bg-zinc-800 flex items-center justify-center">
                    <span className="text-xs text-zinc-500">{index + 1}</span>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate">{track.title}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {track.artist || 'Unknown Artist'}
                  </p>
                </div>
                {index === currentTrackIndex && isPlaying && (
                  <div className="flex items-center gap-0.5">
                    <span className="w-0.5 h-3 bg-white rounded-full animate-pulse" />
                    <span className="w-0.5 h-4 bg-white rounded-full animate-pulse [animation-delay:0.2s]" />
                    <span className="w-0.5 h-2 bg-white rounded-full animate-pulse [animation-delay:0.4s]" />
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// Vinyl Record Component
interface VinylRecordProps {
  isPlaying: boolean
  coverUrl: string | null | undefined
}

function VinylRecord({ isPlaying, coverUrl }: VinylRecordProps) {
  return (
    <div className="relative w-full h-full">
      {/* Outer vinyl */}
      <div
        className={cn(
          'absolute inset-0 rounded-full bg-gradient-to-br from-zinc-900 via-zinc-800 to-black shadow-2xl',
          isPlaying && 'animate-spin'
        )}
        style={{
          animationDuration: '2s',
          animationTimingFunction: 'linear',
          animationIterationCount: 'infinite',
        }}
      >
        {/* Vinyl grooves */}
        <div className="absolute inset-[15%] rounded-full border border-zinc-700/30" />
        <div className="absolute inset-[20%] rounded-full border border-zinc-700/30" />
        <div className="absolute inset-[25%] rounded-full border border-zinc-700/30" />
        <div className="absolute inset-[30%] rounded-full border border-zinc-700/30" />
        <div className="absolute inset-[35%] rounded-full border border-zinc-700/30" />
        
        {/* Vinyl shine */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-tl from-transparent via-white/5 to-transparent" />
        
        {/* Center label */}
        <div className="absolute inset-[35%] rounded-full overflow-hidden bg-gradient-to-br from-zinc-700 to-zinc-900 flex items-center justify-center">
          {coverUrl ? (
            <img
              src={coverUrl}
              alt="Album cover"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-rose-900 to-rose-950 flex items-center justify-center">
              <div className="w-4 h-4 rounded-full bg-black" />
            </div>
          )}
        </div>
        
        {/* Center hole */}
        <div className="absolute inset-[48%] rounded-full bg-black" />
      </div>
      
      {/* Reflection overlay */}
      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/10 via-transparent to-transparent pointer-events-none" />
    </div>
  )
}
