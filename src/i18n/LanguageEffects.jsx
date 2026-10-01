import { useEffect } from 'react';
import { useLanguage } from './useTranslation';
import { LANGUAGE_KEY, isLanguage, translate } from './i18n';

export default function LanguageEffects() {
  const language = useLanguage(state => state.language);
  useEffect(() => {
    document.documentElement.lang = language;
    document.title = translate('app.title', {}, language);
    const message = el => {
      const v = el.validity;
      if (v.valueMissing) return translate('validation.required', {}, language);
      if (v.rangeUnderflow || v.rangeOverflow) return translate('validation.range', { min: el.min, max: el.max }, language);
      if (v.badInput || v.stepMismatch) return translate('validation.number', {}, language);
      if (v.tooLong) return translate('validation.length', { max: el.maxLength }, language);
      return translate('validation.invalid', {}, language);
    };
    const invalid = e => { if (e.target.setCustomValidity) { e.target.setCustomValidity(''); if (!e.target.validity.valid) e.target.setCustomValidity(message(e.target)); } };
    const clear = e => {
      e.target.setCustomValidity?.('');
      // Required radio groups share validity; selecting one must clear messages
      // on the other choices too, or an earlier invalid submit would stay stuck.
      if (e.target.type === 'radio' && e.target.form) {
        for (const input of e.target.form.elements) if (input.type === 'radio' && input.name === e.target.name) input.setCustomValidity('');
      }
    };
    document.querySelectorAll('input,textarea,select').forEach(el => {
      if (el.validity.customError) { el.setCustomValidity(''); if (!el.validity.valid) el.setCustomValidity(message(el)); }
    });
    document.addEventListener('invalid', invalid, true);
    document.addEventListener('input', clear, true);
    document.addEventListener('change', clear, true);
    return () => { document.removeEventListener('invalid', invalid, true); document.removeEventListener('input', clear, true); document.removeEventListener('change', clear, true); };
  }, [language]);
  useEffect(() => {
    const sync = e => { if (e.key === LANGUAGE_KEY) useLanguage.setState({ language: isLanguage(e.newValue) ? e.newValue : 'ka' }); };
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, []);
  return null;
}
