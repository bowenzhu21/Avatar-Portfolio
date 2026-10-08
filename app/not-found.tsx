import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex h-full flex-col items-center justify-center bg-[#10171a] px-7 text-center text-white">
      <p className="text-xs uppercase tracking-[0.25em] text-white/50">A little off course</p>
      <h1 className="mt-4 text-3xl font-semibold tracking-tight">Nothing here yet.</h1>
      <p className="mt-4 text-sm leading-6 text-white/70">The work is one tap away.</p>
      <Link href="/projects" className="mt-7 rounded-full border border-white/25 bg-white/10 px-6 py-3 text-sm">Explore projects ↗</Link>
      <Link href="/" className="mt-4 px-5 py-3 text-sm text-white/65">Back home</Link>
    </div>
  );
}
