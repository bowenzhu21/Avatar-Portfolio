import { PortfolioRouteView } from "@/components/PortfolioRouteView";
import { projectMetadata } from "@/lib/project-metadata";

export const metadata = projectMetadata("clearinghouse");

export default function ClearinghousePage() {
  return <PortfolioRouteView route="/projects/clearinghouse" />;
}
