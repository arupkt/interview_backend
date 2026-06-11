import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { Investment } from '../../investments/schemas/investment.schema';
import { User } from '../../users/schemas/user.schema';

export type RoiHistoryDocument = HydratedDocument<RoiHistory>;

@Schema({ timestamps: true })
export class RoiHistory {
  @Prop({ type: Types.ObjectId, ref: User.name, required: true, index: true })
  user: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: Investment.name,
    required: true,
    index: true,
  })
  investment: Types.ObjectId;

  @Prop({ required: true, min: 0 })
  amount: number;

  @Prop({ required: true, min: 0 })
  percentage: number;

  @Prop({ required: true, index: true })
  roiDate: Date;
}

export const RoiHistorySchema = SchemaFactory.createForClass(RoiHistory);

RoiHistorySchema.index({ investment: 1, roiDate: 1 }, { unique: true });
RoiHistorySchema.index({ user: 1, roiDate: -1 });
