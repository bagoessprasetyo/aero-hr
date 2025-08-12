"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { 
  CheckCircle2, 
  AlertCircle, 
  AlertTriangle, 
  Info, 
  X,
  Loader2 
} from "lucide-react"

// Toast Provider Context
interface Toast {
  id: string
  type: 'success' | 'error' | 'warning' | 'info' | 'loading'
  title: string
  description?: string
  duration?: number
  action?: {
    label: string
    onClick: () => void
  }
}

interface ToastContextType {
  toasts: Toast[]
  toast: (toast: Omit<Toast, 'id'>) => string
  dismiss: (id: string) => void
  dismissAll: () => void
  update: (id: string, toast: Partial<Toast>) => void
}

const ToastContext = React.createContext<ToastContextType | undefined>(undefined)

export function useToast() {
  const context = React.useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

// Toast Provider Component
interface ToastProviderProps {
  children: React.ReactNode
}

export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = React.useState<Toast[]>([])

  const toast = React.useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9)
    const newToast: Toast = {
      id,
      duration: 5000,
      ...toast,
    }

    setToasts((prev) => [...prev, newToast])

    // Auto-dismiss toast (unless it's a loading toast)
    if (toast.type !== 'loading' && newToast.duration && newToast.duration > 0) {
      setTimeout(() => {
        dismiss(id)
      }, newToast.duration)
    }

    return id
  }, [])

  const dismiss = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }, [])

  const dismissAll = React.useCallback(() => {
    setToasts([])
  }, [])

  const update = React.useCallback((id: string, updatedToast: Partial<Toast>) => {
    setToasts((prev) =>
      prev.map((toast) =>
        toast.id === id ? { ...toast, ...updatedToast } : toast
      )
    )
  }, [])

  return (
    <ToastContext.Provider value={{ toasts, toast, dismiss, dismissAll, update }}>
      {children}
      <ToastContainer />
    </ToastContext.Provider>
  )
}

// Individual Toast Component
interface ToastProps extends Toast {
  onDismiss: (id: string) => void
}

function Toast({ id, type, title, description, action, onDismiss }: ToastProps) {
  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="h-5 w-5 text-green-600" />
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-600" />
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />
      case 'info':
        return <Info className="h-5 w-5 text-blue-600" />
      case 'loading':
        return <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
    }
  }

  const getBackgroundColor = () => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200'
      case 'error':
        return 'bg-red-50 border-red-200'
      case 'warning':
        return 'bg-yellow-50 border-yellow-200'
      case 'info':
        return 'bg-blue-50 border-blue-200'
      case 'loading':
        return 'bg-blue-50 border-blue-200'
    }
  }

  return (
    <div
      className={cn(
        "relative flex w-full items-start space-x-3 rounded-lg border p-4 shadow-lg",
        "animate-in slide-in-from-top-5 duration-300",
        getBackgroundColor()
      )}
      role="alert"
    >
      <div className="flex-shrink-0">
        {getIcon()}
      </div>
      
      <div className="flex-1 min-w-0">
        <h4 className="font-semibold text-gray-900">{title}</h4>
        {description && (
          <p className="mt-1 text-sm text-gray-700">{description}</p>
        )}
        
        {action && (
          <div className="mt-3">
            <button
              onClick={action.onClick}
              className="text-sm font-medium text-blue-600 hover:text-blue-500"
            >
              {action.label}
            </button>
          </div>
        )}
      </div>
      
      {type !== 'loading' && (
        <button
          onClick={() => onDismiss(id)}
          className="flex-shrink-0 rounded-md p-1.5 text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <span className="sr-only">Dismiss</span>
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  )
}

// Toast Container Component
function ToastContainer() {
  const { toasts, dismiss } = useToast()

  return (
    <div
      className="fixed top-4 right-4 z-50 w-full max-w-sm space-y-4"
      aria-live="polite"
      aria-label="Notifications"
    >
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          {...toast}
          onDismiss={dismiss}
        />
      ))}
    </div>
  )
}

// Toast Hook Helpers
export function useSuccessToast() {
  const { toast } = useToast()
  return React.useCallback((title: string, description?: string) => {
    return toast({ type: 'success', title, description })
  }, [toast])
}

export function useErrorToast() {
  const { toast } = useToast()
  return React.useCallback((title: string, description?: string) => {
    return toast({ type: 'error', title, description })
  }, [toast])
}

export function useWarningToast() {
  const { toast } = useToast()
  return React.useCallback((title: string, description?: string) => {
    return toast({ type: 'warning', title, description })
  }, [toast])
}

export function useInfoToast() {
  const { toast } = useToast()
  return React.useCallback((title: string, description?: string) => {
    return toast({ type: 'info', title, description })
  }, [toast])
}

export function useLoadingToast() {
  const { toast, update, dismiss } = useToast()
  return React.useCallback((title: string, description?: string) => {
    const id = toast({ type: 'loading', title, description, duration: 0 })
    
    return {
      id,
      success: (successTitle: string, successDescription?: string) => {
        update(id, { 
          type: 'success', 
          title: successTitle, 
          description: successDescription,
          duration: 5000
        })
        setTimeout(() => dismiss(id), 5000)
      },
      error: (errorTitle: string, errorDescription?: string) => {
        update(id, { 
          type: 'error', 
          title: errorTitle, 
          description: errorDescription,
          duration: 5000 
        })
        setTimeout(() => dismiss(id), 5000)
      },
      dismiss: () => dismiss(id)
    }
  }, [toast, update, dismiss])
}