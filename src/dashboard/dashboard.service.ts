import { Injectable, NotFoundException } from '@nestjs/common';
import { InvestmentsService } from '../investments/investments.service';
import { RoiService } from '../roi/roi.service';
import { UsersService } from '../users/users.service';

@Injectable()
export class DashboardService {
  constructor(
    private readonly usersService: UsersService,
    private readonly investmentsService: InvestmentsService,
    private readonly roiService: RoiService,
  ) {}

  async getDashboard(userId: string) {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const [
      investmentTotals,
      investments,
      incomeTotals,
      dailyRoi,
      recentRoi,
      recentLevelIncome,
    ] = await Promise.all([
      this.investmentsService.totalsForUser(userId),
      this.investmentsService.listForUser(userId),
      this.roiService.totalsForUser(userId),
      this.roiService.dailyRoiForUser(userId),
      this.roiService.recentRoiForUser(userId),
      this.roiService.recentLevelIncomeForUser(userId),
    ]);

    return {
      user: {
        id: String(user._id),
        name: user.name,
        email: user.email,
        referralCode: user.referralCode,
        balances: user.balances,
      },
      totals: {
        ...investmentTotals,
        dailyRoi,
        totalRoi: incomeTotals.totalRoi,
        totalLevelIncome: incomeTotals.totalLevelIncome,
        totalIncome: incomeTotals.totalRoi + incomeTotals.totalLevelIncome,
      },
      investments,
      recentRoi,
      recentLevelIncome,
    };
  }
}
