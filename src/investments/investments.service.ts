import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { addDays, startOfUtcDay } from '../common/utils/dates';
import { CreateInvestmentDto } from './dto/create-investment.dto';
import {
  Investment,
  InvestmentDocument,
  InvestmentPlan,
  InvestmentStatus,
} from './schemas/investment.schema';

const PLAN_CONFIG: Record<
  InvestmentPlan,
  { dailyRoiPercent: number; durationDays: number }
> = {
  [InvestmentPlan.Starter]: { dailyRoiPercent: 1, durationDays: 100 },
  [InvestmentPlan.Growth]: { dailyRoiPercent: 1.5, durationDays: 120 },
  [InvestmentPlan.Premium]: { dailyRoiPercent: 2, durationDays: 150 },
};

@Injectable()
export class InvestmentsService {
  constructor(
    @InjectModel(Investment.name)
    private investmentModel: Model<InvestmentDocument>,
  ) {}

  async create(userId: string, dto: CreateInvestmentDto) {
    const planConfig = PLAN_CONFIG[dto.plan];
    const startDate = dto.startDate
      ? startOfUtcDay(new Date(dto.startDate))
      : startOfUtcDay();
    const endDate = dto.endDate
      ? startOfUtcDay(new Date(dto.endDate))
      : addDays(startDate, planConfig.durationDays);

    if (endDate <= startDate) {
      throw new BadRequestException('endDate must be after startDate');
    }

    return this.investmentModel.create({
      user: new Types.ObjectId(userId),
      amount: dto.amount,
      plan: dto.plan,
      dailyRoiPercent: planConfig.dailyRoiPercent,
      startDate,
      endDate,
      status: InvestmentStatus.Active,
    });
  }

  async findActiveForDate(date: Date): Promise<InvestmentDocument[]> {
    return this.investmentModel
      .find({
        status: InvestmentStatus.Active,
        startDate: { $lte: date },
        endDate: { $gt: date },
      })
      .exec();
  }

  async listForUser(userId: string): Promise<InvestmentDocument[]> {
    return this.investmentModel
      .find({ user: new Types.ObjectId(userId) })
      .sort({ startDate: -1 })
      .lean()
      .exec();
  }

  async totalsForUser(userId: string) {
    const [result] = await this.investmentModel
      .aggregate<{
        totalInvested: number;
        activeInvested: number;
        count: number;
      }>([
        { $match: { user: new Types.ObjectId(userId) } },
        {
          $group: {
            _id: null,
            totalInvested: { $sum: '$amount' },
            activeInvested: {
              $sum: {
                $cond: [{ $eq: ['$status', InvestmentStatus.Active] }, '$amount', 0],
              },
            },
            count: { $sum: 1 },
          },
        },
      ])
      .exec();

    return result ?? { totalInvested: 0, activeInvested: 0, count: 0 };
  }
}
