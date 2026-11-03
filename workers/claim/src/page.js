/* Is this HTML the real claim preview for `slug`?

   Every generated preview (claim/<slug>/index.html) carries the claim block that claim/assets/claim.js
   reads, with the page's own slug on it:

     <div class="tw-cta" data-slug="<slug>" data-venue="..." id="tw-cta">

   A 200 alone proves nothing: once the site has no password, the React app answers 200 for any path,
   /claim/<anything>/ included, and its HTML never contains this block. So a page counts only when its
   #tw-cta element names the same slug that was asked for. */

const CTA_TAG = /<[a-z][a-z0-9]*\b[^>]*\bid\s*=\s*["']tw-cta["'][^>]*>/i;
const DATA_SLUG = /\bdata-slug\s*=\s*["']([^"']*)["']/i;

export function isClaimPage(html, slug) {
  const tag = String(html || '').match(CTA_TAG);
  if (!tag) return false;
  const found = tag[0].match(DATA_SLUG);
  return !!found && found[1] === slug;
}
