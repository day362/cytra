import type { Metadata } from "next";
import { Suspense } from "react";
import { Studio } from "@/components/studio/Studio";
import { getServerEnv } from "@/lib/env";
import { defaultModel, enabledModels } from "@/lib/llm/model-routing";

export const metadata: Metadata = {
  title: "对话",
  // Conversations live in the visitor's browser; nothing here is indexable.
  robots: { index: false, follow: false },
};

/** Static shell matching the workspace layout, shown until the URL resolves. */
function WorkspaceShell() {
  return (
    <div className="flex h-dvh flex-col items-center justify-end px-3 pb-12" aria-busy="true">
      <div className="glass h-[104px] w-full max-w-[780px] rounded-[26px]" />
    </div>
  );
}

export default function ConversationPage() {
  return (
    <Suspense fallback={<WorkspaceShell />}>
      <Studio demo={getServerEnv().demoMode} models={enabledModels()} defaultModel={defaultModel()} />
    </Suspense>
  );
}
