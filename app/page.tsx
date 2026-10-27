import { Studio } from "@/components/studio/Studio";
import { getServerEnv } from "@/lib/env";

export default function HomePage() {
  return <Studio demo={getServerEnv().demoMode} />;
}
