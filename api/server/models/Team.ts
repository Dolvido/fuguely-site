import * as mongoose from 'mongoose';

import { generateNumberSlug } from '../utils/slugify';
import User from './User';

// create mongo schema for teams data
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
  teamLeaderId: {
    type: String,
    required: true,
  },
  memberIds: [
    {
      type: String,
      required: true,
    },
  ],
  defaultTeam: {
    type: Boolean,
    default: false,
  },
}); // end mongoSchema definition

// mongoose TeamDocument interface
export interface TeamDocument extends mongoose.Document {
  name: string;
  slug: string;
  avatarUrl: string;
  createdAt: Date;

  teamLeaderId: string;
  memberIds: string[];
  defaultTeam: boolean;
} // end TeamDocument interface

// team model interface
interface TeamModel extends mongoose.Model<TeamDocument> {
  addTeam({
    name,
    userId,
  }: {
    userId: string;
    name: string;
    avatarUrl: string;
  }): Promise<TeamDocument>;
  updateTeam({
    userId,
    teamId,
    name,
    avatarUrl,
  }: {
    userId: string;
    teamId: string;
    name: string;
    avatarUrl: string;
  }): Promise<TeamDocument>;
  getAllTeamsForUser(userId: string): Promise<TeamDocument[]>;
  removeMember({
    teamId,
    teamLeaderId,
    userId,
  }: {
    teamId: string;
    teamLeaderId: string;
    userId: string;
  }): Promise<void>;
}

// team class
class TeamClass extends mongoose.Model {
  // addTeam method
  // userId = team leader's user id
  // name = team name
  // avatarUrl = team avatar url
  public static async addTeam({ userId, name, avatarUrl }) {
    console.log(`Static method: ${name}, ${avatarUrl}`);

    if (!userId || !name || !avatarUrl) {
      throw new Error('Bad data');
    }

    const slug = await generateNumberSlug(this);

    let defaultTeam = false;
    if ((await this.countDocuments({ teamLeaderId: userId })) === 0) {
      await User.findByIdAndUpdate(userId, { $set: { defaultTeamSlug: slug } });
      defaultTeam = true;
    }

    const team = await this.create({
      teamLeaderId: userId,
      name,
      slug,
      avatarUrl,
      memberIds: [userId],
      createdAt: new Date(),
      defaultTeam,
    });

    return team;
  } // end addTeam

  // update team
  // userId = team leader's user id
  // teamId = team id to be updated
  // name = new team name
  // avatarUrl = new team avatar url
  public static async updateTeam({ userId, teamId, name, avatarUrl }) {
    // first search the teams collection for the team
    const team = await this.findById(teamId, 'slug name defaultTeam teamLeaderId');

    if (!team) {
      throw new Error('Team not found');
    }

    // check if the user is the team leader (has permission to make these changes)
    if (team.teamLeaderId !== userId) {
      throw new Error('Permission denied');
    }

    const modifier = { name: team.name, avatarUrl };

    // check if there is an existing team document with the same name,
    // if there is, save the new name to the modifier object
    if (name !== team.name) {
      modifier.name = name;
    }

    // mongoose API updateOne
    await this.updateOne({ _id: teamId }, { $set: modifier }, { runValidators: true });

    if (team.defaultTeam) {
      await User.findByIdAndUpdate(userId, { $set: { defaultTeamSlug: modifier.slug } });
    }

    return this.findById(teamId, 'name avatarUrl slug defaultTeam').setOptions({ lean: true });
  } // end updateTeam

  // get all teams for a user
  // userId = user id of a team leader or team member
  public static getAllTeamsForUser(userId: string) {
    return this.find({ memberIds: userId }).setOptions({ lean: true });
  }

  // remove a member from a team
  // teamId = team id of the team to remove the member from
  // teamLeaderId = team leader's user id who is removing the member
  // userId = user id of the member to be removed
  public static async removeMember({ teamId, teamLeaderId, userId }) {
    // first search teams collection by id and check if the team leader is a creator of this team document
    const team = await this.findById(teamId).select('memberIds teamLeaderId');

    // also prevent a team leader from removing themselves from the team
    if (team.teamLeaderId !== teamLeaderId || teamLeaderId === userId) {
      throw new Error('Permission denied');
    }

    // return an updated Team document with updated memberIds array
    await this.findByIdAndUpdate(teamId, { $pull: { memberIds: userId } });
  }
} // end class TeamClass

mongoSchema.loadClass(TeamClass);

const Team = mongoose.model<TeamDocument, TeamModel>('Team', mongoSchema);

export default Team;
