import { IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class SendMessageDto {
  @IsNotEmpty()
  @IsString()
  message: string;
}

export class RecommendFormationsDto {
  @IsNotEmpty()
  @IsString()
  need: string;
}

export class GenerateJustificationDto {
  @IsNotEmpty()
  @IsString()
  formationName: string;

  @IsNotEmpty()
  @IsString()
  domain: string;

  @IsOptional()
  @IsString()
  context?: string;
}
