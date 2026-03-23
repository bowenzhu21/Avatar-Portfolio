"use client";

import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import type { MessagesChatMessage, MessagesChatResponse } from "@/types";

const bowenContact = {
  id: "bowen",
  name: "Bowen",
  avatar: "/messages/bowen.jpeg",
};

const initialMessages: MessagesChatMessage[] = [
  {
    id: "bowen-intro",
    sender: "bowen",
    text: "Hey, it's Bowen. Ask me about my projects, experience, school, or anything else.",
    timestamp: Date.now(),
  },
];

function formatConversationTime(timestamp: number) {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(timestamp);
}

function formatThreadDay(timestamp: number) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    hour: "numeric",
    minute: "2-digit",
  }).format(timestamp);
}

export function MessagesApp() {
  const [threadOpen, setThreadOpen] = useState(false);
  const [messages, setMessages] = useState<MessagesChatMessage[]>(initialMessages);
  const [draft, setDraft] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const latestMessage = messages[messages.length - 1];
  const preview = latestMessage?.text ?? "Start chatting";
  const previewTime = latestMessage ? formatConversationTime(latestMessage.timestamp) : "";

  useEffect(() => {
    if (!threadOpen || !scrollRef.current) {
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    });

    return () => window.cancelAnimationFrame(frame);
  }, [messages, threadOpen]);

  async function sendMessage(prefilled?: string) {
    const messageText = (prefilled ?? draft).trim();

    if (!messageText || isSending) {
      return;
    }

    const userMessage: MessagesChatMessage = {
      id: `user-${Date.now()}`,
      sender: "user",
      text: messageText,
      timestamp: Date.now(),
    };

    const nextMessages = [...messages, userMessage];

    setMessages(nextMessages);
    setDraft("");
    setError(null);
    setIsSending(true);

    try {
      const response = await fetch("/api/messages-chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: nextMessages,
        }),
      });

      const payload = (await response.json()) as MessagesChatResponse | { error?: string };

      if (!response.ok || "error" in payload || !("reply" in payload)) {
        throw new Error(("error" in payload && payload.error) || "Message could not be sent.");
      }

      const bowenReply: MessagesChatMessage = {
        id: `bowen-${Date.now() + 1}`,
        sender: "bowen",
        text: payload.reply,
        timestamp: Date.now() + 1,
      };

      setMessages((currentMessages) => [...currentMessages, bowenReply]);
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : "Message could not be sent.";
      setError(message);
    } finally {
      setIsSending(false);
    }
  }

  const messageGroups = useMemo(() => messages, [messages]);

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-[#f6f6f8] text-[#111111]">
      <AnimatePresence mode="wait" initial={false}>
        {threadOpen ? (
          <motion.div
            key="thread"
            initial={{ opacity: 0, x: 18 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -18 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="flex h-full min-h-0 flex-col"
          >
            <MessagesThreadHeader onBack={() => setThreadOpen(false)} />
            <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto bg-[#ffffff] px-3 pb-4 pt-2">
              <div className="pb-2 text-center text-[0.72rem] text-[#8b8b92]">
                {formatThreadDay(messages[0]?.timestamp ?? Date.now())}
              </div>
              <div className="space-y-1.5">
                {messageGroups.map((message) => (
                  <MessageBubble key={message.id} message={message} />
                ))}
                {isSending ? <TypingBubble /> : null}
              </div>
            </div>
            <MessageComposer
              draft={draft}
              onChange={setDraft}
              onSend={() => void sendMessage()}
              disabled={isSending}
              error={error}
            />
          </motion.div>
        ) : (
          <motion.div
            key="inbox"
            initial={{ opacity: 0, x: -18 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 18 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="flex h-full min-h-0 flex-col bg-[#f6f6f8]"
          >
            <MessagesInbox
              preview={preview}
              previewTime={previewTime}
              onOpenThread={() => setThreadOpen(true)}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function MessagesInbox({
  preview,
  previewTime,
  onOpenThread,
}: {
  preview: string;
  previewTime: string;
  onOpenThread: () => void;
}) {
  return (
    <>
      <div className="border-b border-black/6 bg-[rgba(248,248,250,0.94)] px-4 pb-3 pt-4 backdrop-blur-xl">
        <div className="flex items-center justify-between">
          <button
            type="button"
            className="text-[0.92rem] font-medium text-[#007aff] transition hover:opacity-80"
          >
            Edit
          </button>
          <button
            type="button"
            className="flex h-7 w-7 items-center justify-center rounded-full border border-[#d8d8de] bg-white text-[1rem] text-[#007aff] shadow-[0_1px_0_rgba(255,255,255,0.5)]"
          >
            +
          </button>
        </div>
        <h1 className="mt-2 text-[2rem] font-semibold tracking-[-0.05em] text-[#111111]">Messages</h1>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-6 pt-4">
        <section>
          <p className="mb-3 text-[0.75rem] font-semibold uppercase tracking-[0.16em] text-[#8b8b92]">
            Pinned
          </p>
          <button type="button" onClick={onOpenThread} className="text-center">
            <div className="relative mx-auto h-[4.25rem] w-[4.25rem] overflow-hidden rounded-full border border-black/8 bg-[#e8ebf0] shadow-[0_8px_16px_rgba(0,0,0,0.06)]">
              <Image src={bowenContact.avatar} alt={bowenContact.name} fill sizes="68px" className="object-cover" />
            </div>
            <p className="mt-2 text-[0.8rem] font-medium text-[#1a1a1d]">{bowenContact.name}</p>
          </button>
        </section>

        <section className="mt-8">
          <div className="overflow-hidden rounded-[1.25rem] bg-white">
            <ConversationRow preview={preview} previewTime={previewTime} onOpenThread={onOpenThread} />
          </div>
        </section>
      </div>
    </>
  );
}

function ConversationRow({
  preview,
  previewTime,
  onOpenThread,
}: {
  preview: string;
  previewTime: string;
  onOpenThread: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onOpenThread}
      className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-[#f8f8fb]"
    >
      <div className="relative h-[3rem] w-[3rem] shrink-0 overflow-hidden rounded-full bg-[#e5e8ee]">
        <Image src={bowenContact.avatar} alt={bowenContact.name} fill sizes="48px" className="object-cover" />
      </div>
      <div className="min-w-0 flex-1 border-b border-black/6 pb-0.5">
        <div className="flex items-center justify-between gap-3">
          <p className="truncate text-[0.96rem] font-semibold text-[#111111]">{bowenContact.name}</p>
          <p className="shrink-0 text-[0.72rem] text-[#8b8b92]">{previewTime}</p>
        </div>
        <p className="mt-0.5 truncate text-[0.8rem] text-[#6d6d74]">{preview}</p>
      </div>
    </button>
  );
}

function MessagesThreadHeader({ onBack }: { onBack: () => void }) {
  return (
    <div className="border-b border-black/6 bg-[rgba(248,248,250,0.96)] px-3 pb-2 pt-2 backdrop-blur-xl">
      <div className="grid grid-cols-[auto_1fr_auto] items-center gap-2">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1 text-[1rem] font-medium text-[#007aff]"
        >
          <span className="text-[1.25rem] leading-none">&#8249;</span>
          <span>Messages</span>
        </button>

        <div className="flex min-w-0 flex-col items-center justify-center">
          <div className="relative h-[2rem] w-[2rem] overflow-hidden rounded-full bg-[#e7eaf0]">
            <Image src={bowenContact.avatar} alt={bowenContact.name} fill sizes="32px" className="object-cover" />
          </div>
          <p className="mt-0.5 truncate text-[0.78rem] font-semibold text-[#111111]">{bowenContact.name}</p>
        </div>

        <div className="w-[4.5rem]" />
      </div>
    </div>
  );
}

function MessageBubble({ message }: { message: MessagesChatMessage }) {
  const outgoing = message.sender === "user";

  return (
    <div className={`flex ${outgoing ? "justify-end" : "justify-start"}`}>
      <div
        className={[
          "max-w-[78%] rounded-[1.45rem] px-3.5 py-2.5 text-[0.9rem] leading-5 shadow-[0_1px_0_rgba(0,0,0,0.04)]",
          outgoing
            ? "rounded-br-[0.45rem] bg-[#0a84ff] text-white"
            : "rounded-bl-[0.45rem] bg-[#e9e9eb] text-[#111111]",
        ].join(" ")}
      >
        {message.text}
      </div>
    </div>
  );
}

function TypingBubble() {
  return (
    <div className="flex justify-start">
      <div className="rounded-[1.35rem] rounded-bl-[0.45rem] bg-[#e9e9eb] px-3 py-3">
        <div className="flex items-center gap-1.5">
          {[0, 1, 2].map((index) => (
            <span
              key={index}
              className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#8b8b92]"
              style={{ animationDelay: `${index * 120}ms` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function MessageComposer({
  draft,
  onChange,
  onSend,
  disabled,
  error,
}: {
  draft: string;
  onChange: (value: string) => void;
  onSend: () => void;
  disabled: boolean;
  error: string | null;
}) {
  return (
    <div className="border-t border-black/6 bg-[rgba(248,248,250,0.98)] px-3 pb-4 pt-2 backdrop-blur-xl">
      {error ? <p className="pb-2 text-[0.72rem] text-[#c24b4b]">{error}</p> : null}
      <form
        className="flex items-end gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          onSend();
        }}
      >
        <div className="flex min-h-[2.7rem] flex-1 items-end rounded-[1.45rem] border border-black/8 bg-white px-3 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.4)]">
          <textarea
            value={draft}
            onChange={(event) => onChange(event.target.value)}
            placeholder="iMessage"
            rows={1}
            className="max-h-28 min-h-[1.2rem] w-full resize-none bg-transparent text-[0.9rem] leading-5 text-[#111111] outline-none placeholder:text-[#9a9aa1]"
          />
        </div>
        <button
          type="submit"
          disabled={!draft.trim() || disabled}
          className="flex h-[2.5rem] w-[2.5rem] items-center justify-center rounded-full bg-[#0a84ff] text-[1rem] text-white transition hover:brightness-105 disabled:bg-[#c7d8ee]"
          aria-label="Send message"
        >
          ↑
        </button>
      </form>
    </div>
  );
}
