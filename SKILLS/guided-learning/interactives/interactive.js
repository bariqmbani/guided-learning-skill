/* LearningUI: local, dependency-free helpers. No storage, network, or auto-init. */
(function (global) {
  'use strict';

  let announcementTimer;
  function announce(message) {
    const target = document.querySelector('[data-announcer]');
    if (!target) return;
    clearTimeout(announcementTimer);
    announcementTimer = setTimeout(() => { target.textContent = message; }, 180);
  }

  function bindRange(input, output, options = {}) {
    const initial = input.value;
    const format = options.format || String;
    function update(notify = true) {
      const value = Number(input.value);
      const label = String(format(value));
      output.textContent = label;
      input.setAttribute('aria-valuetext', label);
      if (notify && options.onInput) options.onInput(value);
    }
    input.addEventListener('input', () => update());
    input.addEventListener('change', () => {
      if (options.onChange) options.onChange(Number(input.value));
    });
    update(false); // The caller owns the first model render.
    return {
      get: () => Number(input.value),
      set(value, { notify = true } = {}) {
        if (!Number.isFinite(Number(value))) throw new TypeError('Range value must be finite.');
        input.value = String(value); // Native range enforces min/max/step.
        update(notify);
      },
      reset() { input.value = initial; update(); }
    };
  }

  function mountStepper(root, { count, render, interval = 900 }) {
    if (!Number.isInteger(count) || count < 1 || typeof render !== 'function') {
      throw new TypeError('A stepper needs at least one step and a render function.');
    }
    if (!Number.isFinite(interval) || interval < 200) throw new RangeError('Use an interval of at least 200 ms.');
    const find = name => root.querySelector(`[data-${name}]`);
    const back = find('back'), next = find('next'), play = find('play');
    const resetButton = find('reset'), position = find('position'), speed = find('speed');
    if (![back, next, play, resetButton, position].every(Boolean)) {
      throw new Error('Stepper requires data-back, next, play, reset, and position controls.');
    }
    const motion = global.matchMedia('(prefers-reduced-motion: reduce)');
    const motionNote = document.createElement('p');
    motionNote.className = 'explain motion-note';
    motionNote.textContent = 'Reduced motion is on. Use Previous and Next to explore each step.';
    root.append(motionNote);
    let index = 0, playing = false, timer, destroyed = false;
    const listeners = [];
    function listen(target, type, handler) {
      target.addEventListener(type, handler);
      listeners.push(() => target.removeEventListener(type, handler));
    }
    function controls() {
      back.disabled = index === 0;
      next.disabled = index === count - 1;
      play.disabled = motion.matches || count === 1;
      play.textContent = playing ? 'Pause' : index === count - 1 ? 'Replay' : 'Play';
      play.setAttribute('aria-pressed', String(playing));
      position.textContent = `Step ${index + 1} of ${count}`;
      motionNote.hidden = !motion.matches;
    }
    function pause() {
      clearTimeout(timer);
      playing = false;
      controls();
    }
    function draw() {
      render(index);
      controls();
    }
    function go(value) {
      if (destroyed || !Number.isFinite(value)) return;
      pause();
      index = Math.max(0, Math.min(count - 1, Math.trunc(value)));
      draw();
      announce(position.textContent + '. ' + (find('step-summary')?.textContent || ''));
    }
    function schedule() {
      const rate = speed ? Number(speed.value) : 1;
      const delay = Math.max(200, interval / (Number.isFinite(rate) && rate > 0 ? rate : 1));
      timer = setTimeout(() => {
        if (!playing || destroyed) return;
        index += 1;
        if (index >= count - 1) pause();
        draw();
        if (playing) schedule();
        else announce(`Playback finished. ${position.textContent}.`);
      }, delay);
    }
    listen(back, 'click', () => go(index - 1));
    listen(next, 'click', () => go(index + 1));
    listen(resetButton, 'click', () => go(0));
    listen(play, 'click', () => {
      if (playing) { pause(); announce(position.textContent); return; }
      if (motion.matches || destroyed || document.hidden || count === 1) return;
      if (index === count - 1) { index = 0; draw(); }
      playing = true;
      controls();
      schedule();
    });
    if (speed) listen(speed, 'change', () => { if (playing) { clearTimeout(timer); schedule(); } });
    listen(document, 'visibilitychange', () => { if (document.hidden) pause(); });
    listen(motion, 'change', () => { if (motion.matches) pause(); controls(); });
    draw();
    return { go, reset: () => go(0), pause, destroy() { pause(); destroyed = true; listeners.forEach(remove => remove()); motionNote.remove(); } };
  }

  function mountQuestion(form, { correct, feedback }) {
    const result = form.querySelector('[data-feedback]');
    const check = form.querySelector('[data-check]');
    const retry = form.querySelector('[data-retry]');
    if (!result || !check) throw new Error('Question requires data-check and data-feedback.');
    result.setAttribute('role', 'status');
    result.setAttribute('aria-live', 'polite');
    result.setAttribute('aria-atomic', 'true');
    function clear() {
      result.textContent = '';
      result.hidden = false;
      delete result.dataset.tone;
      if (retry) retry.hidden = true;
    }
    function reset() { form.reset(); clear(); }
    form.addEventListener('submit', event => {
      event.preventDefault();
      const selected = form.querySelector('input[type="radio"]:checked');
      if (!selected) {
        result.textContent = 'Choose an answer, then check your reasoning.';
        form.querySelector('input[type="radio"]')?.focus();
        return;
      }
      const isCorrect = selected.value === String(correct);
      result.dataset.tone = isCorrect ? 'correct' : 'retry';
      result.textContent = (isCorrect ? 'That fits. ' : 'Revisit this. ') +
        (feedback[selected.value] || 'Use the evidence above to explain your choice.');
      if (retry) retry.hidden = false;
    });
    form.addEventListener('change', clear);
    if (retry) retry.addEventListener('click', () => { reset(); form.querySelector('input[type="radio"]')?.focus(); });
    clear();
    return { reset };
  }

  const chartStates = new WeakMap();
  let chartId = 0;
  const palette = ['var(--accent)', 'var(--blue)', 'var(--orange)', 'var(--purple)'];
  const defaultNumber = value => new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(value);
  function node(tag, text, className) {
    const element = document.createElement(tag);
    if (text !== undefined) element.textContent = text;
    if (className) element.className = className;
    return element;
  }
  function svgNode(tag, attributes, text) {
    const element = document.createElementNS('http://www.w3.org/2000/svg', tag);
    Object.entries(attributes).forEach(([key, value]) => element.setAttribute(key, String(value)));
    if (text !== undefined) element.textContent = text;
    return element;
  }
  function renderChart(root, options) {
    const { series, xLabel, yLabel } = options;
    if (!Array.isArray(series) || !series.length || series.length > 4 || series.some(item =>
      !Array.isArray(item.points) || !item.points.length || item.points.some(point =>
        !Number.isFinite(point.x) || !Number.isFinite(point.y)))) {
      throw new TypeError('Chart needs 1–4 named series with finite x/y points.');
    }
    for (const key of ['xDomain', 'yDomain']) {
      const domain = options[key];
      if (domain && (domain.length !== 2 || !domain.every(Number.isFinite) || domain[0] >= domain[1])) {
        throw new RangeError(`${key} must be two increasing finite numbers.`);
      }
    }
    let state = chartStates.get(root);
    if (!state) {
      state = { options, width: 0, clipId: `learning-chart-${++chartId}` };
      chartStates.set(root, state);
      if (typeof ResizeObserver !== 'undefined') {
        state.observer = new ResizeObserver(() => {
          const width = Math.round(root.clientWidth);
          if (width && width !== state.width) drawChart(root, state);
        });
        state.observer.observe(root);
      }
    }
    state.options = options;
    drawChart(root, state);
  }
  function drawChart(root, state) {
    const { series, xLabel, yLabel, formatX = defaultNumber, formatY = defaultNumber } = state.options;
    const all = series.flatMap(item => item.points);
    const extent = axis => {
      let low = Math.min(...all.map(point => point[axis])), high = Math.max(...all.map(point => point[axis]));
      if (low === high) { low -= 1; high += 1; }
      return [low, high];
    };
    const xd = state.options.xDomain || extent('x'), yd = state.options.yDomain || extent('y');
    const width = Math.max(240, Math.round(root.clientWidth) || 600), height = 300;
    state.width = Math.round(root.clientWidth);
    const left = width < 400 ? 54 : 68, right = 22, top = 34, bottom = 54;
    const x = value => left + (value - xd[0]) / (xd[1] - xd[0]) * (width - left - right);
    const y = value => height - bottom - (value - yd[0]) / (yd[1] - yd[0]) * (height - top - bottom);
    const svg = svgNode('svg', { viewBox: `0 0 ${width} ${height}`, role: 'img', 'aria-label': `${yLabel} by ${xLabel}. ${series.map(item => item.label).join(' and ')}. Values in the data table below.` });
    const defs = svgNode('defs', {}), clip = svgNode('clipPath', { id: state.clipId });
    clip.append(svgNode('rect', { x: left - 4, y: top - 4, width: width - left - right + 8, height: height - top - bottom + 8 }));
    defs.append(clip);
    svg.append(defs);
    svg.append(svgNode('text', { x: left, y: 18, class: 'chart-axis-title' }, yLabel));
    const ticks = width < 400 ? 2 : 4;
    for (let i = 0; i <= ticks; i += 1) {
      const xv = xd[0] + (xd[1] - xd[0]) * i / ticks, yv = yd[0] + (yd[1] - yd[0]) * i / ticks;
      svg.append(svgNode('line', { x1: left, x2: width - right, y1: y(yv), y2: y(yv), class: 'chart-grid' }));
      svg.append(svgNode('text', { x: left - 8, y: y(yv) + 4, 'text-anchor': 'end' }, formatY(yv)));
      svg.append(svgNode('text', { x: x(xv), y: height - bottom + 24, 'text-anchor': i === ticks ? 'end' : i === 0 ? 'start' : 'middle' }, formatX(xv)));
    }
    if (xd[0] <= 0 && xd[1] >= 0) svg.append(svgNode('line', { x1: x(0), x2: x(0), y1: top, y2: height - bottom, class: 'chart-origin' }));
    if (yd[0] <= 0 && yd[1] >= 0) svg.append(svgNode('line', { x1: left, x2: width - right, y1: y(0), y2: y(0), class: 'chart-origin' }));
    svg.append(svgNode('text', { x: (left + width - right) / 2, y: height - 6, 'text-anchor': 'middle', class: 'chart-axis-title' }, xLabel));
    const legend = node('ul', undefined, 'chart-legend');
    series.forEach((item, index) => {
      const color = palette[index], dash = ['', '7 4', '2 4', '9 3 2 3'][index];
      // Preserve model coordinates; clip drawing rather than change the data.
      const points = item.points.map(point => `${x(point.x)},${y(point.y)}`).join(' ');
      svg.append(svgNode('polyline', { points, fill: 'none', stroke: color, 'stroke-width': 2.5, 'stroke-dasharray': dash, 'clip-path': `url(#${state.clipId})` }));
      item.points.forEach(point => {
        if (point.x < xd[0] || point.x > xd[1] || point.y < yd[0] || point.y > yd[1]) return;
        const attrs = { fill: 'var(--surface)', stroke: color, 'stroke-width': 2 };
        const mark = index % 2 === 0
          ? svgNode('circle', { ...attrs, cx: x(point.x), cy: y(point.y), r: 3.5 })
          : svgNode('rect', { ...attrs, x: x(point.x) - 3, y: y(point.y) - 3, width: 6, height: 6 });
        mark.append(svgNode('title', {}, `${item.label}: ${formatX(point.x)}, ${formatY(point.y)}`));
        svg.append(mark);
      });
      const entry = node('li');
      const swatch = node('span', undefined, 'chart-swatch');
      swatch.style.borderColor = color;
      swatch.style.borderTopStyle = index === 0 ? 'solid' : index === 2 ? 'dotted' : 'dashed';
      swatch.setAttribute('aria-hidden', 'true');
      entry.append(swatch, document.createTextNode(item.label));
      legend.append(entry);
    });
    const previousDetails = root.querySelector('details');
    const details = node('details');
    details.open = Boolean(previousDetails?.open);
    details.append(node('summary', 'View values as a table'));
    const table = node('table', undefined, 'data-table');
    table.append(node('caption', `${yLabel} by ${xLabel}`));
    const head = node('thead'), headRow = node('tr');
    ['Series', xLabel, yLabel].forEach(label => { const th = node('th', label); th.scope = 'col'; headRow.append(th); });
    head.append(headRow);
    const body = node('tbody');
    series.forEach(item => item.points.forEach(point => {
      const row = node('tr');
      row.append(node('td', item.label), node('td', formatX(point.x)), node('td', formatY(point.y)));
      body.append(row);
    }));
    table.append(head, body);
    const wrap = node('div', undefined, 'table-wrap');
    wrap.tabIndex = 0;
    wrap.setAttribute('role', 'region');
    wrap.setAttribute('aria-label', 'Chart data');
    wrap.append(table);
    details.append(wrap);
    const summaryHadFocus = previousDetails?.querySelector('summary') === document.activeElement;
    root.replaceChildren(svg, legend, details);
    if (summaryHadFocus) details.querySelector('summary').focus({ preventScroll: true });
  }

  global.LearningUI = Object.freeze({ bindRange, mountStepper, mountQuestion, renderChart, announce });
})(window);
