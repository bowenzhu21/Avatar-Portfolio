import { siteConfig } from "@/config/site";
import { getEntityByRoute } from "@/utils/portfolio";
import type { CardType, PhoneScreenState, PortfolioEntity } from "@/types";

function getPhoneAppFromRoute(route: string): PhoneScreenState["app"] {
  if (route.startsWith("/projects/")) {
    return "projects";
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

  if (route === "/resume") {
    return "resume";
  }

  if (route === "/contact") {
    return "contact";
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
    projects: "Projects",
    experience: "Experience",
    photos: "Photos",
    school: "School",
    resume: "Resume",
    contact: "Contact",
    hobbies: "Hobbies",
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
