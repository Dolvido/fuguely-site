import express from 'express';
import next from 'next';

import setupSitemapAndRobots from './setupSitemapAndRobots';

import routesWithCache from './routesWithCache';

const dev = process.env.NODE_ENV !== 'production';
const port = process.env.PORT || 3000;

const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = express();

  // give all Nextjs's request to next server before anything else
  server.get('/_next/*', (req, res) => {
    // console.log('next server, page');
    handle(req, res);
  });

  server.use(express.json());

  if (!dev) {
    server.set('trust proxy', 1); // sets req.hostname, req.ip
  }

  server.get('/', async (req: any, res) => {
    let redirectUrl = 'login';

    if (req.user) {
      if (!req.user.defaultStudioSlug) {
        redirectUrl = 'create-studio';
      } else {
        redirectUrl = `studio/${req.user.defaultStudioSlug}/discussions`;
      }
    }

    res.redirect(
      `${
        dev ? process.env.NEXT_PUBLIC_URL_APP : process.env.NEXT_PUBLIC_PRODUCTION_URL_APP
      }/${redirectUrl}`,
    );
  });

  // server.get('/api/v1/public/get-user', (_, res) => {
  //   res.json({ user: { email: 'studio@builderbook.org' } });
  // });

  server.get('/studios/:studioSlug/your-settings', (req, res) => {
    const { studioSlug } = req.params;
    app.render(req, res, '/your-settings', { studioSlug });
  });

  server.get('/studios/:studioSlug/studio-settings', (req, res) => {
    const { studioSlug } = req.params;
    app.render(req, res, '/studio-settings', { studioSlug });
  });

  server.get('/studios/:studioSlug/billing', (req, res) => {
    const { studioSlug } = req.params;
    app.render(req, res, '/billing', { studioSlug, ...(req.query || {}) });
  });

  server.get('/studios/:studioSlug/discussions/:discussionSlug', (req, res) => {
    const { studioSlug, discussionSlug } = req.params;
    app.render(req, res, '/discussion', { studioSlug, discussionSlug });
  });

  server.get('/studios/:studioSlug/discussions', (req, res) => {
    const { studioSlug } = req.params;
    app.render(req, res, '/discussion', { studioSlug });
  });

  server.get('/studios/:studioSlug/schedule', (req, res) => {
    const { studioSlug } = req.params;
    app.render(req, res, '/schedule', { studioSlug });
  });

  server.get('/signup', (req, res) => {
    app.render(req, res, '/login');
  });

  server.get('/invitation', (req, res) => {
    app.render(req, res, '/invitation', { token: req.query.token as string });
  });

  setupSitemapAndRobots({ server });

  routesWithCache({ server, app });

  server.get('*', (req, res) => {
    handle(req, res);
  });

  // listen(handle: any, listeningListener?: () => void): http.Server;
  // "@types/express-serve-static-core", "version": "4.17.1"
  server.listen(port, () => {
    console.log(
      `> Ready on ${
        dev ? process.env.NEXT_PUBLIC_URL_APP : process.env.NEXT_PUBLIC_PRODUCTION_URL_APP
      }`,
    );
  });
});
