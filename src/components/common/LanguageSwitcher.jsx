import { useTranslation } from '../../i18n/useTranslation';

export default function LanguageSwitcher() {
  const { language, setLanguage, t } = useTranslation();
  return <div className="language-switcher" role="group" aria-label={t('language.select')}>
    {['en', 'ka'].map(code => <button key={code} type="button" lang={code} aria-label={t(`language.${code}`)} title={t(`language.${code}`)} aria-pressed={language === code} onClick={() => setLanguage(code)}>{code.toUpperCase()}</button>)}
  </div>;
}
