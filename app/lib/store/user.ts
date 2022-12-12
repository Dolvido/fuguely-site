import { action, decorate, observable, runInAction } from 'mobx';

import * as NProgress from 'nprogress';

import { toggleThemeApiMethod, updateProfileApiMethod } from '../api/team-member';
import { Store } from './index';

class User {
  public store: Store;

  public _id: string;
  public slug: string;
  public email: string | null;
  public displayName: string | null;
  public avatarUrl: string | null;
  public isSignedupViaGoogle: boolean;

  public darkTheme = false;
  public defaultTeamSlug: string;

  constructor(params) {
    this.store = params.store;
    this._id = params._id;
    this.slug = params.slug;
    this.email = params.email;
    this.displayName = params.displayName;
    this.avatarUrl = params.avatarUrl;
    this.isSignedupViaGoogle = !!params.isSignedupViaGoogle;
    this.darkTheme = !!params.darkTheme;
    this.defaultTeamSlug = params.defaultTeamSlug;
  }

  public async updateProfile({ name, avatarUrl }: { name: string; avatarUrl: string }) {
    const { updatedUser } = await updateProfileApiMethod({
      name,
      avatarUrl,
    });

    runInAction(() => {
      this.displayName = updatedUser.displayName;
      this.avatarUrl = updatedUser.avatarUrl;
      this.slug = updatedUser.slug;
    });
  }

  // add store method for toggling theme
  public async toggleTheme(darkTheme: boolean) {
    await toggleThemeApiMethod({ darkTheme });
    runInAction(() => {
      this.darkTheme = darkTheme;
    });
    // mobx and mobx-react do not reactively re-render ThemeProvider from Material-UI when the value for theme changes
    // so we need to reload the page to get the new theme
    NProgress.start();
    NProgress.set(0.5);
    window.location.reload();
  }
}

decorate(User, {
  slug: observable,
  email: observable,
  displayName: observable,
  avatarUrl: observable,
  // darkTheme: observable,
  defaultTeamSlug: observable,

  updateProfile: action,
  toggleTheme: action,
});

export { User };
