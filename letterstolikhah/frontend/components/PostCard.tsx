'use client'

import { useState, useEffect } from 'react'
import { Eye, ChevronDown, ChevronUp } from 'lucide-react'
import { formatDate, stripHtml, truncate } from '@/lib/utils'
import { analyticsApi, getSessionId, type Post } from '@/lib/api'

interface PostCardProps {
  post: Post
}

export default function PostCard({ post }: PostCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [hasTracked, setHasTracked] = useState(false)

  // Track view when post is expanded
  useEffect(() => {
    if (isExpanded && !hasTracked) {
      const sessionId = getSessionId()
      analyticsApi.track(post.id, sessionId)
      setHasTracked(true)
    }
  }, [isExpanded, hasTracked, post.id])

  const excerpt = post.excerpt || truncate(stripHtml(post.content), 150)

  return (
    <article className="border-b border-border last:border-b-0 animate-fade-in">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full text-left py-6 group"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-semibold text-white group-hover:text-gray-300 transition-colors line-clamp-2">
              {post.title}
            </h2>
            
            {!isExpanded && (
              <p className="text-muted-foreground text-sm mt-2 line-clamp-2">
                {excerpt}
              </p>
            )}
            
            <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
              <time dateTime={post.created_at}>
                {formatDate(post.created_at)}
              </time>
              <span className="flex items-center gap-1">
                <Eye className="w-3 h-3" />
                {post.view_count} views
              </span>
            </div>
          </div>
          
          <div className="flex-shrink-0 text-muted-foreground">
            {isExpanded ? (
              <ChevronUp className="w-5 h-5" />
            ) : (
              <ChevronDown className="w-5 h-5" />
            )}
          </div>
        </div>
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="pb-6 animate-slide-up">
          <div
            className="prose prose-invert max-w-none text-gray-300"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />
        </div>
      )}
    </article>
  )
}
