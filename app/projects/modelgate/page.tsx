import { PortfolioRouteView } from "@/components/PortfolioRouteView";
import { projectMetadata } from "@/lib/project-metadata";

export const metadata = projectMetadata("modelgate");

export default function ModelGatePage() {
  return <PortfolioRouteView route="/projects/modelgate" />;
}
