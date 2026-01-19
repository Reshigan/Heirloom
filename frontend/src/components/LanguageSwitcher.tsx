import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe, ChevronDown, Check } from 'lucide-react';
import { supportedLanguages } from '../i18n';

interface LanguageSwitcherProps {
  variant?: 'dropdown' | 'inline';
  showFlag?: boolean;
  showNativeName?: boolean;
}

export function LanguageSwitcher({ 
  variant = 'dropdown', 
  showFlag = true,
  showNativeName = true 
}: LanguageSwitcherProps) {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentLanguage = supportedLanguages.find(lang => lang.code === i18n.language) 
    || supportedLanguages[0];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const changeLanguage = (langCode: string) => {
    i18n.changeLanguage(langCode);
    setIsOpen(false);
    
    // Update document direction for RTL languages
    const lang = supportedLanguages.find(l => l.code === langCode);
    if (lang && 'rtl' in lang && lang.rtl) {
      document.documentElement.dir = 'rtl';
    } else {
      document.documentElement.dir = 'ltr';
    }
  };

  if (variant === 'inline') {
    return (
      <div className="flex flex-wrap gap-2">
        {supportedLanguages.map((lang) => (
          <button
            key={lang.code}
            onClick={() => changeLanguage(lang.code)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              i18n.language === lang.code
                ? 'bg-amber-600 text-white'
                : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
            }`}
          >
            {showFlag && <span className="mr-1">{lang.flag}</span>}
            {showNativeName ? lang.nativeName : lang.name}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-stone-100 hover:bg-stone-200 transition-colors text-stone-700"
        aria-label="Select language"
      >
        <Globe className="w-4 h-4" />
        {showFlag && <span>{currentLanguage.flag}</span>}
        <span className="text-sm font-medium">
          {showNativeName ? currentLanguage.nativeName : currentLanguage.name}
        </span>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-stone-200 py-2 z-50 max-h-80 overflow-y-auto">
          {supportedLanguages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => changeLanguage(lang.code)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-stone-50 transition-colors ${
                i18n.language === lang.code ? 'bg-amber-50' : ''
              }`}
            >
              {showFlag && <span className="text-lg">{lang.flag}</span>}
              <div className="flex-1">
                <div className="text-sm font-medium text-stone-900">{lang.nativeName}</div>
                <div className="text-xs text-stone-500">{lang.name}</div>
              </div>
              {i18n.language === lang.code && (
                <Check className="w-4 h-4 text-amber-600" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default LanguageSwitcher;
