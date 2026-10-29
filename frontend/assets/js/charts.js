/* ==========================================================================
   BRYNVEL — charts.js
   Hand-built SVG charts. No library, no network requests, no canvas.
   Declarative: markup carries the data, this file renders it.

     <div class="chart__wrap" data-chart="area"
          data-values="12,18,15,..." data-labels="Jan,Feb,..."
          data-prefix="$" data-height="220"></div>
   ========================================================================== */

(function () {
  'use strict';

  var SVG_NS = 'http://www.w3.org/2000/svg';
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var areaCount = 0;

  function el(name, attrs) {
    var node = document.createElementNS(SVG_NS, name);
    for (var key in attrs) {
      if (attrs[key] !== null && attrs[key] !== undefined) node.setAttribute(key, attrs[key]);
    }
    return node;
  }

  function nums(str) {
    return String(str || '')
      .split(',')
      .map(function (v) { return parseFloat(v.trim()); })
      .filter(function (v) { return !isNaN(v); });
  }

  function list(str) {
    return String(str || '').split(',').map(function (v) { return v.trim(); }).filter(Boolean);
  }

  function fmt(value, prefix, suffix) {
    var out;
    if (Math.abs(value) >= 1000000) out = (value / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
    else if (Math.abs(value) >= 1000) out = (value / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
    else out = String(Math.round(value * 100) / 100);
    return (prefix || '') + out + (suffix || '');
  }

  /* Catmull-Rom style smoothing kept mild so the data stays honest. */
  function smoothPath(points) {
    if (points.length < 2) return '';
    var d = 'M' + points[0][0] + ',' + points[0][1];
    for (var i = 0; i < points.length - 1; i++) {
      var p0 = points[i];
      var p1 = points[i + 1];
      var cx = (p0[0] + p1[0]) / 2;
      d += ' C' + cx + ',' + p0[1] + ' ' + cx + ',' + p1[1] + ' ' + p1[0] + ',' + p1[1];
    }
    return d;
  }

  function scale(values, height, padTop, padBottom) {
    var max = Math.max.apply(null, values);
    var min = Math.min.apply(null, values);
    var span = max - min || 1;
    // Keep a little headroom so the peak never kisses the top edge.
    var lo = min - span * 0.12;
    var hi = max + span * 0.12;
    return function (v) {
      return padTop + (hi - v) / (hi - lo) * (height - padTop - padBottom);
    };
  }

  /* ------------------------------------------------------------------------
     Sparkline — inline, axis-free, sits beside a number
     ------------------------------------------------------------------------ */
  function sparkline(host) {
    var values = nums(host.dataset.values);
    if (values.length < 2) return;

    var w = 100, h = 30, pad = 3;
    var y = scale(values, h, pad, pad);
    var points = values.map(function (v, i) {
      return [(i / (values.length - 1)) * w, y(v)];
    });

    var svg = el('svg', {
      class: 'chart',
      viewBox: '0 0 ' + w + ' ' + h,
      preserveAspectRatio: 'none',
      'aria-hidden': 'true'
    });
    // Without an explicit height the SVG adopts its viewBox aspect ratio and
    // spills out of the host box. Pin it to the host instead.
    svg.style.width = '100%';
    svg.style.height = '100%';

    var stroke = host.dataset.tone === 'down' ? 'var(--err)'
               : host.dataset.tone === 'flat' ? 'var(--fg-faint)'
               : 'var(--accent)';

    var path = el('path', {
      d: smoothPath(points),
      fill: 'none',
      stroke: stroke,
      'stroke-width': 1.6,
      'stroke-linecap': 'round',
      'vector-effect': 'non-scaling-stroke'
    });

    svg.appendChild(path);
    host.appendChild(svg);
  }

  /* ------------------------------------------------------------------------
     Area chart — the primary trend view. Crosshair + tooltip on hover.
     ------------------------------------------------------------------------ */
  function areaChart(host) {
    var values = nums(host.dataset.values);
    var labels = list(host.dataset.labels);
    if (values.length < 2) return;

    var h = parseInt(host.dataset.height, 10) || 220;
    var w = 720;
    var padL = 44, padR = 12, padT = 14, padB = 26;
    var plotW = w - padL - padR;
    var y = scale(values, h, padT, padB);
    var prefix = host.dataset.prefix || '';
    var suffix = host.dataset.suffix || '';

    var xAt = function (i) { return padL + (i / (values.length - 1)) * plotW; };
    var points = values.map(function (v, i) { return [xAt(i), y(v)]; });

    var svg = el('svg', {
      class: 'chart',
      viewBox: '0 0 ' + w + ' ' + h,
      preserveAspectRatio: 'none',
      role: 'img',
      'aria-label': host.dataset.title || 'Trend chart'
    });
    svg.style.height = h + 'px';

    /* Gradient fill under the line. The id must be unique — a page may hold
       more than one area chart, and duplicate ids would collapse them. */
    var gradId = 'brynvelArea' + (++areaCount);
    var defs = el('defs');
    var grad = el('linearGradient', { id: gradId, x1: '0', y1: '0', x2: '0', y2: '1' });
    grad.appendChild(el('stop', { offset: '0%', 'stop-color': 'var(--accent)', 'stop-opacity': '0.26' }));
    grad.appendChild(el('stop', { offset: '100%', 'stop-color': 'var(--accent)', 'stop-opacity': '0' }));
    defs.appendChild(grad);
    svg.appendChild(defs);

    /* Horizontal grid + value axis */
    var maxV = Math.max.apply(null, values);
    var minV = Math.min.apply(null, values);
    for (var g = 0; g <= 3; g++) {
      var gv = minV + (maxV - minV) * (g / 3);
      var gy = y(gv);
      svg.appendChild(el('line', {
        class: 'chart-grid', x1: padL, y1: gy, x2: w - padR, y2: gy,
        'vector-effect': 'non-scaling-stroke'
      }));
      var t = el('text', { class: 'chart-axis', x: padL - 8, y: gy + 3, 'text-anchor': 'end' });
      t.textContent = fmt(gv, prefix, suffix);
      svg.appendChild(t);
    }

    /* Area + line */
    var line = smoothPath(points);
    svg.appendChild(el('path', {
      class: 'chart-area' + (reduceMotion ? '' : ' chart-area--fade'),
      fill: 'url(#' + gradId + ')',
      d: line + ' L' + xAt(values.length - 1) + ',' + (h - padB) + ' L' + padL + ',' + (h - padB) + ' Z'
    }));

    var linePath = el('path', {
      class: 'chart-line' + (reduceMotion ? '' : ' chart-line--draw'),
      d: line,
      'vector-effect': 'non-scaling-stroke'
    });
    svg.appendChild(linePath);

    /* X labels — thinned to a fixed step, with the tail snapped onto the grid
       so the last two labels can never sit on top of each other. */
    var every = Math.ceil(labels.length / 8) || 1;
    var last = labels.length - 1;
    var ticks = [];
    for (var k = 0; k <= last; k += every) ticks.push(k);
    if (ticks[ticks.length - 1] !== last) {
      // Extend to the final point if there is room, otherwise move the last tick.
      if (last - ticks[ticks.length - 1] >= every) ticks.push(last);
      else ticks[ticks.length - 1] = last;
    }

    ticks.forEach(function (i) {
      if (!labels[i]) return;
      var t = el('text', {
        class: 'chart-axis', x: xAt(i), y: h - 8,
        'text-anchor': i === 0 ? 'start' : (i === last ? 'end' : 'middle')
      });
      t.textContent = labels[i];
      svg.appendChild(t);
    });

    /* Hover affordances */
    var cross = el('line', { class: 'chart-cross', x1: 0, y1: padT, x2: 0, y2: h - padB, 'vector-effect': 'non-scaling-stroke' });
    var dot = el('circle', { class: 'chart-dot', cx: 0, cy: 0, r: 4 });
    svg.appendChild(cross);
    svg.appendChild(dot);

    host.appendChild(svg);

    var tip = document.createElement('div');
    tip.className = 'chart-tip';
    host.appendChild(tip);

    if (!reduceMotion) {
      requestAnimationFrame(function () {
        var len = linePath.getTotalLength();
        linePath.style.setProperty('--len', len);
      });
    }

    host.addEventListener('pointermove', function (event) {
      var box = host.getBoundingClientRect();
      var ratio = (event.clientX - box.left) / box.width;
      var i = Math.round(ratio * (values.length - 1));
      i = Math.max(0, Math.min(values.length - 1, i));

      cross.setAttribute('x1', xAt(i));
      cross.setAttribute('x2', xAt(i));
      dot.setAttribute('cx', xAt(i));
      dot.setAttribute('cy', y(values[i]));

      tip.innerHTML = '<span class="muted">' + (labels[i] || '') + '</span> &nbsp;<b>' +
        prefix + values[i].toLocaleString('en-US') + suffix + '</b>';
      tip.style.left = (xAt(i) / w * 100) + '%';
      tip.style.top = (y(values[i]) / h * 100) + '%';
    });
  }

  /* ------------------------------------------------------------------------
     Bar chart — vertical, with an optional highlighted index
     ------------------------------------------------------------------------ */
  function barChart(host) {
    var values = nums(host.dataset.values);
    var labels = list(host.dataset.labels);
    if (!values.length) return;

    var h = parseInt(host.dataset.height, 10) || 180;
    var w = 720;
    var padL = 40, padR = 8, padT = 12, padB = 24;
    var plotW = w - padL - padR;
    var plotH = h - padT - padB;
    var max = Math.max.apply(null, values) * 1.1 || 1;
    var slot = plotW / values.length;
    var barW = Math.max(4, Math.min(38, slot * 0.56));
    var highlight = parseInt(host.dataset.highlight, 10);
    var prefix = host.dataset.prefix || '';

    var svg = el('svg', {
      class: 'chart', viewBox: '0 0 ' + w + ' ' + h,
      preserveAspectRatio: 'none', role: 'img',
      'aria-label': host.dataset.title || 'Bar chart'
    });
    svg.style.height = h + 'px';

    for (var g = 0; g <= 2; g++) {
      var gy = padT + (plotH * g) / 2;
      svg.appendChild(el('line', {
        class: 'chart-grid', x1: padL, y1: gy, x2: w - padR, y2: gy,
        'vector-effect': 'non-scaling-stroke'
      }));
      var t = el('text', { class: 'chart-axis', x: padL - 8, y: gy + 3, 'text-anchor': 'end' });
      t.textContent = fmt(max * (1 - g / 2), prefix, '');
      svg.appendChild(t);
    }

    values.forEach(function (v, i) {
      var barH = Math.max(2, (v / max) * plotH);
      var x = padL + slot * i + (slot - barW) / 2;
      var rect = el('rect', {
        class: 'chart-bar' + (!isNaN(highlight) && i !== highlight ? ' chart-bar--quiet' : ''),
        x: x, y: padT + plotH - barH, width: barW, height: barH, rx: 3
      });
      var title = el('title');
      title.textContent = (labels[i] || '') + ': ' + prefix + v.toLocaleString('en-US');
      rect.appendChild(title);
      svg.appendChild(rect);

      if (labels[i]) {
        var lab = el('text', { class: 'chart-axis', x: x + barW / 2, y: h - 7, 'text-anchor': 'middle' });
        lab.textContent = labels[i];
        svg.appendChild(lab);
      }
    });

    host.appendChild(svg);
  }

  /* ------------------------------------------------------------------------
     Donut / ring — plan mix, device split
     ------------------------------------------------------------------------ */
  function donut(host) {
    var values = nums(host.dataset.values);
    if (!values.length) return;

    var colors = list(host.dataset.colors);
    var size = 180, r = 70, cx = size / 2, cy = size / 2;
    var circumference = 2 * Math.PI * r;
    var total = values.reduce(function (a, b) { return a + b; }, 0) || 1;

    var svg = el('svg', {
      class: 'chart', viewBox: '0 0 ' + size + ' ' + size,
      role: 'img', 'aria-label': host.dataset.title || 'Distribution chart'
    });
    svg.style.maxWidth = size + 'px';
    svg.style.margin = '0 auto';

    svg.appendChild(el('circle', { class: 'ring-track', cx: cx, cy: cy, r: r }));

    var offset = 0;
    values.forEach(function (v, i) {
      var frac = v / total;
      var seg = el('circle', {
        class: 'ring-seg',
        cx: cx, cy: cy, r: r,
        stroke: colors[i] || 'var(--accent)',
        'stroke-dasharray': (frac * circumference - 2) + ' ' + circumference,
        'stroke-dashoffset': -offset * circumference,
        transform: 'rotate(-90 ' + cx + ' ' + cy + ')'
      });
      var title = el('title');
      title.textContent = Math.round(frac * 100) + '%';
      seg.appendChild(title);
      svg.appendChild(seg);
      offset += frac;
    });

    var center = el('text', { class: 'ring-center', x: cx, y: cy - 2, fill: 'var(--fg)' });
    center.setAttribute('font-family', 'var(--font-mono)');
    center.setAttribute('font-size', '22');
    center.setAttribute('font-weight', '500');
    center.textContent = host.dataset.center || fmt(total, host.dataset.prefix || '', '');
    svg.appendChild(center);

    var sub = el('text', { class: 'ring-center', x: cx, y: cy + 16, fill: 'var(--fg-mute)' });
    sub.setAttribute('font-family', 'var(--font-mono)');
    sub.setAttribute('font-size', '9');
    sub.setAttribute('letter-spacing', '1.2');
    sub.textContent = (host.dataset.centerLabel || 'TOTAL').toUpperCase();
    svg.appendChild(sub);

    host.appendChild(svg);
  }

  var renderers = {
    spark: sparkline,
    area: areaChart,
    bar: barChart,
    donut: donut
  };

  function renderAll(root) {
    (root || document).querySelectorAll('[data-chart]').forEach(function (host) {
      if (host.dataset.rendered === 'true') return;
      var fn = renderers[host.dataset.chart];
      if (!fn) return;
      fn(host);
      host.dataset.rendered = 'true';
    });
  }

  document.addEventListener('DOMContentLoaded', function () { renderAll(document); });
  window.BrynvelCharts = { render: renderAll };
})();
