"use client"

import { useState, useEffect, useRef } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { 
  ProfessionalCard,
  ActionButton 
} from "@/components/ui/professional"
import {
  Search,
  Filter,
  X,
  Calendar,
  DollarSign,
  Users,
  Building2,
  ChevronDown,
  ChevronUp
} from "lucide-react"
import { cn } from "@/lib/utils"

export interface SearchFilter {
  id: string
  label: string
  type: 'text' | 'select' | 'date' | 'number' | 'range'
  options?: { value: string; label: string }[]
  placeholder?: string
  value?: any
}

export interface AdvancedSearchProps {
  onSearch: (query: string, filters: Record<string, any>) => void
  onClear: () => void
  placeholder?: string
  filters?: SearchFilter[]
  className?: string
  showFilters?: boolean
}

interface ActiveFilter {
  id: string
  label: string
  value: any
  displayValue: string
}

export function AdvancedSearch({ 
  onSearch, 
  onClear,
  placeholder = "Search employees, salary components, or reports...",
  filters = [],
  className,
  showFilters = true
}: AdvancedSearchProps) {
  const [query, setQuery] = useState("")
  const [isFiltersOpen, setIsFiltersOpen] = useState(false)
  const [filterValues, setFilterValues] = useState<Record<string, any>>({})
  const [activeFilters, setActiveFilters] = useState<ActiveFilter[]>([])
  const searchRef = useRef<HTMLInputElement>(null)

  // Initialize filter values
  useEffect(() => {
    const initialValues: Record<string, any> = {}
    filters.forEach(filter => {
      if (filter.value !== undefined) {
        initialValues[filter.id] = filter.value
      }
    })
    setFilterValues(initialValues)
  }, [filters])

  // Update active filters when filter values change
  useEffect(() => {
    const active: ActiveFilter[] = []
    
    filters.forEach(filter => {
      const value = filterValues[filter.id]
      if (value !== undefined && value !== '' && value !== null) {
        let displayValue = String(value)
        
        // For select filters, show the label instead of value
        if (filter.type === 'select' && filter.options) {
          const option = filter.options.find(opt => opt.value === value)
          displayValue = option?.label || displayValue
        }
        
        active.push({
          id: filter.id,
          label: filter.label,
          value,
          displayValue
        })
      }
    })
    
    setActiveFilters(active)
  }, [filterValues, filters])

  const handleSearch = () => {
    onSearch(query, filterValues)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSearch()
    }
    if (e.key === 'Escape') {
      handleClear()
    }
  }

  const handleClear = () => {
    setQuery("")
    setFilterValues({})
    setActiveFilters([])
    onClear()
    searchRef.current?.focus()
  }

  const removeFilter = (filterId: string) => {
    const newFilterValues = { ...filterValues }
    delete newFilterValues[filterId]
    setFilterValues(newFilterValues)
    handleSearch()
  }

  const setFilterValue = (filterId: string, value: any) => {
    setFilterValues(prev => ({
      ...prev,
      [filterId]: value
    }))
  }

  const renderFilter = (filter: SearchFilter) => {
    const value = filterValues[filter.id] || ''

    switch (filter.type) {
      case 'text':
        return (
          <Input
            key={filter.id}
            placeholder={filter.placeholder || filter.label}
            value={value}
            onChange={(e) => setFilterValue(filter.id, e.target.value)}
            className="w-full"
          />
        )

      case 'select':
        return (
          <Select
            key={filter.id}
            value={value}
            onValueChange={(val) => setFilterValue(filter.id, val)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder={filter.placeholder || `Select ${filter.label}`} />
            </SelectTrigger>
            <SelectContent>
              {filter.options?.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )

      case 'date':
        return (
          <Input
            key={filter.id}
            type="date"
            value={value}
            onChange={(e) => setFilterValue(filter.id, e.target.value)}
            className="w-full"
          />
        )

      case 'number':
        return (
          <Input
            key={filter.id}
            type="number"
            placeholder={filter.placeholder || filter.label}
            value={value}
            onChange={(e) => setFilterValue(filter.id, e.target.value ? Number(e.target.value) : '')}
            className="w-full"
          />
        )

      case 'range':
        return (
          <div key={filter.id} className="flex space-x-2">
            <Input
              type="number"
              placeholder="Min"
              value={value?.min || ''}
              onChange={(e) => setFilterValue(filter.id, { 
                ...value, 
                min: e.target.value ? Number(e.target.value) : undefined 
              })}
            />
            <Input
              type="number"
              placeholder="Max"
              value={value?.max || ''}
              onChange={(e) => setFilterValue(filter.id, { 
                ...value, 
                max: e.target.value ? Number(e.target.value) : undefined 
              })}
            />
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Search Bar */}
      <div className="flex space-x-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            ref={searchRef}
            type="search"
            placeholder={placeholder}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="pl-10"
          />
        </div>
        
        <ActionButton
          variant="primary"
          onClick={handleSearch}
          disabled={!query && activeFilters.length === 0}
        >
          <Search className="mr-2 h-4 w-4" />
          Search
        </ActionButton>

        {showFilters && filters.length > 0 && (
          <Button
            variant="outline"
            onClick={() => setIsFiltersOpen(!isFiltersOpen)}
            className="flex items-center space-x-2"
          >
            <Filter className="h-4 w-4" />
            <span>Filters</span>
            {activeFilters.length > 0 && (
              <Badge variant="secondary" className="ml-1">
                {activeFilters.length}
              </Badge>
            )}
            {isFiltersOpen ? (
              <ChevronUp className="h-4 w-4 ml-1" />
            ) : (
              <ChevronDown className="h-4 w-4 ml-1" />
            )}
          </Button>
        )}

        {(query || activeFilters.length > 0) && (
          <Button
            variant="outline"
            onClick={handleClear}
            className="px-3"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Active Filters */}
      {activeFilters.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {activeFilters.map(filter => (
            <Badge
              key={filter.id}
              variant="secondary"
              className="flex items-center space-x-1 pr-1"
            >
              <span className="text-xs">
                {filter.label}: {filter.displayValue}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeFilter(filter.id)}
                className="h-4 w-4 p-0 hover:bg-transparent"
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}
        </div>
      )}

      {/* Advanced Filters Panel */}
      {showFilters && isFiltersOpen && filters.length > 0 && (
        <ProfessionalCard>
          <div className="p-4">
            <h4 className="text-sm font-medium text-gray-700 mb-4">Advanced Filters</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filters.map(filter => (
                <div key={filter.id}>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    {filter.label}
                  </label>
                  {renderFilter(filter)}
                </div>
              ))}
            </div>
            
            <div className="flex justify-end space-x-2 mt-4 pt-4 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setFilterValues({})}
              >
                Clear Filters
              </Button>
              <ActionButton
                variant="primary"
                size="sm"
                onClick={handleSearch}
              >
                Apply Filters
              </ActionButton>
            </div>
          </div>
        </ProfessionalCard>
      )}
    </div>
  )
}

// Predefined filter configurations for common use cases
export const employeeSearchFilters: SearchFilter[] = [
  {
    id: 'department',
    label: 'Department',
    type: 'select',
    options: [
      { value: 'hr', label: 'Human Resources' },
      { value: 'engineering', label: 'Engineering' },
      { value: 'sales', label: 'Sales' },
      { value: 'marketing', label: 'Marketing' },
      { value: 'finance', label: 'Finance' }
    ]
  },
  {
    id: 'position',
    label: 'Position',
    type: 'text',
    placeholder: 'Enter position title'
  },
  {
    id: 'status',
    label: 'Status',
    type: 'select',
    options: [
      { value: 'active', label: 'Active' },
      { value: 'resigned', label: 'Resigned' },
      { value: 'terminated', label: 'Terminated' }
    ]
  },
  {
    id: 'employment_type',
    label: 'Employment Type',
    type: 'select',
    options: [
      { value: 'permanent', label: 'Permanent' },
      { value: 'contract', label: 'Contract' }
    ]
  },
  {
    id: 'join_date',
    label: 'Join Date From',
    type: 'date'
  },
  {
    id: 'salary_range',
    label: 'Salary Range (IDR)',
    type: 'range'
  }
]

export const salaryHistoryFilters: SearchFilter[] = [
  {
    id: 'action_type',
    label: 'Action Type',
    type: 'select',
    options: [
      { value: 'CREATE', label: 'Created' },
      { value: 'UPDATE', label: 'Updated' },
      { value: 'DELETE', label: 'Deleted' },
      { value: 'ACTIVATE', label: 'Activated' },
      { value: 'DEACTIVATE', label: 'Deactivated' }
    ]
  },
  {
    id: 'component_type',
    label: 'Component Type',
    type: 'select',
    options: [
      { value: 'basic_salary', label: 'Basic Salary' },
      { value: 'fixed_allowance', label: 'Fixed Allowance' }
    ]
  },
  {
    id: 'approval_status',
    label: 'Approval Status',
    type: 'select',
    options: [
      { value: 'pending', label: 'Pending' },
      { value: 'approved', label: 'Approved' },
      { value: 'rejected', label: 'Rejected' },
      { value: 'auto_approved', label: 'Auto Approved' }
    ]
  },
  {
    id: 'start_date',
    label: 'Start Date',
    type: 'date'
  },
  {
    id: 'end_date',
    label: 'End Date',
    type: 'date'
  },
  {
    id: 'amount_range',
    label: 'Amount Range (IDR)',
    type: 'range'
  }
]