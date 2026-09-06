import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsISO8601,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

const SERVICE_SORT_FIELDS = ['name', 'createdAt', 'versionCount'] as const;

type ServiceSortField = (typeof SERVICE_SORT_FIELDS)[number];

export type ServiceSort = ServiceSortField | `-${ServiceSortField}`;

export const SERVICE_SORT_VALUES: readonly ServiceSort[] =
  SERVICE_SORT_FIELDS.flatMap((field) => [field, `-${field}` as const]);

export class ListServicesQueryDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  perPage = 10;

  @IsOptional()
  @IsIn(SERVICE_SORT_VALUES)
  sortBy?: ServiceSort;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  versionCountFrom?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  versionCountTo?: number;

  @IsOptional()
  @IsISO8601()
  createdAtFrom?: string;

  @IsOptional()
  @IsISO8601()
  createdAtTo?: string;

  @IsOptional()
  @IsISO8601()
  latestVersionCreatedAtFrom?: string;

  @IsOptional()
  @IsISO8601()
  latestVersionCreatedAtTo?: string;
}
