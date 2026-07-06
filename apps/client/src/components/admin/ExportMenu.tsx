import React from 'react'
import { Dropdown } from '../ui/Dropdown'

interface ExportMenuProps {
  onExport: (format: 'csv' | 'xlsx' | 'pdf') => void
  disabled?: boolean
  isExporting?: boolean
}

export const ExportMenu: React.FC<ExportMenuProps> = ({ onExport, disabled, isExporting }) => {
  const options = [
    { value: 'csv', label: 'Export as CSV' },
    { value: 'xlsx', label: 'Export as Excel (.xlsx)' },
    { value: 'pdf', label: 'Export as PDF' }
  ]

  const handleChange = (val: string) => {
    if (val === 'csv' || val === 'xlsx' || val === 'pdf') {
      onExport(val)
    }
  }

  return (
    <div className="w-48">
      <Dropdown
        value={undefined}
        onChange={handleChange}
        options={options}
        placeholder={isExporting ? 'Exporting...' : 'Export'}
        disabled={disabled || isExporting}
        searchable={false}
      />
    </div>
  )
}
