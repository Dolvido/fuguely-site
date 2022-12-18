import { action, configure, IObservableArray, observable, makeObservable } from 'mobx';
import { enableStaticRendering } from 'mobx-react';
import { io, Socket } from 'socket.io-client';

import { addStudioApiMethod, getStudioInvitationsApiMethod } from '../api/studio-teacher';
import { getStudioMembersApiMethod } from '../api/studio-member';
//import { getStudioScheduleApiMethod } from '../api/studio-member';

import { User } from './user';
import { Studio } from './studio';

const dev = process.env.NODE_ENV !== 'production';

enableStaticRendering(typeof window === 'undefined');

configure({ enforceActions: 'observed' });

class Store {
  public isServer: boolean;

  public currentUser?: User = null;
  public currentUrl = '';

  public currentStudio?: Studio = null;

  public studios: IObservableArray<Studio> = observable([]);

  public socket: Socket;

  constructor({
    initialState = {},
    isServer,
    socket = null,
  }: {
    initialState?: any;
    isServer: boolean;
    socket?: Socket;
  }) {
    makeObservable(this, {
      currentUser: observable,
      currentUrl: observable,
      currentStudio: observable,

      changeCurrentUrl: action,
      setCurrentUser: action,
      setCurrentStudio: action,
    });

    this.isServer = !!isServer;

    // console.log('initialState.user', initialState.user);

    this.setCurrentUser(initialState.user);

    this.currentUrl = initialState.currentUrl || '';

    // console.log(initialState);

    this.setCurrentStudio(initialState.studio);

    if (initialState.studios && initialState.studios.length > 0) {
      this.setInitialStudiosStoreMethod(initialState.studios);
    }

    this.socket = socket;

    if (socket) {
      socket.on('disconnect', () => {
        console.log('socket: ## disconnected');
      });

      socket.on('reconnect', (attemptNumber) => {
        console.log('socket: $$ reconnected', attemptNumber);
      });
    }
  }

  public changeCurrentUrl(url: string) {
    this.currentUrl = url;
  }

  public async setCurrentUser(user) {
    if (user) {
      this.currentUser = new User({ store: this, ...user });
    } else {
      this.currentUser = null;
    }
  }

  /* store method to add a new studio */
  public async addStudio({
    name,
    avatarUrl,
  }: {
    name: string;
    avatarUrl: string;
  }): Promise<Studio> {
    const data = await addStudioApiMethod({ name, avatarUrl });
    const studio = new Studio({ store: this, ...data });
    //const schedule = new Schedule({ store: this, ...data });

    return studio;
  }

  public async setCurrentStudio(studio) {
    if (this.currentStudio) {
      if (this.currentStudio.slug === studio.slug) {
        return;
      }
    }

    if (studio) {
      this.currentStudio = new Studio({ ...studio, store: this });

      const users =
        studio.initialMembers || (await getStudioMembersApiMethod(this.currentStudio._id)).users;

      const invitations =
        studio.initialInvitations ||
        (await getStudioInvitationsApiMethod(this.currentStudio._id)).invitations;

      this.currentStudio.setInitialMembersAndInvitations(users, invitations);

      //this.currentStudio.setInitialSchedule();

      //const schedule =
      //  studio.initialSchedule || (await getStudioScheduleApiMethod(this.currentStudio._id));

      //this.currentStudio.setInitialSchedule(users, schedule);
    } else {
      this.currentStudio = null;
    }
  }

  private setInitialStudiosStoreMethod(studios: any[]) {
    // console.log(initialStudios);

    const studioObjs = studios.map((t) => new Studio({ store: this, ...t }));

    this.studios.replace(studioObjs);
  }
}

let store: Store = null;

function initializeStore(initialState = {}) {
  const isServer = typeof window === 'undefined';

  const socket = isServer
    ? null
    : io(dev ? process.env.NEXT_PUBLIC_URL_API : process.env.NEXT_PUBLIC_PRODUCTION_URL_API, {
        reconnection: true,
        autoConnect: true,
        transports: ['polling', 'websocket'],
        withCredentials: true,
      });

  const _store =
    store !== null && store !== undefined ? store : new Store({ initialState, isServer, socket });

  // For SSG and SSR always create a new store
  if (typeof window === 'undefined') {
    return _store;
  }
  // Create the store once in the client
  if (!store) {
    store = _store;
  }

  // console.log(_store);

  return _store;
}

function getStore() {
  return store;
}

export { Store, initializeStore, getStore };
