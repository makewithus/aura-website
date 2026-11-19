/* Aura Service: send FormSubmit forms in the background and show the site's own
   success / error messages (.w-form-done / .w-form-fail) instead of leaving the page.
   Without JavaScript the forms still submit normally to their action URL. */
(function () {
  'use strict';

  function show(el, on) { if (el) el.style.display = on ? 'block' : 'none'; }

  function subjectFor(form) {
    return form.classList.contains('contact-form')
      ? 'New enquiry from the Aura Service website'
      : 'New newsletter sign-up from the Aura Service website';
  }

  function handle(form) {
    var wrap = form.closest('.w-form') || form.parentNode;
    var done = wrap.querySelector('.w-form-done');
    var fail = wrap.querySelector('.w-form-fail');
    var btn = form.querySelector('[type="submit"]');

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      e.stopImmediatePropagation();

      var data = {};
      Array.prototype.forEach.call(form.querySelectorAll('input, textarea, select'), function (el) {
        if (!el.name || el.type === 'submit') return;
        data[el.getAttribute('data-name') || el.name] = el.value;
      });
      data._subject = subjectFor(form);
      data._template = 'table';
      data._captcha = 'false';

      var label = btn ? btn.value : '';
      if (btn) { btn.disabled = true; btn.value = btn.getAttribute('data-wait') || 'Please wait...'; }
      show(fail, false);

      fetch(form.getAttribute('action').replace('formsubmit.co/', 'formsubmit.co/ajax/'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(data)
      })
        .then(function (r) { return r.json(); })
        .then(function (res) {
          if (String(res && res.success) === 'true') {
            form.reset();
            show(form, false);
            show(done, true);
          } else {
            throw new Error((res && res.message) || 'Submission failed');
          }
        })
        .catch(function () { show(fail, true); })
        .then(function () { if (btn) { btn.disabled = false; btn.value = label; } });
    }, true);
  }

  function init() {
    Array.prototype.forEach.call(document.querySelectorAll('form[action*="formsubmit.co/"]'), handle);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
