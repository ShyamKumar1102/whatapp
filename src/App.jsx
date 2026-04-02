import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster }           from "@/components/ui/toaster";
import { TooltipProvider }   from "@/components/ui/tooltip";
import ProtectedRoute  from "@/components/ProtectedRoute";
import AppLayout       from "@/components/AppLayout";
import LoginPage       from "@/pages/LoginPage";
import DashboardPage   from "@/pages/DashboardPage";
import ChatsPage       from "@/pages/ChatsPage";
import ContactsPage    from "@/pages/ContactsPage";
import CampaignsPage   from "@/pages/CampaignsPage";
import PipelinePage    from "@/pages/PipelinePage";
import Reminders       from "@/pages/Reminders";
import ImportExport    from "@/pages/ImportExport";
import TemplatesPage   from "@/pages/TemplatesPage";
import VerificationPage from "@/pages/VerificationPage";
import AnalyticsPage   from "@/pages/AnalyticsPage";
import SettingsPage    from "@/pages/SettingsPage";
import NotFound        from "@/pages/NotFound";

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public */}
            <Route path="/login" element={<LoginPage />} />

            {/* Protected — all CRM pages */}
            <Route element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }>
              <Route path="/"              element={<DashboardPage />} />
              <Route path="/chats"         element={<ChatsPage />} />
              <Route path="/contacts"      element={<ContactsPage />} />
              <Route path="/campaigns"     element={<CampaignsPage />} />
              <Route path="/pipeline"      element={<PipelinePage />} />
              <Route path="/reminders"     element={<Reminders />} />
              <Route path="/import-export" element={<ImportExport />} />
              <Route path="/templates"     element={<TemplatesPage />} />
              <Route path="/verification"  element={<VerificationPage />} />
              <Route path="/analytics"     element={<AnalyticsPage />} />
              <Route path="/settings"      element={<SettingsPage />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}
