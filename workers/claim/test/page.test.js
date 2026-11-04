import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { isClaimPage } from '../src/page.js';

const CLAIM_DIR = fileURLToPath(new URL('../../../claim/', import.meta.url));

function realPages() {
  return readdirSync(CLAIM_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory() && d.name !== 'assets')
    .map((d) => d.name)
    .filter((slug) => existsSync(`${CLAIM_DIR}${slug}/index.html`));
}

const SPA_SHELL = '<!doctype html><html lang="en-GB"><head><title>The Wedding Experts</title>'
  + '<link rel="canonical" href="https://theweddingexperts.uk/claim/some-venue-1234abcd/"></head>'
  + '<body><div id="root"></div><script type="module" src="/assets/index.js"></script></body></html>';

test('every claim page in the repo passes for its own slug', () => {
  const slugs = realPages();
  assert.ok(slugs.length > 0, 'no claim pages found');
  const failing = slugs.filter((slug) => !isClaimPage(readFileSync(`${CLAIM_DIR}${slug}/index.html`, 'utf8'), slug));
  assert.deepEqual(failing, []);
});

test('a real page does not pass for a different slug', () => {
  const [a, b] = realPages();
  assert.equal(isClaimPage(readFileSync(`${CLAIM_DIR}${a}/index.html`, 'utf8'), b), false);
});

test('the React app shell is not a claim page, even when it echoes the path', () => {
  assert.equal(isClaimPage(SPA_SHELL, 'some-venue-1234abcd'), false);
});

test('empty or missing HTML is not a claim page', () => {
  assert.equal(isClaimPage('', 'some-venue-1234abcd'), false);
  assert.equal(isClaimPage(undefined, 'some-venue-1234abcd'), false);
});

test('the slug must sit on the #tw-cta element itself', () => {
  assert.equal(isClaimPage('<div data-slug="abc-1234"></div><div id="tw-cta"></div>', 'abc-1234'), false);
  assert.equal(isClaimPage('<div id="tw-cta"></div>', 'abc-1234'), false);
  assert.equal(isClaimPage('<div id="tw-cta-x" data-slug="abc-1234"></div>', 'abc-1234'), false);
});

test('attribute order and quoting do not matter', () => {
  assert.equal(isClaimPage('<div class="tw-cta" data-slug="abc-1234" data-venue="X" id="tw-cta">', 'abc-1234'), true);
  assert.equal(isClaimPage("<section id='tw-cta' data-slug='abc-1234'>", 'abc-1234'), true);
});

test('a slug that only starts the same does not pass', () => {
  assert.equal(isClaimPage('<div data-slug="abc-1234" id="tw-cta">', 'abc-12'), false);
  assert.equal(isClaimPage('<div data-slug="abc-12" id="tw-cta">', 'abc-1234'), false);
});
