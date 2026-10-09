import { readFileSync } from "node:fs";
import path from "node:path";
import Synthesiser from "@/components/Synthesiser";
import { companies } from "@/data/companies";

// Sample datasets are read at build time, so the page stays static.
export default function Home() {
  const samples = companies.map((company) => ({
    ...company,
    text: readFileSync(
      path.join(process.cwd(), "src", "data", `${company.slug}.txt`),
      "utf8",
    ).trim(),
  }));

  return <Synthesiser samples={samples} />;
}
