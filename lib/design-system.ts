/**
 * Aero HR Design System
 * Professional color palette and design tokens for Indonesian HR system
 */

// Primary Color Palette - Professional Blues
export const colors = {
  primary: {
    50: '#eff6ff',
    100: '#dbeafe', 
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#3b82f6', // Main brand color
    600: '#2563eb',
    700: '#1d4ed8',
    800: '#1e40af',
    900: '#1e3a8a',
    950: '#172554'
  },
  
  // Secondary Colors for HR modules
  salary: {
    50: '#ecfdf5',
    100: '#d1fae5',
    200: '#a7f3d0',
    300: '#6ee7b7',
    400: '#34d399',
    500: '#10b981', // Green for salary/money
    600: '#059669',
    700: '#047857',
    800: '#065f46',
    900: '#064e3b'
  },
  
  employee: {
    50: '#f0f9ff',
    100: '#e0f2fe',
    200: '#bae6fd',
    300: '#7dd3fc',
    400: '#38bdf8',
    500: '#0ea5e9', // Sky blue for employees
    600: '#0284c7',
    700: '#0369a1',
    800: '#075985',
    900: '#0c4a6e'
  },
  
  payroll: {
    50: '#fdf4ff',
    100: '#fae8ff',
    200: '#f5d0fe',
    300: '#f0abfc',
    400: '#e879f9',
    500: '#d946ef', // Purple for payroll
    600: '#c026d3',
    700: '#a21caf',
    800: '#86198f',
    900: '#701a75'
  },
  
  // Status Colors
  status: {
    success: {
      50: '#ecfdf5',
      100: '#d1fae5',
      500: '#10b981',
      600: '#059669',
      700: '#047857'
    },
    warning: {
      50: '#fffbeb',
      100: '#fef3c7',
      500: '#f59e0b',
      600: '#d97706',
      700: '#b45309'
    },
    error: {
      50: '#fef2f2',
      100: '#fee2e2',
      500: '#ef4444',
      600: '#dc2626',
      700: '#b91c1c'
    },
    info: {
      50: '#eff6ff',
      100: '#dbeafe',
      500: '#3b82f6',
      600: '#2563eb',
      700: '#1d4ed8'
    }
  },
  
  // Neutral Colors
  gray: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827'
  }
}

// Typography Scale
export const typography = {
  fontFamily: {
    sans: ['Inter', 'system-ui', 'sans-serif'],
    mono: ['JetBrains Mono', 'Menlo', 'Monaco', 'monospace']
  },
  fontSize: {
    xs: ['0.75rem', '1rem'],
    sm: ['0.875rem', '1.25rem'],
    base: ['1rem', '1.5rem'],
    lg: ['1.125rem', '1.75rem'],
    xl: ['1.25rem', '1.75rem'],
    '2xl': ['1.5rem', '2rem'],
    '3xl': ['1.875rem', '2.25rem'],
    '4xl': ['2.25rem', '2.5rem']
  } as const,
  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700'
  }
}

// Spacing Scale (based on 4px grid)
export const spacing = {
  0: '0px',
  1: '0.25rem', // 4px
  2: '0.5rem',  // 8px
  3: '0.75rem', // 12px
  4: '1rem',    // 16px
  5: '1.25rem', // 20px
  6: '1.5rem',  // 24px
  8: '2rem',    // 32px
  10: '2.5rem', // 40px
  12: '3rem',   // 48px
  16: '4rem',   // 64px
  20: '5rem',   // 80px
  24: '6rem'    // 96px
}

// Border Radius
export const borderRadius = {
  none: '0px',
  sm: '0.125rem', // 2px
  md: '0.375rem', // 6px
  lg: '0.5rem',   // 8px
  xl: '0.75rem',  // 12px
  '2xl': '1rem',  // 16px
  full: '9999px'
}

// Box Shadows
export const boxShadow = {
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  base: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)'
}

// Animation Durations
export const animation = {
  duration: {
    fast: '150ms',
    normal: '200ms',
    slow: '300ms'
  },
  easing: {
    default: 'cubic-bezier(0.4, 0, 0.2, 1)',
    in: 'cubic-bezier(0.4, 0, 1, 1)',
    out: 'cubic-bezier(0, 0, 0.2, 1)',
    inOut: 'cubic-bezier(0.4, 0, 0.2, 1)'
  }
}

// Professional Component Variants
export const componentVariants = {
  card: {
    default: 'bg-white border border-gray-200 rounded-lg shadow-sm',
    elevated: 'bg-white border border-gray-200 rounded-lg shadow-md',
    highlighted: 'bg-white border-l-4 rounded-lg shadow-sm',
    interactive: 'bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200'
  },
  
  button: {
    primary: 'bg-primary-600 hover:bg-primary-700 text-white',
    secondary: 'bg-gray-100 hover:bg-gray-200 text-gray-900',
    success: 'bg-status-success-500 hover:bg-status-success-600 text-white',
    warning: 'bg-status-warning-500 hover:bg-status-warning-600 text-white',
    error: 'bg-status-error-500 hover:bg-status-error-600 text-white'
  },
  
  badge: {
    default: 'bg-gray-100 text-gray-800',
    primary: 'bg-primary-100 text-primary-800',
    success: 'bg-status-success-100 text-status-success-800',
    warning: 'bg-status-warning-100 text-status-warning-800',
    error: 'bg-status-error-100 text-status-error-800',
    salary: 'bg-salary-100 text-salary-800',
    employee: 'bg-employee-100 text-employee-800',
    payroll: 'bg-payroll-100 text-payroll-800'
  }
}

// HR-Specific Design Patterns
export const patterns = {
  // Module-specific border colors for cards
  moduleBorders: {
    employee: 'border-l-4 border-l-employee-500',
    salary: 'border-l-4 border-l-salary-500',
    payroll: 'border-l-4 border-l-payroll-500',
    tax: 'border-l-4 border-l-primary-500'
  },
  
  // Status indicators
  statusIndicators: {
    active: 'bg-status-success-500',
    inactive: 'bg-gray-400',
    pending: 'bg-status-warning-500',
    error: 'bg-status-error-500'
  },
  
  // Professional gradients
  gradients: {
    primary: 'bg-gradient-to-r from-primary-500 to-primary-600',
    salary: 'bg-gradient-to-r from-salary-500 to-salary-600',
    employee: 'bg-gradient-to-r from-employee-500 to-employee-600'
  }
}

// Utility functions for consistent styling
export const utils = {
  /**
   * Get professional card styling for specific modules
   */
  getModuleCard: (module: keyof typeof patterns.moduleBorders) => {
    return `${componentVariants.card.default} ${patterns.moduleBorders[module]}`
  },
  
  /**
   * Get status badge styling
   */
  getStatusBadge: (status: 'active' | 'inactive' | 'pending' | 'error') => {
    const colorMap = {
      active: componentVariants.badge.success,
      inactive: componentVariants.badge.default,
      pending: componentVariants.badge.warning,
      error: componentVariants.badge.error
    }
    return `px-2.5 py-0.5 rounded-full text-xs font-medium ${colorMap[status]}`
  },
  
  /**
   * Get professional hover transition
   */
  getHoverTransition: () => {
    return 'transition-all duration-200 ease-in-out'
  },
  
  /**
   * Get professional focus ring
   */
  getFocusRing: () => {
    return 'focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:outline-none'
  }
}

export default {
  colors,
  typography,
  spacing,
  borderRadius,
  boxShadow,
  animation,
  componentVariants,
  patterns,
  utils
}