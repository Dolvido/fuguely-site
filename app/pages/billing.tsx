import { observer } from 'mobx-react';
import moment from 'moment';
import Head from 'next/head';

import * as React from 'react';
import { useState, useEffect } from 'react';

import { loadStripe } from '@stripe/stripe-js';
import Button from '@mui/material/Button';
import DoneIcon from '@mui/icons-material/Done';
import NProgress from 'nprogress';

import Layout from '../components/layout';
import notify from '../lib/notify';
import { Store } from '../lib/store';
import withAuth from '../lib/withAuth';
import { fetchCheckoutSessionApiMethod } from '../lib/api/studio-teacher';

const dev = process.env.NODE_ENV !== 'production';

const stripePromise = loadStripe(
  dev
    ? process.env.NEXT_PUBLIC_STRIPE_TEST_PUBLISHABLEKEY
    : process.env.NEXT_PUBLIC_STRIPE_LIVE_PUBLISHABLEKEY,
);

type Props = {
  store: Store;
  isMobile: boolean;
  firstGridItem: boolean;
  studioRequired: boolean;
  studioSlug: string;
  redirectMessage?: string;
};

function Billing({
  store,
  isMobile,
  firstGridItem,
  studioRequired,
  studioSlug,
  redirectMessage,
}: Props) {
  const [disabled, setDisabled] = useState<boolean>(false);
  const [showInvoices, setShowInvoices] = useState<boolean>(false);

  useEffect(() => {
    if (redirectMessage) {
      notify(redirectMessage);
    }
  }, []);

  const handleCheckoutClick = async (mode: 'subscription' | 'setup') => {
    try {
      const { currentStudio } = store;

      NProgress.start();
      setDisabled(true);

      const { sessionId } = await fetchCheckoutSessionApiMethod({ mode, studioId: currentStudio._id });

      // console.log(process.env.NEXT_PUBLIC_STRIPE_TEST_PUBLISHABLEKEY, sessionId);

      // When the customer clicks on the button, redirect them to Checkout.
      const stripe = await stripePromise;
      const { error } = await stripe.redirectToCheckout({ sessionId });

      if (error) {
        notify(error);
        console.error(error);
      }
    } catch (err) {
      notify(err);
      console.error(err);
    } finally {
      setDisabled(false);
      NProgress.done();
    }
  };

  const cancelSubscriptionOnClick = async () => {
    const { currentStudio } = store;

    NProgress.start();
    setDisabled(true);

    try {
      await currentStudio.cancelSubscription({ studioId: currentStudio._id });
      notify('Success!');
    } catch (err) {
      notify(err);
    } finally {
      setDisabled(false);
      NProgress.done();
    }
  };

  const renderCardInfo = () => {
    const { currentUser } = store;

    if (currentUser && currentUser.hasCardInformation) {
      return (
        <span>
          {' '}
          <DoneIcon color="action" style={{ verticalAlign: 'text-bottom' }} /> Your default payment
          method:
          <li>
            {currentUser.stripeCard.brand}, {currentUser.stripeCard.funding} card
          </li>
          <li>Last 4 digits: *{currentUser.stripeCard.last4}</li>
          <li>
            Expiration: {currentUser.stripeCard.exp_month}/{currentUser.stripeCard.exp_year}
          </li>
          <p />
          <Button
            variant="outlined"
            color="primary"
            onClick={() => handleCheckoutClick('setup')}
            disabled={disabled}
          >
            Update card
          </Button>
        </span>
      );
    } else {
      return 'You have not added a card.';
    }
  };

  const renderInvoices = () => {
    const { currentUser } = store;

    if (!showInvoices) {
      return null;
    }

    if (currentUser && currentUser.stripeCard) {
      return (
        <React.Fragment>
          {currentUser.stripeListOfInvoices.data.map((invoice, i) => (
            <React.Fragment key={i}>
              <p>Your history of payments:</p>
              <li>
                ${invoice.amount_paid / 100} was paid on{' '}
                {moment(invoice.created * 1000).format('MMM Do YYYY')} for Studio '{invoice.studioName}'
                -{' '}
                <a href={invoice.hosted_invoice_url} target="_blank" rel="noopener noreferrer">
                  See invoice
                </a>
              </li>
            </React.Fragment>
          ))}
        </React.Fragment>
      );
    } else {
      return 'You have no history of payments.';
    }
  };

  const showListOfInvoicesOnClick = async () => {
    const { currentUser } = store;

    NProgress.start();
    setDisabled(true);

    try {
      await currentUser.getListOfInvoices();
      setShowInvoices(true);
    } catch (err) {
      notify(err);
    } finally {
      setDisabled(false);
      NProgress.done();
    }
  };

  const renderSubscriptionButton = () => {
    const { currentStudio } = store;

    let subscriptionDate;
    let billingDay;
    if (currentStudio && currentStudio.stripeSubscription) {
      subscriptionDate = moment(currentStudio.stripeSubscription.billing_cycle_anchor * 1000).format(
        'MMM Do YYYY',
      );
      billingDay = moment(currentStudio.stripeSubscription.billing_cycle_anchor * 1000).format('Do');
    }

    if (currentStudio && !currentStudio.isSubscriptionActive && currentStudio.isPaymentFailed) {
      return (
        <>
          <p>You are not a paying customer.</p>
          <Button
            variant="contained"
            color="primary"
            onClick={() => handleCheckoutClick('subscription')}
            disabled={disabled}
          >
            Buy subscription
          </Button>
          <p />
          <p>
            Studio was automatically unsubscribed due to failed payment. You will be prompt to update
            card information if you choose to re-subscribe Studio.
          </p>
        </>
      );
    } else if (currentStudio && !currentStudio.isSubscriptionActive && !currentStudio.isPaymentFailed) {
      return (
        <React.Fragment>
          <p>You are not a paying customer.</p>
          <p>
            Buy subscription using your current card, see below section for current card
            information.
          </p>
          <Button
            variant="contained"
            color="primary"
            onClick={() => handleCheckoutClick('subscription')}
            disabled={disabled}
          >
            Buy subscription
          </Button>
        </React.Fragment>
      );
    } else {
      return (
        <React.Fragment>
          <span>
            {' '}
            <DoneIcon color="action" style={{ verticalAlign: 'text-bottom' }} /> Subscription is
            active.
            <p>
              You subscribed <b>{currentStudio.name}</b> on <b>{subscriptionDate}</b>.
            </p>
            <p>
              You will be billed $50 on <b>{billingDay} day</b> of each month unless you cancel
              subscription or subscription is cancelled automatically due to failed payment.
            </p>
          </span>
          <p />
          <Button
            variant="outlined"
            color="primary"
            onClick={cancelSubscriptionOnClick}
            disabled={disabled}
          >
            Unsubscribe Studio
          </Button>
          <br />
        </React.Fragment>
      );
    }
  };

  const { currentStudio, currentUser } = store;
  const isStudioTeacher = currentStudio && currentUser && currentUser._id === currentStudio.studioTeacherId;

  if (!currentStudio || currentStudio.slug !== studioSlug) {
    return (
      <Layout
        store={store}
        isMobile={isMobile}
        studioRequired={studioRequired}
        firstGridItem={firstGridItem}
      >
        <div style={{ padding: isMobile ? '0px' : '0px 30px' }}>
          <p>You did not select any studio.</p>
          <p>
            To access this page, please select existing studio or create new studio if you have no
            studios.
          </p>
        </div>
      </Layout>
    );
  }

  if (!isStudioTeacher) {
    return (
      <Layout
        store={store}
        isMobile={isMobile}
        studioRequired={studioRequired}
        firstGridItem={firstGridItem}
      >
        <div style={{ padding: isMobile ? '0px' : '0px 30px' }}>
          <p>Only the Studio Teacher can access this page.</p>
          <p>Create your own studio to become a Studio Teacher.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout
      store={store}
      isMobile={isMobile}
      studioRequired={studioRequired}
      firstGridItem={firstGridItem}
    >
      <Head>
        <title>Your Billing</title>
      </Head>
      <div style={{ padding: isMobile ? '0px' : '0px 30px' }}>
        <h3>Your Billing</h3>
        <p />
        <h4 style={{ marginTop: '40px' }}>Paid plan</h4>
        {renderSubscriptionButton()}
        <p />
        <br />
        <h4>Card information</h4>
        {renderCardInfo()}
        <p />
        <br />
        <h4>Payment history</h4>
        <Button
          variant="outlined"
          color="primary"
          onClick={showListOfInvoicesOnClick}
          disabled={disabled}
        >
          Show payment history
        </Button>
        <p />
        {renderInvoices()}
        <p />
        <br />
      </div>
    </Layout>
  );
}

export default withAuth(observer(Billing));
