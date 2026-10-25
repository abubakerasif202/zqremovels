// Durable at-most-once delivery. Pending/ambiguous requests must never be resent automatically.
const { createHash } = require('node:crypto');
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const TTL = 7 * 86400;
function fingerprint(payload) {
  return createHash('sha256').update(JSON.stringify(payload)).digest('hex');
}
function readRecord(raw, id, payload) {
  if (raw === null) return null;
  const record = typeof raw === 'string' ? JSON.parse(raw) : raw;
  if (!record || record.submission_id !== id.toLowerCase() ||
      !['pending', 'accepted', 'rejected'].includes(record.status) ||
      typeof record.hash !== 'string') throw new Error('Invalid receipt state');
  return record.hash === fingerprint(payload) ? { record } : { conflict: true };
}
function createReceiptStore(env = process.env, fetcher = globalThis.fetch) {
  async function command(...args) {
    const url = new URL(env.KV_REST_API_URL || '');
    if (url.protocol !== 'https:' || url.username || url.password || !env.KV_REST_API_TOKEN) throw new Error('Receipt store unavailable');
    const response = await fetcher(url.href, {
      method: 'POST', redirect: 'error', signal: AbortSignal.timeout(5000),
      headers: { Authorization: `Bearer ${env.KV_REST_API_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(args),
    });
    const data = await response.json();
    if (!response.ok || data.error || !Object.hasOwn(data, 'result')) throw new Error('Receipt store unavailable');
    return data.result;
  }
  async function transition(claim, status) {
    const record = { ...claim.record, status, updated_at: Date.now() };
    if (await command('SET', claim.key, JSON.stringify(record), 'EX', TTL, 'XX') !== 'OK') throw new Error('Receipt store unavailable');
    return record;
  }
  return {
    async lookup(id, payload) {
      if (!UUID.test(id)) throw new Error('Invalid submission ID');
      return readRecord(await command('GET', `zq:quote:receipt:v1:${id.toLowerCase()}`), id, payload);
    },
    async claim(id, payload) {
      if (!UUID.test(id)) throw new Error('Invalid submission ID');
      const key = `zq:quote:receipt:v1:${id.toLowerCase()}`;
      const hash = fingerprint(payload);
      const record = { hash, status: 'pending', submission_id: id.toLowerCase(), created_at: Date.now() };
      if (await command('SET', key, JSON.stringify(record), 'EX', TTL, 'NX') === 'OK') return { key, record, fresh: true };
      const raw = await command('GET', key);
      const previous = readRecord(raw, id, payload);
      if (!previous) throw new Error('Receipt state disappeared');
      return { key, ...previous, fresh: false };
    },
    accept: claim => transition(claim, 'accepted'),
    reject: claim => transition(claim, 'rejected'),
  };
}
module.exports = { createReceiptStore, UUID };
