'use client'

import { useState, useEffect, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Plus,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  Save,
  X,
  LogOut,
  BarChart3,
  FileText,
  ArrowLeft,
  Image as ImageIcon,
  Music,
} from 'lucide-react'
import { postsApi, type Post, type PostCreate, type PostUpdate } from '@/lib/api'
import { useAuth } from '@/hooks/useAuth'
import Editor from './Editor'
import AnalyticsDashboard from './AnalyticsDashboard'
import GalleryManager from './GalleryManager'
import MusicManager from './MusicManager'
import LoadingSpinner from './LoadingSpinner'
import { formatDate, cn } from '@/lib/utils'

type View = 'posts' | 'analytics' | 'editor' | 'gallery' | 'music'

export default function AdminDashboard() {
  const [view, setView] = useState<View>('posts')
  const [editingPost, setEditingPost] = useState<Post | null>(null)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [excerpt, setExcerpt] = useState('')
  const [published, setPublished] = useState(false)
  const [autoSaveTimeout, setAutoSaveTimeout] = useState<NodeJS.Timeout | null>(null)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  
  const { logout } = useAuth()
  const queryClient = useQueryClient()

  // Fetch posts
  const { data: postsData, isLoading } = useQuery({
    queryKey: ['admin-posts'],
    queryFn: () => postsApi.getAll(1, 100, true),
  })

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: PostCreate) => postsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-posts'] })
      resetForm()
      setView('posts')
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: PostUpdate }) =>
      postsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-posts'] })
      setLastSaved(new Date())
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => postsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-posts'] })
    },
  })

  // Reset form
  const resetForm = useCallback(() => {
    setEditingPost(null)
    setTitle('')
    setContent('')
    setExcerpt('')
    setPublished(false)
    setLastSaved(null)
  }, [])

  // Auto-save for drafts
  useEffect(() => {
    if (!editingPost || !title || !content) return

    if (autoSaveTimeout) {
      clearTimeout(autoSaveTimeout)
    }

    const timeout = setTimeout(() => {
      updateMutation.mutate({
        id: editingPost.id,
        data: { title, content, excerpt, published },
      })
    }, 3000) // Auto-save after 3 seconds of inactivity

    setAutoSaveTimeout(timeout)

    return () => {
      if (timeout) clearTimeout(timeout)
    }
  }, [title, content, excerpt, published, editingPost])

  // Handle new post
  const handleNewPost = () => {
    resetForm()
    setView('editor')
  }

  // Handle edit post
  const handleEditPost = (post: Post) => {
    setEditingPost(post)
    setTitle(post.title)
    setContent(post.content)
    setExcerpt(post.excerpt || '')
    setPublished(post.published)
    setView('editor')
  }

  // Handle save
  const handleSave = () => {
    if (!title || !content) return

    if (editingPost) {
      updateMutation.mutate({
        id: editingPost.id,
        data: { title, content, excerpt, published },
      })
    } else {
      createMutation.mutate({ title, content, excerpt, published })
    }
  }

  // Handle delete
  const handleDelete = (id: number) => {
    if (window.confirm('Are you sure you want to delete this post?')) {
      deleteMutation.mutate(id)
    }
  }

  // Handle toggle publish
  const handleTogglePublish = (post: Post) => {
    updateMutation.mutate({
      id: post.id,
      data: { published: !post.published },
    })
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <header className="border-b border-border sticky top-0 bg-black/90 backdrop-blur-sm z-10">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {view === 'editor' && (
                <button
                  onClick={() => {
                    resetForm()
                    setView('posts')
                  }}
                  className="p-2 hover:bg-accent rounded-lg transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
              )}
              <h1 className="text-xl font-bold text-white">Admin Dashboard</h1>
            </div>
            
            <div className="flex items-center gap-2">
              {view !== 'editor' && (
                <>
                  <button
                    onClick={() => setView('posts')}
                    className={cn(
                      'flex items-center gap-2 px-3 py-2 rounded-lg transition-colors',
                      view === 'posts' ? 'bg-accent text-white' : 'text-muted-foreground hover:text-white'
                    )}
                  >
                    <FileText className="w-4 h-4" />
                    <span className="hidden sm:inline">Posts</span>
                  </button>
                  <button
                    onClick={() => setView('gallery')}
                    className={cn(
                      'flex items-center gap-2 px-3 py-2 rounded-lg transition-colors',
                      view === 'gallery' ? 'bg-accent text-white' : 'text-muted-foreground hover:text-white'
                    )}
                  >
                    <ImageIcon className="w-4 h-4" />
                    <span className="hidden sm:inline">Gallery</span>
                  </button>
                  <button
                    onClick={() => setView('music')}
                    className={cn(
                      'flex items-center gap-2 px-3 py-2 rounded-lg transition-colors',
                      view === 'music' ? 'bg-accent text-white' : 'text-muted-foreground hover:text-white'
                    )}
                  >
                    <Music className="w-4 h-4" />
                    <span className="hidden sm:inline">Music</span>
                  </button>
                  <button
                    onClick={() => setView('analytics')}
                    className={cn(
                      'flex items-center gap-2 px-3 py-2 rounded-lg transition-colors',
                      view === 'analytics' ? 'bg-accent text-white' : 'text-muted-foreground hover:text-white'
                    )}
                  >
                    <BarChart3 className="w-4 h-4" />
                    <span className="hidden sm:inline">Analytics</span>
                  </button>
                </>
              )}
              <button
                onClick={logout}
                className="flex items-center gap-2 px-3 py-2 text-muted-foreground hover:text-white transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-6">
        {/* Posts View */}
        {view === 'posts' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold">All Posts</h2>
              <button
                onClick={handleNewPost}
                className="flex items-center gap-2 bg-white text-black px-4 py-2 rounded-lg font-medium hover:bg-gray-100 transition-colors"
              >
                <Plus className="w-4 h-4" />
                New Post
              </button>
            </div>

            {isLoading ? (
              <LoadingSpinner />
            ) : (
              <div className="space-y-3">
                {postsData?.posts.map((post) => (
                  <div
                    key={post.id}
                    className="bg-secondary rounded-lg p-4 border border-border flex items-start justify-between gap-4"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium text-white truncate">
                          {post.title}
                        </h3>
                        <span
                          className={cn(
                            'px-2 py-0.5 text-xs rounded-full',
                            post.published
                              ? 'bg-green-900/50 text-green-400'
                              : 'bg-yellow-900/50 text-yellow-400'
                          )}
                        >
                          {post.published ? 'Published' : 'Draft'}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(post.created_at)} · {post.view_count} views
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleTogglePublish(post)}
                        className="p-2 hover:bg-accent rounded-lg transition-colors text-muted-foreground hover:text-white"
                        title={post.published ? 'Unpublish' : 'Publish'}
                      >
                        {post.published ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                      <button
                        onClick={() => handleEditPost(post)}
                        className="p-2 hover:bg-accent rounded-lg transition-colors text-muted-foreground hover:text-white"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(post.id)}
                        className="p-2 hover:bg-destructive/20 rounded-lg transition-colors text-muted-foreground hover:text-destructive"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
                
                {postsData?.posts.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No posts yet</p>
                    <p className="text-sm mt-1">Create your first post to get started</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Analytics View */}
        {view === 'analytics' && <AnalyticsDashboard />}

        {/* Gallery View */}
        {view === 'gallery' && <GalleryManager />}

        {/* Music View */}
        {view === 'music' && <MusicManager />}

        {/* Editor View */}
        {view === 'editor' && (
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold">
                {editingPost ? 'Edit Post' : 'New Post'}
              </h2>
              <div className="flex items-center gap-2">
                {lastSaved && (
                  <span className="text-xs text-muted-foreground">
                    Saved {lastSaved.toLocaleTimeString()}
                  </span>
                )}
                <button
                  onClick={handleSave}
                  disabled={!title || !content || createMutation.isPending || updateMutation.isPending}
                  className="flex items-center gap-2 bg-white text-black px-4 py-2 rounded-lg font-medium hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save className="w-4 h-4" />
                  {editingPost ? 'Update' : 'Save'}
                </button>
              </div>
            </div>

            <div className="space-y-4">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">
                  Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter post title..."
                  className="w-full bg-black border border-border rounded-lg px-4 py-3 text-white placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-white/20"
                />
              </div>

              {/* Excerpt */}
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">
                  Excerpt (optional)
                </label>
                <textarea
                  value={excerpt}
                  onChange={(e) => setExcerpt(e.target.value)}
                  placeholder="Brief description for previews..."
                  rows={2}
                  className="w-full bg-black border border-border rounded-lg px-4 py-3 text-white placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-white/20 resize-none"
                />
              </div>

              {/* Content Editor */}
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">
                  Content
                </label>
                <Editor
                  content={content}
                  onChange={setContent}
                  placeholder="Start writing your letter..."
                />
              </div>

              {/* Publish Toggle */}
              <div className="flex items-center justify-between bg-secondary rounded-lg p-4 border border-border">
                <div>
                  <p className="font-medium text-white">Publish Post</p>
                  <p className="text-sm text-muted-foreground">
                    Make this post visible to everyone
                  </p>
                </div>
                <button
                  onClick={() => setPublished(!published)}
                  className={cn(
                    'relative w-12 h-6 rounded-full transition-colors',
                    published ? 'bg-white' : 'bg-accent'
                  )}
                >
                  <span
                    className={cn(
                      'absolute top-1 w-4 h-4 rounded-full transition-all',
                      published ? 'left-7 bg-black' : 'left-1 bg-muted-foreground'
                    )}
                  />
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
