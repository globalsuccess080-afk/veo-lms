import React, { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Trash2, Eye, EyeOff } from 'lucide-react'
import { motion } from 'framer-motion'
import { ColumnDef } from '@tanstack/react-table'

import { getAdminCoupons, createCoupon, updateCouponStatus, deleteCoupon, Coupon } from '../../services/coupon.service'
import { getAdminCourses } from '../../services/course.service'
import { toast } from 'sonner'
import { AdminPage } from '../../components/admin/AdminPage'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { Input, Label } from '../../components/ui/Input'
import { AppDatePicker } from '../../components/ui/app-datepicker'
import { Button } from '../../components/ui/Button'
import { Dropdown } from '../../components/ui/Dropdown'
import { Modal } from '../../components/ui/Modal'

import { useTableState } from '../../components/admin/table/useTableState'
import { DataTable } from '../../components/admin/table/DataTable'
import { TableSearch } from '../../components/admin/table/TableSearch'
import { TablePagination } from '../../components/admin/table/TablePagination'
import { FilterChipList } from '../../components/admin/table/FilterChipList'
import { TableFilters } from '../../components/admin/table/TableFilters'
import { CouponsSkeleton } from '../../components/skeletons/admin/CouponsSkeleton'
import { useAlertStore } from '../../store/alertStore'

const containerVars = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } }
}

const itemVars = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
}

export function CouponsPage() {
  const queryClient = useQueryClient()
  const {
    pagination, setPagination,
    sorting, setSorting,
    search, setSearch,
    filters, setFilter, removeFilter, clearFilters,
    searchParams
  } = useTableState()

  const showAlert = useAlertStore(s => s.showAlert)

  const queryParams = Object.fromEntries(searchParams.entries())
  const { data, isLoading, isPlaceholderData } = useQuery({
    queryKey: ['admin-coupons', queryParams],
    queryFn: () => getAdminCoupons(queryParams),
    placeholderData: (prev) => prev
  })

  const coupons: Coupon[] = data?.coupons || []
  const meta = data?.meta || { total: 0, totalPages: 0 }

  const { data: courses } = useQuery({ queryKey: ['admin-courses'], queryFn: () => getAdminCourses() })

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [applyToAll, setApplyToAll] = useState(true)
  const [selectedCourses, setSelectedCourses] = useState<string[]>([])

  const [formData, setFormData] = useState<Partial<Coupon>>({
    code: '', description: '', type: 'percentage', value: 0, 
    usageLimit: null, maxDiscountAmount: null, 
    validFrom: new Date().toISOString().split('T')[0], 
    validUntil: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]
  })

  const handleCreateCoupon = () => {
    if (!formData.code) return toast.error('Coupon code is required')
    if (formData.value === undefined || formData.value <= 0) return toast.error('Value must be greater than 0')
    if (formData.type === 'percentage' && formData.value > 100) return toast.error('Percentage cannot exceed 100%')
    
    const finalData = {
      ...formData,
      applicableCourseIds: applyToAll ? null : selectedCourses
    }
    
    if (!applyToAll && selectedCourses.length === 0) {
      return toast.error('Please select at least one course or apply to all courses')
    }

    createMutation.mutate(finalData)
  }

  let valueError = ''
  if (formData.value === undefined || formData.value === null || formData.value <= 0) valueError = 'Value must be greater than 0'

  const createMutation = useMutation({
    mutationFn: createCoupon,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-coupons'] })
      toast.success('Coupon created')
      setIsModalOpen(false)
      // reset form
      setFormData({
        code: '', description: '', type: 'percentage', value: 0, 
        usageLimit: null, maxDiscountAmount: null, 
        validFrom: new Date().toISOString().split('T')[0], 
        validUntil: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]
      })
      setApplyToAll(true)
      setSelectedCourses([])
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed to create coupon')
  })

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string, isActive: boolean }) => updateCouponStatus(id, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-coupons'] })
      toast.success('Status updated')
    }
  })

  const deleteMutation = useMutation({
    mutationFn: deleteCoupon,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-coupons'] })
      toast.success('Coupon deleted')
    }
  })

  const columns = useMemo<ColumnDef<Coupon>[]>(() => [
    {
      accessorKey: 'code',
      header: 'Code',
      cell: ({ row }) => {
        const coupon = row.original
        return (
          <div className="flex flex-col">
            <span className="font-bold text-[14px] text-fg tracking-wide">{coupon.code}</span>
            <span className="text-[12px] text-muted truncate max-w-[200px]">{coupon.description}</span>
          </div>
        )
      }
    },
    {
      accessorKey: 'type',
      header: 'Type',
      cell: ({ row }) => <span className="text-[14px] font-medium text-muted capitalize">{row.getValue('type')}</span>,
    },
    {
      accessorKey: 'value',
      header: 'Value',
      cell: ({ row }) => {
        const type = row.getValue('type')
        const value = row.getValue('value')
        return <span className="text-[14px] font-medium text-muted">{type === 'percentage' ? `${value}%` : `₹${value}`}</span>
      }
    },
    {
      id: 'used',
      header: 'Used',
      cell: ({ row }) => {
        const c = row.original
        return <span className="text-[14px] font-medium text-muted">{c.usedCount} {c.usageLimit ? `/ ${c.usageLimit}` : ''}</span>
      },
      enableSorting: false
    },
    {
      accessorKey: 'isActive',
      header: 'Status',
      cell: ({ row }) => {
        const isActive = row.getValue('isActive')
        return (
          <Badge tone={isActive ? 'success' : 'warning'} className="font-bold px-2.5 py-1">
            {isActive ? 'Active' : 'Inactive'}
          </Badge>
        )
      }
    },
    {
      id: 'actions',
      header: 'Actions',
      enableSorting: false,
      cell: ({ row }) => {
        const coupon = row.original
        return (
          <div className="flex items-center gap-1.5">
            <button onClick={() => toggleMutation.mutate({ id: coupon.id || (coupon as any)._id, isActive: !coupon.isActive })} className="p-2 rounded-lg text-muted hover:bg-surface hover:text-fg transition-all shadow-sm border border-transparent hover:border-line" title={coupon.isActive ? 'Deactivate' : 'Activate'}>
              {coupon.isActive ? <EyeOff size={16} strokeWidth={2.5} /> : <Eye size={16} strokeWidth={2.5} />}
            </button>
            <button onClick={() => {
              showAlert({
                title: 'Delete Coupon',
                message: 'Are you sure you want to delete this coupon?',
                danger: true,
                confirmText: 'Delete',
                onConfirm: () => deleteMutation.mutate(coupon.id || (coupon as any)._id)
              })
            }} className="p-2 rounded-lg text-muted hover:bg-danger/10 hover:text-danger hover:border-danger/20 transition-all shadow-sm border border-transparent" title="Delete">
              <Trash2 size={16} strokeWidth={2.5} />
            </button>
          </div>
        )
      }
    }
  ], [toggleMutation, deleteMutation])

  if (isLoading && !coupons.length) {
    return <CouponsSkeleton />
  }

  return (
    <AdminPage
      title="Coupons"
      subtitle="Manage promotional codes and discounts"
      actions={
        <Button onClick={() => setIsModalOpen(true)} className="font-bold shadow-soft">
          <Plus size={18} strokeWidth={2.5} className="mr-1.5" /> Create Coupon
        </Button>
      }
    >
      <motion.div initial="hidden" animate="show" variants={containerVars}>
        <motion.div variants={itemVars}>
          <Card className="p-6 border-line/80 shadow-sm mb-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-2">
              <TableSearch initialValue={search} onSearch={setSearch} placeholder="Search coupons..." />
              
              <TableFilters>
                <div className="w-40">
                  <Dropdown
                    value={filters.isActive || ''}
                    onChange={(val) => setFilter('isActive', val === 'all' ? null : val)}
                    options={[
                      { value: 'all', label: 'All Status' },
                      { value: 'true', label: 'Active' },
                      { value: 'false', label: 'Inactive' },
                    ]}
                    placeholder="Status"
                  />
                </div>
                <div className="w-40">
                  <Dropdown
                    value={filters.type || ''}
                    onChange={(val) => setFilter('type', val === 'all' ? null : val)}
                    options={[
                      { value: 'all', label: 'All Types' },
                      { value: 'percentage', label: 'Percentage' },
                      { value: 'fixed', label: 'Fixed Amount' },
                    ]}
                    placeholder="Type"
                  />
                </div>
              </TableFilters>
            </div>
            
            <FilterChipList filters={filters} onRemove={removeFilter} onClearAll={clearFilters} />
          </Card>

          <DataTable
            columns={columns}
            data={coupons}
            pageCount={meta.totalPages}
            pagination={pagination}
            setPagination={setPagination}
            sorting={sorting}
            setSorting={setSorting}
            isLoading={isLoading || isPlaceholderData}
          />
          
          {coupons.length > 0 && (
            <TablePagination
              pagination={pagination}
              setPagination={setPagination}
              totalCount={meta.total}
              totalPages={meta.totalPages}
            />
          )}
        </motion.div>
      </motion.div>

      <Modal open={isModalOpen} onClose={() => setIsModalOpen(false)} title="New Coupon" className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="space-y-5">
          <div className="space-y-1.5">
            <Label>Coupon Code</Label>
            <Input 
              value={formData.code} 
              onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })} 
              placeholder="e.g. SUMMER50"
              className="h-11 bg-canvas uppercase"
            />
          </div>

          <div className="space-y-1.5">
            <Label>Description</Label>
            <Input 
              value={formData.description} 
              onChange={e => setFormData({ ...formData, description: e.target.value })} 
              placeholder="Short description for internal use"
              className="h-11 bg-canvas"
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Discount Type</Label>
              <Dropdown 
                value={formData.type as string}
                options={[
                  { value: 'percentage', label: 'Percentage (%)' },
                  { value: 'fixed', label: 'Fixed Amount (₹)' }
                ]}
                onChange={v => setFormData({ ...formData, type: v as 'fixed'|'percentage' })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Value</Label>
              <Input 
                type="number" 
                value={formData.value || ''} 
                onChange={e => {
                  let val = Number(e.target.value)
                  if (formData.type === 'percentage' && val > 100) val = 100
                  if (val < 0) val = 0
                  setFormData({ ...formData, value: val })
                }} 
                placeholder="e.g. 50"
                className={`h-11 bg-canvas ${valueError && formData.value !== 0 ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}`}
              />
              {valueError && formData.value !== 0 && <p className="text-red-500 text-[11px] font-medium mt-1">{valueError}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Valid From</Label>
              <AppDatePicker 
                type="date" 
                value={formData.validFrom as string} 
                onChange={date => setFormData({ ...formData, validFrom: date })} 
              />
            </div>
            <div className="space-y-1.5">
              <Label>Valid Until</Label>
              <AppDatePicker 
                type="date" 
                value={formData.validUntil as string} 
                onChange={date => setFormData({ ...formData, validUntil: date })} 
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Usage Limit</Label>
              <Input 
                type="number" 
                value={formData.usageLimit || ''} 
                onChange={e => setFormData({ ...formData, usageLimit: e.target.value ? Number(e.target.value) : null })} 
                placeholder="Unlimited"
                className="h-11 bg-canvas"
              />
            </div>
            {formData.type === 'percentage' && (
              <div className="space-y-1.5">
                <Label>Max Discount (₹)</Label>
                <Input 
                  type="number" 
                  value={formData.maxDiscountAmount || ''} 
                  onChange={e => setFormData({ ...formData, maxDiscountAmount: e.target.value ? Number(e.target.value) : null })} 
                  placeholder="No limit"
                  className="h-11 bg-canvas"
                />
              </div>
            )}
          </div>

          <div className="space-y-3 pt-2">
            <Label>Applicability</Label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" checked={applyToAll} onChange={() => setApplyToAll(true)} className="accent-primary" />
                <span className="text-sm">All Courses</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" checked={!applyToAll} onChange={() => setApplyToAll(false)} className="accent-primary" />
                <span className="text-sm">Specific Courses</span>
              </label>
            </div>

            {!applyToAll && (
              <div className="border border-line rounded-lg p-3 max-h-48 overflow-y-auto space-y-2 bg-canvas">
                {courses?.courses?.map((course: any) => (
                  <label key={course.id} className="flex items-center gap-3 cursor-pointer p-1 hover:bg-surface2 rounded-md">
                    <input 
                      type="checkbox" 
                      checked={selectedCourses.includes(course.id)} 
                      onChange={(e) => {
                        if (e.target.checked) setSelectedCourses([...selectedCourses, course.id])
                        else setSelectedCourses(selectedCourses.filter(id => id !== course.id))
                      }}
                      className="accent-primary"
                    />
                    <span className="text-sm text-fg">{course.title}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          <div className="pt-4 flex items-center justify-end gap-3">
            <Button variant="ghost" onClick={() => setIsModalOpen(false)} className="font-bold">
              Cancel
            </Button>
            <Button onClick={handleCreateCoupon} loading={createMutation.isPending} className="font-bold shadow-soft">
              Create Coupon
            </Button>
          </div>
        </div>
      </Modal>
    </AdminPage>
  )
}
