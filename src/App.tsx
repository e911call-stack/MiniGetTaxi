import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import LandingPage from './pages/LandingPage'
import PassengerApp from './pages/PassengerApp'
import DriverApp from './pages/DriverApp'
import AdminPanel from './pages/AdminPanel'
import { isSupabaseConfigured } from './lib/supabase'

type AppView = 'landing' | 'passenger' | 'driver' | 'admin'

function App() {
  const { i18n } = useTranslation()
  const [currentView, setCurrentView] = useState<AppView>('landing')
  const [userRole, setUserRole] = useState<'passenger' | 'driver' | 'admin' | null>(null)
  const [configured, setConfigured] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check if Supabase is configured
    const supabaseReady = isSupabaseConfigured()
    setConfigured(supabaseReady)
    setLoading(false)

    // Check URL params for direct navigation (for testing)
    const params = new URLSearchParams(window.location.search)
    const view = params.get('view') as AppView
    if (view && ['passenger', 'driver', 'admin'].includes(view)) {
      setCurrentView(view)
      setUserRole(view === 'admin' ? 'admin' : (view as 'passenger' | 'driver'))
    }
  }, [])

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng)
    document.documentElement.lang = lng
    document.documentElement.dir = lng === 'ar' ? 'rtl' : 'ltr'
  }

  const handleRoleSelect = (role: 'passenger' | 'driver') => {
    setUserRole(role)
    setCurrentView(role)
  }

  const handleBackToLanding = () => {
    setUserRole(null)
    setCurrentView('landing')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-jordan-black flex items-center justify-center">
        <div className="animate-spin w-12 h-12 border-4 border-jordan-yellow border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-jordan-black">
      {/* Demo Mode Banner */}
      {!configured && (
        <div className="bg-blue-900/80 border-b border-blue-700 p-2 text-center">
          <p className="text-blue-300 text-sm">
            وضع تجريبي - Demo Mode | Configure Supabase for full functionality
          </p>
        </div>
      )}
      
      {currentView === 'landing' && (
        <LandingPage
          onSelectRole={handleRoleSelect}
          currentLanguage={i18n.language}
          onLanguageChange={changeLanguage}
        />
      )}
      {currentView === 'passenger' && userRole === 'passenger' && (
        <PassengerApp onBack={handleBackToLanding} />
      )}
      {currentView === 'driver' && userRole === 'driver' && (
        <DriverApp onBack={handleBackToLanding} />
      )}
      {currentView === 'admin' && userRole === 'admin' && (
        <AdminPanel onBack={handleBackToLanding} />
      )}
    </div>
  )
}

export default App
