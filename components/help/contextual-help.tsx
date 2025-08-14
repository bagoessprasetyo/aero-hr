"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { 
  HelpCircle, 
  Book, 
  Video, 
  ExternalLink,
  ChevronRight,
  X
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface HelpContent {
  id: string
  title: string
  description: string
  type: 'tip' | 'guide' | 'video' | 'link'
  content?: string
  url?: string
  duration?: string
}

interface ContextualHelpProps {
  topic: string
  position?: 'top' | 'bottom' | 'left' | 'right'
  variant?: 'icon' | 'button' | 'inline'
  className?: string
  helpContent?: HelpContent[]
}

const defaultHelpContent: Record<string, HelpContent[]> = {
  'employee-management': [
    {
      id: 'add-employee-tip',
      title: 'Adding Employees',
      description: 'Quick guide to adding new employees',
      type: 'tip',
      content: 'Click the "Add Employee" button to create a new employee profile. Make sure to include all required information like NIK, NPWP, and BPJS details for payroll compliance.'
    },
    {
      id: 'employee-management-guide',
      title: 'Employee Management Guide',
      description: 'Complete guide to managing employee profiles',
      type: 'guide',
      url: '/help?article=employee-management'
    },
    {
      id: 'employee-video',
      title: 'Employee Management Video',
      description: 'Complete walkthrough of employee features',
      type: 'video',
      url: '/help?video=employee-management',
      duration: '8:45'
    }
  ],
  'payroll-processing': [
    {
      id: 'payroll-calculation-tip',
      title: 'Payroll Calculation',
      description: 'Understanding the calculation process',
      type: 'tip',
      content: 'Payroll calculations are done in stages: 1) Basic salary + allowances, 2) BPJS deductions, 3) PPh 21 tax calculation, 4) Final net salary. All calculations follow Indonesian regulations.'
    },
    {
      id: 'payroll-calculation-guide',
      title: 'Payroll Calculation Process',
      description: 'Step-by-step payroll processing guide',
      type: 'guide',
      url: '/help?article=payroll-calculation'
    },
    {
      id: 'pph21-guide',
      title: 'PPh 21 Tax Configuration',
      description: 'Complete guide to Indonesian tax setup',
      type: 'link',
      url: '/help?article=pph21-guide'
    }
  ],
  'dashboard': [
    {
      id: 'dashboard-overview-tip',
      title: 'Dashboard Overview',
      description: 'Understanding your dashboard metrics',
      type: 'tip',
      content: 'Your dashboard shows key HR metrics including active employees, pending payrolls, and compliance status. Use the quick actions for common tasks.'
    },
    {
      id: 'getting-started-guide',
      title: 'Getting Started Guide',
      description: 'Complete setup and basic usage guide',
      type: 'guide',
      url: '/help?article=getting-started'
    }
  ]
}

export function ContextualHelp({ 
  topic, 
  position = 'right', 
  variant = 'icon',
  className,
  helpContent 
}: ContextualHelpProps) {
  const [isOpen, setIsOpen] = useState(false)
  
  const content = helpContent || defaultHelpContent[topic] || []
  
  if (content.length === 0) {
    return null
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'video':
        return <Video className="h-4 w-4 text-red-500" />
      case 'guide':
        return <Book className="h-4 w-4 text-blue-500" />
      case 'link':
        return <ExternalLink className="h-4 w-4 text-green-500" />
      default:
        return <HelpCircle className="h-4 w-4 text-gray-500" />
    }
  }

  const handleContentClick = (item: HelpContent) => {
    if (item.url) {
      if (item.url.startsWith('/help?article=')) {
        // Internal help article - navigate directly
        window.location.href = item.url
      } else {
        // External URL - open in new tab
        window.open(item.url, '_blank')
      }
    }
    setIsOpen(false)
  }

  const renderTrigger = () => {
    switch (variant) {
      case 'button':
        return (
          <Button variant="outline" size="sm" className={cn("h-8", className)}>
            <HelpCircle className="h-4 w-4 mr-2" />
            Help
          </Button>
        )
      case 'inline':
        return (
          <button className={cn(
            "inline-flex items-center text-sm text-muted-foreground hover:text-primary transition-colors",
            className
          )}>
            <HelpCircle className="h-4 w-4 mr-1" />
            Need help?
          </button>
        )
      default:
        return (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className={cn("h-6 w-6 p-0 rounded-full", className)}
                >
                  <HelpCircle className="h-4 w-4 text-muted-foreground hover:text-primary" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                Get help with {topic.replace('-', ' ')}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {renderTrigger()}
      </DialogTrigger>
      <DialogContent className="max-w-md p-0">
        <div className="flex items-center justify-between p-4 border-b">
          <h4 className="font-medium text-sm">
            Help: {topic.replace('-', ' ')}
          </h4>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={() => setIsOpen(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="max-h-80 overflow-y-auto">
          {content.map((item, index) => (
            <div key={item.id} className="border-b last:border-b-0">
              {item.type === 'tip' && item.content ? (
                <div className="p-4">
                  <div className="flex items-start space-x-3">
                    <div className="p-1.5 bg-blue-100 rounded-full">
                      {getTypeIcon(item.type)}
                    </div>
                    <div className="flex-1">
                      <h5 className="font-medium text-sm mb-1">{item.title}</h5>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {item.content}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => handleContentClick(item)}
                  className="w-full p-4 text-left hover:bg-gray-50 transition-colors group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-start space-x-3">
                      <div className="p-1.5 bg-gray-100 rounded-full group-hover:bg-gray-200 transition-colors">
                        {getTypeIcon(item.type)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h5 className="font-medium text-sm group-hover:text-primary transition-colors">
                            {item.title}
                          </h5>
                          <Badge variant="outline" className="text-xs">
                            {item.type}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {item.description}
                        </p>
                        {item.duration && (
                          <p className="text-xs text-blue-600 mt-1">
                            Duration: {item.duration}
                          </p>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                  </div>
                </button>
              )}
            </div>
          ))}
        </div>

        <div className="p-3 border-t bg-gray-50">
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => {
              window.open('/help', '_blank')
              setIsOpen(false)
            }}
          >
            <Book className="h-4 w-4 mr-2" />
            View All Help Articles
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}