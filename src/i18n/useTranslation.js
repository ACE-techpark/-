import { create } from 'zustand';
import { DEFAULT_LANGUAGE, LANGUAGE_KEY, isLanguage, questionContent, translate, translateError } from './i18n.js';

function readLanguage() {
  try { const saved = localStorage.getItem(LANGUAGE_KEY); return isLanguage(saved) ? saved : DEFAULT_LANGUAGE; }
  catch { return DEFAULT_LANGUAGE; }
}
export const useLanguage = create(set => ({
  language: readLanguage(),
  setLanguage: language => {
    if (!isLanguage(language)) return;
    try { localStorage.setItem(LANGUAGE_KEY, language); } catch { /* Preference still works for this session. */ }
    set({ language });
  },
}));

export function useTranslation() {
  const { language, setLanguage } = useLanguage();
  return { language, setLanguage,
    t: (key, params) => translate(key, params, language),
    errorText: message => translateError(message, language),
    connectionText: status => translate(connectionKeys[status] || 'status.notConnected', {}, language),
    content: (entity, field = 'text') => questionContent(entity, field, language),
    gameName: game => ['game.defaultName', 'game.untitledName'].includes(game.nameKey) ? translate(game.nameKey, {}, language) : game.name,
  };
}
const connectionKeys = { Connected: 'status.connected', Disconnected: 'status.disconnected', 'Not Connected': 'status.notConnected', 'Connecting...': 'status.connecting', 'Reconnecting...': 'status.reconnecting' };
