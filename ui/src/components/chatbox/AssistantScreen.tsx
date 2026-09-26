"use client";

/**
 * `/assistant` — the full-page chat screen.
 *
 * Reads ?q= from the URL and passes it to ModernChatbot as `initialQuery`
 * so the assistant starts answering immediately when the user lands here
 * from the homepage search bar or a suggestion link.
 */

import React, { Suspense } from "react";
import { useSearchParams } from "next/navigation";

import ModernChatbot from "../chatbot/ModernChatbot";

const AssistantWithQuery: React.FC = () => {
  const params = useSearchParams();
  const q = params.get("q")?.trim() || undefined;
  return <ModernChatbot initialQuery={q} className="mc--fullpage" />;
};

const AssistantScreen: React.FC = () => (
  <Suspense fallback={<ModernChatbot className="mc--fullpage" />}>
    <AssistantWithQuery />
  </Suspense>
);

export default AssistantScreen;
