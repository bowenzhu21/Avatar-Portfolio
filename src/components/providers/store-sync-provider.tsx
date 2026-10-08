"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { getEntityByRoute } from "@/utils/portfolio";
import { usePortfolioStore } from "@/store/usePortfolioStore";
import { derivePhoneScreen, resolvePhoneScreen } from "@/utils/phone";

export function StoreSyncProvider() {
  const pathname = usePathname();
  const pushRecentEntity = usePortfolioStore((state) => state.pushRecentEntity);
  const portfolioVolume = usePortfolioStore((state) => state.portfolioVolume);
  const setPortfolioVolume = usePortfolioStore((state) => state.setPortfolioVolume);
  const [hasLoadedVolume, setHasLoadedVolume] = useState(false);

  useEffect(() => {
    const entity = getEntityByRoute(pathname);
    const current = usePortfolioStore.getState();
    const resolved = resolvePhoneScreen(pathname, current.activeRoute, current.phoneScreen);

    // An explicit UI/voice navigation has already selected its section/card.
    // Preserve it. A direct load or history transition replaces stale state in
    // one update so subscribers cannot observe a route/entity/screen mismatch.
    if (resolved !== current.phoneScreen) {
      usePortfolioStore.setState({
        activeRoute: pathname,
        activeEntity: entity,
        activeSection: entity?.sections[0]?.id ?? null,
        activeCard: "overview",
        phoneScreen: derivePhoneScreen({ route: pathname, entity }),
      });
    }

    if (entity) {
      pushRecentEntity(entity.id);
    }
  }, [pathname, pushRecentEntity]);

  useEffect(() => {
    try {
      const savedVolume = window.localStorage.getItem("portfolio-volume");
      const parsedVolume = savedVolume ? Number.parseFloat(savedVolume) : NaN;
      if (Number.isFinite(parsedVolume)) {
        setPortfolioVolume(parsedVolume);
      }
    } catch {
      // Storage may be unavailable in private or restricted browser contexts.
    }

    setHasLoadedVolume(true);
  }, [setPortfolioVolume]);

  useEffect(() => {
    if (!hasLoadedVolume) {
      return;
    }

    try {
      window.localStorage.setItem("portfolio-volume", portfolioVolume.toString());
    } catch {
      // Volume still works for this visit when persistence is unavailable.
    }
  }, [hasLoadedVolume, portfolioVolume]);

  return null;
}
