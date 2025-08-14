"use client"

import Link from 'next/link'
import { ChevronRight, Home } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { ActionButton } from '@/components/ui/professional'

interface BreadcrumbItem {
  label: string
  href?: string
  current?: boolean
}

interface AdminBreadcrumbProps {
  items: BreadcrumbItem[]
  backAction?: () => void
}

export function AdminBreadcrumb({ items, backAction }: AdminBreadcrumbProps) {
  return (
    <div className="flex items-center justify-between mb-6">
      <nav className="flex items-center space-x-2 text-sm">
        <Link 
          href="/admin" 
          className="flex items-center text-muted-foreground hover:text-primary transition-colors"
        >
          <Home className="h-4 w-4 mr-1" />
          Admin
        </Link>
        
        {items.map((item, index) => (
          <div key={index} className="flex items-center space-x-2">
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
            {item.current ? (
              <span className="font-medium text-foreground">
                {item.label}
              </span>
            ) : item.href ? (
              <Link 
                href={item.href}
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                {item.label}
              </Link>
            ) : (
              <span className="text-muted-foreground">
                {item.label}
              </span>
            )}
          </div>
        ))}
      </nav>
      
      {backAction && (
        <ActionButton 
          variant="outline" 
          size="sm"
          onClick={backAction}
        >
          ← Back to Admin
        </ActionButton>
      )}
    </div>
  )
}