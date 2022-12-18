import * as express from 'express';

import Invitation from '../models/Invitation';
import Studio from '../models/Studio';
import User from '../models/User';
import { createSession } from '../stripe';
import Schedule from '../models/Schedule';

const router = express.Router();

router.use((req, res, next) => {
  console.log('studio teacher API', req.path);
  console.log(req.body);

  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  next();
});

router.post('/studios/add', async (req: any, res, next) => {
  try {
    const { name, avatarUrl } = req.body;

    console.log(`Express route: ${name}, ${avatarUrl}`);

    const studio = await Studio.addStudio({ userId: req.user.id, name, avatarUrl });
    await Schedule.createSchedule({ studioId: studio._id, teacherId: req.user.id });

    res.json(studio);
  } catch (err) {
    next(err);
  }
});

router.post('/studios/update', async (req: any, res, next) => {
  try {
    const { studioId, name, avatarUrl } = req.body;

    // console.log(req.user.id, typeof req.user.id);
    // console.log(req.user._id, typeof req.user._id);

    const studio = await Studio.updateStudio({
      userId: req.user.id,
      studioId,
      name,
      avatarUrl,
    });

    res.json(studio);
  } catch (err) {
    next(err);
  }
});

router.get('/studios/get-invitations-for-studio', async (req: any, res, next) => {
  try {
    const invitations = await Invitation.getStudioInvitations({
      userId: req.user.id,
      studioId: req.query.studioId as string,
    });

    res.json({ invitations });
  } catch (err) {
    next(err);
  }
});

router.post('/studios/invite-member', async (req: any, res, next) => {
  try {
    const { studioId, email } = req.body;

    const newInvitation = await Invitation.add({ userId: req.user.id, studioId, email });

    res.json({ newInvitation });
  } catch (err) {
    next(err);
  }
});

router.post('/studios/remove-member', async (req: any, res, next) => {
  try {
    const { studioId, userId } = req.body;

    await Studio.removeMember({ teacherId: req.user.id, studioId, userId });

    res.json({ done: 1 });
  } catch (err) {
    next(err);
  }
});

router.post('/stripe/fetch-checkout-session', async (req: any, res, next) => {
  try {
    const { mode, studioId } = req.body;

    const user = await User.findById(req.user.id)
      .select(['stripeCustomer', 'email'])
      .setOptions({ lean: true });

    const studio = await Studio.findById(studioId)
      .select(['stripeSubscription', 'slug', 'teacherId'])
      .setOptions({ lean: true });

    if (!user || !studio || studio.teacherId !== req.user.id) {
      throw new Error('Permission denied');
    }

    const session = await createSession({
      mode,
      userId: user._id.toString(),
      userEmail: user.email,
      studioId,
      studioSlug: studio.slug,
      customerId: (user.stripeCustomer && user.stripeCustomer.id) || undefined,
      subscriptionId: (studio.stripeSubscription && studio.stripeSubscription.id) || undefined,
    });

    res.json({ sessionId: session.id });
  } catch (err) {
    next(err);
  }
});

router.post('/cancel-subscription', async (req: any, res, next) => {
  const { studioId } = req.body;

  try {
    const { isSubscriptionActive } = await Studio.cancelSubscription({
      teacherId: req.user.id,
      studioId,
    });

    res.json({ isSubscriptionActive });
  } catch (err) {
    next(err);
  }
});

router.get('/get-list-of-invoices-for-customer', async (req: any, res, next) => {
  try {
    const { stripeListOfInvoices } = await User.getListOfInvoicesForCustomer({
      userId: req.user.id,
    });
    res.json({ stripeListOfInvoices });
  } catch (err) {
    next(err);
  }
});

/* express route for creating a new schedule */
router.post('/studios/create-schedule', async (req: any, res, next) => {
  console.log('enter schedule/create');
  try {
    console.log('create schedule', req.body);
    const { studioId, teacherId } = req.body;

    const schedule = await Studio.createStudioSchedule({ studioId, teacherId });

    res.json({done: 1, schedule: schedule});
  } catch (err) {
    next(err);
  }
});

router.post('/schedule/create', async (req: any, res, next) => {
  try {
    const { studioId, teacherId } = req.body;
    
    const schedule = await Schedule.createSchedule({ studioId, teacherId });
    
    res.json({done: 1, schedule: schedule});
  } catch (err) {
    next(err);
  }
});

/* express route for updating a schedule's members */
router.post('/schedule/update-students', async (req: any, res, next) => {
  try {
    const { userId, scheduleId, studentIds } = req.body;

    const schedule = await Schedule.updateStudents({ userId, scheduleId, studentIds });

    res.json(schedule);
  } catch (err) {
    next(err);
  }
});

/* express route for updating a teachers availability */
router.post('/schedule/update-availability', async (req: any, res, next) => {
  try {
    const { teacherId, scheduleId, timeRanges } = req.body;

    const schedule = await Schedule.updateAvailability({ teacherId, scheduleId, timeRanges });

    res.json(schedule);
  } catch (err) {
    next(err);
  }
});

/* express route for adding an availability window to a schedule */
router.post('/schedule/add-availability-window', async (req: any, res, next) => {
  try {
    const { studioId, teacherId, availability } = req.body;

    const schedule = await Schedule.addAvailabilityWindow({ studioId, teacherId, availability });

    res.json(schedule);
  } catch (err) {
    next(err);
  }
});

export default router;
