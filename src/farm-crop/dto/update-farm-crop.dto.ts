import { PartialType } from '@nestjs/mapped-types';
import { CreateFarmCropDto, ExpenseDto } from './create-farm-crop.dto';
import { IsString, IsDate, IsOptional, IsNumber, IsEnum, IsArray, ValidateNested, IsMongoId } from 'class-validator';
import { Type } from 'class-transformer';
//import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AuditStatus } from '../Schema/farm-crop.schema';



export class UpdateFarmCropDto extends PartialType(CreateFarmCropDto) {

   // @ApiPropertyOptional({ description: 'Name of the crop product' })
    @IsOptional()
    @IsString()
    productName?: string;
  
  //  @ApiPropertyOptional({ description: 'Type of the crop' })
    @IsOptional()
    @IsString()
    type?: string;
  
  //  @ApiPropertyOptional({ description: 'Date when the crop was implanted' })
    @IsOptional()
    @IsDate()
    @Type(() => Date)
    implantDate?: Date;
  
//    @ApiPropertyOptional({ description: 'Date when the crop was harvested' })
    @IsOptional()
    @IsDate()
    @Type(() => Date)
    harvestedDay?: Date;
  
 //   @ApiPropertyOptional({ description: 'List of expenses related to this crop' })
    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => ExpenseDto)
    expenses?: ExpenseDto[];
  
 //   @ApiPropertyOptional({ description: 'Quantity of the harvested crop' })
    @IsOptional()
    @IsNumber()
    quantity?: number;
  
 //   @ApiPropertyOptional({ description: 'Audit status of the crop', enum: AuditStatus })
    @IsOptional()
    @IsEnum(AuditStatus)
    auditStatus?: AuditStatus;
  
   // @ApiPropertyOptional({ description: 'Audit report for the crop' })
    @IsOptional()
    @IsString()
    auditReport?: string;
  
  //  @ApiPropertyOptional({ description: 'URL of the audit proof image' })
    @IsOptional()
    @IsString()
    auditProofImage?: string;
  
  //  @ApiPropertyOptional({ description: 'URL of the crop picture' })
    @IsOptional()
    @IsString()
    picture?: string;
  }