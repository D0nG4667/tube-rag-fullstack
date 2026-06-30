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

	return (
		<div
			lang={locale}
			dir={locale === "ar" ? "rtl" : "ltr"}
			className="w-full h-full"
		>
			{children}
		</div>
	);
}
