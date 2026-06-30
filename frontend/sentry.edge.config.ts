import * as Sentry from "@sentry/nextjs";

Sentry.init({
	dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

	// Adjust this value in production, or use tracesSampleRate
	tracesSampleRate: 1.0,
});
