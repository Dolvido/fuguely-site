import { action, IObservableArray, makeObservable, observable, runInAction, computed } from 'mobx';

//import { editDiscussionApiMethod } from '../api/team-member';
import { Store } from './index';
import { Studio } from './studio';
import {
  //createScheduleApiMethod,
  updateScheduleMembersApiMethod,
  updateScheduleAvailabilityApiMethod,
} from '../api/studio-teacher';

/* data store class for schedule object */
class Schedule {
  public _id: string;
  public studioId: string;
  public teacherId: string;
  public studentIds: IObservableArray<string> = observable([]);
  public slug: string;
  public lessons: IObservableArray<string> = observable([]);
  public availability: {
    object: Date;
    TimeRanges: {
      object: Date;
      TimeRanges: [
        {
          start: Date;
          end: Date;
        },
      ];
    };
  };

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
    this.availability = data.availability;
  }

  get students() {
    return this.studentIds.map((id) => this.studio.members.get(id)).filter((u) => !!u);
  }
}

export { Schedule };
