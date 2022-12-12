import * as express from 'express';

import User from '../models/User';

const router = express.Router();

router.get('/get-user', (req, res) => {
  console.log(req.user);
  res.json({ user: req.user || null });
});

router.post('/get-user-by-slug', async (req, res, next) => {
  console.log('Express route: /get-user-by-slug');

  //@ts-ignore
  //req.session.foo = 'bar';

  try {
    const { slug } = req.body;

    const user = await User.getUserBySlug({ slug });

    res.json({ user });
  } catch (err) {
    next(err);
  }
});

router.get('/invitations/get-team-by-token', async (req, res, next) => {
  const token = req.query.token as string;

  try {
    const team = await Invitation.getTeamByToken({ token });

    res.json({ team });
  } catch (err) {
    next(err);
  }
});


export default router;
