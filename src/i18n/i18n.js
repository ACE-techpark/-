import en from './en.js';
import ka from './ka.js';

export const LANGUAGE_KEY = 'treasure-tide:language:v1';
export const DEFAULT_LANGUAGE = 'ka';
export const dictionaries = { en, ka };
export const isLanguage = value => value === 'en' || value === 'ka';

export function translate(key, params = {}, language = DEFAULT_LANGUAGE) {
  const template = dictionaries[language]?.[key] ?? en[key] ?? key;
  return template.replace(/\{(\w+)\}/g, (match, name) => Object.hasOwn(params, name) ? String(params[name]) : match);
}

// The server's existing English error protocol stays unchanged. Translate only
// known application errors at the display boundary, never arbitrary host content.
const errorKeys = new Map(Object.entries(en).filter(([key]) => key.startsWith('error.')).map(([key, message]) => [message, key]));
export function translateError(message, language = DEFAULT_LANGUAGE) {
  if (!message) return '';
  const key = errorKeys.get(message);
  if (key) return translate(key, {}, language);
  let match = message.match(/^Starting crew must be (\d+)–(\d+) pirates\.$/);
  if (match) return translate('error.crewRange', { min: match[1], max: match[2] }, language);
  match = message.match(/^Fill in all (\d+) answer choices\.$/);
  if (match) return translate('error.answerCount', { count: match[1] }, language);
  if (message.startsWith('Unknown game action:')) return translate('error.unsupportedCommand', {}, language);
  return translate('error.unexpected', {}, language);
}

// Optional, explicit future translations. Plain strings always pass through
// unchanged, including text that happens to match a built-in interface label.
export function questionContent(entity, field, language = DEFAULT_LANGUAGE) {
  return entity?.translations?.[language]?.[field] ?? entity?.[field] ?? '';
}
