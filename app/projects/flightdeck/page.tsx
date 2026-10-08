import { PortfolioRouteView } from "@/components/PortfolioRouteView";
import { projectMetadata } from "@/lib/project-metadata";

export const metadata = projectMetadata("flightdeck");

export default function FlightDeckPage() {
  return <PortfolioRouteView route="/projects/flightdeck" />;
}
