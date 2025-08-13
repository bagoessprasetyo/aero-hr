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

// Enhanced Professional Card Component
interface ProfessionalCardProps extends React.HTMLAttributes<HTMLDivElement> {
  module?: 'employee' | 'salary' | 'payroll' | 'tax'
  variant?: 'default' | 'elevated' | 'interactive'
  children: React.ReactNode
}

export function ProfessionalCard({ 
  module, 
  variant = 'default', 
  className, 
  children, 
  ...props 
}: ProfessionalCardProps) {
  const baseClasses = 'bg-gradient-to-br from-white to-gray-50 border border-gray-200 rounded-xl shadow-sm overflow-hidden'
  
  const variantClasses = {
    default: '',
    elevated: 'shadow-lg',
    interactive: 'hover:shadow-lg transition-shadow duration-300 cursor-pointer'
  }
  
  const moduleClasses = module ? {
    employee: 'bg-employee-50',
    salary: 'bg-salary-50', 
    payroll: 'bg-payroll-50',
    tax: 'bg-primary-50'
  }[module] : ''
  
  return (
    <Card 
      className={cn(
        baseClasses,
        variantClasses[variant],
        moduleClasses,
        className
      )}
      {...props}
    >
      {children}
    </Card>
  )
}

// Professional Status Badge
interface StatusBadgeProps {
  status: 'active' | 'inactive' | 'pending' | 'error' | 'success' | 'warning'
  children: React.ReactNode
  className?: string
}

export function StatusBadge({ status, children, className }: StatusBadgeProps) {
  const statusClasses = {
    active: 'bg-green-100 text-green-800 border-green-200',
    inactive: 'bg-gray-100 text-gray-800 border-gray-200',
    pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    error: 'bg-red-100 text-red-800 border-red-200',
    success: 'bg-green-100 text-green-800 border-green-200',
    warning: 'bg-yellow-100 text-yellow-800 border-yellow-200'
  }
  
  return (
    <Badge 
      className={cn(
        'px-2.5 py-0.5 text-xs font-medium border',
        statusClasses[status],
        className
      )}
    >
      {children}
    </Badge>
  )
}

// Professional Action Button
interface ActionButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'error'
  size?: 'sm' | 'md' | 'lg'
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
    primary: 'bg-blue-600 hover:bg-blue-700 text-white border-transparent',
    secondary: 'bg-gray-100 hover:bg-gray-200 text-gray-900 border-gray-300',
    success: 'bg-green-500 hover:bg-green-600 text-white border-transparent',
    warning: 'bg-yellow-500 hover:bg-yellow-600 text-white border-transparent',
    error: 'bg-red-500 hover:bg-red-600 text-white border-transparent'
  }
  
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base'
  }
  
  return (
    <Button
      className={cn(
        'font-medium border transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
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

// Enhanced Dashboard Widget
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
      "relative overflow-hidden bg-gradient-to-br from-white to-gray-50/50 border-gray-200 hover:shadow-md transition-all duration-300",
      className
    )}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-gray-600">
            {title}
          </CardTitle>
          {Icon && (
            <div className="p-2 bg-blue-50 rounded-lg">
              <Icon className="h-5 w-5 text-blue-600" />
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-2">
          <div className="text-3xl font-bold text-gray-900">
            {typeof value === 'number' ? value.toLocaleString() : value}
          </div>
          
          {subtitle && (
            <p className="text-sm text-gray-600">{subtitle}</p>
          )}
          
          {trend && (
            <div className="flex items-center gap-2 text-sm">
              <span className={cn(
                "flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium",
                trend.isPositive 
                  ? "bg-green-100 text-green-800" 
                  : "bg-red-100 text-red-800"
              )}>
                <span className={cn(
                  "text-xs",
                  trend.isPositive ? "text-green-600" : "text-red-600"
                )}>
                  {trend.isPositive ? "↗" : "↘"}
                </span>
                {Math.abs(trend.value)}%
              </span>
              <span className="text-gray-600">{trend.label}</span>
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
      "bg-gradient-to-br from-white to-gray-50/50 border-gray-200",
      className
    )}>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {stats.map((stat, index) => {
            const percentage = total > 0 ? (stat.value / total) * 100 : 0
            
            return (
              <div
                key={index}
                className={cn(
                  "flex items-center justify-between p-3 rounded-lg transition-all duration-200",
                  onItemClick && "cursor-pointer hover:bg-gray-50 hover:shadow-sm"
                )}
                onClick={() => onItemClick?.(stat)}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: stat.color }}
                  />
                  <span className="font-medium text-gray-900">{stat.label}</span>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-gray-900">
                    {stat.value}
                  </div>
                  <div className="text-xs text-gray-500">
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
      "grid grid-cols-2 md:grid-cols-4 gap-4",
      className
    )}>
      {actions.map((action, index) => (
        <Card
          key={index}
          className="p-4 cursor-pointer transition-all duration-200 hover:shadow-md hover:scale-105 bg-gradient-to-br from-white to-gray-50/50 border-gray-200"
          onClick={action.onClick}
        >
          <div className="text-center space-y-3">
            <div className={cn(
              "mx-auto w-12 h-12 rounded-xl flex items-center justify-center",
              action.color || "bg-blue-100"
            )}>
              <action.icon className={cn(
                "h-6 w-6",
                action.color ? "text-white" : "text-blue-600"
              )} />
            </div>
            <div>
              <h3 className="font-medium text-gray-900 text-sm">
                {action.label}
              </h3>
              {action.description && (
                <p className="text-xs text-gray-600 mt-1">
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
        <div className="mb-4 p-3 bg-gray-100 rounded-full">
          <Icon className="h-8 w-8 text-gray-400" />
        </div>
      )}
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 mb-6 max-w-md">{description}</p>
      {action && (
        <Button onClick={action.onClick} className="mt-4">
          {action.label}
        </Button>
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
      <div className={cn("space-y-3", className)}>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 rounded animate-pulse" />
              <div className="h-3 bg-gray-200 rounded animate-pulse w-2/3" />
            </div>
            <div className="w-20 h-4 bg-gray-200 rounded animate-pulse" />
          </div>
        ))}
      </div>
    )
  }

  if (variant === 'form') {
    return (
      <div className={cn("space-y-4", className)}>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
            <div className="h-10 bg-gray-200 rounded animate-pulse" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <Card className={cn("p-6", className)}>
      <div className="space-y-4">
        <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
        <div className="h-20 bg-gray-200 rounded animate-pulse" />
        <div className="flex space-x-2">
          <div className="h-4 bg-gray-200 rounded animate-pulse w-1/4" />
          <div className="h-4 bg-gray-200 rounded animate-pulse w-1/4" />
        </div>
      </div>
    </Card>
  )
}