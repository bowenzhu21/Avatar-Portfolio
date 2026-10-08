import { PortfolioRouteView } from "@/components/PortfolioRouteView";
import { projectMetadata } from "@/lib/project-metadata";

export const metadata = projectMetadata("matrix");

export default function MatrixPage() {
  return <PortfolioRouteView route="/projects/matrix" />;
}
