'use client'

import { useQuery } from '@tanstack/react-query'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import { analyticsApi, type StatsResponse, type Visitor } from '@/lib/api'
import LoadingSpinner from './LoadingSpinner'
import { formatDateTime } from '@/lib/utils'
import {
  Eye,
  Users,
  FileText,
  TrendingUp,
  Globe,
  Clock,
  Monitor,
} from 'lucide-react'

const COLORS = ['#fff', '#a3a3a3', '#737373', '#525252', '#404040']

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType
  label: string
  value: number | string
}) {
  return (
    <div className="bg-secondary rounded-lg p-4 border border-border">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-accent rounded-lg">
          <Icon className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-2xl font-bold text-white">{value}</p>
        </div>
      </div>
    </div>
  )
}

export default function AnalyticsDashboard() {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['analytics-stats'],
    queryFn: analyticsApi.getStats,
    refetchInterval: 30000, // Refresh every 30 seconds
  })

  const { data: visitors, isLoading: visitorsLoading } = useQuery({
    queryKey: ['analytics-visitors'],
    queryFn: () => analyticsApi.getVisitors(1, 20),
    refetchInterval: 30000,
  })

  if (statsLoading || visitorsLoading) {
    return <LoadingSpinner />
  }

  if (!stats) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Failed to load analytics</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={Eye} label="Total Views" value={stats.total_views} />
        <StatCard icon={Users} label="Unique Visitors" value={stats.total_unique_visitors} />
        <StatCard icon={FileText} label="Total Posts" value={stats.total_posts} />
        <StatCard icon={TrendingUp} label="Views Today" value={stats.views_today} />
      </div>

      {/* Charts Row */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Daily Views Chart */}
        <div className="bg-secondary rounded-lg p-4 border border-border">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Views Over Time
          </h3>
          <div className="h-64">
            {stats.daily_stats.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.daily_stats}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                  <XAxis
                    dataKey="date"
                    stroke="#a3a3a3"
                    fontSize={12}
                    tickFormatter={(value) => {
                      const date = new Date(value)
                      return `${date.getMonth() + 1}/${date.getDate()}`
                    }}
                  />
                  <YAxis stroke="#a3a3a3" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#171717',
                      border: '1px solid #262626',
                      borderRadius: '8px',
                    }}
                    labelStyle={{ color: '#fff' }}
                  />
                  <Bar dataKey="views" fill="#fff" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                No data available
              </div>
            )}
          </div>
        </div>

        {/* Geographic Distribution */}
        <div className="bg-secondary rounded-lg p-4 border border-border">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Globe className="w-5 h-5" />
            Geographic Distribution
          </h3>
          <div className="h-64">
            {stats.geo_stats.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.geo_stats}
                    dataKey="count"
                    nameKey="country"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ country, percent }) =>
                      `${country} (${(percent * 100).toFixed(0)}%)`
                    }
                    labelLine={false}
                  >
                    {stats.geo_stats.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#171717',
                      border: '1px solid #262626',
                      borderRadius: '8px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                No data available
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Posts Performance */}
      <div className="bg-secondary rounded-lg p-4 border border-border">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Post Performance
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-muted-foreground text-sm border-b border-border">
                <th className="pb-3 font-medium">Title</th>
                <th className="pb-3 font-medium text-right">Views</th>
                <th className="pb-3 font-medium text-right">Unique Visitors</th>
              </tr>
            </thead>
            <tbody>
              {stats.posts_stats.map((post) => (
                <tr key={post.post_id} className="border-b border-border/50 last:border-0">
                  <td className="py-3 text-white">{post.title}</td>
                  <td className="py-3 text-right text-muted-foreground">{post.view_count}</td>
                  <td className="py-3 text-right text-muted-foreground">{post.unique_visitors}</td>
                </tr>
              ))}
              {stats.posts_stats.length === 0 && (
                <tr>
                  <td colSpan={3} className="py-8 text-center text-muted-foreground">
                    No posts yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Visitors */}
      <div className="bg-secondary rounded-lg p-4 border border-border">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Monitor className="w-5 h-5" />
          Recent Visitors
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-muted-foreground border-b border-border">
                <th className="pb-3 font-medium">Time</th>
                <th className="pb-3 font-medium">Location</th>
                <th className="pb-3 font-medium">Post</th>
                <th className="pb-3 font-medium">IP</th>
              </tr>
            </thead>
            <tbody>
              {visitors?.map((visitor) => (
                <tr key={visitor.id} className="border-b border-border/50 last:border-0">
                  <td className="py-3 text-muted-foreground whitespace-nowrap">
                    {formatDateTime(visitor.timestamp)}
                  </td>
                  <td className="py-3 text-white">
                    {visitor.city && visitor.country
                      ? `${visitor.city}, ${visitor.country}`
                      : visitor.country || 'Unknown'}
                  </td>
                  <td className="py-3 text-white max-w-[200px] truncate">
                    {visitor.post_title || '-'}
                  </td>
                  <td className="py-3 text-muted-foreground font-mono text-xs">
                    {visitor.ip_address || 'Unknown'}
                  </td>
                </tr>
              ))}
              {(!visitors || visitors.length === 0) && (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-muted-foreground">
                    No visitors yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
