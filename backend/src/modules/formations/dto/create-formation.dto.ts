import { IsNotEmpty, IsOptional, IsString, IsNumber, MaxLength } from 'class-validator';

export class CreateFormationDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  name: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  domain: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  estimatedCost?: number;
}
