(function () {
  var ENDPOINT = 'https://formsubmit.co/ajax/info@theweddingexperts.uk';
  var cta = document.getElementById('tw-cta');
  var slug = cta ? cta.getAttribute('data-slug') : '';
  function track(name) { if (window.gtag) window.gtag('event', name, { claim_slug: slug }); }
  track('claim_preview_view');

  /* Platform links and buttons are inert: show what they will do instead. */
  var toast = document.getElementById('tw-toast');
  var toastTimer;
  document.addEventListener('click', function (ev) {
    var el = ev.target.closest('[data-inert]');
    if (!el) return;
    ev.preventDefault();
    toast.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toast.hidden = true; }, 2600);
  });

  /* Lightbox, as on the platform: Fancybox 6 bound to every [data-fancybox] anchor
     (FancyboxWrapper.tsx), grouped by its value - "banner-gallery" for the photo header,
     "professional-listing-gallery" for the Photos grid (ListingGalleryLightbox.tsx). */
  var Fancybox = window.Fancybox;
  if (Fancybox) Fancybox.bind('[data-fancybox]', {});

  /* "Show Photos" opens the banner gallery at its first photo (ProfessionalProfilePage.tsx). */
  var showPhotos = document.querySelector('.gallery-slider .showphotos button');
  if (showPhotos) showPhotos.addEventListener('click', function () {
    var first = document.querySelector('[data-fancybox="banner-gallery"]');
    if (first) first.click();
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

  /* Phone-only sticky section tabs: a port of the platform's components/profile/ProfileSectionNav.tsx
     and lib/profileSectionNav.ts. Once the name/title block (section.details-description, the
     platform's triggerRef) has scrolled fully off the top, the bar is shown and body gets
     has-profile-section-nav (which slides the site header away); the active pill follows the
     section being read. Scroll-position reads per animation frame rather than an
     IntersectionObserver, which never fires in a hidden browser pane. */
  var MOBILE_QUERY = '(max-width: 991.98px)'; /* respond-below(custom991) */
  var BODY_CLASS = 'has-profile-section-nav';
  var SCROLL_GAP = 8;    /* gap left between the bar and a section heading after a tap */
  var TAP_LOCK_MS = 900; /* the spy ignores scroll positions this long after a tap */
  var SECTION_KEYS = {
    'listing-about': 'about', 'listing-faq': 'faq', 'listing-gallery': 'photos',
    'listing-deals': 'deals', 'listing-reviews': 'reviews'
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
  var trigger = document.querySelector('section.details-description');
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
  btn.addEventListener('click', function () {
    errorBox.hidden = true;
    btn.disabled = true;
    track('claim_click');
    var payload = {
      _subject: 'Claim: ' + venue,
      _template: 'table',
      venue: venue,
      page: slug,
      message: venue + ' clicked "Claim my free listing" on their private preview.'
    };
    fetch(ENDPOINT, {
      method: 'POST',
      referrerPolicy: 'origin',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(payload)
    })
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(function (d) {
        /* FormSubmit can answer 200 with success "false" when it hasn't delivered. */
        if (d && String(d.success) === 'false') throw new Error('rejected');
        track('claim_sent');
        btn.hidden = true;
        unders.forEach(function (p) { p.hidden = true; });
        done.hidden = false;
        done.scrollIntoView({ behavior: 'smooth', block: 'center' });
      })
      .catch(function () {
        btn.disabled = false;
        fail("Sorry, that didn't send. Please try again, or email info@theweddingexperts.uk.");
      });
  });
})();
