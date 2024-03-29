import createCache from '@emotion/cache';
import { CacheProvider } from '@emotion/react';
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider } from '@mui/material/styles';
import { Provider } from 'mobx-react';
import Head from 'next/head';
import React from 'react';

import { themeDark, themeLight } from '../lib/theme';
import { getUserApiMethod } from '../lib/api/public';
import { getInitialDataApiMethod } from '../lib/api/studio-member';
import { isMobile } from '../lib/isMobile';
import { getStore, initializeStore, Store } from '../lib/store';

import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment'

// import type { AppProps } from 'next/app';
import { NextPage, NextPageContext } from 'next';

// add types
type Props = {
  Component: NextPage;
  pageProps: any;
  initialState: any;
};

function MyApp({ Component, pageProps, initialState }: Props) {
  // console.log('initialState', initialState);

  const store: Store = initializeStore(initialState);

  // console.log('store.currentUser.email', store.currentUser);

  const isThemeDark = store.currentUser ? store.currentUser.darkTheme : true;

  const isServer = typeof window === 'undefined';

  return (
    <CacheProvider value={createCache({ key: 'css', prepend: true })}>
      <ThemeProvider theme={isThemeDark ? themeDark : themeLight}>
        <Head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <link rel="stylesheet" href={isServer ? '/fonts/server.css' : '/fonts/cdn.css'} />
          <link
            rel="stylesheet"
            href={
              isThemeDark
                ? 'https://storage.googleapis.com/async-await/nprogress-light-spinner.css'
                : 'https://storage.googleapis.com/async-await/nprogress-dark-spinner.css'
            }
          />
        </Head>
        <CssBaseline />
        <Provider store={store}>
          <Component {...pageProps} store={store} />
        </Provider>
      </ThemeProvider>
    </CacheProvider>
  );
}

MyApp.getInitialProps = async ({
  Component,
  ctx,
}: {
  Component: NextPage;
  ctx: NextPageContext;
}) => {
  // console.log('MyApp.getInitialProps');

  let firstGridItem = true;
  let studioRequired = false;

  if (
    ctx.pathname.includes('/login') ||
    ctx.pathname.includes('/create-studio') ||
    ctx.pathname.includes('/invitation')
  ) {
    firstGridItem = false;
  }

  if (
    ctx.pathname.includes('/your-settings') ||
    ctx.pathname.includes('/studio-settings') ||
    ctx.pathname.includes('/discussion') ||
    ctx.pathname.includes('/billing') ||
    ctx.pathname.includes('/schedule')
  ) {
    studioRequired = true;
  }

  const { studioSlug, discussionSlug, scheduleSlug, redirectMessage } = ctx.query;

  const pageProps = {
    isMobile: isMobile({ req: ctx.req }),
    firstGridItem,
    studioRequired,
    studioSlug,
    discussionSlug,
    scheduleSlug,
    redirectMessage,
  };

  if (Component.getInitialProps) {
    Object.assign(pageProps, await Component.getInitialProps(ctx));
  }

  const appProps = { pageProps };

  // console.log('before getStore');

  const store = getStore();
  if (store) {
    return appProps;
  }

  let userObj = null;
  try {
    const { user } = await getUserApiMethod(ctx.req);
    userObj = user;
  } catch (error) {
    console.log(error);
  }

  let initialData;

  if (userObj) {
    try {
      initialData = await getInitialDataApiMethod({
        request: ctx.req,
        data: { studioSlug, discussionSlug, scheduleSlug },
      });
    } catch (error) {
      console.error(error);
    }
  }

  // console.log(initialData);

  let selectedStudioSlug = '';

  if (studioSlug) {
    selectedStudioSlug = studioSlug as string;
  } else {
    selectedStudioSlug = userObj && userObj.defaultStudioSlug;
  }

  const studio =
    initialData &&
    initialData.studios &&
    initialData.studios.find((t) => t.slug === selectedStudioSlug);

  // console.log('userObj', userObj);

  return {
    ...appProps,
    initialState: { user: userObj, currentUrl: ctx.asPath, studio, studioSlug, ...initialData },
  };
};

export default MyApp;
