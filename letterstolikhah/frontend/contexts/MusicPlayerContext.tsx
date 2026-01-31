'use client'

import React, { createContext, useContext, useState, useRef, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { musicApi, type MusicTrack } from '@/lib/api'

interface MusicPlayerContextType {
  currentTrack: MusicTrack | null
  isPlaying: boolean
  currentTime: number
  duration: number
  volume: number
  isMuted: boolean
  tracks: MusicTrack[]
  currentTrackIndex: number
  play: () => void
  pause: () => void
  togglePlay: () => void
  nextTrack: () => void
  previousTrack: () => void
  seekTo: (time: number) => void
  setVolume: (volume: number) => void
  toggleMute: () => void
  playTrack: (index: number) => void
  audioRef: React.RefObject<HTMLAudioElement>
}

const MusicPlayerContext = createContext<MusicPlayerContextType | null>(null)

export function MusicPlayerProvider({ children }: { children: React.ReactNode }) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolumeState] = useState(0.7)
  const [isMuted, setIsMuted] = useState(false)
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0)
  const audioRef = useRef<HTMLAudioElement>(null)

  const { data } = useQuery({
    queryKey: ['music'],
    queryFn: () => musicApi.getAll(),
  })

  const tracks = data?.tracks || []
  const currentTrack = tracks[currentTrackIndex] || null

  // Find the active track on initial load
  useEffect(() => {
    if (tracks.length > 0 && currentTrackIndex === 0) {
      const activeIndex = tracks.findIndex(t => t.is_active)
      if (activeIndex !== -1) {
        setCurrentTrackIndex(activeIndex)
      }
    }
  }, [tracks])

  // Update audio element when track changes
  useEffect(() => {
    if (audioRef.current && currentTrack) {
      const wasPlaying = isPlaying
      audioRef.current.src = currentTrack.audio_url
      audioRef.current.volume = isMuted ? 0 : volume
      if (wasPlaying) {
        audioRef.current.play().catch(console.error)
      }
    }
  }, [currentTrack?.id])

  // Update volume
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume
    }
  }, [volume, isMuted])

  const play = () => {
    if (audioRef.current && currentTrack) {
      audioRef.current.play().catch(console.error)
      setIsPlaying(true)
    }
  }

  const pause = () => {
    if (audioRef.current) {
      audioRef.current.pause()
      setIsPlaying(false)
    }
  }

  const togglePlay = () => {
    if (isPlaying) {
      pause()
    } else {
      play()
    }
  }

  const nextTrack = () => {
    if (currentTrackIndex < tracks.length - 1) {
      setCurrentTrackIndex(currentTrackIndex + 1)
      setIsPlaying(true)
    }
  }

  const previousTrack = () => {
    if (currentTrackIndex > 0) {
      setCurrentTrackIndex(currentTrackIndex - 1)
      setIsPlaying(true)
    }
  }

  const seekTo = (time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time
      setCurrentTime(time)
    }
  }

  const setVolume = (newVolume: number) => {
    setVolumeState(newVolume)
    if (newVolume > 0) {
      setIsMuted(false)
    }
  }

  const toggleMute = () => {
    setIsMuted(!isMuted)
  }

  const playTrack = (index: number) => {
    setCurrentTrackIndex(index)
    setIsPlaying(true)
  }

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime)
    }
  }

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration)
    }
  }

  const handleEnded = () => {
    if (currentTrackIndex < tracks.length - 1) {
      nextTrack()
    } else {
      setIsPlaying(false)
      setCurrentTime(0)
    }
  }

  return (
    <MusicPlayerContext.Provider
      value={{
        currentTrack,
        isPlaying,
        currentTime,
        duration,
        volume,
        isMuted,
        tracks,
        currentTrackIndex,
        play,
        pause,
        togglePlay,
        nextTrack,
        previousTrack,
        seekTo,
        setVolume,
        toggleMute,
        playTrack,
        audioRef,
      }}
    >
      {/* Hidden audio element */}
      <audio
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
        preload="metadata"
      />
      {children}
    </MusicPlayerContext.Provider>
  )
}

export function useMusicPlayer() {
  const context = useContext(MusicPlayerContext)
  if (!context) {
    throw new Error('useMusicPlayer must be used within MusicPlayerProvider')
  }
  return context
}
