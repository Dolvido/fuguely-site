import * as express from 'express';

import { signRequestForUpload } from '../aws-s3';

import User from '../models/User';

const router = express.Router();

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

    console.log(returnData);

    res.json(returnData);
  } catch (err) {
    next(err);
  }
});

// add express route for toggling theme
router.post('/user/toggle-theme', async (req: any, res, next) => {
  console.log('Express route: /user/toggle-theme');
  try {
    const { darkTheme } = req.body;

    await User.toggleTheme({
      userId: req.user.id,
      darkTheme,
    });

    res.json({ done: 1 });
  } catch (err) {
    next(err);
  }
});

export default router;
