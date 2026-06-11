import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type UserDocument = HydratedDocument<User>;

@Schema({ _id: false })
export class ReferralAncestor {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user: Types.ObjectId;

  @Prop({ required: true, min: 1 })
  level: number;
}

export const ReferralAncestorSchema =
  SchemaFactory.createForClass(ReferralAncestor);

@Schema({ _id: false })
export class UserBalances {
  @Prop({ default: 0, min: 0 })
  wallet: number;

  @Prop({ default: 0, min: 0 })
  totalRoi: number;

  @Prop({ default: 0, min: 0 })
  totalLevelIncome: number;
}

export const UserBalancesSchema = SchemaFactory.createForClass(UserBalances);

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email: string;

  @Prop({ required: true })
  passwordHash: string;

  @Prop({ required: true, unique: true, uppercase: true, trim: true })
  referralCode: string;

  @Prop({ type: Types.ObjectId, ref: User.name, default: null, index: true })
  referredBy?: Types.ObjectId | null;

  @Prop({ type: [ReferralAncestorSchema], default: [] })
  ancestors: ReferralAncestor[];

  @Prop({ type: UserBalancesSchema, default: () => ({}) })
  balances: UserBalances;
}

export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.index({ referredBy: 1, createdAt: -1 });
UserSchema.index({ 'ancestors.user': 1 });
