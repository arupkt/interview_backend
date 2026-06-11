import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as cron from 'node-cron';
import { RoiService } from './roi.service';

@Injectable()
export class RoiScheduler implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RoiScheduler.name);
  private task?: cron.ScheduledTask;

  constructor(
    private readonly roiService: RoiService,
    private readonly configService: ConfigService,
  ) {}

  onModuleInit() {
    const expression = this.configService.get<string>('ROI_CRON', '0 0 * * *');
    const timezone = this.configService.get<string>(
      'ROI_TIMEZONE',
      'Asia/Kolkata',
    );

    this.task = cron.schedule(
      expression,
      async () => {
        const summary = await this.roiService.calculateDailyRoi();
        this.logger.log(`Daily ROI completed: ${JSON.stringify(summary)}`);
      },
      { timezone },
    );

    this.logger.log(`Daily ROI scheduled: "${expression}" (${timezone})`);
  }

  onModuleDestroy() {
    this.task?.stop();
  }
}
