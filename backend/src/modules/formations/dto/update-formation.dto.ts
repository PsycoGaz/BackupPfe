import { IsOptional, IsString, IsNumber, MaxLength, IsBoolean } from 'class-validator';

export class UpdateFormationDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  domain?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  estimatedCost?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
