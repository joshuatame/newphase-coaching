/* Basic daily page-load totals are separate from optional Umami analytics.
 * No visitor identifier, page URL, referrer or browser data is sent to the counter.
 * Copy this file unchanged; configure only public routes on its script element.
 */
(() => {
  'use strict';
  const config = document.currentScript?.dataset;
  if (!config || window.tameAnalyticsAllowed) return;
  const id = config.websiteId || '';
  const domains = (config.domains || '').split(',');
  const paths = (config.paths || '').split(',');
  const normalize = value => value.replace(/\/$/, '') || '/';
  const eligible = () => paths.includes(normalize(location.pathname));
  const preferencesPath = () => (config.preferencesPaths || '').split(',').includes(normalize(location.pathname));
  const navigation = config.trackNavigation === 'true';
  if (!/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(id) ||
      !domains.includes(location.hostname) ||
      (!navigation && !eligible() && !preferencesPath())) return;
  const legacyKey = 'tame.analytics-choice.v1';
  const key = config.preferenceScope === 'site' ? legacyKey + '.' + id : legacyKey;
  const lifetime = 180 * 86400000;
  const privacySignal = () => navigator.globalPrivacyControl === true ||
    [navigator.doNotTrack, window.doNotTrack, navigator.msDoNotTrack].some(v => String(v) === '1' || v === 'yes');
  let choice = null, expires = 0, scriptLoaded = false, pageSent = false;
  let australianDefault = false, storageAvailable = true;
  function readChoice() {
    try {
      let saved = JSON.parse(localStorage.getItem(key) || 'null');
      // Carry forward an old opt-out, never another tenant's opt-in.
      if (!saved && key !== legacyKey) {
        const legacy = JSON.parse(localStorage.getItem(legacyKey) || 'null');
        if (legacy?.allowed === false) saved = legacy;
      }
      choice = saved?.expires > Date.now() && typeof saved.allowed === 'boolean' ? saved.allowed : null;
      expires = choice === null ? 0 : saved.expires;
    } catch { choice = null; expires = 0; storageAvailable = false; }
  }
  readChoice();
  const enabled = () => !privacySignal() && (choice !== null
    ? choice === true && expires > Date.now()
    : australianDefault && storageAvailable);
  const allowed = () => eligible() && enabled();
  window.tameAnalyticsAllowed = allowed;
  const events = new Set(['phone_click', 'email_click', 'booking_click', 'quote_click',
    'enquiry_start', 'enquiry_attempt', 'enquiry_submitted', 'booking_confirmed',
    'quote_submitted', 'order_completed', 'service_navigation', 'service_enquiry_click']);
  window.tameAnalyticsBeforeSend = (type, payload) => {
    if (!allowed() || type !== 'event' || !payload || (payload.name && !events.has(payload.name))) return null;
    let referrer = '';
    try { referrer = new URL(document.referrer).origin; } catch { /* No referring site. */ }
    // Allowlist fields: never pass form data, IDs, query strings, fragments or arbitrary properties.
    return { website: id, hostname: location.hostname, url: location.pathname,
      title: normalize(location.pathname), referrer, screen: payload.screen, language: payload.language,
      ...(payload.name ? { name: payload.name } : {}) };
  };
  function pageview() {
    if (allowed() && !pageSent && window.umami?.track) {
      pageSent = true;
      window.umami.track();
    }
  }
  function startOptional() {
    if (!allowed()) return;
    if (scriptLoaded) { pageview(); return; }
    scriptLoaded = true;
    const script = document.createElement('script');
    script.src = 'https://analytics.tame-dynamics.com/script.js';
    script.async = true;
    script.dataset.websiteId = id;
    script.dataset.domains = domains.join(',');
    script.dataset.autoTrack = 'false';
    script.dataset.excludeSearch = 'true';
    script.dataset.excludeHash = 'true';
    script.dataset.doNotTrack = 'true';
    script.dataset.beforeSend = 'tameAnalyticsBeforeSend';
    script.addEventListener('load', pageview);
    script.addEventListener('error', () => { scriptLoaded = false; script.remove(); });
    document.head.appendChild(script);
  }
  function element(tag, text, parent) {
    const node = document.createElement(tag);
    if (text) node.textContent = text;
    parent.appendChild(node);
    return node;
  }
  function mount() {
    const panel = element('section', '', document.body);
    panel.className = 'tame-privacy';
    panel.setAttribute('aria-label', 'Website privacy choices');
    const heading = element('h2', 'Your privacy choices', panel);
    heading.id = 'tame-privacy-heading';
    element('p', config.basicCount === 'true'
      ? 'We keep a daily page-load total, including when you say no. This counter saves no visitor ID, IP address, page URL or browsing history.'
      : 'Optional analytics helps us understand use of our public website.', panel);
    element('p', config.defaultAnalytics === 'australia'
      ? 'Optional analytics starts automatically for visits recognised as Australian. Choose No to stop it. Elsewhere, it stays off unless you allow it. It measures visits, popular pages and enquiry actions, without receiving your enquiry details.'
      : 'Allow optional analytics to measure visits, popular pages and enquiry actions. It does not receive your enquiry details. You can change your choice here at any time.', panel);
    const policy = element('a', 'Read our privacy notice', panel);
    policy.href = config.privacyUrl?.startsWith('/') && !config.privacyUrl.startsWith('//') ? config.privacyUrl : '/privacy';
    const status = element('p', '', panel);
    status.setAttribute('role', 'status');
    const buttons = element('div', '', panel);
    buttons.className = 'tame-privacy-actions';
    const no = element('button', 'No optional analytics', buttons);
    const yes = element('button', 'Allow optional analytics', buttons);
    const preferences = element('button', 'Privacy choices', document.body);
    preferences.className = 'tame-privacy-toggle';
    for (const button of [no, yes, preferences]) button.type = 'button';
    function render() {
      status.textContent = privacySignal() ? 'Your browser privacy setting keeps optional analytics off.'
        : enabled() ? 'Optional analytics is currently on.' : 'Optional analytics is currently off.';
      yes.disabled = privacySignal();
    }
    function save(value) {
      choice = value;
      expires = Date.now() + lifetime;
      try { localStorage.setItem(key, JSON.stringify({ allowed: value, expires })); } catch { /* This page only. */ }
      render();
      panel.hidden = true;
      preferences.focus();
      startOptional();
    }
    no.addEventListener('click', () => save(false));
    yes.addEventListener('click', () => { if (!privacySignal()) save(true); });
    preferences.addEventListener('click', () => { render(); panel.hidden = !panel.hidden; if (!panel.hidden) no.focus(); });
    window.addEventListener('storage', event => {
      if (event.key === key || event.key === legacyKey || event.key === null) { readChoice(); render(); startOptional(); }
    });
    let currentPath = null, regionChecked = false;
    function refresh() {
      const path = normalize(location.pathname);
      if (path === currentPath) return;
      currentPath = path;
      pageSent = false;
      const publicPage = eligible();
      preferences.hidden = !publicPage && !preferencesPath();
      panel.hidden = preferences.hidden || choice !== null || privacySignal();
      render();
      // Exact public routes only. No query strings, cookies, identity or retries.
      if (publicPage && config.basicCount === 'true') {
        fetch('https://app.tame-dynamics.com/tame/tameos/api/website-intelligence/count', {
          method: 'POST', body: id, headers: { 'Content-Type': 'text/plain' },
          mode: 'cors', credentials: 'omit', referrerPolicy: 'no-referrer', keepalive: true,
        }).catch(() => {});
      }
      startOptional();
      checkCountry();
    }
    function checkCountry() {
      // Country only; never retain trace metadata or let a late result override No.
      if (regionChecked || !eligible() || config.defaultAnalytics !== 'australia') return;
      if (choice !== null || !storageAvailable || privacySignal()) return;
      regionChecked = true;
      fetch('https://analytics.tame-dynamics.com/cdn-cgi/trace', {
        credentials: 'omit', referrerPolicy: 'no-referrer', cache: 'no-store',
        signal: AbortSignal.timeout(2500),
      }).then(response => response.ok ? response.text() : '').then(trace => {
        australianDefault = trace.length < 4096 && /^loc=AU\r?$/m.test(trace);
        render();
        startOptional();
      }).catch(() => {});
    }
    if (navigation) {
      // Preserve the router's history methods and return values; ignore query/hash-only updates.
      for (const method of ['pushState', 'replaceState']) {
        const original = window.history[method];
        window.history[method] = function (...args) {
          const result = original.apply(this, args);
          queueMicrotask(refresh);
          return result;
        };
      }
      window.addEventListener('popstate', refresh);
    }
    refresh();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount, { once: true });
  else mount();
})();
