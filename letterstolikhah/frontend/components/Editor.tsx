'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import Underline from '@tiptap/extension-underline'
import Link from '@tiptap/extension-link'
import Youtube from '@tiptap/extension-youtube'
import { useRef, useCallback } from 'react'
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  List,
  ListOrdered,
  Quote,
  Minus,
  Link as LinkIcon,
  Undo,
  Redo,
  Image as ImageIcon,
  Video,
  Youtube as YoutubeIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import ResizableImageExtension from '@/lib/extensions/ResizableImageExtension'
import ResizableVideoExtension from '@/lib/extensions/ResizableVideoExtension'

interface EditorProps {
  content: string
  onChange: (content: string) => void
  placeholder?: string
}

export default function Editor({
  content,
  onChange,
  placeholder = 'Start writing...',
}: EditorProps) {
  const imageInputRef = useRef<HTMLInputElement>(null)
  const videoInputRef = useRef<HTMLInputElement>(null)

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Placeholder.configure({
        placeholder,
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-400 underline',
        },
      }),
      ResizableImageExtension,
      ResizableVideoExtension,
      Youtube.configure({
        controls: true,
        nocookie: true,
        modestBranding: true,
        HTMLAttributes: {
          class: 'youtube-video',
        },
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class: 'tiptap min-h-[300px] outline-none px-4 py-3',
      },
    },
  })

  // Handle file to base64 conversion
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = (error) => reject(error)
    })
  }

  // Handle image upload
  const handleImageUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file || !editor) return

      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select a valid image file')
        return
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert('Image size should be less than 10MB')
        return
      }

      try {
        const base64 = await fileToBase64(file)

        // Get image dimensions
        const img = new Image()
        img.src = base64
        await new Promise((resolve) => {
          img.onload = resolve
        })

        // Set initial width (max 600px, maintain aspect ratio)
        const maxWidth = 600
        const width = Math.min(img.naturalWidth, maxWidth)
        const height = (width / img.naturalWidth) * img.naturalHeight

        editor.chain().focus().setImage({
          src: base64,
          alt: file.name,
          width: Math.round(width),
          height: Math.round(height),
        }).run()
      } catch (error) {
        console.error('Error uploading image:', error)
        alert('Failed to upload image')
      }

      // Reset input
      if (imageInputRef.current) {
        imageInputRef.current.value = ''
      }
    },
    [editor]
  )

  // Handle video upload
  const handleVideoUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file || !editor) return

      // Validate file type
      if (!file.type.startsWith('video/')) {
        alert('Please select a valid video file')
        return
      }

      // Validate file size (max 50MB)
      if (file.size > 50 * 1024 * 1024) {
        alert('Video size should be less than 50MB')
        return
      }

      try {
        const base64 = await fileToBase64(file)

        // Get video dimensions
        const video = document.createElement('video')
        video.src = base64
        await new Promise((resolve) => {
          video.onloadedmetadata = resolve
        })

        // Set initial width (max 640px, maintain aspect ratio)
        const maxWidth = 640
        const width = Math.min(video.videoWidth, maxWidth)
        const height = (width / video.videoWidth) * video.videoHeight

        editor.chain().focus().setVideo({
          src: base64,
          width: Math.round(width),
          height: Math.round(height),
        }).run()
      } catch (error) {
        console.error('Error uploading video:', error)
        alert('Failed to upload video')
      }

      // Reset input
      if (videoInputRef.current) {
        videoInputRef.current.value = ''
      }
    },
    [editor]
  )

  // Handle image URL input
  const handleImageUrl = useCallback(() => {
    const url = window.prompt('Enter image URL:')
    if (url && editor) {
      editor.chain().focus().setImage({
        src: url,
        alt: 'Image',
        width: 400,
      }).run()
    }
  }, [editor])

  // Handle video URL input
  const handleVideoUrl = useCallback(() => {
    const url = window.prompt('Enter video URL:')
    if (url && editor) {
      editor.chain().focus().setVideo({
        src: url,
        width: 640,
      }).run()
    }
  }, [editor])

  // Handle YouTube URL
  const handleYoutubeUrl = useCallback(() => {
    const url = window.prompt('Enter YouTube URL:')
    if (url && editor) {
      editor.chain().focus().setYoutubeVideo({
        src: url,
        width: 640,
        height: 360,
      }).run()
    }
  }, [editor])

  // Handle link
  const setLink = useCallback(() => {
    if (!editor) return
    const url = window.prompt('Enter URL:')
    if (url) {
      editor.chain().focus().setLink({ href: url }).run()
    }
  }, [editor])

  if (!editor) {
    return null
  }

  const ToolbarButton = ({
    onClick,
    isActive = false,
    children,
    title,
    disabled = false,
  }: {
    onClick: () => void
    isActive?: boolean
    children: React.ReactNode
    title: string
    disabled?: boolean
  }) => (
    <button
      type="button"
      onClick={onClick}
      title={title}
      disabled={disabled}
      className={cn(
        'p-2 rounded hover:bg-accent transition-colors',
        isActive && 'bg-accent text-white',
        disabled && 'opacity-50 cursor-not-allowed'
      )}
    >
      {children}
    </button>
  )

  const ToolbarSeparator = () => (
    <div className="w-px h-6 bg-border mx-1 self-center" />
  )

  return (
    <div className="border border-border rounded-lg overflow-hidden bg-black">
      {/* Hidden file inputs */}
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
        className="hidden"
      />
      <input
        ref={videoInputRef}
        type="file"
        accept="video/*"
        onChange={handleVideoUpload}
        className="hidden"
      />

      {/* Toolbar */}
      <div className="flex flex-wrap gap-1 p-2 border-b border-border bg-secondary">
        {/* Text formatting */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          isActive={editor.isActive('bold')}
          title="Bold (Ctrl+B)"
        >
          <Bold className="w-4 h-4" />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          isActive={editor.isActive('italic')}
          title="Italic (Ctrl+I)"
        >
          <Italic className="w-4 h-4" />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          isActive={editor.isActive('underline')}
          title="Underline (Ctrl+U)"
        >
          <UnderlineIcon className="w-4 h-4" />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleStrike().run()}
          isActive={editor.isActive('strike')}
          title="Strikethrough"
        >
          <Strikethrough className="w-4 h-4" />
        </ToolbarButton>

        <ToolbarSeparator />

        {/* Lists */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          isActive={editor.isActive('bulletList')}
          title="Bullet List"
        >
          <List className="w-4 h-4" />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          isActive={editor.isActive('orderedList')}
          title="Numbered List"
        >
          <ListOrdered className="w-4 h-4" />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          isActive={editor.isActive('blockquote')}
          title="Quote"
        >
          <Quote className="w-4 h-4" />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          title="Horizontal Rule"
        >
          <Minus className="w-4 h-4" />
        </ToolbarButton>

        <ToolbarButton
          onClick={setLink}
          isActive={editor.isActive('link')}
          title="Add Link"
        >
          <LinkIcon className="w-4 h-4" />
        </ToolbarButton>

        <ToolbarSeparator />

        {/* Media */}
        <div className="relative group">
          <ToolbarButton onClick={() => {}} title="Insert Image">
            <ImageIcon className="w-4 h-4" />
          </ToolbarButton>
          <div className="absolute top-2/3 left-0 mt-1 hidden group-hover:flex flex-col bg-secondary border border-border rounded-lg overflow-hidden shadow-lg z-20 min-w-[140px]">
            <button
              onClick={() => imageInputRef.current?.click()}
              className="px-3 py-2 text-sm text-left hover:bg-accent transition-colors"
            >
              Upload Image
            </button>
            <button
              onClick={handleImageUrl}
              className="px-3 py-2 text-sm text-left hover:bg-accent transition-colors"
            >
              Image from URL
            </button>
          </div>
        </div>

        <div className="relative group">
          <ToolbarButton onClick={() => {}} title="Insert Video">
            <Video className="w-4 h-4" />
          </ToolbarButton>
          <div className="absolute top-2/3 left-0 mt-1 hidden group-hover:flex flex-col bg-secondary border border-border rounded-lg overflow-hidden shadow-lg z-20 min-w-[140px]">
            <button
              onClick={() => videoInputRef.current?.click()}
              className="px-3 py-2 text-sm text-left hover:bg-accent transition-colors"
            >
              Upload Video
            </button>
            <button
              onClick={handleVideoUrl}
              className="px-3 py-2 text-sm text-left hover:bg-accent transition-colors"
            >
              Video from URL
            </button>
          </div>
        </div>

        <ToolbarButton onClick={handleYoutubeUrl} title="Embed YouTube Video">
          <YoutubeIcon className="w-4 h-4" />
        </ToolbarButton>

        <ToolbarSeparator />

        {/* Undo/Redo */}
        <ToolbarButton
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          title="Undo (Ctrl+Z)"
        >
          <Undo className="w-4 h-4" />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          title="Redo (Ctrl+Y)"
        >
          <Redo className="w-4 h-4" />
        </ToolbarButton>
      </div>

      {/* Editor Content */}
      <EditorContent editor={editor} />

      {/* Help text */}
      <div className="px-4 py-2 border-t border-border text-xs text-muted-foreground">
        <span>
          Tip: Click on an image/video to select it, then drag corners to resize.
          Use the toolbar above the media to align or delete.
        </span>
      </div>
    </div>
  )
}
