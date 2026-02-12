"use client";
import React from "react";
import { useQuery } from "convex/react";
import { Doc, Id } from "../../../../../../convex/_generated/dataModel";
import { api } from "../../../../../../convex/_generated/api";
import { useParams } from "next/navigation";
import type { ChatStatus, UIMessage } from "ai";
import { AlertCircle, Copy, LucideBrain, MessageSquare, RefreshCw } from "lucide-react";
import { toast } from "sonner";

import {
  Message,
  MessageAction,
  MessageActions,
  MessageContent,
  MessageResponse,
} from "@/components/ai-elements/message";
import {
  Reasoning,
  ReasoningContent,
  ReasoningTrigger,
} from "@/components/ai-elements/reasoning";
import {
  Tool,
  ToolContent,
  ToolHeader,
  ToolInput,
  ToolOutput,
} from "@/components/ai-elements/tool";
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { Loader } from "@/components/ai-elements/loader";
import { useChat } from "@ai-sdk/react";
import {
  DefaultChatTransport,
  lastAssistantMessageIsCompleteWithApprovalResponses,
} from "ai";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

const PmPage = () => {
  const params = useParams();
  const [input, setInput] = React.useState("");
  const repoId = params.repoId as Id<"repositories">;

  const {
    messages,
    sendMessage,
    status,
    setMessages,
    addToolApprovalResponse,
  } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/agent/chat",
    }),
    sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithApprovalResponses,
  });

  const isLastMessageFromAssistant =
    messages.length > 0 && messages[messages.length - 1].role === "assistant";

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    sendMessage({
      parts: [{ type: "text", text: input }],
    });
    setInput("");
  };

  return (
    <div className="h-[calc(100vh-60px)] w-full flex flex-col relative px-12">
      <Conversation>
        <ConversationContent>
          {messages.length === 0 ? (
            <ConversationEmptyState
              icon={<MessageSquare className="size-12" />}
              title="Start a conversation"
              description="Ask any question! from your PM"
            />
          ) : (
            <></>
          )}
        </ConversationContent>
      </Conversation>

      <div className="mt-auto relative my-5 border-t p-4">
        <Textarea
          className="resize-none h-18 p-1 bg-primary-foreground focus:outline-none focus:ring-0 shadow-sm"
          placeholder="Create  saas landing page..."
          value={input}
          onChange={(event) => {
            setInput(event.target.value);
          }}
          onKeyDown={async (event) => {
            if (event.key === "Enter") {
              handleSendMessage();
            }
          }}
        />
        <Button
          className="cursor-pointer text-xs absolute bottom-6 right-5"
          size="icon-sm"
          onClick={handleSendMessage}
          variant="default"
        >
          <LucideBrain />
        </Button>
      </div>
    </div>
  );
};

export default PmPage;
