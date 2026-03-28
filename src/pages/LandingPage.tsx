import { useTranslation } from 'react-i18next'
import LanguageSwitcher from '../components/LanguageSwitcher'
import DriverSignupButton from '../components/DriverSignupButton'

interface LandingPageProps {
  onSelectRole: (role: 'passenger' | 'driver') => void
  currentLanguage: string
  onLanguageChange: (lng: string) => void
}

export default function LandingPage({ onSelectRole, currentLanguage, onLanguageChange }: LandingPageProps) {
  const { t } = useTranslation()

  return (
    <div className="min-h-screen bg-jordan-black relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `repeating-linear-gradient(
            45deg,
            transparent,
            transparent 35px,
            rgba(255, 215, 0, 0.3) 35px,
            rgba(255, 215, 0, 0.3) 70px
          )`
        }} />
      </div>

      {/* Header */}
      <header className="relative z-10 p-4 md:p-6">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 md:w-16 md:h-16 bg-jordan-yellow rounded-xl flex items-center justify-center shadow-lg">
              <svg className="w-8 h-8 md:w-10 md:h-10 text-jordan-black" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/>
              </svg>
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-jordan-yellow">{t('app.name')}</h1>
              <p className="text-sm text-gray-400">{t('app.tagline')}</p>
            </div>
          </div>
          <LanguageSwitcher
            currentLanguage={currentLanguage}
            onLanguageChange={onLanguageChange}
          />
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 px-4 md:px-6 py-8 md:py-16">
        <div className="max-w-4xl mx-auto text-center">
          <div className="mb-8 md:mb-12">
            <h2 className="text-3xl md:text-5xl lg:text-6xl font-bold text-white mb-4 md:mb-6 leading-tight">
              {t('landing.hero.title')}
            </h2>
            <p className="text-lg md:text-xl lg:text-2xl text-gray-300 mb-8 md:mb-12">
              {t('landing.hero.subtitle')}
            </p>
          </div>

          {/* Main CTA Buttons */}
          <div className="flex flex-col md:flex-row gap-4 md:gap-6 justify-center items-center mb-12 md:mb-20">
            <button
              onClick={() => onSelectRole('passenger')}
              className="w-full md:w-auto px-8 md:px-12 py-4 md:py-5 bg-jordan-yellow text-jordan-black font-bold text-lg md:text-xl rounded-xl hover:bg-jordan-yellow-dark transform hover:scale-105 shadow-xl transition-all duration-300 flex items-center justify-center gap-3"
            >
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/>
              </svg>
              {t('landing.buttons.requestTaxi')}
            </button>

            <DriverSignupButton />
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-6 md:gap-8 mb-12 md:mb-20">
            <div className="bg-jordan-gray/30 backdrop-blur-sm rounded-2xl p-6 md:p-8 border border-gray-700 hover:border-jordan-yellow transition-all duration-300">
              <div className="w-16 h-16 bg-jordan-yellow/20 rounded-2xl flex items-center justify-center mb-6 mx-auto">
                <svg className="w-8 h-8 text-jordan-yellow" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M13 2.05v2.02c3.95.49 7 3.85 7 7.93 0 3.21-1.92 6-4.72 7.28L13 17v5l5-5h2c0 3.87-3.13 7-7 7s-7-3.13-7-7 3.13-7 7-7c1.65 0 3.15.57 4.34 1.53l1.53-1.53c-1.7-1.4-3.84-2.23-6.16-2.23C6.84 2.75 2.75 6.84 2.75 12s4.09 9.25 9.25 9.25 9.25-4.09 9.25-9.25c0-2.45-.94-4.68-2.48-6.35l-1.77 1.15z"/>
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-3">{t('landing.features.fast.title')}</h3>
              <p className="text-gray-400">{t('landing.features.fast.description')}</p>
            </div>

            <div className="bg-jordan-gray/30 backdrop-blur-sm rounded-2xl p-6 md:p-8 border border-gray-700 hover:border-jordan-yellow transition-all duration-300">
              <div className="w-16 h-16 bg-jordan-yellow/20 rounded-2xl flex items-center justify-center mb-6 mx-auto">
                <svg className="w-8 h-8 text-jordan-yellow" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"/>
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-3">{t('landing.features.safe.title')}</h3>
              <p className="text-gray-400">{t('landing.features.safe.description')}</p>
            </div>

            <div className="bg-jordan-gray/30 backdrop-blur-sm rounded-2xl p-6 md:p-8 border border-gray-700 hover:border-jordan-yellow transition-all duration-300">
              <div className="w-16 h-16 bg-jordan-yellow/20 rounded-2xl flex items-center justify-center mb-6 mx-auto">
                <svg className="w-8 h-8 text-jordan-yellow" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z"/>
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-3">{t('landing.features.transparent.title')}</h3>
              <p className="text-gray-400">{t('landing.features.transparent.description')}</p>
            </div>
          </div>

          {/* How It Works */}
          <div className="bg-jordan-gray/20 rounded-3xl p-8 md:p-12">
            <h3 className="text-2xl md:text-3xl font-bold text-white mb-8">{t('landing.howItWorks.title')}</h3>
            <div className="grid md:grid-cols-3 gap-8 md:gap-12">
              <div className="text-center">
                <div className="w-20 h-20 bg-jordan-yellow rounded-full flex items-center justify-center mx-auto mb-6 text-jordan-black font-bold text-2xl">
                  1
                </div>
                <p className="text-lg text-gray-300">{t('landing.howItWorks.step1')}</p>
              </div>
              <div className="text-center">
                <div className="w-20 h-20 bg-jordan-yellow rounded-full flex items-center justify-center mx-auto mb-6 text-jordan-black font-bold text-2xl">
                  2
                </div>
                <p className="text-lg text-gray-300">{t('landing.howItWorks.step2')}</p>
              </div>
              <div className="text-center">
                <div className="w-20 h-20 bg-jordan-yellow rounded-full flex items-center justify-center mx-auto mb-6 text-jordan-black font-bold text-2xl">
                  3
                </div>
                <p className="text-lg text-gray-300">{t('landing.howItWorks.step3')}</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 py-8 border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 md:px-6 text-center">
          <p className="text-gray-500 text-sm">
            &copy; {new Date().getFullYear()} YellowWant.jo - {t('app.tagline')}
          </p>
        </div>
      </footer>
    </div>
  )
}
