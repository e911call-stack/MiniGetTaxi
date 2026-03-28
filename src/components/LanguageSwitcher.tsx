interface LanguageSwitcherProps {
  currentLanguage: string
  onLanguageChange: (lng: string) => void
}

export default function LanguageSwitcher({ currentLanguage, onLanguageChange }: LanguageSwitcherProps) {
  return (
    <div className="flex items-center gap-2 bg-jordan-gray/50 backdrop-blur-sm rounded-lg p-1">
      <button
        onClick={() => onLanguageChange('ar')}
        className={`px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
          currentLanguage === 'ar'
            ? 'bg-jordan-yellow text-jordan-black'
            : 'text-gray-400 hover:text-white hover:bg-gray-700'
        }`}
      >
        العربية
      </button>
      <button
        onClick={() => onLanguageChange('en')}
        className={`px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
          currentLanguage === 'en'
            ? 'bg-jordan-yellow text-jordan-black'
            : 'text-gray-400 hover:text-white hover:bg-gray-700'
        }`}
      >
        English
      </button>
    </div>
  )
}
