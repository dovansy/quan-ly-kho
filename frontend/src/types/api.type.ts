export interface APIErrorResponse<T = unknown> {
  status: number;
  data: {
    code: number;
    message: string;
    data: T;
  };
}

export interface Pagination {
  limit: number;
  page: number;
  total: number;
  totalCurrentPage: number;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalCurrentPage: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  currentPageSize: number;
}

export interface APIResponse<T> {
  code: number;
  message: string;
  data: T;
  metadata?: PaginationMeta;
}
