"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import type { SafariHistoryEntry, SafariQueryResponse } from "@/types";

const startSuggestions = [
  "How old is Bowen",
  "What is Bowen's Zodiac Sign",
  "Where is Bowen From",
  "What is Bowen's Gym Split",
];

function isSafariQueryResponse(payload: unknown): payload is SafariQueryResponse {
  if (!payload || typeof payload !== "object") {
    return false;
  }

  return ["title", "url", "content", "query"].every(
    (key) => typeof (payload as Record<string, unknown>)[key] === "string",
  );
}

export function SafariApp() {
  const [inputValue, setInputValue] = useState("");
  const [history, setHistory] = useState<SafariHistoryEntry[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [isLoading, setIsLoading] = useState(false);

  const currentPage = currentIndex >= 0 ? history[currentIndex] ?? null : null;
  const pageType = isLoading ? "loading" : currentPage?.type ?? "home";

  async function submitQuery(nextQuery?: string) {
    const query = (nextQuery ?? inputValue).trim();

    if (!query || isLoading) {
      return;
    }

    setInputValue(query);
    setIsLoading(true);

    try {
      const response = await fetch("/api/safari-query", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query,
          currentUrl: currentPage?.url ?? null,
        }),
      });

      const rawPayload = await response.text();
      let payload: SafariQueryResponse | { error?: string } | null = null;

      try {
        payload = rawPayload
          ? (JSON.parse(rawPayload) as SafariQueryResponse | { error?: string })
          : null;
      } catch {
        throw new Error("The page could not be loaded right now.");
      }

      const payloadError =
        payload && typeof payload === "object" && "error" in payload && typeof payload.error === "string"
          ? payload.error
          : null;

      if (!payload || !response.ok || payloadError || !isSafariQueryResponse(payload)) {
        throw new Error(payloadError || "The page could not be loaded right now.");
      }

      const nextEntry: SafariHistoryEntry = {
        title: payload.title,
        url: payload.url,
        content: payload.content,
        query: payload.query,
        type: "result",
      };

      setHistory((currentHistory) => {
        const trimmed = currentHistory.slice(0, currentIndex + 1);
        return [...trimmed, nextEntry];
      });
      setCurrentIndex((index) => index + 1);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "The page could not be loaded right now.";

      const errorEntry: SafariHistoryEntry = {
        title: "Unable to Open Page",
        url: "bowen.ai/error",
        query,
        type: "error",
        errorMessage: message,
        content:
          "The browser could not load a result page for that search.\n\nTry reloading or searching with a shorter prompt.",
      };

      setHistory((currentHistory) => {
        const trimmed = currentHistory.slice(0, currentIndex + 1);
        return [...trimmed, errorEntry];
      });
      setCurrentIndex((index) => index + 1);
    } finally {
      setIsLoading(false);
    }
  }

  function goBack() {
    setCurrentIndex((index) => Math.max(-1, index - 1));
  }

  function goForward() {
    setCurrentIndex((index) => Math.min(history.length - 1, index + 1));
  }

  function reload() {
    if (currentPage?.query) {
      void submitQuery(currentPage.query);
    }
  }

  useEffect(() => {
    if (!currentPage) {
      return;
    }

    setInputValue(currentPage.query);
  }, [currentPage]);

  const canGoBack = currentIndex >= 0;
  const canGoForward = currentIndex < history.length - 1 && currentIndex >= 0;

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-[#f4f4f6] text-[#111111]">
      <SafariChrome
        inputValue={inputValue}
        onChange={setInputValue}
        onSubmit={() => void submitQuery()}
        onBack={goBack}
        onForward={goForward}
        onReload={reload}
        canGoBack={canGoBack}
        canGoForward={canGoForward}
        isLoading={isLoading}
      />

      <div className="relative flex-1 overflow-hidden bg-white">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={`${pageType}-${currentPage?.query ?? "home"}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="h-full"
          >
            {pageType === "home" ? (
              <SafariStartPage onSuggestionClick={(query) => void submitQuery(query)} />
            ) : pageType === "loading" ? (
              <SafariLoadingPage query={inputValue} />
            ) : currentPage?.type === "error" ? (
              <SafariErrorPage page={currentPage} onRetry={reload} />
            ) : currentPage ? (
              <SafariResultPage page={currentPage} />
            ) : null}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

function SafariChrome({
  inputValue,
  onChange,
  onSubmit,
  onBack,
  onForward,
  onReload,
  canGoBack,
  canGoForward,
  isLoading,
}: {
  inputValue: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onBack: () => void;
  onForward: () => void;
  onReload: () => void;
  canGoBack: boolean;
  canGoForward: boolean;
  isLoading: boolean;
}) {
  return (
    <div className="border-b border-black/6 bg-[rgba(250,250,252,0.94)] px-3 pb-3 pt-3 backdrop-blur-xl">
      <div className="flex items-center gap-2">
        <BrowserIcon onClick={onBack} disabled={!canGoBack}>
          &#8249;
        </BrowserIcon>
        <BrowserIcon onClick={onForward} disabled={!canGoForward}>
          &#8250;
        </BrowserIcon>

        <form
          className="flex-1 min-w-0"
          onSubmit={(event) => {
            event.preventDefault();
            onSubmit();
          }}
        >
          <div className="flex items-center gap-2 rounded-full border border-black/8 bg-[#ececef] px-3 py-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.4)]">
            <span className="text-[0.78rem] text-[#7c7c82]">⌕</span>
            <input
              value={inputValue}
              onChange={(event) => onChange(event.target.value)}
              placeholder="Search"
              className="w-full bg-transparent text-[0.82rem] text-[#111111] outline-none placeholder:text-[#8b8b92]"
            />
          </div>
        </form>

        <BrowserIcon onClick={onReload} disabled={isLoading}>
          ↻
        </BrowserIcon>
      </div>
    </div>
  );
}

function BrowserIcon({
  children,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex h-8 w-8 items-center justify-center rounded-full text-[1rem] text-[#4d4d55] transition hover:bg-black/4 disabled:opacity-35"
    >
      {children}
    </button>
  );
}

function SafariStartPage({
  onSuggestionClick,
}: {
  onSuggestionClick: (query: string) => void;
}) {
  return (
    <div className="flex h-full flex-col justify-center px-4 pb-8 pt-6">
      <div className="space-y-2">
        {startSuggestions.map((suggestion) => (
          <button
            key={suggestion}
            type="button"
            onClick={() => onSuggestionClick(suggestion)}
            className="block w-full rounded-[1.35rem] border border-black/6 bg-white px-4 py-3 text-left text-[0.82rem] text-[#1d1d22] shadow-[0_10px_24px_rgba(40,40,60,0.05)] transition hover:bg-[#fafafd]"
          >
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  );
}

function SafariLoadingPage({ query }: { query: string }) {
  return (
    <div className="flex h-full flex-col items-center justify-center px-6 text-center">
      <div className="h-9 w-9 animate-pulse rounded-full bg-[#dfe1e8]" />
      <p className="mt-4 text-[0.76rem] font-semibold uppercase tracking-[0.24em] text-[#7c7c82]">
        Loading
      </p>
      <p className="mt-2 max-w-[20rem] text-[0.86rem] leading-6 text-[#2a2a2f]">
        Loading results for “{query}”.
      </p>
    </div>
  );
}

function SafariErrorPage({
  page,
  onRetry,
}: {
  page: SafariHistoryEntry;
  onRetry: () => void;
}) {
  return (
    <div className="h-full overflow-y-auto px-5 pb-6 pt-7">
      <div className="rounded-[1.9rem] border border-[#f1d6d6] bg-[#fff7f7] p-5">
        <p className="text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-[#c05656]">
          Unable to Open Page
        </p>
        <h1 className="mt-2 text-[1.55rem] font-semibold tracking-[-0.04em] text-[#241818]">
          {page.title}
        </h1>
        <p className="mt-1 text-[0.72rem] text-[#8b6d6d]">{page.url}</p>
        <p className="mt-4 text-[0.84rem] leading-6 text-[#3a2f2f]">
          {page.errorMessage ?? page.content}
        </p>
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 rounded-full border border-[#e3c5c5] bg-white px-4 py-2 text-[0.75rem] font-medium text-[#3a2f2f]"
        >
          Reload Page
        </button>
      </div>
    </div>
  );
}

function SafariResultPage({ page }: { page: SafariHistoryEntry }) {
  const blocks = useMemo(() => parseSafariContent(page.content), [page.content]);

  return (
    <div className="h-full overflow-y-auto px-5 pb-7 pt-6">
      <div className="border-b border-black/6 pb-4">
        <p className="text-[0.72rem] text-[#6d6d74]">{page.url}</p>
        <h1 className="mt-1 text-[1.55rem] font-semibold tracking-[-0.045em] text-[#111111]">
          {page.title}
        </h1>
      </div>

      <div className="mt-5 space-y-5">
        {blocks.map((block, index) => {
          if (block.type === "heading") {
            return (
              <h2 key={`${block.type}-${index}`} className="text-[1.02rem] font-semibold tracking-[-0.03em] text-[#151515]">
                {block.content}
              </h2>
            );
          }

          if (block.type === "list") {
            return (
              <ul key={`${block.type}-${index}`} className="space-y-2 pl-4 text-[0.84rem] leading-6 text-[#242428]">
                {block.items.map((item) => (
                  <li key={item} className="list-disc marker:text-[#7d7d86]">
                    {item}
                  </li>
                ))}
              </ul>
            );
          }

          return (
            <p key={`${block.type}-${index}`} className="text-[0.84rem] leading-7 text-[#242428]">
              {block.content}
            </p>
          );
        })}
      </div>
    </div>
  );
}

function parseSafariContent(content: string) {
  return content
    .split(/\n{2,}/)
    .map((chunk) => chunk.trim())
    .filter(Boolean)
    .map((chunk) => {
      const lines = chunk.split("\n").map((line) => line.trim()).filter(Boolean);
      const isList = lines.every((line) => /^[-*•]\s+/.test(line));

      if (isList) {
        return {
          type: "list" as const,
          items: lines.map((line) => line.replace(/^[-*•]\s+/, "")),
        };
      }

      if (/^#{1,3}\s+/.test(chunk)) {
        return {
          type: "heading" as const,
          content: chunk.replace(/^#{1,3}\s+/, ""),
        };
      }

      return {
        type: "paragraph" as const,
        content: chunk,
      };
    });
}
