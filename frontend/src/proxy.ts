import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const locales = ["en", "ar"];
const defaultLocale = "en";

export function proxy(request: NextRequest) {
	const { pathname } = request.nextUrl;

	// Check if pathname is missing any locale prefix
	const pathnameIsMissingLocale = locales.every(
		(locale) =>
			!pathname.startsWith(`/${locale}/`) && pathname !== `/${locale}`,
	);

	// Redirect if there is no locale (ignore assets/internal endpoints)
	if (pathnameIsMissingLocale) {
		// Detect user preferred locale from Accept-Language or fallback
		let locale = defaultLocale;
		const acceptLang = request.headers.get("accept-language");
		if (acceptLang?.startsWith("ar")) {
			locale = "ar";
		}

		return NextResponse.redirect(
			new URL(
				`/${locale}${pathname.startsWith("/") ? "" : "/"}${pathname}`,
				request.url,
			),
		);
	}
}

export const config = {
	matcher: [
		// Skip all internal paths (_next), api paths, static images, and root metadata
		"/((?!api|_next/static|_next/image|favicon.ico|logo.png|og-image.png|matrix-particles.json|logo_.*|og_image_.*).*)",
	],
};
