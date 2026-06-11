import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { Investment } from '../../investments/schemas/investment.schema';
import { RoiHistory } from '../../roi/schemas/roi-history.schema';
import { User } from '../../users/schemas/user.schema';

export type LevelIncomeDocument = HydratedDocument<LevelIncome>;

export enum LevelIncomeSource {
  DailyRoi = 'daily_roi',
}

@Schema({ timestamps: true })
export class LevelIncome {
  @Prop({ type: Types.ObjectId, ref: User.name, required: true, index: true })
  user: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: User.name, required: true, index: true })
  fromUser: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: Investment.name,
    required: true,
    index: true,
  })
  investment: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: RoiHistory.name, default: null })
  roiHistory?: Types.ObjectId | null;

  @Prop({ required: true, min: 1 })
  level: number;

  @Prop({ required: true, min: 0 })
  sourceAmount: number;

  @Prop({ required: true, min: 0 })
  amount: number;

  @Prop({
    enum: Object.values(LevelIncomeSource),
    default: LevelIncomeSource.DailyRoi,
  })
  source: LevelIncomeSource;

  @Prop({ required: true, index: true })
  incomeDate: Date;
}

export const LevelIncomeSchema = SchemaFactory.createForClass(LevelIncome);

LevelIncomeSchema.index(
  { user: 1, investment: 1, level: 1, incomeDate: 1, source: 1 },
  { unique: true },
);
LevelIncomeSchema.index({ user: 1, incomeDate: -1 });
