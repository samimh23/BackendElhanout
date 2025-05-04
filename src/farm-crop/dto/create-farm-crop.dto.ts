import { IsString, IsDate, IsOptional, IsNumber, IsEnum, IsArray, ValidateNested, IsMongoId } from 'class-validator';
import { Type } from 'class-transformer';
//import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AuditStatus } from '../Schema/farm-crop.schema';
import { Types } from 'mongoose';

export class ExpenseDto {
 // @ApiProperty({ description: 'Unique identifier for the expense' })
  @IsString()
  id: string;

 // @ApiProperty({ description: 'Description of the expense' })
  @IsString()
  description: string;

 // @ApiProperty({ description: 'Value of the expense' })
  @IsNumber()
  value: number;

 // @ApiProperty({ description: 'Date when the expense occurred' })
  @IsDate()
  @Type(() => Date)
  date: Date;
}

export class CreateExpenseDto extends ExpenseDto {}

export class CreateFarmCropDto {


  @IsString()
  farmMarketId: string | Types.ObjectId;  


  @IsString()
  productName: string;

  @IsString()
  type: string;

  @IsDate()
  @Type(() => Date)
  implantDate: Date;

//  @ApiPropertyOptional({ description: 'Date when the crop was harvested' })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  harvestedDay?: Date;

//  @ApiPropertyOptional({ description: 'List of expenses related to this crop' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateExpenseDto)
  expenses?: ExpenseDto[];

//  @ApiPropertyOptional({ description: 'Quantity of the harvested crop' })
  @IsOptional()
  @IsNumber()
  quantity?: number;

//  @ApiPropertyOptional({ description: 'Audit status of the crop', enum: AuditStatus })
  @IsOptional()
  @IsEnum(AuditStatus)
  auditStatus?: AuditStatus;

//  @ApiPropertyOptional({ description: 'Audit report for the crop' })
  @IsOptional()
  @IsString()
  auditReport?: string;

//  @ApiPropertyOptional({ description: 'URL of the audit proof image' })
  @IsOptional()
  @IsString()
  auditProofImage?: string;

 // @ApiPropertyOptional({ description: 'URL of the crop picture' })
  @IsOptional()
  @IsString()
  picture?: string;
}
