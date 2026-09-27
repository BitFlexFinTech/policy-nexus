import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Home from "./pages/Landing.tsx";
import ChooseDepartment from "./pages/ChooseDepartment.tsx";
import Index from "./pages/Index.tsx";
import Documents from "./pages/Documents.tsx";
import Policies from "./pages/Policies.tsx";
import Reference from "./pages/Reference.tsx";
import Simulations from "./pages/Simulations.tsx";
import SimulationRun from "./pages/SimulationRun.tsx";
import Assessment from "./pages/Assessment.tsx";
import FullAssessment from "./pages/FullAssessment.tsx";
import AssessmentReport from "./pages/AssessmentReport.tsx";
import PolicyDraft from "./pages/PolicyDraft.tsx";
import NotFound from "./pages/NotFound.tsx";
import PlatformAdmin from "./pages/PlatformAdmin.tsx";
import { ADMIN_ROUTE } from "@/config/platform";
import { RequireSession } from "./routes/RequireSession.tsx";
import { WorkspaceLayout } from "./layouts/WorkspaceLayout.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/start" element={<ChooseDepartment />} />
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
              <Route path="/app/documents" element={<Documents />} />
              <Route path="/app/reference" element={<Reference />} />
            </Route>
          </Route>
          {/* Platform administration. HIDDEN BY DESIGN: not linked from the landing
              page, the workspace navigation, the header or the footer, and not
              behind the department session — it is reached only by its address,
              which lives in one constant so it can be re-homed for production. */}
          <Route path={ADMIN_ROUTE} element={<PlatformAdmin />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
