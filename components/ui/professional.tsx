/**
 * Professional UI Components
 * Enhanced components using Aero HR Design System
 */

import React from 'react'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { LucideIcon } from 'lucide-react'

// Modern Professional Card Component
interface ProfessionalCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'interactive' | 'outlined' | 'minimal'
  children: React.ReactNode
}

export function ProfessionalCard({ 
  variant = 'default', 
  className, 
  children, 
  ...props 
}: ProfessionalCardProps) {
  const variantClasses = {
    default: 'bg-white border border-gray-200/60 shadow-sm',
    elevated: 'bg-white border border-gray-200/60 shadow-lg shadow-gray-900/5',
    interactive: 'bg-white border border-gray-200/60 shadow-sm hover:shadow-lg hover:shadow-gray-900/5 hover:border-gray-300/60 transition-all duration-300 cursor-pointer',
    outlined: 'bg-white border-2 border-gray-200 shadow-none hover:border-gray-300 transition-colors duration-200',
    minimal: 'bg-gray-50/30 border border-gray-100 shadow-none'
  }
  
  return (
    <Card 
      className={cn(
        'rounded-2xl overflow-hidden backdrop-blur-sm',
        variantClasses[variant],
        className
      )}
      {...props}
    >
      {children}
    </Card>
  )
}

// Modern Status Badge
interface StatusBadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  status: 'active' | 'inactive' | 'pending' | 'error' | 'success' | 'warning'
  children: React.ReactNode
  variant?: 'default' | 'subtle' | 'outline'
}

export function StatusBadge({ status, children, className, variant = 'default', ...props }: StatusBadgeProps) {
  const statusClasses = {
    default: {
      active: 'bg-emerald-100 text-emerald-800 ring-emerald-600/20',
      inactive: 'bg-gray-100 text-gray-700 ring-gray-500/20',
      pending: 'bg-amber-100 text-amber-800 ring-amber-600/20',
      error: 'bg-red-100 text-red-800 ring-red-600/20',
      success: 'bg-emerald-100 text-emerald-800 ring-emerald-600/20',
      warning: 'bg-amber-100 text-amber-800 ring-amber-600/20'
    },
    subtle: {
      active: 'bg-emerald-50 text-emerald-700 ring-emerald-600/10',
      inactive: 'bg-gray-50 text-gray-600 ring-gray-500/10',
      pending: 'bg-amber-50 text-amber-700 ring-amber-600/10',
      error: 'bg-red-50 text-red-700 ring-red-600/10',
      success: 'bg-emerald-50 text-emerald-700 ring-emerald-600/10',
      warning: 'bg-amber-50 text-amber-700 ring-amber-600/10'
    },
    outline: {
      active: 'bg-white text-emerald-700 ring-emerald-600/40 border border-emerald-200',
      inactive: 'bg-white text-gray-600 ring-gray-500/40 border border-gray-200',
      pending: 'bg-white text-amber-700 ring-amber-600/40 border border-amber-200',
      error: 'bg-white text-red-700 ring-red-600/40 border border-red-200',
      success: 'bg-white text-emerald-700 ring-emerald-600/40 border border-emerald-200',
      warning: 'bg-white text-amber-700 ring-amber-600/40 border border-amber-200'
    }
  }
  
  return (
    <span 
      className={cn(
        'inline-flex items-center px-2.5 py-1.5 rounded-full text-xs font-medium ring-1 ring-inset transition-colors duration-200',
        statusClasses[variant][status],
        className
      )}
      {...props}
    >
      {children}
    </span>
  )
}

// Modern Action Button
interface ActionButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'ghost' | 'outline'
  size?: 'sm' | 'md' | 'lg' | 'xl'
  children: React.ReactNode
}

export function ActionButton({ 
  variant = 'primary', 
  size = 'md', 
  className, 
  children, 
  ...props 
}: ActionButtonProps) {
  const variantClasses = {
    primary: 'bg-gray-900 hover:bg-gray-800 text-white shadow-sm ring-1 ring-gray-900/10 hover:ring-gray-900/20',
    secondary: 'bg-white hover:bg-gray-50 text-gray-900 shadow-sm ring-1 ring-gray-300 hover:ring-gray-400',
    success: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm ring-1 ring-emerald-600/10 hover:ring-emerald-600/20',
    warning: 'bg-amber-500 hover:bg-amber-600 text-white shadow-sm ring-1 ring-amber-500/10 hover:ring-amber-500/20',
    error: 'bg-red-600 hover:bg-red-700 text-white shadow-sm ring-1 ring-red-600/10 hover:ring-red-600/20',
    ghost: 'bg-transparent hover:bg-gray-100 text-gray-700 hover:text-gray-900',
    outline: 'bg-transparent hover:bg-gray-50 text-gray-700 border-2 border-gray-200 hover:border-gray-300'
  }
  
  const sizeClasses = {
    sm: 'px-2.5 py-1.5 text-xs rounded-lg',
    md: 'px-3.5 py-2 text-sm rounded-lg',
    lg: 'px-4 py-2.5 text-sm rounded-xl',
    xl: 'px-6 py-3 text-base rounded-xl'
  }
  
  return (
    <Button
      className={cn(
        'inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900/20 disabled:opacity-50 disabled:pointer-events-none',
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {children}
    </Button>
  )
}

// Modern Dashboard Widget
interface DashboardWidgetProps {
  title: string
  value: string | number
  subtitle?: string
  icon?: LucideIcon
  trend?: {
    value: number
    isPositive: boolean
    label: string
  }
  className?: string
  children?: React.ReactNode
}

export function DashboardWidget({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  className,
  children
}: DashboardWidgetProps) {
  return (
    <Card className={cn(
      "relative bg-white border border-gray-200/60 shadow-sm hover:shadow-lg hover:shadow-gray-900/5 hover:border-gray-300/60 transition-all duration-300 rounded-2xl overflow-hidden group",
      className
    )}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-sm font-medium text-gray-600 group-hover:text-gray-700 transition-colors">
              {title}
            </CardTitle>
          </div>
          {Icon && (
            <div className="flex-shrink-0 p-2.5 bg-gray-50 rounded-xl group-hover:bg-gray-100 transition-colors">
              <Icon className="h-5 w-5 text-gray-600" />
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0 pb-6">
        <div className="space-y-3">
          <div className="text-2xl font-bold text-gray-900 tracking-tight">
            {typeof value === 'number' ? value.toLocaleString() : value}
          </div>
          
          {subtitle && (
            <p className="text-sm text-gray-500 leading-relaxed">{subtitle}</p>
          )}
          
          {trend && (
            <div className="flex items-center gap-2">
              <span className={cn(
                "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ring-1 ring-inset",
                trend.isPositive 
                  ? "bg-emerald-50 text-emerald-700 ring-emerald-600/20" 
                  : "bg-red-50 text-red-700 ring-red-600/20"
              )}>
                <span className={cn(
                  "text-xs font-bold",
                  trend.isPositive ? "text-emerald-600" : "text-red-600"
                )}>
                  {trend.isPositive ? "↗" : "↘"}
                </span>
                {Math.abs(trend.value)}%
              </span>
              <span className="text-xs text-gray-500">{trend.label}</span>
            </div>
          )}
          
          {children}
        </div>
      </CardContent>
    </Card>
  )
}

// Interactive Stats Card
interface InteractiveStatsCardProps {
  title: string
  stats: Array<{
    label: string
    value: number
    color: string
    percentage?: number
  }>
  className?: string
  onItemClick?: (item: any) => void
}

export function InteractiveStatsCard({
  title,
  stats,
  className,
  onItemClick
}: InteractiveStatsCardProps) {
  const total = stats.reduce((sum, stat) => sum + stat.value, 0)

  return (
    <Card className={cn(
      "bg-white border border-gray-200/60 shadow-sm rounded-2xl",
      className
    )}>
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-gray-900">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {stats.map((stat, index) => {
            const percentage = total > 0 ? (stat.value / total) * 100 : 0
            
            return (
              <div
                key={index}
                className={cn(
                  "flex items-center justify-between p-3 rounded-xl transition-all duration-200 group",
                  onItemClick && "cursor-pointer hover:bg-gray-50 hover:shadow-sm hover:scale-[1.02]"
                )}
                onClick={() => onItemClick?.(stat)}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-3 h-3 rounded-full ring-2 ring-white shadow-sm"
                    style={{ backgroundColor: stat.color }}
                  />
                  <span className="font-medium text-gray-900 group-hover:text-gray-800 transition-colors">{stat.label}</span>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-gray-900 group-hover:text-gray-800 transition-colors">
                    {stat.value}
                  </div>
                  <div className="text-xs text-gray-500 group-hover:text-gray-600 transition-colors">
                    {percentage.toFixed(1)}%
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

// Quick Action Grid
interface QuickActionProps {
  icon: LucideIcon
  label: string
  description?: string
  onClick: () => void
  color?: string
}

interface QuickActionGridProps {
  actions: QuickActionProps[]
  className?: string
}

export function QuickActionGrid({ actions, className }: QuickActionGridProps) {
  return (
    <div className={cn(
      "grid grid-cols-2 md:grid-cols-2 gap-3",
      className
    )}>
      {actions.map((action, index) => (
        <Card
          key={index}
          className="group p-4 cursor-pointer transition-all duration-200 hover:shadow-lg hover:shadow-gray-900/5 hover:scale-[1.02] bg-white border border-gray-200/60 rounded-2xl hover:border-gray-300/60"
          onClick={action.onClick}
        >
          <div className="text-center space-y-3">
            <div className={cn(
              "mx-auto w-11 h-11 rounded-2xl flex items-center justify-center transition-colors duration-200 group-hover:scale-110",
              action.color || "bg-gray-100 group-hover:bg-gray-200"
            )}>
              <action.icon className={cn(
                "h-5 w-5 transition-colors duration-200",
                action.color ? "text-white" : "text-gray-600 group-hover:text-gray-700"
              )} />
            </div>
            <div>
              <h3 className="font-medium text-gray-900 text-sm group-hover:text-gray-800 transition-colors">
                {action.label}
              </h3>
              {action.description && (
                <p className="text-xs text-gray-500 mt-1 group-hover:text-gray-600 transition-colors">
                  {action.description}
                </p>
              )}
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}

// Empty State Component
interface EmptyStateProps {
  icon?: LucideIcon
  title: string
  description: string
  action?: {
    label: string
    onClick: () => void
  }
  className?: string
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className
}: EmptyStateProps) {
  return (
    <div className={cn(
      "flex flex-col items-center justify-center py-12 px-6 text-center",
      className
    )}>
      {Icon && (
        <div className="mb-6 p-4 bg-gray-50 rounded-2xl ring-1 ring-gray-100">
          <Icon className="h-8 w-8 text-gray-400" />
        </div>
      )}
      <h3 className="text-lg font-semibold text-gray-900 mb-3 tracking-tight">{title}</h3>
      <p className="text-gray-500 mb-8 max-w-md leading-relaxed text-sm">{description}</p>
      {action && (
        <ActionButton variant="primary" onClick={action.onClick}>
          {action.label}
        </ActionButton>
      )}
    </div>
  )
}

// Loading Skeleton Component
interface LoadingSkeletonProps {
  className?: string
  variant?: 'card' | 'table' | 'form'
}

// Stats Card Component (alias for DashboardWidget)
export const StatsCard = DashboardWidget

export function LoadingSkeleton({ className, variant = 'card' }: LoadingSkeletonProps) {
  if (variant === 'table') {
    return (
      <div className={cn("space-y-4", className)}>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center space-x-4 p-4 bg-white border border-gray-200/60 rounded-2xl">
            <div className="w-10 h-10 bg-gray-100 rounded-2xl animate-pulse" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-100 rounded-lg animate-pulse" />
              <div className="h-3 bg-gray-100 rounded-lg animate-pulse w-2/3" />
            </div>
            <div className="w-20 h-4 bg-gray-100 rounded-lg animate-pulse" />
          </div>
        ))}
      </div>
    )
  }

  if (variant === 'form') {
    return (
      <div className={cn("space-y-4", className)}>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="space-y-3">
            <div className="h-4 w-24 bg-gray-100 rounded-lg animate-pulse" />
            <div className="h-12 bg-gray-100 rounded-xl animate-pulse" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <Card className={cn("p-6 bg-white border border-gray-200/60 rounded-2xl", className)}>
      <div className="space-y-4">
        <div className="h-4 bg-gray-100 rounded-lg animate-pulse w-3/4" />
        <div className="h-20 bg-gray-100 rounded-xl animate-pulse" />
        <div className="flex space-x-3">
          <div className="h-4 bg-gray-100 rounded-lg animate-pulse w-1/4" />
          <div className="h-4 bg-gray-100 rounded-lg animate-pulse w-1/4" />
        </div>
      </div>
    </Card>
  )
}