import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { JwtUser } from '../common/decorators/current-user.decorator';
import type { ReferralNode } from './referrals.service';
import { ReferralsService } from './referrals.service';

@Controller('referrals')
@UseGuards(JwtAuthGuard)
export class ReferralsController {
  constructor(private readonly referralsService: ReferralsService) {}

  @Get('tree')
  getTree(
    @CurrentUser() user: JwtUser,
    @Query('depth') depth?: string,
  ): Promise<ReferralNode[]> {
    const maxDepth = depth ? Number(depth) : 10;
    return this.referralsService.getTree(user.sub, maxDepth);
  }
}
