import { notFound } from "next/navigation";
import Synthesiser from "@/components/Synthesiser";
import { companies } from "@/data/companies";
import { loadSamples } from "@/data/samples";

export function generateStaticParams() {
  return companies.map(({ slug }) => ({ company: slug }));
}

// /<slug> opens that company's view directly.
export default async function CompanyPage({ params }: PageProps<"/[company]">) {
  const { company } = await params;
  if (!companies.some(({ slug }) => slug === company)) notFound();

  return <Synthesiser samples={loadSamples()} initialSlug={company} />;
}
