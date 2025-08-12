/**
 * Professional UI Components
 * Enhanced components using Aero HR Design System
 */

import React from 'react'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { utils } from '@/lib/design-system'

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
    active: 'bg-status-success-100 text-status-success-800 border-status-success-200',
    inactive: 'bg-gray-100 text-gray-800 border-gray-200',
    pending: 'bg-status-warning-100 text-status-warning-800 border-status-warning-200',
    error: 'bg-status-error-100 text-status-error-800 border-status-error-200',
    success: 'bg-status-success-100 text-status-success-800 border-status-success-200',
    warning: 'bg-status-warning-100 text-status-warning-800 border-status-warning-200'
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

// Professional Module Badge
interface ModuleBadgeProps {
  module: 'employee' | 'salary' | 'payroll' | 'tax'
  children: React.ReactNode
  className?: string
}

export function ModuleBadge({ module, children, className }: ModuleBadgeProps) {
  const moduleClasses = {
    employee: 'bg-employee-100 text-employee-800 border-employee-200',
    salary: 'bg-salary-100 text-salary-800 border-salary-200',
    payroll: 'bg-payroll-100 text-payroll-800 border-payroll-200',
    tax: 'bg-primary-100 text-primary-800 border-primary-200'
  }
  
  return (
    <Badge 
      className={cn(
        'px-2.5 py-0.5 text-xs font-medium border',
        moduleClasses[module],
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
    primary: 'bg-primary-600 hover:bg-primary-700 text-white border-transparent',
    secondary: 'bg-gray-100 hover:bg-gray-200 text-gray-900 border-gray-300',
    success: 'bg-status-success-500 hover:bg-status-success-600 text-white border-transparent',
    warning: 'bg-status-warning-500 hover:bg-status-warning-600 text-white border-transparent',
    error: 'bg-status-error-500 hover:bg-status-error-600 text-white border-transparent'
  }
  
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base'
  }
  
  return (
    <Button
      className={cn(
        'font-medium border transition-all duration-200',
        utils.getFocusRing(),
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

// Professional Stats Card
interface StatsCardProps {
  title: string
  value: string | number
  subtitle?: string
  trend?: 'up' | 'down' | 'neutral'
  trendValue?: string
  icon?: React.ReactNode
  module?: 'employee' | 'salary' | 'payroll' | 'tax'
  className?: string
}

export function StatsCard({ 
  title, 
  value, 
  subtitle, 
  trend, 
  trendValue, 
  icon, 
  module,
  className 
}: StatsCardProps) {
  const trendClasses = {
    up: 'text-status-success-600',
    down: 'text-status-error-600',
    neutral: 'text-gray-500'
  }
  
  const iconBgClasses = module ? {
    employee: 'bg-employee-100 text-employee-600',
    salary: 'bg-salary-100 text-salary-600',
    payroll: 'bg-payroll-100 text-payroll-600',
    tax: 'bg-primary-100 text-primary-600'
  }[module] : 'bg-gray-100 text-gray-600'
  
  return (
    <ProfessionalCard module={module} className={className}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-gray-600">
            {title}
          </CardTitle>
          {icon && (
            <div className={cn('p-2 rounded-lg', iconBgClasses)}>
              {icon}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-baseline space-x-2">
          <p className="text-2xl font-bold text-gray-900">
            {typeof value === 'number' ? value.toLocaleString() : value}
          </p>
          {trend && trendValue && (
            <span className={cn('text-sm font-medium', trendClasses[trend])}>
              {trendValue}
            </span>
          )}
        </div>
        {subtitle && (
          <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
        )}
      </CardContent>
    </ProfessionalCard>
  )
}

// Professional Loading Skeleton
interface LoadingSkeletonProps {
  lines?: number
  className?: string
}

export function LoadingSkeleton({ lines = 3, className }: LoadingSkeletonProps) {
  return (
    <div className={cn('animate-pulse space-y-3', className)}>
      {Array.from({ length: lines }, (_, i) => (
        <div 
          key={i} 
          className={cn(
            'h-4 bg-gray-200 rounded',
            i === lines - 1 ? 'w-3/4' : 'w-full'
          )} 
        />
      ))}
    </div>
  )
}

// Professional Empty State
interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: React.ReactNode
  className?: string
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('text-center py-12', className)}>
      {icon && (
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center text-gray-400">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
      {description && (
        <p className="text-sm text-gray-500 mb-6 max-w-sm mx-auto">{description}</p>
      )}
      {action && action}
    </div>
  )
}

// Professional Form Section
interface FormSectionProps {
  title: string
  description?: string
  icon?: React.ReactNode
  children: React.ReactNode
  className?: string
}

export function FormSection({ title, description, icon, children, className }: FormSectionProps) {
  return (
    <ProfessionalCard className={className}>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          {icon && <span className="text-primary-600">{icon}</span>}
          <span>{title}</span>
        </CardTitle>
        {description && (
          <CardDescription>{description}</CardDescription>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {children}
      </CardContent>
    </ProfessionalCard>
  )
}

// Professional Data Row
interface DataRowProps {
  label: string
  value: React.ReactNode
  badge?: React.ReactNode
  action?: React.ReactNode
  hover?: boolean
  className?: string
}

export function DataRow({ label, value, badge, action, hover = false, className }: DataRowProps) {
  return (
    <div 
      className={cn(
        'flex items-center justify-between p-4 border-b border-gray-100 last:border-b-0',
        hover && 'hover:bg-gray-50 transition-colors duration-150',
        className
      )}
    >
      <div className="flex items-center space-x-3">
        <div>
          <p className="text-sm font-medium text-gray-900">{label}</p>
          <div className="text-sm text-gray-500">{value}</div>
        </div>
        {badge && badge}
      </div>
      {action && (
        <div className="flex items-center space-x-2">
          {action}
        </div>
      )}
    </div>
  )
}

export {
  utils as designUtils
}