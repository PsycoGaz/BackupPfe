import { IsOptional, IsString } from 'class-validator';

export class DecisionDto {
  @IsOptional()
  @IsString()
  comment?: string;
}
