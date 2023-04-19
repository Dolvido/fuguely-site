# fuguely

React based typescript website template for organizing music teacher's schedules and students. 

WIP

AWS Lambda serverless optional.

Based upon https://github.com/async-labs/saas

# Features

* Server-side rendering for fast initial load and SEO.
* User authentication with Google OAuth API and Passwordless, cookie, and session.
* Production-ready Express server with compression, parser, and helmet.
* Transactional emails (AWS SES): welcome, team invitation, and payment.
* Adding email addresses to newsletter lists (Mailchimp): new users, paying users.
* File upload, load, and deletion (AWS S3) with pre-signed request for: Posts, Studio Profile, and User Profile.
* Websockets with socket.io v3.
* Studio creation, Student invitation, and settings for Studio and User.
* Universally-available environmental variables at runtime.
* Custom logger (configure what not to print in production).
* Useful components for any web app: ActiveLink, Confirm, Notifier, MenuWithLinks, etc...

# Built with

* React
* Material-UI
* Next
* MobX
* Express
* Mongoose
* MongoDB
* Typescript

