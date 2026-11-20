/* Aura Service: Form Handling with FormSubmit AJAX & Branded Redirect
   Submits forms asynchronously to FormSubmit AJAX endpoint so the visitor
   never navigates away to a third-party domain or encounters DNS/browser errors.
   Upon submission, smoothly redirects to the branded thanks.html page. */
(function () {
  'use strict';

  function resolveThanksUrl() {
    try {
      var brandLink = document.querySelector('a.brand-logo') || document.querySelector('a[href*="index.htm"]');
      if (brandLink && brandLink.href) {
        return brandLink.href.replace(/index\.htm.*$/, 'thanks.html');
      }
      return new URL('thanks.html', window.location.href).href;
    } catch (e) {
      return window.location.origin + '/thanks.html';
    }
  }

  function getSubject(form) {
    var subjectInput = form.querySelector('input[name="_subject"]');
    if (subjectInput && subjectInput.value) {
      return subjectInput.value;
    }
    return form.classList.contains('contact-form')
      ? 'New Project Enquiry - Aura Service'
      : 'New Newsletter Subscription - Aura Service';
  }

  function handleForm(form) {
    var thanksUrl = resolveThanksUrl();

    // Ensure hidden fields exist for no-JS fallback
    var nextInput = form.querySelector('input[name="_next"]');
    if (!nextInput) {
      nextInput = document.createElement('input');
      nextInput.type = 'hidden';
      nextInput.name = '_next';
      form.insertBefore(nextInput, form.firstChild);
    }
    nextInput.value = thanksUrl;

    var captchaInput = form.querySelector('input[name="_captcha"]');
    if (captchaInput) {
      captchaInput.value = 'false';
    }

    var wrap = form.closest('.w-form') || form.parentNode;
    var failEl = wrap ? wrap.querySelector('.w-form-fail') : null;
    var submitBtn = form.querySelector('[type="submit"]');

    form.addEventListener('submit', function (e) {
      // If HTML5 form validation fails, let browser show standard prompts
      if (typeof form.checkValidity === 'function' && !form.checkValidity()) {
        return;
      }

      e.preventDefault();
      e.stopPropagation();

      var originalBtnValue = submitBtn ? submitBtn.value : '';
      var waitText = submitBtn ? (submitBtn.getAttribute('data-wait') || 'Please wait...') : 'Please wait...';

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.value = waitText;
      }
      if (failEl) {
        failEl.style.display = 'none';
      }

      // Collect data
      var payload = {};
      var elements = form.querySelectorAll('input, textarea, select');
      for (var i = 0; i < elements.length; i++) {
        var el = elements[i];
        if (!el.name || el.type === 'submit') continue;
        if (el.name === '_honey' && el.value) {
          // Honeypot caught spam, fake success and redirect
          window.location.href = resolveThanksUrl();
          return;
        }
        var fieldKey = el.getAttribute('data-name') || el.name;
        payload[fieldKey] = el.value;
      }

      payload._subject = getSubject(form);
      payload._template = 'table';
      payload._captcha = 'false';

      var actionUrl = form.getAttribute('action') || 'https://formsubmit.co/auraserviceinfo@gmail.com';
      var ajaxUrl = actionUrl.replace('formsubmit.co/', 'formsubmit.co/ajax/');

      var controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
      var timeoutId = controller ? setTimeout(function () { controller.abort(); }, 12000) : null;

      fetch(ajaxUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload),
        signal: controller ? controller.signal : undefined
      })
        .then(function (res) {
          if (timeoutId) clearTimeout(timeoutId);
          return res.json().catch(function () { return { success: res.ok }; });
        })
        .then(function (data) {
          // Both success="true" and activation-pending message mean FormSubmit accepted the submission
          window.location.href = resolveThanksUrl();
        })
        .catch(function (err) {
          if (timeoutId) clearTimeout(timeoutId);
          console.warn('FormSubmit AJAX request failed:', err);

          // If network error occurred, restore the submit button so user isn't stuck
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.value = originalBtnValue;
          }
          if (failEl) {
            failEl.style.display = 'block';
            if (typeof failEl.scrollIntoView === 'function') {
              failEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
          }
        });
    });
  }

  function init() {
    var forms = document.querySelectorAll('form[action*="formsubmit.co/"]');
    for (var i = 0; i < forms.length; i++) {
      handleForm(forms[i]);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
