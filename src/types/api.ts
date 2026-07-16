/** Laravel paginator envelope for collection endpoints. */
export interface Paginated<T> {
  data: T[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
  };
  links: {
    first: string | null;
    last: string | null;
    prev: string | null;
    next: string | null;
  };
}

/** Common list-endpoint query params. */
export interface ListParams {
  page?: number;
  per_page?: number;
  search?: string;
  sort?: string;
}
