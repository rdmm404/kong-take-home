import { createPaginatedResponse, pageToOffsetPagination } from './pagination';

describe('pagination', () => {
  describe('pageToOffsetPagination', () => {
    it('converts a one-based page to an offset and limit', () => {
      expect(pageToOffsetPagination({ page: 3, perPage: 20 })).toEqual({
        offset: 40,
        limit: 20,
      });
    });
  });

  describe('createPaginatedResponse', () => {
    it('creates a next URL while preserving existing query parameters', () => {
      expect(
        createPaginatedResponse(
          { data: ['Payments API'], total: 3 },
          { page: 1, perPage: 2 },
          '/services?sortBy=-versionCount&page=1&perPage=2',
        ),
      ).toEqual({
        data: ['Payments API'],
        total: 3,
        totalPages: 2,
        next: '/services?sortBy=-versionCount&page=2&perPage=2',
      });
    });

    it('does not create a next URL on the last page', () => {
      expect(
        createPaginatedResponse(
          { data: [], total: 0 },
          { page: 1, perPage: 10 },
          '/services',
        ).next,
      ).toBeNull();
    });
  });
});
