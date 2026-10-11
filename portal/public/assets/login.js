/* Sign-in page. Progressive enhancement: the form also works without JS. */
(function () {
  'use strict';

  var form = document.getElementById('login-form');
  var errorBox = document.getElementById('login-error');
  var submit = document.getElementById('submit');
  var pw = document.getElementById('password');
  var toggle = document.getElementById('toggle-password');
  var params = new URLSearchParams(location.search);

  var MESSAGES = {
    invalid: 'Incorrect login ID or password.',
    locked: 'Too many sign-in attempts. Wait 15 minutes and try again.',
    error: 'Sign-in failed. Please try again.',
    expired: 'Your session has ended. Please sign in again.'
  };

  function showError(text) {
    errorBox.textContent = text;
    errorBox.hidden = !text;
  }

  // Only same-site paths are honoured; the server re-validates this too.
  var next = params.get('next') || '/';
  if (!/^\/(?![\/\\])/.test(next)) next = '/';
  document.getElementById('next').value = next;

  var err = params.get('error');
  if (err && MESSAGES[err]) showError(MESSAGES[err]);

  fetch('/api/login', { credentials: 'same-origin' })
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (d) {
      if (!d) return;
      if (d.title) {
        document.getElementById('portal-title').textContent = d.title;
        document.title = 'Sign in — ' + d.title;
      }
      if (d.configured === false) {
        showError('Login is not configured yet. Set PORTAL_USERNAME and PORTAL_PASSWORD in Vercel, then redeploy.');
      }
    })
    .catch(function () { /* title is cosmetic */ });

  toggle.addEventListener('click', function () {
    var show = pw.type === 'password';
    pw.type = show ? 'text' : 'password';
    toggle.textContent = show ? 'Hide' : 'Show';
    toggle.setAttribute('aria-pressed', String(show));
    pw.focus();
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var username = form.username.value.trim();
    var password = form.password.value;
    if (!username || !password) {
      showError('Enter your login ID and password.');
      (username ? form.password : form.username).focus();
      return;
    }
    showError('');
    submit.disabled = true;
    submit.textContent = 'Signing in…';

    fetch('/api/login', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: username, password: password, next: next })
    })
      .then(function (r) {
        return r.json().catch(function () { return {}; }).then(function (d) { return { ok: r.ok, data: d }; });
      })
      .then(function (res) {
        if (res.ok && res.data.ok) {
          location.replace(res.data.next || '/');
          return;
        }
        showError(res.data.error || MESSAGES.error);
        form.password.value = '';
        form.password.focus();
      })
      .catch(function () {
        showError('Could not reach the server. Check your connection and try again.');
      })
      .then(function () {
        submit.disabled = false;
        submit.textContent = 'Sign in';
      });
  });

  form.username.focus();
})();
