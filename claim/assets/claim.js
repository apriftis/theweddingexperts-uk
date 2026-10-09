(function () {
  var CLAIM_API = '/api/claim';
  var ENDPOINT = 'https://formsubmit.co/ajax/info@theweddingexperts.uk';
  var cta = document.getElementById('tw-cta');
  var slug = cta ? cta.getAttribute('data-slug') : '';
  function track(name, extra) {
    if (!window.gtag) return;
    var params = { claim_slug: slug };
    for (var k in extra) params[k] = extra[k];
    window.gtag('event', name, params);
  }
  track('claim_preview_view');

  /* How far down the page people get: claim_scroll once per depth (25/50/75/90 % of the page), and
     claim_section_view once per section when at least a third of it has been on screen. */
  var depths = [25, 50, 75, 90];
  var scrollQueued = false;
  function checkDepth() {
    scrollQueued = false;
    var seen = (window.scrollY + window.innerHeight) / document.documentElement.scrollHeight * 100;
    while (depths.length && seen >= depths[0]) track('claim_scroll', { percent_scrolled: depths.shift() });
    if (!depths.length) window.removeEventListener('scroll', onScroll);
  }
  function onScroll() {
    if (!scrollQueued) { scrollQueued = true; requestAnimationFrame(checkDepth); }
  }
  window.addEventListener('scroll', onScroll, { passive: true });

  var SECTIONS = { 'listing-about': 'about', 'listing-gallery': 'photos', 'listing-collections': 'collections',
    'listing-deals': 'offers', 'listing-faq': 'faq', 'listing-reviews': 'reviews', 'tw-claim': 'claim' };
  if ('IntersectionObserver' in window) {
    var sectionSeen = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        track('claim_section_view', { section: SECTIONS[en.target.id] });
        sectionSeen.unobserve(en.target);
      });
    }, { threshold: 0.33 });
    Object.keys(SECTIONS).forEach(function (id) {
      var el = document.getElementById(id);
      if (el) sectionSeen.observe(el);
    });
  }

  /* Platform links and buttons are inert: show what they will do instead. */
  var toast = document.getElementById('tw-toast');
  var toastTimer;
  function showToast() {
    toast.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toast.hidden = true; }, 2600);
  }
  document.addEventListener('click', function (ev) {
    var el = ev.target.closest('[data-inert]');
    if (!el) return;
    ev.preventDefault();
    showToast();
  });
  /* The hero quote bar is a <form> on the platform; here nothing may submit (Enter in its date
     field included), whatever the builder already did to its button. */
  document.addEventListener('submit', function (ev) {
    ev.preventDefault();
    showToast();
  }, true);

  /* Lightbox, as on the platform: Fancybox 6 bound to every [data-fancybox] anchor
     (FancyboxWrapper.tsx), grouped by its value - "profile-hero-gallery" for the hero's hidden
     anchors (ProfileHero.tsx), "professional-listing-gallery" for the Photos grid
     (ListingGalleryLightbox.tsx). */
  var Fancybox = window.Fancybox;
  if (Fancybox) Fancybox.bind('[data-fancybox]', {});

  /* ProfileHero.tsx openGallery: the "All photos" pill and the invisible cover button both click
     the first hero anchor, which opens the hero gallery at its first photo. */
  document.querySelectorAll('.profile-hero__open, .profile-hero__pill:not(.profile-hero__pill--icon)')
    .forEach(function (btn) {
      btn.addEventListener('click', function () {
        var first = document.querySelector('[data-fancybox="profile-hero-gallery"]');
        if (first) first.click();
      });
    });

  /* ProfessionalProfilePage.tsx's bio clamp: "Read more" drops .is-clamped, "Show less" puts it
     back (listing:profileHero.readMore / readLess). */
  var bioToggle = document.querySelector('.profile-bio__toggle');
  var bio = document.querySelector('.profile-bio');
  if (bioToggle && bio) bioToggle.addEventListener('click', function () {
    var expanded = bioToggle.getAttribute('aria-expanded') !== 'true';
    bio.classList.toggle('is-clamped', !expanded);
    bioToggle.setAttribute('aria-expanded', String(expanded));
    bioToggle.textContent = expanded ? 'Show less' : 'Read more';
  });

  /* Real-wedding cards link to a collection page on the platform; the preview has none, so each
     card opens that collection's photos (data-collection-photos, set by the builder) instead. */
  document.querySelectorAll('a[data-collection-photos]').forEach(function (card) {
    card.addEventListener('click', function (ev) {
      ev.preventDefault();
      var urls;
      try { urls = JSON.parse(card.getAttribute('data-collection-photos')); } catch (e) { return; }
      if (window.Fancybox && urls.length) {
        window.Fancybox.show(urls.map(function (src) { return { src: src, type: 'image' }; }));
      }
    });
  });

  /* Reviews rail arrows: a port of ReviewsSection.tsx's scrollBy - nudges the track only, by
     ~90% of its visible width, and is never disabled at the ends (the platform doesn't disable
     them either). */
  var reviewsTrack = document.querySelector('.listing-reviews__track');
  if (reviewsTrack) {
    var scrollReviews = function (direction) {
      reviewsTrack.scrollBy({ left: direction * Math.round(reviewsTrack.clientWidth * 0.9), behavior: 'smooth' });
    };
    var reviewsPrev = document.querySelector('.listing-reviews__arrow--prev');
    var reviewsNext = document.querySelector('.listing-reviews__arrow--next');
    if (reviewsPrev) reviewsPrev.addEventListener('click', function () { scrollReviews(-1); });
    if (reviewsNext) reviewsNext.addEventListener('click', function () { scrollReviews(1); });
  }

  /* Phone-only sticky section tabs: a port of the platform's components/profile/ProfileSectionNav.tsx
     and lib/profileSectionNav.ts. Once the top section (section.profile-top - hero, quote bar and
     action row - the editorial layout's triggerRef, detailsRef) has scrolled fully off the top,
     the bar is shown and body gets
     has-profile-section-nav (which slides the site header away); the active pill follows the
     section being read. Scroll-position reads per animation frame rather than an
     IntersectionObserver, which never fires in a hidden browser pane. */
  var MOBILE_QUERY = '(max-width: 991.98px)'; /* respond-below(custom991) */
  var BODY_CLASS = 'has-profile-section-nav';
  var SCROLL_GAP = 8;    /* gap left between the bar and a section heading after a tap */
  var TAP_LOCK_MS = 900; /* the spy ignores scroll positions this long after a tap */
  var SECTION_KEYS = {
    'listing-about': 'about', 'listing-faq': 'faq', 'listing-gallery': 'photos',
    'listing-collections': 'collections', 'listing-deals': 'deals', 'listing-reviews': 'reviews'
  };

  /* lib/profileSectionNav.ts: the last section whose top has reached `offset`; at the very
     bottom of the page the last one wins, or a short final section could never become active. */
  function activeSectionIndex(tops, offset, atPageBottom) {
    if (tops.length === 0) return -1;
    if (atPageBottom) return tops.length - 1;
    var active = 0;
    tops.forEach(function (top, i) { if (top <= offset) active = i; });
    return active;
  }

  function atPageBottom() {
    return window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;
  }

  var bar = document.querySelector('nav.profile-section-nav');
  var strip = bar && bar.querySelector('.profile-section-nav__strip');
  var trigger = document.querySelector('section.profile-top');
  var pills = bar ? Array.prototype.slice.call(bar.querySelectorAll('button[data-scroll-to]')) : [];

  if (bar && strip && trigger && pills.length) {
    var mq = window.matchMedia(MOBILE_QUERY);
    var visible = null;
    var active = null;
    var lockUntil = 0;
    var cancelSettle = null;
    var frame = 0;

    /* The component's render plus its "keep the active pill in view" effect (deps [active, visible]):
       scrolls the strip only - scrollIntoView would also nudge the page vertically mid-scroll. */
    var commit = function (nextVisible, nextActive) {
      var changed = false;
      if (nextVisible !== visible) {
        visible = nextVisible;
        changed = true;
        bar.classList.toggle('is-visible', visible);
        bar.setAttribute('aria-hidden', String(!visible));
        pills.forEach(function (p) { p.tabIndex = visible ? 0 : -1; });
      }
      if (nextActive !== active) {
        active = nextActive;
        changed = true;
        pills.forEach(function (p) {
          var on = p === active;
          p.classList.toggle('is-active', on);
          if (on) p.setAttribute('aria-current', 'true'); else p.removeAttribute('aria-current');
        });
      }
      if (!changed || !visible || !active) return;
      var left = active.offsetLeft - (strip.clientWidth - active.offsetWidth) / 2;
      strip.scrollTo({ left: Math.max(0, left), behavior: 'smooth' });
    };

    var update = function () {
      frame = 0;
      var show = mq.matches && trigger.getBoundingClientRect().bottom <= 0;
      commit(show, active);
      document.body.classList.toggle(BODY_CLASS, show);
      if (!show || Date.now() < lockUntil) return;

      var offset = bar.offsetHeight + SCROLL_GAP + 1;
      var present = pills
        .map(function (p) { return { pill: p, el: document.getElementById(p.getAttribute('data-scroll-to')) }; })
        .filter(function (s) { return s.el !== null; });
      var i = activeSectionIndex(
        present.map(function (s) { return s.el.getBoundingClientRect().top; }), offset, atPageBottom());
      if (i >= 0) commit(visible, present[i].pill);
    };
    var onScroll = function () {
      if (!frame) frame = window.requestAnimationFrame(update);
    };

    var onTap = function (pill, position) {
      var el = document.getElementById(pill.getAttribute('data-scroll-to'));
      if (!el) return;
      if (window.gtag) {
        window.gtag('event', 'listing_section_nav_click', {
          section: SECTION_KEYS[el.id] || el.id, position: position
        });
      }
      commit(visible, pill);
      if (cancelSettle) cancelSettle();

      var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      var miss = function () { return el.getBoundingClientRect().top - bar.offsetHeight - SCROLL_GAP; };
      var aim = function () {
        lockUntil = Date.now() + TAP_LOCK_MS;
        window.scrollTo({ top: window.scrollY + miss(), behavior: reduce ? 'auto' : 'smooth' });
      };

      /* Lazy images above the target load while the page scrolls past them and push it down, so
         one scrollTo can land short. Re-aim when the scroll settles, a few times at most, and give
         up the moment the visitor scrolls. */
      var tries = 0;
      var timer = 0;
      var stop = function () {
        window.clearTimeout(timer);
        window.removeEventListener('touchstart', stop);
        window.removeEventListener('wheel', stop);
        cancelSettle = null;
      };
      var settle = function () {
        if (Math.abs(miss()) > 4 && !atPageBottom() && tries++ < 3) {
          aim();
          timer = window.setTimeout(settle, TAP_LOCK_MS);
        } else {
          stop();
        }
      };
      window.addEventListener('touchstart', stop, { passive: true });
      window.addEventListener('wheel', stop, { passive: true });
      cancelSettle = stop;
      aim();
      timer = window.setTimeout(settle, TAP_LOCK_MS);
    };

    pills.forEach(function (pill, i) {
      pill.addEventListener('click', function () { onTap(pill, i + 1); });
    });

    /* Initial state as rendered (hidden, first tab active), then the first real read. */
    visible = false;
    active = pills[0];
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    if (mq.addEventListener) mq.addEventListener('change', onScroll);
    else if (mq.addListener) mq.addListener(onScroll);
  }

  /* Pinned phone contact bar: a port of components/leadCapture/MobileContactBar.tsx.
     - body.has-mobile-contact-bar (set by the builder) pads the page by --mobile-contact-bar-h,
       the bar's measured height, kept current with a ResizeObserver.
     - Editorial layout (hideWhileVisibleRef = the hero quote bar's wrapper): the bar stays tucked
       (slid down, aria-hidden, inert) while that wrapper is on screen (lib/mobileContactBar.ts
       isOnScreen), and slides up once it has scrolled out of view; rAF-throttled rect reads on
       scroll/resize, as the component does. */
  var mobileBar = document.querySelector('.mobile-contact-bar');
  var quoteWrap = document.querySelector('.profile-quote-bar-wrap');
  if (mobileBar) {
    var applyBarHeight = function () {
      document.body.style.setProperty('--mobile-contact-bar-h', Math.ceil(mobileBar.offsetHeight) + 'px');
    };
    applyBarHeight();
    if (window.ResizeObserver) new ResizeObserver(applyBarHeight).observe(mobileBar);

    if (quoteWrap) {
      var barFrame = 0;
      var setTucked = function (tucked) {
        mobileBar.classList.toggle('mobile-contact-bar--tucked', tucked);
        if (tucked) {
          mobileBar.setAttribute('aria-hidden', 'true');
          mobileBar.setAttribute('inert', '');
        } else {
          mobileBar.removeAttribute('aria-hidden');
          mobileBar.removeAttribute('inert');
        }
      };
      var updateBar = function () {
        barFrame = 0;
        var r = quoteWrap.getBoundingClientRect();
        setTucked(r.bottom >= 0 && r.top <= window.innerHeight);
      };
      var onBarScroll = function () {
        if (!barFrame) barFrame = window.requestAnimationFrame(updateBar);
      };
      updateBar();
      window.addEventListener('scroll', onBarScroll, { passive: true });
      window.addEventListener('resize', onBarScroll);
    }
  }

  /* FAQ: 4 shown, the 5th faded, the rest hidden, as on the platform. */
  var faqToggle = document.querySelector('#listing-faq .listing-faq-toggle');
  if (faqToggle) faqToggle.addEventListener('click', function () {
    var open = faqToggle.getAttribute('aria-expanded') !== 'true';
    document.querySelectorAll('#listing-faq .listing-faq-entry').forEach(function (entry, i) {
      if (i === 4) {
        entry.classList.toggle('listing-faq-entry-faded', !open);
        if (open) entry.removeAttribute('aria-hidden'); else entry.setAttribute('aria-hidden', 'true');
      }
      if (i > 4) entry.hidden = !open;
    });
    faqToggle.setAttribute('aria-expanded', String(open));
    faqToggle.firstChild.nodeValue = open ? 'Show fewer questions' : 'Show all questions';
    faqToggle.querySelector('i').className = open ? 'feather-chevron-up' : 'feather-chevron-down';
  });

  if (!cta) return;
  var venue = cta.getAttribute('data-venue');
  var btn = document.getElementById('tw-claim-btn');
  var unders = cta.querySelectorAll('.tw-under');
  var errorBox = document.getElementById('tw-error');
  var done = document.getElementById('tw-done');
  function fail(msg) { errorBox.textContent = msg; errorBox.hidden = false; }

  if (!btn) return;
  var mailto = 'mailto:info@theweddingexperts.uk?subject=' + encodeURIComponent('Claim: ' + venue) +
    '&body=' + encodeURIComponent('Please keep our free listing for ' + venue + '.\n\nPage: ' + location.href + '\n');
  var mailMode = false;

  /* Our own endpoint (workers/claim) records the claim: it is on this site's domain, so blockers that
     stop formsubmit.co can't stop it. FormSubmit then emails it to info@ as before. */
  function record() {
    return fetch(CLAIM_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ venue: venue, page: slug })
    })
      .then(function (r) { if (!r.ok) throw new Error('http_' + r.status); return r.json(); })
      .then(function (d) { if (!d || d.ok !== true) throw new Error('rejected'); });
  }

  function email() {
    var payload = {
      _subject: 'Claim: ' + venue,
      _template: 'table',
      venue: venue,
      page: slug,
      message: venue + ' clicked "Claim my free listing" on their private preview.'
    };
    return fetch(ENDPOINT, {
      method: 'POST',
      referrerPolicy: 'origin',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(payload)
    })
      .then(function (r) { if (!r.ok) throw new Error('http_' + r.status); return r.json(); })
      .then(function (d) {
        /* FormSubmit can answer 200 with success "false" when it hasn't delivered. */
        if (d && String(d.success) === 'false') throw new Error('rejected');
      });
  }

  function reason(err) { return String((err && err.message) || err).slice(0, 100); }

  /* With one retry each; the email after a 1.2s pause, as most of its failures are a dropped request. */
  function retry(fn, label) {
    return fn().catch(function (err) {
      track('claim_retry', { error_reason: label + ':' + reason(err) });
      return new Promise(function (resolve) { setTimeout(resolve, 1200); }).then(fn);
    });
  }

  /* The claim counts once either the record or the email has gone through: a recorded claim whose email
     is blocked is still picked up from the record. claim_recorded / claim_emailed (and their _failed
     twins) show how often each path works. */
  function send() {
    var recorded = retry(record, 'record').then(
      function () { track('claim_recorded'); return true; },
      function (err) { track('claim_record_failed', { error_reason: reason(err) }); return false; });
    var emailed = retry(email, 'email').then(
      function () { track('claim_emailed'); return true; },
      function (err) { track('claim_email_failed', { error_reason: reason(err) }); return err; });
    return Promise.all([recorded, emailed]).then(function (r) {
      if (r[0] !== true && r[1] !== true) throw r[1];
    });
  }

  /* The reason goes into the event name as well: error_reason isn't a registered GA4 dimension, so
     claim_failed_network / _rejected / _http are what the reports can actually show. */
  function failKind(err) {
    var m = String((err && err.message) || err);
    return m === 'rejected' ? 'rejected' : (m.indexOf('http_') === 0 ? 'http' : 'network');
  }

  btn.addEventListener('click', function () {
    if (mailMode) {
      track('claim_mailto');
      window.location.href = mailto;
      return;
    }
    errorBox.hidden = true;
    btn.disabled = true;
    track('claim_click');
    /* If neither the record nor the email gets through, even after a retry each, the button turns into
       a ready-written email. */
    send()
      .then(function () {
        track('claim_sent');
        btn.hidden = true;
        unders.forEach(function (p) { p.hidden = true; });
        done.hidden = false;
        done.scrollIntoView({ behavior: 'smooth', block: 'center' });
      })
      .catch(function (err) {
        var kind = failKind(err);
        track('claim_failed', { error_reason: String((err && err.message) || err).slice(0, 100) });
        track('claim_failed_' + kind);
        btn.disabled = false;
        mailMode = true;
        btn.textContent = 'Email us to claim';
        fail("Sorry, that didn't go through from this browser. Tap “Email us to claim” and send the " +
          'ready-written email, or just reply to our email. Either way your page is kept.');
      });
  });
})();
