# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary: UK wedding suppliers (venues, photographers, florists, caterers, bands, hair and make up, planners and so on), usually owner-operators or small teams, evaluating whether to claim a founding listing before The Wedding Experts opens to couples in the UK. They arrive from ads, search or outreach, often on a phone between jobs, and decide in a minute whether this is worth a form.

Couples are the marketplace's other side but are not the audience of this page (confirmed 2026-09-15).

## Product Purpose

The Wedding Experts is a wedding-suppliers marketplace already running in Greece (theweddingexperts.gr) and launching in the UK. This repo is the UK pre-launch landing page. Its single job is supplier signups: founding listings built at no cost before launch. Success is more completed signup forms (GA4 events `cta_click`, `form_start`, `form_submit`, `generate_lead`).

## Positioning

Couples reach a supplier in three ways (confirmed by the user, 2026-09-15): (1) they call the supplier directly from the profile; (2) they send the supplier a request directly (Quote Request) from the profile; (3) they post a brief and suppliers contact them. For (3): couples post a brief (occasion, date, location, guests, services needed). The team approves it, and matching suppliers in that category and area see it as a lead. Leads are anonymous until a supplier unlocks the customer's details, and each category has a limited number of seats per lead, so a brief is not blasted to every supplier. Suppliers also receive direct quote requests from their profile, and can message couples.

## Operating Context

What a supplier gets in the real app (English UI labels):

- Public profile: Description, Services Provided, Gallery, Videos, Business Info, FAQ, map, reviews ("Verified review"), star rating, starting price ("from ...") and guest capacity, "Message" and "Request Quote" buttons.
- Leads: anonymous request cards ("Request #1034", month, occasion, location, guests, contact time, category seats such as "5 of 5 open", "Anonymous until unlocked", "View details"), then "Unlock customer details" and "Message customer".
- Quote Requests: direct enquiries with date, guests, budget and message.
- Messages inbox.
- Analytics: visitor journey (Visits, Interest, Work opportunities), "What to do next" tips, month-on-month detail.
- Dashboard nav: Dashboard, Profile, My Listing, Guide, My Offers (deals), Collections, Subscription, Analytics, Bookmarks, Messages, Quote Requests, Leads, Reviews, Settings.

## Capabilities and Constraints

- Plans: FREE, BASIC, PREMIUM. A free listing exists (name, description, phone, monthly stats). BASIC adds gallery (12), website and socials, starting price, reviews, chat, contact details. PREMIUM adds 20 photos, top search ranking, shown in all regions, "Replies within 24 hours" badge. UK prices are undecided and must not be shown.
- Suppliers do not send priced quotes inside the app; they respond by unlocking a lead and messaging. Copy must not claim a quote builder.
- The app currently formats prices in EUR and says Greece in places; UK product screenshots are localised to GBP and UK places at capture time.
- Static single-file HTML on GitHub Pages, no build step. Form posts JSON to FormSubmit (`ENDPOINT` in `index.html`). GA4 `G-RSM9TPGFJ1`.
- Signup fields: business name, your name, email, town or county covered, category, website (optional). Honeypot `_honey`.

## Brand Commitments

- Name "The Wedding Experts" and the gold logo lockup and mark (`img/logo-lockup.webp`, `img/logo-mark.webp`) stay as supplied.
- Palette and typography may be explored beyond the current cream, Playfair Display and terracotta (user, 2026-09-15).
- Voice: plain, direct British English, no hype.

## Evidence on Hand

- Real product UI, captured from the local app with sample UK data and labelled as a preview.
- Photographs in `img/` are AI-generated placeholders.
- No UK suppliers, couples, reviews, testimonials, press or supplier counts exist yet. Do not fabricate any, and do not show Greek-site figures as UK traction.

## Product Principles

1. Show the product, do not describe it: a supplier should see what their leads and profile will look like.
2. One action on the page: get a founding listing.
3. Claim only what the app does today.
4. Early is the advantage: founding profiles are built at no cost before couples arrive.
