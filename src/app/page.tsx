import Synthesiser from "@/components/Synthesiser";
import { loadSamples } from "@/data/samples";

export default function Home() {
  return <Synthesiser samples={loadSamples()} />;
}
