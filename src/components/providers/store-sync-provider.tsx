"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { getEntityByRoute } from "@/utils/portfolio";
import { usePortfolioStore } from "@/store/usePortfolioStore";

export function StoreSyncProvider() {
  const pathname = usePathname();
  const setActiveRoute = usePortfolioStore((state) => state.setActiveRoute);
  const setActiveEntity = usePortfolioStore((state) => state.setActiveEntity);
  const setActiveSection = usePortfolioStore((state) => state.setActiveSection);
  const pushRecentEntity = usePortfolioStore((state) => state.pushRecentEntity);
  const setResponseText = usePortfolioStore((state) => state.setResponseText);

  useEffect(() => {
    const entity = getEntityByRoute(pathname);
    setActiveRoute(pathname);
    setActiveEntity(entity);
    setActiveSection(entity?.sections[0]?.id ?? null);
    setResponseText("");

    if (entity) {
      pushRecentEntity(entity.id);
    }
  }, [pathname, pushRecentEntity, setActiveEntity, setActiveRoute, setActiveSection, setResponseText]);

  return null;
}
