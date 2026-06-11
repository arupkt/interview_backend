import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { InvestmentsModule } from './investments/investments.module';
import { ReferralsModule } from './referrals/referrals.module';
import { RoiModule } from './roi/roi.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: '.env',
      isGlobal: true,
    }),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        uri: configService.getOrThrow<string>('MONGO_URI'),
      }),
    }),
    ScheduleModule.forRoot(),
    UsersModule,
    AuthModule,
    InvestmentsModule,
    RoiModule,
    DashboardModule,
    ReferralsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
