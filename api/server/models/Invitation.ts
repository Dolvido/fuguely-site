import * as mongoose from 'mongoose';

import sendEmail from '../aws-ses';
import getEmailTemplate from './EmailTemplate';
import Studio from './Studio';
import User, { UserDocument } from './User';

const mongoSchema = new mongoose.Schema({
  studioId: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    required: true,
    default: Date.now,
    expires: 60 * 60 * 24, // delete doc after 24 hours
  },
  token: {
    type: String,
    required: true,
    unique: true,
  },
});

mongoSchema.index({ studioId: 1, email: 1 }, { unique: true });

interface InvitationDocument extends mongoose.Document {
  studioId: string;
  email: string;
  createdAt: Date;
  token: string;
}

interface InvitationModel extends mongoose.Model<InvitationDocument> {
  add({
    userId,
    studioId,
    email,
  }: {
    userId: string;
    studioId: string;
    email: string;
  }): InvitationDocument;

  getStudioInvitations({ userId, studioId }: { userId: string; studioId: string });
  getStudioByToken({ token }: { token: string });
  addUserToStudio({ token, user }: { token: string; user: UserDocument });
}

function generateToken() {
  const gen = () =>
    Math.random().toString(36).substring(2, 12) + Math.random().toString(36).substring(2, 12);

  return `${gen()}`;
}

class InvitationClass extends mongoose.Model {
  public static async add({ userId, studioId, email }) {
    if (!studioId || !email) {
      throw new Error('Bad data');
    }

    const studio = await Studio.findById(studioId).setOptions({ lean: true });
    if (!studio || studio.teacherId !== userId) {
      throw new Error('Studio does not exist or you have no permission');
    }

    const registeredUser = await User.findOne({ email }).setOptions({ lean: true });

    if (registeredUser && studio.memberIds.includes(registeredUser._id.toString())) {
      throw new Error('This user is already Studio Member.');
    }

    let token;
    const invitation = await this.findOne({ studioId, email })
      .select('token')
      .setOptions({ lean: true });

    if (invitation) {
      token = invitation.token;
    } else {
      token = generateToken();
      while ((await this.countDocuments({ token })) > 0) {
        token = generateToken();
      }

      await this.create({
        studioId,
        email,
        token,
      });
    }

    const dev = process.env.NODE_ENV !== 'production';

    const emailTemplate = await getEmailTemplate('invitation', {
      studioName: studio.name,
      invitationURL: `${
        dev ? process.env.URL_APP : process.env.PRODUCTION_URL_APP
      }/invitation?token=${token}`,
    });

    if (!emailTemplate) {
      throw new Error('Invitation email template not found');
    }

    try {
      await sendEmail({
        from: `Kelly from saas-app.async-await.com <${process.env.EMAIL_SUPPORT_FROM_ADDRESS}>`,
        to: [email],
        subject: emailTemplate.subject,
        body: emailTemplate.message,
      });
    } catch (err) {
      console.log('Email sending error:', err);
    }

    return await this.findOne({ studioId, email }).setOptions({ lean: true });
  }

  public static async getStudioInvitations({ userId, studioId }) {
    const studio = await Studio.findOne({ _id: studioId })
      .select('teacherId')
      .setOptions({ lean: true });

    if (userId !== studio.teacherId) {
      throw new Error('You have no permission.');
    }

    return this.find({ studioId }).select('email').setOptions({ lean: true });
  }

  public static async getStudioByToken({ token }) {
    if (!token) {
      throw new Error('Bad data');
    }

    const invitation = await this.findOne({ token }).setOptions({ lean: true });

    if (!invitation) {
      throw new Error('Invitation not found');
    }

    const studio = await Studio.findById(invitation.studioId)
      .select('name slug avatarUrl memberIds')
      .setOptions({ lean: true });

    if (!studio) {
      throw new Error('Studio does not exist');
    }

    return studio;
  }

  public static async addUserToStudio({ token, user }) {
    if (!token || !user) {
      throw new Error('Bad data');
    }

    const invitation = await this.findOne({ token }).setOptions({ lean: true });

    if (!invitation || invitation.email !== user.email) {
      throw new Error('Invitation not found');
    }

    await this.deleteOne({ token });

    const studio = await Studio.findById(invitation.studioId)
      .select('memberIds slug teacherId')
      .setOptions({ lean: true });

    if (!studio) {
      throw new Error('Studio does not exist');
    }

    if (studio && !studio.memberIds.includes(user._id)) {
      await Studio.updateOne({ _id: studio._id }, { $addToSet: { memberIds: user._id } });

      if (user._id !== studio.teacherId) {
        await User.findByIdAndUpdate(user._id, { $set: { defaultStudioSlug: studio.slug } });
      }
    }

    return studio.slug;
  }
}

mongoSchema.loadClass(InvitationClass);

const Invitation = mongoose.model<InvitationDocument, InvitationModel>('Invitation', mongoSchema);

export default Invitation;
