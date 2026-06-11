import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersModule } from '../users/users.module';
import {
  Investment,
  InvestmentSchema,
} from './schemas/investment.schema';
import { InvestmentsController } from './investments.controller';
import { InvestmentsService } from './investments.service';

@Module({
  imports: [
    UsersModule,
    MongooseModule.forFeature([
      { name: Investment.name, schema: InvestmentSchema },
    ]),
  ],
  controllers: [InvestmentsController],
  providers: [InvestmentsService],
  exports: [InvestmentsService, MongooseModule],
})
export class InvestmentsModule {}
