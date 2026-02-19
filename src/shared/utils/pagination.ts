export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export const parsePagination = (query?: { page?: string | number; limit?: string | number }): { skip: number; take: number; page: number; limit: number } => {
  const page = Math.max(1, parseInt(String(query?.page || '1'), 10));
  const limit = Math.min(100, Math.max(1, parseInt(String(query?.limit || '10'), 10)));
  const skip = (page - 1) * limit;
  return { skip, take: limit, page, limit };
};

export const buildPaginationMeta = (total: number, page: number, limit: number): PaginationMeta => {
  const totalPages = Math.ceil(total / limit);
  return {
    total,
    page,
    limit,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
};
