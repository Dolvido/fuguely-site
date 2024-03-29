import * as mongoose from 'mongoose';
import Stripe from 'stripe';

import { cancelSubscription } from '../stripe';
import { generateRandomSlug } from '../utils/slugify';
import User from './User';
import Schedule from './Schedule';
import { ScheduleDocument } from './Schedule';

const mongoSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  slug: {
    type: String,
    required: true,
    unique: true,
  },
  avatarUrl: String,
  createdAt: {
    type: Date,
    required: true,
  },
  teacherId: {
    type: String,
    required: true,
  },
  memberIds: [
    {
      type: String,
      required: true,
    },
  ],
  defaultStudio: {
    type: Boolean,
    default: false,
  },
  stripeSubscription: {
    id: String,
    object: String,
    application_fee_percent: Number,
    billing: String,
    cancel_at_period_end: Boolean,
    billing_cycle_anchor: Number,
    canceled_at: Number,
    created: Number,
  },
  isSubscriptionActive: {
    type: Boolean,
    default: false,
  },
  isPaymentFailed: {
    type: Boolean,
    default: false,
  },
});

export interface StudioDocument extends mongoose.Document {
  name: string;
  slug: string;
  avatarUrl: string;
  createdAt: Date;

  teacherId: string;
  memberIds: string[];
  defaultStudio: boolean;

  stripeSubscription: {
    id: string;
    object: string;
    application_fee_percent: number;
    billing: string;
    cancel_at_period_end: boolean;
    billing_cycle_anchor: number;
    canceled_at: number;
    created: number;
  };
  isSubscriptionActive: boolean;
  isPaymentFailed: boolean;
}

interface StudioModel extends mongoose.Model<StudioDocument> {
  addStudio({
    name,
    userId,
  }: {
    userId: string;
    name: string;
    avatarUrl: string;
  }): Promise<StudioDocument>;

  updateStudio({
    userId,
    studioId,
    name,
    avatarUrl,
  }: {
    userId: string;
    studioId: string;
    name: string;
    avatarUrl: string;
  }): Promise<StudioDocument>;

  getAllStudiosForUser(userId: string): Promise<StudioDocument[]>;

  createStudioSchedule({
    studioId,
    teacherId,
  }: {
    studioId: string;
    teacherId: string;
  }): Promise<ScheduleDocument>;

  removeMember({
    studioId,
    teacherId,
    userId,
  }: {
    studioId: string;
    teacherId: string;
    userId: string;
  }): Promise<void>;

  subscribeStudio({
    session,
    studio,
  }: {
    session: Stripe.Checkout.Session;
    studio: StudioDocument;
  }): Promise<void>;

  cancelSubscription({
    teacherId,
    studioId,
  }: {
    teacherId: string;
    studioId: string;
  }): Promise<StudioDocument>;

  cancelSubscriptionAfterFailedPayment({
    subscriptionId,
  }: {
    subscriptionId: string;
  }): Promise<StudioDocument>;
}

class StudioClass extends mongoose.Model {
  public static async addStudio({ userId, name, avatarUrl }) {
    console.log(`Static method: ${name}, ${avatarUrl}`);

    if (!userId || !name || !avatarUrl) {
      throw new Error('Bad data');
    }

    const slug = await generateRandomSlug(this);

    let defaultStudio = false;
    if ((await this.countDocuments({ teacherId: userId })) === 0) {
      await User.findByIdAndUpdate(userId, { $set: { defaultStudioSlug: slug } });
      defaultStudio = true;
    }

    const studio = await this.create({
      teacherId: userId,
      name,
      slug,
      avatarUrl,
      memberIds: [userId],
      createdAt: new Date(),
      defaultStudio,
    });

    //console.log('Studio created, attempting to create schedule');
    //await Schedule.create({ studioId: studio._id, teacherId: userId });

    return studio;
  }

  public static async updateStudio({ userId, studioId, name, avatarUrl }) {
    const studio = await this.findById(studioId, 'name teacherId');

    if (!studio) {
      throw new Error('Studio not found');
    }

    if (studio.teacherId !== userId) {
      throw new Error('Permission denied');
    }

    const modifier = { name: studio.name, avatarUrl };

    if (name !== studio.name) {
      modifier.name = name;
    }

    await this.updateOne({ _id: studioId }, { $set: modifier }, { runValidators: true });

    return this.findById(studioId, 'name avatarUrl slug defaultStudio').setOptions({ lean: true });
  }

  public static getAllStudiosForUser(userId: string) {
    return this.find({ memberIds: userId }).setOptions({ lean: true });
  }

  /* create studio schedule method */
  public static async createStudioSchedule({ userId, studioId }) {
    const studio = await this.findById(studioId, 'name teacherId');

    if (!studio) {
      throw new Error('Studio not found');
    }

    if (studio.teacherId !== userId) {
      throw new Error('Permission denied');
    }

    const sched = await Schedule.create({ studioId: studio._id, teacherId: userId });

    return sched;
  }

  public static async removeMember({ studioId, teacherId, userId }) {
    const studio = await this.findById(studioId).select('memberIds teacherId');

    if (!studio) {
      throw new Error('Studio does not exist');
    }

    if (studio.teacherId !== teacherId || teacherId === userId) {
      throw new Error('Permission denied');
    }

    await this.findByIdAndUpdate(studioId, { $pull: { memberIds: userId } });
  }

  public static async subscribeStudio({
    session,
    studio,
  }: {
    session: Stripe.Checkout.Session;
    studio: StudioDocument;
  }) {
    if (!session.subscription) {
      throw new Error('Not subscribed');
    }

    if (!studio) {
      throw new Error('User not found.');
    }

    if (studio.isSubscriptionActive) {
      throw new Error('Studio is already subscribed.');
    }

    const stripeSubscription = session.subscription as Stripe.Subscription;
    if (stripeSubscription.canceled_at) {
      throw new Error('Unsubscribed');
    }

    await this.updateOne({ _id: studio._id }, { stripeSubscription, isSubscriptionActive: true });
  }

  public static async cancelSubscription({ teacherId, studioId }) {
    const studio = await this.findById(studioId).select(
      'teacherId isSubscriptionActive stripeSubscription',
    );

    if (studio.teacherId !== teacherId) {
      throw new Error('You do not have permission to subscribe Studio.');
    }

    if (!studio.isSubscriptionActive) {
      throw new Error('Studio is already unsubscribed.');
    }

    const cancelledSubscriptionObj = await cancelSubscription({
      subscriptionId: studio.stripeSubscription.id,
    });

    return this.findByIdAndUpdate(
      studioId,
      {
        stripeSubscription: cancelledSubscriptionObj,
        isSubscriptionActive: false,
      },
      { new: true, runValidators: true },
    )
      .select('isSubscriptionActive stripeSubscription')
      .setOptions({ lean: true });
  }

  public static async cancelSubscriptionAfterFailedPayment({ subscriptionId }) {
    const studio: any = await this.find({ 'stripeSubscription.id': subscriptionId })
      .select('teacherId isSubscriptionActive stripeSubscription isPaymentFailed')
      .setOptions({ lean: true });
    if (!studio.isSubscriptionActive) {
      throw new Error('Studio is already unsubscribed.');
    }
    if (studio.isPaymentFailed) {
      throw new Error('Studio is already unsubscribed after failed payment.');
    }
    const cancelledSubscriptionObj = await cancelSubscription({
      subscriptionId,
    });
    return this.findByIdAndUpdate(
      studio._id,
      {
        stripeSubscription: cancelledSubscriptionObj,
        isSubscriptionActive: false,
        isPaymentFailed: true,
      },
      { new: true, runValidators: true },
    )
      .select('isSubscriptionActive stripeSubscription isPaymentFailed')
      .setOptions({ lean: true });
  }
}

mongoSchema.loadClass(StudioClass);

const Studio = mongoose.model<StudioDocument, StudioModel>('Studio', mongoSchema);

export default Studio;
