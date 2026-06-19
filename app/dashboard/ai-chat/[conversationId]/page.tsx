import type { Metadata } from "next";
import { AiChatPage } from "@/components/dashboard/ai-chat/ai-chat-page";
import { SITE_NAME } from "@/lib/seo/site-metadata";

type PageProps = {
  params: Promise<{ conversationId: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { conversationId } = await params;
  return {
    title: `AI Chat · ${SITE_NAME}`,
    description: `Mahajaan AI conversation ${conversationId}`,
    robots: { index: false, follow: false },
  };
}

export default async function DashboardAiChatConversationPage({ params }: PageProps) {
  const { conversationId } = await params;
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <AiChatPage conversationIdFromRoute={conversationId} />
    </div>
  );
}
