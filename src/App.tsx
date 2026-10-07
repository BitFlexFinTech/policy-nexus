import { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Home from "./pages/Landing.tsx";
import ChooseDepartment from "./pages/ChooseDepartment.tsx";
import ResearchLanding from "./pages/ResearchLanding.tsx";
import ResearchOverview from "./pages/research/ResearchOverview.tsx";
import { ResearchLibraryPanel } from "./components/research/ResearchLibraryPanel";
import { ResearchDataSourcesPanel } from "./components/research/ResearchDataSourcesPanel";
import { ResearchChatPanel } from "./components/research/ResearchChatPanel";
import { ResearchBriefPanel } from "./components/research/ResearchBriefPanel";
import { ResearchBarometerPanel } from "./components/research/ResearchBarometerPanel";
import { ResearchFindingsPanel } from "./components/research/ResearchFindingsPanel";
import Index from "./pages/Index.tsx";
import Documents from "./pages/Documents.tsx";
import Support from "./pages/Support.tsx";
import Policies from "./pages/Policies.tsx";
import Reference from "./pages/Reference.tsx";
import Simulations from "./pages/Simulations.tsx";
import SimulationRun from "./pages/SimulationRun.tsx";
import Assessment from "./pages/Assessment.tsx";
import FullAssessment from "./pages/FullAssessment.tsx";
import AssessmentReport from "./pages/AssessmentReport.tsx";
import PolicyDraft from "./pages/PolicyDraft.tsx";
import ImplementationPack from "./pages/ImplementationPack.tsx";
import Compare from "./pages/Compare.tsx";
import NotFound from "./pages/NotFound.tsx";
import PlatformAdmin from "./pages/PlatformAdmin.tsx";
import AuthCallback from "./pages/AuthCallback.tsx";
import { AdminGate } from "./components/admin/AdminGate.tsx";
import { ErrorBoundary } from "./components/ErrorBoundary.tsx";
import { ADMIN_ROUTE } from "@/config/platform";
import { faviconOverride } from "@/config/content";
import { useContent } from "@/config/useContent";
import { RequireSession } from "./routes/RequireSession.tsx";
import { RequireResearchSession } from "./routes/RequireResearchSession.tsx";
import { WorkspaceLayout } from "./layouts/WorkspaceLayout.tsx";
import { ResearchWorkspaceLayout } from "./layouts/ResearchWorkspaceLayout.tsx";

const queryClient = new QueryClient();

/**
 * Applies an uploaded tab icon when an administrator has set one. It rewrites only
 * the `rel="icon"` links — the iOS tile (`apple-touch-icon`) is deliberately left
 * alone, because an arbitrary upload has not been prepared to the sizes iOS wants.
 * With nothing set, the shipped icon set is untouched.
 */
function BrandIconOverride() {
  const content = useContent();
  const icon = faviconOverride(content);

  useEffect(() => {
    if (!icon) return;
    const links = Array.from(document.querySelectorAll<HTMLLinkElement>('link[rel~="icon"]'));
    const previous = links.map((link) => link.getAttribute("href"));
    links.forEach((link) => link.setAttribute("href", icon));
    return () => links.forEach((link, index) => link.setAttribute("href", previous[index] ?? ""));
  }, [icon]);

  return null;
}

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        {/* Applies an uploaded tab icon, when one is set. */}
        <BrandIconOverride />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/start" element={<ChooseDepartment />} />
          {/* The ZEPARI research assistant — a separate product in the same platform. Its own
              landing page (with the two one-click entries), and a workspace that needs a research
              session. A department session never opens it, and it never opens the department side. */}
          <Route path="/research" element={<ResearchLanding />} />
          <Route element={<RequireResearchSession />}>
            <Route element={<ResearchWorkspaceLayout />}>
              <Route path="/research/app" element={<ResearchOverview />} />
              <Route path="/research/app/library" element={<ResearchLibraryPanel />} />
              <Route path="/research/app/data" element={<ResearchDataSourcesPanel />} />
              <Route path="/research/app/ask" element={<ResearchChatPanel />} />
              <Route path="/research/app/brief" element={<ResearchBriefPanel />} />
              <Route path="/research/app/barometer" element={<ResearchBarometerPanel />} />
              <Route path="/research/app/findings" element={<ResearchFindingsPanel />} />
            </Route>
          </Route>
          {/* Everything under /app requires a department session, and shares one
              workspace shell (header + secondary nav + sovereign footer). */}
          <Route element={<RequireSession />}>
            <Route element={<WorkspaceLayout />}>
              <Route path="/app" element={<Index />} />
              <Route path="/app/policies" element={<Policies />} />
              <Route path="/app/simulations" element={<Simulations />} />
              <Route path="/app/simulations/:id" element={<SimulationRun />} />
              <Route path="/app/assessments/:id" element={<Assessment />} />
              <Route path="/app/assessments/:id/full" element={<FullAssessment />} />
              <Route path="/app/assessments/:id/report" element={<AssessmentReport />} />
              <Route path="/app/assessments/:id/policy-draft" element={<PolicyDraft />} />
              <Route path="/app/assessments/:id/implementation-pack" element={<ImplementationPack />} />
              <Route path="/app/compare/:a/:b" element={<Compare />} />
              <Route path="/app/documents" element={<Documents />} />
              <Route path="/app/support" element={<Support />} />
              <Route path="/app/reference" element={<Reference />} />
            </Route>
          </Route>
          {/* Where an identity provider returns the officer. Reached only by the
              provider's redirect; nothing in the platform links to it. */}
          <Route path="/auth/callback" element={<AuthCallback />} />
          {/* Platform administration. HIDDEN BY DESIGN: not linked from the landing
              page, the workspace navigation, the header or the footer, and not
              behind the department session — it is reached only by its address,
              which lives in one constant so it can be re-homed for production.
              It sits behind `AdminGate`, which asks one plain question before it
              will show the settings; the gate states plainly that this is not
              real security (see src/session/adminAccess.ts). */}
          <Route
            path={ADMIN_ROUTE}
            element={
              <AdminGate>
                <PlatformAdmin />
              </AdminGate>
            }
          />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
