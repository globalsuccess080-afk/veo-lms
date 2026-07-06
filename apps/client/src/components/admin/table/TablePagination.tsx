import React from 'react'
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'
import { Dropdown } from '../../ui/Dropdown'
import { PaginationState } from '@tanstack/react-table'

interface TablePaginationProps {
  pagination: PaginationState
  setPagination: (updater: PaginationState | ((old: PaginationState) => PaginationState)) => void
  totalCount: number
  totalPages: number
}

export function TablePagination({
  pagination,
  setPagination,
  totalCount,
  totalPages,
}: TablePaginationProps) {
  const { pageIndex, pageSize } = pagination

  const canPreviousPage = pageIndex > 0
  const canNextPage = pageIndex < totalPages - 1

  return (
    <div className="flex flex-col md:flex-row items-center justify-between gap-4 px-2 py-4 text-sm text-muted">
      <div className="flex-1 text-center md:text-left w-full">
        Showing {totalCount === 0 ? 0 : pageIndex * pageSize + 1} to{' '}
        {Math.min((pageIndex + 1) * pageSize, totalCount)} of {totalCount} entries
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 lg:gap-8 w-full md:w-auto justify-center md:justify-end">
        <div className="flex items-center space-x-2 shrink-0">
          <p className="font-medium whitespace-nowrap">Rows per page</p>
          <Dropdown
            size="sm"
            className="w-[70px]"
            value={String(pageSize)}
            onChange={(value) => {
              setPagination({ pageIndex: 0, pageSize: Number(value) })
            }}
            options={[10, 25, 50, 100].map((size) => ({ value: String(size), label: String(size) }))}
          />
        </div>

        <div className="flex items-center space-x-2">
          <button
            className="p-1 rounded-md hover:bg-surface2 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={() => setPagination((prev) => ({ ...prev, pageIndex: 0 }))}
            disabled={!canPreviousPage}
          >
            <ChevronsLeft size={16} />
          </button>
          <button
            className="p-1 rounded-md hover:bg-surface2 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={() => setPagination((prev) => ({ ...prev, pageIndex: prev.pageIndex - 1 }))}
            disabled={!canPreviousPage}
          >
            <ChevronLeft size={16} />
          </button>

          <span className="flex items-center justify-center text-sm font-medium">
            Page {pageIndex + 1} of {Math.max(1, totalPages)}
          </span>

          <button
            className="p-1 rounded-md hover:bg-surface2 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={() => setPagination((prev) => ({ ...prev, pageIndex: prev.pageIndex + 1 }))}
            disabled={!canNextPage}
          >
            <ChevronRight size={16} />
          </button>
          <button
            className="p-1 rounded-md hover:bg-surface2 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={() => setPagination((prev) => ({ ...prev, pageIndex: totalPages - 1 }))}
            disabled={!canNextPage}
          >
            <ChevronsRight size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}
