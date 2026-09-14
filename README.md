# Fuguely — original React / Express prototype

An early full-stack experiment in organizing private music lessons: studios, teachers, students, schedules, and availability.

**Status:** Historical work in progress, retained to show the original application structure. This repository is the React / Next.js / Express / MongoDB version. It is separate from the later Svelte / Firebase experiment and the current Fuguely project.

For the current project overview, see the [Fuguely portfolio case study](https://lukepayne.web.app/projects/fuguely).

## What's in this repository

| Area | Implementation |
| --- | --- |
| `app/` | React, Next.js, TypeScript, Material UI, MobX, and calendar views |
| `api/` | Express routes, Mongoose models, sessions, studio membership, lessons, and schedules |
| `lambdaV2/` | Optional AWS Lambda / Serverless email experiment |

The source also contains Google OAuth and passwordless authentication, Socket.IO, Stripe integration, and AWS / Mailchimp service integrations. Their presence in this historical snapshot is not a claim that all workflows are complete or currently deployed.

## Reviewing or restoring the prototype

```bash
git clone https://github.com/Dolvido/fuguely-site.git
cd fuguely-site
```

The frontend and API have separate `package.json` files and Yarn lockfiles. Their recorded engines are Node 14.18.1 and Yarn 1.22.5; these describe the original environment, not a recommendation for a new deployment.

- Review `api/server/server.ts` and the integration modules for required environment variables. These include MongoDB URLs, app/API URLs, session settings, and provider credentials.
- Install dependencies separately in `api/` and `app/`; each package defines a `yarn dev` script.
- The API package includes `yarn test` for its small utility-test suite. Those tests do not cover the complete scheduling or authentication flows.
- Lambda-specific historical setup is in [lambdaV2/README.md](lambdaV2/README.md).

A complete environment template and a freshly verified setup are not provided. No installation, tests, provider connections, or deployment were run for this documentation refresh.

## Attribution

Based on [async-labs/saas](https://github.com/async-labs/saas). The upstream SaaS foundation and its service integrations should be distinguished from this repository's lesson-scheduling adaptations. Existing package license declarations and upstream attribution are retained.
