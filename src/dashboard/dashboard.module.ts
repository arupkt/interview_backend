import { Module } from '@nestjs/common';
import { InvestmentsModule } from '../investments/investments.module';
import { RoiModule } from '../roi/roi.module';
import { UsersModule } from '../users/users.module';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';

@Module({
  imports: [UsersModule, InvestmentsModule, RoiModule],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
