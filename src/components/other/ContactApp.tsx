"use client";

import Image from "next/image";
import { resumeRecord } from "@/data/resume";

export function ContactApp() {
  return (
    <div
      className="h-full overflow-y-auto bg-[#d9d3cd] bg-cover bg-center bg-no-repeat px-4 pb-6 pt-5"
      style={{
        backgroundImage:
          'linear-gradient(180deg,rgba(255,251,247,0.18),rgba(236,226,216,0.18)),url("/contact/contact_bg.jpg")',
      }}
    >
      <div className="space-y-4">
        <section className="relative overflow-hidden rounded-[2rem] border border-white/26 bg-white/10 p-5 shadow-[0_18px_40px_rgba(27,24,20,0.08)] backdrop-blur-[34px]">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/85 to-transparent" />
          <div className="absolute left-5 top-0 h-20 w-40 rounded-full bg-white/20 blur-2xl" />
          <div className="absolute right-0 top-6 h-24 w-28 rounded-full bg-sky-100/12 blur-2xl" />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02)_48%,rgba(255,255,255,0.01))]" />
          <p className="text-[0.66rem] font-semibold uppercase tracking-[0.24em] text-[#eef4ff]">
            Contact
          </p>

          <div className="relative mt-4 h-[12.5rem] overflow-hidden rounded-[1.65rem] border border-white/28 shadow-[0_14px_30px_rgba(0,0,0,0.08)]">
              <div className="absolute inset-x-0 top-0 z-10 h-px bg-gradient-to-r from-transparent via-white/85 to-transparent" />
              <div className="absolute left-0 top-0 z-10 h-16 w-24 rounded-full bg-white/16 blur-xl" />
              <Image
                src="/photos/1.jpeg"
                alt="Bowen Zhu"
                fill
                sizes="(max-width: 768px) 100vw, 420px"
                className="object-cover"
                priority
              />
          </div>

          <div className="relative mt-4">
            <h1 className="text-[1.7rem] font-semibold tracking-[-0.05em] text-white">
              Bowen Zhu
            </h1>
            <p className="mt-1 text-[0.82rem] font-medium text-white/82">
              {resumeRecord.role}
            </p>
          </div>
        </section>

        <section className="relative overflow-hidden rounded-[2rem] border border-white/24 bg-white/9 p-4 shadow-[0_18px_36px_rgba(27,24,20,0.08)] backdrop-blur-[34px]">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/82 to-transparent" />
          <div className="absolute left-6 top-0 h-16 w-32 rounded-full bg-white/16 blur-2xl" />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02)_52%,rgba(255,255,255,0.01))]" />
          <div className="space-y-2.5">
            <ContactRow label="Email" value={resumeRecord.email} href={`mailto:${resumeRecord.email}`} />
            <ContactRow label="Phone" value={resumeRecord.phone} href={`tel:${resumeRecord.phone.replace(/[^\d+]/g, "")}`} />
            <ContactRow
              label="LinkedIn"
              value={resumeRecord.linkedin}
              href={`https://${resumeRecord.linkedin}`}
            />
            <ContactRow
              label="GitHub"
              value={resumeRecord.github}
              href={`https://${resumeRecord.github}`}
            />
            <ContactRow label="Location" value={resumeRecord.location} />
          </div>
        </section>
      </div>
    </div>
  );
}

function ContactRow({
  label,
  value,
  href,
}: {
  label: string;
  value: string;
  href?: string;
}) {
  const content = (
    <div className="relative overflow-hidden rounded-[1.35rem] border border-white/22 bg-white/8 px-4 py-3.5 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.24)] backdrop-blur-[20px]">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/80 to-transparent" />
      <div className="absolute left-3 top-0 h-10 w-20 rounded-full bg-white/14 blur-xl" />
      <div className="relative flex items-center justify-between gap-4">
      <span className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-white/70">
        {label}
      </span>
      <span className="max-w-[62%] text-right text-[0.78rem] font-medium text-white">
        {value}
      </span>
      </div>
    </div>
  );

  if (!href) {
    return content;
  }

  return (
    <a href={href} target={href.startsWith("http") ? "_blank" : undefined} rel={href.startsWith("http") ? "noreferrer" : undefined} className="block transition hover:translate-y-[-1px] hover:brightness-[1.04]">
      {content}
    </a>
  );
}
