import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster }           from "@/components/ui/toaster";
import { TooltipProvider }   from "@/components/ui/tooltip";
import ProtectedRoute, { AdminRoute } from "@/components/ProtectedRoute";
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
import SettingsPage    from "@/pages/SettingsPage";
import AgentsPage      from "@/pages/AgentsPage";
import NotFound        from "@/pages/NotFound";

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner position="top-right" richColors expand toastOptions={{ style: { fontSize: '14px', padding: '16px', minWidth: '320px' } }} />
        <BrowserRouter>
          <Routes>
            {/* Public */}
            <Route path="/login" element={<LoginPage />} />

            {/* Protected — all logged-in users */}
            <Route element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }>
              {/* All roles */}
              <Route path="/"          element={<DashboardPage />} />
              <Route path="/chats"     element={<ChatsPage />} />
              <Route path="/contacts"  element={<ContactsPage />} />
              <Route path="/reminders" element={<Reminders />} />
              <Route path="/pipeline"  element={<PipelinePage />} />
              <Route path="/templates" element={<TemplatesPage />} />

              {/* Admin only */}
              <Route path="/campaigns"     element={<AdminRoute><CampaignsPage /></AdminRoute>} />
              <Route path="/agents"        element={<AdminRoute><AgentsPage /></AdminRoute>} />
              <Route path="/import-export" element={<AdminRoute><ImportExport /></AdminRoute>} />
              <Route path="/verification"  element={<AdminRoute><VerificationPage /></AdminRoute>} />
              <Route path="/settings"      element={<AdminRoute><SettingsPage /></AdminRoute>} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}
