/* Aura Service: FormSubmit Form Handling
   Dynamically sets _next to the exact absolute URL of thanks.html on page load,
   allowing native browser POST submission directly to FormSubmit.
   With _captcha=false, FormSubmit skips its own confirmation page and
   immediately redirects the browser to thanks.html. */
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

  function init() {
    var thanksUrl = resolveThanksUrl();

    document.querySelectorAll('form[action*="formsubmit.co/"]').forEach(function (form) {
      // Ensure _next hidden input exists and is set to the absolute thanks.html URL
      var nextInput = form.querySelector('input[name="_next"]');
      if (!nextInput) {
        nextInput = document.createElement('input');
        nextInput.type = 'hidden';
        nextInput.name = '_next';
        form.insertBefore(nextInput, form.firstChild);
      }
      nextInput.value = thanksUrl;

      // Ensure _captcha is false so FormSubmit redirects directly to _next without stopping
      var captchaInput = form.querySelector('input[name="_captcha"]');
      if (captchaInput) {
        captchaInput.value = 'false';
      }

      // Update button text to data-wait on submit without blocking native submission
      var btn = form.querySelector('[type="submit"]');
      form.addEventListener('submit', function () {
        if (nextInput) {
          nextInput.value = resolveThanksUrl();
        }
        if (btn) {
          var wait = btn.getAttribute('data-wait');
          if (wait) {
            btn.value = wait;
          }
        }
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
