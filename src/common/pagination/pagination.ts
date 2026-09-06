import { PaginatedResponseDto } from './paginated-response.dto';

export interface PagePagination {
  page: number;
  perPage: number;
}

export interface OffsetPagination {
  offset: number;
  limit: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
}

export function pageToOffsetPagination({
  page,
  perPage,
}: PagePagination): OffsetPagination {
  return {
    offset: (page - 1) * perPage,
    limit: perPage,
  };
}

export function createPaginatedResponse<T>(
  result: PaginatedResult<T>,
  pagination: PagePagination,
  currentUrl: string,
): PaginatedResponseDto<T> {
  const totalPages = Math.ceil(result.total / pagination.perPage);

  return {
    ...result,
    totalPages,
    next:
      pagination.page < totalPages
        ? createNextPageUrl(currentUrl, pagination.page + 1, pagination.perPage)
        : null,
  };
}

function createNextPageUrl(
  currentUrl: string,
  page: number,
  perPage: number,
): string {
  const url = new URL(currentUrl, 'https://foo.bar');
  url.searchParams.set('page', String(page));
  url.searchParams.set('perPage', String(perPage));

  return `${url.pathname}${url.search}`;
}
