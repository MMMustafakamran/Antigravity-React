"use client";

// HARNESS: the doc file starts mid-file with no imports. React, react-markdown, remark-gfm and lucide's Bot/User are
// guessed from usage; Avatar/AvatarFallback (shadcn), cn, MultimodalPart, Attachment and AttachmentChip are never
// shown on the page, so minimal stand-ins follow.
import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Bot, User } from "lucide-react";

// HARNESS stand-ins (not on the page)
const cn = (...c: (string | false | undefined)[]) => c.filter(Boolean).join(" ");
function Avatar({ className, children }: { className?: string; children?: React.ReactNode }) {
  return <span className={cn("inline-flex items-center justify-center rounded-full", className)}>{children}</span>;
}
function AvatarFallback({ className, children }: { className?: string; children?: React.ReactNode }) {
  return <span className={cn("inline-flex h-full w-full items-center justify-center rounded-full", className)}>{children}</span>;
}
type MultimodalPart = { type: string; text?: string; source?: unknown; metadata?: unknown };
type Attachment = { id: string; type: string; source?: unknown; filename?: string; size?: number; status: string };
function AttachmentChip({ attachment }: { attachment: Attachment }) {
  return <span className="rounded border px-2 text-xs">{attachment.filename ?? attachment.type}</span>;
}

// --- Doc: https://docs.copilotkit.ai/google-antigravity/custom-look-and-feel/headless-ui (verbatim) ---
// src/app/demos/headless-complete/chat/message-assistant.tsx
export function AssistantBubble({
  content,
  children,
}: {
  content?: string;
  children?: React.ReactNode;
}) {
  const hasText = typeof content === "string" && content.trim().length > 0;
  const hasChildren = React.Children.count(children) > 0;
  if (!hasText && !hasChildren) return null;

  return (
    <div
      data-testid="headless-message-assistant"
      data-message-role="assistant"
      className="flex w-full items-start gap-3"
    >
      <Avatar className="h-8 w-8 shrink-0 border bg-muted text-muted-foreground">
        <AvatarFallback className="bg-muted text-muted-foreground">
          <Bot className="h-4 w-4" />
        </AvatarFallback>
      </Avatar>

      <div className="flex max-w-[calc(100%-2.75rem)] flex-1 flex-col items-start gap-2">
        {hasText && (
          <div
            className={cn(
              "max-w-[90%] rounded-2xl rounded-tl-sm px-4 py-2.5 text-sm leading-relaxed shadow-sm",
              "bg-muted text-foreground",
            )}
          >
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                p: ({ children }) => (
                  <p className="my-1 first:mt-0 last:mb-0">{children}</p>
                ),
                ul: ({ children }) => (
                  <ul className="my-1 list-disc pl-5">{children}</ul>
                ),
                ol: ({ children }) => (
                  <ol className="my-1 list-decimal pl-5">{children}</ol>
                ),
                li: ({ children }) => <li className="my-0.5">{children}</li>,
                code: ({ children, className }) => {
                  const isBlock = (className ?? "").includes("language-");
                  if (isBlock) {
                    return <code className={className}>{children}</code>;
                  }
                  return (
                    <code className="rounded bg-background px-1 py-0.5 font-mono text-[0.85em]">
                      {children}
                    </code>
                  );
                },
                pre: ({ children }) => (
                  <pre className="my-2 overflow-x-auto rounded-md bg-background p-3 font-mono text-xs">
                    {children}
                  </pre>
                ),
                a: ({ children, href }) => (
                  <a
                    href={href}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="text-primary underline underline-offset-2 hover:opacity-80"
                  >
                    {children}
                  </a>
                ),
                strong: ({ children }) => (
                  <strong className="font-semibold">{children}</strong>
                ),
                h1: ({ children }) => (
                  <h1 className="my-2 text-base font-semibold">{children}</h1>
                ),
                h2: ({ children }) => (
                  <h2 className="my-2 text-base font-semibold">{children}</h2>
                ),
                h3: ({ children }) => (
                  <h3 className="my-2 text-sm font-semibold">{children}</h3>
                ),
                blockquote: ({ children }) => (
                  <blockquote className="my-2 border-l-2 border-border pl-3 italic text-muted-foreground">
                    {children}
                  </blockquote>
                ),
              }}
            >
              {content as string}
            </ReactMarkdown>
          </div>
        )}
        {hasChildren && (
          <div className="flex w-full max-w-full flex-col gap-2">
            {children}
          </div>
        )}
      </div>
    </div>
  );
}

export function UserBubble({
  content,
}: {
  content: string | MultimodalPart[];
}) {
  const { text, attachments } = splitContent(content);
  const hasText = text.trim().length > 0;
  const hasAttachments = attachments.length > 0;
  if (!hasText && !hasAttachments) return null;

  return (
    <div
      data-testid="headless-message-user"
      data-message-role="user"
      className="flex w-full items-start gap-3 flex-row-reverse"
    >
      <Avatar className="h-8 w-8 shrink-0 border bg-primary text-primary-foreground">
        <AvatarFallback className="bg-primary text-primary-foreground">
          <User className="h-4 w-4" />
        </AvatarFallback>
      </Avatar>

      <div className="flex max-w-[80%] flex-col items-end gap-2">
        {hasAttachments && (
          <div className="flex flex-wrap justify-end gap-2">
            {attachments.map((a) => (
              <AttachmentChip key={a.id} attachment={a} />
            ))}
          </div>
        )}
        {hasText && (
          <div
            className={cn(
              "rounded-2xl rounded-tr-sm px-4 py-2.5 text-sm leading-relaxed shadow-sm",
              "bg-primary text-primary-foreground",
            )}
          >
            <p className="whitespace-pre-wrap break-words">{text}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function splitContent(content: string | MultimodalPart[]): {
  text: string;
  attachments: Attachment[];
} {
  if (typeof content === "string") {
    return { text: content, attachments: [] };
  }
  let text = "";
  const attachments: Attachment[] = [];
  let i = 0;
  for (const part of content) {
    if (part.type === "text") {
      text += part.text;
      continue;
    }
    const meta = (part.metadata ?? {}) as {
      filename?: string;
      size?: number;
    };
    attachments.push({
      id: `${part.type}-${i++}`,
      type: part.type,
      source: part.source,
      filename: meta.filename,
      size: meta.size,
      status: "ready",
    });
  }
  return { text, attachments };
}
