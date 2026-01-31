'use client'

import { useQuery } from '@tanstack/react-query'
import { postsApi } from '@/lib/api'
import PostCard from './PostCard'
import LoadingSpinner from './LoadingSpinner'
import { FileText } from 'lucide-react'

export default function PostList() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['posts'],
    queryFn: () => postsApi.getAll(1, 50, false),
  })

  if (isLoading) {
    return <LoadingSpinner />
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-destructive">Failed to load posts</p>
        <p className="text-muted-foreground text-sm mt-2">
          Please try again later
        </p>
      </div>
    )
  }

  if (!data?.posts?.length) {
    return (
      <div className="text-center py-16">
        <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">No posts yet</p>
        <p className="text-muted-foreground/60 text-sm mt-1">
          Check back later for new letters
        </p>
      </div>
    )
  }

  return (
    <div className="divide-y divide-border">
      {data.posts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  )
}
