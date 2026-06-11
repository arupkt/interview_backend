import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { startOfUtcDay } from '../common/utils/dates';
import { InvestmentDocument } from '../investments/schemas/investment.schema';
import { InvestmentsService } from '../investments/investments.service';
import {
  LevelIncome,
  LevelIncomeDocument,
  LevelIncomeSource,
} from '../referrals/schemas/level-income.schema';
import { UserDocument } from '../users/schemas/user.schema';
import { UsersService } from '../users/users.service';
import { RoiHistory, RoiHistoryDocument } from './schemas/roi-history.schema';

const LEVEL_PERCENTAGES: Record<number, number> = {
  1: 10,
  2: 5,
  3: 2,
};

@Injectable()
export class RoiService {
  private readonly logger = new Logger(RoiService.name);

  constructor(
    private readonly investmentsService: InvestmentsService,
    private readonly usersService: UsersService,
    @InjectModel(RoiHistory.name)
    private readonly roiHistoryModel: Model<RoiHistoryDocument>,
    @InjectModel(LevelIncome.name)
    private readonly levelIncomeModel: Model<LevelIncomeDocument>,
  ) {}

  async calculateDailyRoi(targetDate = new Date()) {
    const roiDate = startOfUtcDay(targetDate);
    const investments = await this.investmentsService.findActiveForDate(roiDate);

    const summary = {
      roiDate,
      checkedInvestments: investments.length,
      roiCreated: 0,
      roiSkipped: 0,
      levelIncomeCreated: 0,
      levelIncomeSkipped: 0,
    };

    for (const investment of investments) {
      const roi = await this.createRoiIfNeeded(investment, roiDate);
      if (!roi.created) {
        summary.roiSkipped += 1;
        continue;
      }

      summary.roiCreated += 1;
      await this.usersService.incrementBalances(investment.user, {
        wallet: roi.document.amount,
        totalRoi: roi.document.amount,
      });

      const user = await this.usersService.findById(investment.user);
      if (!user) {
        this.logger.warn(`User ${String(investment.user)} not found for ROI`);
        continue;
      }

      const levelSummary = await this.createLevelIncome(
        user,
        investment,
        roi.document,
        roiDate,
      );
      summary.levelIncomeCreated += levelSummary.created;
      summary.levelIncomeSkipped += levelSummary.skipped;
    }

    return summary;
  }

  async totalsForUser(userId: string) {
    const id = new Types.ObjectId(userId);
    const [roi, levelIncome] = await Promise.all([
      this.sumByUser(this.roiHistoryModel, id, 'amount'),
      this.sumByUser(this.levelIncomeModel, id, 'amount'),
    ]);

    return { totalRoi: roi, totalLevelIncome: levelIncome };
  }

  async dailyRoiForUser(userId: string, date = new Date()) {
    const roiDate = startOfUtcDay(date);
    const [result] = await this.roiHistoryModel
      .aggregate<{ total: number }>([
        { $match: { user: new Types.ObjectId(userId), roiDate } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ])
      .exec();

    return result?.total ?? 0;
  }

  async recentRoiForUser(userId: string, limit = 20) {
    return this.roiHistoryModel
      .find({ user: new Types.ObjectId(userId) })
      .sort({ roiDate: -1 })
      .limit(limit)
      .populate('investment', 'plan amount')
      .lean()
      .exec();
  }

  async recentLevelIncomeForUser(userId: string, limit = 20) {
    return this.levelIncomeModel
      .find({ user: new Types.ObjectId(userId) })
      .sort({ incomeDate: -1 })
      .limit(limit)
      .populate('fromUser', 'name email referralCode')
      .lean()
      .exec();
  }

  private async createRoiIfNeeded(
    investment: InvestmentDocument,
    roiDate: Date,
  ): Promise<{ created: true; document: RoiHistoryDocument } | { created: false }> {
    const amount = this.roundMoney(
      (investment.amount * investment.dailyRoiPercent) / 100,
    );

    try {
      const document = await this.roiHistoryModel.create({
        user: investment.user,
        investment: investment._id,
        amount,
        percentage: investment.dailyRoiPercent,
        roiDate,
      });
      return { created: true, document };
    } catch (error) {
      if (this.isDuplicateKeyError(error)) {
        return { created: false };
      }
      throw error;
    }
  }

  private async createLevelIncome(
    user: UserDocument,
    investment: InvestmentDocument,
    roiHistory: RoiHistoryDocument,
    incomeDate: Date,
  ) {
    const summary = { created: 0, skipped: 0 };

    for (const ancestor of user.ancestors) {
      const percentage = LEVEL_PERCENTAGES[ancestor.level];
      if (!percentage) {
        continue;
      }

      const amount = this.roundMoney((roiHistory.amount * percentage) / 100);
      if (amount <= 0) {
        continue;
      }

      try {
        await this.levelIncomeModel.create({
          user: ancestor.user,
          fromUser: user._id,
          investment: investment._id,
          roiHistory: roiHistory._id,
          level: ancestor.level,
          sourceAmount: roiHistory.amount,
          amount,
          source: LevelIncomeSource.DailyRoi,
          incomeDate,
        });

        await this.usersService.incrementBalances(ancestor.user, {
          wallet: amount,
          totalLevelIncome: amount,
        });
        summary.created += 1;
      } catch (error) {
        if (this.isDuplicateKeyError(error)) {
          summary.skipped += 1;
          continue;
        }
        throw error;
      }
    }

    return summary;
  }

  private async sumByUser(
    model: Model<RoiHistoryDocument> | Model<LevelIncomeDocument>,
    userId: Types.ObjectId,
    field: string,
  ): Promise<number> {
    const [result] = await model
      .aggregate<{ total: number }>([
        { $match: { user: userId } },
        { $group: { _id: null, total: { $sum: `$${field}` } } },
      ])
      .exec();

    return result?.total ?? 0;
  }

  private roundMoney(value: number): number {
    return Math.round((value + Number.EPSILON) * 100) / 100;
  }

  private isDuplicateKeyError(error: unknown): boolean {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === 11000
    );
  }
}
