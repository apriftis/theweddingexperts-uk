/* POST https://theweddingexperts.uk/api/claim - records a "Claim my free listing" click on a private claim
   preview (claim/assets/claim.js).

   The browser only talks to our own domain here, so ad blockers, antivirus web shields and office firewalls
   that block formsubmit.co can't stop a claim being recorded. The page still emails the claim to
   info@theweddingexperts.uk through FormSubmit from the browser; this record is what catches the claims
   whose email never arrives. (Forwarding to FormSubmit from the Worker was tried: FormSubmit rate-limits
   Cloudflare's shared outgoing addresses, 429.)

   Each claim is one key in the CLAIMS KV namespace, "<ISO time>_<page slug>". Read them with
   hitched-vendors/cold-emails/claims.py, or:  npx wrangler kv key list --binding CLAIMS --remote
*/

const SITE = 'https://theweddingexperts.uk';
const SLUG = /^[a-z0-9][a-z0-9-]{2,90}$/;

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  });
}

async function pageExists(slug) {
  const r = await fetch(`${SITE}/claim/${slug}/`, { method: 'HEAD', cf: { cacheTtl: 300 } });
  return r.ok;
}

export default {
  async fetch(request, env) {
    if (request.method !== 'POST') return json({ ok: false, error: 'method' }, 405);

    let body;
    try { body = await request.json(); } catch { return json({ ok: false, error: 'json' }, 400); }
    const slug = String(body.page || '').toLowerCase();
    const venue = String(body.venue || '').trim().slice(0, 200);
    if (!SLUG.test(slug) || !venue) return json({ ok: false, error: 'invalid' }, 400);
    if (!(await pageExists(slug))) return json({ ok: false, error: 'unknown_page' }, 404);

    const at = new Date().toISOString();
    await env.CLAIMS.put(`${at}_${slug}`, JSON.stringify({
      at, slug, venue,
      test: body.test === true,
      country: request.cf && request.cf.country,
      user_agent: (request.headers.get('user-agent') || '').slice(0, 300),
    }));
    return json({ ok: true });
  },
};
