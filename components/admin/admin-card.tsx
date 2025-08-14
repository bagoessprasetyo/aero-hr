"use client"

import { LucideIcon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { ProfessionalCard } from '@/components/ui/professional'
import { CardContent, CardHeader } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface AdminCardProps {
  title: string
  description: string
  icon: LucideIcon
  stats?: {
    primary: string
    secondary?: string
    status: 'healthy' | 'warning' | 'critical' | 'info'
    statusText: string
  }
  href?: string
  onClick?: () => void
  className?: string
  iconColor?: string
  gradient?: string
}

export function AdminCard({
  title,
  description,
  icon: Icon,
  stats,
  href,
  onClick,
  className,
  iconColor = "text-blue-600",
  gradient = "from-blue-500 to-purple-600"
}: AdminCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'info':
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200'
    }
  }

  const handleClick = () => {
    if (onClick) {
      onClick()
    } else if (href) {
      window.location.href = href
    }
  }

  return (
    <ProfessionalCard 
      variant="interactive" 
      className={cn(
        "group cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-[1.02] border-l-4 border-l-transparent hover:border-l-blue-500",
        className
      )}
      onClick={handleClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className={`p-3 bg-gradient-to-br ${gradient} rounded-xl group-hover:shadow-lg transition-all duration-300`}>
              <Icon className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-lg text-gray-900 group-hover:text-blue-600 transition-colors">
                {title}
              </h3>
              <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                {description}
              </p>
            </div>
          </div>
        </div>
      </CardHeader>
      
      {stats && (
        <CardContent className="pt-0">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="text-2xl font-bold text-gray-900">
                {stats.primary}
              </div>
              {stats.secondary && (
                <div className="text-sm text-muted-foreground">
                  {stats.secondary}
                </div>
              )}
            </div>
            <Badge className={`${getStatusColor(stats.status)} text-xs`}>
              {stats.statusText}
            </Badge>
          </div>
        </CardContent>
      )}
    </ProfessionalCard>
  )
}