import { useSearchParams } from 'react-router-dom'
import { PaginationState, SortingState } from '@tanstack/react-table'
import { useCallback, useMemo } from 'react'

export function useTableState() {
  const [searchParams, setSearchParams] = useSearchParams()

  // Pagination
  const pageIndex = Number(searchParams.get('page') || '1') - 1
  const pageSize = Number(searchParams.get('limit') || '10')

  const pagination = useMemo<PaginationState>(
    () => ({
      pageIndex,
      pageSize,
    }),
    [pageIndex, pageSize]
  )

  const setPagination = useCallback(
    (updater: PaginationState | ((old: PaginationState) => PaginationState)) => {
      const newState = typeof updater === 'function' ? updater(pagination) : updater
      setSearchParams(
        (prev) => {
          prev.set('page', String(newState.pageIndex + 1))
          prev.set('limit', String(newState.pageSize))
          return prev
        },
        { replace: true }
      )
    },
    [pagination, setSearchParams]
  )

  // Sorting
  const sortBy = searchParams.get('sortBy') || 'createdAt'
  const sortOrder = searchParams.get('sortOrder') || 'desc'

  const sorting = useMemo<SortingState>(
    () => [
      {
        id: sortBy,
        desc: sortOrder === 'desc',
      },
    ],
    [sortBy, sortOrder]
  )

  const setSorting = useCallback(
    (updater: SortingState | ((old: SortingState) => SortingState)) => {
      const newState = typeof updater === 'function' ? updater(sorting) : updater
      setSearchParams(
        (prev) => {
          if (newState.length > 0) {
            prev.set('sortBy', newState[0].id)
            prev.set('sortOrder', newState[0].desc ? 'desc' : 'asc')
          } else {
            prev.delete('sortBy')
            prev.delete('sortOrder')
          }
          return prev
        },
        { replace: true }
      )
    },
    [sorting, setSearchParams]
  )

  // Search
  const search = searchParams.get('search') || ''
  
  const setSearch = useCallback(
    (value: string) => {
      setSearchParams(
        (prev) => {
          if (value) prev.set('search', value)
          else prev.delete('search')
          prev.set('page', '1') // Reset to page 1 on search
          return prev
        },
        { replace: true }
      )
    },
    [setSearchParams]
  )

  // Filters (excluding standard ones)
  const filters = useMemo(() => {
    const standardKeys = ['page', 'limit', 'sortBy', 'sortOrder', 'search']
    const activeFilters: Record<string, string> = {}
    for (const [key, value] of searchParams.entries()) {
      if (!standardKeys.includes(key)) {
        activeFilters[key] = value
      }
    }
    return activeFilters
  }, [searchParams])

  const setFilter = useCallback(
    (key: string, value: string | null) => {
      setSearchParams(
        (prev) => {
          if (value) prev.set(key, value)
          else prev.delete(key)
          prev.set('page', '1') // Reset page on filter change
          return prev
        },
        { replace: true }
      )
    },
    [setSearchParams]
  )

  const removeFilter = useCallback(
    (key: string) => {
      setSearchParams(
        (prev) => {
          prev.delete(key)
          prev.set('page', '1')
          return prev
        },
        { replace: true }
      )
    },
    [setSearchParams]
  )

  const clearFilters = useCallback(() => {
    setSearchParams(
      (prev) => {
        const standardKeys = ['page', 'limit', 'sortBy', 'sortOrder', 'search']
        const keysToRemove = Array.from(prev.keys()).filter((k) => !standardKeys.includes(k))
        keysToRemove.forEach((k) => prev.delete(k))
        prev.set('page', '1')
        return prev
      },
      { replace: true }
    )
  }, [setSearchParams])

  return {
    pagination,
    setPagination,
    sorting,
    setSorting,
    search,
    setSearch,
    filters,
    setFilter,
    removeFilter,
    clearFilters,
    searchParams // Expose raw searchParams for API calls
  }
}
