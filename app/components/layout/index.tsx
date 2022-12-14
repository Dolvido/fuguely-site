import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import LensIcon from '@mui/icons-material/Lens';

import Link from 'next/link';
import React from 'react';

import MenuWithLinks from '../common/MenuWithLinks';
import Confirmer from '../common/Confirmer';
import Notifier from '../common/Notifier';

import { Store } from '../../lib/store';
import DiscussionList from '../discussions/DiscussionList';

const dev = process.env.NODE_ENV !== 'production';

const styleGrid = {
  width: '100%',
  height: '100vh',
  maxWidth: '100%',
  padding: '0px 10px',
  display: 'flex',
  overflow: 'hidden',
};

const styleGridIsMobile = {
  width: '100%',
  height: '100vh',
  maxWidth: '100%',
  padding: '0px 0px 0px 10px',
  display: 'flex',
  overflow: 'hidden',
};

function LayoutWrapper({
  children,
  isMobile,
  firstGridItem,
  store,
}: {
  children: React.ReactNode;
  isMobile: boolean;
  firstGridItem: boolean;
  store: Store;
}) {
  const isThemeDark = store.currentUser ? store.currentUser.darkTheme : true;

  return (
    <React.Fragment>
      <Grid
        container
        direction="row"
        justifyContent="flex-start"
        alignItems="stretch"
        style={isMobile ? styleGridIsMobile : styleGrid}
      >
        {firstGridItem ? (
          <Grid
            item
            sm={2}
            xs={12}
            style={{
              borderRight: '1px #707070 solid',
              justifyContent: 'center',
              overflow: 'hidden',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <svg
                width="124mm"
                height="40mm"
                version="1.1"
                viewBox="0 0 123.84 40"
                style={{
                  marginTop: '20px',
                  display: 'inline-flex',
                  height: '40px',
                }}
                xmlns="http://www.w3.org/2000/svg"
              >
                <g transform="translate(-7.8007e-8 -257)">
                  <rect x=".15648" y="257.16" width="123.69" height="39.687" fillOpacity="0" />
                </g>
                <g transform="translate(-7.8007e-8 -257)">
                  <g>
                    <path
                      d="m39.868 277a19.868 19.868 0 0 1-19.868 19.868 19.868 19.868 0 0 1-19.868-19.868 19.868 19.868 0 0 1 19.868-19.868 19.868 19.868 0 0 1 19.868 19.868z"
                      stroke="#000"
                      strokeLinejoin="round"
                      strokeWidth=".26326"
                    />
                    <g transform="scale(1.0545 .94834)" fill="#fffffd" aria-label="f">
                      <path
                        d="m15.685 308.17v-19.895h-3.4223v-3.0137h3.4223v-2.4518q0-2.273 0.43418-3.4223 0.56188-1.5068 1.9666-2.4263 1.4047-0.94497 3.9331-0.94497 1.6856 0 3.6522 0.38309l-0.58742 3.3712q-1.2259-0.20431-2.2986-0.20431-1.7622 0-2.5029 0.76619-0.74065 0.74065-0.74065 2.8094v2.1198h4.495v3.0137h-4.495v19.895z"
                        fill="#fffffd"
                        strokeWidth="1.3076"
                      />
                    </g>
                  </g>
                </g>
                <g transform="translate(-7.8007e-8 -257)">
                  <g
                    transform="scale(1.0564 .94661)"
                    strokeWidth=".48373"
                    fill={isThemeDark ? 'white' : 'black'}
                    aria-label="fuguely-text"
                  >
                    <path d="m48.504 283.26v1.4455h-1.6628q-0.93534 0-1.3038 0.37792-0.35902 0.37791-0.35902 1.3605v0.93533h2.8627v1.351h-2.8627v9.2306h-1.7479v-9.2306h-1.6628v-1.351h1.6628v-0.73693q0-1.7668 0.82196-2.5698 0.82196-0.81252 2.6076-0.81252z" />
                    <path d="m49.77 293.79v-6.4056h1.7384v6.3395q0 1.5022 0.58577 2.258 0.58577 0.74638 1.7573 0.74638 1.4077 0 2.2202-0.89755 0.82196-0.89754 0.82196-2.447v-5.9994h1.7384v10.582h-1.7384v-1.625q-0.63301 0.96368-1.4739 1.4361-0.83141 0.46295-1.9368 0.46295-1.8234 0-2.7682-1.1338-0.94478-1.1337-0.94478-3.3162zm4.3744-6.6607z" />
                    <path d="m69.195 292.55q0-1.8896-0.78417-2.9288-0.77472-1.0393-2.1825-1.0393-1.3983 0-2.1825 1.0393-0.77472 1.0393-0.77472 2.9288 0 1.8801 0.77472 2.9194 0.78417 1.0393 2.1825 1.0393 1.4077 0 2.1825-1.0393 0.78417-1.0393 0.78417-2.9194zm1.7384 4.1004q0 2.7021-1.1999 4.0153-1.1999 1.3227-3.6752 1.3227-0.91644 0-1.729-0.14171-0.81252-0.13227-1.5778-0.41571v-1.6912q0.76528 0.4157 1.5117 0.61411 0.74638 0.1984 1.5211 0.1984 1.7101 0 2.5604-0.89755 0.85031-0.88809 0.85031-2.6926v-0.85976q-0.53853 0.93534-1.3794 1.3983-0.84086 0.46295-2.0124 0.46295-1.9463 0-3.1367-1.4833-1.1904-1.4833-1.1904-3.9303 0-2.4564 1.1904-3.9398 1.1904-1.4833 3.1367-1.4833 1.1715 0 2.0124 0.46295 0.84086 0.46294 1.3794 1.3983v-1.6061h1.7384z" />
                    <path d="m74.335 293.79v-6.4056h1.7384v6.3395q0 1.5022 0.58577 2.258 0.58577 0.74638 1.7573 0.74638 1.4077 0 2.2202-0.89755 0.82196-0.89754 0.82196-2.447v-5.9994h1.7384v10.582h-1.7384v-1.625q-0.63301 0.96368-1.4739 1.4361-0.83141 0.46295-1.9368 0.46295-1.8234 0-2.7682-1.1338-0.94479-1.1337-0.94479-3.3162zm4.3744-6.6607z" />
                    <path d="m95.848 292.24v0.85031h-7.9929q0.11337 1.7951 1.0771 2.7399 0.97313 0.93534 2.7021 0.93534 1.0015 0 1.9368-0.24564 0.94478-0.24565 1.8707-0.73693v1.6439q-0.93534 0.39681-1.9179 0.60466-0.98258 0.20786-1.9935 0.20786-2.532 0-4.0153-1.4739-1.4739-1.4739-1.4739-3.987 0-2.5982 1.3983-4.1193 1.4077-1.5306 3.7886-1.5306 2.1352 0 3.3729 1.3794 1.2471 1.3699 1.2471 3.7319zm-1.7384-0.51018q-0.0189-1.4266-0.80307-2.2769-0.77472-0.8503-2.0596-0.8503-1.455 0-2.3336 0.82196-0.8692 0.82196-1.0015 2.3147z" />
                    <path d="m98.701 283.26h1.7384v14.701h-1.7384z" />
                    <path d="m108.47 298.94q-0.73693 1.8896-1.4361 2.4659-0.69915 0.57631-1.8707 0.57631h-1.3888v-1.455h1.0204q0.71804 0 1.1148-0.34013 0.39681-0.34012 0.87865-1.6061l0.31178-0.79362-4.2799-10.412h1.8423l3.3068 8.2763 3.3068-8.2763h1.8423z" />
                  </g>
                </g>
              </svg>
              <MenuWithLinks
                options={[
                  {
                    text: 'Your Settings',
                    href: `/your-settings?teamSlug=${store.currentTeam.slug}`,
                    as: `/teams/${store.currentTeam.slug}/your-settings`,
                    highlighterSlug: '/your-settings',
                  },
                  {
                    text: 'Team Settings',
                    href: `/team-settings?teamSlug=${store.currentTeam.slug}`,
                    as: `/teams/${store.currentTeam.slug}/team-settings`,
                    highlighterSlug: '/team-settings',
                  },
                  {
                    text: 'Billing',
                    href: `/billing?teamSlug=${store.currentTeam.slug}`,
                    as: `/teams/${store.currentTeam.slug}/billing`,
                    highlighterSlug: '/billing',
                  },
                  {
                    separator: true,
                  },
                  {
                    text: 'Log out',
                    href: `${
                      dev
                        ? process.env.NEXT_PUBLIC_URL_API
                        : process.env.NEXT_PUBLIC_PRODUCTION_URL_API
                    }/logout`,
                    as: `${
                      dev
                        ? process.env.NEXT_PUBLIC_URL_API
                        : process.env.NEXT_PUBLIC_PRODUCTION_URL_API
                    }/logout`,
                    externalServer: true,
                  },
                ]}
              >
                <Avatar
                  src={store.currentUser.avatarUrl}
                  alt="Add username here later in the book"
                  style={{
                    margin: '20px auto',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    width: '40px',
                    height: '40px',
                  }}
                />

                <ArrowDropDownIcon color="action" style={{ verticalAlign: 'super' }} />
              </MenuWithLinks>
            </div>
            <hr />
            <p />
            <p />
            <DiscussionList store={store} team={store.currentTeam} isMobile={isMobile} />
          </Grid>
        ) : null}

        {children}
      </Grid>
      <Notifier />
      <Confirmer />
    </React.Fragment>
  );
}

type Props = {
  children: React.ReactNode;
  store?: Store;
  isMobile?: boolean;
  firstGridItem?: boolean;
  teamRequired?: boolean;
};

class Layout extends React.Component<Props> {
  public render() {
    const { children, isMobile, firstGridItem, store, teamRequired } = this.props;

    const { currentUser, currentTeam } = store;

    // console.log(this.props.store.currentUser.darkTheme);

    // const isThemeDark = false;

    // console.log(isMobile);

    // console.log(store, currentUser, currentTeam);

    if (!currentUser) {
      return (
        <LayoutWrapper firstGridItem={firstGridItem} isMobile={isMobile} store={store}>
          <Grid item sm={12} xs={12}>
            {children}
          </Grid>
        </LayoutWrapper>
      );
    }

    if (!currentTeam) {
      if (teamRequired) {
        return (
          <LayoutWrapper firstGridItem={firstGridItem} isMobile={isMobile} store={store}>
            <Grid
              item
              sm={10}
              xs={12}
              style={{ padding: '0px 35px', overflow: 'auto', height: 'auto' }}
            >
              <div style={{ padding: '20px' }}>
                Select existing team or create a new team.
                <p />
                <Link href="/create-team" as="/create-team">
                  <Button variant="contained" color="primary">
                    Create new team
                  </Button>
                </Link>
              </div>
            </Grid>
          </LayoutWrapper>
        );
      } else {
        // console.log('team not required');
        return (
          <LayoutWrapper firstGridItem={firstGridItem} isMobile={isMobile} store={store}>
            <Grid
              item
              sm={10}
              xs={12}
              style={{ padding: '0px 35px', overflow: 'auto', height: 'auto' }}
            >
              {children}
            </Grid>
          </LayoutWrapper>
        );
      }
    }

    return (
      <LayoutWrapper firstGridItem={firstGridItem} isMobile={isMobile} store={store}>
        <Grid
          item
          sm={firstGridItem ? 10 : 12}
          xs={12}
          style={{ padding: '0px 35px', overflowY: 'auto', height: 'inherit' }}
        >
          <div>
            {isMobile || store.currentUrl.includes('create-team') ? null : (
              <React.Fragment>
                <LensIcon
                  style={{
                    margin: '15px 0px 10px 25px',
                    opacity: 0.8,
                    fontSize: '18px',
                    cursor: 'pointer',
                  }}
                  onClick={async () => {
                    await store.currentUser.toggleTheme(!store.currentUser.darkTheme);
                  }}
                />
                <h4
                  style={{
                    margin: '15px 0px 10px 30px',
                    fontWeight: 300,
                  }}
                >
                  Current team: <b>{store.currentTeam.name}</b>
                </h4>
              </React.Fragment>
            )}
            <div style={{ clear: 'both' }} />
          </div>
          {children}
        </Grid>
      </LayoutWrapper>
    );
  }
}

export default Layout;
