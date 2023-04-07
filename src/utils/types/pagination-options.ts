export interface IPaginationOptions {
  page: number;
  limit: number;
}

export interface ICursorPaginationOptions {
  before?: unknown;
  after?: unknown;
  count?: number;
}
