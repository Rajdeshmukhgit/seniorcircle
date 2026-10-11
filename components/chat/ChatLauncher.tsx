import { getCurrentUser } from "@/lib/auth/session";
import { isChatModelConfigured } from "@/lib/chat/config";
import { ChatWidget } from "./ChatWidget";

/** The assistant is for signed-in members only, so visitors never see the button. */
export async function ChatLauncher() {
  const user = await getCurrentUser();
  if (!user) return null;
  return <ChatWidget firstName={user.name.split(/\s+/)[0]} modelReady={isChatModelConfigured} />;
}
