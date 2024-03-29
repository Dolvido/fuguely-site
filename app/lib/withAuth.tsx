import { observer } from 'mobx-react';
import Router from 'next/router';
import React from 'react';

import * as NProgress from 'nprogress';

import * as gtag from './gtag';

import { Store, getStore } from './store';

Router.events.on('routeChangeStart', () => {
  NProgress.start();
});

Router.events.on('routeChangeComplete', (url) => {
  const store = getStore();
  if (store) {
    store.changeCurrentUrl(url);
  }

  if (window) {
    gtag.pageview(url);
    gtag.event({
      action: 'view_item',
      category: 'engagement',
      label: store.currentUser ? store.currentUser.email : 'no_email',
    });
  }

  NProgress.done();
});

Router.events.on('routeChangeError', () => NProgress.done());

export default function withAuth(Component, { loginRequired = true, logoutRequired = false } = {}) {
  class WithAuth extends React.Component<{ store: Store }> {
    public static async getInitialProps(ctx) {
      // console.log('WithAuth.getInitialProps');

      const { req } = ctx;

      let pageComponentProps = {};

      if (Component.getInitialProps) {
        pageComponentProps = await Component.getInitialProps(ctx);
      }

      return {
        ...pageComponentProps,
        isServer: !!req,
      };
    }

    public componentDidMount() {
      // console.log('WithAuth.componentDidMount');

      const { store } = this.props;
      const user = store.currentUser;

      if (loginRequired && !logoutRequired && !user) {
        Router.push('/login');
        return;
      }

      let redirectUrl = '/login';
      let asUrl = '/login';
      if (user) {
        if (!user.defaultStudioSlug) {
          redirectUrl = '/create-studio';
          asUrl = '/create-studio';
        } else {
          redirectUrl = `/your-settings?studioSlug=${user.defaultStudioSlug}`;
          asUrl = `/studios/${user.defaultStudioSlug}/your-settings`;
        }
      }

      if (logoutRequired && user) {
        Router.push(redirectUrl, asUrl);
      }
    }

    public render() {
      const { store } = this.props;
      const user = store.currentUser;

      if (loginRequired && !logoutRequired && !user) {
        return null;
      }

      if (logoutRequired && user) {
        return null;
      }

      return <Component {...this.props} />;
    }
  }

  return observer(WithAuth);
}
