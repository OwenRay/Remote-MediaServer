const Sentry = require('@sentry/node');

process.removeAllListeners('uncaughtException');

Sentry.init({
  dsn: 'https://b74da17a778a4e698bc7f181c792434e@o237120.ingest.sentry.io/4503975825965056',
  integrations: [
    new Sentry.Integrations.Http({ tracing: true }),
  ],
  tracesSampleRate: 1.0,
});
