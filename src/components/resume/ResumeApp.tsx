"use client";

import { resumeRecord } from "@/data/resume";

export function ResumeApp() {
  return (
    <div className="h-full overflow-y-auto rounded-[2.45rem] bg-[#f5f2ea] px-4 pb-6 pt-4 text-[#1f1d1a]">
      <div className="mx-auto w-full max-w-[720px] rounded-[1.7rem] border border-black/8 bg-white px-5 pb-8 pt-5 shadow-[0_18px_40px_rgba(25,20,15,0.08)]">
        <ResumeHeader />

        <ResumeSection title="Education">
          {resumeRecord.education.map((item) => (
            <div key={item.school} className="space-y-1">
              <h3 className="text-[0.92rem] font-semibold text-[#171411]">{item.school}</h3>
              <p className="text-[0.74rem] leading-5 text-[#56514a]">{item.degree}</p>
              <p className="text-[0.7rem] text-[#6c655d]">{item.date}</p>
              <p className="pt-1 text-[0.74rem] leading-5 text-[#56514a]">{item.honours}</p>
            </div>
          ))}
        </ResumeSection>

        <ResumeSection title="Experience">
          <div className="space-y-5">
            {resumeRecord.experience.map((item) => (
              <div key={item.company} className="space-y-1">
                <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                  <h3 className="text-[0.92rem] font-semibold text-[#171411]">{item.company}</h3>
                  <p className="text-[0.7rem] text-[#6c655d]">{item.date}</p>
                </div>
                <p className="text-[0.74rem] leading-5 text-[#56514a]">{item.role}</p>
                <p className="text-[0.7rem] text-[#6c655d]">{item.location}</p>
              </div>
            ))}
          </div>
        </ResumeSection>

        <ResumeSection title="Projects">
          <div className="space-y-4">
            {resumeRecord.projects.map((project) => (
              <div key={project.title} className="space-y-1">
                <h3 className="text-[0.88rem] font-semibold text-[#171411]">{project.title}</h3>
                <p className="text-[0.74rem] leading-5 text-[#56514a]">{project.context}</p>
              </div>
            ))}
          </div>
        </ResumeSection>

        <ResumeSection title="Skills & Awards">
          <div className="space-y-3">
            {resumeRecord.skills.map((group) => (
              <p key={group.title} className="text-[0.74rem] leading-5 text-[#56514a]">
                <span className="font-semibold text-[#171411]">{group.title}:</span>{" "}
                {group.items.join(", ")}
              </p>
            ))}
            <p className="text-[0.74rem] leading-5 text-[#56514a]">
              <span className="font-semibold text-[#171411]">Awards:</span>{" "}
              {resumeRecord.awards}
            </p>
          </div>
        </ResumeSection>
      </div>
    </div>
  );
}

function ResumeHeader() {
  const links = [
    { label: resumeRecord.website, href: `https://${resumeRecord.website}` },
    { label: resumeRecord.github, href: `https://${resumeRecord.github}` },
    { label: resumeRecord.email, href: `mailto:${resumeRecord.email}` },
    { label: resumeRecord.linkedin, href: `https://${resumeRecord.linkedin}` },
  ];

  return (
    <div className="border-b border-[#d8d2c9] pb-4 text-center">
      <h1 className="text-[2rem] font-semibold tracking-[-0.05em] text-[#12100d]">{resumeRecord.name}</h1>
      <div className="mt-2 flex flex-col items-center gap-0.5 text-[0.7rem] leading-5 text-[#5f584f]">
        {links.map((link) => (
          <a key={link.href} href={link.href} target="_blank" rel="noreferrer" className="break-all underline decoration-black/12 underline-offset-2 hover:text-[#171411]">
            {link.label}
          </a>
        ))}
      </div>
    </div>
  );
}

function ResumeSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-5">
      <div className="border-b border-[#dad5cd] pb-1">
        <h2 className="text-[0.88rem] font-semibold uppercase tracking-[0.18em] text-[#1a1714]">{title}</h2>
      </div>
      <div className="pt-3">{children}</div>
    </section>
  );
}
