import * as express from 'express';

import { signRequestForUpload } from '../aws-s3';

import User from '../models/User';
import Studio from '../models/Studio';
import Invitation from '../models/Invitation';
import Discussion from '../models/Discussion';
import Post from '../models/Post';
import Schedule from '../models/Schedule';

import {
  discussionAdded,
  discussionDeleted,
  discussionEdited,
  postAdded,
  postDeleted,
  postEdited,
} from '../sockets';

const router = express.Router();

router.use((req, res, next) => {
  console.log('studio member API', req.path);
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  next();
});

// Get signed request from AWS S3 server
router.post('/aws/get-signed-request-for-upload-to-s3', async (req, res, next) => {
  try {
    const { fileName, fileType, prefix, bucket } = req.body;

    const returnData = await signRequestForUpload({
      fileName,
      fileType,
      prefix,
      bucket,
    });

    console.log(bucket);

    res.json(returnData);
  } catch (err) {
    next(err);
  }
});

router.post('/user/update-profile', async (req: any, res, next) => {
  try {
    const { name, avatarUrl } = req.body;

    const updatedUser = await User.updateProfile({
      userId: req.user.id,
      name,
      avatarUrl,
    });

    res.json({ updatedUser });
  } catch (err) {
    next(err);
  }
});

router.post('/user/toggle-theme', async (req: any, res, next) => {
  try {
    const { darkTheme } = req.body;

    await User.toggleTheme({ userId: req.user.id, darkTheme });

    res.json({ done: 1 });
  } catch (err) {
    next(err);
  }
});

async function loadDiscussionsData(studio, userId, body) {
  const { discussionSlug } = body;

  if (!discussionSlug) {
    return [];
  }

  const { discussions } = await Discussion.getList({
    userId,
    studioId: studio._id,
  });

  for (const discussion of discussions) {
    if (discussion.slug === discussionSlug) {
      Object.assign(discussion, {
        initialPosts: await Post.getList({
          userId,
          discussionId: discussion._id,
        }),
      });

      break;
    }
  }

  return discussions;
}

async function loadStudioData(studio, userId, body) {
  const initialMembers = await User.getMembersForStudio({
    userId,
    studioId: studio._id,
  });

  let initialInvitations = [];
  if (userId === studio.teacherId) {
    initialInvitations = await Invitation.getStudioInvitations({
      userId,
      studioId: studio._id,
    });
  }

  const initialSchedule = await Schedule.getSchedule({
    userId,
    studioId: studio._id,
  });
  console.log(`initialSchedule:${initialSchedule}`);
  console.log('initialSchedule', initialSchedule);

  console.log(`initialMembers:${initialMembers}`);

  const initialDiscussions = await loadDiscussionsData(studio, userId, body);

  const data: any = { initialMembers, initialInvitations, initialDiscussions, initialSchedule };

  // console.log(`Express route:${data.initialPosts}`);

  return data;
}

router.post('/get-initial-data', async (req: any, res, next) => {
  try {
    const studios = await Studio.getAllStudiosForUser(req.user.id);

    let selectedStudioSlug = req.body.studioSlug;
    if (!selectedStudioSlug && studios && studios.length > 0) {
      selectedStudioSlug = studios[0].slug;
    }

    for (const studio of studios) {
      if (studio.slug === selectedStudioSlug) {
        Object.assign(studio, await loadStudioData(studio, req.user.id, req.body));
        break;
      }
    }

    // console.log(studios.length, studios);

    res.json({ studios });
  } catch (err) {
    next(err);
  }
});

// router.get('/studios', async (req, res, next) => {
//   try {
//     const studios = await Studio.getAllStudiosForUser(req.user.id);

//     console.log(studios);

//     res.json({ studios });
//   } catch (err) {
//     next(err);
//   }
// });

router.get('/studios/get-members', async (req: any, res, next) => {
  try {
    const users = await User.getMembersForStudio({
      userId: req.user.id,
      studioId: req.query.studioId as string,
    });

    res.json({ users });
  } catch (err) {
    next(err);
  }
});

/* express routes for discussions */
router.post('/discussions/add', async (req: any, res, next) => {
  try {
    const { name, studioId, memberIds = [], socketId, notificationType } = req.body;

    const discussion = await Discussion.add({
      userId: req.user.id,
      name,
      studioId,
      memberIds,
      notificationType,
    });

    discussionAdded({ socketId, discussion });

    res.json({ discussion });
  } catch (err) {
    next(err);
  }
});

router.post('/discussions/edit', async (req: any, res, next) => {
  try {
    const { name, id, memberIds = [], socketId, notificationType } = req.body;

    const updatedDiscussion = await Discussion.edit({
      userId: req.user.id,
      name,
      id,
      memberIds,
      notificationType,
    });

    discussionEdited({ socketId, discussion: updatedDiscussion });

    res.json({ done: 1 });
  } catch (err) {
    next(err);
  }
});

router.post('/discussions/delete', async (req: any, res, next) => {
  try {
    const { id, socketId } = req.body;

    const { studioId } = await Discussion.delete({ userId: req.user.id, id });

    discussionDeleted({ socketId, studioId, id });

    res.json({ done: 1 });
  } catch (err) {
    next(err);
  }
});

router.get('/discussions/list', async (req: any, res, next) => {
  try {
    const { discussions } = await Discussion.getList({
      userId: req.user.id,
      studioId: req.query.studioId as string,
    });

    res.json({ discussions });
  } catch (err) {
    next(err);
  }
});

/* express routes for posts */
router.get('/posts/list', async (req: any, res, next) => {
  try {
    const posts = await Post.getList({
      userId: req.user.id,
      discussionId: req.query.discussionId as string,
    });

    res.json({ posts });
  } catch (err) {
    next(err);
  }
});

router.post('/posts/add', async (req: any, res, next) => {
  try {
    const { content, discussionId, socketId } = req.body;

    const post = await Post.add({ userId: req.user.id, content, discussionId });

    postAdded({ socketId, post });

    res.json({ post });
  } catch (err) {
    next(err);
  }
});

router.post('/posts/edit', async (req: any, res, next) => {
  try {
    const { content, id, socketId } = req.body;

    const updatedPost = await Post.edit({ userId: req.user.id, content, id });

    postEdited({ socketId, post: updatedPost });

    res.json({ done: 1 });
  } catch (err) {
    next(err);
  }
});

router.post('/posts/delete', async (req: any, res, next) => {
  try {
    const { id, discussionId, socketId } = req.body;

    await Post.delete({ userId: req.user.id, id });

    postDeleted({ socketId, id, discussionId });

    res.json({ done: 1 });
  } catch (err) {
    next(err);
  }
});

/* express routes for schedule */
/* express route for getting a schedule */
router.get('/schedule/get', async (req: any, res, next) => {
  try {
    console.log('req.query', req.query);

    if (!req.query.userId && req.query.teacherId){
      req.query.userId = req.query.teacherId;
    }
    const { userId, studioId } = req.query;

    console.log('userId', userId);
    console.log('studioId', studioId);

    const schedule = await Schedule.getSchedule({ userId, studioId });

    res.json(schedule);
  } catch (err) {
    next(err);
  }
});

export default router;
