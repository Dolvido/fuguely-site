import * as dotenv from 'dotenv';
import * as express from 'express';
import Stripe from 'stripe';

import Studio from './models/Studio';
import User from './models/User';

import logger from './logger';

dotenv.config();

const dev = process.env.NODE_ENV !== 'production';

const stripeInstance = new Stripe(
  dev ? process.env.STRIPE_TEST_SECRETKEY : process.env.STRIPE_LIVE_SECRETKEY,
  { apiVersion: '2020-08-27' },
);

function createSession({
  userId,
  studioId,
  studioSlug,
  customerId,
  subscriptionId,
  userEmail,
  mode,
}: {
  userId: string;
  studioId: string;
  studioSlug: string;
  customerId: string;
  subscriptionId: string;
  userEmail: string;
  mode: Stripe.Checkout.SessionCreateParams.Mode;
}) {
  const params: Stripe.Checkout.SessionCreateParams = {
    customer_email: customerId ? undefined : userEmail,
    customer: customerId,
    payment_method_types: ['card'],
    mode,
    success_url: `${
      dev ? process.env.URL_API : process.env.PRODUCTION_URL_API
    }/stripe/checkout-completed/{CHECKOUT_SESSION_ID}`,
    cancel_url: `${
      dev ? process.env.URL_APP : process.env.PRODUCTION_URL_APP
    }/studios/${studioSlug}/billing?redirectMessage=Checkout%20canceled`,
    metadata: { userId, studioId },
  };

  console.log(process.env.STRIPE_TEST_SECRETKEY, process.env.STRIPE_TEST_PRICEID);

  if (mode === 'subscription') {
    params.line_items = [
      {
        price: dev ? process.env.STRIPE_TEST_PRICEID : process.env.STRIPE_LIVE_PRICEID,
        quantity: 1,
      },
    ];
  } else if (mode === 'setup') {
    if (!customerId || !subscriptionId) {
      throw new Error('customerId and subscriptionId required');
    }

    params.setup_intent_data = {
      metadata: { customer_id: customerId, subscription_id: subscriptionId },
    };
  }

  return stripeInstance.checkout.sessions.create(params);
}

function retrieveSession({ sessionId }: { sessionId: string }) {
  return stripeInstance.checkout.sessions.retrieve(sessionId, {
    expand: [
      'setup_intent',
      'setup_intent.payment_method',
      'customer',
      'subscription',
      'subscription.default_payment_method',
    ],
  });
}

function updateCustomer(customerId, params: Stripe.CustomerUpdateParams) {
  logger.debug('updating customer', customerId);
  return stripeInstance.customers.update(customerId, params);
}

function updateSubscription(subscriptionId: string, params: Stripe.SubscriptionUpdateParams) {
  logger.debug('updating subscription', subscriptionId);
  return stripeInstance.subscriptions.update(subscriptionId, params);
}

function cancelSubscription({ subscriptionId }: { subscriptionId: string }) {
  logger.debug('cancel subscription', subscriptionId);
  return stripeInstance.subscriptions.del(subscriptionId);
}

function getListOfInvoices({ customerId }: { customerId: string }) {
  logger.debug('getting list of invoices for customer', customerId);
  return stripeInstance.invoices.list({ customer: customerId, limit: 100 });
}

function stripeWebhookAndCheckoutCallback({ server }: { server: express.Application }) {
  server.post(
    '/api/v1/public/stripe-invoice-payment-failed',
    express.raw({ type: 'application/json' }),
    async (req, res, next) => {
      try {
        const event = stripeInstance.webhooks.constructEvent(
          req.body,
          req.headers['stripe-signature'],
          dev ? process.env.STRIPE_TEST_ENDPOINTSECRET : process.env.STRIPE_LIVE_ENDPOINTSECRET,
        );

        logger.debug(`${event.id}, ${event.type}`);

        // invoice.payment_failed
        // data.object is an invoice
        // Occurs whenever an invoice payment attempt fails, due either to a declined payment or to the lack of a stored payment method.

        if (event.type === 'invoice.payment_failed') {
          // @ts-expect-error subscription does not exist on type Object
          const { subscription } = event.data.object;
          logger.debug(JSON.stringify(subscription));

          await Studio.cancelSubscriptionAfterFailedPayment({
            subscriptionId: JSON.stringify(subscription),
          });
        }

        res.sendStatus(200);
      } catch (err) {
        console.error(`Webhook error: ${err.message}`);
        next(err);
      }
    },
  );

  server.get('/stripe/checkout-completed/:sessionId', async (req, res) => {
    const { sessionId } = req.params;

    const session = await retrieveSession({ sessionId });
    if (!session || !session.metadata || !session.metadata.userId || !session.metadata.studioId) {
      throw new Error('Wrong session.');
    }

    const user = await User.findById(
      session.metadata.userId,
      '_id stripeCustomer email displayName isSubscriptionActive stripeSubscription',
    ).setOptions({ lean: true });

    const studio = await Studio.findById(
      session.metadata.studioId,
      'isSubscriptionActive stripeSubscription teacherId slug',
    ).setOptions({ lean: true });

    if (!user) {
      throw new Error('User not found.');
    }

    if (!studio) {
      throw new Error('Studio not found.');
    }

    if (studio.teacherId !== user._id.toString()) {
      throw new Error('Permission denied');
    }

    try {
      if (session.mode === 'setup' && session.setup_intent) {
        const si: Stripe.SetupIntent = session.setup_intent as Stripe.SetupIntent;
        const pm: Stripe.PaymentMethod = si.payment_method as Stripe.PaymentMethod;

        if (user.stripeCustomer) {
          await updateCustomer(user.stripeCustomer.id, {
            invoice_settings: { default_payment_method: pm.id },
          });
        }

        if (studio.stripeSubscription) {
          await updateSubscription(studio.stripeSubscription.id, { default_payment_method: pm.id });
        }

        await User.changeStripeCard({ session, user });
      } else if (session.mode === 'subscription') {
        await User.saveStripeCustomerAndCard({ session, user });
        await Studio.subscribeStudio({ session, studio });
        await User.getListOfInvoicesForCustomer({ userId: user._id });
      } else {
        throw new Error('Wrong session.');
      }

      res.redirect(
        `${dev ? process.env.URL_APP : process.env.PRODUCTION_URL_APP}/studios/${studio.slug}/billing`,
      );
    } catch (err) {
      console.error(err);

      res.redirect(
        `${dev ? process.env.URL_APP : process.env.PRODUCTION_URL_APP}/studios/${
          studio.slug
        }/billing?redirectMessage=${err.message || err.toString()}`,
      );
    }
  });
}

export { createSession, cancelSubscription, getListOfInvoices, stripeWebhookAndCheckoutCallback };
