// Optional extension of the current string-based model. No extra authoring fields
// are required: question/answer.text remains the canonical host-written content.
export function validateQuestionTranslations(entity) {
  if (entity.translations == null) return;
  if (typeof entity.translations !== 'object' || Array.isArray(entity.translations)) throw new Error('Question translations must contain text for English or Georgian.');
  for (const [locale, entry] of Object.entries(entity.translations)) {
    if (!['en', 'ka'].includes(locale) || !entry || typeof entry !== 'object' || Array.isArray(entry)
      || Object.entries(entry).some(([field, value]) => !['text', 'imageAlt'].includes(field) || typeof value !== 'string' || value.length > 400))
      throw new Error('Question translations must contain text for English or Georgian.');
  }
}

// Whitelist content fields so future translation metadata cannot leak answer keys.
export function publicTranslations(entity) {
  if (!entity.translations) return undefined;
  return Object.fromEntries(['en', 'ka'].filter(locale => entity.translations[locale]).map(locale => {
    const entry = entity.translations[locale];
    return [locale, Object.fromEntries(['text', 'imageAlt'].filter(field => typeof entry[field] === 'string').map(field => [field, entry[field]]))];
  }));
}
