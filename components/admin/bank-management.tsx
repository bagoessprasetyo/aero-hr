"use client"

import { useState, useEffect } from 'react'
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
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
  Phone
} from 'lucide-react'

const masterDataService = new MasterDataService()

interface BankWithRelations extends Bank {
  branches?: BankBranch[]
}

export function BankManagement() {
  const { toast } = useToast()
  const [banks, setBanks] = useState<BankWithRelations[]>([])
  const [branches, setBranches] = useState<BankBranch[]>([])
  const [filteredBanks, setFilteredBanks] = useState<BankWithRelations[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedBank, setSelectedBank] = useState<BankWithRelations | null>(null)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)

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
      const response = await masterDataService.getBanks()
      setBanks(response.data as BankWithRelations[])
      setFilteredBanks(response.data as BankWithRelations[])
    } catch (error) {
      console.error('Error loading banks:', error)
      toast({ type: 'error', title: 'Failed to load banks' })
    } finally {
      setLoading(false)
    }
  }

  // Load branches for a specific bank
  const loadBranches = async (bankId?: string) => {
    try {
      const response = await masterDataService.getBankBranches(bankId)
      setBranches(response.data)
    } catch (error) {
      console.error('Error loading branches:', error)
    }
  }

  useEffect(() => {
    loadBanks()
    loadBranches()
  }, [])

  // Filter banks based on search
  useEffect(() => {
    let filtered = banks

    if (searchTerm) {
      filtered = filtered.filter(bank =>
        bank.bank_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bank.bank_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (bank.bank_short_name && bank.bank_short_name.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    }

    setFilteredBanks(filtered)
  }, [banks, searchTerm])

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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading banks...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Bank Management</h2>
          <p className="text-muted-foreground">
            Manage banks and financial institutions
          </p>
        </div>
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Bank
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Bank</DialogTitle>
              <DialogDescription>
                Add a new bank to the system.
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
              <div className="grid gap-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="e.g., +62-21-2358-8000"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  placeholder="e.g., https://www.bca.co.id"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="order">Display Order</Label>
                <Input
                  id="order"
                  type="number"
                  value={formData.display_order}
                  onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
                />
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

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Banks</CardTitle>
            <Landmark className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{banks.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Banks</CardTitle>
            <Building className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {banks.filter(b => b.is_active).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Branches</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{branches.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">With SWIFT</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {banks.filter(b => b.swift_code).length}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="banks" className="space-y-6">
        <TabsList>
          <TabsTrigger value="banks">Banks</TabsTrigger>
          <TabsTrigger value="branches">Branches</TabsTrigger>
        </TabsList>

        <TabsContent value="banks" className="space-y-6">
          {/* Search */}
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search banks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Bank Table */}
          <Card>
            <CardHeader>
              <CardTitle>Banks</CardTitle>
              <CardDescription>
                {filteredBanks.length} banks found
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Short Name</TableHead>
                    <TableHead>SWIFT Code</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBanks.map((bank) => (
                    <TableRow key={bank.id}>
                      <TableCell className="font-mono text-sm">
                        {bank.bank_code}
                      </TableCell>
                      <TableCell className="font-medium">
                        {bank.bank_name}
                      </TableCell>
                      <TableCell>
                        {bank.bank_short_name || '-'}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {bank.swift_code || '-'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={bank.is_active ? "default" : "secondary"}>
                          {bank.is_active ? "Active" : "Inactive"}
                        </Badge>
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
                              Edit
                            </DropdownMenuItem>
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
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="branches" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Bank Branches</CardTitle>
              <CardDescription>
                All bank branches in the system
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Bank</TableHead>
                    <TableHead>Branch Code</TableHead>
                    <TableHead>Branch Name</TableHead>
                    <TableHead>Address</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {branches.map((branch) => (
                    <TableRow key={branch.id}>
                      <TableCell>
                        {branch.bank?.bank_short_name || branch.bank?.bank_name}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {branch.branch_code}
                      </TableCell>
                      <TableCell className="font-medium">
                        {branch.branch_name}
                      </TableCell>
                      <TableCell>
                        {branch.branch_address || '-'}
                      </TableCell>
                      <TableCell>
                        {branch.phone || '-'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={branch.is_active ? "default" : "secondary"}>
                          {branch.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-md">
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
            <div className="grid gap-2">
              <Label htmlFor="edit-website">Website</Label>
              <Input
                id="edit-website"
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
              />
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
              Detailed information about {selectedBank?.bank_name}
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
                    <Badge variant={selectedBank.is_active ? "default" : "secondary"}>
                      {selectedBank.is_active ? "Active" : "Inactive"}
                    </Badge>
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
                  <p className="text-sm text-muted-foreground font-mono">
                    {selectedBank.swift_code}
                  </p>
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
                    <p className="text-sm text-muted-foreground">
                      {selectedBank.phone}
                    </p>
                  </div>
                )}
                {selectedBank.website && (
                  <div>
                    <Label className="text-sm font-medium">Website</Label>
                    <p className="text-sm text-muted-foreground">
                      <a href={selectedBank.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                        {selectedBank.website}
                      </a>
                    </p>
                  </div>
                )}
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