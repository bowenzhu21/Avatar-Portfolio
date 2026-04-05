"use client";

import { resumeRecord } from "@/data/resume";

export function ResumeApp() {
  return (
    <div className="h-full overflow-y-auto bg-[#f5f2ea] px-4 pb-6 pt-4 text-[#1f1d1a]">
      <div className="mx-auto w-full max-w-[720px] rounded-[1.7rem] border border-black/8 bg-white px-5 pb-8 pt-5 shadow-[0_18px_40px_rgba(25,20,15,0.08)]">
        <ResumeHeader />
        <ResumeSection title="Skills">
          <div className="space-y-2.5">
            {resumeRecord.skills.map((group) => (
              <p key={group.title} className="text-[0.78rem] leading-5 text-[#302d28]">
                <span className="font-semibold text-[#171411]">{group.title}:</span>{" "}
                {group.bullets.join(", ")}
              </p>
            ))}
          </div>
        </ResumeSection>

        <ResumeSection title="Experience">
          <div className="space-y-4">
            {resumeRecord.experience.map((item) => (
              <div key={`${item.company}-${item.date}`}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-[0.92rem] font-semibold text-[#171411]">{item.company}</h3>
                    <p className="whitespace-nowrap text-[0.74rem] text-[#56514a]">{item.role}</p>
                  </div>
                  <div
                    className={`shrink-0 text-right text-[0.72rem] text-[#6c655d] ${
                      item.company === "Momenta" ? "-ml-1" : ""
                    }`}
                  >
                    <p>{item.date}</p>
                    <p>{item.location}</p>
                  </div>
                </div>
                {item.bullets.length ? (
                  <ul className="mt-2 space-y-1.5 pl-4 text-[0.76rem] leading-5 text-[#2d2925]">
                    {item.bullets.map((bullet) => (
                      <li key={bullet} className="list-disc marker:text-[#80756a]">
                        {bullet}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            ))}
          </div>
        </ResumeSection>

        <ResumeSection title="Projects">
          <div className="space-y-4">
            {resumeRecord.projects.map((project) => (
              <div key={project.title}>
                <div>
                  <h3 className="text-[0.88rem] font-semibold leading-5 text-[#171411]">
                    {project.title}
                  </h3>
                  <a
                    href={project.linkHref}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-0.5 inline-block text-[0.70rem] text-[#6c655d] underline decoration-black/15 underline-offset-2"
                  >
                    {project.linkLabel}
                  </a>
                </div>
                <ul className="mt-2 space-y-1.5 pl-4 text-[0.76rem] leading-5 text-[#2d2925]">
                  {project.bullets.map((bullet) => (
                    <li key={bullet} className="list-disc marker:text-[#80756a]">
                      {bullet}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </ResumeSection>

        <ResumeSection title="Education">
          <div className="space-y-4">
            {resumeRecord.education.map((item) => (
              <div key={`${item.school}-${item.date}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <h3 className="text-[0.92rem] font-semibold text-[#171411]">{item.school}</h3>
                    <p className="whitespace-nowrap text-[0.74rem] text-[#56514a]">{item.degree}</p>
                  </div>
                  <p className="shrink-0 text-right text-[0.7rem] text-[#6c655d]">{item.date}</p>
                </div>
                <ul className="mt-2 space-y-1.5 pl-4 text-[0.76rem] leading-5 text-[#2d2925]">
                  {item.bullets.map((bullet) => (
                    <li key={bullet} className="list-disc marker:text-[#80756a]">
                      {bullet}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </ResumeSection>
      </div>
    </div>
  );
}

function ResumeHeader() {
  return (
    <div className="border-b border-[#d8d2c9] pb-4 text-center">
      <h1 className="text-[2rem] font-semibold tracking-[-0.05em] text-[#12100d]">
        {resumeRecord.name}
      </h1>
      <p className="mt-2 text-[0.72rem] leading-5 text-[#5f584f]">
        {resumeRecord.location} | {resumeRecord.phone} | {resumeRecord.email}
      </p>
      <p className="text-[0.72rem] leading-5 text-[#5f584f]">
        <a href={`https://${resumeRecord.github}`} target="_blank" rel="noreferrer" className="underline decoration-black/12 underline-offset-2">
          {resumeRecord.github}
        </a>{" "}
        |{" "}
        <a href={`https://${resumeRecord.linkedin}`} target="_blank" rel="noreferrer" className="underline decoration-black/12 underline-offset-2">
          {resumeRecord.linkedin}
        </a>
      </p>
      <p className="mt-1 text-[0.78rem] font-medium text-[#3a352e]">{resumeRecord.role}</p>
    </div>
  );
}

function ResumeSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-5">
      <div className="border-b border-[#dad5cd] pb-1">
        <h2 className="text-[0.88rem] font-semibold uppercase tracking-[0.18em] text-[#1a1714]">
          {title}
        </h2>
      </div>
      <div className="pt-3">{children}</div>
    </section>
  );
}
