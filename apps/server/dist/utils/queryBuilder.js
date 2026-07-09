"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildQuery = buildQuery;
function buildQuery(query, searchFields) {
    // Extract standard pagination/sorting/search params
    const { search, page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc', ...filters } = query;
    // Build the Mongoose filter object
    const filterQuery = { ...filters };
    // Handle boolean and null strings in filters (e.g. from URL ?isPublished=true)
    for (const key in filterQuery) {
        if (filterQuery[key] === 'true')
            filterQuery[key] = true;
        else if (filterQuery[key] === 'false')
            filterQuery[key] = false;
        else if (filterQuery[key] === 'null')
            filterQuery[key] = null;
    }
    // Text search
    if (search && searchFields.length > 0) {
        filterQuery.$or = searchFields.map(field => ({
            [field]: { $regex: search, $options: 'i' }
        }));
    }
    // Calculate skip/limit
    const parsedPage = Math.max(1, parseInt(page) || 1);
    const parsedLimit = Math.max(1, parseInt(limit) || 10);
    const skip = (parsedPage - 1) * parsedLimit;
    // Construct sort object
    const sort = {
        [sortBy]: sortOrder === 'desc' ? -1 : 1
    };
    return {
        filterQuery,
        skip,
        limit: parsedLimit,
        sort,
        page: parsedPage
    };
}
