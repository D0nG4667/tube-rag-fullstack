import DashboardClient from "@/components/DashboardClient";

interface PageProps {
	params: Promise<{ locale: string }>;
}

export function generateStaticParams() {
	return [{ locale: "en" }, { locale: "ar" }];
}

export default async function Page({ params }: PageProps) {
	const { locale } = await params;
	return <DashboardClient locale={locale} />;
}
