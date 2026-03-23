"use client";

import Image from "next/image";

const nutritionFitnessBullets = [
  "A cleaner view into routines around training consistency, recovery, and general physical discipline outside of work.",
  "Useful for showing how structure, accountability, and long-term habits show up beyond engineering projects.",
];

export function NutritionFitnessApp() {
  return (
    <div className="h-full overflow-y-auto bg-[linear-gradient(180deg,#f7fbf5_0%,#eef8f0_44%,#f7f3ea_100%)] px-4 pb-6 pt-5">
      <div className="space-y-4">
        <section className="rounded-[2rem] border border-black/6 bg-white/44 p-5 shadow-[0_18px_40px_rgba(27,24,20,0.06)] backdrop-blur-[26px]">
          <p className="text-[0.66rem] font-semibold uppercase tracking-[0.24em] text-[#4d8d57]">
            Lifestyle
          </p>
          <h1 className="mt-1 text-[1.7rem] font-semibold tracking-[-0.05em] text-[#161310]">
            Nutrition &amp; Fitness
          </h1>
          <p className="mt-3 text-[0.82rem] leading-6 text-[#2f2a25]">
            A personal layer of the portfolio focused on health, discipline, consistency, and
            the routines that support strong energy outside of work.
          </p>
        </section>

        <section className="grid grid-cols-2 gap-3">
          <div className="rounded-[1.8rem] border border-black/6 bg-white/38 p-4 shadow-[0_18px_34px_rgba(27,24,20,0.05)] backdrop-blur-[24px]">
            <div className="relative mx-auto h-20 w-20 overflow-hidden rounded-[1.4rem] bg-white shadow-[0_12px_24px_rgba(0,0,0,0.06)]">
              <Image
                src="/icons/nutrition.png"
                alt="Nutrition"
                fill
                sizes="80px"
                className="object-cover"
                priority
              />
            </div>
            <p className="mt-3 text-center text-[0.92rem] font-semibold tracking-[-0.03em] text-[#171411]">
              Nutrition
            </p>
            <p className="mt-1 text-center text-[0.76rem] leading-5 text-[#5f584f]">
              Meal structure, consistency, and habits that support training and recovery.
            </p>
          </div>

          <div className="rounded-[1.8rem] border border-black/6 bg-white/38 p-4 shadow-[0_18px_34px_rgba(27,24,20,0.05)] backdrop-blur-[24px]">
            <div className="relative mx-auto h-20 w-20 overflow-hidden rounded-[1.4rem] bg-white shadow-[0_12px_24px_rgba(0,0,0,0.06)]">
              <Image
                src="/icons/fitness.avif"
                alt="Fitness"
                fill
                sizes="80px"
                className="object-cover"
                priority
              />
            </div>
            <p className="mt-3 text-center text-[0.92rem] font-semibold tracking-[-0.03em] text-[#171411]">
              Fitness
            </p>
            <p className="mt-1 text-center text-[0.76rem] leading-5 text-[#5f584f]">
              Training, effort, and momentum built through consistent physical routines.
            </p>
          </div>
        </section>

        <section className="rounded-[2rem] border border-black/6 bg-white/36 p-4 shadow-[0_18px_36px_rgba(27,24,20,0.05)] backdrop-blur-[26px]">
          <h2 className="text-[0.95rem] font-semibold tracking-[-0.03em] text-[#171411]">
            Why It Matters
          </h2>
          <ul className="mt-3 space-y-2.5">
            {nutritionFitnessBullets.map((bullet) => (
              <li
                key={bullet}
                className="rounded-[1.35rem] border border-black/5 bg-white/48 px-4 py-3.5 text-[0.78rem] leading-5 text-[#2d2823]"
              >
                <div className="flex gap-3">
                  <span className="mt-[0.42rem] h-1.5 w-1.5 shrink-0 rounded-full bg-[#5eb46d]" />
                  <span>{bullet}</span>
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
