/**
 * translator.js — uses MyMemory free translation API
 * No API key required. 10,000 words/day free.
 * Supports: hi, mr, gu, ta, te, ml, kn, bn, pa, es
 */

// MyMemory uses the same language codes we already use ✅
const SUPPORTED_LANGS = new Set([
  'hi','mr','gu','ta','te','ml','kn','bn','pa','es'
]);

/**
 * Translate a single string using MyMemory API.
 */
const translateText = async (text, targetLang) => {
  if (!text || !text.trim()) return text || '';
  if (!SUPPORTED_LANGS.has(targetLang)) return text;

  try {
    const encoded = encodeURIComponent(text);
    const url     = `https://api.mymemory.translated.net/get?q=${encoded}&langpair=en|${targetLang}`;
    const res     = await fetch(url);
    const data    = await res.json();

    if (data.responseStatus === 200) {
      return data.responseData.translatedText || text;
    }
    return text;
  } catch (err) {
    console.error(`translateText error (${targetLang}):`, err.message);
    return text;
  }
};

/**
 * Translate an array of strings — one API call per string (MyMemory doesn't support batch).
 * Runs concurrently for speed.
 */
const translateTexts = async (texts, targetLang) => {
  if (!texts.length) return [];
  if (!SUPPORTED_LANGS.has(targetLang)) return texts;

  console.log(`🌐 Translating ${texts.length} texts to ${targetLang} via MyMemory...`);

  const results = await Promise.all(
    texts.map(text => translateText(text, targetLang))
  );

  console.log('✅ Translated results:', results);
  return results;
};

module.exports = { translateText, translateTexts };