"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import type { Route } from "next";
import { portfolioEntities } from "@/data/portfolio";
import { createPhoneListScreen } from "@/utils/phone";
import { usePortfolioStore } from "@/store/usePortfolioStore";
import { getEntityById, getEntityByRoute } from "@/utils/portfolio";
import type { PhoneApp, PortfolioEntity } from "@/types";

interface PortfolioRouteViewProps {
  route: string;
}

const wallpaperStyle = {
  backgroundImage:
    'linear-gradient(180deg,rgba(0,0,0,0.1),rgba(0,0,0,0.2)), url("/iphone_bg.jpeg")',
  backgroundSize: "cover",
  backgroundPosition: "center",
} as const;

const entityIconMap: Partial<Record<string, string>> = {
  matrix: "/icons/matrix.png",
  "adapt-ui": "/icons/adapt.png",
  "aura-dev": "/icons/aura.png",
  "elbow-exo": "/icons/elbow.png",
  gymbro: "/icons/gymbro.png",
  heygen: "/icons/heygen.jpeg",
  "hippos-exoskeleton": "/icons/hippos.jpeg",
  momenta: "/icons/momenta.jpeg",
  "jma-consulting": "/icons/jma.jpeg",
  photos: "/icons/photos.png",
  resume: "/icons/resume.png",
  school: "/icons/school.jpeg",
  contact: "/icons/contact.webp",
  hobbies: "/icons/hobbies.avif",
};

const homeApps: Array<{
  app: Exclude<PhoneApp, "home">;
  label: string;
  icon?: string;
  iconSrc?: string;
  tint: string;
  iconBackgroundClass?: string;
}> = [
  {
    app: "photos",
    label: "Photos",
    iconSrc: "/icons/photos.png",
    tint: "from-pink-500 via-fuchsia-400 to-orange-400",
  },
  {
    app: "school",
    label: "School",
    iconSrc: "/icons/school.jpeg",
    tint: "from-violet-500 via-fuchsia-400 to-purple-600",
  },
  {
    app: "resume",
    label: "Resume",
    iconSrc: "/icons/resume.png",
    tint: "from-amber-300 via-orange-300 to-red-500",
    iconBackgroundClass: "bg-white",
  },
  {
    app: "contact",
    label: "Contact",
    iconSrc: "/icons/contact.webp",
    tint: "from-blue-500 via-sky-400 to-cyan-500",
  },
  {
    app: "hobbies",
    label: "Hobbies",
    iconSrc: "/icons/hobbies.avif",
    tint: "from-pink-500 via-rose-400 to-red-500",
  },
];

function getEntityIconSrc(entityId: string) {
  return entityIconMap[entityId];
}

function getItemsForApp(app: PhoneApp) {
  if (app === "projects") {
    return portfolioEntities.filter((entity) => entity.type === "project");
  }

  if (app === "experience") {
    return portfolioEntities.filter((entity) => entity.type === "experience");
  }

  if (app === "school") {
    return portfolioEntities.filter((entity) => entity.route === "/school");
  }

  if (app === "photos") {
    return portfolioEntities.filter((entity) => entity.route === "/photos");
  }

  if (app === "resume") {
    return portfolioEntities.filter((entity) => entity.route === "/resume");
  }

  if (app === "contact") {
    return portfolioEntities.filter((entity) => entity.route === "/contact");
  }

  if (app === "hobbies") {
    return portfolioEntities.filter((entity) => entity.route === "/hobbies");
  }

  return [];
}

function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="flex h-full flex-col rounded-[1.9rem] bg-white p-8">
      <div className="border-b border-black/8 pb-5">
        <p className="text-[11px] uppercase tracking-[0.28em] text-black/35">Placeholder Page</p>
        <h1 className="mt-3 font-display text-[2.25rem] leading-none text-black">{title}</h1>
      </div>
    </div>
  );
}

function useEasternTime() {
  const [timeLabel, setTimeLabel] = useState("--:--");
  const [dateBits, setDateBits] = useState({ weekday: "", month: "", day: "" });

  useEffect(() => {
    function updateClock() {
      const now = new Date();
      const timeFormatter = new Intl.DateTimeFormat("en-US", {
        timeZone: "America/New_York",
        hour: "numeric",
        minute: "2-digit",
        hour12: false,
      });

      const dateFormatter = new Intl.DateTimeFormat("en-US", {
        timeZone: "America/New_York",
        weekday: "short",
        month: "short",
        day: "numeric",
      });

      const formattedTime = timeFormatter.format(now);
      const parts = dateFormatter.formatToParts(now);
      const weekday = parts.find((part) => part.type === "weekday")?.value ?? "";
      const month = parts.find((part) => part.type === "month")?.value ?? "";
      const day = parts.find((part) => part.type === "day")?.value ?? "";

      setTimeLabel(formattedTime);
      setDateBits({ weekday, month, day });
    }

    updateClock();
    const intervalId = window.setInterval(updateClock, 1000);
    return () => window.clearInterval(intervalId);
  }, []);

  return {
    timeLabel,
    ...dateBits,
  };
}

export function PortfolioRouteView({ route }: PortfolioRouteViewProps) {
  const router = useRouter();
  const entity = getEntityByRoute(route);
  const phoneScreen = usePortfolioStore((state) => state.phoneScreen);
  const setPhoneScreen = usePortfolioStore((state) => state.setPhoneScreen);
  const setActiveEntity = usePortfolioStore((state) => state.setActiveEntity);
  const setActiveRoute = usePortfolioStore((state) => state.setActiveRoute);
  const setActiveSection = usePortfolioStore((state) => state.setActiveSection);
  const syncPhoneScreenFromRoute = usePortfolioStore((state) => state.syncPhoneScreenFromRoute);
  const { timeLabel, weekday, month, day } = useEasternTime();

  const visibleEntity =
    (phoneScreen.entityId ? getEntityById(phoneScreen.entityId) : null) ?? entity;
  const currentScreenKey = [
    phoneScreen.app,
    phoneScreen.view,
    phoneScreen.entityId ?? "none",
  ].join(":");

  const projectFolderItems = useMemo(() => getItemsForApp("projects").slice(0, 4), []);
  const experienceFolderItems = useMemo(() => getItemsForApp("experience").slice(0, 4), []);

  function openApp(app: Exclude<PhoneApp, "home">) {
    setPhoneScreen(createPhoneListScreen(app));
  }

  function goPhoneHome() {
    setPhoneScreen({
      app: "home",
      view: "home",
      title: "Bowen",
      entityId: null,
      route: "/",
      card: "overview",
    });
    setActiveRoute("/");
    setActiveEntity(null);
    setActiveSection(null);
    router.push("/" as Route);
  }

  function openEntity(nextEntity: PortfolioEntity) {
    setActiveRoute(nextEntity.route);
    setActiveEntity(nextEntity);
    setActiveSection(nextEntity.sections[0]?.id ?? null);
    syncPhoneScreenFromRoute(nextEntity.route, nextEntity, "overview");
    router.push(nextEntity.route as Route);
  }

  const homeScreen = (
    <HomeScreen
      timeLabel={timeLabel}
      weekday={weekday}
      month={month}
      day={day}
      projectFolderItems={projectFolderItems}
      experienceFolderItems={experienceFolderItems}
      homeApps={homeApps}
      onOpenApp={openApp}
      onGoHome={goPhoneHome}
    />
  );

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-[3rem]" style={wallpaperStyle}>
      <div className="flex items-center justify-between px-7 pb-4 pt-4 text-[14px] font-semibold text-white">
        <div>
          <span>{timeLabel}</span>
        </div>
        <div className="mr-[-0.2rem] flex items-center text-[12px] text-white/92">
          <Image
            src="/airplane_mode.png"
            alt="Airplane mode"
            width={18}
            height={18}
            className="h-[18px] w-[18px] object-contain"
          />
          <Image
            src="/wifi.png"
            alt="Wi-Fi"
            width={20}
            height={15}
            className="ml-[0.32rem] h-[15px] w-[20px] object-contain"
          />
          <Image
            src="/battery.png"
            alt="Battery"
            width={36}
            height={17}
            className="ml-[0.04rem] h-[17px] w-[36px] object-contain"
          />
        </div>
      </div>

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={currentScreenKey}
          initial={{ opacity: 0, scale: 0.955 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.972 }}
          transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-1 flex-col px-0 pb-0"
        >
          {phoneScreen.view === "home" ? (
            homeScreen
          ) : phoneScreen.view === "list" ? (
            phoneScreen.app === "projects" || phoneScreen.app === "experience" ? (
              <div className="relative h-full overflow-hidden rounded-[2rem]">
                <div className="pointer-events-none absolute inset-0 scale-[1.035] blur-[14px] brightness-[0.72]">
                  {homeScreen}
                </div>
                <div className="absolute inset-0 bg-black/14" />
                <FolderGrid
                  title={phoneScreen.title}
                  items={getItemsForApp(phoneScreen.app)}
                  onOpen={openEntity}
                  getIconSrc={getEntityIconSrc}
                  onClose={goPhoneHome}
                />
              </div>
            ) : (
              <div className="flex h-full flex-col rounded-[1.9rem] border border-white/12 bg-black/34 p-4 shadow-[0_18px_45px_rgba(0,0,0,0.28)] backdrop-blur-xl">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-transparent">Home</span>
                    <span className="text-base font-semibold text-white">{phoneScreen.title}</span>
                    <span className="text-sm text-white/68">
                      {getItemsForApp(phoneScreen.app).length}
                    </span>
                  </div>

                  <div className="mt-5 space-y-3">
                    {getItemsForApp(phoneScreen.app).map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => openEntity(item)}
                        className="w-full rounded-[1.5rem] border border-white/12 bg-black/24 px-4 py-4 text-left backdrop-blur-lg transition hover:border-white/24"
                      >
                        <div className="flex items-center gap-3">
                          {getEntityIconSrc(item.id) ? (
                            <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-[0.95rem]">
                              <Image
                                src={getEntityIconSrc(item.id)!}
                                alt={item.title}
                                fill
                                className="object-cover"
                                sizes="48px"
                              />
                            </div>
                          ) : null}
                          <p className="text-sm font-semibold text-white">{item.title}</p>
                        </div>
                      </button>
                    ))}
                  </div>
              </div>
            )
          ) : visibleEntity ? (
            <PlaceholderPage title={visibleEntity.title} />
          ) : (
            <div className="flex h-full flex-col justify-center rounded-[1.9rem] border border-white/12 bg-black/30 p-6 text-center backdrop-blur-xl">
              <p className="text-sm font-medium text-white/82">
                Open a section from the iPhone homescreen or let the avatar navigate for you.
              </p>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function HomeScreen({
  timeLabel,
  weekday,
  month,
  day,
  projectFolderItems,
  experienceFolderItems,
  homeApps,
  onOpenApp,
  onGoHome,
}: {
  timeLabel: string;
  weekday: string;
  month: string;
  day: string;
  projectFolderItems: PortfolioEntity[];
  experienceFolderItems: PortfolioEntity[];
  homeApps: Array<{
    app: Exclude<PhoneApp, "home">;
    label: string;
    icon?: string;
    iconSrc?: string;
    tint: string;
    iconBackgroundClass?: string;
  }>;
  onOpenApp: (app: Exclude<PhoneApp, "home">) => void;
  onGoHome: () => void;
}) {
  return (
    <div className="flex h-full flex-col px-2 pb-2">
      <div className="grid auto-rows-[64px] grid-cols-4 gap-x-4 gap-y-4">
        <div className="col-span-2 row-span-2 mx-auto w-[86%] rounded-[1.32rem] border border-white/12 bg-black/68 p-3 shadow-[0_18px_45px_rgba(0,0,0,0.28)] backdrop-blur-md">
          <div className="flex h-full flex-col items-center justify-center text-center">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/72">EST</p>
            <p className="mt-1 font-display text-[2.1rem] leading-none tracking-tight text-white">
              {timeLabel}
            </p>
            <p className="mt-1 text-[10px] text-white/74">Clock</p>
          </div>
        </div>

        <div className="col-span-2 row-span-2 grid grid-cols-2 gap-4">
          <AppIcon label="Projects" tint="from-zinc-700 to-zinc-900" folder onClick={() => onOpenApp("projects")}>
            {projectFolderItems.map((item) => (
              <MiniFolderTile key={item.id} iconSrc={getEntityIconSrc(item.id)} label={item.title}>
                {item.title.slice(0, 1)}
              </MiniFolderTile>
            ))}
          </AppIcon>

          <AppIcon label="Experience" tint="from-zinc-700 to-zinc-900" folder onClick={() => onOpenApp("experience")}>
            {experienceFolderItems.map((item) => (
              <MiniFolderTile key={item.id} iconSrc={getEntityIconSrc(item.id)} label={item.title}>
                {item.title.slice(0, 1)}
              </MiniFolderTile>
            ))}
          </AppIcon>

          {homeApps
            .filter((app) => app.app === "photos" || app.app === "school")
            .map((app) => (
              <AppIcon
                key={app.app}
                label={app.label}
                icon={app.icon}
                iconSrc={app.iconSrc}
                iconBackgroundClass={app.iconBackgroundClass}
                tint={app.tint}
                onClick={() => onOpenApp(app.app)}
              />
            ))}
        </div>

        <div className="col-span-2 row-span-2 grid grid-cols-2 gap-4">
          {homeApps
            .filter((app) => app.app === "resume" || app.app === "contact" || app.app === "hobbies")
            .map((app) => (
              <AppIcon
                key={app.app}
                label={app.label}
                icon={app.icon}
                iconSrc={app.iconSrc}
                iconBackgroundClass={app.iconBackgroundClass}
                tint={app.tint}
                onClick={() => onOpenApp(app.app)}
              />
            ))}
          <AppIcon label="More" iconSrc="/icons/more.jpg" tint="from-slate-500 via-slate-400 to-slate-600" onClick={onGoHome} />
        </div>

        <DateWidget weekday={weekday} month={month} day={day} />
      </div>

      <div className="mt-auto pt-5">
        <div className="grid grid-cols-4 gap-3 rounded-[1.7rem] border border-white/12 bg-black/30 p-3 shadow-[0_20px_45px_rgba(0,0,0,0.26)] backdrop-blur-xl">
          {[
            { label: "Messages", icon: "●", tint: "from-emerald-400 to-lime-500" },
            { label: "Phone", icon: "⌕", tint: "from-green-400 to-emerald-500" },
            { label: "Safari", icon: "◌", tint: "from-sky-400 to-blue-500" },
            { label: "Music", icon: "◉", tint: "from-emerald-400 to-green-500" },
          ].map((dockItem) => (
            <button key={dockItem.label} type="button" onClick={onGoHome} className="text-center">
              <div
                className={`mx-auto flex h-[56px] w-[56px] items-center justify-center rounded-[1.15rem] bg-gradient-to-br ${dockItem.tint} shadow-[0_16px_24px_rgba(0,0,0,0.2)]`}
              >
                <span className="text-lg font-semibold text-white">{dockItem.icon}</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function AppIcon({
  label,
  icon,
  iconSrc,
  iconBackgroundClass,
  tint,
  onClick,
  folder = false,
  children,
}: {
  label: string;
  icon?: string;
  iconSrc?: string;
  iconBackgroundClass?: string;
  tint: string;
  onClick: () => void;
  folder?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <button type="button" onClick={onClick} className="text-center">
      {folder ? (
        <div className="mx-auto grid h-[54px] w-[54px] grid-cols-2 gap-[3px] rounded-[0.95rem] bg-[rgba(176,181,191,0.58)] p-[5px] shadow-[0_10px_18px_rgba(0,0,0,0.12)] backdrop-blur-md">
          {children}
        </div>
      ) : (
        <div
          className={`mx-auto relative flex h-[54px] w-[54px] items-center justify-center overflow-hidden rounded-[1rem] ${iconBackgroundClass ?? `bg-gradient-to-br ${tint}`} shadow-[0_16px_24px_rgba(0,0,0,0.22)]`}
        >
          {iconSrc ? (
            <Image src={iconSrc} alt={label} fill className="object-cover" sizes="54px" />
          ) : (
            <span className="text-[1.25rem] font-semibold text-white">{icon}</span>
          )}
        </div>
      )}
      <p className="mt-1.5 text-center text-[8px] font-medium leading-none text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.45)]">
        {label}
      </p>
    </button>
  );
}

function MiniFolderTile({
  children,
  iconSrc,
  label,
}: {
  children: React.ReactNode;
  iconSrc?: string;
  label?: string;
}) {
  return (
    <div className="relative flex items-center justify-center overflow-hidden rounded-[0.5rem] bg-white/85 shadow-[inset_0_1px_0_rgba(255,255,255,0.65)]">
      {iconSrc ? (
        <Image src={iconSrc} alt={label ?? "Folder item"} fill className="object-cover" sizes="20px" />
      ) : (
        <span className="text-[10px] font-semibold text-white">{children}</span>
      )}
    </div>
  );
}

function DateWidget({
  weekday,
  month,
  day,
}: {
  weekday: string;
  month: string;
  day: string;
}) {
  return (
    <div className="col-span-2 row-span-2 mx-auto w-[86%] rounded-[1.32rem] border border-white/12 bg-black/74 p-3 shadow-[0_18px_45px_rgba(0,0,0,0.28)] backdrop-blur-md">
      <div className="flex h-full flex-col items-center justify-center text-center">
        <div className="flex items-center justify-center gap-2 text-[0.8rem] font-semibold">
          <span className="text-red-400">{weekday}</span>
          <span className="text-white/70">{month}</span>
        </div>
        <p className="mt-1 font-display text-[2.55rem] leading-none text-white">{day}</p>
        <p className="mt-1 text-[10px] text-white/58">Eastern Time</p>
      </div>
    </div>
  );
}

function FolderGrid({
  title,
  items,
  onOpen,
  getIconSrc,
  onClose,
}: {
  title: string;
  items: PortfolioEntity[];
  onOpen: (entity: PortfolioEntity) => void;
  getIconSrc: (entityId: string) => string | undefined;
  onClose: () => void;
}) {
  return (
    <div className="absolute inset-0 z-10 flex flex-col items-center px-6 pt-16">
      <div className="relative flex w-full items-center justify-center pb-4">
        <h2 className="text-[1.75rem] font-medium tracking-[-0.03em] text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.28)]">
          {title}
        </h2>
      </div>

      <div className="w-full max-w-[265px] rounded-[2rem] bg-[linear-gradient(180deg,rgba(214,201,196,0.78),rgba(194,189,197,0.72))] px-5 py-6 shadow-[0_22px_50px_rgba(0,0,0,0.24)] backdrop-blur-2xl">
        <div className="grid grid-cols-3 gap-x-4 gap-y-5">
        {items.map((item) => (
          <button key={item.id} type="button" onClick={() => onOpen(item)} className="text-center">
            <div className="relative mx-auto h-[68px] w-[68px] overflow-hidden rounded-[1.15rem] bg-white shadow-[0_8px_18px_rgba(0,0,0,0.14)]">
              {getIconSrc(item.id) ? (
                <Image
                  src={getIconSrc(item.id)!}
                  alt={item.title}
                  fill
                  className="object-cover"
                  sizes="68px"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-200 to-slate-400">
                  <span className="text-xl font-semibold text-slate-700">{item.title.slice(0, 1)}</span>
                </div>
              )}
            </div>
            <p className="mt-2 text-[0.7rem] font-medium leading-tight text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.28)]">
              {item.title}
            </p>
          </button>
        ))}
        </div>
      </div>
    </div>
  );
}
