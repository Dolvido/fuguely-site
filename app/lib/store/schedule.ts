import { action, IObservableArray, makeObservable, observable, runInAction, computed, toJS } from 'mobx';

//import { editDiscussionApiMethod } from '../api/team-member';
import { Store } from './index';
import { Studio } from './studio';
import {
  //createScheduleApiMethod,
  updateScheduleMembersApiMethod,
  updateScheduleAvailabilityApiMethod,
} from '../api/studio-teacher';

interface availabilityEntry {
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  entryId: string;
}

/* data store class for schedule object */
class Schedule {
  public _id: string;
  public studioId: string;
  public teacherId: string;
  public studentIds: IObservableArray<string> = observable([]);
  public slug: string;
  public lessons: IObservableArray<string> = observable([]);
  public availability: IObservableArray<availabilityEntry> = observable([]);
  public store: Store;
  public studio: Studio;

  constructor(params) {
    makeObservable(this, {
      slug: observable,
      studentIds: observable,
      teacherId: observable,
      studioId: observable,
      lessons: observable,
      availability: observable,

      editScheduleAvailability: action,
      editScheduleMembers: action,

      changeLocalCache: action,

      students: computed,
      businessHours: computed,
    });

    this._id = params._id;
    this.studioId = params.studioId;
    this.teacherId = params.teacherId;
    this.studentIds.replace(params.studentIds || []);

    this.slug = params.slug;
    this.lessons = params.lessons;
    this.availability = params.availability;

    this.store = params.store;
    this.studio = params.studio;
  }

  public async editScheduleAvailability(data) {
    try {
      await updateScheduleAvailabilityApiMethod({
        id: this._id,
        ...data,
      });

      runInAction(() => {
        this.changeLocalCache(data);
      });
    } catch (error) {
      console.error(error);
    }
  }

  public async editScheduleMembers(data) {
    try {
      await updateScheduleMembersApiMethod({
        id: this._id,
        ...data,
      });

      runInAction(() => {
        this.changeLocalCache(data);
      });
    } catch (error) {
      console.error(error);
    }
  }

  public changeLocalCache(data) {
    this.studentIds.replace(data.studentIds || []);
    this.lessons.replace(data.lessons || []);
    this.availability.replace(data.availability?.map((entry) => ({
      day: entry.dayOfWeek,
      startTime: entry.startTime,
      endTime: entry.endTime,
      entryId: entry._id,
    })) ?? []);
  }

  get students() {
    return this.studentIds.map((id) => this.studio.members.get(id)).filter((u) => !!u);
  }

  // helper method for getting fullCalendar ready business hours
  get businessHours() {
    const businessHours = [];
  
    const daysOfWeekMap = {
      Sunday: 0,
      Monday: 1,
      Tuesday: 2,
      Wednesday: 3,
      Thursday: 4,
      Friday: 5,
      Saturday: 6,
    };
    const avails = toJS(this.availability);

    for (const entry of avails) {
      console.log('for loop entry', entry);
      const dayOfWeek = daysOfWeekMap[entry.dayOfWeek];
      const startTime = entry.startTime;
      const endTime = entry.endTime;
  
      if (dayOfWeek !== undefined && startTime && endTime) {
        businessHours.push({
          daysOfWeek: [dayOfWeek],
          startTime: startTime,
          endTime: endTime,
          backgroundColor: '#00a65a',
        });
      }
    }
    console.log('schedule store get businessHours', businessHours);
    return businessHours;
  }
}



export { Schedule };
