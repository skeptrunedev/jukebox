import { BrowserRouter, Routes, Route } from "react-router-dom";
import HomePage from "@/pages/HomePage";
import PlayPage from "@/pages/PlayPage";
import SharePage from "@/pages/SharePage";
import { Layout } from "@/components/ui/layout";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            <Layout>
              <HomePage />
            </Layout>
          }
        />
        <Route
          path="/play/:boxId"
          element={
            <Layout>
              <PlayPage />
            </Layout>
          }
        />
        <Route
          path="/share/:boxId"
          element={
            <Layout>
              <SharePage />
            </Layout>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
