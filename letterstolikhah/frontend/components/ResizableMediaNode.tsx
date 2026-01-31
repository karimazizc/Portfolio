'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { NodeViewWrapper, NodeViewProps } from '@tiptap/react'
import { AlignLeft, AlignCenter, AlignRight, Trash2 } from 'lucide-react'

interface ResizableMediaNodeProps extends NodeViewProps {
  mediaType: 'image' | 'video'
}

export default function ResizableMediaNode({
  node,
  updateAttributes,
  deleteNode,
  selected,
  mediaType,
}: ResizableMediaNodeProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mediaRef = useRef<HTMLImageElement | HTMLVideoElement>(null)
  const [isResizing, setIsResizing] = useState(false)
  const [resizeDirection, setResizeDirection] = useState<string | null>(null)
  const [startPos, setStartPos] = useState({ x: 0, y: 0 })
  const [startSize, setStartSize] = useState({ width: 0, height: 0 })

  const { src, alt, title, width, height, align, poster } = node.attrs

  const handleMouseDown = useCallback(
    (e: React.MouseEvent, direction: string) => {
      e.preventDefault()
      e.stopPropagation()
      
      setIsResizing(true)
      setResizeDirection(direction)
      setStartPos({ x: e.clientX, y: e.clientY })
      
      const mediaEl = mediaRef.current
      if (mediaEl) {
        setStartSize({
          width: mediaEl.offsetWidth,
          height: mediaEl.offsetHeight,
        })
      }
    },
    []
  )

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isResizing || !resizeDirection) return

      const deltaX = e.clientX - startPos.x
      const deltaY = e.clientY - startPos.y

      let newWidth = startSize.width
      let newHeight = startSize.height
      const aspectRatio = startSize.width / startSize.height

      switch (resizeDirection) {
        case 'bottom-right':
          newWidth = Math.max(100, startSize.width + deltaX)
          newHeight = newWidth / aspectRatio
          break
        case 'bottom-left':
          newWidth = Math.max(100, startSize.width - deltaX)
          newHeight = newWidth / aspectRatio
          break
        case 'top-right':
          newWidth = Math.max(100, startSize.width + deltaX)
          newHeight = newWidth / aspectRatio
          break
        case 'top-left':
          newWidth = Math.max(100, startSize.width - deltaX)
          newHeight = newWidth / aspectRatio
          break
      }

      updateAttributes({
        width: Math.round(newWidth),
        height: Math.round(newHeight),
      })
    },
    [isResizing, resizeDirection, startPos, startSize, updateAttributes]
  )

  const handleMouseUp = useCallback(() => {
    setIsResizing(false)
    setResizeDirection(null)
  }, [])

  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isResizing, handleMouseMove, handleMouseUp])

  const handleAlignChange = (newAlign: string) => {
    updateAttributes({ align: newAlign })
  }

  return (
    <NodeViewWrapper
      className={`resizable-media-container ${selected ? 'ProseMirror-selectednode' : ''}`}
      data-align={align}
      ref={containerRef}
    >
      {/* Media Toolbar */}
      <div className="media-toolbar">
        <button
          onClick={() => handleAlignChange('left')}
          className={align === 'left' ? 'active' : ''}
          title="Align left"
        >
          <AlignLeft className="w-4 h-4" />
        </button>
        <button
          onClick={() => handleAlignChange('center')}
          className={align === 'center' ? 'active' : ''}
          title="Align center"
        >
          <AlignCenter className="w-4 h-4" />
        </button>
        <button
          onClick={() => handleAlignChange('right')}
          className={align === 'right' ? 'active' : ''}
          title="Align right"
        >
          <AlignRight className="w-4 h-4" />
        </button>
        <button onClick={deleteNode} title="Delete">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Media Element */}
      {mediaType === 'image' ? (
        <img
          ref={mediaRef as React.RefObject<HTMLImageElement>}
          src={src}
          alt={alt || ''}
          title={title || ''}
          style={{
            width: width ? `${width}px` : 'auto',
            height: height ? `${height}px` : 'auto',
          }}
          draggable={false}
        />
      ) : (
        <video
          ref={mediaRef as React.RefObject<HTMLVideoElement>}
          src={src}
          poster={poster}
          controls
          playsInline
          style={{
            width: width ? `${width}px` : 'auto',
            height: height ? `${height}px` : 'auto',
          }}
          draggable={false}
        />
      )}

      {/* Resize Handles */}
      <div
        className="resize-handle top-left"
        onMouseDown={(e) => handleMouseDown(e, 'top-left')}
      />
      <div
        className="resize-handle top-right"
        onMouseDown={(e) => handleMouseDown(e, 'top-right')}
      />
      <div
        className="resize-handle bottom-left"
        onMouseDown={(e) => handleMouseDown(e, 'bottom-left')}
      />
      <div
        className="resize-handle bottom-right"
        onMouseDown={(e) => handleMouseDown(e, 'bottom-right')}
      />
    </NodeViewWrapper>
  )
}
