# theweddingexperts.uk

Coming-soon page for the UK launch. One static HTML file, no build step, no
dependencies. Served by GitHub Pages straight from `main`.

## Files

| File | What it is |
|---|---|
| `index.html` | The entire page. CSS and JS are inline. Its design is called v3 in analytics. |
| `v2/index.html` | An earlier ad variant, kept out of search (`noindex`). |
| `CNAME` | Tells GitHub Pages the custom domain. Do not delete. |
| `img/` | Hero photograph (`meadow-1600`/`-2400` for desktop, `meadow-sm` portrait crop for phones), app screenshots in `img/app/`, gold logo lockup and mark. `cotswolds*` is `/v2/`'s hero; `hero*`, `craft` and `detail` belong to the earlier main page. |
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

**4. Meta Pixel.** The Pixel (dataset) ID from Events Manager is set in
`index.html`:

```js
var META_PIXEL_ID = '1081044958136877';
```

Set it back to `''` to switch the Pixel off: the script is then never loaded
and nothing reaches Meta. While it is set, the page sends:

| Meta event | When | Mirrors GA4 |
|---|---|---|
| `PageView` | Page load | `page_view` |
| `CTAClick` (custom) | Any button that jumps to the signup form, with `cta_location` | `cta_click` |
| `FormStart` (custom) | First keystroke in the signup form | `form_start` |
| `Lead` | Signup delivered successfully, with `content_category` and the hashed email | `generate_lead` |

Optimise lead campaigns for `Lead`. Check each event in Events Manager's Test
Events tab before spending anything.

The page has **no cookie banner**, so the Pixel and GA4 set cookies without
asking. UK PECR requires opt-in consent for advertising cookies. Add a banner
before scaling spend.

**Conversions API is not set up yet.** It needs a server to hold the access
token (the page is static). When you add one, send the server-side `Lead` with
the same `event_id` as the browser's `eventID` (the `leadEventId` variable in
the form script), or Meta counts every signup twice.

## Google Analytics

Both pages report to the GA4 property **Weddings UK** (`G-RSM9TPGFJ1`), which is
separate from the `.gr` site's property. Local testing reports there too, with
hostname `localhost`, so filter on `hostName = theweddingexperts.uk` when you
read the numbers. Every event on `/v2/` also carries `page_variant: 'v2'`, and
every event on the main page carries `page_variant: 'v3'`, the name of its
current design. That separates it from the earlier main page, whose events had
no `page_variant`.

| GA4 event | When | Parameters |
|---|---|---|
| `page_view` | Page load | |
| `scroll_25`, `scroll_50`, `scroll_75` | The bottom of the screen passes that share of the page, once each per page load | `percent_scrolled` |
| `scroll` | Same at 90%. Sent by GA4 enhanced measurement, not the page | `percent_scrolled` |
| `cta_click` | Any button that jumps to the signup form | `cta_location`; on the main page's hero also `category` (`(none)` if not picked) |
| `hero_category` | Main page only: a category is picked in the hero, which fills it in on the form | `category` |
| `form_view` | The signup form reaches the top 70% of the screen | `form_id` |
| `form_field_focus` | First tap or tab into each field, before typing | `form_field` (`name`, `email`, `category`) |
| `form_start` | First keystroke in the form | `form_id` |
| `form_error` | Validation failed or the network request failed | `error_reason` |
| `form_submit` | Form passed validation and is being sent | `form_id` |
| `generate_lead` | Signup delivered | `category` |

The scroll steps are separate event names so they can be counted without any
setup. To break down by `cta_location`, `form_field` or `page_variant`, register
each as an **event-scoped custom dimension** (Admin, Custom definitions). GA only
fills a custom dimension from the day it is created; earlier data stays unsplit.

The scroll, form view and field focus events go to GA4 only, not the Meta Pixel.

## Design notes

Green and gold on a warm paper, with a photographic hero under a night-green
scrim. The tokens are at the top of the stylesheet in `index.html`. Note that
the main frontend repo's bundled `style.css` contains a crimson `#c10037`
several hundred times: that is dead template CSS and appears nowhere on the
rendered site. Do not reintroduce it.

| Token | Value | What it is |
|---|---|---|
| `--paper` | `#f8f6f1` | Page ground |
| `--band` | `#efece4` | Section band |
| `--night` | `#121e1c` | Hero base, under the photograph |
| `--deep` | `#1e332f` | Dark green panel |
| `--ink` | `#1b2624` | Headings |
| `--soft` | `#4a5552` | Body copy |
| `--sage` | `#3d6a62` | The action colour on light grounds |
| `--ivory` | `#fbf6ea` | Type, and the action colour, on dark grounds |
| `--gold` | `#c4a24c` | Hairlines, rings, dividers |
| `--gold-soft` | `#e2cf98` | Gold used as text on dark |
| `--gold-ink` | `#8a6d22` | Gold used as text on paper |
| Display face | Newsreader | |
| Body face | Figtree | |

Rules worth keeping if you edit the CSS:

- **The hero scrim gradients hardcode the night colour** as `rgba(18,30,28,…)`
  because CSS gradients cannot take a bare custom property with an alpha. If you
  change `--night`, change every one of those stops too or you get a visible seam.
- **The scrim is tuned to the photograph.** It runs deeper through the top band,
  and on phones through the headline, where the couple's sunlit backs sit behind
  the type. If you change the photo, recheck the headline and kicker contrast on
  a phone before shipping.
- **The hero mobile overrides must stay after the base hero rules.** They share
  specificity, so source order decides the winner. Moving them earlier silently
  breaks the mobile layout.

The logo is used as supplied, in gold; logotypes are exempt from contrast
minimums under WCAG 1.4.3.

## Editing the copy

All the text is in `index.html` as plain HTML. There is no CMS and no template
layer. Search for the sentence you want and change it.

Two things worth knowing:

- The page makes no claims about track record or supplier numbers. If you add
  any, make sure the figures are real and verifiable.
- The category list appears twice, as plain `<select>`s: the hero picker
  (`#quick-category`) and the signup form (`#category`). Picking one in the hero
  fills in the form, so keep the two lists identical when you add or remove an
  `<option>`.
- Links to the earlier page's form, `/#get-listed`, still land on the signup
  section through an empty anchor at its top.

## Swapping the form backend later

The form posts JSON via `fetch` and handles its own validation, success and
error states, so moving off FormSubmit means changing one line. Any endpoint
that accepts a JSON POST and returns 2xx works: a Lambda Function URL, a
Cloudflare Worker, MailerLite. Change `ENDPOINT` and, if the field names differ,
the `payload` object just below it.

## Notes

- The hero is a licensed Magnific stock photo (Premium licence, no attribution
  needed). Keep the original and its licence PDF in Google Drive under
  TheWeddingExperts → Stock images, next to the register of every stock purchase.
  Do not commit originals here: the licence forbids redistributing the file.
  `img/meadow-1600.jpg` and `img/meadow-2400.jpg` are the full frame (about
  16:9); `img/meadow-sm.jpg` is a 10:16 portrait crop centred on the couple,
  used up to 780px wide, because a wide frame crops badly on a phone.
- Scroll reveals are hidden only when JavaScript is confirmed running, anything
  already on screen is revealed synchronously, and a timer catches the rest. The
  page cannot render blank if a script or observer fails.
- Fonts load from Google Fonts. Self-host them if you want to drop the
  third-party request.
