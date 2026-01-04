export type PaginationParams = {
  page: number;
  limit: number;
};

export const getPaginationParams = (query: any): PaginationParams => {
  const page = Math.abs(parseInt(query.page) || 1);
  const limit = Math.abs(parseInt(query.limit) || 10);
  
  // Hard limit to prevent abuse (max 100 items per page)
  const safeLimit = limit > 100 ? 100 : limit;

  return { page, limit: safeLimit };
};

export const paginateResponse = (data: any[], total: number, page: number, limit: number) => {
  const totalPages = Math.ceil(total / limit);
  return {
    data,
    meta: {
      total,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  };
};