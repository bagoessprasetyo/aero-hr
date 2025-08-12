/**
 * Feedback System Utilities
 * Professional feedback patterns for user actions
 */

// Toast interface is defined within the toast component - no import needed

// Common feedback messages for HR operations
export const feedbackMessages = {
  employee: {
    created: {
      title: "Employee Added Successfully",
      description: "New employee has been added to the system"
    },
    updated: {
      title: "Employee Updated",
      description: "Employee information has been saved"
    },
    deleted: {
      title: "Employee Removed",
      description: "Employee has been removed from the system"
    },
    activated: {
      title: "Employee Activated",
      description: "Employee status has been changed to active"
    },
    deactivated: {
      title: "Employee Deactivated",
      description: "Employee status has been changed to inactive"
    }
  },
  salary: {
    componentCreated: {
      title: "Salary Component Added",
      description: "New salary component has been configured"
    },
    componentUpdated: {
      title: "Salary Component Updated",
      description: "Salary component has been modified"
    },
    componentDeleted: {
      title: "Salary Component Removed",
      description: "Salary component has been deleted"
    },
    bulkAdjustment: {
      title: "Bulk Adjustment Completed",
      description: "Salary adjustments have been applied successfully"
    },
    reviewScheduled: {
      title: "Review Scheduled",
      description: "Salary review has been scheduled successfully"
    }
  },
  payroll: {
    calculated: {
      title: "Payroll Calculated",
      description: "Payroll has been calculated for all employees"
    },
    finalized: {
      title: "Payroll Finalized",
      description: "Payroll has been finalized and cannot be changed"
    },
    exported: {
      title: "Payroll Exported",
      description: "Payroll data has been exported successfully"
    }
  },
  system: {
    saved: {
      title: "Changes Saved",
      description: "Your changes have been saved successfully"
    },
    error: {
      title: "Something went wrong",
      description: "Please try again or contact support if the problem persists"
    },
    networkError: {
      title: "Network Error",
      description: "Please check your internet connection and try again"
    },
    validationError: {
      title: "Validation Error",
      description: "Please check the form and correct any errors"
    },
    unauthorized: {
      title: "Access Denied",
      description: "You don't have permission to perform this action"
    }
  }
} as const

// Async operation feedback helper
export interface AsyncFeedbackOptions {
  loadingTitle?: string
  loadingDescription?: string
  successTitle?: string
  successDescription?: string
  errorTitle?: string
  errorDescription?: string
}

// Standard loading messages for different operations
export const loadingMessages = {
  saving: {
    title: "Saving...",
    description: "Please wait while we save your changes"
  },
  loading: {
    title: "Loading...",
    description: "Please wait while we fetch the data"
  },
  calculating: {
    title: "Calculating...",
    description: "Please wait while we calculate the payroll"
  },
  processing: {
    title: "Processing...",
    description: "Please wait while we process your request"
  },
  exporting: {
    title: "Exporting...",
    description: "Please wait while we generate your report"
  },
  uploading: {
    title: "Uploading...",
    description: "Please wait while we upload your files"
  }
} as const

// Error categorization for better user experience
export const categorizeError = (error: any): 'network' | 'validation' | 'unauthorized' | 'server' | 'unknown' => {
  if (!error) return 'unknown'
  
  // Network errors
  if (error.code === 'NETWORK_ERROR' || error.message?.includes('fetch')) {
    return 'network'
  }
  
  // Validation errors (usually 400)
  if (error.status === 400 || error.code === 'VALIDATION_ERROR') {
    return 'validation'
  }
  
  // Unauthorized errors (401/403)
  if (error.status === 401 || error.status === 403) {
    return 'unauthorized'
  }
  
  // Server errors (500+)
  if (error.status >= 500) {
    return 'server'
  }
  
  return 'unknown'
}

// Get appropriate error message based on error type
export const getErrorMessage = (error: any) => {
  const category = categorizeError(error)
  
  switch (category) {
    case 'network':
      return feedbackMessages.system.networkError
    case 'validation':
      return {
        title: feedbackMessages.system.validationError.title,
        description: error.message || feedbackMessages.system.validationError.description
      }
    case 'unauthorized':
      return feedbackMessages.system.unauthorized
    case 'server':
      return {
        title: "Server Error",
        description: "Our servers are experiencing issues. Please try again later."
      }
    default:
      return {
        title: feedbackMessages.system.error.title,
        description: error.message || feedbackMessages.system.error.description
      }
  }
}

// Format validation errors for display
export const formatValidationErrors = (errors: Record<string, string[]>): string => {
  const errorMessages = Object.entries(errors)
    .map(([field, messages]) => `${field}: ${messages.join(', ')}`)
    .join('\n')
  
  return errorMessages
}

// Success action helpers
export const successActions = {
  viewEmployee: (employeeId: string) => ({
    label: "View Employee",
    onClick: () => window.location.href = `/employees/${employeeId}`
  }),
  viewPayroll: (payrollId: string) => ({
    label: "View Payroll",
    onClick: () => window.location.href = `/payroll/${payrollId}`
  }),
  downloadReport: (downloadUrl: string) => ({
    label: "Download Report",
    onClick: () => window.open(downloadUrl, '_blank')
  }),
  refresh: () => ({
    label: "Refresh",
    onClick: () => window.location.reload()
  })
}

// Professional confirmation dialogs (to be used with a modal system)
export interface ConfirmationOptions {
  title: string
  description: string
  confirmText?: string
  cancelText?: string
  variant?: 'danger' | 'warning' | 'default'
}

export const confirmationMessages = {
  deleteEmployee: {
    title: "Delete Employee",
    description: "Are you sure you want to delete this employee? This action cannot be undone.",
    confirmText: "Delete Employee",
    variant: 'danger' as const
  },
  finalizePayroll: {
    title: "Finalize Payroll",
    description: "Once finalized, this payroll cannot be modified. Are you sure you want to continue?",
    confirmText: "Finalize Payroll",
    variant: 'warning' as const
  },
  bulkSalaryAdjustment: {
    title: "Apply Bulk Adjustment",
    description: "This will modify salary components for multiple employees. Are you sure you want to continue?",
    confirmText: "Apply Changes",
    variant: 'warning' as const
  }
} as const