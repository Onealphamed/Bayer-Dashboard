/*
 * Master Dashboard — hub UI.
 *
 * Everything is built with createElement/textContent: no HTML strings, so
 * dashboard names, notes and URLs can never inject markup. Passwords are never
 * part of the list; they are fetched one at a time from /api/reveal, held in
 * memory for 30 seconds, then dropped.
 */
(function () {
  'use strict';

  var REVEAL_MS = 30000;
  var STATUS_REFRESH_MS = 120000;
  var COLORS = ['indigo', 'blue', 'teal', 'green', 'amber', 'orange', 'rose', 'violet', 'slate'];

  var state = {
    me: null,
    items: [],
    rev: 0,
    mode: 'env',
    canEdit: false,
    seedErrors: [],
    status: Object.create(null),
    statusLoaded: false,
    checkedAt: null,
    query: '',
    category: 'all',
    secrets: Object.create(null), // id -> { username, password, timer, visible }
    openMenu: null
  };

  /* ---------------------------------------------------------------- helpers */

  function $(id) { return document.getElementById(id); }

  /** el('div', {className, text, attrs, on, style vars}, ...children) */
  function el(tag, props) {
    var node = document.createElement(tag);
    props = props || {};
    if (props.className) node.className = props.className;
    if (props.text !== undefined && props.text !== null) node.textContent = String(props.text);
    if (props.attrs) {
      Object.keys(props.attrs).forEach(function (k) {
        var v = props.attrs[k];
        if (v === false || v === null || v === undefined) return;
        node.setAttribute(k, v === true ? '' : String(v));
      });
    }
    if (props.vars) {
      Object.keys(props.vars).forEach(function (k) { node.style.setProperty(k, props.vars[k]); });
    }
    if (props.on) {
      Object.keys(props.on).forEach(function (ev) { node.addEventListener(ev, props.on[ev]); });
    }
    for (var i = 2; i < arguments.length; i++) {
      var c = arguments[i];
      if (c === null || c === undefined || c === false) continue;
      if (Array.isArray(c)) c.forEach(function (x) { if (x) node.appendChild(x); });
      else node.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
    }
    return node;
  }

  function safeHttpUrl(u) {
    try {
      var p = new URL(u);
      return (p.protocol === 'https:' || p.protocol === 'http:') ? p.toString() : null;
    } catch (e) {
      return null;
    }
  }

  function hostOf(u) {
    try { return new URL(u).host; } catch (e) { return u; }
  }

  function initials(name) {
    var words = String(name || '?').trim().split(/\s+/).filter(Boolean);
    var s = words.length > 1 ? words[0][0] + words[1][0] : (words[0] || '?').slice(0, 2);
    return s.toUpperCase();
  }

  function colorVar(c) {
    return 'var(--c-' + (COLORS.indexOf(c) >= 0 ? c : 'indigo') + ')';
  }

  function timeLabel(iso) {
    try {
      return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return '';
    }
  }

  function dateTimeLabel(iso) {
    try {
      return new Date(iso).toLocaleString([], { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return iso;
    }
  }

  function toast(text, isError) {
    var t = el('div', { className: 'toast' + (isError ? ' error' : ''), text: text });
    $('toasts').appendChild(t);
    setTimeout(function () { t.remove(); }, isError ? 6000 : 2600);
  }

  function api(path, opts) {
    opts = opts || {};
    var init = { method: opts.method || 'GET', credentials: 'same-origin', headers: {} };
    if (opts.body !== undefined) {
      init.headers['Content-Type'] = 'application/json';
      init.body = JSON.stringify(opts.body);
    }
    return fetch(path, init).then(function (res) {
      return res.json().catch(function () { return {}; }).then(function (data) {
        if (res.status === 401) {
          var next = location.pathname + location.search;
          location.replace('/login?error=expired' + (next !== '/' ? '&next=' + encodeURIComponent(next) : ''));
          throw new Error('Signed out');
        }
        if (!res.ok) {
          var err = new Error(data.error || 'Request failed (' + res.status + ')');
          err.status = res.status;
          err.data = data;
          throw err;
        }
        return data;
      });
    });
  }

  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text);
    }
    return new Promise(function (resolve, reject) {
      var ta = el('textarea', { attrs: { readonly: true, 'aria-hidden': 'true' } });
      ta.value = text;
      ta.className = 'sr-only';
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand('copy') ? resolve() : reject(new Error('copy failed'));
      } catch (e) {
        reject(e);
      } finally {
        ta.remove();
      }
    });
  }

  function download(filename, text) {
    var blob = new Blob([text], { type: 'application/json' });
    var a = el('a', { attrs: { href: URL.createObjectURL(blob), download: filename } });
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
  }

  /* ------------------------------------------------------------- dialogs */

  var dialogStack = [];

  function openDialog(opts) {
    var opener = document.activeElement;
    var titleId = 'dlg-' + Math.random().toString(36).slice(2);
    var closeBtn = el('button', {
      className: 'icon-btn', text: '×', attrs: { type: 'button', 'aria-label': 'Close' }
    });
    var dialog = el('div', {
      className: 'dialog' + (opts.size ? ' dialog-' + opts.size : ''),
      attrs: { role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': titleId }
    },
      el('div', { className: 'dialog-head' },
        el('div', { attrs: { style: null } },
          el('h2', { text: opts.title, attrs: { id: titleId } }),
          opts.subtitle ? el('p', { text: opts.subtitle }) : null),
        el('div', { className: 'spacer' }),
        closeBtn),
      el('div', { className: 'dialog-body' }, opts.body),
      opts.footer ? el('div', { className: 'dialog-foot' }, opts.footer) : null);
    var backdrop = el('div', { className: 'backdrop' }, dialog);

    function close() {
      var i = dialogStack.indexOf(entry);
      if (i >= 0) dialogStack.splice(i, 1);
      backdrop.remove();
      if (opts.onClose) opts.onClose();
      if (opener && opener.focus && document.contains(opener)) opener.focus();
    }
    var entry = { close: close, node: dialog };
    closeBtn.addEventListener('click', close);
    backdrop.addEventListener('mousedown', function (e) { if (e.target === backdrop) close(); });
    dialog.addEventListener('keydown', function (e) {
      if (e.key !== 'Tab') return;
      var f = dialog.querySelectorAll('button:not([disabled]), [href], input:not([type=hidden]):not([disabled]), textarea, select, [tabindex]:not([tabindex="-1"])');
      if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });
    document.body.appendChild(backdrop);
    dialogStack.push(entry);
    var focusTarget = dialog.querySelector('[autofocus]') || dialog.querySelector('input:not([type=hidden]), textarea, .dialog-foot .btn-primary') || closeBtn;
    focusTarget.focus();
    return entry;
  }

  function confirmDialog(title, message, confirmLabel, danger) {
    return new Promise(function (resolve) {
      var done = false;
      var ok = el('button', { className: 'btn ' + (danger ? 'btn-danger' : 'btn-primary'), text: confirmLabel, attrs: { type: 'button' } });
      var cancel = el('button', { className: 'btn', text: 'Cancel', attrs: { type: 'button' } });
      var d = openDialog({
        title: title, size: 'sm', body: el('p', { text: message }), footer: [cancel, ok],
        onClose: function () { if (!done) resolve(false); }
      });
      ok.addEventListener('click', function () { done = true; d.close(); resolve(true); });
      cancel.addEventListener('click', function () { d.close(); });
      ok.focus();
    });
  }

  /* --------------------------------------------------------------- menus */

  function closeMenu() {
    if (!state.openMenu) return;
    state.openMenu.menu.hidden = true;
    state.openMenu.button.setAttribute('aria-expanded', 'false');
    state.openMenu = null;
  }

  function toggleMenu(button, menu) {
    var wasOpen = state.openMenu && state.openMenu.menu === menu;
    closeMenu();
    if (wasOpen) return;
    menu.hidden = false;
    button.setAttribute('aria-expanded', 'true');
    state.openMenu = { button: button, menu: menu };
    var first = menu.querySelector('button:not([hidden])');
    if (first) first.focus();
  }

  document.addEventListener('mousedown', function (e) {
    if (state.openMenu && !state.openMenu.menu.contains(e.target) && !state.openMenu.button.contains(e.target)) closeMenu();
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      if (state.openMenu) { var b = state.openMenu.button; closeMenu(); b.focus(); return; }
      if (dialogStack.length) { dialogStack[dialogStack.length - 1].close(); return; }
    }
    if (e.key === '/' && !dialogStack.length) {
      var t = e.target;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
      e.preventDefault();
      $('search').focus();
    }
  });

  /* ----------------------------------------------------------- secrets */

  function forgetSecret(id) {
    var s = state.secrets[id];
    if (s) clearTimeout(s.timer);
    delete state.secrets[id];
  }

  function getSecret(id) {
    var cached = state.secrets[id];
    if (cached) return Promise.resolve(cached);
    return api('/api/reveal', { method: 'POST', body: { id: id } }).then(function (d) {
      var entry = { username: d.username, password: d.password, visible: false };
      entry.timer = setTimeout(function () {
        forgetSecret(id);
        refreshCreds(id);
      }, REVEAL_MS);
      state.secrets[id] = entry;
      return entry;
    });
  }

  /* ------------------------------------------------------------- render */

  function filteredItems() {
    var q = state.query.trim().toLowerCase();
    return state.items.filter(function (d) {
      if (state.category !== 'all' && (d.category || 'Uncategorised') !== state.category) return false;
      if (!q) return true;
      return [d.name, d.url, d.description, d.category, d.notes, d.username]
        .concat((d.links || []).map(function (l) { return l.label + ' ' + l.url; }))
        .join(' ').toLowerCase().indexOf(q) >= 0;
    });
  }

  function statusNode(id) {
    var s = state.status[id];
    var cls = 'status', label;
    if (!state.statusLoaded) { cls += ' checking'; label = 'Checking…'; }
    else if (!s) { label = 'Not checked'; }
    else if (s.state === 'up') { cls += ' up'; label = 'Online' + (s.ms ? ' · ' + s.ms + ' ms' : ''); }
    else if (s.state === 'down') { cls += ' down'; label = s.reason === 'timed out' ? 'Timed out' : (s.code ? 'Error ' + s.code : 'Offline'); }
    else { label = 'Not checked'; }
    var title = s && s.checkedAt ? 'Checked ' + timeLabel(s.checkedAt) + (s.code ? ' · HTTP ' + s.code : '') : '';
    return el('span', { className: cls, attrs: { 'data-status': id, title: title || null } },
      el('span', { className: 'dot', attrs: { 'aria-hidden': 'true' } }), label);
  }

  function linkPill(label, url, primary) {
    var href = safeHttpUrl(url);
    if (!href) return null;
    return el('a', {
      className: 'link-pill' + (primary ? ' primary' : ''),
      attrs: { href: href, target: '_blank', rel: 'noopener noreferrer' }
    }, label, el('span', { className: 'arrow', text: '↗', attrs: { 'aria-hidden': 'true' } }));
  }

  function credsNode(d) {
    var box = el('div', { className: 'creds', attrs: { 'data-creds': d.id } });
    fillCreds(box, d);
    return box;
  }

  function fillCreds(box, d) {
    box.textContent = '';
    if (!d.username && !d.hasPassword) {
      box.appendChild(el('div', { className: 'cred-none', text: 'No sign-in details saved for this dashboard.' }));
    }
    var secret = state.secrets[d.id];

    if (d.username) {
      box.appendChild(el('div', { className: 'cred-row' },
        el('span', { className: 'cred-label', text: 'Login ID' }),
        el('span', { className: 'cred-value', text: d.username, attrs: { title: d.username } }),
        el('span', { className: 'cred-actions' },
          el('button', {
            className: 'btn btn-sm', text: 'Copy', attrs: { type: 'button', 'aria-label': 'Copy login ID for ' + d.name },
            on: { click: function () {
              copyText(d.username).then(function () { toast('Login ID copied'); }, function () { toast('Copy failed', true); });
            } }
          }))));
    }

    if (d.hasPassword) {
      var visible = secret && secret.visible;
      var showBtn = el('button', {
        className: 'btn btn-sm', text: visible ? 'Hide' : 'Show',
        attrs: { type: 'button', 'aria-pressed': visible ? 'true' : 'false', 'aria-label': (visible ? 'Hide' : 'Show') + ' password for ' + d.name },
        on: { click: function () {
          if (visible) {
            state.secrets[d.id].visible = false;
            refreshCreds(d.id);
            return;
          }
          showBtn.disabled = true;
          getSecret(d.id).then(function (s) {
            s.visible = true;
            refreshCreds(d.id);
          }, function (err) {
            showBtn.disabled = false;
            toast(err.message, true);
          });
        } }
      });
      var copyBtn = el('button', {
        className: 'btn btn-sm', text: 'Copy',
        attrs: { type: 'button', 'aria-label': 'Copy password for ' + d.name },
        on: { click: function () {
          copyBtn.disabled = true;
          getSecret(d.id).then(function (s) {
            return copyText(s.password).then(function () { toast('Password copied — clears from this page in 30 s'); });
          }).catch(function (err) {
            toast(err.message || 'Copy failed', true);
          }).then(function () { copyBtn.disabled = false; });
        } }
      });
      box.appendChild(el('div', { className: 'cred-row' },
        el('span', { className: 'cred-label', text: 'Password' }),
        visible
          ? el('span', { className: 'cred-value', text: secret.password })
          : el('span', { className: 'cred-value masked', text: '••••••••••', attrs: { 'aria-label': 'Password hidden' } }),
        el('span', { className: 'cred-actions' }, showBtn, copyBtn)));
    }

    if (d.notes) box.appendChild(el('p', { className: 'notes', text: d.notes }));
  }

  function refreshCreds(id) {
    var d = state.items.filter(function (x) { return x.id === id; })[0];
    var box = document.querySelector('[data-creds="' + (window.CSS && CSS.escape ? CSS.escape(id) : id) + '"]');
    if (d && box) fillCreds(box, d);
  }

  function cardMenu(d, index, total) {
    var btn = el('button', {
      className: 'icon-btn', text: '⋯',
      attrs: { type: 'button', 'aria-label': 'Actions for ' + d.name, 'aria-haspopup': 'menu', 'aria-expanded': 'false' }
    });
    var menu = el('div', { className: 'menu', attrs: { role: 'menu', hidden: true } },
      el('button', { text: 'Edit', attrs: { type: 'button', role: 'menuitem' }, on: { click: function () { closeMenu(); openEditor(d); } } }),
      index > 0 ? el('button', { text: 'Move earlier', attrs: { type: 'button', role: 'menuitem' }, on: { click: function () { closeMenu(); move(d.id, -1); } } }) : null,
      index < total - 1 ? el('button', { text: 'Move later', attrs: { type: 'button', role: 'menuitem' }, on: { click: function () { closeMenu(); move(d.id, 1); } } }) : null,
      el('hr'),
      el('button', { className: 'danger', text: 'Delete', attrs: { type: 'button', role: 'menuitem' }, on: { click: function () { closeMenu(); remove(d); } } }));
    btn.addEventListener('click', function () { toggleMenu(btn, menu); });
    return el('div', { className: 'card-menu' }, btn, menu);
  }

  function card(d, index, total) {
    var links = [linkPill('Open', d.url, true)].concat((d.links || []).map(function (l) { return linkPill(l.label, l.url, false); }));
    return el('article', { className: 'card', vars: { '--accent': colorVar(d.color) }, attrs: { 'aria-label': d.name } },
      state.canEdit ? cardMenu(d, index, total) : null,
      el('div', { className: 'card-top' },
        el('div', { className: 'tile', text: initials(d.name), attrs: { 'aria-hidden': 'true' } }),
        el('div', { className: 'card-title' },
          el('h2', { text: d.name }),
          el('div', { className: 'card-host', text: hostOf(d.url), attrs: { title: d.url } }),
          el('div', { className: 'card-sub' },
            d.category ? el('span', { className: 'tag', text: d.category }) : null,
            statusNode(d.id)))),
      el('div', { className: 'card-body' },
        d.description ? el('p', { className: 'card-desc', text: d.description }) : null,
        el('div', { className: 'links' }, links)),
      credsNode(d));
  }

  function renderNotices(me) {
    var box = $('notices');
    box.textContent = '';
    if (!me || !state.canEdit) return;

    (me.warnings || []).forEach(function (w) {
      if (w.code === 'no_storage') return; // shown as its own, more useful notice below
      box.appendChild(el('div', { className: 'notice ' + (w.level === 'error' ? 'error' : 'warn') },
        el('span', { className: 'dot', attrs: { 'aria-hidden': 'true' } }),
        el('div', { className: 'notice-body', text: w.text })));
    });
    (state.seedErrors || []).forEach(function (e) {
      box.appendChild(el('div', { className: 'notice error' },
        el('div', { className: 'notice-body', text: e })));
    });
    if (state.mode !== 'redis') {
      box.appendChild(el('div', { className: 'notice info' },
        el('div', { className: 'notice-body' },
          el('b', { text: 'Read-only list. ' }),
          'No storage is connected, so this list comes from the DASHBOARDS environment variable. ',
          'You can still use “Add dashboard”: it generates the updated value to paste into Vercel. ',
          el('a', { text: 'Connect storage to save directly →', attrs: { href: '#' },
            on: { click: function (e) { e.preventDefault(); storageHelp(); } } }))));
    }
  }

  function renderChips() {
    var cats = Object.create(null);
    state.items.forEach(function (d) { var c = d.category || 'Uncategorised'; cats[c] = (cats[c] || 0) + 1; });
    var names = Object.keys(cats).sort();
    var box = $('chips');
    box.textContent = '';
    if (names.length < 2) { box.hidden = true; state.category = 'all'; return; }
    box.hidden = false;
    if (state.category !== 'all' && !cats[state.category]) state.category = 'all';
    ['all'].concat(names).forEach(function (c) {
      box.appendChild(el('button', {
        className: 'chip', attrs: { type: 'button', 'aria-pressed': state.category === c ? 'true' : 'false' },
        on: { click: function () { state.category = c; renderChips(); renderGrid(); } }
      }, c === 'all' ? 'All' : c, el('span', { className: 'n', text: c === 'all' ? state.items.length : cats[c] })));
    });
  }

  function renderSummary() {
    var n = state.items.length;
    var parts = [n + ' dashboard' + (n === 1 ? '' : 's')];
    if (state.statusLoaded && n) {
      var up = state.items.filter(function (d) { return state.status[d.id] && state.status[d.id].state === 'up'; }).length;
      parts.push(up + ' online');
      if (state.checkedAt) parts.push('checked ' + timeLabel(state.checkedAt));
    }
    $('summary-meta').textContent = parts.join(' · ');
  }

  function renderGrid() {
    var grid = $('grid');
    grid.setAttribute('aria-busy', 'false');
    grid.textContent = '';
    var items = filteredItems();
    if (!state.items.length) {
      grid.appendChild(el('div', { className: 'empty' },
        el('h2', { text: 'No dashboards yet' }),
        el('p', { text: state.canEdit ? 'Add your first dashboard to start building the hub.' : 'An admin has not added any dashboards yet.' }),
        state.canEdit ? el('button', { className: 'btn btn-primary', text: '+ Add dashboard', attrs: { type: 'button' }, on: { click: function () { openEditor(null); } } }) : null));
      return;
    }
    if (!items.length) {
      grid.appendChild(el('div', { className: 'empty' },
        el('h2', { text: 'No matches' }),
        el('p', { text: 'Nothing matches “' + state.query + '”.' })));
      return;
    }
    var total = state.items.length;
    items.forEach(function (d) { grid.appendChild(card(d, state.items.indexOf(d), total)); });
  }

  function renderAll() {
    renderNotices(state.me);
    renderChips();
    renderSummary();
    renderGrid();
  }

  /* ------------------------------------------------------------- data */

  function applyList(data) {
    state.items = data.items || [];
    state.rev = data.rev || 0;
    state.mode = data.mode || 'env';
    state.canEdit = !!data.canEdit;
    if (data.seedErrors) state.seedErrors = data.seedErrors;
    Object.keys(state.secrets).forEach(function (id) {
      if (!state.items.some(function (d) { return d.id === id; })) forgetSecret(id);
    });
  }

  function loadList() {
    return api('/api/dashboards').then(function (data) { applyList(data); renderAll(); });
  }

  function loadStatus() {
    return api('/api/status').then(function (data) {
      state.status = Object.assign(Object.create(null), data.results || {});
      state.statusLoaded = true;
      state.checkedAt = new Date().toISOString();
      document.querySelectorAll('[data-status]').forEach(function (node) {
        node.replaceWith(statusNode(node.getAttribute('data-status')));
      });
      renderSummary();
    }).catch(function () {
      state.statusLoaded = true;
      renderSummary();
    });
  }

  /** Handles the answer to any add / edit / delete / reorder. */
  function afterMutation(data, okMessage) {
    if (data.readOnly) {
      showEnvJson(data);
      return false;
    }
    applyList(data);
    renderAll();
    toast(okMessage);
    loadStatus();
    return true;
  }

  function onMutationError(err) {
    if (err.status === 409 && err.data && err.data.conflict) {
      toast(err.message, true);
      loadList();
      return;
    }
    toast(err.message || 'Something went wrong', true);
  }

  function move(id, delta) {
    var ids = state.items.map(function (d) { return d.id; });
    var i = ids.indexOf(id), j = i + delta;
    if (i < 0 || j < 0 || j >= ids.length) return;
    ids[i] = ids[j];
    ids[j] = id;
    api('/api/dashboards?action=reorder', { method: 'PUT', body: { ids: ids, rev: state.rev } })
      .then(function (d) { afterMutation(d, 'Order updated'); }, onMutationError);
  }

  function remove(d) {
    confirmDialog('Delete “' + d.name + '”?',
      'This removes the dashboard and its saved sign-in details from the hub. The dashboard itself is not affected.',
      'Delete', true).then(function (yes) {
      if (!yes) return;
      api('/api/dashboards?id=' + encodeURIComponent(d.id) + '&rev=' + state.rev, { method: 'DELETE' })
        .then(function (res) { forgetSecret(d.id); afterMutation(res, 'Dashboard deleted'); }, onMutationError);
    });
  }

  /* ------------------------------------------------------------- editor */

  function field(label, input, hint, name) {
    var wrap = el('div', { className: 'field', attrs: { 'data-field': name || null } },
      el('label', { text: label, attrs: { for: input.id } }), input,
      hint ? el('span', { className: 'hint', text: hint }) : null);
    return wrap;
  }

  function input(id, value, attrs) {
    var i = el('input', { attrs: Object.assign({ id: id, type: 'text', autocomplete: 'off', spellcheck: 'false' }, attrs || {}) });
    i.value = value || '';
    return i;
  }

  function linkRow(link) {
    var label = el('input', { attrs: { type: 'text', placeholder: 'Label, e.g. Admin panel', maxlength: '40', 'aria-label': 'Link label' } });
    var url = el('input', { attrs: { type: 'url', placeholder: 'https://…', maxlength: '2048', 'aria-label': 'Link URL' } });
    label.value = (link && link.label) || '';
    url.value = (link && link.url) || '';
    var row = el('div', { className: 'link-row' }, label, url,
      el('button', { className: 'icon-btn', text: '×', attrs: { type: 'button', 'aria-label': 'Remove link' },
        on: { click: function () { row.remove(); } } }));
    return row;
  }

  function openEditor(d) {
    var editing = !!d;
    var categories = Array.from(new Set(state.items.map(function (x) { return x.category; }).filter(Boolean))).sort();
    var listId = 'cat-list';

    var fName = input('f-name', d && d.name, { maxlength: '80', required: true, autofocus: true });
    var fUrl = input('f-url', d && d.url, { type: 'url', maxlength: '2048', required: true, placeholder: 'https://your-dashboard.vercel.app' });
    var fDesc = input('f-desc', d && d.description, { maxlength: '300', placeholder: 'What this dashboard is for' });
    var fCat = input('f-cat', d && d.category, { maxlength: '40', list: listId, placeholder: 'e.g. SEO, Client, Internal' });
    var dl = el('datalist', { attrs: { id: listId } }, categories.map(function (c) { var o = el('option'); o.value = c; return o; }));
    var fUser = input('f-user', d && d.username, { maxlength: '200', autocomplete: 'off' });
    var fPass = input('f-pass', '', {
      type: 'password', maxlength: '500', autocomplete: 'new-password',
      placeholder: editing && d.hasPassword ? 'Saved — leave blank to keep it' : ''
    });
    var passToggle = el('button', { className: 'reveal-toggle', text: 'Show', attrs: { type: 'button' },
      on: { click: function () {
        var show = fPass.type === 'password';
        fPass.type = show ? 'text' : 'password';
        passToggle.textContent = show ? 'Hide' : 'Show';
      } } });
    var clearPass = el('input', { attrs: { type: 'checkbox', id: 'f-clear' } });
    var fNotes = el('textarea', { attrs: { id: 'f-notes', maxlength: '1000', placeholder: 'Anything useful, e.g. how to change the password' } });
    fNotes.value = (d && d.notes) || '';

    var chosen = (d && d.color) || COLORS[state.items.length % COLORS.length];
    var swatches = el('div', { className: 'swatches', attrs: { role: 'radiogroup', 'aria-label': 'Accent colour' } },
      COLORS.map(function (c) {
        var r = el('input', { attrs: { type: 'radio', name: 'f-color', value: c, 'aria-label': c } });
        r.checked = c === chosen;
        return el('label', { className: 'swatch', vars: { '--sw': colorVar(c) } }, r, el('span'));
      }));

    var links = el('div', { attrs: { id: 'f-links' } }, ((d && d.links) || []).map(linkRow));
    var addLink = el('button', { className: 'btn btn-sm', text: '+ Add link', attrs: { type: 'button' },
      on: { click: function () {
        if (links.children.length >= 8) { toast('At most 8 extra links', true); return; }
        var row = linkRow(null);
        links.appendChild(row);
        row.querySelector('input').focus();
      } } });

    var formError = el('div', { className: 'form-alert', attrs: { role: 'alert', hidden: true } });
    var form = el('form', { attrs: { novalidate: true, id: 'dash-form' } },
      formError,
      field('Name *', fName, null, 'name'),
      field('Main URL *', fUrl, 'The address the Open button goes to.', 'url'),
      el('div', { className: 'row-2' },
        field('Category', fCat, null, 'category'),
        el('div', { className: 'field' }, el('label', { text: 'Accent colour' }), swatches)),
      dl,
      field('Description', fDesc, null, 'description'),
      el('div', { className: 'section-label', text: 'Extra links' }),
      links,
      el('div', { className: 'field field-inline' }, addLink, el('span', { className: 'hint', text: 'For admin panels, login pages, reports…' })),
      el('div', { className: 'section-label', text: 'Sign-in details' }),
      el('div', { className: 'row-2' },
        field('Login ID / username', fUser, null, 'username'),
        el('div', { className: 'field', attrs: { 'data-field': 'password' } },
          el('label', { text: 'Password', attrs: { for: 'f-pass' } }),
          el('div', { className: 'input-wrap' }, fPass, passToggle),
          editing && d.hasPassword ? el('label', { className: 'check' }, clearPass, 'Remove saved password') : null)),
      field('Notes', fNotes, null, 'notes'));

    var save = el('button', { className: 'btn btn-primary', text: editing ? 'Save changes' : 'Add dashboard', attrs: { type: 'submit', form: 'dash-form' } });
    var cancel = el('button', { className: 'btn', text: 'Cancel', attrs: { type: 'button' } });
    var dlg = openDialog({
      title: editing ? 'Edit dashboard' : 'Add a dashboard',
      subtitle: state.mode === 'redis'
        ? 'Saved instantly for everyone who uses this hub.'
        : 'No storage is connected — you will get the updated value to paste into Vercel.',
      body: form, footer: [cancel, save]
    });
    cancel.addEventListener('click', dlg.close);

    function clearErrors() {
      formError.hidden = true;
      form.querySelectorAll('.field.invalid').forEach(function (f) { f.classList.remove('invalid'); });
      form.querySelectorAll('.field .err').forEach(function (e) { e.remove(); });
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      clearErrors();
      var payload = {
        name: fName.value, url: fUrl.value.trim(), description: fDesc.value, category: fCat.value,
        username: fUser.value, notes: fNotes.value,
        color: (form.querySelector('input[name="f-color"]:checked') || {}).value,
        links: Array.prototype.map.call(links.children, function (row) {
          var ins = row.querySelectorAll('input');
          return { label: ins[0].value, url: ins[1].value.trim() };
        }),
        rev: state.rev
      };
      if (fPass.value) payload.password = fPass.value;
      else if (editing && clearPass.checked) payload.password = '';
      else if (!editing) payload.password = '';

      if (!payload.name.trim()) { markInvalid('name', 'Name is required.'); return; }
      if (!payload.url) { markInvalid('url', 'URL is required.'); return; }

      save.disabled = true;
      var req = editing
        ? api('/api/dashboards?id=' + encodeURIComponent(d.id), { method: 'PUT', body: payload })
        : api('/api/dashboards', { method: 'POST', body: payload });
      req.then(function (res) {
        if (editing) forgetSecret(d.id);
        dlg.close();
        afterMutation(res, editing ? 'Dashboard updated' : 'Dashboard added');
      }, function (err) {
        save.disabled = false;
        if (err.status === 400) {
          var f = err.data && err.data.field;
          var map = { Name: 'name', URL: 'url', Category: 'category', Description: 'description', Username: 'username', Notes: 'notes', password: 'password', links: null };
          var key = f && Object.prototype.hasOwnProperty.call(map, f) ? map[f] : null;
          if (key) markInvalid(key, err.message);
          else { formError.textContent = err.message; formError.hidden = false; }
          return;
        }
        if (err.status === 409 && err.data && err.data.conflict) {
          formError.textContent = err.message;
          formError.hidden = false;
          loadList();
          return;
        }
        formError.textContent = err.message;
        formError.hidden = false;
      });
    });

    function markInvalid(name, message) {
      var wrap = form.querySelector('[data-field="' + name + '"]');
      if (!wrap) { formError.textContent = message; formError.hidden = false; return; }
      wrap.classList.add('invalid');
      wrap.appendChild(el('span', { className: 'err', text: message }));
      var target = wrap.querySelector('input, textarea');
      if (target) target.focus();
    }
  }

  /* ------------------------------------------------- env-mode & admin panels */

  function showEnvJson(data) {
    var pretty = data.envJson;
    try { pretty = JSON.stringify(JSON.parse(data.envJson), null, 2); } catch (e) { /* keep raw */ }
    var box = el('textarea', { className: 'codebox', attrs: { readonly: true, 'aria-label': 'DASHBOARDS value', spellcheck: 'false' } });
    box.value = pretty;
    var copy = el('button', { className: 'btn btn-primary', text: 'Copy value', attrs: { type: 'button' } });
    var done = el('button', { className: 'btn', text: 'Done', attrs: { type: 'button' } });
    var d = openDialog({
      title: 'Paste this into Vercel to apply the change',
      subtitle: data.count + ' dashboard' + (data.count === 1 ? '' : 's') + ' in the updated list',
      size: 'wide',
      body: [
        el('div', { className: 'notice warn' }, el('div', { className: 'notice-body' },
          el('b', { text: 'Not saved yet. ' }), data.message || '',
          el('p', { text: 'This value contains passwords. Paste it only into Vercel’s environment variables.' }))),
        box,
        el('ol', { className: 'steps' },
          el('li', null, 'Vercel → this project → ', el('b', { text: 'Settings → Environment Variables' }), '.'),
          el('li', null, 'Edit ', el('code', { text: 'DASHBOARDS' }), ', replace its value with the one above, and save.'),
          el('li', null, el('b', { text: 'Deployments' }), ' → ⋯ on the latest deployment → ', el('b', { text: 'Redeploy' }), '.'))
      ],
      footer: [done, copy]
    });
    copy.addEventListener('click', function () {
      copyText(box.value).then(function () { toast('Copied — now paste it into Vercel'); }, function () {
        box.select();
        toast('Select-all and copy manually', true);
      });
    });
    done.addEventListener('click', d.close);
  }

  function storageHelp() {
    var connected = state.mode === 'redis';
    openDialog({
      title: connected ? 'Storage is connected' : 'Connect storage (one-time, about 2 minutes)',
      subtitle: connected
        ? 'Changes made here are saved instantly. The DASHBOARDS variable is no longer read.'
        : 'Lets you add, edit and reorder dashboards right here instead of pasting config.',
      size: 'wide',
      body: connected
        ? el('p', { text: 'Dashboards, the activity log and sign-in rate limits are stored in the connected Redis database. Use “Download backup” from the account menu to keep a copy.' })
        : el('ol', { className: 'steps' },
          el('li', null, 'In Vercel, open this project and go to ', el('b', { text: 'Storage' }), '.'),
          el('li', null, 'Choose ', el('b', { text: 'Create Database' }), ' → ', el('b', { text: 'Upstash for Redis' }), ' (free tier is plenty) and connect it to this project.'),
          el('li', null, 'Vercel adds ', el('code', { text: 'KV_REST_API_URL' }), ' and ', el('code', { text: 'KV_REST_API_TOKEN' }), ' automatically.'),
          el('li', null, 'Redeploy. The current DASHBOARDS list is imported on first load, then you can manage everything here.'))
    });
  }

  function showActivity() {
    var body = el('div', null, el('p', { text: 'Loading…' }));
    openDialog({ title: 'Activity log', subtitle: 'Sign-ins, changes and credential reveals', size: 'wide', body: body });
    api('/api/audit?limit=100').then(function (data) {
      body.textContent = '';
      if (!data || !Array.isArray(data.events)) throw new Error('The activity log could not be read.');
      if (data.mode !== 'redis') {
        body.appendChild(el('p', { text: 'The activity log needs storage. Connect Upstash Redis to start recording sign-ins, edits and credential reveals.' }));
        return;
      }
      if (!data.events.length) {
        body.appendChild(el('p', { text: 'No activity recorded yet.' }));
        return;
      }
      var LABEL = { login: 'Sign-in', login_failed: 'Failed sign-in', logout: 'Sign-out', create: 'Added', update: 'Edited',
        delete: 'Deleted', reorder: 'Reordered', reveal: 'Viewed password', export: 'Backup', export_secrets: 'Exported passwords' };
      body.appendChild(el('table', { className: 'activity' },
        el('thead', null, el('tr', null, el('th', { text: 'When' }), el('th', { text: 'Event' }), el('th', { text: 'User' }), el('th', { text: 'Dashboard' }), el('th', { text: 'IP' }))),
        el('tbody', null, data.events.map(function (ev) {
          var str = function (v) { return typeof v === 'string' || typeof v === 'number' ? String(v) : ''; };
          var type = str(ev && ev.type);
          var label = Object.prototype.hasOwnProperty.call(LABEL, type) ? LABEL[type] : type;
          return el('tr', null,
            el('td', { className: 'when', text: dateTimeLabel(str(ev && ev.t)) }),
            el('td', null, el('span', { className: 'ev ' + type.replace(/[^a-z_]/g, ''), text: label })),
            el('td', { text: str(ev && ev.user) }),
            el('td', { text: str(ev && ev.target) }),
            el('td', { text: str(ev && ev.ip) }));
        }))));
    }).catch(function (err) {
      body.textContent = '';
      body.appendChild(el('p', { text: err.message }));
    });
  }

  function backup(withSecrets) {
    var go = withSecrets
      ? confirmDialog('Export passwords?', 'The file will contain every saved password in plain text. Store it somewhere safe and delete it when done.', 'Export', true)
      : Promise.resolve(true);
    go.then(function (yes) {
      if (!yes) return;
      api('/api/export' + (withSecrets ? '?secrets=1' : '')).then(function (data) {
        var stamp = new Date().toISOString().slice(0, 10);
        download((withSecrets ? 'dashboards-full-' : 'dashboards-backup-') + stamp + '.json',
          JSON.stringify(data.dashboards, null, 2));
        toast(withSecrets ? 'Exported with passwords' : 'Backup downloaded');
      }, function (err) { toast(err.message, true); });
    });
  }

  function logout() {
    api('/api/logout', { method: 'POST', body: {} }).catch(function () {}).then(function () {
      location.replace('/login');
    });
  }

  /* --------------------------------------------------------------- boot */

  function setupChrome(me) {
    var title = (me.portal && me.portal.title) || 'Master Dashboard';
    $('portal-title').textContent = title;
    document.title = title;
    $('user-name').textContent = me.user.username;
    $('user-initials').textContent = initials(me.user.username);
    $('menu-user').textContent = me.user.username;
    $('menu-role').textContent = me.user.role === 'admin' ? 'Admin · can add and edit' : 'Viewer';
    var admin = me.user.role === 'admin';
    $('add-btn').hidden = !admin;
    document.querySelectorAll('.admin-only').forEach(function (n) { n.hidden = !admin; });

    var userBtn = $('user-btn');
    var menu = $('user-menu');
    userBtn.addEventListener('click', function () { toggleMenu(userBtn, menu); });
    menu.addEventListener('click', function (e) {
      var b = e.target.closest('button[data-action]');
      if (!b) return;
      closeMenu();
      var a = b.getAttribute('data-action');
      if (a === 'logout') logout();
      else if (a === 'activity') showActivity();
      else if (a === 'backup') backup(false);
      else if (a === 'export-secrets') backup(true);
      else if (a === 'storage-help') storageHelp();
    });
    $('add-btn').addEventListener('click', function () { openEditor(null); });

    var search = $('search');
    search.addEventListener('input', function () { state.query = search.value; renderGrid(); });

    $('foot').textContent = 'Signed in as ' + me.user.username + ' · session ends ' + dateTimeLabel(me.sessionExpiresAt);
  }

  api('/api/me').then(function (me) {
    state.me = me;
    setupChrome(me);
    return loadList();
  }).then(function () {
    loadStatus();
    setInterval(function () {
      if (document.visibilityState === 'visible') loadStatus();
    }, STATUS_REFRESH_MS);
  }).catch(function (err) {
    if (err && err.message === 'Signed out') return;
    var grid = $('grid');
    grid.textContent = '';
    grid.appendChild(el('div', { className: 'empty' },
      el('h2', { text: 'Could not load your dashboards' }),
      el('p', { text: (err && err.message) || 'Please refresh the page.' }),
      el('button', { className: 'btn', text: 'Try again', attrs: { type: 'button' }, on: { click: function () { location.reload(); } } })));
    $('summary-meta').textContent = '';
  });
})();
