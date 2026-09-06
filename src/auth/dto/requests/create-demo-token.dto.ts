import { Type } from 'class-transformer';
import { IsInt, Min } from 'class-validator';

export class CreateDemoTokenDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  userId: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  tenantId: number;
}
