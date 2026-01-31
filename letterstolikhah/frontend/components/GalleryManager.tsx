'use client'

import { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Plus,
  Trash2,
  Image as ImageIcon,
  Video,
  X,
  Loader2,
  GripVertical,
} from 'lucide-react'
import { galleryApi, type GalleryMedia, type GalleryMediaCreate } from '@/lib/api'
import LoadingSpinner from './LoadingSpinner'
import { cn } from '@/lib/utils'

export default function GalleryManager() {
  const [isUploading, setIsUploading] = useState(false)
  const [caption, setCaption] = useState('')
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image')
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const queryClient = useQueryClient()

  // Fetch gallery media
  const { data, isLoading } = useQuery({
    queryKey: ['admin-gallery'],
    queryFn: () => galleryApi.getAll(),
  })

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: GalleryMediaCreate) => galleryApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-gallery'] })
      queryClient.invalidateQueries({ queryKey: ['gallery'] })
      resetUpload()
    },
  })

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => galleryApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-gallery'] })
      queryClient.invalidateQueries({ queryKey: ['gallery'] })
    },
  })

  const resetUpload = () => {
    setShowUploadModal(false)
    setPreviewUrl(null)
    setCaption('')
    setMediaType('image')
    setIsUploading(false)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Determine media type
    const isVideo = file.type.startsWith('video/')
    setMediaType(isVideo ? 'video' : 'image')

    // Create preview
    const reader = new FileReader()
    reader.onload = () => {
      setPreviewUrl(reader.result as string)
      setShowUploadModal(true)
    }
    reader.readAsDataURL(file)
  }

  const handleUpload = async () => {
    if (!previewUrl) return

    setIsUploading(true)
    
    try {
      await createMutation.mutateAsync({
        media_type: mediaType,
        url: previewUrl,
        caption: caption || undefined,
        order_index: data?.media.length || 0,
      })
    } catch (error) {
      console.error('Upload failed:', error)
      setIsUploading(false)
    }
  }

  const handleDelete = (id: number) => {
    if (window.confirm('Delete this media item?')) {
      deleteMutation.mutate(id)
    }
  }

  const mediaItems = data?.media || []

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold">Gallery Media</h2>
        <label className="flex items-center gap-2 bg-white text-black px-4 py-2 rounded-lg font-medium hover:bg-gray-100 transition-colors cursor-pointer">
          <Plus className="w-4 h-4" />
          Add Media
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            onChange={handleFileSelect}
            className="hidden"
          />
        </label>
      </div>

      {isLoading ? (
        <LoadingSpinner />
      ) : mediaItems.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground border border-dashed border-border rounded-lg">
          <ImageIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No media yet</p>
          <p className="text-sm mt-1">Upload images or videos to your gallery</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
          {mediaItems.map((media) => (
            <div
              key={media.id}
              className="relative aspect-square bg-zinc-900 rounded-lg overflow-hidden group"
            >
              {media.media_type === 'video' ? (
                <>
                  {media.thumbnail_url ? (
                    <img
                      src={media.thumbnail_url}
                      alt={media.caption || 'Video'}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <video
                      src={media.url}
                      className="w-full h-full object-cover"
                      muted
                      playsInline
                    />
                  )}
                  <div className="absolute top-2 left-2 bg-black/60 rounded p-1">
                    <Video className="w-3 h-3 text-white" />
                  </div>
                </>
              ) : (
                <img
                  src={media.url}
                  alt={media.caption || 'Image'}
                  className="w-full h-full object-cover"
                />
              )}
              
              {/* Delete overlay */}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <button
                  onClick={() => handleDelete(media.id)}
                  className="p-2 bg-red-600 rounded-full hover:bg-red-700 transition-colors"
                  disabled={deleteMutation.isPending}
                >
                  <Trash2 className="w-4 h-4 text-white" />
                </button>
              </div>
              
              {/* Caption indicator */}
              {media.caption && (
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                  <p className="text-xs text-white truncate">{media.caption}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-zinc-900 rounded-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Add to Gallery</h3>
              <button
                onClick={resetUpload}
                className="p-1 hover:bg-zinc-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            {/* Preview */}
            <div className="aspect-square bg-black rounded-lg overflow-hidden mb-4">
              {mediaType === 'video' ? (
                <video
                  src={previewUrl || ''}
                  controls
                  className="w-full h-full object-contain"
                />
              ) : (
                <img
                  src={previewUrl || ''}
                  alt="Preview"
                  className="w-full h-full object-contain"
                />
              )}
            </div>

            {/* Caption input */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-muted-foreground mb-2">
                Caption (optional)
              </label>
              <input
                type="text"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Add a caption..."
                className="w-full bg-black border border-border rounded-lg px-4 py-2 text-white placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-white/20"
                maxLength={255}
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
                disabled={isUploading}
                className="flex-1 px-4 py-2 bg-white text-black rounded-lg font-medium hover:bg-gray-100 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  'Upload'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
