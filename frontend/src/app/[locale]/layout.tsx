import { DirectionProvider } from "@/components/ui/direction";

interface LocaleLayoutProps {
	children: React.ReactNode;
	params: Promise<{ locale: string }>;
}

export function generateStaticParams() {
	return [{ locale: "en" }, { locale: "ar" }];
}

export default async function LocaleLayout({
	children,
	params,
}: Readonly<LocaleLayoutProps>) {
	const { locale } = await params;
	const direction = locale === "ar" ? "rtl" : "ltr";

	return (
		<DirectionProvider dir={direction}>
			<div lang={locale} dir={direction} className="w-full h-full">
				{children}
			</div>
		</DirectionProvider>
	);
}
