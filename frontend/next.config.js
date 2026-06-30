const path = require("node:path");

const { withSentryConfig } = require("@sentry/nextjs");

/** @type {import('next').NextConfig} */
const nextConfig = {
	turbopack: {
		root: path.join(__dirname, ".."),
	},
};

module.exports = withSentryConfig(
	nextConfig,
	{
		silent: true,
		org: "tuberag",
		project: "tuberag-frontend",
	},
	{
		widenClientFileUpload: true,
		transpileClientSDK: true,
		tunnelRoute: "/monitoring",
		hideSourceMaps: true,
		disableLogger: true,
		automaticVercelMonitors: true,
	},
);
