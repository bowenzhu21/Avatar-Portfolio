"use client";

import { AnimatePresence, motion, useIsPresent, useReducedMotion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import type { Route } from "next";
import clsx from "clsx";
import { ExperienceApp } from "@/components/experience/ExperienceApp";
import { ContactApp } from "@/components/other/ContactApp";
import { MessagesApp } from "@/components/other/MessagesApp";
import type { MessagesThreads } from "@/components/other/MessagesApp";
import { PhoneApp as PhoneAppScreen } from "@/components/other/PhoneApp";
import { SafariApp } from "@/components/other/SafariApp";
import { SettingsApp } from "@/components/other/SettingsApp";
import { SpotifyApp } from "@/components/other/SpotifyApp";
import { PhotosApp } from "@/components/photos/PhotosApp";
import { AdaptApp } from "@/components/projects/AdaptApp";
import { AuraApp } from "@/components/projects/AuraApp";
import { ElbowExoApp } from "@/components/projects/ElbowExoApp";
import { GodProjectApp } from "@/components/projects/GodProjectApp";
import { GymBroApp } from "@/components/projects/GymBroApp";
import { MatrixApp } from "@/components/projects/MatrixApp";
import { RobinTrainApp } from "@/components/projects/RobinTrainApp";
import { SystemsProjectApp } from "@/components/projects/SystemsProjectApp";
import { ResumeApp } from "@/components/resume/ResumeApp";
import { portfolioEntities } from "@/data/portfolio";
import { createPhoneListScreen, derivePhoneScreen, getPhoneParent, resolvePhoneScreen } from "@/utils/phone";
import { usePortfolioStore } from "@/store/usePortfolioStore";
import { getEntityById, getEntityByRoute } from "@/utils/portfolio";
import type {
  ChatContactId,
  MessagesChatMessage,
  MessagesChatResponse,
  PhoneApp,
  PhoneCallMode,
  PortfolioEntity,
} from "@/types";

interface PortfolioRouteViewProps {
  route: string;
}

function PhoneScreenTransition({ children }: { children: React.ReactNode }) {
  const isPresent = useIsPresent();
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, scale: 0.965, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{
        opacity: 0,
        scale: reduceMotion ? 1 : 0.985,
        y: reduceMotion ? 0 : -4,
        transition: { duration: reduceMotion ? 0 : 0.14, ease: "easeIn" },
      }}
      transition={reduceMotion ? { duration: 0 } : {
        type: "spring", stiffness: 360, damping: 34, mass: 0.9,
        opacity: { duration: 0.2, ease: "easeOut" },
      }}
      inert={!isPresent}
      aria-hidden={!isPresent || undefined}
      className="absolute inset-0 flex min-h-0 flex-col"
      style={{ transformOrigin: "50% 40%", pointerEvents: isPresent ? "auto" : "none" }}
    >
      {children}
    </motion.div>
  );
}

const wallpaperStyle = {
  backgroundImage:
    'linear-gradient(180deg,rgba(0,0,0,0.1),rgba(0,0,0,0.2)), url("/iphone_bg.jpeg")',
  backgroundSize: "cover",
  backgroundPosition: "center",
} as const;

const entityIconMap: Partial<Record<string, string>> = {
  modelgate: "/projects/modelgate/cover.webp",
  flightdeck: "/projects/flightdeck/cover.webp",
  clearinghouse: "/projects/clearinghouse/cover.webp",
  matrix: "/icons/matrix.png",
  robintrain: "/icons/robintrain.jpeg",
  "adapt-ui": "/icons/adapt.png",
  apollo: "/icons/apollo_icon.png",
  aphrodite: "/icons/aphrodite_icon.png",
  hermes: "/icons/hermes_icon.png",
  kronos: "/icons/kronos_icon.png",
  "aura-dev": "/icons/aura.jpg",
  "elbow-exo": "/icons/elbow.jpg",
  gymbro: "/icons/gymbro.png",
  stripe: "/icons/stripe.svg",
  heygen: "/icons/heygen.jpeg",
  "hippos-exoskeleton": "/icons/hippos.jpeg",
  momenta: "/icons/momenta.jpeg",
  "jma-consulting": "/icons/jma.jpeg",
  photos: "/icons/photos.png",
  resume: "/icons/resume.jpg",
  school: "/icons/school.jpeg",
  contact: "/icons/contact.webp",
};

const primitiveProjectIds = ["apollo", "aphrodite", "hermes", "kronos"] as const;
const primitiveProjectIdSet = new Set<string>(primitiveProjectIds);

const homeApps: Array<{
  app: Exclude<PhoneApp, "home">;
  label: string;
  icon?: string;
  iconSrc?: string;
  tint: string;
  iconBackgroundClass?: string;
  iconImageClassName?: string;
}> = [
  {
    app: "photos",
    label: "Photos",
    iconSrc: "/icons/photos.webp",
    tint: "from-pink-500 via-fuchsia-400 to-orange-400",
    iconImageClassName: "scale-[1.15] object-contain",
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
    iconSrc: "/icons/resume.jpg",
    tint: "from-amber-300 via-orange-300 to-red-500",
    iconBackgroundClass: "bg-white",
    iconImageClassName: "scale-[1.5] object-contain",
  },
  {
    app: "contact",
    label: "Contact",
    iconSrc: "/icons/contact.webp",
    tint: "from-blue-500 via-sky-400 to-cyan-500",
    iconImageClassName: "scale-[2] object-contain",
  },
  {
    app: "spotify",
    label: "Spotify",
    iconSrc: "/icons/spotify.png",
    tint: "from-[#1ed760] to-[#0b7c35]",
    iconImageClassName: "scale-[1.6] object-cover",
  },
];

function getEntityIconSrc(entityId: string) {
  return entityIconMap[entityId];
}

function getItemsForApp(app: PhoneApp) {
  if (app === "projects") {
    return portfolioEntities.filter(
      (entity) => entity.type === "project" && !primitiveProjectIdSet.has(entity.id),
    );
  }

  if (app === "primitives") {
    return portfolioEntities.filter((entity) => primitiveProjectIdSet.has(entity.id));
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

  if (app === "settings") {
    return [];
  }

  if (app === "spotify") {
    return [];
  }

  return [];
}

function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-[2.45rem] bg-white px-8 py-10">
      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <h1 className="font-display text-[2.25rem] leading-none text-black">{title}</h1>
        <p className="mt-4 text-[0.95rem] font-medium text-black/42">Coming soon</p>
      </div>
    </div>
  );
}

function usePacificTime() {
  const [timeLabel, setTimeLabel] = useState("--:--");
  const [dateBits, setDateBits] = useState({ weekday: "", month: "", day: "" });

  useEffect(() => {
    function updateClock() {
      const now = new Date();
      const timeFormatter = new Intl.DateTimeFormat("en-US", {
        timeZone: "America/Los_Angeles",
        hour: "numeric",
        minute: "2-digit",
        hour12: false,
      });

      const dateFormatter = new Intl.DateTimeFormat("en-US", {
        timeZone: "America/Los_Angeles",
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
  const storedPhoneScreen = usePortfolioStore((state) => state.phoneScreen);
  const activeRoute = usePortfolioStore((state) => state.activeRoute);
  const phoneScreen = resolvePhoneScreen(route, activeRoute, storedPhoneScreen);
  const setPhoneScreen = usePortfolioStore((state) => state.setPhoneScreen);
  const setActiveEntity = usePortfolioStore((state) => state.setActiveEntity);
  const setActiveRoute = usePortfolioStore((state) => state.setActiveRoute);
  const setActiveSection = usePortfolioStore((state) => state.setActiveSection);
  const syncPhoneScreenFromRoute = usePortfolioStore((state) => state.syncPhoneScreenFromRoute);
  const { timeLabel, weekday, month, day } = usePacificTime();
  const [sendingMessageContactId, setSendingMessageContactId] = useState<ChatContactId | null>(null);
  const [messagesError, setMessagesError] = useState<string | null>(null);
  const [messageThreads, setMessageThreads] = useState<MessagesThreads>({
    bowen: [],
    lara: [],
    yalda: [],
    alisha: [],
    pious: [],
  });

  const visibleEntity =
    (phoneScreen.entityId ? getEntityById(phoneScreen.entityId) : null) ?? entity;
  const selectedMessageContactId =
    phoneScreen.app === "messages" ? phoneScreen.contactId : null;
  const currentScreenKey = [
    phoneScreen.app,
    phoneScreen.view,
    phoneScreen.entityId ?? "none",
  ].join(":");

  const projectFolderItems = useMemo(() => getItemsForApp("projects").slice(0, 4), []);
  const primitiveFolderItems = useMemo(() => getItemsForApp("primitives").slice(0, 4), []);
  const experienceFolderItems = useMemo(() => getItemsForApp("experience").slice(0, 4), []);

  function openPhone(
    contactId: ChatContactId | null = null,
    callMode: PhoneCallMode | null = null,
  ) {
    setPhoneScreen({
      app: "phone",
      view: "detail",
      title: "Phone",
      entityId: null,
      route: null,
      card: "overview",
      contactId,
      callMode,
    });
  }

  function openMessages(contactId: ChatContactId | null = null) {
    setPhoneScreen({
      app: "messages",
      view: "detail",
      title: "Messages",
      entityId: null,
      route: null,
      card: "overview",
      contactId,
      callMode: null,
    });
  }

  async function sendChatMessage(contactId: ChatContactId, text: string) {
    const trimmed = text.trim();
    if (!trimmed) {
      return;
    }

    const userMessage: MessagesChatMessage = {
      id: `${contactId}-user-${Date.now()}`,
      sender: "user",
      text: trimmed,
      timestamp: Date.now(),
    };

    const nextThread = [...(messageThreads[contactId] ?? []), userMessage];

    setMessageThreads((current) => ({
      ...current,
      [contactId]: nextThread,
    }));
    setMessagesError(null);
    setSendingMessageContactId(contactId);

    try {
      const response = await fetch("/api/messages-chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contactId,
          messages: nextThread,
        }),
      });

      const payload = (await response.json()) as MessagesChatResponse | { error?: string };

      if (!response.ok || "error" in payload || !("reply" in payload)) {
        throw new Error(("error" in payload && payload.error) || "Message could not be sent.");
      }

      const replyMessage: MessagesChatMessage = {
        id: `${contactId}-contact-${Date.now() + 1}`,
        sender: "contact",
        text: payload.reply,
        timestamp: Date.now() + 1,
      };

      setMessageThreads((current) => ({
        ...current,
        [contactId]: [...current[contactId], replyMessage],
      }));
    } catch (error) {
      setMessagesError(error instanceof Error ? error.message : "Message could not be sent.");
    } finally {
      setSendingMessageContactId((current) => (current === contactId ? null : current));
    }
  }

  function openApp(app: Exclude<PhoneApp, "home">) {
    if (app === "phone") {
      openPhone();
      return;
    }

    if (app === "projects" || app === "primitives" || app === "experience") {
      const nextScreen = createPhoneListScreen(app);
      usePortfolioStore.setState({
        activeRoute: nextScreen.route!, activeEntity: null, activeSection: null,
        activeCard: "overview", phoneScreen: nextScreen,
      });
      if (route !== nextScreen.route) router.push(nextScreen.route as Route);
      return;
    }

    if (app === "messages") {
      openMessages();
      return;
    }

    if (app === "spotify") {
      setPhoneScreen({
        app: "spotify",
        view: "detail",
        title: "Spotify",
        entityId: null,
        route: null,
        card: "overview",
        contactId: null,
        callMode: null,
      });
      return;
    }

    if (app === "settings") {
      setPhoneScreen({
        app,
        view: "detail",
        title: "Settings",
        entityId: null,
        route: null,
        card: "overview",
        contactId: null,
        callMode: null,
      });
      return;
    }

    const appEntity = getItemsForApp(app)[0];

    if (appEntity) {
      openEntity(appEntity);
      return;
    }

    setPhoneScreen(createPhoneListScreen(app));
  }

  function navigateTo(nextRoute: string) {
    usePortfolioStore.setState({
      phoneScreen: derivePhoneScreen({ route: nextRoute }),
      activeRoute: nextRoute, activeEntity: null, activeSection: null, activeCard: "overview",
    });
    if (route !== nextRoute) router.push(nextRoute as Route);
  }

  function goPhoneHome() {
    navigateTo("/");
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
      primitiveFolderItems={primitiveFolderItems}
      experienceFolderItems={experienceFolderItems}
      homeApps={homeApps}
      onOpenApp={openApp}
      onGoHome={goPhoneHome}
      onOpenMessages={() => openMessages()}
      onOpenPhone={() => openApp("phone")}
      onOpenSafari={() =>
        setPhoneScreen({
          app: "safari",
          view: "detail",
          title: "Safari",
          entityId: null,
          route: null,
          card: "overview",
          contactId: null,
          callMode: null,
        })
      }
      onOpenSettings={() => openApp("settings")}
    />
  );

  const showTopBar = phoneScreen.view !== "detail";
  const clipScreenShell = phoneScreen.view !== "home";
  const parent = getPhoneParent(phoneScreen);

  return (
    <div className="relative flex h-full min-h-0 flex-col overflow-hidden rounded-[2.5rem]" style={wallpaperStyle}>
      <AnimatePresence mode="sync">
        <PhoneScreenTransition key={currentScreenKey}>
          {parent ? (
            <nav aria-label="Portfolio navigation" className="shrink-0 bg-black/15 px-5 pb-1 pt-3">
              <button
                type="button"
                onClick={() => navigateTo(parent.route)}
                aria-label={`Back to ${parent.title}`}
                className="glass-surface flex min-h-8 items-center gap-2 rounded-full border bg-white/[0.08] px-3 text-[11px] font-medium text-white/90 transition hover:bg-white/15"
              >
                <span aria-hidden="true" className="text-base leading-none">‹</span>
                <span>{parent.title}</span>
              </button>
            </nav>
          ) : null}
          {showTopBar ? (
            <div className="flex shrink-0 items-center justify-between px-7 pb-4 pt-4 text-[14px] font-semibold text-white">
              <div>
                <span>{timeLabel}</span>
              </div>
              <div className="mr-[-0.5rem] flex items-center text-[12px] text-white/92">
                <Image
                  src="/airplane_mode.png"
                  alt="Airplane mode"
                  width={18}
                  height={18}
                  className="h-[18px] w-[15px] object-contain"
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
                  height={35}
                  className="ml-[0rem] h-[20px] w-[32px] object-contain"
                />
              </div>
            </div>
          ) : null}

          <div
            className={clsx(
              "flex min-h-0 flex-1 flex-col px-0 pb-0",
              clipScreenShell ? "overflow-hidden rounded-[2.35rem]" : null,
            )}
          >
            {phoneScreen.view === "home" ? (
              homeScreen
            ) : phoneScreen.app === "phone" ? (
              <PhoneAppScreen
                initialContactId={phoneScreen.contactId}
                initialCallMode={phoneScreen.callMode}
                onOpenMessages={(contactId) => openMessages(contactId)}
                onUpdateTarget={(contactId, callMode) => openPhone(contactId, callMode)}
              />
            ) : phoneScreen.app === "messages" ? (
              <MessagesApp
                selectedContactId={selectedMessageContactId}
                threads={messageThreads}
                onOpenThread={(contactId) => openMessages(contactId)}
                onCloseThread={() => openMessages(null)}
                onSendMessage={sendChatMessage}
                sendingContactId={sendingMessageContactId}
                error={messagesError}
              />
            ) : phoneScreen.app === "safari" ? (
              <SafariApp />
            ) : phoneScreen.app === "spotify" ? (
              <SpotifyApp />
            ) : phoneScreen.app === "settings" ? (
              <SettingsApp />
            ) : phoneScreen.view === "list" ? (
              phoneScreen.app === "projects" ||
              phoneScreen.app === "primitives" ||
              phoneScreen.app === "experience" ? (
                <div className="relative h-full overflow-hidden rounded-[2rem]">
                  <div aria-hidden="true" inert className="pointer-events-none absolute inset-0 scale-[1.035] blur-[14px] brightness-[0.72]">
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
                <div className="glass-surface-strong flex h-full flex-col rounded-[1.9rem] border bg-black/20 p-4">
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
                          className="glass-surface w-full rounded-[1.5rem] border bg-black/[0.12] px-4 py-4 text-left transition hover:bg-white/10"
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
              visibleEntity.id === "photos" ? (
                <PhotosApp />
              ) : visibleEntity.id === "stripe" ? (
                <ExperienceApp key="stripe" screenId="stripe" />
              ) : visibleEntity.id === "heygen" ? (
                <ExperienceApp screenId="heygen" />
              ) : visibleEntity.id === "hippos-exoskeleton" ? (
                <ExperienceApp screenId="hippos-exoskeleton" />
              ) : visibleEntity.id === "momenta" ? (
                <ExperienceApp screenId="momenta" />
              ) : visibleEntity.id === "jma-consulting" ? (
                <ExperienceApp screenId="jma-consulting" />
              ) : visibleEntity.id === "school" ? (
                <ExperienceApp screenId="school" />
              ) : visibleEntity.id === "modelgate" || visibleEntity.id === "flightdeck" || visibleEntity.id === "clearinghouse" ? (
                <SystemsProjectApp key={visibleEntity.id} projectId={visibleEntity.id} />
              ) : visibleEntity.id === "matrix" ? (
                <MatrixApp />
              ) : visibleEntity.id === "robintrain" ? (
                <RobinTrainApp />
              ) : visibleEntity.id === "elbow-exo" ? (
                <ElbowExoApp />
              ) : visibleEntity.id === "gymbro" ? (
                <GymBroApp />
              ) : visibleEntity.id === "aura-dev" ? (
                <AuraApp />
              ) : visibleEntity.id === "adapt-ui" ? (
                <AdaptApp />
              ) : visibleEntity.id === "apollo" ? (
                <GodProjectApp projectId="apollo" />
              ) : visibleEntity.id === "aphrodite" ? (
                <GodProjectApp projectId="aphrodite" />
              ) : visibleEntity.id === "hermes" ? (
                <GodProjectApp projectId="hermes" />
              ) : visibleEntity.id === "kronos" ? (
                <GodProjectApp projectId="kronos" />
              ) : visibleEntity.id === "resume" ? (
                <ResumeApp />
              ) : visibleEntity.id === "contact" ? (
                <ContactApp />
              ) : (
                <PlaceholderPage title={visibleEntity.title} />
              )
            ) : (
              <div className="glass-surface-strong flex h-full flex-col justify-center rounded-[1.9rem] border bg-black/20 p-6 text-center">
                <p className="text-sm font-medium text-white/82">
                  Open a section from the iPhone homescreen or let the avatar navigate for you.
                </p>
              </div>
            )}
          </div>
        </PhoneScreenTransition>
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
  primitiveFolderItems,
  experienceFolderItems,
  homeApps,
  onOpenApp,
  onGoHome,
  onOpenMessages,
  onOpenPhone,
  onOpenSafari,
  onOpenSettings,
}: {
  timeLabel: string;
  weekday: string;
  month: string;
  day: string;
  projectFolderItems: PortfolioEntity[];
  primitiveFolderItems: PortfolioEntity[];
  experienceFolderItems: PortfolioEntity[];
  homeApps: Array<{
    app: Exclude<PhoneApp, "home">;
    label: string;
    icon?: string;
    iconSrc?: string;
    tint: string;
    iconBackgroundClass?: string;
    iconImageClassName?: string;
  }>;
  onOpenApp: (app: Exclude<PhoneApp, "home">) => void;
  onGoHome: () => void;
  onOpenMessages: () => void;
  onOpenPhone: () => void;
  onOpenSafari: () => void;
  onOpenSettings: () => void;
}) {
  return (
    <div className="flex h-full flex-col px-3 pb-4 pt-2">
      <div className="grid auto-rows-[64px] grid-cols-4 gap-x-3 gap-y-[1.45rem]">
        <div className="glass-surface col-span-2 row-span-2 mx-auto w-[90%] rounded-[1.32rem] border bg-black/25 p-3">
          <div className="flex h-full flex-col items-center justify-center text-center">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/72">PT</p>
            <p className="mt-1 font-display text-[2.1rem] leading-none tracking-tight text-white">
              {timeLabel}
            </p>
            <p className="mt-1 text-[10px] text-white/74">Clock</p>
          </div>
        </div>

        <div className="col-span-2 row-span-2 grid grid-cols-2 gap-x-2.5 gap-y-4">
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

          <AppIcon label="Gods' Hands" tint="from-zinc-700 to-zinc-900" folder onClick={() => onOpenApp("primitives")}>
            {primitiveFolderItems.map((item) => (
              <MiniFolderTile key={item.id} iconSrc={getEntityIconSrc(item.id)} label={item.title}>
                {item.title.slice(0, 1)}
              </MiniFolderTile>
            ))}
          </AppIcon>

          {homeApps
            .filter((app) => app.app === "school")
            .map((app) => (
              <AppIcon
                key={app.app}
                label={app.label}
                icon={app.icon}
                iconSrc={app.iconSrc}
                iconBackgroundClass={app.iconBackgroundClass}
                iconImageClassName={app.iconImageClassName}
                tint={app.tint}
                onClick={() => onOpenApp(app.app)}
              />
            ))}
        </div>

        <div className="col-span-2 row-span-2 grid grid-cols-2 gap-x-2.5 gap-y-4">
          {(["contact", "spotify", "resume", "photos"] as const).map((appId) => {
            const app = homeApps.find((item) => item.app === appId);

            if (!app) {
              return null;
            }

            return (
              <AppIcon
                key={app.app}
                label={app.label}
                icon={app.icon}
                iconSrc={app.iconSrc}
                iconBackgroundClass={app.iconBackgroundClass}
                iconImageClassName={app.iconImageClassName}
                tint={app.tint}
                onClick={() => onOpenApp(app.app)}
              />
            );
          })}
        </div>

        <DateWidget weekday={weekday} month={month} day={day} />
      </div>

      <div className="mt-auto pt-0">
        <div className="glass-surface grid grid-cols-4 gap-x-1.5 gap-y-3 rounded-[1.7rem] border bg-white/[0.08] p-3">
          {[
            { label: "Messages", iconSrc: "/icons/messages.png", tint: "from-emerald-400 to-lime-500", onClick: onOpenMessages },
            { label: "Phone", iconSrc: "/icons/call.webp", tint: "from-green-400 to-emerald-500", onClick: onOpenPhone },
            { label: "Safari", iconSrc: "/icons/safari.jpg", tint: "from-sky-400 to-blue-500", onClick: onOpenSafari },
            { label: "Settings", iconSrc: "/icons/settings.webp", tint: "from-zinc-300 to-zinc-500", onClick: onOpenSettings },
          ].map((dockItem) => (
            <button key={dockItem.label} type="button" onClick={dockItem.onClick} className="text-center transition-transform duration-200 ease-out hover:scale-[1.035] active:scale-[0.94]">
              <div
                className={`mx-auto relative flex h-[56px] w-[56px] items-center justify-center overflow-hidden rounded-[1.15rem] bg-gradient-to-br ${dockItem.tint} shadow-[0_16px_24px_rgba(0,0,0,0.2)]`}
              >
                <Image
                  src={dockItem.iconSrc}
                  alt={dockItem.label}
                  fill
                  className="scale-[1.08] object-cover"
                  sizes="56px"
                />
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
  iconImageClassName,
  tint,
  onClick,
  folder = false,
  children,
}: {
  label: string;
  icon?: string;
  iconSrc?: string;
  iconBackgroundClass?: string;
  iconImageClassName?: string;
  tint: string;
  onClick: () => void;
  folder?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <button type="button" onClick={onClick} className="text-center transition-transform duration-200 ease-out hover:scale-[1.035] active:scale-[0.94]">
      {folder ? (
        <div className="glass-surface mx-auto grid h-[54px] w-[54px] grid-cols-2 gap-[3px] rounded-[0.95rem] border bg-white/15 p-[5px]">
          {children}
        </div>
      ) : (
        <div
          className={`mx-auto relative flex h-[54px] w-[54px] items-center justify-center overflow-hidden rounded-[1rem] ${iconBackgroundClass ?? `bg-gradient-to-br ${tint}`} shadow-[0_16px_24px_rgba(0,0,0,0.22)]`}
        >
          {iconSrc ? (
            <Image
              src={iconSrc}
              alt={label}
              fill
              className={iconImageClassName ?? "scale-[1.08] object-cover"}
              sizes="54px"
            />
          ) : (
            <span className="text-[1.25rem] font-semibold text-white">{icon}</span>
          )}
        </div>
      )}
      <p className="mx-auto mt-1.5 max-w-[76px] text-center text-[8px] font-medium leading-[1.05] text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.45)]">
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
    <div className="glass-surface col-span-2 row-span-2 mx-auto w-[90%] rounded-[1.32rem] border bg-black/25 p-3">
      <div className="flex h-full flex-col items-center justify-center text-center">
        <div className="flex items-center justify-center gap-2 text-[0.8rem] font-semibold">
          <span className="text-red-400">{weekday}</span>
          <span className="text-white/70">{month}</span>
        </div>
        <p className="mt-1 font-display text-[2.55rem] leading-none text-white">{day}</p>
        <p className="mt-1 text-[10px] text-white/58">Pacific Time</p>
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
  const slots = Array.from({ length: 9 }, (_, index) => items[index] ?? null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeRef.current?.focus({ preventScroll: true });
  }, []);

  return (
    <div
      role="dialog"
      aria-label={`${title} folder`}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          event.preventDefault();
          event.stopPropagation();
          onClose();
        }
      }}
      className="absolute inset-0 z-10 flex flex-col items-center px-4 pt-12 sm:px-6 sm:pt-16"
    >
      <button type="button" onClick={onClose} tabIndex={-1} aria-hidden="true" className="absolute inset-0 cursor-default" />
      <div className="relative flex w-full max-w-[320px] items-center justify-center pb-4">
        <h2 className="text-[1.75rem] font-medium tracking-[-0.03em] text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.28)]">
          {title}
        </h2>
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          aria-label={`Close ${title} folder`}
          className="glass-surface absolute right-0 top-0 flex h-9 w-9 items-center justify-center rounded-full border bg-black/15 text-lg text-white/90 transition hover:bg-white/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/80"
        >
          <span aria-hidden="true">×</span>
        </button>
      </div>

      <div className="glass-surface-strong relative h-[340px] w-full max-w-[320px] rounded-[2rem] border bg-white/[0.16] px-3 py-5 sm:px-5">
        <div className="grid h-full grid-cols-3 grid-rows-3 gap-x-3 gap-y-4">
          {slots.map((item, index) =>
            item ? (
              <button key={item.id} type="button" onClick={() => onOpen(item)} className="min-w-0 rounded-xl text-center transition-transform duration-200 ease-out hover:scale-[1.035] active:scale-[0.94] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">
                <div className="relative mx-auto h-[min(68px,17vw)] w-[min(68px,17vw)] overflow-hidden rounded-[1.15rem] bg-white shadow-[0_8px_18px_rgba(0,0,0,0.14)]">
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
                <p className="mt-2 truncate text-[0.62rem] min-[360px]:text-[0.7rem] font-medium leading-tight text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.28)]">
                  {item.title}
                </p>
              </button>
            ) : (
              <div key={`empty-slot-${index}`} className="pointer-events-none" />
            ),
          )}
        </div>
      </div>
    </div>
  );
}
