"use client"

import React, { useState, useEffect, forwardRef } from 'react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { formatCurrencyInput, parseCurrency, formatCurrencyPlaceholder } from '@/lib/utils/validation'

interface CurrencyInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'type'> {
  value: number
  onChange: (value: number) => void
  placeholder?: string
  className?: string
  prefix?: string
  allowNegative?: boolean
  maxValue?: number
  minValue?: number
}

export const CurrencyInput = forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ 
    value, 
    onChange, 
    placeholder, 
    className, 
    prefix = 'Rp',
    allowNegative = false,
    maxValue,
    minValue = 0,
    onFocus,
    onBlur,
    ...props 
  }, ref) => {
    const [displayValue, setDisplayValue] = useState('')
    const [isFocused, setIsFocused] = useState(false)

    // Update display value when value prop changes
    useEffect(() => {
      if (!isFocused) {
        setDisplayValue(formatCurrencyInput(value))
      }
    }, [value, isFocused])

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(true)
      // Show raw number for editing
      setDisplayValue(value > 0 ? value.toString() : '')
      onFocus?.(e)
    }

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false)
      // Format the display value
      const numericValue = parseCurrency(e.target.value)
      const clampedValue = Math.max(
        minValue, 
        maxValue ? Math.min(numericValue, maxValue) : numericValue
      )
      
      if (clampedValue !== value) {
        onChange(clampedValue)
      }
      
      setDisplayValue(formatCurrencyInput(clampedValue))
      onBlur?.(e)
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value
      
      if (isFocused) {
        // During focus, allow raw number input
        const numericValue = inputValue === '' ? 0 : parseFloat(inputValue.replace(/[^\d.-]/g, '')) || 0
        
        // Validate range
        if (!allowNegative && numericValue < 0) return
        if (maxValue && numericValue > maxValue) return
        if (numericValue < minValue) return
        
        setDisplayValue(inputValue)
        onChange(numericValue)
      } else {
        // Not focused, parse formatted input
        const numericValue = parseCurrency(inputValue)
        const clampedValue = Math.max(
          minValue, 
          maxValue ? Math.min(numericValue, maxValue) : numericValue
        )
        
        onChange(clampedValue)
        setDisplayValue(formatCurrencyInput(clampedValue))
      }
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      // Allow: backspace, delete, tab, escape, enter, decimal point
      if ([8, 9, 27, 13, 46, 190].includes(e.keyCode) ||
          // Allow: Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
          (e.keyCode === 65 && e.ctrlKey) ||
          (e.keyCode === 67 && e.ctrlKey) ||
          (e.keyCode === 86 && e.ctrlKey) ||
          (e.keyCode === 88 && e.ctrlKey) ||
          // Allow: home, end, left, right
          (e.keyCode >= 35 && e.keyCode <= 39)) {
        return
      }
      
      // Ensure that it is a number and stop the keypress
      if ((e.shiftKey || (e.keyCode < 48 || e.keyCode > 57)) && (e.keyCode < 96 || e.keyCode > 105)) {
        e.preventDefault()
      }

      // Allow minus sign only if negative values are allowed and it's the first character
      if (e.keyCode === 189 && allowNegative && e.currentTarget.selectionStart === 0) {
        return
      }
    }

    const getPlaceholderText = () => {
      if (placeholder) return placeholder
      const exampleValue = 15000000 // 15 million as example
      return formatCurrencyPlaceholder(exampleValue)
    }

    return (
      <div className="relative">
        {prefix && !isFocused && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm pointer-events-none">
            {prefix}
          </span>
        )}
        <Input
          {...props}
          ref={ref}
          type="text"
          inputMode="numeric"
          value={displayValue}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          placeholder={getPlaceholderText()}
          className={cn(
            prefix && !isFocused && "pl-12",
            "text-right font-mono",
            className
          )}
        />
        {/* Helper text for currency format */}
        {value > 0 && !isFocused && (
          <div className="absolute -bottom-5 right-0 text-xs text-muted-foreground">
            {formatCurrencyPlaceholder(value)}
          </div>
        )}
      </div>
    )
  }
)

CurrencyInput.displayName = 'CurrencyInput'

// Percentage input variant for rates
interface PercentageInputProps extends Omit<CurrencyInputProps, 'prefix'> {
  suffix?: string
}

export const PercentageInput = forwardRef<HTMLInputElement, PercentageInputProps>(
  ({ value, onChange, suffix = '%', ...props }, ref) => {
    const [displayValue, setDisplayValue] = useState('')
    const [isFocused, setIsFocused] = useState(false)

    useEffect(() => {
      if (!isFocused) {
        setDisplayValue(value > 0 ? (value * 100).toFixed(2) : '')
      }
    }, [value, isFocused])

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(true)
      setDisplayValue(value > 0 ? (value * 100).toString() : '')
      props.onFocus?.(e)
    }

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false)
      const percentValue = parseFloat(e.target.value) || 0
      const decimalValue = percentValue / 100
      
      if (decimalValue !== value) {
        onChange(decimalValue)
      }
      
      setDisplayValue(percentValue > 0 ? percentValue.toFixed(2) : '')
      props.onBlur?.(e)
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value
      const percentValue = parseFloat(inputValue.replace(/[^\d.-]/g, '')) || 0
      const decimalValue = percentValue / 100
      
      setDisplayValue(inputValue)
      onChange(decimalValue)
    }

    return (
      <div className="relative">
        <Input
          {...props}
          ref={ref}
          type="text"
          inputMode="decimal"
          value={displayValue}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          className={cn(
            "text-right font-mono pr-8",
            props.className
          )}
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm pointer-events-none">
          {suffix}
        </span>
      </div>
    )
  }
)

PercentageInput.displayName = 'PercentageInput'