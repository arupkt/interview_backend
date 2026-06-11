import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from '../users/schemas/user.schema';
import { UsersModule } from '../users/users.module';
import {
  LevelIncome,
  LevelIncomeSchema,
} from './schemas/level-income.schema';
import { ReferralsController } from './referrals.controller';
import { ReferralsService } from './referrals.service';

@Module({
  imports: [
    UsersModule,
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: LevelIncome.name, schema: LevelIncomeSchema },
    ]),
  ],
  controllers: [ReferralsController],
  providers: [ReferralsService],
})
export class ReferralsModule {}
