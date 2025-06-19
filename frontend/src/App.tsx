import { BrowserRouter, Routes, Route } from 'react-router-dom'
import HomePage from '@/pages/HomePage'
import PlayPage from '@/pages/PlayPage'
import SharePage from '@/pages/SharePage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/play/:boxId" element={<PlayPage />} />
        <Route path="/share/:boxId" element={<SharePage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
