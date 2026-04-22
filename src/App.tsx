import { useState, useCallback } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import MainLayout from './layouts/MainLayout'
import Dashboard from './pages/Dashboard'
import SeabinDetail from './pages/SeabinDetail'
import Alerts from './pages/Alerts'
import Contact from './pages/Contact'
import SplashScreen from './components/SplashScreen'

export default function App() {
  const [showSplash, setShowSplash] = useState(true)
  const onSplashDone = useCallback(() => setShowSplash(false), [])

  return (
    <>
      {showSplash && <SplashScreen onDone={onSplashDone} />}
      {!showSplash && (
        <BrowserRouter>
          <Routes>
            <Route element={<MainLayout />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/seabin/:id" element={<SeabinDetail />} />
              <Route path="/alerts" element={<Alerts />} />
              <Route path="/contact" element={<Contact />} />
            </Route>
          </Routes>
        </BrowserRouter>
      )}
    </>
  )
}
