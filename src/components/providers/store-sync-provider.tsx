"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { getEntityByRoute } from "@/utils/portfolio";
import { usePortfolioStore } from "@/store/usePortfolioStore";

export function StoreSyncProvider() {
  const pathname = usePathname();
  const setActiveRoute = usePortfolioStore((state) => state.setActiveRoute);
  const setActiveEntity = usePortfolioStore((state) => state.setActiveEntity);
  const setActiveSection = usePortfolioStore((state) => state.setActiveSection);
  const pushRecentEntity = usePortfolioStore((state) => state.pushRecentEntity);
  const syncPhoneScreenFromRoute = usePortfolioStore((state) => state.syncPhoneScreenFromRoute);
  const portfolioVolume = usePortfolioStore((state) => state.portfolioVolume);
  const setPortfolioVolume = usePortfolioStore((state) => state.setPortfolioVolume);
  const [hasLoadedVolume, setHasLoadedVolume] = useState(false);

  useEffect(() => {
    const entity = getEntityByRoute(pathname);
    setActiveRoute(pathname);
    setActiveEntity(entity);
    setActiveSection(entity?.sections[0]?.id ?? null);
    syncPhoneScreenFromRoute(pathname, entity);

    if (entity) {
      pushRecentEntity(entity.id);
    }
  }, [
    pathname,
    pushRecentEntity,
    setActiveEntity,
    setActiveRoute,
    setActiveSection,
    syncPhoneScreenFromRoute,
  ]);

  useEffect(() => {
    const savedVolume = window.localStorage.getItem("portfolio-volume");
    if (!savedVolume) {
      setHasLoadedVolume(true);
      return;
    }

    const parsedVolume = Number.parseFloat(savedVolume);
    if (Number.isFinite(parsedVolume)) {
      setPortfolioVolume(parsedVolume);
    }

    setHasLoadedVolume(true);
  }, [setPortfolioVolume]);

  useEffect(() => {
    if (!hasLoadedVolume) {
      return;
    }

    window.localStorage.setItem("portfolio-volume", portfolioVolume.toString());
  }, [hasLoadedVolume, portfolioVolume]);

  return null;
}
