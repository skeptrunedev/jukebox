import { BrowserRouter, Routes, Route } from "react-router-dom";
import HomePage from "@/pages/HomePage";
import PlayPage from "@/pages/PlayPage";
import SharePage from "@/pages/SharePage";
import { ProfilePage } from "@/pages/ProfilePage";
import { Layout } from "@/components/ui/layout";
import { JukeboxProvider } from "@/contexts/JukeboxContext";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            <JukeboxProvider>
              <Layout>
                <HomePage />
              </Layout>
            </JukeboxProvider>
          }
        />
        <Route
          path="/play/:boxSlug"
          element={
            <JukeboxProvider>
              <Layout>
                <PlayPage />
              </Layout>
            </JukeboxProvider>
          }
        />
        <Route
          path="/share/:boxSlug"
          element={
            <JukeboxProvider>
              <Layout>
                <SharePage />
              </Layout>
            </JukeboxProvider>
          }
        />
        <Route
          path="/profile"
          element={
            <JukeboxProvider>
              <Layout>
                <ProfilePage />
              </Layout>
            </JukeboxProvider>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
