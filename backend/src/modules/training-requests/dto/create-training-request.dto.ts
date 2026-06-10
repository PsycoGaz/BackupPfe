import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsDateString,
  Matches,
  MaxLength,
  ValidateIf,
} from 'class-validator';
import { RequestType } from '../../../common/enums';

export class CreateTrainingRequestDto {
  @IsEnum(RequestType)
  requestType: RequestType;

  @ValidateIf((o) => o.requestType === RequestType.CATALOGUE && o.formationId)
  @Matches(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, {
    message: 'formationId must be a valid UUID format',
  })
  formationId?: string;

  @ValidateIf((o) => o.requestType === RequestType.NOUVELLE)
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  customFormationName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  domain?: string;

  @IsNotEmpty()
  @IsDateString()
  desiredStartDate: string;

  @IsOptional()
  @IsDateString()
  desiredEndDate?: string;

  @IsOptional()
  @IsString()
  justification?: string;
}
