"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { 
  HelpCircle, 
  MessageCircle, 
  Book, 
  Video, 
  Keyboard,
  X,
  Zap
} from 'lucide-react'
import { useHelp } from './help-provider'
import { cn } from '@/lib/utils'

interface HelpAction {
  id: string
  label: string
  icon: React.ComponentType<any>
  action: () => void
  color: string
}

export function HelpFloatingButton() {
  const [isExpanded, setIsExpanded] = useState(false)
  const router = useRouter()
  const { openCommandPalette } = useHelp()

  const helpActions: HelpAction[] = [
    {
      id: 'command-palette',
      label: 'Search Help',
      icon: Zap,
      action: openCommandPalette,
      color: 'bg-blue-500 hover:bg-blue-600'
    },
    {
      id: 'help-center',
      label: 'Help Center',
      icon: Book,
      action: () => router.push('/help'),
      color: 'bg-green-500 hover:bg-green-600'
    },
    {
      id: 'video-tutorials',
      label: 'Video Tutorials',
      icon: Video,
      action: () => router.push('/help?tab=videos'),
      color: 'bg-red-500 hover:bg-red-600'
    },
    {
      id: 'keyboard-shortcuts',
      label: 'Keyboard Shortcuts',
      icon: Keyboard,
      action: () => router.push('/help?tab=shortcuts'),
      color: 'bg-purple-500 hover:bg-purple-600'
    },
    {
      id: 'contact-support',
      label: 'Contact Support',
      icon: MessageCircle,
      action: () => router.push('/help?tab=contact'),
      color: 'bg-orange-500 hover:bg-orange-600'
    }
  ]

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded)
  }

  const handleActionClick = (action: HelpAction) => {
    action.action()
    setIsExpanded(false)
  }

  return (
    <TooltipProvider>
      <div className="fixed bottom-6 right-6 z-40">
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.2 }}
              className="absolute bottom-16 right-0 space-y-3"
            >
              {helpActions.map((action, index) => (
                <motion.div
                  key={action.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: index * 0.05, duration: 0.2 }}
                >
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="sm"
                        onClick={() => handleActionClick(action)}
                        className={cn(
                          "h-12 w-12 rounded-full shadow-lg text-white border-0",
                          action.color
                        )}
                      >
                        <action.icon className="h-5 w-5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="left" className="mr-2">
                      {action.label}
                    </TooltipContent>
                  </Tooltip>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Help Button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button
                size="lg"
                onClick={toggleExpanded}
                className={cn(
                  "h-14 w-14 rounded-full shadow-lg transition-all duration-200",
                  isExpanded 
                    ? "bg-red-500 hover:bg-red-600" 
                    : "bg-primary hover:bg-primary/90"
                )}
              >
                <AnimatePresence mode="wait">
                  {isExpanded ? (
                    <motion.div
                      key="close"
                      initial={{ rotate: 180, opacity: 0 }}
                      animate={{ rotate: 0, opacity: 1 }}
                      exit={{ rotate: -180, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <X className="h-6 w-6" />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="help"
                      initial={{ rotate: -180, opacity: 0 }}
                      animate={{ rotate: 0, opacity: 1 }}
                      exit={{ rotate: 180, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <HelpCircle className="h-6 w-6" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </Button>
            </motion.div>
          </TooltipTrigger>
          <TooltipContent side="left" className="mr-2">
            {isExpanded ? 'Close help menu' : 'Get help'}
          </TooltipContent>
        </Tooltip>

        {/* Pulsing indicator for new users */}
        {!isExpanded && (
          <motion.div
            className="absolute inset-0 rounded-full bg-primary"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.7, 0, 0.7],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        )}
      </div>
    </TooltipProvider>
  )
}