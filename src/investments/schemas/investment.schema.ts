import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { User } from '../../users/schemas/user.schema';

export type InvestmentDocument = HydratedDocument<Investment>;

export enum InvestmentStatus {
  Active = 'active',
  Completed = 'completed',
  Cancelled = 'cancelled',
}

export enum InvestmentPlan {
  Starter = 'starter',
  Growth = 'growth',
  Premium = 'premium',
}

@Schema({ timestamps: true })
export class Investment {
  @Prop({ type: Types.ObjectId, ref: User.name, required: true, index: true })
  user: Types.ObjectId;

  @Prop({ required: true, min: 1 })
  amount: number;

  @Prop({
    enum: Object.values(InvestmentPlan),
    required: true,
  })
  plan: InvestmentPlan;

  @Prop({ required: true, min: 0 })
  dailyRoiPercent: number;

  @Prop({ required: true, default: Date.now, index: true })
  startDate: Date;

  @Prop({ required: true, index: true })
  endDate: Date;

  @Prop({
    enum: Object.values(InvestmentStatus),
    default: InvestmentStatus.Active,
    index: true,
  })
  status: InvestmentStatus;
}

export const InvestmentSchema = SchemaFactory.createForClass(Investment);

InvestmentSchema.index({ user: 1, status: 1, startDate: -1 });
InvestmentSchema.index({ status: 1, startDate: 1, endDate: 1 });
