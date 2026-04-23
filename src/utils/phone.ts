import { siteConfig } from "@/config/site";
import { getEntityByRoute } from "@/utils/portfolio";
import type { CardType, PhoneScreenState, PortfolioEntity } from "@/types";

function getPhoneAppFromRoute(route: string): PhoneScreenState["app"] {
  if (route === "/phone") {
    return "phone";
  }

  if (route === "/messages") {
    return "messages";
  }

  if (route.startsWith("/projects/")) {
    return "projects";
  }

  if (route.startsWith("/gods/")) {
    return "gods";
  }

  if (route.startsWith("/experience/")) {
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

  if (route === "/hobbies") {
    return "hobbies";
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

  if (!entity) {
    return {
      app: "home",
      view: "home",
      title: siteConfig.owner,
      entityId: null,
      route: args.route,
      card: args.card ?? "overview",
    };
  }

  return {
    app,
    view: "detail",
    title: entity.title,
    entityId: entity.id,
    route: entity.route,
    card: args.card ?? "overview",
  };
}

export function createPhoneListScreen(
  app: Exclude<PhoneScreenState["app"], "home">,
): PhoneScreenState {
  const titleMap = {
    phone: "Phone",
    messages: "Messages",
    projects: "Projects",
    gods: "Gods",
    experience: "Experience",
    spotify: "Spotify",
    safari: "Safari",
    photos: "Photos",
    school: "School",
    resume: "Resume",
    contact: "Contact",
    settings: "Settings",
    hobbies: "Nutrition & Fitness",
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
