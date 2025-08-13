"use client"

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  Building, 
  Eye, 
  Edit, 
  MoreHorizontal,
  MapPin,
  Briefcase,
  Clock
} from 'lucide-react'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu'
import type { Employee } from '@/lib/types/database'
import { cn } from '@/lib/utils'

interface EmployeeProfileCardProps {
  employee: Employee
  onViewDetails: (employeeId: string) => void
  onEdit: (employeeId: string) => void
  className?: string
}

export function EmployeeProfileCard({ 
  employee, 
  onViewDetails, 
  onEdit, 
  className 
}: EmployeeProfileCardProps) {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Active</Badge>
      case 'resigned':
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Resigned</Badge>
      case 'terminated':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Terminated</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getEmploymentTypeBadge = (type: string) => {
    return type === 'permanent' 
      ? <Badge variant="outline" className="text-blue-700 border-blue-300">Permanent</Badge>
      : <Badge variant="outline" className="text-purple-700 border-purple-300">Contract</Badge>
  }

  const calculateTenure = () => {
    const months = Math.floor((new Date().getTime() - new Date(employee.join_date).getTime()) / (1000 * 60 * 60 * 24 * 30))
    if (months < 12) {
      return `${months} month${months !== 1 ? 's' : ''}`
    }
    const years = Math.floor(months / 12)
    const remainingMonths = months % 12
    return `${years}y${remainingMonths > 0 ? ` ${remainingMonths}m` : ''}`
  }

  return (
    <Card className={cn(
      "group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-white to-gray-50 border-gray-200",
      className
    )}>
      <CardContent className="p-6">
        {/* Header with avatar and basic info */}
        <div className="flex items-start gap-4 mb-4">
          {/* Avatar */}
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-md flex-shrink-0">
            <span className="text-xl font-bold text-white">
              {employee.full_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
            </span>
          </div>
          
          {/* Basic Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-bold text-lg text-gray-900 truncate">
                  {employee.full_name}
                </h3>
                <p className="text-sm font-medium text-gray-600 truncate">
                  {employee.position?.position_title || 'N/A'}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {employee.department?.department_name || 'N/A'}
                </p>
              </div>
              
              {/* Actions dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onViewDetails(employee.id)}>
                    <Eye className="mr-2 h-4 w-4" />
                    View Details
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onEdit(employee.id)}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit Employee
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        {/* Status and Type */}
        <div className="flex items-center gap-2 mb-4">
          {getStatusBadge(employee.employee_status)}
          {getEmploymentTypeBadge(employee.employment_status)}
        </div>

        {/* Key metrics */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-white p-3 rounded-lg border border-gray-100">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-blue-500" />
              <div>
                <p className="text-xs text-gray-500">Tenure</p>
                <p className="text-sm font-semibold text-gray-900">
                  {calculateTenure()}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-3 rounded-lg border border-gray-100">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-green-500" />
              <div>
                <p className="text-xs text-gray-500">Employee ID</p>
                <p className="text-sm font-semibold text-gray-900 font-mono">
                  {employee.employee_id}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Contact info */}
        <div className="space-y-2 mb-4">
          {employee.email && (
            <div className="flex items-center gap-2 text-sm">
              <Mail className="h-4 w-4 text-gray-400" />
              <span className="text-gray-600 truncate">{employee.email}</span>
            </div>
          )}
          {employee.phone && (
            <div className="flex items-center gap-2 text-sm">
              <Phone className="h-4 w-4 text-gray-400" />
              <span className="text-gray-600">{employee.phone}</span>
            </div>
          )}
        </div>

        {/* Join date */}
        <div className="flex items-center gap-2 text-xs text-gray-500 mb-4">
          <Clock className="h-3 w-3" />
          <span>
            Joined {new Date(employee.join_date).toLocaleDateString('id-ID', {
              year: 'numeric',
              month: 'short',
              day: 'numeric'
            })}
          </span>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => onViewDetails(employee.id)}
            className="flex-1 text-xs"
          >
            <Eye className="h-3 w-3 mr-1" />
            View
          </Button>
          <Button 
            size="sm" 
            onClick={() => onEdit(employee.id)}
            className="flex-1 text-xs"
          >
            <Edit className="h-3 w-3 mr-1" />
            Edit
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}