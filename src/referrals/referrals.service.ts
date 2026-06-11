import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument } from '../users/schemas/user.schema';

export interface ReferralNode {
  id: string;
  name: string;
  email: string;
  referralCode: string;
  level: number;
  children: ReferralNode[];
}

@Injectable()
export class ReferralsService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async getTree(userId: string, maxDepth = 10): Promise<ReferralNode[]> {
    const users = await this.userModel
      .find({ 'ancestors.user': new Types.ObjectId(userId) })
      .select('name email referralCode referredBy ancestors')
      .sort({ createdAt: 1 })
      .lean()
      .exec();

    const childrenByParent = new Map<string, ReferralNode[]>();

    for (const user of users) {
      const ancestor = user.ancestors.find(
        (item) => String(item.user) === userId,
      );
      if (!ancestor || ancestor.level > maxDepth) {
        continue;
      }

      const parentId = user.referredBy ? String(user.referredBy) : userId;
      const node: ReferralNode = {
        id: String(user._id),
        name: user.name,
        email: user.email,
        referralCode: user.referralCode,
        level: ancestor.level,
        children: [],
      };

      const siblings = childrenByParent.get(parentId) ?? [];
      siblings.push(node);
      childrenByParent.set(parentId, siblings);
    }

    const attachChildren = (nodes: ReferralNode[]): ReferralNode[] =>
      nodes.map((node) => ({
        ...node,
        children: attachChildren(childrenByParent.get(node.id) ?? []),
      }));

    return attachChildren(childrenByParent.get(userId) ?? []);
  }
}
