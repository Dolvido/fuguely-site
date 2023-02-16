import { action, computed, IObservableArray, observable, runInAction, makeObservable } from 'mobx';
import Router from 'next/router';
import {
  cancelSubscriptionApiMethod,
  createScheduleApiMethod,
  inviteMemberApiMethod,
  removeMemberApiMethod,
  updateStudioApiMethod,
  addAvailabilityWindowApiMethod,
  updateAvailabilityApiMethod,
} from '../api/studio-teacher';
import {
  addDiscussionApiMethod,
  deleteDiscussionApiMethod,
  getDiscussionListApiMethod,
  getStudioScheduleApiMethod,
} from '../api/studio-member';
import { Store } from './index';
import { User } from './user';
import { Invitation } from './invitation';
import { Discussion } from './discussion';
import { Schedule } from './schedule';

class Studio {
  public store: Store;

  public _id: string;
  public teacherId: string;

  public name: string;
  public slug: string;
  public avatarUrl: string;
  public memberIds: IObservableArray<string> = observable([]);
  public members: Map<string, User> = new Map();
  public invitations: Map<string, Invitation> = new Map();

  // store variables for schedule data store
  public schedule: Schedule;
  public scheduleId: string;

  // store variables for discussion data store
  public currentDiscussion?: Discussion;
  public currentDiscussionSlug?: string;
  public discussions: IObservableArray<Discussion> = observable([]);
  public isLoadingDiscussions = false;

  public stripeSubscription: {
    id: string;
    object: string;
    application_fee_percent: number;
    billing: string;
    cancel_at_period_end: boolean;
    billing_cycle_anchor: number;
    canceled_at: number;
    created: number;
  };
  public isSubscriptionActive: boolean;
  public isPaymentFailed: boolean;

  constructor(params) {
    makeObservable(this, {
      name: observable,
      slug: observable,
      avatarUrl: observable,
      memberIds: observable,
      members: observable,
      invitations: observable,
      currentDiscussion: observable,
      currentDiscussionSlug: observable,
      isLoadingDiscussions: observable,
      discussions: observable,

      schedule: observable,
      scheduleId: observable,
      addAvailabilityWindow: action,

      setInitialMembersAndInvitations: action,
      updateTheme: action,
      inviteMember: action,
      removeMember: action,
      setInitialSchedule: action,
      setInitialDiscussions: action,
      loadDiscussions: action,
      addScheduleToLocalCache: action,
      addDiscussion: action,
      addDiscussionToLocalCache: action,
      deleteDiscussion: action,
      deleteDiscussionFromLocalCache: action,
      getDiscussionBySlug: action,

      orderedDiscussions: computed,
    });

    this._id = params._id;
    this.teacherId = params.teacherId;
    this.slug = params.slug;
    this.name = params.name;
    this.avatarUrl = params.avatarUrl;
    this.memberIds.replace(params.memberIds || []);
    this.currentDiscussionSlug = params.currentDiscussionSlug || null;

    this.stripeSubscription = params.stripeSubscription;
    this.isSubscriptionActive = params.isSubscriptionActive;
    this.isPaymentFailed = params.isPaymentFailed;

    this.store = params.store;

    if (params.initialDiscussions) {
      this.setInitialDiscussions(params.initialDiscussions);
    } else {
      this.loadDiscussions();
    }
  }

  public setInitialMembersAndInvitations(users, invitations) {
    this.members.clear();
    this.invitations.clear();

    for (const user of users) {
      if (this.store.currentUser && this.store.currentUser._id === user._id) {
        this.members.set(user._id, this.store.currentUser);
      } else {
        this.members.set(user._id, new User(user));
      }
    }

    for (const invitation of invitations) {
      this.invitations.set(invitation._id, new Invitation(invitation));
    }

    // console.log(this.members);
  }

  public async setInitialSchedule() {
    const { schedule } = await getStudioScheduleApiMethod({
      studioId: this._id,
      teacherId: this.teacherId,
    });
    const availability = (schedule.availability || []).map((entry) => ({
      dayOfWeek: entry.dayOfWeek,
      startTime: entry.startTime,
      endTime: entry.endTime,
    }));

    //console.log('Store availability ', availability);

    this.schedule = new Schedule({
      studio: this,
      store: this.store,
      ...schedule,
      availability: availability,
    });
    this.scheduleId = this.schedule._id;
    //console.log('Store setInitialSchedule: schedule', this.schedule);
    //console.log('Store setInitialSchedule: availability', this.schedule.availability);
  }

  public get businessHours(): any[] {
    if (!this.schedule) {
      return [];
    }
    console.log('studio store: businessHours');
    return this.schedule.businessHours;
  }

  public async updateTheme({ name, avatarUrl }: { name: string; avatarUrl: string }) {
    try {
      const { slug } = await updateStudioApiMethod({
        studioId: this._id,
        name,
        avatarUrl,
      });

      runInAction(() => {
        this.name = name;
        this.avatarUrl = avatarUrl;
        this.slug = slug;
      });
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  /* Store method for teacher to invite a new student to the studio */
  public async inviteMember(email: string) {
    try {
      const { newInvitation } = await inviteMemberApiMethod({ studioId: this._id, email });

      runInAction(() => {
        this.invitations.set(newInvitation._id, new Invitation(newInvitation));
      });
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  /* Store method for teacher to remove a student from the studio */
  public async removeMember(userId: string) {
    try {
      await removeMemberApiMethod({ studioId: this._id, userId });

      runInAction(() => {
        this.members.delete(userId);
        this.memberIds.remove(userId);
      });
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  public setCurrentDiscussion({ slug }: { slug: string }) {
    this.currentDiscussionSlug = slug;
    for (const discussion of this.discussions) {
      if (discussion && discussion.slug === slug) {
        this.currentDiscussion = discussion;
        break;
      }
    }
  }

  public setInitialDiscussions(discussions) {
    const discussionObjs = discussions.map(
      (d) => new Discussion({ studio: this, store: this.store, ...d }),
    );

    this.discussions.replace(discussionObjs);

    if (!this.currentDiscussionSlug && this.discussions.length > 0) {
      this.currentDiscussionSlug = this.orderedDiscussions[0].slug;
    }

    if (this.currentDiscussionSlug) {
      this.setCurrentDiscussion({ slug: this.currentDiscussionSlug });
    }
  }

  public async loadDiscussions() {
    if (this.store.isServer || this.isLoadingDiscussions) {
      return;
    }

    this.isLoadingDiscussions = true;

    try {
      const { discussions = [] } = await getDiscussionListApiMethod({
        studioId: this._id,
      });
      const newList: Discussion[] = [];

      runInAction(() => {
        discussions.forEach((d) => {
          const disObj = this.discussions.find((obj) => obj._id === d._id);
          if (disObj) {
            disObj.changeLocalCache(d);
            newList.push(disObj);
          } else {
            newList.push(new Discussion({ studio: this, store: this.store, ...d }));
          }
        });

        this.discussions.replace(newList);
      });
    } finally {
      runInAction(() => {
        this.isLoadingDiscussions = false;
      });
    }
  }

  public changeLocalCache(data) {
    this.name = data.name;
    this.memberIds.replace(data.memberIds || []);
  }

  public async addDiscussion(data): Promise<Discussion> {
    const { discussion } = await addDiscussionApiMethod({
      studioId: this._id,
      socketId: (this.store.socket && this.store.socket.id) || null,
      ...data,
    });

    return new Promise<Discussion>((resolve) => {
      runInAction(() => {
        const obj = this.addDiscussionToLocalCache(discussion);
        resolve(obj);
      });
    });
  }

  public async updateAvailability(data): Promise<Schedule> {
    const { schedule } = await updateAvailabilityApiMethod({
      studioId: this._id,
      teacherId: this.teacherId,
      ...data,
    });

    return new Promise<Schedule>((resolve) => {
      runInAction(() => {
        const obj = this.addScheduleToLocalCache(schedule);
        resolve(obj);
      });
    });
  }

  /* store method for adding a new availability window to a schedule */
  public async addAvailabilityWindow(data): Promise<Schedule> {
    console.log(data);
    const { schedule } = await addAvailabilityWindowApiMethod({
      studioId: this._id,
      teacherId: this.teacherId,
      ...data,
    });

    return new Promise<Schedule>((resolve) => {
      runInAction(() => {
        const obj = this.addScheduleToLocalCache(schedule);
        resolve(obj);
      });
    });
  }

  public addScheduleToLocalCache(data): Schedule {
    const obj = new Schedule({ studio: this, store: this.store, ...data });

    if (obj.teacherId === this.store.currentUser._id) {
      this.schedule = obj;
    }

    return obj;
  }

  public addDiscussionToLocalCache(data): Discussion {
    const obj = new Discussion({ studio: this, store: this.store, ...data });

    if (obj.memberIds.includes(this.store.currentUser._id)) {
      this.discussions.push(obj);
    }

    return obj;
  }

  public async deleteDiscussion(id: string) {
    await deleteDiscussionApiMethod({
      id,
      socketId: (this.store.socket && this.store.socket.id) || null,
    });

    runInAction(() => {
      this.deleteDiscussionFromLocalCache(id);

      const discussion = this.discussions.find((d) => d._id === id);

      if (this.currentDiscussion === discussion) {
        this.currentDiscussion = null;
        this.currentDiscussionSlug = null;

        if (this.discussions.length > 0) {
          const d = this.discussions[0];

          Router.push(
            `/discussion?studioSlug=${this.slug}&discussionSlug=${d.slug}`,
            `/studios/${this.slug}/discussions/${d.slug}`,
          );
        } else {
          Router.push(`/discussion?studioSlug=${this.slug}`, `/studios/${this.slug}/discussions`);
        }
      }
    });
  }

  public deleteDiscussionFromLocalCache(discussionId: string) {
    const discussion = this.discussions.find((item) => item._id === discussionId);
    this.discussions.remove(discussion);
  }

  public getDiscussionBySlug(slug: string): Discussion {
    return this.discussions.find((d) => d.slug === slug);
  }

  public async cancelSubscription({ studioId }: { studioId: string }) {
    try {
      const { isSubscriptionActive } = await cancelSubscriptionApiMethod({ studioId });

      runInAction(() => {
        this.isSubscriptionActive = isSubscriptionActive;
      });
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  public async checkIfStudioTeacherMustBeCustomer() {
    let ifStudioTeacherMustBeCustomerOnClient: boolean;

    if (this && this.memberIds.length < 2) {
      ifStudioTeacherMustBeCustomerOnClient = false;
    } else if (this && this.memberIds.length >= 2 && this.isSubscriptionActive) {
      ifStudioTeacherMustBeCustomerOnClient = false;
    } else if (this && this.memberIds.length >= 2 && !this.isSubscriptionActive) {
      ifStudioTeacherMustBeCustomerOnClient = true;
    }

    return ifStudioTeacherMustBeCustomerOnClient;
  }

  get orderedDiscussions() {
    return this.discussions.slice().sort();
  }
}

export { Studio };
