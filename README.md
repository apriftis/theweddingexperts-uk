# theweddingexperts.uk

Coming-soon page for the UK launch. One static HTML file, no build step, no
dependencies. Served by GitHub Pages straight from `main`.

## Files

| File | What it is |
|---|---|
| `index.html` | The entire page. CSS and JS are inline. |
| `CNAME` | Tells GitHub Pages the custom domain. Do not delete. |
| `img/` | Hero photograph (wide and portrait crops), two supporting photos, gold logo lockup and mark. |
| `robots.txt`, `sitemap.xml` | So the page can be indexed before launch. |
| `.nojekyll` | Stops GitHub running Jekyll over the files. |

## Before you go live

**1. Activate the form.** Signups go to `admin@theweddingexperts.gr`, set in
`index.html`:

```js
var ENDPOINT = 'https://formsubmit.co/ajax/admin@theweddingexperts.gr';
```

FormSubmit needs no account, but it does need activating once: the **first**
submission sends a confirmation link to that mailbox, and nothing is delivered
until someone clicks it. So make one test submission as soon as the page is
live, click the link in the email, and confirm a second test arrives.

The address is not displayed anywhere on the page. It does appear in the page
source, since a static form has to name its endpoint somewhere, but no contact
address is shown to visitors.

**2. Point the domain at GitHub Pages.**

Apex `A` records:

```
185.199.108.153
185.199.109.153
185.199.110.153
185.199.111.153
```

Plus a `www` CNAME to `<your-github-username>.github.io`.

If the domain sits on Cloudflare, leave these records **grey-clouded (DNS only)**
until GitHub finishes issuing the TLS certificate. Proxying blocks the domain
validation and the repo gets stuck on "certificate pending". Turn the proxy on
afterwards if you want it.

**3. Turn Pages on.** Repo Settings, Pages, source `main`, folder `/`. Tick
"Enforce HTTPS" once the certificate is issued.

## Design notes

The palette and type are sampled from the **live** production site, so the two
read as one brand. Note that the main frontend repo's bundled `style.css`
contains a crimson `#c10037` several hundred times: that is dead template CSS
and appears nowhere on the rendered site. Do not reintroduce it.

| Token | Value | What it is |
|---|---|---|
| `--paper` | `#fcfaf7` | Ground. Same value the live site uses |
| `--ink` | `#111826` | Headings |
| `--ink-soft` | `#414651` | Body copy |
| `--accent` | `#a85a42` | Brand terracotta. The only accent |
| `--accent-dark` | `#8e4835` | CTA hover |
| `--sage` | `#7d8a63` | Brand sage. List numerals only |
| Display face | Playfair Display | Same as the production site |
| Body face | Montserrat | Same as the production site |

Three rules worth keeping if you edit the CSS:

- **Terracotta is the only accent.** Sage appears solely in the list numerals.
  Adding a third accent colour breaks the palette.
- **The hero scrim gradients hardcode the paper colour** as `rgba(252,250,247,…)`
  because CSS gradients cannot take a bare custom property with an alpha. If you
  change `--paper`, change those eleven stops too or you get a visible seam.
- **The hero mobile overrides must stay at the end of the stylesheet.** They
  share specificity with the base hero rules, so source order decides the
  winner. Moving them earlier silently breaks the mobile layout.

Every text and background pair clears WCAG AA. The logo is used as supplied, in
gold; logotypes are exempt from contrast minimums under WCAG 1.4.3.

## Editing the copy

All the text is in `index.html` as plain HTML. There is no CMS and no template
layer. Search for the sentence you want and change it.

Two things worth knowing:

- The page makes no claims about track record or supplier numbers. If you add
  any, make sure the figures are real and verifiable.
- Categories in the signup form are a plain `<select>`. Add or remove `<option>`
  lines to change them.

## Swapping the form backend later

The form posts JSON via `fetch` and handles its own validation, success and
error states, so moving off FormSubmit means changing one line. Any endpoint
that accepts a JSON POST and returns 2xx works: a Lambda Function URL, a
Cloudflare Worker, MailerLite. Change `ENDPOINT` and, if the field names differ,
the `payload` object just below it.

## Notes

- The photographs are AI generated placeholders. Swap them for real work when
  you have it. Keep `img/hero.jpg` at 16:9, `img/hero-sm.jpg` at 3:4 (it is a
  portrait crop of the same scene, used below 720px, because a 16:9 image crops
  badly on a phone), `img/detail.jpg` at 3:4 and `img/craft.jpg` at 16:9.
- Scroll reveals are hidden only when JavaScript is confirmed running, anything
  already on screen is revealed synchronously, and a timer catches the rest. The
  page cannot render blank if a script or observer fails.
- Fonts load from Google Fonts. Self-host them if you want to drop the
  third-party request.
