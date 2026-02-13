"use client";
import React from "react";
import { useQuery } from "convex/react";
import { Doc, Id } from "../../../../../../convex/_generated/dataModel";
import { api } from "../../../../../../convex/_generated/api";
import { useParams } from "next/navigation";
import type { ChatStatus, UIMessage } from "ai";
import {
  AlertCircle,
  Copy,
  LucideBrain,
  MessageSquare,
  RefreshCw,
} from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { OrbDemo } from "./OrbUse";

const PmPage = () => {
  const params = useParams();
  const [input, setInput] = React.useState("");
  const [isOrbOpen, setIsOrbOpen] = React.useState(false);
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
      body: {
        repoId,
      },
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
            <>
              {messages.map((message, messageIndex) => {
                const isLastMessage = messageIndex === messages.length - 1;
                const isStreaming = status === "streaming" && isLastMessage;

                return (
                  <div key={message.id}>
                    {message.parts.map((part, partIndex) => {
                      if (part.type === "reasoning") {
                        return (
                          <Reasoning
                            key={`${message.id}-${partIndex}`}
                            isStreaming={
                              isStreaming &&
                              partIndex === message.parts.length - 1
                            }
                          >
                            <ReasoningTrigger />
                            <ReasoningContent>{part.text}</ReasoningContent>
                          </Reasoning>
                        );
                      }

                      if (part.type === "text") {
                        return (
                          <Message
                            key={`${message.id}-${partIndex}`}
                            from={message.role}
                          >
                            <MessageContent>
                              <MessageResponse>{part.text}</MessageResponse>
                            </MessageContent>
                            {message.role === "assistant" &&
                              isLastMessage &&
                              !isStreaming && (
                                <MessageActions>
                                  <MessageAction
                                    tooltip="Copy"
                                    // onClick={() => handleCopy(part.text)}
                                  >
                                    <Copy className="size-3" />
                                  </MessageAction>
                                  <MessageAction
                                    tooltip="Regenerate"
                                    // onClick={onRegenerate}
                                  >
                                    <RefreshCw className="size-3" />
                                  </MessageAction>
                                </MessageActions>
                              )}
                          </Message>
                        );
                      }

                      // Handle tool parts (type starts with "tool-")
                      if (part.type.startsWith("tool-")) {
                        const toolPart = part as {
                          type: `tool-${string}`;
                          state:
                            | "input-streaming"
                            | "input-available"
                            | "output-available"
                            | "output-error";
                          input?: unknown;
                          output?: unknown;
                          errorText?: string;
                        };

                        // Auto-open completed or error tools
                        const shouldOpen =
                          toolPart.state === "output-available" ||
                          toolPart.state === "output-error";

                        return (
                          <div
                            key={`${message.id}-${partIndex}`}
                            className="my-2 ml-10"
                          >
                            <Tool defaultOpen={shouldOpen}>
                              <ToolHeader
                                type={toolPart.type}
                                state={toolPart.state}
                              />
                              <ToolContent>
                                <ToolInput input={toolPart.input} />
                                {(toolPart.state === "output-available" ||
                                  toolPart.state === "output-error") && (
                                  <ToolOutput
                                    output={toolPart.output}
                                    errorText={toolPart.errorText}
                                  />
                                )}
                              </ToolContent>
                            </Tool>
                          </div>
                        );
                      }

                      return null;
                    })}
                  </div>
                );
              })}

              {status === "submitted" && (
                <div className="flex items-center gap-2">
                  <Loader />
                  <span className="text-sm text-muted-foreground">
                    Thinking...
                  </span>
                </div>
              )}

              {status === "error" && (
                <div className="flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/10 p-3">
                  <AlertCircle className="size-4 text-destructive" />
                  <span className="flex-1 text-sm text-destructive">
                    Failed to get response
                  </span>
                  {isLastMessageFromAssistant && (
                    <Button
                      variant="ghost"
                      size="sm"
                      //   onClick={onRegenerate}
                      className="text-destructive hover:text-destructive"
                    >
                      <RefreshCw className="mr-1 size-3" />
                      Retry
                    </Button>
                  )}
                </div>
              )}
            </>
          )}
        </ConversationContent>
      </Conversation>

      <div className="mt-auto relative my-5 border-t p-4 max-w-[600px] mx-auto w-full">
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

      <Dialog open={isOrbOpen} onOpenChange={setIsOrbOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Orb AI </DialogTitle>
          </DialogHeader>

          {/* 👉 Your Orb UI here */}
          <div className=" flex items-center justify-center">
            <OrbDemo />
          </div>
        </DialogContent>
      </Dialog>

      {/* ABSOLUTE BUTTON TO OPEN DIALOG FOR ORB ! */}
      <Button
        className="absolute bottom-2 right-5 text-[10px] py-2! px-5! rounded-full"
        size="sm"
        onClick={() => setIsOrbOpen(!isOrbOpen)}
      >
        Talk to AI <LucideBrain />
      </Button>
    </div>
  );
};

export default PmPage;
