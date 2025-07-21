import { BrowserRouter, Routes, Route } from "react-router-dom";
import HomePage from "@/pages/HomePage";
import PlayPage from "@/pages/PlayPage";
import SharePage from "@/pages/SharePage";
import { ProfilePage } from "@/pages/ProfilePage";
import { Layout } from "@/components/ui/layout";
import { JukeboxProvider } from "@/contexts/JukeboxContext";
import { SyncProvider } from "@/contexts/SyncContext";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            <JukeboxProvider>
              <SyncProvider>
                <Layout>
                  <HomePage />
                </Layout>
              </SyncProvider>
            </JukeboxProvider>
          }
        />
        <Route
          path="/play/:boxSlug"
          element={
            <JukeboxProvider>
              <SyncProvider>
                <Layout>
                  <PlayPage />
                </Layout>
              </SyncProvider>
            </JukeboxProvider>
          }
        />
        <Route
          path="/share/:boxSlug"
          element={
            <JukeboxProvider>
              <SyncProvider>
                <Layout>
                  <SharePage />
                </Layout>
              </SyncProvider>
            </JukeboxProvider>
          }
        />
        <Route
          path="/profile"
          element={
            <JukeboxProvider>
              <SyncProvider>
                <Layout>
                  <ProfilePage />
                </Layout>
              </SyncProvider>
            </JukeboxProvider>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
