'use client'

import { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Plus,
  Trash2,
  Music,
  X,
  Loader2,
  Star,
  Play,
  Pause,
} from 'lucide-react'
import { musicApi, type MusicTrack, type MusicTrackCreate } from '@/lib/api'
import LoadingSpinner from './LoadingSpinner'
import { cn } from '@/lib/utils'

export default function MusicManager() {
  const [isUploading, setIsUploading] = useState(false)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [title, setTitle] = useState('')
  const [artist, setArtist] = useState('')
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [coverUrl, setCoverUrl] = useState<string | null>(null)
  const [duration, setDuration] = useState<number | null>(null)
  const [previewPlaying, setPreviewPlaying] = useState(false)
  const audioInputRef = useRef<HTMLInputElement>(null)
  const coverInputRef = useRef<HTMLInputElement>(null)
  const audioPreviewRef = useRef<HTMLAudioElement>(null)
  
  const queryClient = useQueryClient()

  // Fetch music tracks
  const { data, isLoading } = useQuery({
    queryKey: ['admin-music'],
    queryFn: () => musicApi.getAll(),
  })

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: MusicTrackCreate) => musicApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-music'] })
      queryClient.invalidateQueries({ queryKey: ['music'] })
      resetUpload()
    },
  })

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => musicApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-music'] })
      queryClient.invalidateQueries({ queryKey: ['music'] })
    },
  })

  // Set active mutation
  const setActiveMutation = useMutation({
    mutationFn: (id: number) => musicApi.setActive(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-music'] })
      queryClient.invalidateQueries({ queryKey: ['music'] })
    },
  })

  const resetUpload = () => {
    setShowUploadModal(false)
    setTitle('')
    setArtist('')
    setAudioUrl(null)
    setCoverUrl(null)
    setDuration(null)
    setIsUploading(false)
    setPreviewPlaying(false)
    if (audioInputRef.current) audioInputRef.current.value = ''
    if (coverInputRef.current) coverInputRef.current.value = ''
  }

  const handleAudioSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = () => {
      setAudioUrl(reader.result as string)
      
      // Get duration using Audio element
      const audio = new Audio(reader.result as string)
      audio.onloadedmetadata = () => {
        setDuration(Math.round(audio.duration))
      }
    }
    reader.readAsDataURL(file)
  }

  const handleCoverSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = () => {
      setCoverUrl(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const togglePreview = () => {
    if (audioPreviewRef.current) {
      if (previewPlaying) {
        audioPreviewRef.current.pause()
      } else {
        audioPreviewRef.current.play()
      }
      setPreviewPlaying(!previewPlaying)
    }
  }

  const handleUpload = async () => {
    if (!audioUrl || !title) return

    setIsUploading(true)
    
    try {
      await createMutation.mutateAsync({
        title,
        artist: artist || undefined,
        audio_url: audioUrl,
        cover_url: coverUrl || undefined,
        duration: duration || undefined,
        is_active: (data?.tracks.length || 0) === 0, // Make first track active
        order_index: data?.tracks.length || 0,
      })
    } catch (error) {
      console.error('Upload failed:', error)
      setIsUploading(false)
    }
  }

  const handleDelete = (id: number) => {
    if (window.confirm('Delete this track?')) {
      deleteMutation.mutate(id)
    }
  }

  const handleSetActive = (id: number) => {
    setActiveMutation.mutate(id)
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const tracks = data?.tracks || []

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold">Music Tracks</h2>
        <button
          onClick={() => setShowUploadModal(true)}
          className="flex items-center gap-2 bg-white text-black px-4 py-2 rounded-lg font-medium hover:bg-gray-100 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Track
        </button>
      </div>

      {isLoading ? (
        <LoadingSpinner />
      ) : tracks.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground border border-dashed border-border rounded-lg">
          <Music className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No tracks yet</p>
          <p className="text-sm mt-1">Upload music for your vinyl player</p>
        </div>
      ) : (
        <div className="space-y-2">
          {tracks.map((track) => (
            <div
              key={track.id}
              className={cn(
                'flex items-center gap-4 p-4 rounded-lg border transition-colors',
                track.is_active
                  ? 'bg-white/5 border-white/20'
                  : 'bg-secondary border-border'
              )}
            >
              {/* Cover */}
              <div className="w-14 h-14 rounded-lg overflow-hidden bg-zinc-800 flex-shrink-0">
                {track.cover_url ? (
                  <img
                    src={track.cover_url}
                    alt={track.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Music className="w-6 h-6 text-zinc-600" />
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium text-white truncate">{track.title}</h3>
                  {track.is_active && (
                    <span className="px-2 py-0.5 text-xs rounded-full bg-white/20 text-white">
                      Active
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground truncate">
                  {track.artist || 'Unknown Artist'}
                  {track.duration && ` · ${formatDuration(track.duration)}`}
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1">
                {!track.is_active && (
                  <button
                    onClick={() => handleSetActive(track.id)}
                    className="p-2 hover:bg-accent rounded-lg transition-colors text-muted-foreground hover:text-yellow-400"
                    title="Set as active"
                    disabled={setActiveMutation.isPending}
                  >
                    <Star className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => handleDelete(track.id)}
                  className="p-2 hover:bg-destructive/20 rounded-lg transition-colors text-muted-foreground hover:text-destructive"
                  title="Delete"
                  disabled={deleteMutation.isPending}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-zinc-900 rounded-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Add Music Track</h3>
              <button
                onClick={resetUpload}
                className="p-1 hover:bg-zinc-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            {/* Audio file */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-muted-foreground mb-2">
                Audio File *
              </label>
              {audioUrl ? (
                <div className="flex items-center gap-3 p-3 bg-black rounded-lg">
                  <button
                    onClick={togglePreview}
                    className="w-10 h-10 rounded-full bg-white flex items-center justify-center flex-shrink-0"
                  >
                    {previewPlaying ? (
                      <Pause className="w-4 h-4 text-black" />
                    ) : (
                      <Play className="w-4 h-4 text-black ml-0.5" />
                    )}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white truncate">Audio selected</p>
                    {duration && (
                      <p className="text-xs text-muted-foreground">
                        Duration: {formatDuration(duration)}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      setAudioUrl(null)
                      setDuration(null)
                      if (audioInputRef.current) audioInputRef.current.value = ''
                    }}
                    className="p-1 hover:bg-zinc-800 rounded"
                  >
                    <X className="w-4 h-4 text-muted-foreground" />
                  </button>
                  <audio ref={audioPreviewRef} src={audioUrl} onEnded={() => setPreviewPlaying(false)} />
                </div>
              ) : (
                <label className="block w-full p-4 border border-dashed border-border rounded-lg text-center cursor-pointer hover:border-white/40 transition-colors">
                  <Music className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Click to select audio file</span>
                  <input
                    ref={audioInputRef}
                    type="file"
                    accept="audio/*"
                    onChange={handleAudioSelect}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            {/* Cover image */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-muted-foreground mb-2">
                Cover Image (optional)
              </label>
              {coverUrl ? (
                <div className="relative w-32 h-32 rounded-lg overflow-hidden">
                  <img src={coverUrl} alt="Cover" className="w-full h-full object-cover" />
                  <button
                    onClick={() => {
                      setCoverUrl(null)
                      if (coverInputRef.current) coverInputRef.current.value = ''
                    }}
                    className="absolute top-1 right-1 p-1 bg-black/60 rounded hover:bg-black/80"
                  >
                    <X className="w-3 h-3 text-white" />
                  </button>
                </div>
              ) : (
                <label className="block w-32 h-32 border border-dashed border-border rounded-lg cursor-pointer hover:border-white/40 transition-colors flex items-center justify-center">
                  <Plus className="w-6 h-6 text-muted-foreground" />
                  <input
                    ref={coverInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleCoverSelect}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            {/* Title */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-muted-foreground mb-2">
                Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Track title"
                className="w-full bg-black border border-border rounded-lg px-4 py-2 text-white placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-white/20"
              />
            </div>

            {/* Artist */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-muted-foreground mb-2">
                Artist
              </label>
              <input
                type="text"
                value={artist}
                onChange={(e) => setArtist(e.target.value)}
                placeholder="Artist name"
                className="w-full bg-black border border-border rounded-lg px-4 py-2 text-white placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-white/20"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={resetUpload}
                className="flex-1 px-4 py-2 border border-border rounded-lg text-white hover:bg-zinc-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleUpload}
                disabled={isUploading || !audioUrl || !title}
                className="flex-1 px-4 py-2 bg-white text-black rounded-lg font-medium hover:bg-gray-100 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  'Add Track'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
