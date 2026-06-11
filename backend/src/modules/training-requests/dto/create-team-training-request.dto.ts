import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsDateString,
  IsArray,
  ArrayMinSize,
  Matches,
  MaxLength,
  ValidateIf,
  Validate,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';
import { RequestType } from '../../../common/enums';

@ValidatorConstraint({ name: 'isNotPastDateTeam', async: false })
class IsNotPastDateConstraint implements ValidatorConstraintInterface {
  validate(value: string) {
    if (!value) return true;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return new Date(value) >= today;
  }

  defaultMessage(args: ValidationArguments) {
    return `${args.property} ne peut pas être une date passée`;
  }
}

@ValidatorConstraint({ name: 'isEndDateAfterStartTeam', async: false })
class IsEndDateAfterStartConstraint implements ValidatorConstraintInterface {
  validate(value: string, args: ValidationArguments) {
    if (!value) return true;
    const obj = args.object as { desiredStartDate?: string };
    if (!obj.desiredStartDate) return true;
    return new Date(value) >= new Date(obj.desiredStartDate);
  }

  defaultMessage() {
    return 'La date de fin doit être égale ou postérieure à la date de début';
  }
}

export class CreateTeamTrainingRequestDto {
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
  @Validate(IsNotPastDateConstraint)
  desiredStartDate: string;

  @IsOptional()
  @IsDateString()
  @Validate(IsNotPastDateConstraint)
  @Validate(IsEndDateAfterStartConstraint)
  desiredEndDate?: string;

  @IsOptional()
  @IsString()
  justification?: string;

  @IsArray()
  @ArrayMinSize(1)
  @Matches(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, {
    each: true,
    message: 'each participantId must be a valid UUID format',
  })
  participantIds: string[];
}
