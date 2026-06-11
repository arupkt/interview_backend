import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email: email.toLowerCase() }).exec();
  }

  async findById(id: string | Types.ObjectId): Promise<UserDocument | null> {
    return this.userModel.findById(id).exec();
  }

  async findByReferralCode(code: string): Promise<UserDocument | null> {
    return this.userModel
      .findOne({ referralCode: code.trim().toUpperCase() })
      .exec();
  }

  async create(input: {
    name: string;
    email: string;
    passwordHash: string;
    referralCode?: string;
  }): Promise<UserDocument> {
    const existing = await this.findByEmail(input.email);
    if (existing) {
      throw new ConflictException('Email is already registered');
    }

    const referrer = input.referralCode
      ? await this.findByReferralCode(input.referralCode)
      : null;

    if (input.referralCode && !referrer) {
      throw new NotFoundException('Referral code not found');
    }

    const ancestors = referrer
      ? [
          { user: referrer._id, level: 1 },
          ...referrer.ancestors.map((ancestor) => ({
            user: ancestor.user,
            level: ancestor.level + 1,
          })),
        ].slice(0, 10)
      : [];

    try {
      return await this.userModel.create({
        name: input.name,
        email: input.email.toLowerCase(),
        passwordHash: input.passwordHash,
        referralCode: await this.generateReferralCode(input.name),
        referredBy: referrer?._id ?? null,
        ancestors,
      });
    } catch (error) {
      if (this.isDuplicateKeyError(error)) {
        throw new ConflictException('Email or referral code already exists');
      }
      throw error;
    }
  }

  async incrementBalances(
    userId: Types.ObjectId,
    increments: Partial<User['balances']>,
  ): Promise<void> {
    await this.userModel
      .updateOne(
        { _id: userId },
        {
          $inc: Object.fromEntries(
            Object.entries(increments).map(([key, value]) => [
              `balances.${key}`,
              value,
            ]),
          ),
        },
      )
      .exec();
  }

  private async generateReferralCode(name: string): Promise<string> {
    const prefix = name
      .replace(/[^a-zA-Z0-9]/g, '')
      .slice(0, 4)
      .toUpperCase()
      .padEnd(4, 'X');

    for (let attempt = 0; attempt < 5; attempt += 1) {
      const code = `${prefix}${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
      const existing = await this.findByReferralCode(code);
      if (!existing) {
        return code;
      }
    }

    return new Types.ObjectId().toHexString().slice(-10).toUpperCase();
  }

  private isDuplicateKeyError(error: unknown): boolean {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === 11000
    );
  }
}
