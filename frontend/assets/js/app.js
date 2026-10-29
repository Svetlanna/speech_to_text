/* ==========================================================================
   BRYNVEL — app.js
   Shell behaviour: theme, rail, command palette, table sort/select,
   drawer, tabs, filter chips, copy buttons, toasts.
   Vanilla. No dependencies.
   ========================================================================== */

(function () {
  'use strict';

  var $  = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };

  /* ------------------------------------------------------------------------
     Theme — dark is the default; the choice persists.
     Applied in a blocking inline snippet in <head> so there is no flash.
     ------------------------------------------------------------------------ */
  function initTheme() {
    $$('[data-action="toggle-theme"]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var next = document.documentElement.dataset.theme === 'light' ? 'dark' : 'light';
        document.documentElement.dataset.theme = next;
        try { localStorage.setItem('brynvel-theme', next); } catch (e) {}
        syncThemeIcons();
      });
    });
    syncThemeIcons();
  }

  function syncThemeIcons() {
    var isLight = document.documentElement.dataset.theme === 'light';
    $$('[data-action="toggle-theme"]').forEach(function (btn) {
      btn.setAttribute('aria-label', isLight ? 'Switch to dark theme' : 'Switch to light theme');
      var sun = $('.icon-sun', btn);
      var moon = $('.icon-moon', btn);
      if (sun) sun.style.display = isLight ? 'none' : '';
      if (moon) moon.style.display = isLight ? '' : 'none';
    });
  }

  /* ------------------------------------------------------------------------
     Rail — desktop collapse (persisted) + mobile off-canvas
     ------------------------------------------------------------------------ */
  function initRail() {
    var app = $('.app');
    if (!app) return;

    try {
      if (localStorage.getItem('brynvel-rail') === 'collapsed') app.dataset.rail = 'collapsed';
    } catch (e) {}

    $$('[data-action="toggle-rail"]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        if (window.matchMedia('(max-width: 1023px)').matches) {
          app.dataset.mobilenav = app.dataset.mobilenav === 'open' ? 'closed' : 'open';
          return;
        }
        var collapsed = app.dataset.rail === 'collapsed';
        app.dataset.rail = collapsed ? 'expanded' : 'collapsed';
        try { localStorage.setItem('brynvel-rail', collapsed ? 'expanded' : 'collapsed'); } catch (e) {}
      });
    });

    var scrim = $('.railscrim');
    if (scrim) scrim.addEventListener('click', function () { app.dataset.mobilenav = 'closed'; });
  }

  /* ------------------------------------------------------------------------
     Command palette (⌘K / Ctrl+K)
     ------------------------------------------------------------------------ */
  function initPalette() {
    var palette = $('.palette');
    if (!palette) return;

    var scrim = $('#paletteScrim');
    var input = $('.palette__input', palette);
    var items = $$('.palette__item', palette);
    var empty = $('.palette__empty', palette);

    function open() {
      palette.dataset.open = 'true';
      if (scrim) scrim.dataset.open = 'true';
      input.value = '';
      filter('');
      input.focus();
    }

    function close() {
      palette.dataset.open = 'false';
      if (scrim) scrim.dataset.open = 'false';
    }

    function filter(query) {
      var q = query.toLowerCase().trim();
      var shown = 0;
      items.forEach(function (item) {
        var match = !q || item.textContent.toLowerCase().indexOf(q) > -1;
        item.hidden = !match;
        item.dataset.active = 'false';
        if (match) shown++;
      });
      $$('.palette__group', palette).forEach(function (group) {
        var next = group.nextElementSibling;
        var any = false;
        while (next && !next.classList.contains('palette__group')) {
          if (!next.hidden) any = true;
          next = next.nextElementSibling;
        }
        group.hidden = !any;
      });
      if (empty) empty.hidden = shown > 0;
      var first = items.filter(function (i) { return !i.hidden; })[0];
      if (first) first.dataset.active = 'true';
    }

    function move(step) {
      var visible = items.filter(function (i) { return !i.hidden; });
      if (!visible.length) return;
      var current = visible.findIndex(function (i) { return i.dataset.active === 'true'; });
      var next = (current + step + visible.length) % visible.length;
      visible.forEach(function (i) { i.dataset.active = 'false'; });
      visible[next].dataset.active = 'true';
      visible[next].scrollIntoView({ block: 'nearest' });
    }

    input.addEventListener('input', function () { filter(input.value); });

    document.addEventListener('keydown', function (event) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        palette.dataset.open === 'true' ? close() : open();
        return;
      }
      if (palette.dataset.open !== 'true') return;

      if (event.key === 'Escape') { close(); }
      else if (event.key === 'ArrowDown') { event.preventDefault(); move(1); }
      else if (event.key === 'ArrowUp') { event.preventDefault(); move(-1); }
      else if (event.key === 'Enter') {
        var active = items.filter(function (i) { return i.dataset.active === 'true' && !i.hidden; })[0];
        if (active) active.click();
      }
    });

    $$('[data-action="open-palette"]').forEach(function (btn) {
      btn.addEventListener('click', open);
    });
    if (scrim) scrim.addEventListener('click', close);
  }

  /* ------------------------------------------------------------------------
     Tables — sortable headers, row selection, bulk bar
     ------------------------------------------------------------------------ */
  function initTables() {
    $$('table[data-sortable]').forEach(function (table) {
      $$('th.sortable', table).forEach(function (th) {
        // Must be the real column position: tables here have non-sortable
        // checkbox and action columns, so the index among sortable headers
        // alone would point at the wrong cell.
        var index = th.cellIndex;
        th.setAttribute('tabindex', '0');
        th.setAttribute('role', 'columnheader');

        function sort() {
          var body = $('tbody', table);
          var rows = $$('tr', body);
          var dir = th.getAttribute('aria-sort') === 'ascending' ? 'descending' : 'ascending';

          $$('th', table).forEach(function (other) { other.removeAttribute('aria-sort'); });
          th.setAttribute('aria-sort', dir);

          var type = th.dataset.type || 'text';
          rows.sort(function (a, b) {
            var av = cellValue(a.children[index], type);
            var bv = cellValue(b.children[index], type);
            if (av < bv) return dir === 'ascending' ? -1 : 1;
            if (av > bv) return dir === 'ascending' ? 1 : -1;
            return 0;
          });
          rows.forEach(function (row) { body.appendChild(row); });
        }

        th.addEventListener('click', sort);
        th.addEventListener('keydown', function (event) {
          if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); sort(); }
        });
      });
    });

    function cellValue(cell, type) {
      if (!cell) return '';
      var raw = (cell.dataset.sortValue !== undefined ? cell.dataset.sortValue : cell.textContent).trim();
      if (type === 'number') return parseFloat(raw.replace(/[^0-9.\-]/g, '')) || 0;
      return raw.toLowerCase();
    }

    /* Selection */
    $$('[data-select-all]').forEach(function (master) {
      var scope = master.closest('[data-selectable]') || document;
      var boxes = $$('tbody .check', scope);
      var bar = $('.bulkbar', scope);
      var count = bar ? $('.bulkbar__count', bar) : null;

      function sync() {
        var checked = boxes.filter(function (b) { return b.checked; });
        boxes.forEach(function (b) {
          var row = b.closest('tr');
          if (row) row.dataset.selected = b.checked ? 'true' : 'false';
        });
        master.checked = checked.length === boxes.length && boxes.length > 0;
        master.indeterminate = checked.length > 0 && checked.length < boxes.length;
        if (bar) bar.hidden = checked.length === 0;
        if (count) count.textContent = checked.length + (checked.length === 1 ? ' row selected' : ' rows selected');
      }

      master.addEventListener('change', function () {
        boxes.forEach(function (b) { b.checked = master.checked; });
        sync();
      });
      boxes.forEach(function (b) { b.addEventListener('change', sync); });

      var clear = bar ? $('[data-action="clear-selection"]', bar) : null;
      if (clear) clear.addEventListener('click', function () {
        boxes.forEach(function (b) { b.checked = false; });
        sync();
      });

      sync();
    });

    /* Live filter over table rows */
    $$('[data-table-filter]').forEach(function (input) {
      var table = $(input.dataset.tableFilter);
      if (!table) return;
      input.addEventListener('input', function () {
        var q = input.value.toLowerCase().trim();
        var shown = 0;
        $$('tbody tr', table).forEach(function (row) {
          var match = !q || row.textContent.toLowerCase().indexOf(q) > -1;
          row.hidden = !match;
          if (match) shown++;
        });
        var empty = $('[data-table-empty]');
        if (empty) empty.hidden = shown > 0;
      });
    });
  }

  /* ------------------------------------------------------------------------
     Drawer (slide-over detail)
     ------------------------------------------------------------------------ */
  function initDrawer() {
    var drawer = $('.drawer');
    if (!drawer) return;
    var scrim = $('#drawerScrim');
    var lastFocus = null;

    function open(trigger) {
      lastFocus = trigger || document.activeElement;
      if (trigger) {
        $$('[data-drawer-field]', drawer).forEach(function (slot) {
          var key = slot.dataset.drawerField;
          if (trigger.dataset[key] !== undefined) slot.textContent = trigger.dataset[key];
        });
        var img = $('[data-drawer-avatar]', drawer);
        if (img && trigger.dataset.avatar) img.src = trigger.dataset.avatar;
      }
      drawer.dataset.open = 'true';
      if (scrim) scrim.dataset.open = 'true';
      var focusable = $('button, [href], input', drawer);
      if (focusable) focusable.focus();
    }

    function close() {
      drawer.dataset.open = 'false';
      if (scrim) scrim.dataset.open = 'false';
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    }

    $$('[data-action="open-drawer"]').forEach(function (trigger) {
      trigger.addEventListener('click', function () { open(trigger); });
    });
    $$('[data-action="close-drawer"]').forEach(function (btn) {
      btn.addEventListener('click', close);
    });
    if (scrim) scrim.addEventListener('click', close);
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && drawer.dataset.open === 'true') close();
    });
  }

  /* ------------------------------------------------------------------------
     Tabs — horizontal and vertical share one behaviour
     ------------------------------------------------------------------------ */
  function initTabs() {
    $$('[role="tablist"]').forEach(function (list) {
      var tabs = $$('[role="tab"]', list);
      tabs.forEach(function (tab) {
        tab.addEventListener('click', function () {
          tabs.forEach(function (other) {
            other.setAttribute('aria-selected', String(other === tab));
            var panel = document.getElementById(other.getAttribute('aria-controls') || '');
            if (panel) panel.hidden = other !== tab;
          });
        });
      });
    });
  }

  /* ------------------------------------------------------------------------
     Filter chips (multi-select toggles)
     ------------------------------------------------------------------------ */
  function initChips() {
    $$('.chip[aria-pressed]').forEach(function (chip) {
      chip.addEventListener('click', function () {
        chip.setAttribute('aria-pressed', chip.getAttribute('aria-pressed') === 'true' ? 'false' : 'true');
      });
    });
  }

  /* ------------------------------------------------------------------------
     Copy-to-clipboard + toasts
     ------------------------------------------------------------------------ */
  function toast(message) {
    var host = $('.toasts');
    if (!host) return;
    var node = document.createElement('div');
    node.className = 'toast';
    node.setAttribute('role', 'status');
    node.innerHTML =
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m20 6-11 11-5-5"/></svg>' +
      '<span></span>';
    $('span', node).textContent = message;
    host.appendChild(node);
    setTimeout(function () {
      node.style.opacity = '0';
      node.style.transition = 'opacity 200ms';
      setTimeout(function () { node.remove(); }, 220);
    }, 2600);
  }

  function initCopy() {
    $$('[data-action="copy"]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var target = btn.dataset.copyTarget ? $(btn.dataset.copyTarget) : null;
        var text = target ? target.textContent.trim() : (btn.dataset.copyText || '');
        if (!text) return;
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text).then(function () { toast('Copied to clipboard'); });
        } else {
          toast('Copied to clipboard');
        }
      });
    });

    $$('[data-toast]').forEach(function (btn) {
      btn.addEventListener('click', function (event) {
        if (btn.tagName === 'BUTTON' && btn.type === 'submit') event.preventDefault();
        toast(btn.dataset.toast);
      });
    });

    $$('form[data-demo-form]').forEach(function (form) {
      form.addEventListener('submit', function (event) {
        event.preventDefault();
        toast(form.dataset.demoForm || 'Saved');
      });
    });
  }

  /* ------------------------------------------------------------------------
     Reveal on scroll — subtle, opacity + transform only
     ------------------------------------------------------------------------ */
  function initReveal() {
    var targets = $$('[data-reveal]');
    if (!targets.length) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) {
      targets.forEach(function (t) { t.dataset.revealed = 'true'; });
      return;
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.dataset.revealed = 'true';
        observer.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });

    targets.forEach(function (t) { observer.observe(t); });
  }

  /* ---------------------------------------------------------------------- */
  document.addEventListener('DOMContentLoaded', function () {
    initTheme();
    initRail();
    initPalette();
    initTables();
    initDrawer();
    initTabs();
    initChips();
    initCopy();
    initReveal();
  });

  window.Brynvel = { toast: toast };
})();
