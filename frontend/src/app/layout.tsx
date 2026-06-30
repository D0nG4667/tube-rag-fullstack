import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";

export const metadata: Metadata = {
	title: "TubeRAG - AI Video Analysis & Chat Engine",
	description:
		"Interact with your video sources via an advanced StudyStudio, presentation outlines, alternating voice podcasts, and concept mindmaps.",
	metadataBase: new URL(
		process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
	),
	openGraph: {
		title: "TubeRAG - AI Video Analysis & Chat Engine",
		description:
			"Interact with your video sources via an advanced StudyStudio, presentation outlines, alternating voice podcasts, and concept mindmaps.",
		url: "/",
		siteName: "TubeRAG",
		images: [
			{
				url: "/og-image.png",
				width: 1200,
				height: 630,
				alt: "TubeRAG Platform Social Card Preview",
			},
		],
		type: "website",
	},
	twitter: {
		card: "summary_large_image",
		title: "TubeRAG - AI Video Analysis & Chat Engine",
		description:
			"Interact with your video sources via an advanced StudyStudio, presentation outlines, alternating voice podcasts, and concept mindmaps.",
		images: ["/og-image.png"],
	},
	icons: {
		icon: "/favicon.ico",
		apple: "/logo.png",
	},
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en" suppressHydrationWarning>
			<head>
				<link rel="preconnect" href="https://fonts.googleapis.com" />
				<link
					rel="preconnect"
					href="https://fonts.gstatic.com"
					crossOrigin="anonymous"
				/>
				<link
					href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Caveat:wght@400;500;600;700&family=Aref+Ruqaa:wght@400;700&display=swap"
					rel="stylesheet"
				/>
			</head>
			<body
				className="antialiased bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 transition-colors duration-300"
				suppressHydrationWarning
			>
				<ThemeProvider
					attribute="class"
					defaultTheme="dark"
					enableSystem
					disableTransitionOnChange
				>
					{children}
				</ThemeProvider>
			</body>
		</html>
	);
}
