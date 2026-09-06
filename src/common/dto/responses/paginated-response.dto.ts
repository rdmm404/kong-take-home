export class PaginatedResponseDto<T> {
  data: T[];
  total: number;
  totalPages: number;
  next: string | null;
}
