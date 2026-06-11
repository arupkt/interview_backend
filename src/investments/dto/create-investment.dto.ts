import { IsDateString, IsEnum, IsNumber, IsOptional, Min } from 'class-validator';
import { InvestmentPlan } from '../schemas/investment.schema';

export class CreateInvestmentDto {
  @IsNumber()
  @Min(1)
  amount: number;

  @IsEnum(InvestmentPlan)
  plan: InvestmentPlan;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}
