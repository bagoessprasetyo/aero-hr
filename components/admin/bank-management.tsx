"use client"

import { useState, useEffect, useMemo } from 'react'
import { MasterDataService } from '@/lib/services/master-data'
import type { Bank, BankBranch, CreateBankRequest, UpdateBankRequest } from '@/lib/types/master-data'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { useToast } from '@/components/ui/toast'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  ProfessionalCard,
  ActionButton,
  EmptyState,
  StatusBadge
} from '@/components/ui/professional'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu'
import {
  Landmark,
  Plus,
  Search,
  Edit,
  Trash2,
  MoreHorizontal,
  Eye,
  Building,
  MapPin,
  Globe,
  Phone,
  Filter,
  Download,
  RefreshCw,
  CheckSquare,
  X,
  ArrowUpDown,
  CreditCard,
  ExternalLink,
  Mail,
  Copy,
  Check,
  Shield,
  TrendingUp,
  BarChart3,
  Star
} from 'lucide-react'

const masterDataService = new MasterDataService()

interface BankWithRelations extends Bank {
  branches?: BankBranch[]
  branchCount?: number
}

interface BankStats {
  total: number
  active: number
  withSwift: number
  totalBranches: number
  avgBranchesPerBank: number
}

export function BankManagement() {
  const { toast } = useToast()
  const [banks, setBanks] = useState<BankWithRelations[]>([])
  const [branches, setBranches] = useState<BankBranch[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  
  // Enhanced filtering states
  const [searchTerm, setSearchTerm] = useState('')
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [swiftFilter, setSwiftFilter] = useState<'all' | 'with_swift' | 'without_swift'>('all')
  const [selectedBanks, setSelectedBanks] = useState<string[]>([])
  const [showBulkActions, setShowBulkActions] = useState(false)
  
  // Sort state
  const [sortBy, setSortBy] = useState<'name' | 'code' | 'branches'>('name')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  
  // Modal states
  const [selectedBank, setSelectedBank] = useState<BankWithRelations | null>(null)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [copiedField, setCopiedField] = useState<string | null>(null)

  // Form states
  const [formData, setFormData] = useState<CreateBankRequest>({
    bank_code: '',
    bank_name: '',
    bank_short_name: '',
    swift_code: '',
    bank_address: '',
    phone: '',
    website: '',
    is_active: true,
    display_order: 0
  })

  // Load banks
  const loadBanks = async () => {
    try {
      setLoading(true)
      const [banksResponse, branchesResponse] = await Promise.all([
        masterDataService.getBanks(),
        masterDataService.getBankBranches()
      ])
      
      // Add branch count to banks
      const banksWithBranchCount = banksResponse.data.map((bank: Bank) => {
        const branchCount = branchesResponse.data.filter((branch: BankBranch) => branch.bank_id === bank.id).length
        return { ...bank, branchCount }
      }) as BankWithRelations[]
      
      setBanks(banksWithBranchCount)
      setBranches(branchesResponse.data)
    } catch (error) {
      console.error('Error loading banks:', error)
      toast({ type: 'error', title: 'Failed to load banks' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadBanks()
  }, [])

  // Enhanced filtering and sorting with useMemo for performance
  const filteredAndSortedBanks = useMemo(() => {
    let filtered = [...banks]

    // Apply filters
    if (searchTerm) {
      filtered = filtered.filter(bank =>
        bank.bank_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bank.bank_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (bank.bank_short_name && bank.bank_short_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (bank.swift_code && bank.swift_code.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    }

    if (activeFilter !== 'all') {
      filtered = filtered.filter(bank => bank.is_active === (activeFilter === 'active'))
    }

    if (swiftFilter !== 'all') {
      filtered = filtered.filter(bank => 
        swiftFilter === 'with_swift' ? !!bank.swift_code : !bank.swift_code
      )
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any
      let bValue: any
      
      switch (sortBy) {
        case 'name':
          aValue = a.bank_name.toLowerCase()
          bValue = b.bank_name.toLowerCase()
          break
        case 'code':
          aValue = a.bank_code.toLowerCase()
          bValue = b.bank_code.toLowerCase()
          break
        case 'branches':
          aValue = a.branchCount || 0
          bValue = b.branchCount || 0
          break
        default:
          return 0
      }
      
      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0
      }
    })

    return filtered
  }, [banks, searchTerm, activeFilter, swiftFilter, sortBy, sortOrder])

  // Stats calculations
  const stats = useMemo((): BankStats => {
    return {
      total: banks.length,
      active: banks.filter(b => b.is_active).length,
      withSwift: banks.filter(b => b.swift_code).length,
      totalBranches: branches.length,
      avgBranchesPerBank: banks.length > 0 ? Number((branches.length / banks.length).toFixed(1)) : 0
    }
  }, [banks, branches])

  // Handle create bank
  const handleCreateBank = async () => {
    try {
      await masterDataService.createBank(formData)
      toast({ type: 'success', title: 'Bank created successfully' })
      setIsCreateModalOpen(false)
      resetForm()
      loadBanks()
    } catch (error) {
      console.error('Error creating bank:', error)
      toast({ type: 'error', title: 'Failed to create bank' })
    }
  }

  // Handle update bank
  const handleUpdateBank = async () => {
    if (!selectedBank) return

    try {
      const updateData: UpdateBankRequest = {
        id: selectedBank.id,
        ...formData
      }
      await masterDataService.updateBank(updateData)
      toast({ type: 'success', title: 'Bank updated successfully' })
      setIsEditModalOpen(false)
      resetForm()
      setSelectedBank(null)
      loadBanks()
    } catch (error) {
      console.error('Error updating bank:', error)
      toast({ type: 'error', title: 'Failed to update bank' })
    }
  }

  // Handle delete bank
  const handleDeleteBank = async (id: string) => {
    if (!confirm('Are you sure you want to delete this bank?')) return

    try {
      await masterDataService.deleteBank(id)
      toast({ type: 'success', title: 'Bank deleted successfully' })
      loadBanks()
    } catch (error) {
      console.error('Error deleting bank:', error)
      toast({ type: 'error', title: 'Failed to delete bank' })
    }
  }

  // Bulk operations
  const handleBulkAction = async (action: 'activate' | 'deactivate' | 'delete') => {
    if (selectedBanks.length === 0) return
    
    const actionText = {
      activate: 'activate',
      deactivate: 'deactivate', 
      delete: 'delete'
    }[action]
    
    if (!confirm(`Are you sure you want to ${actionText} ${selectedBanks.length} banks?`)) return

    try {
      setActionLoading('bulk')
      
      for (const bankId of selectedBanks) {
        if (action === 'delete') {
          await masterDataService.deleteBank(bankId)
        } else {
          const bank = banks.find(b => b.id === bankId)
          if (bank) {
            const updateData: UpdateBankRequest = {
              id: bankId,
              bank_code: bank.bank_code,
              bank_name: bank.bank_name,
              bank_short_name: bank.bank_short_name || '',
              swift_code: bank.swift_code || '',
              bank_address: bank.bank_address || '',
              phone: bank.phone || '',
              website: bank.website || '',
              is_active: action === 'activate',
              display_order: bank.display_order
            }
            await masterDataService.updateBank(updateData)
          }
        }
      }
      
      toast({ 
        type: 'success', 
        title: `Successfully ${actionText}d ${selectedBanks.length} banks` 
      })
      
      setSelectedBanks([])
      setShowBulkActions(false)
      loadBanks()
    } catch (error) {
      console.error(`Error ${action} banks:`, error)
      toast({ type: 'error', title: `Failed to ${action} banks` })
    } finally {
      setActionLoading(null)
    }
  }

  const toggleBankSelection = (bankId: string) => {
    setSelectedBanks(prev => {
      const newSelection = prev.includes(bankId)
        ? prev.filter(id => id !== bankId)
        : [...prev, bankId]
      
      setShowBulkActions(newSelection.length > 0)
      return newSelection
    })
  }

  const toggleAllBanks = () => {
    const allSelected = selectedBanks.length === filteredAndSortedBanks.length
    const newSelection = allSelected ? [] : filteredAndSortedBanks.map(b => b.id)
    setSelectedBanks(newSelection)
    setShowBulkActions(newSelection.length > 0)
  }

  const handleSort = (field: typeof sortBy) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortOrder('asc')
    }
  }

  const clearFilters = () => {
    setSearchTerm('')
    setActiveFilter('all')
    setSwiftFilter('all')
  }

  // Reset form
  const resetForm = () => {
    setFormData({
      bank_code: '',
      bank_name: '',
      bank_short_name: '',
      swift_code: '',
      bank_address: '',
      phone: '',
      website: '',
      is_active: true,
      display_order: 0
    })
  }

  // Open edit modal
  const openEditModal = (bank: BankWithRelations) => {
    setSelectedBank(bank)
    setFormData({
      bank_code: bank.bank_code,
      bank_name: bank.bank_name,
      bank_short_name: bank.bank_short_name || '',
      swift_code: bank.swift_code || '',
      bank_address: bank.bank_address || '',
      phone: bank.phone || '',
      website: bank.website || '',
      is_active: bank.is_active,
      display_order: bank.display_order
    })
    setIsEditModalOpen(true)
  }

  // Open view modal
  const openViewModal = (bank: BankWithRelations) => {
    setSelectedBank(bank)
    setIsViewModalOpen(true)
  }

  // Copy to clipboard
  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedField(field)
      setTimeout(() => setCopiedField(null), 2000)
      toast({ type: 'success', title: 'Copied to clipboard' })
    } catch (err) {
      toast({ type: 'error', title: 'Failed to copy' })
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid gap-4 md:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Enhanced Header */}
      <ProfessionalCard variant="elevated" className="bg-gradient-to-r from-emerald-50 to-blue-50">
        <CardHeader className="pb-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Landmark className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                    Bank Management
                  </h1>
                  <p className="text-muted-foreground text-lg">
                    Manage banking institutions and financial partners
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-4 mt-4">
                <StatusBadge status="success">
                  <Landmark className="h-3 w-3 mr-1" />
                  {stats.total} Total Banks
                </StatusBadge>
                <Badge variant="outline" className="text-xs">
                  <Globe className="h-3 w-3 mr-1" />
                  {stats.withSwift} with SWIFT
                </Badge>
                <Badge variant="outline" className="text-xs">
                  <Building className="h-3 w-3 mr-1" />
                  {stats.totalBranches} Branches
                </Badge>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <ActionButton variant="secondary" size="sm" onClick={() => loadBanks()}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </ActionButton>
              <ActionButton variant="secondary" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </ActionButton>
              <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                <DialogTrigger asChild>
                  <ActionButton variant="primary" size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Bank
                  </ActionButton>
                </DialogTrigger>
                <DialogContent className="sm:max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Create New Bank</DialogTitle>
                    <DialogDescription>
                      Add a new banking institution to the system.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="grid gap-2">
                      <Label htmlFor="code">Bank Code *</Label>
                      <Input
                        id="code"
                        value={formData.bank_code}
                        onChange={(e) => setFormData({ ...formData, bank_code: e.target.value })}
                        placeholder="e.g., BCA, BRI, BNI"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="name">Bank Name *</Label>
                      <Input
                        id="name"
                        value={formData.bank_name}
                        onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                        placeholder="e.g., Bank Central Asia"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="short-name">Short Name</Label>
                      <Input
                        id="short-name"
                        value={formData.bank_short_name}
                        onChange={(e) => setFormData({ ...formData, bank_short_name: e.target.value })}
                        placeholder="e.g., BCA"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="swift">SWIFT Code</Label>
                      <Input
                        id="swift"
                        value={formData.swift_code}
                        onChange={(e) => setFormData({ ...formData, swift_code: e.target.value })}
                        placeholder="e.g., CENAIDJA"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="address">Address</Label>
                      <Textarea
                        id="address"
                        value={formData.bank_address}
                        onChange={(e) => setFormData({ ...formData, bank_address: e.target.value })}
                        placeholder="Bank headquarters address..."
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label htmlFor="phone">Phone</Label>
                        <Input
                          id="phone"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          placeholder="e.g., +62-21-2358-8000"
                        />
                      </div>
                      <div>
                        <Label htmlFor="website">Website</Label>
                        <Input
                          id="website"
                          value={formData.website}
                          onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                          placeholder="e.g., https://www.bca.co.id"
                        />
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="active"
                        checked={formData.is_active}
                        onCheckedChange={(checked) => setFormData({ ...formData, is_active: !!checked })}
                      />
                      <Label htmlFor="active">Active</Label>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreateBank}>
                      Create Bank
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
      </ProfessionalCard>

      {/* Enhanced Statistics Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <ProfessionalCard variant="interactive" className="group">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <div className="space-y-1">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Banks</CardTitle>
              <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
            </div>
            <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
              <Landmark className="h-5 w-5 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex items-center justify-between text-xs">
              <span className="text-green-600 font-medium">{stats.active} Active</span>
              <span className="text-red-500">{stats.total - stats.active} Inactive</span>
            </div>
            <Progress value={(stats.active / stats.total) * 100} className="h-1 mt-2" />
          </CardContent>
        </ProfessionalCard>

        <ProfessionalCard variant="interactive" className="group">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <div className="space-y-1">
              <CardTitle className="text-sm font-medium text-muted-foreground">With SWIFT</CardTitle>
              <div className="text-2xl font-bold text-gray-900">{stats.withSwift}</div>
            </div>
            <div className="p-2 bg-emerald-100 rounded-lg group-hover:bg-emerald-200 transition-colors">
              <Globe className="h-5 w-5 text-emerald-600" />
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex items-center text-xs text-muted-foreground">
              <Shield className="h-3 w-3 mr-1" />
              International transfers
            </div>
            <Progress value={(stats.withSwift / stats.total) * 100} className="h-1 mt-1" />
          </CardContent>
        </ProfessionalCard>

        <ProfessionalCard variant="interactive" className="group">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <div className="space-y-1">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Branches</CardTitle>
              <div className="text-2xl font-bold text-gray-900">{stats.totalBranches}</div>
            </div>
            <div className="p-2 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition-colors">
              <Building className="h-5 w-5 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex items-center text-xs text-muted-foreground">
              <MapPin className="h-3 w-3 mr-1" />
              Nationwide coverage
            </div>
          </CardContent>
        </ProfessionalCard>

        <ProfessionalCard variant="interactive" className="group">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <div className="space-y-1">
              <CardTitle className="text-sm font-medium text-muted-foreground">Avg Branches</CardTitle>
              <div className="text-2xl font-bold text-gray-900">{stats.avgBranchesPerBank}</div>
            </div>
            <div className="p-2 bg-orange-100 rounded-lg group-hover:bg-orange-200 transition-colors">
              <BarChart3 className="h-5 w-5 text-orange-600" />
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 mr-1" />
              Per bank average
            </div>
          </CardContent>
        </ProfessionalCard>
      </div>

      {/* Enhanced Filters */}
      <ProfessionalCard>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Filter className="h-5 w-5 text-muted-foreground" />
              <CardTitle>Search & Filters</CardTitle>
            </div>
            {(searchTerm || activeFilter !== 'all' || swiftFilter !== 'all') && (
              <ActionButton variant="ghost" size="sm" onClick={clearFilters}>
                <X className="h-4 w-4 mr-2" />
                Clear Filters
              </ActionButton>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search banks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={activeFilter} onValueChange={(value: any) => setActiveFilter(value)}>
              <SelectTrigger>
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active Only</SelectItem>
                <SelectItem value="inactive">Inactive Only</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={swiftFilter} onValueChange={(value: any) => setSwiftFilter(value)}>
              <SelectTrigger>
                <SelectValue placeholder="SWIFT Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Banks</SelectItem>
                <SelectItem value="with_swift">With SWIFT</SelectItem>
                <SelectItem value="without_swift">Without SWIFT</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </ProfessionalCard>

      {/* Bulk Actions Bar */}
      {showBulkActions && (
        <ProfessionalCard className="bg-blue-50 border-blue-200">
          <CardContent className="py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Badge variant="secondary">
                  {selectedBanks.length} banks selected
                </Badge>
                <div className="flex items-center space-x-2">
                  <ActionButton 
                    variant="secondary" 
                    size="sm"
                    onClick={() => handleBulkAction('activate')}
                    disabled={actionLoading === 'bulk'}
                  >
                    Activate Selected
                  </ActionButton>
                  <ActionButton 
                    variant="secondary" 
                    size="sm"
                    onClick={() => handleBulkAction('deactivate')}
                    disabled={actionLoading === 'bulk'}
                  >
                    Deactivate Selected
                  </ActionButton>
                  <ActionButton 
                    variant="error" 
                    size="sm"
                    onClick={() => handleBulkAction('delete')}
                    disabled={actionLoading === 'bulk'}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Selected
                  </ActionButton>
                </div>
              </div>
              <ActionButton 
                variant="ghost" 
                size="sm"
                onClick={() => {
                  setSelectedBanks([])
                  setShowBulkActions(false)
                }}
              >
                <X className="h-4 w-4" />
              </ActionButton>
            </div>
          </CardContent>
        </ProfessionalCard>
      )}

      <Tabs defaultValue="banks" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="banks" className="flex items-center gap-2">
            <Landmark className="h-4 w-4" />
            Banks
          </TabsTrigger>
          <TabsTrigger value="branches" className="flex items-center gap-2">
            <Building className="h-4 w-4" />
            Branches
          </TabsTrigger>
        </TabsList>

        <TabsContent value="banks" className="space-y-6">
          {/* Enhanced Bank Table */}
          <ProfessionalCard variant="elevated">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center space-x-2">
                    <Landmark className="h-5 w-5" />
                    <span>Banks</span>
                  </CardTitle>
                  <CardDescription>
                    {filteredAndSortedBanks.length} banks found
                    {filteredAndSortedBanks.length !== banks.length && (
                      <span> (filtered from {banks.length} total)</span>
                    )}
                  </CardDescription>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="outline">
                    Showing {filteredAndSortedBanks.length} of {banks.length}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {filteredAndSortedBanks.length === 0 ? (
                <EmptyState
                  icon={Landmark}
                  title="No banks found"
                  description={searchTerm || activeFilter !== 'all' || swiftFilter !== 'all'
                    ? "No banks match your current filters. Try adjusting your search criteria."
                    : "Start by adding your first bank to manage financial institutions."
                  }
                  action={
                    searchTerm || activeFilter !== 'all' || swiftFilter !== 'all' ? {
                      label: "Clear Filters",
                      onClick: clearFilters
                    } : {
                      label: "Add Bank", 
                      onClick: () => setIsCreateModalOpen(true)
                    }
                  }
                />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox
                          checked={selectedBanks.length === filteredAndSortedBanks.length && filteredAndSortedBanks.length > 0}
                          onCheckedChange={toggleAllBanks}
                        />
                      </TableHead>
                      <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort('code')}>
                        <div className="flex items-center space-x-1">
                          <span>Code</span>
                          <ArrowUpDown className="h-4 w-4" />
                        </div>
                      </TableHead>
                      <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort('name')}>
                        <div className="flex items-center space-x-1">
                          <span>Name</span>
                          <ArrowUpDown className="h-4 w-4" />
                        </div>
                      </TableHead>
                      <TableHead>SWIFT Code</TableHead>
                      <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort('branches')}>
                        <div className="flex items-center space-x-1">
                          <span>Branches</span>
                          <ArrowUpDown className="h-4 w-4" />
                        </div>
                      </TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAndSortedBanks.map((bank) => (
                      <TableRow key={bank.id} className={selectedBanks.includes(bank.id) ? "bg-muted/50" : ""}>
                        <TableCell>
                          <Checkbox
                            checked={selectedBanks.includes(bank.id)}
                            onCheckedChange={() => toggleBankSelection(bank.id)}
                          />
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-mono">
                            {bank.bank_code}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="font-medium">{bank.bank_name}</div>
                            {bank.bank_short_name && (
                              <div className="text-xs text-muted-foreground">
                                {bank.bank_short_name}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {bank.swift_code ? (
                            <div className="flex items-center space-x-2">
                              <Badge variant="outline" className="font-mono text-xs">
                                {bank.swift_code}
                              </Badge>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0"
                                onClick={() => copyToClipboard(bank.swift_code!, `swift-${bank.id}`)}
                              >
                                {copiedField === `swift-${bank.id}` ? (
                                  <Check className="h-3 w-3" />
                                ) : (
                                  <Copy className="h-3 w-3" />
                                )}
                              </Button>
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">N/A</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Building className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{bank.branchCount || 0}</span>
                            {(bank.branchCount || 0) > 10 && (
                              <Star className="h-3 w-3 text-yellow-500" />
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={bank.is_active ? "success" : "inactive"}>
                            {bank.is_active ? "Active" : "Inactive"}
                          </StatusBadge>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openViewModal(bank)}>
                                <Eye className="h-4 w-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => openEditModal(bank)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit Bank
                              </DropdownMenuItem>
                              {bank.website && (
                                <DropdownMenuItem 
                                  onClick={() => window.open(bank.website, '_blank')}
                                >
                                  <ExternalLink className="h-4 w-4 mr-2" />
                                  Visit Website
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                onClick={() => {
                                  const updateData: UpdateBankRequest = {
                                    id: bank.id,
                                    bank_code: bank.bank_code,
                                    bank_name: bank.bank_name,
                                    bank_short_name: bank.bank_short_name || '',
                                    swift_code: bank.swift_code || '',
                                    bank_address: bank.bank_address || '',
                                    phone: bank.phone || '',
                                    website: bank.website || '',
                                    is_active: !bank.is_active,
                                    display_order: bank.display_order
                                  }
                                  masterDataService.updateBank(updateData).then(() => {
                                    toast({ type: 'success', title: `Bank ${bank.is_active ? 'deactivated' : 'activated'}` })
                                    loadBanks()
                                  })
                                }}
                                className={bank.is_active ? "text-orange-600" : "text-green-600"}
                              >
                                {bank.is_active ? (
                                  <><X className="h-4 w-4 mr-2" />Deactivate</>
                                ) : (
                                  <><CheckSquare className="h-4 w-4 mr-2" />Activate</>
                                )}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                onClick={() => handleDeleteBank(bank.id)}
                                className="text-red-600"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </ProfessionalCard>
        </TabsContent>

        <TabsContent value="branches" className="space-y-6">
          <ProfessionalCard variant="elevated">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center space-x-2">
                    <Building className="h-5 w-5" />
                    <span>Bank Branches</span>
                  </CardTitle>
                  <CardDescription>
                    All bank branches in the system ({branches.length} total)
                  </CardDescription>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="outline">
                    {branches.length} branches
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {branches.length === 0 ? (
                <EmptyState
                  icon={Building}
                  title="No branches found"
                  description="Bank branches will appear here when they are added to the system."
                />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Bank</TableHead>
                      <TableHead>Branch Code</TableHead>
                      <TableHead>Branch Name</TableHead>
                      <TableHead>Address</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {branches.map((branch) => (
                      <TableRow key={branch.id}>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                              <Landmark className="h-4 w-4 text-primary" />
                            </div>
                            <div>
                              <div className="font-medium">
                                {branch.bank?.bank_short_name || branch.bank?.bank_name}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {branch.bank?.bank_code}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-mono">
                            {branch.branch_code}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{branch.branch_name}</div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {branch.branch_address ? (
                              <div className="flex items-start space-x-1">
                                <MapPin className="h-3 w-3 mt-0.5 text-muted-foreground" />
                                <span className="line-clamp-2">{branch.branch_address}</span>
                              </div>
                            ) : (
                              <span className="text-muted-foreground">Not provided</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {branch.phone ? (
                            <div className="flex items-center space-x-2">
                              <Phone className="h-3 w-3 text-muted-foreground" />
                              <span className="text-sm">{branch.phone}</span>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0"
                                onClick={() => copyToClipboard(branch.phone!, `phone-${branch.id}`)}
                              >
                                {copiedField === `phone-${branch.id}` ? (
                                  <Check className="h-3 w-3" />
                                ) : (
                                  <Copy className="h-3 w-3" />
                                )}
                              </Button>
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">N/A</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={branch.is_active ? "success" : "inactive"}>
                            {branch.is_active ? "Active" : "Inactive"}
                          </StatusBadge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </ProfessionalCard>
        </TabsContent>
      </Tabs>

      {/* Edit Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Bank</DialogTitle>
            <DialogDescription>
              Update bank information.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-code">Bank Code *</Label>
              <Input
                id="edit-code"
                value={formData.bank_code}
                onChange={(e) => setFormData({ ...formData, bank_code: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-name">Bank Name *</Label>
              <Input
                id="edit-name"
                value={formData.bank_name}
                onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-short-name">Short Name</Label>
              <Input
                id="edit-short-name"
                value={formData.bank_short_name}
                onChange={(e) => setFormData({ ...formData, bank_short_name: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-swift">SWIFT Code</Label>
              <Input
                id="edit-swift"
                value={formData.swift_code}
                onChange={(e) => setFormData({ ...formData, swift_code: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor="edit-phone">Phone</Label>
                <Input
                  id="edit-phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-website">Website</Label>
                <Input
                  id="edit-website"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="edit-active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: !!checked })}
              />
              <Label htmlFor="edit-active">Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateBank}>
              Update Bank
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Modal */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Bank Details</DialogTitle>
            <DialogDescription>
              Comprehensive information about {selectedBank?.bank_name}
            </DialogDescription>
          </DialogHeader>
          {selectedBank && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Code</Label>
                  <p className="text-sm text-muted-foreground font-mono">
                    {selectedBank.bank_code}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Status</Label>
                  <div className="mt-1">
                    <StatusBadge status={selectedBank.is_active ? "success" : "inactive"}>
                      {selectedBank.is_active ? "Active" : "Inactive"}
                    </StatusBadge>
                  </div>
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium">Full Name</Label>
                <p className="text-sm text-muted-foreground">
                  {selectedBank.bank_name}
                </p>
              </div>
              {selectedBank.bank_short_name && (
                <div>
                  <Label className="text-sm font-medium">Short Name</Label>
                  <p className="text-sm text-muted-foreground">
                    {selectedBank.bank_short_name}
                  </p>
                </div>
              )}
              {selectedBank.swift_code && (
                <div>
                  <Label className="text-sm font-medium">SWIFT Code</Label>
                  <div className="flex items-center space-x-2">
                    <p className="text-sm text-muted-foreground font-mono">
                      {selectedBank.swift_code}
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => copyToClipboard(selectedBank.swift_code!, 'modal-swift')}
                    >
                      {copiedField === 'modal-swift' ? (
                        <Check className="h-3 w-3" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </Button>
                  </div>
                </div>
              )}
              {selectedBank.bank_address && (
                <div>
                  <Label className="text-sm font-medium">Address</Label>
                  <p className="text-sm text-muted-foreground">
                    {selectedBank.bank_address}
                  </p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                {selectedBank.phone && (
                  <div>
                    <Label className="text-sm font-medium">Phone</Label>
                    <div className="flex items-center space-x-2">
                      <p className="text-sm text-muted-foreground">
                        {selectedBank.phone}
                      </p>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => copyToClipboard(selectedBank.phone!, 'modal-phone')}
                      >
                        {copiedField === 'modal-phone' ? (
                          <Check className="h-3 w-3" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </Button>
                    </div>
                  </div>
                )}
                {selectedBank.website && (
                  <div>
                    <Label className="text-sm font-medium">Website</Label>
                    <div className="flex items-center space-x-2">
                      <a 
                        href={selectedBank.website} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-sm text-blue-600 hover:underline"
                      >
                        {selectedBank.website}
                      </a>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => window.open(selectedBank.website, '_blank')}
                      >
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
              <div>
                <Label className="text-sm font-medium">Branches</Label>
                <p className="text-sm text-muted-foreground">
                  {selectedBank.branchCount || 0} branches registered
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewModalOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}