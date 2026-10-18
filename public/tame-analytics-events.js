/* Tame Dynamics reusable, no-PII website analytics events.
 * Copy as /tame-analytics-events.js to each site, after Umami's script.
 * Do not transmit names, emails, phone numbers, search queries or form data.
 */
(function () {
  "use strict";
  var accepted = new Set([
    "phone_click", "email_click", "booking_click",
    "quote_click", "enquiry_start", "enquiry_attempt",
    "enquiry_submitted", "booking_confirmed", "quote_submitted",
    "order_completed"
  ]);
  function track(name) {
    if (!accepted.has(name)) return;
    if (window.tameAnalyticsAllowed?.() !== true) return;
    if (window.umami && typeof window.umami.track === "function") {
      window.umami.track(name);
    }
  }
  function enquiryForm(target) {
    if (window.tameAnalyticsAllowed?.() !== true || !target?.closest) return null;
    var form = target.closest('form');
    if (!form) return null;
    if (form.matches('form[data-tame-enquiry-form]')) return form;
    // Existing public contact forms need no application bundle changes. Only
    // inspect element types; never read field values or infer completed leads.
    if (!/(?:^|\/)(?:contact|contact-us)\/?$/.test(location.pathname) ||
        form.querySelector('input[type="password"],input[autocomplete^="cc-"]')) return null;
    return form.querySelector('input[type="email"]') && form.querySelector('textarea') ? form : null;
  }
  document.addEventListener("click", function (event) {
    var element = event.target;
    if (!element || !element.closest) return;
    var link = element.closest("a[href]");
    if (link) {
      var href = link.getAttribute("href") || "";
      if (/^tel:/i.test(href)) track("phone_click");
      else if (/^mailto:/i.test(href)) track("email_click");
    }
    var target = element.closest("[data-tame-analytics-event]");
    if (target) track(target.getAttribute("data-tame-analytics-event"));
  }, true);
  document.addEventListener("focusin", function (event) {
    var target = event.target;
    if (!target || !target.closest) return;
    var form = enquiryForm(target);
    if (!form || form.dataset.tameAnalyticsStarted === "1") return;
    form.dataset.tameAnalyticsStarted = "1";
    track("enquiry_start");
  }, true);
  document.addEventListener("submit", function (event) {
    var form = enquiryForm(event.target);
    if (form) {
      track("enquiry_attempt");
    }
  }, true);
  // Fire this ONLY after an authoritative server confirmation, never on click.
  // document.dispatchEvent(new CustomEvent("tame:conversion",
  //   { detail: { name: "enquiry_submitted" } }));
  document.addEventListener("tame:conversion", function (event) {
    var name = event.detail && event.detail.name;
    if (typeof name === "string") track(name);
  });
})();
