import { Studio } from "@/components/studio/Studio";
import { getServerEnv } from "@/lib/env";
import { defaultModel, enabledModels } from "@/lib/llm/model-routing";

export default function HomePage() {
  return <Studio demo={getServerEnv().demoMode} models={enabledModels()} defaultModel={defaultModel()} />;
}
