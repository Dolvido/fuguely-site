import { uniq } from 'lodash';
import * as mongoose from 'mongoose';

import { generateRandomSlug } from '../utils/slugify';
import Schedule from './Schedule';
import Studio from './Studio';

/* data model for lesson object
    should contain info about the lesson, including:
    schedule
    teacher
    student
    date and time
    location
    start and end time
    price
    status

*/
const mongoSchema = new mongoose.Schema({
  slug: {
    type: String,
    required: true,
    unique: true,
  },
  scheduleId: {
    type: String,
    required: true,
  },
  teacherId: {
    type: String,
    required: true,
  },
  studentId: {
    type: String,
    required: true,
  },
  day: {
    type: String,
    required: true,
  },
  startTime: {
    type: String,
    required: true,
  },
  duration: {
    type: String,
    required: true,
  },
  location: {
    type: String,
    required: true,
  },
  lessonRate: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    required: true,
    default: Date.now,
  },
});

/* interface for lesson data model */
export interface LessonDocument extends mongoose.Document {
  slug: string;

  scheduleId: string;
  teacherId: string;
  studentId: string;

  day: string;
  startTime: string;
  duration: string;

  location: string;
  lessonRate: number;

  status: string;
  createdAt: Date;
  updatedAt: Date;
}

/* interface for lesson model */
interface LessonModel extends mongoose.Model<LessonDocument> {
  addLesson({
    scheduleId,
    teacherId,
    studentId,
    day,
    startTime,
    duration,
    location,
  }: {
    scheduleId: string;
    teacherId: string;
    studentId: string;
    day: string;
    startTime: string;
    duration: string;
    location: string;
  }): Promise<LessonDocument>;

  rescheduleLesson({
    lessonId,
    day,
    startTime,
    duration,
  }: {
    lessonId: string;
    day: string;
    startTime: string;
    duration: string;
  }): Promise<LessonDocument>;

  getListOfLessonsOnSchedule({
    userId,
    scheduleId,
  }: {
    userId: string;
    scheduleId: string;
  }): Promise<LessonDocument[]>;

  deleteLesson({ userId, lessonId }: { userId: string; lessonId: string }): Promise<LessonDocument>;

  checkPermissionAndGetStudioAndSchedule({
    userId,
    scheduleId,
    lesson,
  }: {
    userId: string;
    scheduleId: string;
    lesson: LessonDocument;
  }): Promise<{ StudioDocument; ScheduleDocument }>;
}

class LessonClass extends mongoose.Model {
    /* add a lesson to a schedule
    * @param scheduleId: string - id of schedule to add lesson to
    * @param teacherId: string - id of teacher
    * @param studentId: string - id of student
    * @param day: string - day of lesson
    * @param startTime: string - start time of lesson
    * @param duration: string - duration of lesson
    * @param location: string - location of lesson
    * @returns {LessonDocument} - lesson object
    * @throws {Error} - if invalid input data
    * @throws {Error} - if schedule does not exist
    * @throws {Error} - if schedule does not belong to teacher
    * @throws {Error} - if schedule does not belong to student
    * @throws {Error} - if lesson already exists
    * @throws {Error} - if lesson cannot be added
    * @throws {Error} - if lesson cannot be saved
    */
    public static async addLesson({ scheduleId, teacherId, studentId, day, startTime, duration, location }) {
        // check input data
        if (!scheduleId || !teacherId || !studentId || !day || !startTime || !duration) {
            throw new Error('Invalid input data');
        }

        // check permissions
        await this.checkPermissionAndGetStudioAndSchedule({ userId: teacherId, scheduleId });

        
        

        // check if lesson already exists
        const lesson = await this.create({
            slug: generateRandomSlug(),
            scheduleId,
            teacherId,
            studentId,
            day,
            startTime,
            duration,
            location,
            lessonRate: 30,
        
        })


  /* check permissions of a user to access schedule and studio
   * @param userId: string - id of user to check permissions for
   * @param scheduleId: string - id of schedule to check permissions on
   * @param lesson: LessonDocument - lesson object
   * @returns { studio, schedule} - studio and schedule objects
   */
  private static async checkPermissionAndGetStudioAndSchedule({
    userId,
    scheduleId,
    lesson = null,
  }) {
    // check input data
    if (!userId || !scheduleId) {
      throw new Error('Invalid input data');
    }

    if (lesson && (lesson.teacherId !== userId || lesson.studentId !== userId)) {
      throw new Error('You do not have permission to modify this lesson');
    }

    const schedule = await Schedule.findById(scheduleId)
      .select('studioId teacherId studentIds slug')
      .setOptions({ lean: true });

    if (!schedule) {
      throw new Error('Schedule not found');
    }

    if (schedule.teacherId !== userId && !schedule.studentIds.includes(userId)) {
      throw new Error('You do not have permission to access this schedule');
    }

    const studio = await Studio.findById(schedule.studioId)
      .select('teacherId memberIds slug')
      .setOptions({ lean: true });

    if (!studio || !studio.memberIds.includes(userId) || studio.teacherId !== userId) {
      throw new Error('Studio not found');
    }

    return { studio, schedule };
  }
}
