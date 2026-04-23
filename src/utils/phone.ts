import { siteConfig } from "@/config/site";
import { getEntityByRoute } from "@/utils/portfolio";
import type { CardType, PhoneScreenState, PortfolioEntity } from "@/types";

const detailAppTitleMap = {
  phone: "Phone",
  messages: "Messages",
  safari: "Safari",
  spotify: "Spotify",
  settings: "Settings",
} as const;

const listAppTitleMap = {
  projects: "Projects",
  primitives: "Gods' Hands",
  experience: "Experience",
} as const;

function getPhoneAppFromRoute(route: string): PhoneScreenState["app"] {
  if (route === "/phone") {
    return "phone";
  }

  if (route === "/messages") {
    return "messages";
  }

  if (route === "/projects" || route.startsWith("/projects/")) {
    return "projects";
  }

  if (route === "/primitives" || route.startsWith("/primitives/")) {
    return "primitives";
  }

  if (route === "/experience" || route.startsWith("/experience/")) {
    return "experience";
  }

  if (route === "/school") {
    return "school";
  }

  if (route === "/photos") {
    return "photos";
  }

  if (route === "/safari") {
    return "safari";
  }

  if (route === "/spotify") {
    return "spotify";
  }

  if (route === "/resume") {
    return "resume";
  }

  if (route === "/contact") {
    return "contact";
  }

  if (route === "/settings") {
    return "settings";
  }

  return "home";
}

export function derivePhoneScreen(args: {
  route: string;
  entity?: PortfolioEntity | null;
  card?: CardType;
}): PhoneScreenState {
  const entity = args.entity ?? getEntityByRoute(args.route);
  const app = getPhoneAppFromRoute(args.route);
  const card = args.card ?? "overview";

  if (args.route === "/") {
    return {
      app: "home",
      view: "home",
      title: siteConfig.owner,
      entityId: null,
      route: args.route,
      card,
    };
  }

  if (app in detailAppTitleMap) {
    const detailApp = app as keyof typeof detailAppTitleMap;

    return {
      app,
      view: "detail",
      title: detailAppTitleMap[detailApp],
      entityId: null,
      route: args.route,
      card,
    };
  }

  if (app in listAppTitleMap && args.route === `/${app}`) {
    const listApp = app as keyof typeof listAppTitleMap;

    return {
      app,
      view: "list",
      title: listAppTitleMap[listApp],
      entityId: null,
      route: args.route,
      card,
    };
  }

  if (!entity) {
    return {
      app: "home",
      view: "home",
      title: siteConfig.owner,
      entityId: null,
      route: args.route,
      card,
    };
  }

  return {
    app,
    view: "detail",
    title: entity.title,
    entityId: entity.id,
    route: entity.route,
    card,
  };
}

export function createPhoneListScreen(
  app: Exclude<PhoneScreenState["app"], "home">,
): PhoneScreenState {
  const titleMap = {
    phone: "Phone",
    messages: "Messages",
    projects: "Projects",
    primitives: "Gods' Hands",
    experience: "Experience",
    spotify: "Spotify",
    safari: "Safari",
    photos: "Photos",
    school: "School",
    resume: "Resume",
    contact: "Contact",
    settings: "Settings",
  } as const;

  return {
    app,
    view: "list",
    title: titleMap[app],
    entityId: null,
    route: null,
    card: "overview",
  };
}
