import { uniq } from 'lodash';
import * as mongoose from 'mongoose';

import { generateRandomSlug } from '../utils/slugify';
import Studio, { StudioDocument } from './Studio';
//import Lesson from './Lesson';

/* data model for schedule object 
    A schedule is a store of both the teacher's availability and the current lessons
    that they have scheduled. A teacher can specify windows of time that they are available
    from which students can book lessons. A teacher can also specify the lessons that they
    have already scheduled.
    studio
    teacher
    lessons

*/
const mongoSchema = new mongoose.Schema({
  studioId: {
    type: String,
    required: true,
  },
  teacherId: {
    type: String,
    required: true,
  },
  studentIds: [String],
  slug: {
    type: String,
    unique: true,
    required: true,
  },
  lessons: [String],
  availability: [
    {
      dayOfWeek: { type: String, default: '' },
      startTime: { type: String, default: '' },
      endTime: { type: String, default: '' },
    },
  ],
});

/* schedule document interface */
export interface ScheduleDocument extends mongoose.Document {
  studioId: string;
  teacherId: string;
  studentIds: string[];
  slug: string;
  lessons: string[];
  availability: {
    dayOfWeek: string;
    startTime: string;
    endTime: string;
    //duration: number;
    frequency: string;
    //booked: { start: Date; end: Date }[];
  }[];
}

interface ScheduleModel extends mongoose.Model<ScheduleDocument> {
  /* get a schedule for a teacher's studio
   */
  getSchedule({
    userId,
    studioId,
  }: {
    userId: string;
    studioId: string;
  }): Promise<ScheduleDocument>;

  /*
   * Create a new schedule for a teacher
   */
  createSchedule({
    studioId,
    teacherId,
  }: {
    studioId: string;
    teacherId: string;
  }): Promise<ScheduleDocument>;

  /*
   * Update teacher's available times for lessons
   */
  updateAvailability({
    studioId,
    teacherId,
    timeRanges,
  }: {
    studioId: string;
    teacherId: string;
    timeRanges: any;
    
  }): Promise<ScheduleDocument>;

  /* add availability window */
  addAvailabilityWindow({
    studioId,
    teacherId,
    availability,
  }: {
    studioId: string;
    teacherId: string;
    availability: any;
  }): Promise<ScheduleDocument>;

  /*
   * Update schedule's students
   * students are added to the schedule when a lesson is booked
   * and will have permission to view the teacher's schedule, request
   * rescheduling, and cancel lessons
   * students are removed from the schedule when a lesson is cancelled
   * but will still remain a student of the teacher's studio.
   */
  updateStudents({
    userId,
    scheduleId,
    studentIds,
  }: {
    userId: string;
    scheduleId: string;
    studentIds: string[];
  }): Promise<ScheduleDocument>;

  checkPermissionAndGetStudio({
    userId,
    studioId,
    studioMemberIds,
  }: {
    userId: string;
    studioId: string;
    studioMemberIds: string[];
  }): Promise<StudioDocument>;
}

class ScheduleClass extends mongoose.Model<ScheduleDocument> {
  /* get a schedule for a teacher's studio
   * @param userId - the user id of the user requesting the schedule
   * @param studioId - the studio id of the studio the schedule belongs to
   */
  public static async getSchedule({ userId, studioId }) {
    if (!this.checkPermissionAndGetStudio({ userId, studioId })) {
      throw new Error('User does not have permission to view schedule');
    }

    const schedule = await this.findOne({ studioId })
      .select('teacherId studioId studentIds slug lessons availability')
      .setOptions({ lean: true });

    return { schedule };
  }
  /*
   * Create a new schedule for a teacher
   * @param studioId - the studio id of the studio the teacher belongs to
   * @param teacherId - the user id of the teacher
   */
  public static async createSchedule({ studioId, teacherId }) {
    console.log('creating schedule');
    await this.checkPermissionAndGetStudio({ userId: teacherId, studioId });

    const slug = await generateRandomSlug(this, { studioId });

    return this.create({
      studioId,
      teacherId: teacherId,
      studentIds: [],
      slug,
      lessons: [],
      availability: {},
    });
  }

  /*
   * Update teacher's available times for lessons
   * @param teacherId - the user id of the teacher
   * @param TimeRanges - the time ranges that the teacher is available
   * @param TimeRanges.start - the start time of the time range
   * @param TimeRanges.end - the end time of the time range
   * @param TimeRanges.day - the day of the time range
   */
  public static async updateAvailability({ studioId, teacherId, timeRanges }) {
    console.log('updating availability', timeRanges);
    if (!studioId || !teacherId) {
      throw new Error('Invalid teacherId');
    }

    const schedule = await this.findOne({ studioId })
      .select('teacherId studioId studentIds slug lessons availability')
      .setOptions({ lean: true });

    if (!schedule) {
      throw new Error('Schedule not found');
    }

    await this.checkPermissionAndGetStudio({
      userId: teacherId,
      studioId: schedule.studioId,
    });

    if (schedule.teacherId !== teacherId) {
      throw new Error('User does not have permission to update schedule');
    }

    // Get the days of the week in the new availability object
    const days = timeRanges.map((range) => range.dayOfWeek);

    // Remove the availability windows for the days that are not in the new availability object
    const updatedAvailability = schedule.availability.filter((window) =>
      days.includes(window.dayOfWeek),
    );

    // Update the availability windows with the new time ranges
    timeRanges.forEach((range) => {
      const index = updatedAvailability.findIndex((window) => window.dayOfWeek === range.dayOfWeek);
      if (index === -1) {
        // The day was not found, so add a new availability window
        updatedAvailability.push({
          dayOfWeek: range.dayOfWeek,
          startTime: range.startTime,
          endTime: range.endTime,
          duration: range.duration,
          frequency: range.frequency,
        });
      } else {
        // Update the start and end times of the existing availability window
        updatedAvailability[index].startTime = range.startTime;
        updatedAvailability[index].endTime = range.endTime;
        updatedAvailability[index].duration = range.duration;
        updatedAvailability[index].frequency = range.frequency;
      }
    });

    console.log('updatedAvailability', updatedAvailability);

    // Save the updated schedule
    const updatedSchedule = await this.findOneAndUpdate(
      studioId,
      { availability: updatedAvailability },
      { new: true },
    );

    return updatedSchedule;
  }

  /*
   * Add an availability window to the schedule
   * @param scheduleId - the schedule id of the schedule to update
   * @param teacherId - the user id of the teacher
   * @param availability - the availability window to add [{ dayOfWeek, startTime, endTime, duration, frequency }]
   */
  public static async addAvailabilityWindow({ studioId, teacherId, availability }) {
    if (!studioId || !teacherId) {
      throw new Error('Invalid studio or user');
    }

    // find the teacher's schedule
    const schedule = await this.findOne({ studioId, teacherId });

    if (!schedule) {
      throw new Error('Schedule not found');
    }

    // add the new availability window to the schedule
    const updatedSchedule = await this.findOneAndUpdate(
      { _id: schedule._id },
      { $push: { availability: availability } },
      { new: true },
    );

    // save the updated schedule
    return updatedSchedule;
  }

  /*
   * update students who have permission to view the schedule
   * and request rescheduling/cancel lessons
   * @param userId - the user id of the user requesting access
   * @param scheduleId - the schedule id of the schedule to update
   * @param studentIds - the student ids of the users to add to the schedule
   */
  public static async updateStudents({ userId, scheduleId, studentIds = [] }) {
    if (!userId || !scheduleId) {
      throw new Error('Invalid schedule or user');
    }

    const schedule = await this.findById(scheduleId)
      .select('teacherId studentIds studioId')
      .setOptions({ lean: true });

    if (!schedule) {
      throw new Error('Schedule not found');
    }

    const studio = await this.checkPermissionAndGetStudio({
      userId,
      studioId: schedule.studioId,
      studioMemberIds: [schedule.teacherId, ...studentIds],
    });

    if (schedule.teacherId !== studio.teacherId) {
      throw new Error('Permission to update schedule denied');
    }

    const updatedStudentIds = await this.findOneAndUpdate(
      { _id: scheduleId },
      { studentIds: uniq([...schedule.studentIds, ...studentIds]) },
      { runValidators: true, new: true },
    );
    return updatedStudentIds;
  }

  /*
   * private method to check if a user has permission to access a schedule
   * and return the schedule if they do
   *
   * @param userId - the user id of the user requesting access
   * @param studioId - the studio id of the studio that the schedule belongs to
   * @param studentIds - the student ids of the users that have permission to access the schedule
   */
  private static async checkPermissionAndGetStudio({ userId, studioId, studioMemberIds = [] }) {
    if (!userId || !studioId) {
      throw new Error('Invalid studio or user');
    }

    const studio = await Studio.findById(studioId)
      .select('memberIds teacherId')
      .setOptions({ lean: true });

    if (!studio) {
      throw new Error('Studio not found');
    }

    if (studio.memberIds.indexOf(userId) === -1) {
      throw new Error('Studio not found for this user');
    }

    for (const id of studioMemberIds) {
      if (studio.memberIds.indexOf(id) === -1) {
        throw new Error('Permission to access this schedule denied');
      }
    }
    console.log('schedule permissions validated');
    return studio;
  }
}

mongoSchema.loadClass(ScheduleClass);

const Schedule = mongoose.model<ScheduleDocument, ScheduleModel>('Schedule', mongoSchema);

export default Schedule;
