import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { InvestmentsModule } from '../investments/investments.module';
import {
  LevelIncome,
  LevelIncomeSchema,
} from '../referrals/schemas/level-income.schema';
import { UsersModule } from '../users/users.module';
import { RoiScheduler } from './roi.scheduler';
import { RoiService } from './roi.service';
import { RoiHistory, RoiHistorySchema } from './schemas/roi-history.schema';

@Module({
  imports: [
    ConfigModule,
    UsersModule,
    InvestmentsModule,
    MongooseModule.forFeature([
      { name: RoiHistory.name, schema: RoiHistorySchema },
      { name: LevelIncome.name, schema: LevelIncomeSchema },
    ]),
  ],
  providers: [RoiService, RoiScheduler],
  exports: [RoiService, MongooseModule],
})
export class RoiModule {}
