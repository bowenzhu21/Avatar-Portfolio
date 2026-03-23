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
        <section className="rounded-[2rem] border border-white/40 bg-white/20 p-5 shadow-[0_22px_48px_rgba(27,24,20,0.12)] backdrop-blur-[30px]">
          <p className="text-[0.66rem] font-semibold uppercase tracking-[0.24em] text-[#eef4ff]">
            Contact
          </p>

          <div className="relative mt-4 h-[12.5rem] overflow-hidden rounded-[1.65rem] border border-white/40 shadow-[0_16px_34px_rgba(0,0,0,0.12)]">
              <Image
                src="/photos/1.jpeg"
                alt="Bowen Zhu"
                fill
                sizes="(max-width: 768px) 100vw, 420px"
                className="object-cover"
                priority
              />
          </div>

          <div className="mt-4">
            <h1 className="text-[1.7rem] font-semibold tracking-[-0.05em] text-white">
              Bowen Zhu
            </h1>
            <p className="mt-1 text-[0.82rem] font-medium text-white/82">
              Software Engineer | AI Systems
            </p>
          </div>
        </section>

        <section className="rounded-[2rem] border border-white/40 bg-white/18 p-4 shadow-[0_20px_40px_rgba(27,24,20,0.1)] backdrop-blur-[30px]">
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
    <div className="flex items-center justify-between gap-4 rounded-[1.35rem] border border-white/40 bg-white/26 px-4 py-3.5 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.18)] backdrop-blur-[18px]">
      <span className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-white/70">
        {label}
      </span>
      <span className="max-w-[62%] text-right text-[0.78rem] font-medium text-white">
        {value}
      </span>
    </div>
  );

  if (!href) {
    return content;
  }

  return (
    <a href={href} target={href.startsWith("http") ? "_blank" : undefined} rel={href.startsWith("http") ? "noreferrer" : undefined} className="block transition hover:translate-y-[-1px]">
      {content}
    </a>
  );
}
