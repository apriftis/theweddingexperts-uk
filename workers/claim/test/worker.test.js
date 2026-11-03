import { test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import worker from '../src/index.js';

const CLAIM_DIR = fileURLToPath(new URL('../../../claim/', import.meta.url));
const REAL_SLUG = readdirSync(CLAIM_DIR, { withFileTypes: true })
  .find((d) => d.isDirectory() && d.name !== 'assets').name;
const REAL_HTML = readFileSync(`${CLAIM_DIR}${REAL_SLUG}/index.html`, 'utf8');
const SPA_HTML = '<!doctype html><html><head><title>The Wedding Experts</title></head>'
  + '<body><div id="root"></div></body></html>';

const realFetch = globalThis.fetch;
let fetched;
let site; // what the site answers: { status, html }
let stored;
const env = { CLAIMS: { put: async (key, value) => { stored.push({ key, value: JSON.parse(value) }); } } };

beforeEach(() => {
  fetched = [];
  stored = [];
  site = { status: 200, html: SPA_HTML };
  globalThis.fetch = async (url, init) => {
    fetched.push({ url: String(url), init });
    return new Response(site.html, { status: site.status, headers: { 'content-type': 'text/html' } });
  };
});
afterEach(() => { globalThis.fetch = realFetch; });

function claim(body, method = 'POST') {
  return worker.fetch(new Request('https://theweddingexperts.uk/api/claim', {
    method,
    headers: { 'content-type': 'application/json', 'user-agent': 'test' },
    body: method === 'POST' ? JSON.stringify(body) : undefined,
  }), env);
}

test('a real claim page is recorded', async () => {
  site = { status: 200, html: REAL_HTML };
  const r = await claim({ page: REAL_SLUG, venue: 'Some Venue' });
  assert.equal(r.status, 200);
  assert.deepEqual(await r.json(), { ok: true });
  assert.equal(fetched[0].url, `https://theweddingexperts.uk/claim/${REAL_SLUG}/`);
  assert.equal(stored.length, 1);
  assert.ok(stored[0].key.endsWith(`_${REAL_SLUG}`));
  assert.equal(stored[0].value.slug, REAL_SLUG);
  assert.equal(stored[0].value.venue, 'Some Venue');
});

test('a 200 from the React app for an unknown slug is refused', async () => {
  site = { status: 200, html: SPA_HTML };
  const r = await claim({ page: 'no-such-venue-1234abcd', venue: 'Nobody' });
  assert.equal(r.status, 404);
  assert.deepEqual(await r.json(), { ok: false, error: 'unknown_page' });
  assert.equal(stored.length, 0);
});

test('a real page served under another slug is refused', async () => {
  site = { status: 200, html: REAL_HTML };
  const r = await claim({ page: 'no-such-venue-1234abcd', venue: 'Nobody' });
  assert.equal(r.status, 404);
  assert.deepEqual(await r.json(), { ok: false, error: 'unknown_page' });
  assert.equal(stored.length, 0);
});

test('a 404 from the site is refused', async () => {
  site = { status: 404, html: 'Not found' };
  const r = await claim({ page: 'no-such-venue-1234abcd', venue: 'Nobody' });
  assert.equal(r.status, 404);
  assert.deepEqual(await r.json(), { ok: false, error: 'unknown_page' });
  assert.equal(stored.length, 0);
});

test('bad input is rejected before the site is fetched', async () => {
  for (const body of [{ page: 'ab', venue: 'X' }, { page: '../etc', venue: 'X' }, { page: REAL_SLUG, venue: '  ' }]) {
    const r = await claim(body);
    assert.equal(r.status, 400);
    assert.deepEqual(await r.json(), { ok: false, error: 'invalid' });
  }
  assert.equal(fetched.length, 0);
});

test('only POST is accepted', async () => {
  const r = await claim(null, 'GET');
  assert.equal(r.status, 405);
  assert.deepEqual(await r.json(), { ok: false, error: 'method' });
});
