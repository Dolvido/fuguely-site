import Avatar from '@mui/material/Avatar';
import { observer } from 'mobx-react';
import Error from 'next/error';
import Head from 'next/head';
import Router from 'next/router';
import { NextPageContext } from 'next';

import React from 'react';
import { useEffect } from 'react';

import LoginButton from '../components/common/LoginButton';
import Layout from '../components/layout';
import { getStudioByTokenApiMethod } from '../lib/api/public';
import { Studio } from '../lib/store/studio';
import { Store } from '../lib/store';
import withAuth from '../lib/withAuth';

const dev = process.env.NODE_ENV !== 'production';

type Props = {
  store: Store;
  isMobile: boolean;
  firstGridItem: boolean;
  studioRequired: boolean;
  studio: Studio;
  token: string;
};

function InvitationPageComp({
  store,
  isMobile,
  firstGridItem,
  studioRequired,
  studio,
  token,
}: Props) {
  useEffect(() => {
    const user = store.currentUser;

    if (user && studio) {
      Router.push(
        `${
          dev ? process.env.NEXT_PUBLIC_URL_API : process.env.NEXT_PUBLIC_PRODUCTION_URL_API
        }/logout?invitationToken=${token}`,
        `${
          dev ? process.env.NEXT_PUBLIC_URL_API : process.env.NEXT_PUBLIC_PRODUCTION_URL_API
        }/logout`,
      );
    }
  }, []);

  if (!studio) {
    return <Error statusCode={404} />;
  }

  const user = store.currentUser;

  if (user) {
    return null;
  }

  return (
    <Layout
      store={store}
      isMobile={isMobile}
      studioRequired={studioRequired}
      firstGridItem={firstGridItem}
    >
      <Head>
        <title>Invitation to {studio.name}</title>
        <meta name="description" content={`Invitation to join ${studio.name}`} />
      </Head>
      <div style={{ textAlign: 'center', margin: '0 20px' }}>
        <br />
        <Avatar
          src={`${
            studio.avatarUrl || 'https://storage.googleapis.com/async-await/default-user.png?v=1'
          }`}
          alt="Studio logo"
          style={{
            verticalAlign: 'middle',
            display: 'inline-flex',
          }}
        />{' '}
        <h2>{studio.name}</h2>
        <p>
          Join <b>{studio.name}</b> by logging in or signing up.
        </p>
        <br />
        <LoginButton invitationToken={token} />
      </div>
    </Layout>
  );
}

InvitationPageComp.getInitialProps = async (ctx: NextPageContext) => {
  const { token } = ctx.query;

  if (!token) {
    return {};
  }

  try {
    const { studio } = await getStudioByTokenApiMethod(token as string, ctx.req);

    return { studio, token };
  } catch (error) {
    console.log(error);
    return {};
  }
};

export default withAuth(observer(InvitationPageComp), { loginRequired: false });
