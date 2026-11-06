// Chooses "a" or "an" from how a place name is pronounced, not from its first letter.
// A vowel letter takes "an" (Adelaide, Unley "UN-lee", Urrbrae "UR-bree", Ottoway, Elizabeth).
// Names that begin with a "y" or "w" sound take "a": Uraidla ("yoo-RAY-dla"), Eudunda ("yoo-DUN-da"),
// One Tree Hill ("wun"). Add further exceptions here when a new supported suburb needs one.
const CONSONANT_SOUND_EXCEPTIONS = [/^uraidla\b/i, /^eu[a-z]*\b/i, /^one\b/i, /^uni(?:versity|on|que)\b/i];

export function indefiniteArticle(name) {
  const text = String(name || '').trim();
  if (CONSONANT_SOUND_EXCEPTIONS.some((pattern) => pattern.test(text))) return 'a';
  return /^[aeiou]/i.test(text) ? 'an' : 'a';
}

// Returns the name prefixed with its article: "a Glenelg", "an Adelaide CBD", "an Unley".
export function withArticle(name) {
  const text = String(name || '').trim();
  return `${indefiniteArticle(text)} ${text}`;
}
