import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateVersionDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  version: string;

  @IsOptional()
  @IsString()
  notes?: string | null;
}
