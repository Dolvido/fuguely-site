import { uniq } from 'lodash';
import * as mongoose from 'mongoose';

import { generateRandomSlug } from '../utils/slugify';
import Studio, { StudioDocument } from './Studio';
import Post from './Post';

const mongoSchema = new mongoose.Schema({
  createdUserId: {
    type: String,
    required: true,
  },
  studioId: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  slug: {
    type: String,
    required: true,
  },
  memberIds: [
    {
      type: String,
    },
  ],
  createdAt: {
    type: Date,
    required: true,
    default: Date.now,
  },
  notificationType: {
    type: String,
    enum: ['default', 'email'],
    required: true,
    default: 'default',
  },
});

export interface DiscussionDocument extends mongoose.Document {
  createdUserId: string;
  studioId: string;
  name: string;
  slug: string;
  memberIds: string[];
  createdAt: Date;
  notificationType: string;
}

interface DiscussionModel extends mongoose.Model<DiscussionDocument> {
  getList({
    userId,
    studioId,
  }: {
    userId: string;
    studioId: string;
  }): Promise<{ discussions: DiscussionDocument[] }>;

  add({
    name,
    userId,
    studioId,
    memberIds,
    notificationType,
  }: {
    name: string;
    userId: string;
    studioId: string;
    memberIds: string[];
    notificationType: string;
  }): Promise<DiscussionDocument>;

  edit({
    userId,
    id,
    name,
    memberIds,
    notificationType,
  }: {
    userId: string;
    id: string;
    name: string;
    memberIds: string[];
    notificationType: string;
  }): Promise<DiscussionDocument>;

  delete({ userId, id }: { userId: string; id: string }): Promise<{ studioId: string }>;

  checkPermissionAndGetStudio({
    userId,
    studioId,
    memberIds,
  }: {
    userId: string;
    studioId: string;
    memberIds: string[];
  }): Promise<StudioDocument>;
}

class DiscussionClass extends mongoose.Model {
  public static async getList({ userId, studioId }) {
    await this.checkPermissionAndGetStudio({ userId, studioId });

    const filter: any = { studioId, memberIds: userId };

    const discussions: any[] = await this.find(filter).setOptions({ lean: true });

    return { discussions };
  }

  public static async add({ name, userId, studioId, memberIds = [], notificationType }) {
    if (!name) {
      throw new Error('Bad data');
    }

    await this.checkPermissionAndGetStudio({ userId, studioId, memberIds });

    const slug = await generateRandomSlug(this, { studioId });

    return this.create({
      createdUserId: userId,
      studioId,
      name,
      slug,
      memberIds: uniq([userId, ...memberIds]),
      createdAt: new Date(),
      notificationType,
    });
  }

  public static async edit({ userId, id, name, memberIds = [], notificationType }) {
    if (!id) {
      throw new Error('Bad data');
    }

    const discussion = await this.findById(id)
      .select('studioId createdUserId')
      .setOptions({ lean: true });

    const studio = await this.checkPermissionAndGetStudio({
      userId,
      studioId: discussion.studioId,
      memberIds,
    });

    if (discussion.createdUserId !== userId && studio.studioTeacherId !== userId) {
      throw new Error('Permission denied. Only author or studio teacher can edit Discussion.');
    }

    const updatedObj = await this.findOneAndUpdate(
      { _id: id },
      {
        name,
        memberIds: uniq([userId, ...memberIds]),
        notificationType,
      },
      { runValidators: true, new: true },
    );

    return updatedObj;
  }

  public static async delete({ userId, id }) {
    if (!id) {
      throw new Error('Bad data');
    }

    const discussion = await this.findById(id).select('studioId').setOptions({ lean: true });

    await this.checkPermissionAndGetStudio({ userId, studioId: discussion.studioId });

    await Post.deleteMany({ discussionId: id });

    await this.deleteOne({ _id: id });

    return { studioId: discussion.studioId };
  }

  private static async checkPermissionAndGetStudio({ userId, studioId, memberIds = [] }) {
    if (!userId || !studioId) {
      throw new Error('Bad data');
    }

    const studio = await Studio.findById(studioId)
      .select('memberIds studioTeacherId')
      .setOptions({ lean: true });

    if (!studio || studio.memberIds.indexOf(userId) === -1) {
      throw new Error('Studio not found');
    }

    for (const id of memberIds) {
      if (studio.memberIds.indexOf(id) === -1) {
        throw new Error('Permission denied');
      }
    }

    return studio;
  }
}

mongoSchema.loadClass(DiscussionClass);

const Discussion = mongoose.model<DiscussionDocument, DiscussionModel>('Discussion', mongoSchema);

export default Discussion;
