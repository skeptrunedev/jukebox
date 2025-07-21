import { BrowserRouter, Routes, Route } from "react-router-dom";
import HomePage from "@/pages/HomePage";
import PlayPage from "@/pages/PlayPage";
import SharePage from "@/pages/SharePage";
import { ProfilePage } from "@/pages/ProfilePage";
import { Layout } from "@/components/ui/layout";
import { JukeboxProvider } from "@/contexts/JukeboxContext";
import { SyncProvider } from "@/contexts/SyncContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ConnectionStatus } from "@/components/ConnectionStatus";
import { Toaster } from "sonner";

function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <JukeboxProvider>
      <SyncProvider>
        <Layout>
          {children}
          <ConnectionStatus />
        </Layout>
      </SyncProvider>
    </JukeboxProvider>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Toaster richColors />
      <Routes>
        <Route path="/" element={<AppProviders><HomePage /></AppProviders>} />
        <Route path="/play/:boxSlug" element={<AppProviders><PlayPage /></AppProviders>} />
        <Route path="/share/:boxSlug" element={<AppProviders><SharePage /></AppProviders>} />
        <Route path="/profile" element={<AppProviders><ProfilePage /></AppProviders>} />
      </Routes>
    </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
