import * as express from 'express';

import publicExpressRoutes from './public';
import studioMemberExpressRoutes from './studio-member';
import studioTeacherApi from './studio-teacher';

function handleError(err, _, res, __) {
  console.error(err.stack);

  res.json({ error: err.message || err.toString() });
}

export default function api(server: express.Express) {
  server.use('/api/v1/public', publicExpressRoutes, handleError);
  server.use('/api/v1/studio-member', studioMemberExpressRoutes, handleError);
  server.use('/api/v1/studio-teacher', studioTeacherApi, handleError);
}
