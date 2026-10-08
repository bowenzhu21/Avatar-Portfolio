"use client";

import Link from "next/link";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div role="alert" className="flex h-full flex-col items-center justify-center bg-[#10171a] px-7 text-center text-white">
      <h1 className="text-3xl font-semibold tracking-tight">A small interruption.</h1>
      <p className="mt-4 text-sm leading-6 text-white/70">This view couldn’t load. Give it another try.</p>
      <button type="button" onClick={reset} className="mt-7 rounded-full border border-white/25 bg-white/10 px-6 py-3 text-sm">Try again</button>
      <Link href="/" className="mt-4 px-5 py-3 text-sm text-white/65">Back home</Link>
    </div>
  );
}
