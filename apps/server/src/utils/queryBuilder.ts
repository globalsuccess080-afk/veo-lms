export function buildQuery(query: any, searchFields: string[]) {
  // Extract standard pagination/sorting/search params
  const {
    search,
    page = 1,
    limit = 10,
    sortBy = 'createdAt',
    sortOrder = 'desc',
    ...filters
  } = query

  // Build the Mongoose filter object
  const filterQuery: any = { ...filters }

  // Handle boolean and null strings in filters (e.g. from URL ?isPublished=true)
  for (const key in filterQuery) {
    if (filterQuery[key] === 'true') filterQuery[key] = true
    else if (filterQuery[key] === 'false') filterQuery[key] = false
    else if (filterQuery[key] === 'null') filterQuery[key] = null
  }

  // Text search
  if (search && searchFields.length > 0) {
    filterQuery.$or = searchFields.map(field => ({
      [field]: { $regex: search, $options: 'i' }
    }))
  }

  // Calculate skip/limit
  const parsedPage = Math.max(1, parseInt(page as string) || 1)
  const parsedLimit = Math.max(1, parseInt(limit as string) || 10)
  const skip = (parsedPage - 1) * parsedLimit

  // Construct sort object
  const sort: Record<string, 1 | -1> = {
    [sortBy as string]: sortOrder === 'desc' ? -1 : 1
  }

  return {
    filterQuery,
    skip,
    limit: parsedLimit,
    sort,
    page: parsedPage
  }
}
