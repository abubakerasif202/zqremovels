/**
 * Validate a configured Cal.diy/Cal.com booking link before rendering it.
 * This is a public build-time URL, not a secret or a source of booking truth.
 */
export function normalizeSchedulingUrl(value) {
  if (typeof value !== 'string' || !value.trim()) return null;

  try {
    const url = new URL(value.trim());
    if (url.protocol !== 'https:' || !url.hostname || url.username || url.password) {
      return null;
    }
    return url.toString();
  } catch {
    return null;
  }
}
