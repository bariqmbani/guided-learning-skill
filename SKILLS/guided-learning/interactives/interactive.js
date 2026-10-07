/* LearningUI: local, dependency-free helpers for standalone lesson pages.
 * No learner storage, no network, no framework. Classic script; one global.
 * Only the page theme auto-initializes and persists a display preference.
 *
 * Modules, in order:
 *   1. utilities      clamp, round, fmt, seededRandom, announce, theme, motion
 *   2. controls       bindRange, bindChoice, bindCheckbox
 *   3. sequence       mountStepper
 *   4. questions      mountQuestion, mountQuiz, mountPrediction, mountHints,
 *                     mountSelfExplain, mountSortable, mountMatching
 *   5. math           math.tex, math.render, math.update, math.toText
 *   6. drawing        svg.el, svg.create, svg.scale, svg.path
 *   7. figures        renderChart, renderBars, renderGrid
 *
 * Every component throws on a contract violation so an author sees the mistake
 * while writing the lesson, keeps native keyboard behavior, and inserts learner
 * or model text with textContent only.
 */
(function (global) {
  'use strict';

  const doc = global.document;
  const SVG_NS = 'http://www.w3.org/2000/svg';
  const MINUS = '−';

  /* Loading the shared script twice must not duplicate page-level listeners. */
  if (global.LearningUI && global.LearningUI.theme) {
    global.LearningUI.theme.mount();
    return;
  }

  /* ======================================================= 1. utilities == */

  const clamp = (value, low, high) => Math.min(high, Math.max(low, value));
  const lerp = (from, to, t) => from + (to - from) * t;
  function round(value, places = 0) {
    const factor = Math.pow(10, places);
    return Math.round(value * factor) / factor;
  }
  function requireFinite(value, what) {
    if (!Number.isFinite(value)) throw new TypeError(what + ' must be a finite number.');
    return value;
  }

  /* Display formatting. Keep full precision in the model; round only here.
   * Negative values use the typographic minus sign (U+2212) so numbers match
   * the surrounding mathematics instead of a hyphen. */
  const fmt = {
    num(value, places) {
      requireFinite(value, 'A formatted value');
      const options = places === undefined
        ? { maximumFractionDigits: 2 }
        : { minimumFractionDigits: places, maximumFractionDigits: places };
      return new Intl.NumberFormat(undefined, options).format(value).replace('-', MINUS);
    },
    int(value) { return fmt.num(Math.round(requireFinite(value, 'An integer value')), 0); },
    fixed(value, places = 2) { return fmt.num(value, places); },
    signed(value, places) {
      requireFinite(value, 'A signed value');
      if (value === 0) return fmt.num(0, places);
      return (value > 0 ? '+' : MINUS) + fmt.num(Math.abs(value), places);
    },
    /* Takes a fraction: 0.625 -> "62.5%". */
    pct(fraction, places = 1) { return fmt.num(requireFinite(fraction, 'A proportion') * 100, places) + '%'; },
    unit(value, unit, places) { return fmt.num(value, places) + ' ' + unit; },
    minus(text) { return String(text).replace(/-(?=[\d.])/g, MINUS); },
    /* "1 round" / "3 rounds" without a translation framework. */
    count(value, singular, plural) {
      return fmt.int(value) + ' ' + (Math.abs(value) === 1 ? singular : (plural || singular + 's'));
    }
  };

  /* Reproducible pseudorandom numbers (mulberry32). Same seed, same sequence.
   * Reproducibility is not physical randomness and not evidence of realism. */
  function seededRandom(seed) {
    let state = (requireFinite(Number(seed), 'A seed') >>> 0) || 1;
    const next = () => {
      state = (state + 0x6D2B79F5) >>> 0;
      let t = state;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    next.int = (low, high) => Math.floor(low + next() * (high - low + 1));
    next.pick = list => list[Math.floor(next() * list.length)];
    next.shuffle = list => {
      const copy = list.slice();
      for (let i = copy.length - 1; i > 0; i -= 1) {
        const j = Math.floor(next() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
      }
      return copy;
    };
    next.reset = () => { state = (Number(seed) >>> 0) || 1; };
    return next;
  }

  let announcementTimer;
  function announce(message) {
    const target = doc.querySelector('[data-announcer]');
    if (!target) return;
    clearTimeout(announcementTimer);
    announcementTimer = setTimeout(() => { target.textContent = String(message); }, 180);
  }

  /* System theme until a visitor chooses otherwise. Theme is the only stored
   * value: answers and lesson state remain in memory. file:// pages and private
   * browsing can reject storage, so an in-memory preference always works. */
  const themeKey = 'learning-ui-theme';
  const colorQuery = global.matchMedia ? global.matchMedia('(prefers-color-scheme: dark)') : null;
  const isTheme = value => value === 'light' || value === 'dark';
  let themePreference = null;
  try {
    const saved = global.localStorage.getItem(themeKey);
    if (isTheme(saved)) themePreference = saved;
  } catch (_) { /* The theme control remains usable without storage. */ }
  if (!themePreference && isTheme(doc.documentElement.dataset.theme)) {
    themePreference = doc.documentElement.dataset.theme;
  }
  const boundThemeButtons = new WeakSet();
  function currentTheme() {
    return themePreference || (colorQuery && colorQuery.matches ? 'dark' : 'light');
  }
  function paintTheme() {
    if (themePreference) doc.documentElement.dataset.theme = themePreference;
    else delete doc.documentElement.dataset.theme;
    const target = currentTheme() === 'dark' ? 'light' : 'dark';
    doc.querySelectorAll('[data-theme-toggle]').forEach(button => {
      button.textContent = target === 'dark' ? 'Dark mode' : 'Light mode';
      button.setAttribute('aria-label', 'Switch to ' + target + ' mode');
      button.title = 'Switch to ' + target + ' mode';
    });
  }
  const theme = {
    get: currentTheme,
    /* null restores the operating-system preference. */
    set(value) {
      if (value !== null && !isTheme(value)) throw new TypeError('Theme must be light, dark, or null for system.');
      themePreference = value;
      try {
        if (value) global.localStorage.setItem(themeKey, value);
        else global.localStorage.removeItem(themeKey);
      } catch (_) { /* Retain the in-memory choice. */ }
      paintTheme();
    },
    mount() {
      const header = doc.querySelector('.lesson-header, .header');
      if (header && !doc.querySelector('[data-theme-toggle]')) {
        const button = doc.createElement('button');
        button.type = 'button';
        button.className = 'btn btn-secondary theme-toggle';
        button.dataset.themeToggle = '';
        header.append(button);
      }
      doc.querySelectorAll('[data-theme-toggle]').forEach(button => {
        if (boundThemeButtons.has(button)) return;
        button.addEventListener('click', () => theme.set(currentTheme() === 'dark' ? 'light' : 'dark'));
        boundThemeButtons.add(button);
      });
      paintTheme();
    }
  };
  if (colorQuery) colorQuery.addEventListener('change', () => { if (!themePreference) paintTheme(); });
  global.addEventListener('storage', event => {
    if (event.key !== themeKey && event.key !== null) return;
    themePreference = isTheme(event.newValue) ? event.newValue : null;
    paintTheme();
  });
  paintTheme();
  // Supplied pages load this script after the header: mount before the next
  // paint, rather than changing its layout again at DOMContentLoaded.
  if (doc.readyState === 'loading' && !doc.querySelector('.lesson-header, .header')) {
    doc.addEventListener('DOMContentLoaded', theme.mount, { once: true });
  } else theme.mount();

  /* Motion bridges occasional pointer-triggered reveals. CSS transitions
   * retarget an interrupted effect; no layout reads or animation restarts.
   * Keyboard actions, initial renders, and continuous ranges stay immediate. */
  const reducedQuery = global.matchMedia ? global.matchMedia('(prefers-reduced-motion: reduce)') : null;
  const entering = new WeakMap();
  const marking = new WeakMap();
  let inputMethod = 'keyboard';
  let continuousInput = false;
  function setInputMethod(value) {
    inputMethod = value;
    doc.documentElement.dataset.inputMethod = value;
  }
  doc.addEventListener('pointerdown', () => setInputMethod('pointer'), true);
  doc.addEventListener('keydown', () => setInputMethod('keyboard'), true);
  doc.addEventListener('input', event => {
    if (event.target.type !== 'range') return;
    continuousInput = true;
    Promise.resolve().then(() => { continuousInput = false; });
  }, true);
  function cancelEnter(element) {
    const pending = entering.get(element);
    if (pending) {
      global.cancelAnimationFrame(pending.frame);
      entering.delete(element);
    }
    element.removeAttribute('data-entering');
  }
  const motion = {
    reduced: () => Boolean(reducedQuery && reducedQuery.matches),
    onChange(handler) {
      if (!reducedQuery) return () => {};
      const listener = () => handler(reducedQuery.matches);
      reducedQuery.addEventListener('change', listener);
      return () => reducedQuery.removeEventListener('change', listener);
    },
    /* A quiet opacity cue for discrete value changes, never slider frames. */
    mark(element) {
      if (!element) return;
      clearTimeout(marking.get(element));
      if (inputMethod === 'keyboard' || continuousInput) {
        element.removeAttribute('data-changed');
        return;
      }
      element.classList.add('motion-mark');
      element.setAttribute('data-changed', '');
      marking.set(element, setTimeout(() => {
        element.removeAttribute('data-changed');
        marking.delete(element);
      }, 120));
    },
    /* Set text and cue only when the value is different from before. */
    setText(element, text) {
      const next = String(text);
      if (!element || element.textContent === next) return false;
      element.textContent = next;
      motion.mark(element);
      return true;
    },
    enter(element) {
      if (!element) return;
      cancelEnter(element);
      if (inputMethod === 'keyboard' || continuousInput) return;
      element.classList.add('motion-enter');
      element.setAttribute('data-entering', '');
      const pending = { frame: 0 };
      entering.set(element, pending);
      /* The first frame commits the starting style, the next releases it.
       * Content stays visible and usable while this subtle cue settles. */
      pending.frame = global.requestAnimationFrame(() => {
        pending.frame = global.requestAnimationFrame(() => {
          element.removeAttribute('data-entering');
          entering.delete(element);
        });
      });
    }
  };

  /* ======================================================== 2. controls == */

  /* Labeled range with a live output. The native input keeps min/max/step,
   * keyboard support, and assistive-technology behavior. */
  function bindRange(input, output, options = {}) {
    if (!input || input.type !== 'range') throw new TypeError('bindRange needs an input[type=range].');
    if (!output) throw new TypeError('bindRange needs an output element.');
    const initial = input.value;
    const format = options.format || String;
    const mirror = options.mirror || null; // Optional number input for exact entry.
    function paint() {
      const min = Number(input.min === '' ? 0 : input.min);
      const max = Number(input.max === '' ? 100 : input.max);
      const share = max === min ? 0 : (Number(input.value) - min) / (max - min);
      input.style.setProperty('--kit-fill', (clamp(share, 0, 1) * 100).toFixed(2) + '%');
    }
    function update(notify = true) {
      const value = Number(input.value);
      const label = String(format(value));
      output.textContent = label;
      input.setAttribute('aria-valuetext', label);
      if (mirror && mirror.value !== input.value) mirror.value = input.value;
      paint();
      if (notify && options.onInput) options.onInput(value);
    }
    input.addEventListener('input', () => update());
    input.addEventListener('change', () => { if (options.onChange) options.onChange(Number(input.value)); });
    if (mirror) {
      mirror.addEventListener('change', () => {
        if (mirror.value === '' || !Number.isFinite(Number(mirror.value))) { mirror.value = input.value; return; }
        input.value = mirror.value; // The range clamps to its own min/max/step.
        mirror.value = input.value;
        update();
        if (options.onChange) options.onChange(Number(input.value));
      });
    }
    update(false); // The caller owns the first model render.
    return {
      get: () => Number(input.value),
      set(value, { notify = true } = {}) {
        if (!Number.isFinite(Number(value))) throw new TypeError('Range value must be finite.');
        input.value = String(value);
        update(notify);
      },
      reset() { input.value = initial; update(); },
      element: input
    };
  }

  /* Radio group, including the .segmented layout. Returns the selected value. */
  function bindChoice(container, options = {}) {
    if (!container) throw new TypeError('bindChoice needs a container element.');
    const inputs = [...container.querySelectorAll('input[type=radio]')];
    if (!inputs.length) throw new TypeError('bindChoice needs radio inputs inside the container.');
    const initial = (inputs.find(input => input.checked) || inputs[0]).value;
    const read = () => (inputs.find(input => input.checked) || {}).value;
    function apply(value, notify) {
      const match = inputs.find(input => input.value === String(value));
      if (!match) throw new RangeError('No choice with value ' + value);
      match.checked = true;
      if (notify && options.onChange) options.onChange(match.value);
    }
    container.addEventListener('change', event => {
      if (event.target.type === 'radio' && options.onChange) options.onChange(event.target.value);
    });
    return {
      get: read,
      set(value, { notify = true } = {}) { apply(value, notify); },
      reset() { apply(initial, true); },
      values: inputs.map(input => input.value)
    };
  }

  function bindCheckbox(input, options = {}) {
    if (!input || input.type !== 'checkbox') throw new TypeError('bindCheckbox needs an input[type=checkbox].');
    const initial = input.checked;
    input.addEventListener('change', () => { if (options.onChange) options.onChange(input.checked); });
    return {
      get: () => input.checked,
      set(value, { notify = true } = {}) {
        input.checked = Boolean(value);
        if (notify && options.onChange) options.onChange(input.checked);
      },
      reset() { input.checked = initial; if (options.onChange) options.onChange(input.checked); }
    };
  }

  /* ======================================================== 3. sequence == */

  /* Finite, learner-paced playback over a known list of states.
   * Required controls: data-back, data-next, data-play, data-reset, data-position.
   * Optional: data-speed (select), data-progress (bar), data-scrub (range),
   * data-step-list (ordered list), data-step-summary (announced explanation). */
  function mountStepper(root, { count, render, interval = 900, labels } = {}) {
    if (!root) throw new TypeError('mountStepper needs a root element.');
    if (!Number.isInteger(count) || count < 1 || typeof render !== 'function') {
      throw new TypeError('A stepper needs at least one step and a render function.');
    }
    if (!Number.isFinite(interval) || interval < 200) throw new RangeError('Use an interval of at least 200 ms.');
    const find = name => root.querySelector('[data-' + name + ']');
    const back = find('back'), next = find('next'), play = find('play');
    const resetButton = find('reset'), position = find('position'), speed = find('speed');
    const progress = root.querySelector('[data-progress] .step-progress-fill') || find('progress-fill');
    const scrub = find('scrub'), scrubValue = find('scrub-value'), stepList = find('step-list');
    if (![back, next, play, resetButton, position].every(Boolean)) {
      throw new Error('Stepper requires data-back, next, play, reset, and position controls.');
    }
    if (scrub) {
      scrub.min = '0';
      scrub.max = String(count - 1);
      scrub.step = '1';
    }
    const motionNote = doc.createElement('p');
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
      play.disabled = motion.reduced() || count === 1;
      play.textContent = playing ? 'Pause' : index === count - 1 ? 'Replay' : 'Play';
      play.setAttribute('aria-pressed', String(playing));
      position.textContent = 'Step ' + (index + 1) + ' of ' + count;
      motionNote.hidden = !motion.reduced();
      if (progress) progress.style.width = (count === 1 ? 100 : (index / (count - 1)) * 100) + '%';
      if (scrub && Number(scrub.value) !== index) scrub.value = String(index);
      if (scrub) scrub.setAttribute('aria-valuetext', labels && labels[index] ? labels[index] : position.textContent);
      if (scrubValue) scrubValue.textContent = (index + 1) + ' of ' + count;
      if (stepList) {
        [...stepList.children].forEach((item, position_) => {
          if (position_ === index) item.setAttribute('aria-current', 'step');
          else item.removeAttribute('aria-current');
          item.classList.toggle('is-done', position_ < index);
        });
      }
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
    function go(value, { silent = false } = {}) {
      if (destroyed || !Number.isFinite(value)) return;
      pause();
      index = clamp(Math.trunc(value), 0, count - 1);
      draw();
      if (!silent) {
        const summary = find('step-summary');
        announce(position.textContent + '. ' + (summary ? summary.textContent : ''));
      }
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
        else announce('Playback finished. ' + position.textContent + '.');
      }, delay);
    }
    listen(back, 'click', () => go(index - 1));
    listen(next, 'click', () => go(index + 1));
    listen(resetButton, 'click', () => go(0));
    listen(play, 'click', () => {
      if (playing) { pause(); announce(position.textContent); return; }
      if (motion.reduced() || destroyed || doc.hidden || count === 1) return;
      if (index === count - 1) { index = 0; draw(); }
      playing = true;
      controls();
      schedule();
    });
    if (speed) listen(speed, 'change', () => { if (playing) { clearTimeout(timer); schedule(); } });
    if (scrub) listen(scrub, 'input', () => go(Number(scrub.value)));
    /* Arrow keys step the trace, except inside a field that uses them itself. */
    listen(root, 'keydown', event => {
      const tag = event.target.tagName;
      if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA' || event.metaKey || event.ctrlKey || event.altKey) return;
      const moves = { ArrowRight: index + 1, ArrowLeft: index - 1, Home: 0, End: count - 1 };
      if (!(event.key in moves)) return;
      event.preventDefault();
      go(moves[event.key]);
    });
    listen(doc, 'visibilitychange', () => { if (doc.hidden) pause(); });
    const stopWatchingMotion = motion.onChange(matches => { if (matches) pause(); controls(); });
    listeners.push(stopWatchingMotion);
    draw();
    return {
      go,
      get: () => index,
      reset: () => go(0),
      pause,
      destroy() {
        pause();
        destroyed = true;
        listeners.forEach(remove => remove());
        motionNote.remove();
      }
    };
  }

  /* ======================================================= 4. questions == */

  /* One multiple-choice question with explanatory feedback and retry.
   * Required inside the form: a radio group, data-check, data-feedback.
   * Optional: data-retry. */
  function mountQuestion(form, { correct, feedback, onAnswer } = {}) {
    if (!form) throw new TypeError('mountQuestion needs a form element.');
    const result = form.querySelector('[data-feedback]');
    const check = form.querySelector('[data-check]');
    const retry = form.querySelector('[data-retry]');
    if (!result || !check) throw new Error('Question requires data-check and data-feedback.');
    if (!feedback || typeof feedback !== 'object') throw new TypeError('Question requires a feedback map.');
    result.setAttribute('role', 'status');
    result.setAttribute('aria-live', 'polite');
    result.setAttribute('aria-atomic', 'true');
    let attempts = 0;
    function clear() {
      result.textContent = '';
      result.hidden = false;
      delete result.dataset.tone;
      if (retry) retry.hidden = true;
    }
    function reset() { attempts = 0; form.reset(); clear(); }
    form.addEventListener('submit', event => {
      event.preventDefault();
      const selected = form.querySelector('input[type="radio"]:checked');
      if (!selected) {
        result.textContent = 'Choose an answer, then check your reasoning.';
        result.dataset.tone = 'info';
        const first = form.querySelector('input[type="radio"]');
        if (first) first.focus();
        return;
      }
      attempts += 1;
      const isCorrect = selected.value === String(correct);
      result.dataset.tone = isCorrect ? 'correct' : 'retry';
      result.textContent = (isCorrect ? 'That fits. ' : 'Revisit this. ') +
        (feedback[selected.value] || 'Use the evidence above to explain your choice.');
      motion.enter(result);
      if (retry) retry.hidden = false;
      if (onAnswer) onAnswer({ correct: isCorrect, value: selected.value, attempts });
    });
    form.addEventListener('change', clear);
    if (retry) retry.addEventListener('click', () => {
      reset();
      const first = form.querySelector('input[type="radio"]');
      if (first) first.focus();
    });
    clear();
    return { reset, attempts: () => attempts };
  }

  /* A short retrieval set: one question at a time, explanation after each,
   * and an honest first-attempt summary. No score, no storage, no timing.
   * Required inside root: data-quiz-position, data-quiz-prompt,
   * data-quiz-choices, data-check, data-next, data-feedback, data-quiz-summary.
   * Optional: data-progress bar, data-restart, data-quiz-note. */
  function mountQuiz(root, { items, onComplete } = {}) {
    if (!root) throw new TypeError('mountQuiz needs a root element.');
    if (!Array.isArray(items) || !items.length) throw new TypeError('mountQuiz needs at least one item.');
    items.forEach((item, index) => {
      if (!item.prompt || !Array.isArray(item.choices) || item.choices.length < 2) {
        throw new TypeError('Quiz item ' + (index + 1) + ' needs a prompt and at least two choices.');
      }
      if (!item.choices.some(choice => choice.value === item.correct)) {
        throw new TypeError('Quiz item ' + (index + 1) + ' has no choice matching its correct value.');
      }
    });
    const find = name => root.querySelector('[data-' + name + ']');
    const position = find('quiz-position'), prompt = find('quiz-prompt'), choices = find('quiz-choices');
    const check = find('check'), next = find('next'), result = find('feedback'), summary = find('quiz-summary');
    const progress = root.querySelector('[data-progress] .step-progress-fill');
    const restart = find('restart'), note = find('quiz-note');
    if (![position, prompt, choices, check, next, result, summary].every(Boolean)) {
      throw new Error('Quiz requires position, prompt, choices, check, next, feedback, and summary targets.');
    }
    const form = check.closest('form') || root;
    result.setAttribute('role', 'status');
    result.setAttribute('aria-live', 'polite');
    result.setAttribute('aria-atomic', 'true');
    let index = 0;
    let firstTry = [];
    let answered = false;
    function paint() {
      const item = items[index];
      position.textContent = 'Question ' + (index + 1) + ' of ' + items.length;
      prompt.textContent = item.prompt;
      choices.replaceChildren();
      item.choices.forEach(choice => {
        const label = doc.createElement('label');
        const input = doc.createElement('input');
        input.type = 'radio';
        input.name = 'quiz-' + index;
        input.value = String(choice.value);
        input.required = true;
        label.append(input, doc.createTextNode(' ' + choice.label));
        choices.append(label);
      });
      if (note) {
        note.textContent = item.note || '';
        note.hidden = !item.note;
      }
      result.textContent = '';
      delete result.dataset.tone;
      answered = false;
      check.hidden = false;
      check.disabled = false;
      next.hidden = true;
      summary.hidden = true;
      if (progress) progress.style.width = (index / items.length) * 100 + '%';
      motion.enter(prompt);
    }
    function finish() {
      const correctCount = firstTry.filter(Boolean).length;
      summary.hidden = false;
      summary.textContent = 'You answered ' + correctCount + ' of ' + items.length +
        ' correctly on the first attempt. Now explain one of them in your own words; a correct selection is not the same as an explanation.';
      motion.enter(summary);
      check.hidden = true;
      next.hidden = true;
      if (progress) progress.style.width = '100%';
      position.textContent = 'Set complete';
      if (progress) progress.style.width = '100%';
      announce(summary.textContent);
      if (onComplete) onComplete({ total: items.length, firstAttemptCorrect: correctCount, firstTry: firstTry.slice() });
    }
    function submit(event) {
      if (event) event.preventDefault();
      const item = items[index];
      const selected = choices.querySelector('input:checked');
      if (!selected) {
        result.dataset.tone = 'info';
        result.textContent = 'Choose an answer, then check it.';
        return;
      }
      const isCorrect = selected.value === String(item.correct);
      if (!answered) {
        firstTry[index] = isCorrect;
        answered = true;
      }
      result.dataset.tone = isCorrect ? 'correct' : 'retry';
      result.textContent = (isCorrect ? 'That fits. ' : 'Not yet. ') +
        ((item.feedback && item.feedback[selected.value]) || 'Explain which evidence supports your choice.');
      motion.enter(result);
      next.hidden = false;
      next.textContent = index === items.length - 1 ? 'See the summary' : 'Next question';
      if (isCorrect) check.disabled = true;
    }
    form.addEventListener('submit', submit);
    if (form !== root) check.addEventListener('click', event => { if (check.type !== 'submit') submit(event); });
    next.addEventListener('click', () => {
      if (index === items.length - 1) { finish(); return; }
      index += 1;
      paint();
      const first = choices.querySelector('input');
      if (first) first.focus();
    });
    function reset() {
      index = 0;
      firstTry = [];
      paint();
    }
    if (restart) restart.addEventListener('click', () => { reset(); announce('Practice set restarted.'); });
    paint();
    return { reset, position: () => index };
  }

  /* Warm up, then explore. The answer is recorded on the page and compared
   * with the evidence; it does not block exploring the model. Set gate: true
   * only when seeing the result first would spoil the lesson.
   * Required: data-check and data-record inside the form.
   * Optional: reveal, a selector for content that stays hidden until the
   * answer is recorded; data-locked, a note shown before that. */
  function mountPrediction(form, { label, gate = false, onLock, reveal } = {}) {
    if (!form) throw new TypeError('mountPrediction needs a form element.');
    const record = form.querySelector('[data-record]');
    const check = form.querySelector('[data-check]');
    if (!record || !check) throw new Error('A warm-up question requires data-check and data-record.');
    const revealed = reveal ? [...doc.querySelectorAll(reveal)] : [];
    const locked = form.querySelector('[data-locked]');
    const retry = form.querySelector('[data-retry]');
    record.setAttribute('role', 'status');
    record.setAttribute('aria-live', 'polite');
    function show(isOpen) {
      revealed.forEach(element => {
        const wasHidden = element.hidden;
        element.hidden = !isOpen;
        if (isOpen && wasHidden) motion.enter(element);
      });
      if (locked) locked.hidden = isOpen;
      if (retry) retry.hidden = !isOpen;
      if (gate) {
        form.querySelectorAll('input, select, textarea').forEach(field => { field.disabled = isOpen; });
        check.disabled = isOpen;
      }
    }
    function readAnswer() {
      const radio = form.querySelector('input[type=radio]:checked');
      if (radio) {
        const text = radio.closest('label');
        return text ? text.textContent.trim() : radio.value;
      }
      const text = form.querySelector('textarea, input[type=text], input[type=number]');
      return text && text.value.trim() ? text.value.trim() : '';
    }
    function reset() {
      form.reset();
      record.textContent = '';
      record.hidden = true;
      show(false);
    }
    form.addEventListener('submit', event => {
      event.preventDefault();
      const answer = readAnswer();
      if (!answer) {
        record.hidden = false;
        record.textContent = 'Choose or write an answer first.';
        return;
      }
      record.hidden = false;
      record.textContent = (label || 'Your answer') + ': ' + answer;
      motion.enter(record);
      show(true);
      announce('Answer recorded. Compare it with the evidence below.');
      if (onLock) onLock(answer);
    });
    if (retry) retry.addEventListener('click', reset);
    reset();
    return { reset, value: readAnswer };
  }

  /* Hints revealed one at a time. The count is shown, never scored. */
  function mountHints(root, { hints } = {}) {
    if (!root) throw new TypeError('mountHints needs a root element.');
    if (!Array.isArray(hints) || !hints.length) throw new TypeError('mountHints needs a non-empty hints array.');
    const button = root.querySelector('[data-hint-next]');
    const list = root.querySelector('[data-hint-list]');
    const counter = root.querySelector('[data-hint-count]');
    if (!button || !list) throw new Error('Hints require data-hint-next and data-hint-list.');
    list.setAttribute('aria-live', 'polite');
    let shown = 0;
    function paint() {
      button.textContent = shown === 0 ? 'Show a hint' : 'Show the next hint';
      button.disabled = shown >= hints.length;
      if (counter) counter.textContent = shown ? shown + ' of ' + hints.length + ' hints shown' : hints.length + ' hints available';
    }
    button.addEventListener('click', () => {
      if (shown >= hints.length) return;
      const item = doc.createElement('li');
      item.textContent = hints[shown];
      list.append(item);
      motion.enter(item);
      shown += 1;
      paint();
      announce('Hint ' + shown + '. ' + hints[shown - 1]);
    });
    function reset() {
      shown = 0;
      list.replaceChildren();
      paint();
    }
    reset();
    return { reset, shown: () => shown };
  }

  /* Write an explanation from memory, then compare it with a worked answer.
   * Nothing is graded and nothing is saved; a page refresh clears the text.
   * Required: data-answer (textarea), data-check, data-reference. */
  function mountSelfExplain(form, { minLength = 20, onReveal } = {}) {
    if (!form) throw new TypeError('mountSelfExplain needs a form element.');
    const answer = form.querySelector('[data-answer]');
    const check = form.querySelector('[data-check]');
    const reference = form.querySelector('[data-reference]');
    const feedbackNode = form.querySelector('[data-feedback]');
    const counter = form.querySelector('[data-count]');
    if (!answer || !check || !reference) throw new Error('Self-explanation requires data-answer, data-check, and data-reference.');
    if (feedbackNode) {
      feedbackNode.setAttribute('role', 'status');
      feedbackNode.setAttribute('aria-live', 'polite');
    }
    function paintCount() {
      if (!counter) return;
      const length = answer.value.trim().length;
      counter.textContent = length < minLength
        ? 'Write at least ' + minLength + ' characters before comparing (' + length + ' so far).'
        : length + ' characters written. Nothing here is saved.';
    }
    answer.addEventListener('input', paintCount);
    form.addEventListener('submit', event => {
      event.preventDefault();
      if (answer.value.trim().length < minLength) {
        if (feedbackNode) {
          feedbackNode.dataset.tone = 'info';
          feedbackNode.textContent = 'Write your own explanation first. Retrieving it from memory is the part that helps.';
        }
        answer.focus();
        return;
      }
      reference.hidden = false;
      if (feedbackNode) {
        feedbackNode.dataset.tone = 'info';
        feedbackNode.textContent = 'Compare the two. Name one thing the worked answer makes explicit that yours left out, then tell your tutor.';
      }
      motion.enter(reference);
      announce('A worked answer is now visible. Compare it with your own explanation.');
      if (onReveal) onReveal(answer.value.trim());
    });
    function reset() {
      answer.value = '';
      reference.hidden = true;
      if (feedbackNode) { feedbackNode.textContent = ''; delete feedbackNode.dataset.tone; }
      paintCount();
    }
    reset();
    return { reset, text: () => answer.value.trim() };
  }

  /* Put steps in order. Move buttons are the primary interaction, so the task
   * works with a keyboard, a pointer, or touch; dragging is an extra. */
  function mountSortable(root, options = {}) {
    const { items, correct, feedback, seed = 7, checkLabel } = options;
    if (!root) throw new TypeError('mountSortable needs a root element.');
    if (!Array.isArray(items) || items.length < 2) throw new TypeError('mountSortable needs at least two items.');
    const list = root.querySelector('[data-sortable]');
    const check = root.querySelector('[data-check]');
    const result = root.querySelector('[data-feedback]');
    const shuffleButton = root.querySelector('[data-shuffle]');
    if (!list || !check || !result) throw new Error('Ordering requires data-sortable, data-check, and data-feedback.');
    const order = Array.isArray(correct) ? correct.slice() : items.map(item => item.id);
    if (order.length !== items.length) throw new TypeError('The correct order must list every item once.');
    items.forEach(item => {
      if (!order.includes(item.id)) throw new TypeError('Item ' + item.id + ' is missing from the correct order.');
    });
    result.setAttribute('role', 'status');
    result.setAttribute('aria-live', 'polite');
    const random = seededRandom(seed);
    let current = random.shuffle(items.map(item => item.id));
    if (current.join() === order.join()) current = current.reverse();
    function move(id, delta) {
      const from = current.indexOf(id);
      const to = clamp(from + delta, 0, current.length - 1);
      if (from === to) return;
      current.splice(to, 0, current.splice(from, 1)[0]);
      paint();
      const label = items.find(item => item.id === id).label;
      announce(label + ' moved to position ' + (to + 1) + ' of ' + current.length + '.');
      const moved = list.querySelector('[data-id="' + id + '"]');
      if (moved) {
        const button = moved.querySelector(delta < 0 ? '[data-up]' : '[data-down]');
        (button && !button.disabled ? button : moved.querySelector('button:not(:disabled)') || check).focus();
      }
    }
    function paint() {
      list.replaceChildren();
      current.forEach((id, index) => {
        const item = items.find(entry => entry.id === id);
        const row = doc.createElement('li');
        row.dataset.id = id;
        const number = doc.createElement('span');
        number.className = 'order-index';
        number.setAttribute('aria-hidden', 'true');
        const text = doc.createElement('span');
        text.textContent = item.label;
        const verdict = doc.createElement('span');
        verdict.className = 'faint';
        const moveBox = doc.createElement('span');
        moveBox.className = 'order-move';
        const up = doc.createElement('button');
        up.type = 'button';
        up.dataset.up = '';
        up.textContent = '↑';
        up.setAttribute('aria-label', 'Move “' + item.label + '” earlier, currently position ' + (index + 1));
        up.disabled = index === 0;
        const down = doc.createElement('button');
        down.type = 'button';
        down.dataset.down = '';
        down.textContent = '↓';
        down.setAttribute('aria-label', 'Move “' + item.label + '” later, currently position ' + (index + 1));
        down.disabled = index === current.length - 1;
        up.addEventListener('click', () => move(id, -1));
        down.addEventListener('click', () => move(id, 1));
        moveBox.append(up, down);
        row.append(number, text, verdict, moveBox);
        list.append(row);
      });
    }
    check.addEventListener('click', () => {
      let placed = 0;
      const notes = [];
      const onCheck = options.onCheck;
      [...list.children].forEach((row, index) => {
        const id = row.dataset.id;
        const isRight = order[index] === id;
        row.dataset.verdict = isRight ? 'correct' : 'wrong';
        const verdict = row.children[2];
        verdict.textContent = isRight ? 'In place' : 'Not here yet';
        if (isRight) placed += 1;
        else if (feedback && feedback[id]) notes.push(feedback[id]);
      });
      result.dataset.tone = placed === order.length ? 'correct' : 'retry';
      result.textContent = placed === order.length
        ? 'Every step is in place. Now say what forces each step to come before the next one.'
        : placed + ' of ' + order.length + ' steps are in place. ' + (notes[0] || 'Use the rule that decides which step must come first.');
      announce(result.textContent);
      if (onCheck) onCheck({ placed, total: order.length, complete: placed === order.length });
    });
    if (shuffleButton) shuffleButton.addEventListener('click', () => {
      current = random.shuffle(current);
      paint();
      result.textContent = '';
      delete result.dataset.tone;
      announce('Order shuffled.');
    });
    if (checkLabel) check.textContent = checkLabel;
    function reset() {
      random.reset();
      current = random.shuffle(items.map(item => item.id));
      if (current.join() === order.join()) current = current.reverse();
      paint();
      result.textContent = '';
      delete result.dataset.tone;
    }
    paint();
    return { reset, order: () => current.slice() };
  }

  /* Match each item to one option using native selects. */
  let matchingId = 0;
  function mountMatching(root, { pairs, options, seed = 11 } = {}) {
    if (!root) throw new TypeError('mountMatching needs a root element.');
    if (!Array.isArray(pairs) || pairs.length < 2) throw new TypeError('mountMatching needs at least two pairs.');
    const grid = root.querySelector('[data-matching]');
    const check = root.querySelector('[data-check]');
    const result = root.querySelector('[data-feedback]');
    if (!grid || !check || !result) throw new Error('Matching requires data-matching, data-check, and data-feedback.');
    result.setAttribute('role', 'status');
    result.setAttribute('aria-live', 'polite');
    const random = seededRandom(seed);
    const choices = random.shuffle(options || pairs.map(pair => pair.match));
    const instanceId = 'learning-match-' + (++matchingId);
    function clearResult() {
      result.textContent = '';
      delete result.dataset.tone;
    }
    function paint() {
      grid.replaceChildren();
      pairs.forEach((pair, index) => {
        const row = doc.createElement('div');
        row.className = 'match-row';
        row.dataset.id = pair.id;
        const term = doc.createElement('span');
        term.textContent = pair.term;
        const select = doc.createElement('select');
        const selectId = instanceId + '-' + index;
        select.id = selectId;
        select.setAttribute('aria-label', 'Match for ' + pair.term);
        select.setAttribute('aria-describedby', selectId + '-verdict');
        const answer = doc.createElement('div');
        answer.className = 'match-answer';
        const verdict = doc.createElement('span');
        verdict.className = 'match-verdict';
        verdict.id = selectId + '-verdict';
        verdict.hidden = true;
        const blank = doc.createElement('option');
        blank.value = '';
        blank.textContent = 'Choose…';
        select.append(blank);
        choices.forEach(choice => {
          const option = doc.createElement('option');
          option.value = choice;
          option.textContent = choice;
          select.append(option);
        });
        select.addEventListener('change', () => {
          delete row.dataset.verdict;
          verdict.textContent = '';
          verdict.hidden = true;
          clearResult();
        });
        answer.append(select, verdict);
        row.append(term, answer);
        grid.append(row);
      });
    }
    check.addEventListener('click', () => {
      let right = 0;
      const notes = [];
      [...grid.children].forEach(row => {
        const pair = pairs.find(entry => String(entry.id) === row.dataset.id);
        const select = row.querySelector('select');
        const verdict = row.querySelector('.match-verdict');
        if (!select.value) {
          delete row.dataset.verdict;
          verdict.textContent = '';
          verdict.hidden = true;
          return;
        }
        const isRight = select.value === pair.match;
        row.dataset.verdict = isRight ? 'correct' : 'wrong';
        verdict.textContent = isRight ? 'Correct' : 'Try again';
        verdict.hidden = false;
        if (isRight) right += 1;
        else if (pair.why) notes.push(pair.why);
      });
      const answered = [...grid.querySelectorAll('select')].filter(select => select.value).length;
      result.dataset.tone = right === pairs.length ? 'correct' : 'retry';
      result.textContent = answered < pairs.length
        ? 'Choose a match for every item first. ' + right + ' of ' + answered + ' chosen so far are right.'
        : right === pairs.length
          ? 'All matched. Say what feature decided each pair.'
          : right + ' of ' + pairs.length + ' are right. ' + (notes[0] || 'Compare the two that look closest.');
      announce(result.textContent);
    });
    function reset() {
      paint();
      clearResult();
    }
    paint();
    return { reset };
  }

  /* ============================================================ 5. math == */
  /* A small TeX subset compiled to native MathML: real fractions, exponents,
   * roots, and large operators in the browser's math font, read aloud by
   * assistive technology without a library. MathML has been available in every
   * major engine since January 2023; where it is missing, the same expression
   * renders as linear notation in a math face instead.
   *
   * Supported, and nothing else: see COMPONENTS.md for the full table. An
   * unknown command renders visibly as itself and logs a warning, so the
   * author notices while writing rather than the learner while reading. */

  const MATHML_NS = 'http://www.w3.org/1998/Math/MathML';
  const mathmlSupported = (() => {
    try {
      if (typeof global.MathMLElement === 'function') return true;
      const probe = doc.createElementNS(MATHML_NS, 'math');
      return Boolean(probe && probe.constructor && /MathML/.test(probe.constructor.name));
    } catch (error) {
      return false;
    }
  })();

  const GREEK = {
    alpha: 'α', beta: 'β', gamma: 'γ', delta: 'δ', epsilon: 'ϵ',
    varepsilon: 'ε', zeta: 'ζ', eta: 'η', theta: 'θ', vartheta: 'ϑ',
    iota: 'ι', kappa: 'κ', lambda: 'λ', mu: 'μ', nu: 'ν', xi: 'ξ',
    pi: 'π', rho: 'ρ', sigma: 'σ', tau: 'τ', upsilon: 'υ', phi: 'ϕ',
    varphi: 'φ', chi: 'χ', psi: 'ψ', omega: 'ω', Gamma: 'Γ', Delta: 'Δ',
    Theta: 'Θ', Lambda: 'Λ', Xi: 'Ξ', Pi: 'Π', Sigma: 'Σ', Phi: 'Φ',
    Psi: 'Ψ', Omega: 'Ω'
  };
  const SYMBOLS = {
    cdot: '⋅', times: '×', div: '÷', pm: '±', mp: '∓', ast: '∗',
    star: '⋆', circ: '∘', bullet: '∙', le: '≤', leq: '≤', ge: '≥',
    geq: '≥', ne: '≠', neq: '≠', approx: '≈', equiv: '≡', sim: '∼',
    simeq: '≃', propto: '∝', ll: '≪', gg: '≫', to: '→', rightarrow: '→',
    leftarrow: '←', leftrightarrow: '↔', Rightarrow: '⇒', Leftarrow: '⇐',
    implies: '⟹', iff: '⟺', mapsto: '↦', uparrow: '↑', downarrow: '↓',
    in: '∈', notin: '∉', ni: '∋', subset: '⊂', subseteq: '⊆',
    supset: '⊃', supseteq: '⊇', cup: '∪', cap: '∩', emptyset: '∅',
    setminus: '∖', forall: '∀', exists: '∃', nexists: '∄', neg: '¬',
    land: '∧', lor: '∨', oplus: '⊕', otimes: '⊗', infty: '∞',
    partial: '∂', nabla: '∇', degree: '°', prime: '′', ldots: '…',
    cdots: '⋯', dots: '…', vdots: '⋮', perp: '⊥', angle: '∠',
    parallel: '∥', mid: '∣', therefore: '∴', because: '∵', checkmark: '✓',
    bar: '¯', hbar: 'ℏ', ell: 'ℓ', Re: 'ℜ', Im: 'ℑ', aleph: 'ℵ',
    surd: '√', triangle: '△', square: '□', langle: '⟨', rangle: '⟩',
    lfloor: '⌊', rfloor: '⌋', lceil: '⌈', rceil: '⌉'
  };
  /* Limits sit under and over these; integrals keep sub/superscripts. */
  const UNDEROVER = { sum: '∑', prod: '∏', coprod: '∐', bigcup: '⋃', bigcap: '⋂', lim: 'lim', max: 'max', min: 'min', argmax: 'arg max', argmin: 'arg min' };
  const INTEGRALS = { int: '∫', iint: '∬', iiint: '∭', oint: '∮' };
  const FUNCTIONS = ['sin', 'cos', 'tan', 'sec', 'csc', 'cot', 'arcsin', 'arccos', 'arctan',
    'sinh', 'cosh', 'tanh', 'log', 'ln', 'lg', 'exp', 'det', 'gcd', 'deg', 'dim', 'ker', 'Pr'];
  const ACCENTS = { hat: '̂', widehat: '̂', tilde: '̃', vec: '→', dot: '˙', ddot: '¨', acute: '´', grave: '`', check: 'ˇ', breve: '˘' };
  const SPACES = { ',': '0.1667em', ':': '0.2222em', ';': '0.2778em', '!': '-0.1667em', quad: '1em', qquad: '2em', ' ': '0.25em' };
  const VARIANTS = { text: 'text', mathrm: 'normal', operatorname: 'op', mathbf: 'bold', mathit: 'italic', mathsf: 'sans', mathtt: 'mono' };
  const RAW_COMMANDS = new Set([...Object.keys(VARIANTS), 'begin', 'end']);
  const OPEN_FENCE = { '(': ')', '[': ']', '\\{': '\\}' };
  const MATRIX_FENCES = {
    matrix: ['', ''], pmatrix: ['(', ')'], bmatrix: ['[', ']'], Bmatrix: ['{', '}'],
    vmatrix: ['∣', '∣'], Vmatrix: ['∥', '∥'], cases: ['{', '']
  };

  function mathTokens(source) {
    const tokens = [];
    let i = 0;
    while (i < source.length) {
      const character = source[i];
      if (/\s/.test(character)) { i += 1; continue; }
      if (character === '\\') {
        const word = /^[A-Za-z]+/.exec(source.slice(i + 1));
        if (word) {
          const name = word[0];
          i += 1 + name.length;
          tokens.push({ t: 'cmd', v: name });
          if (RAW_COMMANDS.has(name)) {
            while (source[i] === ' ') i += 1;
            if (source[i] !== '{') throw new SyntaxError('\\' + name + ' needs a braced argument.');
            let depth = 1, start = i + 1, j = start;
            while (j < source.length && depth > 0) {
              if (source[j] === '{') depth += 1;
              else if (source[j] === '}') depth -= 1;
              if (depth > 0) j += 1;
            }
            if (depth !== 0) throw new SyntaxError('Unbalanced braces after \\' + name + '.');
            tokens.push({ t: 'raw', v: source.slice(start, j) });
            i = j + 1;
          }
          continue;
        }
        const symbol = source[i + 1];
        if (symbol === undefined) throw new SyntaxError('A trailing backslash has no command.');
        tokens.push({ t: 'cmd', v: symbol });
        i += 2;
        continue;
      }
      if (character === '{' || character === '}' || character === '^' || character === '_' || character === '&') {
        tokens.push({ t: character });
        i += 1;
        continue;
      }
      const number = /^\d+(?:[.,]\d+)*/.exec(source.slice(i));
      if (number) { tokens.push({ t: 'num', v: number[0] }); i += number[0].length; continue; }
      if (/[A-Za-z]/.test(character)) { tokens.push({ t: 'id', v: character }); i += 1; continue; }
      tokens.push({ t: 'op', v: character === '-' ? MINUS : character === "'" ? '′' : character });
      i += 1;
    }
    return tokens;
  }

  function parseMath(source) {
    const tokens = mathTokens(source);
    let p = 0;
    const peek = () => tokens[p];
    const take = () => tokens[p++];
    const row = nodes => (nodes.length === 1 ? nodes[0] : { k: 'row', nodes });

    function parseSequence(stop) {
      const nodes = [];
      while (p < tokens.length) {
        const token = peek();
        if (token.t === '}') break;
        if (stop && stop(token)) break;
        nodes.push(parseScripted(stop));
      }
      if (!nodes.length) return { k: 'row', nodes: [] };
      return row(nodes);
    }

    function parseScripted(stop) {
      let base = parseAtom(stop);
      let sub = null, sup = null;
      while (p < tokens.length && (peek().t === '^' || peek().t === '_')) {
        const kind = take().t;
        const value = parseArgument();
        if (kind === '^') sup = value; else sub = value;
      }
      if (sub && sup) return { k: 'subsup', base, sub, sup, limits: base.limits };
      if (sup) return { k: 'sup', base, sup, limits: base.limits };
      if (sub) return { k: 'sub', base, sub, limits: base.limits };
      return base;
    }

    function parseArgument() {
      if (p >= tokens.length) throw new SyntaxError('An argument is missing.');
      const token = peek();
      if (token.t === '{') {
        take();
        const body = parseSequence();
        if (!peek() || peek().t !== '}') throw new SyntaxError('Unbalanced braces in the expression.');
        take();
        return body;
      }
      return parseAtom();
    }

    function parseRaw() {
      const token = take();
      if (!token || token.t !== 'raw') throw new SyntaxError('A text argument is missing.');
      return token.v;
    }

    function parseMatrix(environment) {
      const fences = MATRIX_FENCES[environment];
      if (!fences) throw new SyntaxError('Unsupported environment: ' + environment);
      const rows = [[]];
      const stop = token => token.t === 'cmd' && (token.v === 'end' || token.v === '\\');
      for (;;) {
        if (p >= tokens.length) throw new SyntaxError('\\begin{' + environment + '} has no \\end.');
        rows[rows.length - 1].push(parseSequence(token => stop(token) || token.t === '&'));
        const token = peek();
        if (!token) throw new SyntaxError('\\begin{' + environment + '} has no \\end.');
        if (token.t === '&') { take(); continue; }
        if (token.t === 'cmd' && token.v === '\\') { take(); rows.push([]); continue; }
        if (token.t === 'cmd' && token.v === 'end') {
          take();
          const closing = parseRaw();
          if (closing !== environment) throw new SyntaxError('\\end{' + closing + '} does not match \\begin{' + environment + '}.');
          break;
        }
        throw new SyntaxError('Unexpected token inside ' + environment + '.');
      }
      const cleaned = rows.filter(cells => cells.some(cell => cell.k !== 'row' || cell.nodes.length));
      return { k: 'table', rows: cleaned, open: fences[0], close: fences[1], align: environment === 'cases' ? 'left' : 'center' };
    }

    function parseAtom(stop) {
      const token = take();
      if (!token) throw new SyntaxError('The expression ends early.');
      switch (token.t) {
        case 'num': return { k: 'num', v: token.v };
        case 'id': return { k: 'id', v: token.v };
        case 'op': return { k: 'op', v: token.v };
        case 'raw': return { k: 'text', v: token.v, variant: 'text' };
        case '{': {
          const body = parseSequence();
          if (!peek() || peek().t !== '}') throw new SyntaxError('Unbalanced braces in the expression.');
          take();
          return body;
        }
        case '&': case '^': case '_': throw new SyntaxError('Unexpected "' + token.t + '" in the expression.');
        case 'cmd': break;
        default: throw new SyntaxError('Unexpected token in the expression.');
      }
      const name = token.v;
      if (name in GREEK) return { k: 'id', v: GREEK[name], upright: name[0] === name[0].toUpperCase() };
      if (name in SYMBOLS) return { k: 'op', v: SYMBOLS[name] };
      if (name in UNDEROVER) return { k: 'op', v: UNDEROVER[name], limits: true, big: UNDEROVER[name].length === 1 };
      if (name in INTEGRALS) return { k: 'op', v: INTEGRALS[name], big: true };
      if (FUNCTIONS.includes(name)) return { k: 'text', v: name, variant: 'op' };
      if (name in VARIANTS) return { k: 'text', v: parseRaw(), variant: VARIANTS[name] };
      if (name in ACCENTS) return { k: 'accent', base: parseArgument(), accent: ACCENTS[name], stretch: false };
      if (name in SPACES) return { k: 'space', width: SPACES[name] };
      switch (name) {
        case 'frac': case 'dfrac': case 'tfrac':
          return { k: 'frac', num: parseArgument(), den: parseArgument() };
        case 'binom':
          return { k: 'binom', num: parseArgument(), den: parseArgument() };
        case 'sqrt': {
          let index = null;
          if (peek() && peek().t === 'op' && peek().v === '[') {
            take();
            index = parseSequence(entry => entry.t === 'op' && entry.v === ']');
            if (!peek() || peek().v !== ']') throw new SyntaxError('\\sqrt[ has no closing bracket.');
            take();
          }
          return { k: 'sqrt', body: parseArgument(), index };
        }
        case 'overline': return { k: 'accent', base: parseArgument(), accent: '‾', stretch: true };
        case 'underline': return { k: 'accent', base: parseArgument(), accent: '‾', stretch: true, under: true };
        case 'term': {
          const id = parseArgument();
          const value = id.k === 'num' ? id.v : '1';
          return { k: 'term', id: value, body: parseArgument() };
        }
        case 'left': {
          const open = take();
          if (!open) throw new SyntaxError('\\left needs a delimiter.');
          const openSymbol = open.t === 'cmd' ? (SYMBOLS[open.v] || open.v) : open.v;
          const body = parseSequence(entry => entry.t === 'cmd' && entry.v === 'right');
          if (!peek()) throw new SyntaxError('\\left has no \\right.');
          take();
          const close = take();
          if (!close) throw new SyntaxError('\\right needs a delimiter.');
          const closeSymbol = close.t === 'cmd' ? (SYMBOLS[close.v] || close.v) : close.v;
          return { k: 'fenced', open: openSymbol === '.' ? '' : openSymbol, close: closeSymbol === '.' ? '' : closeSymbol, body };
        }
        case 'begin': return parseMatrix(parseRaw());
        case 'end': throw new SyntaxError('\\end without \\begin.');
        case '\\': return { k: 'op', v: ' ' };
        case '%': case '$': case '#': case '{': case '}': case '|':
          return { k: 'op', v: name };
        case '_': return { k: 'op', v: '_' };
        default:
          if (global.console && console.warn) console.warn('LearningUI.math: unsupported command \\' + name);
          return { k: 'unknown', v: '\\' + name };
      }
    }

    const tree = parseSequence();
    if (p < tokens.length) throw new SyntaxError('Unbalanced braces in the expression.');
    return tree;
  }

  function mathElement(tag, attributes, text) {
    const element = doc.createElementNS(MATHML_NS, tag);
    if (attributes) Object.entries(attributes).forEach(([key, value]) => element.setAttribute(key, String(value)));
    if (text !== undefined) element.textContent = text;
    return element;
  }

  function toMathML(node) {
    switch (node.k) {
      case 'row': {
        const row = mathElement('mrow');
        node.nodes.forEach(child => row.append(toMathML(child)));
        return row;
      }
      case 'num': return mathElement('mn', null, node.v);
      case 'id': return mathElement('mi', node.upright || node.v.length > 1 ? { mathvariant: 'normal' } : null, node.v);
      case 'op': {
        const attributes = {};
        if (node.big) attributes.largeop = 'true';
        if (node.limits) attributes.movablelimits = 'true';
        return mathElement('mo', Object.keys(attributes).length ? attributes : null, node.v);
      }
      case 'text': {
        if (node.variant === 'op') return mathElement('mi', { mathvariant: 'normal' }, node.v);
        const text = mathElement('mtext', null, node.v);
        if (node.variant === 'bold') text.setAttribute('style', 'font-weight:700');
        if (node.variant === 'italic') text.setAttribute('style', 'font-style:italic');
        if (node.variant === 'sans') text.setAttribute('style', 'font-family:var(--font-sans)');
        if (node.variant === 'mono') text.setAttribute('style', 'font-family:var(--font-mono)');
        return text;
      }
      case 'frac': {
        const fraction = mathElement('mfrac');
        fraction.append(toMathML(node.num), toMathML(node.den));
        return fraction;
      }
      case 'binom': {
        const wrapper = mathElement('mrow');
        const fraction = mathElement('mfrac', { linethickness: '0' });
        fraction.append(toMathML(node.num), toMathML(node.den));
        wrapper.append(mathElement('mo', { stretchy: 'true' }, '('), fraction, mathElement('mo', { stretchy: 'true' }, ')'));
        return wrapper;
      }
      case 'sqrt': {
        if (node.index) {
          const root = mathElement('mroot');
          root.append(toMathML(node.body), toMathML(node.index));
          return root;
        }
        const root = mathElement('msqrt');
        root.append(toMathML(node.body));
        return root;
      }
      case 'sup': case 'sub': case 'subsup': {
        const limits = node.limits;
        const tag = node.k === 'subsup'
          ? (limits ? 'munderover' : 'msubsup')
          : node.k === 'sup' ? (limits ? 'mover' : 'msup') : (limits ? 'munder' : 'msub');
        const script = mathElement(tag);
        script.append(toMathML(node.base));
        if (node.k === 'subsup') script.append(toMathML(node.sub), toMathML(node.sup));
        else script.append(toMathML(node.k === 'sup' ? node.sup : node.sub));
        return script;
      }
      case 'accent': {
        const script = mathElement(node.under ? 'munder' : 'mover', { accent: 'true' });
        script.append(toMathML(node.base), mathElement('mo', node.stretch ? { stretchy: 'true' } : null, node.accent));
        return script;
      }
      case 'fenced': {
        const wrapper = mathElement('mrow');
        if (node.open) wrapper.append(mathElement('mo', { fence: 'true', stretchy: 'true' }, node.open));
        wrapper.append(toMathML(node.body));
        if (node.close) wrapper.append(mathElement('mo', { fence: 'true', stretchy: 'true' }, node.close));
        return wrapper;
      }
      case 'space': return mathElement('mspace', { width: node.width });
      case 'term': {
        const wrapper = mathElement('mrow', { class: 'math-term', 'data-term': node.id });
        wrapper.append(toMathML(node.body));
        return wrapper;
      }
      case 'table': {
        const wrapper = mathElement('mrow');
        const table = mathElement('mtable', node.align === 'left' ? { columnalign: 'left' } : null);
        node.rows.forEach(cells => {
          const row = mathElement('mtr');
          cells.forEach(cell => {
            const data = mathElement('mtd');
            data.append(toMathML(cell));
            row.append(data);
          });
          table.append(row);
        });
        if (node.open) wrapper.append(mathElement('mo', { fence: 'true', stretchy: 'true' }, node.open));
        wrapper.append(table);
        if (node.close) wrapper.append(mathElement('mo', { fence: 'true', stretchy: 'true' }, node.close));
        return wrapper;
      }
      case 'unknown': return mathElement('mtext', { class: 'math-unknown' }, node.v);
      default: throw new TypeError('Unknown math node.');
    }
  }

  /* Linear notation: the no-MathML fallback and the text used for labels. */
  function toLinear(node) {
    /* Parenthesize only composite parts, so P(1 + r)^t stays readable. */
    const wrap = child => {
      const text = toLinear(child).trim();
      const atomic = text.length <= 1 || ['num', 'id', 'op', 'text', 'fenced', 'sqrt', 'table'].includes(child.k);
      return atomic ? text : '(' + text + ')';
    };
    switch (node.k) {
      case 'row': return node.nodes.map(toLinear).join('');
      case 'num': case 'id': case 'op': case 'unknown': return node.v;
      case 'text': return node.variant === 'op' ? node.v + ' ' : node.v;
      case 'frac': return wrap(node.num) + '/' + wrap(node.den);
      case 'binom': return 'C(' + toLinear(node.num) + ', ' + toLinear(node.den) + ')';
      case 'sqrt': return (node.index ? 'root[' + toLinear(node.index) + ']' : '√') + wrap(node.body);
      case 'sup': return wrap(node.base) + '^' + wrap(node.sup);
      case 'sub': return wrap(node.base) + '_' + wrap(node.sub);
      case 'subsup': return wrap(node.base) + '_' + wrap(node.sub) + '^' + wrap(node.sup);
      case 'accent': return toLinear(node.base);
      case 'fenced': return (node.open || '') + toLinear(node.body) + (node.close || '');
      case 'space': return ' ';
      case 'term': return toLinear(node.body);
      case 'table': return node.rows.map(cells => cells.map(toLinear).join(', ')).join('; ');
      default: return '';
    }
  }

  function toFallback(node) {
    const span = (className, text) => {
      const element = doc.createElement('span');
      if (className) element.className = className;
      if (text !== undefined) element.textContent = text;
      return element;
    };
    const wrapped = child => {
      const rendered = toFallback(child);
      if (child.k === 'row' && child.nodes.length > 1) {
        const group = span();
        group.append(span('mf-op', '('), rendered, span('mf-op', ')'));
        return group;
      }
      return rendered;
    };
    switch (node.k) {
      case 'row': {
        const row = span();
        node.nodes.forEach(child => row.append(toFallback(child)));
        return row;
      }
      case 'num': return span('mf-num', node.v);
      case 'id': return span(null, node.v);
      case 'op': return span('mf-op', node.v);
      case 'text': case 'unknown': return span('mf-op', node.v + (node.variant === 'op' ? ' ' : ''));
      case 'frac': {
        const row = span();
        row.append(wrapped(node.num), span('mf-op', '/'), wrapped(node.den));
        return row;
      }
      case 'binom': return span('mf-op', 'C(' + toLinear(node.num) + ', ' + toLinear(node.den) + ')');
      case 'sqrt': {
        const row = span();
        row.append(span('mf-op', node.index ? '√[' + toLinear(node.index) + ']' : '√'), wrapped(node.body));
        return row;
      }
      case 'sup': case 'sub': case 'subsup': {
        const row = span();
        row.append(toFallback(node.base));
        if (node.sub) { const element = doc.createElement('sub'); element.append(toFallback(node.sub)); row.append(element); }
        if (node.sup) { const element = doc.createElement('sup'); element.append(toFallback(node.sup)); row.append(element); }
        return row;
      }
      case 'accent': {
        const row = span();
        row.append(toFallback(node.base), span('mf-op', node.accent === '→' ? '⃗' : ''));
        return row;
      }
      case 'fenced': {
        const row = span();
        row.append(span('mf-op', node.open || ''), toFallback(node.body), span('mf-op', node.close || ''));
        return row;
      }
      case 'space': return doc.createTextNode(' ');
      case 'term': {
        const row = span('math-term');
        row.dataset.term = node.id;
        row.append(toFallback(node.body));
        return row;
      }
      case 'table': return span('mf-op', toLinear(node));
      default: return span();
    }
  }

  const math = {
    supported: mathmlSupported,
    /* Compile a TeX-subset string to an element ready to insert. */
    tex(source, { display = false, label } = {}) {
      if (typeof source !== 'string' || !source.trim()) throw new TypeError('math.tex needs a non-empty TeX string.');
      const tree = parseMath(source);
      if (!mathmlSupported) {
        const fallback = doc.createElement('span');
        fallback.className = 'math-fallback' + (display ? ' equation' : '');
        fallback.append(toFallback(tree));
        fallback.setAttribute('role', 'math');
        fallback.setAttribute('aria-label', label || toLinear(tree));
        return fallback;
      }
      const root = mathElement('math', display ? { display: 'block' } : null);
      root.append(toMathML(tree));
      if (label) root.setAttribute('aria-label', label);
      return root;
    },
    /* Replace the contents of every [data-math] element on the page. Call it
     * once after the markup exists, and again after changing a data-math value. */
    render(root) {
      const scope = root || doc;
      const targets = [...scope.querySelectorAll('[data-math]')];
      let rendered = 0;
      targets.forEach(element => {
        try {
          const display = element.dataset.mathDisplay === 'block';
          const compiled = math.tex(element.dataset.math, { display, label: element.dataset.mathLabel });
          element.replaceChildren(compiled);
          rendered += 1;
        } catch (error) {
          element.textContent = element.dataset.math;
          element.classList.add('math-fallback');
          if (global.console && console.error) console.error('LearningUI.math: ' + error.message, element.dataset.math);
        }
      });
      return rendered;
    },
    /* Change one expression in place, keeping its display mode and label. */
    update(element, source) {
      if (!element) throw new TypeError('math.update needs an element.');
      element.dataset.math = source;
      math.render(element.parentNode || element);
      return element;
    },
    /* Linear text for an aria-label, an announcement, or a table cell. */
    toText(source) { return toLinear(parseMath(source)); }
  };

  /* ========================================================= 6. drawing == */
  /* Enough SVG to draw a diagram by hand: a free-body sketch, a circuit, a
   * geometric construction, a network. Pair every drawing with text. */
  const svg = {
    NS: SVG_NS,
    el(tag, attributes, text) {
      const element = doc.createElementNS(SVG_NS, tag);
      if (attributes) Object.entries(attributes).forEach(([key, value]) => {
        if (value !== undefined && value !== null) element.setAttribute(key, String(value));
      });
      if (text !== undefined) element.textContent = text;
      return element;
    },
    /* A figure with an accessible name. Pass describedBy for a live readout. */
    create({ width, height, label, className, describedBy } = {}) {
      requireFinite(width, 'An SVG width');
      requireFinite(height, 'An SVG height');
      const root = svg.el('svg', {
        viewBox: '0 0 ' + width + ' ' + height,
        role: 'img',
        class: className,
        'aria-label': label
      });
      if (describedBy) root.setAttribute('aria-describedby', describedBy);
      return root;
    },
    /* Linear mapping from model units to pixels, with an inverse. */
    scale({ domain, range }) {
      if (!Array.isArray(domain) || !Array.isArray(range) || domain.length !== 2 || range.length !== 2) {
        throw new TypeError('A scale needs a two-value domain and range.');
      }
      const [d0, d1] = domain.map(Number), [r0, r1] = range.map(Number);
      if (d0 === d1) throw new RangeError('A scale domain must span two different values.');
      const map = value => r0 + ((Number(value) - d0) / (d1 - d0)) * (r1 - r0);
      map.invert = pixel => d0 + ((Number(pixel) - r0) / (r1 - r0)) * (d1 - d0);
      map.domain = [d0, d1];
      map.range = [r0, r1];
      map.ticks = (count = 4) => Array.from({ length: count + 1 }, (_, i) => d0 + ((d1 - d0) * i) / count);
      return map;
    },
    path(points, { close = false } = {}) {
      if (!Array.isArray(points) || !points.length) throw new TypeError('A path needs points.');
      return points.map((point, index) => (index ? 'L' : 'M') + round(point.x, 2) + ' ' + round(point.y, 2)).join(' ') + (close ? ' Z' : '');
    }
  };

  /* ========================================================= 7. figures == */

  const chartStates = new WeakMap();
  let chartId = 0;
  const SERIES_COLORS = ['var(--series-1)', 'var(--series-2)', 'var(--series-3)', 'var(--series-4)'];
  const SERIES_DASH = ['', '7 4', '2 4', '9 3 2 3'];
  const SERIES_SWATCH = ['solid', 'dashed', 'dotted', 'dashed'];
  const defaultNumber = value => fmt.num(value);

  /* Round axis steps. A learner reads 0, 50, 100 far faster than 71.33. */
  function niceTicks(low, high, target) {
    const span = high - low;
    if (!(span > 0)) return [low];
    const magnitude = Math.pow(10, Math.floor(Math.log10(span / target)));
    let best = null;
    [1, 2, 2.5, 4, 5, 8, 10].forEach(multiple => {
      const step = multiple * magnitude;
      const first = Math.ceil(low / step - 1e-9);
      const count = Math.floor(high / step + 1e-9) - first + 1;
      if (count < 2 || count > 12) return;
      let score = Math.abs(count - (target + 1));
      if (Math.abs(span / step - Math.round(span / step)) < 1e-9) score -= 1;
      if (!best || score < best.score) best = { step, first, count, score };
    });
    if (!best) return [low, high];
    return Array.from({ length: best.count }, (_, index) => round((best.first + index) * best.step, 10));
  }

  function node(tag, text, className) {
    const element = doc.createElement(tag);
    if (text !== undefined) element.textContent = text;
    if (className) element.className = className;
    return element;
  }

  /* Line, area, step, and scatter series on shared axes, with optional
   * annotations, an explicit baseline curve, a keyboard-reachable data cursor,
   * and a data table. One to four series; the model owns every number. */
  function renderChart(root, options) {
    if (!root) throw new TypeError('renderChart needs a container element.');
    const { series, xLabel, yLabel } = options;
    if (!Array.isArray(series) || !series.length || series.length > 4 || series.some(item =>
      !Array.isArray(item.points) || !item.points.length || item.points.some(point =>
        !Number.isFinite(point.x) || !Number.isFinite(point.y)))) {
      throw new TypeError('Chart needs 1-4 named series with finite x/y points.');
    }
    if (!xLabel || !yLabel) throw new TypeError('Chart needs xLabel and yLabel.');
    for (const key of ['xDomain', 'yDomain']) {
      const domain = options[key];
      if (domain && (domain.length !== 2 || !domain.every(Number.isFinite) || domain[0] >= domain[1])) {
        throw new RangeError(key + ' must be two increasing finite numbers.');
      }
    }
    (options.annotations || []).forEach(annotation => {
      if (!annotation || !annotation.type) throw new TypeError('Each annotation needs a type.');
    });
    let state = chartStates.get(root);
    if (!state) {
      state = { width: 0, clipId: 'learning-chart-' + (++chartId), cursor: null, previous: null, trail: null };
      chartStates.set(root, state);
      if (typeof ResizeObserver !== 'undefined') {
        state.observer = new ResizeObserver(() => {
          const width = Math.round(root.clientWidth);
          if (width && width !== state.width) drawChart(root, state, { resize: true });
        });
        state.observer.observe(root);
      }
    }
    /* A baseline is an explicit comparison curve the lesson owns: the reset
     * defaults, or a setting the learner pinned. It is drawn dashed behind
     * the data and is not part of the series palette or the table. */
    const baseline = options.baseline;
    if (!baseline) state.trail = null;
    else {
      const lists = Array.isArray(baseline[0]) ? baseline : [baseline];
      lists.forEach(list => {
        if (!Array.isArray(list) || list.some(point => !Number.isFinite(point.x) || !Number.isFinite(point.y))) {
          throw new TypeError('A baseline needs finite x/y points.');
        }
      });
      state.trail = lists;
    }
    state.options = options;
    drawChart(root, state, {});
  }

  function drawChart(root, state, { resize = false } = {}) {
    if (state.frame) {
      global.cancelAnimationFrame(state.frame);
      state.frame = null;
    }
    const options = state.options;
    const { series, xLabel, yLabel, formatX = defaultNumber, formatY = defaultNumber } = options;
    const all = series.flatMap(item => item.points);
    const extent = axis => {
      let low = Math.min(...all.map(point => point[axis]));
      let high = Math.max(...all.map(point => point[axis]));
      if (low === high) { low -= 1; high += 1; }
      return [low, high];
    };
    const xd = options.xDomain || extent('x');
    const yd = options.yDomain || extent('y');
    const width = Math.max(240, Math.round(root.clientWidth) || 600);
    const height = Math.max(180, options.height || 300);
    const narrow = width < 400;
    state.width = Math.round(root.clientWidth);
    const left = narrow ? 54 : 68, right = 22, top = 34, bottom = 54;
    const x = svg.scale({ domain: xd, range: [left, width - right] });
    const y = svg.scale({ domain: yd, range: [height - bottom, top] });
    const cursorOn = options.cursor !== false;
    const readoutId = state.clipId + '-readout';
    const figure = svg.create({
      width,
      height,
      label: yLabel + ' by ' + xLabel + '. ' + series.map(item => item.label).join(' and ') +
        '.' + (cursorOn ? ' Use the arrow keys to read individual values.' : '') + ' Values in the data table below.',
      describedBy: cursorOn ? readoutId : undefined
    });
    const defs = svg.el('defs');
    const clip = svg.el('clipPath', { id: state.clipId });
    clip.append(svg.el('rect', { x: left - 4, y: top - 4, width: width - left - right + 8, height: height - top - bottom + 8 }));
    defs.append(clip);
    figure.append(defs);
    figure.append(svg.el('text', { x: left, y: 18, class: 'chart-axis-title' }, yLabel));
    const xValues = niceTicks(xd[0], xd[1], options.xTicks || (narrow ? 2 : 4));
    const yValues = niceTicks(yd[0], yd[1], options.yTicks || (narrow ? 2 : 4));
    yValues.forEach(value => {
      figure.append(svg.el('line', { x1: left, x2: width - right, y1: y(value), y2: y(value), class: 'chart-grid' }));
      figure.append(svg.el('text', { x: left - 8, y: y(value) + 4, 'text-anchor': 'end' }, formatY(value)));
    });
    xValues.forEach(value => {
      const at = x(value);
      figure.append(svg.el('text', {
        x: at, y: height - bottom + 24,
        'text-anchor': at - left < 14 ? 'start' : width - right - at < 14 ? 'end' : 'middle'
      }, formatX(value)));
    });
    if (xd[0] <= 0 && xd[1] >= 0) figure.append(svg.el('line', { x1: x(0), x2: x(0), y1: top, y2: height - bottom, class: 'chart-origin' }));
    if (yd[0] <= 0 && yd[1] >= 0) figure.append(svg.el('line', { x1: left, x2: width - right, y1: y(0), y2: y(0), class: 'chart-origin' }));
    figure.append(svg.el('text', { x: (left + width - right) / 2, y: height - 6, 'text-anchor': 'middle', class: 'chart-axis-title' }, xLabel));

    /* Annotations sit behind the data: reference lines, bands, marked points. */
    (options.annotations || []).forEach(annotation => {
      const label = annotation.label;
      if (annotation.type === 'vline' || annotation.type === 'hline') {
        const vertical = annotation.type === 'vline';
        const at = Number(annotation.at);
        if (!Number.isFinite(at)) throw new TypeError('A reference line needs a finite "at" value.');
        figure.append(svg.el('line', vertical
          ? { x1: x(at), x2: x(at), y1: top, y2: height - bottom, class: 'chart-rule' }
          : { x1: left, x2: width - right, y1: y(at), y2: y(at), class: 'chart-rule' }));
        if (label) {
          figure.append(svg.el('text', vertical
            ? { x: x(at) + 5, y: top + 12, class: 'chart-rule-label' }
            : { x: width - right, y: y(at) - 6, 'text-anchor': 'end', class: 'chart-rule-label' }, label));
        }
      } else if (annotation.type === 'band') {
        const from = Number(annotation.from), to = Number(annotation.to);
        if (!Number.isFinite(from) || !Number.isFinite(to)) throw new TypeError('A band needs finite from/to values.');
        const onX = annotation.axis !== 'y';
        const a = onX ? x(Math.min(from, to)) : y(Math.max(from, to));
        const b = onX ? x(Math.max(from, to)) : y(Math.min(from, to));
        figure.append(svg.el('rect', onX
          ? { x: a, y: top, width: Math.max(1, b - a), height: height - top - bottom, class: 'chart-band' }
          : { x: left, y: a, width: width - left - right, height: Math.max(1, b - a), class: 'chart-band' }));
        if (label) figure.append(svg.el('text', { x: (a + b) / 2, y: top + 12, 'text-anchor': 'middle', class: 'chart-rule-label' }, label));
      } else if (annotation.type === 'point') {
        const px = x(Number(annotation.x)), py = y(Number(annotation.y));
        figure.append(svg.el('circle', { cx: px, cy: py, r: 5, fill: 'var(--accent)' }));
        if (label) figure.append(svg.el('text', { x: px + 9, y: py - 8, class: 'chart-rule-label' }, label));
      } else if (annotation.type === 'note') {
        figure.append(svg.el('text', { x: x(Number(annotation.x)), y: y(Number(annotation.y)), class: 'chart-rule-label' }, label || ''));
      }
    });

    /* A neutral copy of the previous setting, for before-and-after comparison. */
    if (state.trail) {
      state.trail.forEach(points => {
        if (points.length < 2) return;
        figure.append(svg.el('polyline', {
          points: points.map(point => x(point.x) + ',' + y(point.y)).join(' '),
          fill: 'none', stroke: 'var(--graphic-neutral)', 'stroke-width': 2,
          class: 'chart-trail', 'clip-path': 'url(#' + state.clipId + ')'
        }));
      });
    }

    const legend = node('ul', undefined, 'chart-legend');
    const markerGroups = [];
    const baseline = clamp(0, yd[0], yd[1]);
    series.forEach((item, index) => {
      const color = item.color || SERIES_COLORS[index];
      const type = item.type || 'line';
      const dash = item.dash !== undefined ? item.dash : SERIES_DASH[index];
      let points = item.points;
      if (type === 'step' && points.length > 1) {
        const stepped = [];
        points.forEach((point, i) => {
          if (i) stepped.push({ x: point.x, y: points[i - 1].y });
          stepped.push(point);
        });
        points = stepped;
      }
      const pixels = points.map(point => ({ x: x(point.x), y: y(point.y) }));
      if (type === 'area' && pixels.length > 1) {
        figure.append(svg.el('path', {
          d: svg.path(pixels) + ' L' + round(pixels[pixels.length - 1].x, 2) + ' ' + round(y(baseline), 2) +
            ' L' + round(pixels[0].x, 2) + ' ' + round(y(baseline), 2) + ' Z',
          fill: color, 'fill-opacity': '.14', stroke: 'none', 'clip-path': 'url(#' + state.clipId + ')'
        }));
      }
      if (type !== 'scatter' && pixels.length > 1) {
        figure.append(svg.el('polyline', {
          points: pixels.map(point => round(point.x, 2) + ',' + round(point.y, 2)).join(' '),
          fill: 'none', stroke: color, 'stroke-width': 2.5, 'stroke-dasharray': dash,
          'stroke-linejoin': 'round', 'clip-path': 'url(#' + state.clipId + ')'
        }));
      }
      const group = svg.el('g');
      const showMarkers = type === 'scatter' || item.points.length <= 24;
      if (showMarkers) {
        item.points.forEach(point => {
          if (point.x < xd[0] || point.x > xd[1] || point.y < yd[0] || point.y > yd[1]) return;
          const attributes = { fill: 'var(--surface)', stroke: color, 'stroke-width': 2 };
          const mark = index % 2 === 0
            ? svg.el('circle', Object.assign({ cx: x(point.x), cy: y(point.y), r: 3.5 }, attributes))
            : svg.el('rect', Object.assign({ x: x(point.x) - 3, y: y(point.y) - 3, width: 6, height: 6 }, attributes));
          mark.append(svg.el('title', null, item.label + ': ' + formatX(point.x) + ', ' + formatY(point.y)));
          group.append(mark);
        });
      }
      figure.append(group);
      markerGroups.push(group);
      const entry = node('li');
      const swatch = node('span', undefined, 'chart-swatch' + (type === 'scatter' ? ' chart-swatch--block' : ''));
      if (type === 'scatter') swatch.style.background = color;
      else {
        swatch.style.borderColor = color;
        swatch.style.borderTopStyle = SERIES_SWATCH[index];
      }
      swatch.setAttribute('aria-hidden', 'true');
      entry.append(swatch, doc.createTextNode(item.label));
      legend.append(entry);
    });
    if (state.trail) {
      const entry = node('li');
      const swatch = node('span', undefined, 'chart-swatch');
      swatch.style.borderColor = 'var(--graphic-neutral)';
      swatch.style.borderTopStyle = 'dotted';
      swatch.setAttribute('aria-hidden', 'true');
      entry.append(swatch, doc.createTextNode(options.baselineLabel || 'Baseline for comparison'));
      legend.append(entry);
    }

    /* Data cursor: pointer or arrow keys; the readout is a live region. */
    const primary = series.reduce((best, item) => (item.points.length > best.points.length ? item : best), series[0]);
    let cursorLayer = null;
    if (cursorOn && primary.points.length > 1) {
      figure.setAttribute('tabindex', '0');
      cursorLayer = svg.el('g', { 'aria-hidden': 'true' });
      figure.append(cursorLayer);
    }
    function readoutText(index) {
      if (index === null || index === undefined) return '';
      const point = primary.points[index];
      const parts = [xLabel + ' ' + formatX(point.x)];
      series.forEach(item => {
        const match = item.points.find(candidate => candidate.x === point.x);
        if (match) parts.push(item.label + ' ' + formatY(match.y));
      });
      return parts.join(' · ');
    }
    function paintCursor(index) {
      if (!cursorLayer) return;
      cursorLayer.replaceChildren();
      if (index === null || index === undefined) return;
      const point = primary.points[index];
      const px = x(point.x);
      cursorLayer.append(svg.el('line', { x1: px, x2: px, y1: top, y2: height - bottom, class: 'chart-cursor-line' }));
      series.forEach(item => {
        const match = item.points.find(candidate => candidate.x === point.x);
        if (match) cursorLayer.append(svg.el('circle', { cx: px, cy: y(match.y), r: 5, class: 'chart-cursor-dot' }));
      });
    }

    /* Reuse the readout and the table disclosure so focus and the live region
     * survive a redraw while the learner is dragging a control. */
    let readout = state.readout;
    if (cursorOn && !readout) {
      readout = node('p', undefined, 'chart-readout');
      readout.id = readoutId;
      readout.setAttribute('role', 'status');
      readout.setAttribute('aria-live', 'polite');
      readout.setAttribute('aria-atomic', 'true');
      state.readout = readout;
    }
    let hint = state.hint;
    if (cursorOn && !hint) {
      hint = node('p', 'Hover or focus the chart, then press ← or → to read each value.', 'chart-hint');
      state.hint = hint;
    }
    let details = state.details;
    const firstBuild = !details;
    if (!details) {
      details = node('details');
      details.append(node('summary', 'View values as a table'));
      const wrap = node('div', undefined, 'table-wrap');
      wrap.tabIndex = 0;
      wrap.setAttribute('role', 'region');
      wrap.setAttribute('aria-label', 'Chart data');
      details.append(wrap);
      state.details = details;
    }
    const table = node('table', undefined, 'data-table');
    table.append(node('caption', yLabel + ' by ' + xLabel));
    const head = node('thead'), headRow = node('tr');
    ['Series', xLabel, yLabel].forEach(label => {
      const cell = node('th', label);
      cell.scope = 'col';
      headRow.append(cell);
    });
    head.append(headRow);
    const body = node('tbody');
    series.forEach(item => item.points.forEach(point => {
      const row = node('tr');
      row.append(node('td', item.label), node('td', formatX(point.x)), node('td', formatY(point.y)));
      body.append(row);
    }));
    table.append(head, body);
    details.querySelector('.table-wrap').replaceChildren(table);

    const children = [figure, legend];
    if (cursorOn) children.push(readout, hint);
    children.push(details);
    const activeInChart = root.contains(doc.activeElement) ? doc.activeElement : null;
    const refocusSummary = activeInChart === details.querySelector('summary');
    const refocusFigure = activeInChart && activeInChart.tagName === 'svg';
    root.replaceChildren(...children);
    if (refocusSummary) details.querySelector('summary').focus({ preventScroll: true });
    if (refocusFigure) figure.focus({ preventScroll: true });

    if (cursorOn && primary.points.length > 1) {
      const limit = primary.points.length - 1;
      const setCursor = index => {
        state.cursor = index === null ? null : clamp(index, 0, limit);
        paintCursor(state.cursor);
        readout.textContent = readoutText(state.cursor);
      };
      const fromPointer = event => {
        const box = figure.getBoundingClientRect();
        if (!box.width) return;
        const modelX = x.invert(((event.clientX - box.left) / box.width) * width);
        let nearest = 0;
        primary.points.forEach((point, index) => {
          if (Math.abs(point.x - modelX) < Math.abs(primary.points[nearest].x - modelX)) nearest = index;
        });
        setCursor(nearest);
      };
      figure.addEventListener('pointermove', fromPointer);
      figure.addEventListener('pointerdown', fromPointer);
      figure.addEventListener('pointerleave', () => setCursor(null));
      figure.addEventListener('keydown', event => {
        const current = state.cursor === null ? -1 : state.cursor;
        const moves = {
          ArrowRight: current + 1, ArrowLeft: current <= 0 ? 0 : current - 1,
          Home: 0, End: limit
        };
        if (event.key === 'Escape') { setCursor(null); return; }
        if (!(event.key in moves)) return;
        event.preventDefault();
        setCursor(moves[event.key]);
      });
      figure.addEventListener('blur', () => setCursor(null));
      if (state.cursor !== null && state.cursor <= limit) setCursor(state.cursor);
    }

    /* A discrete pointer-selected comparison can show the curve's change.
     * Live ranges and keyboard edits must render their data immediately. */
    const sameShape = state.previous && state.previous.length === series.length &&
      state.previous.every((points, index) => points.length === series[index].points.length);
    const shouldAnimate = options.animate !== false && inputMethod === 'pointer' && !continuousInput &&
      !motion.reduced() && !resize && sameShape && !firstBuild;
    if (shouldAnimate) {
      const targets = series.map(item => item.points.map(point => ({ x: x(point.x), y: y(point.y) })));
      const starts = state.previous.map(points => points.map(point => ({ x: x(point.x), y: y(point.y) })));
      const lines = [...figure.querySelectorAll('polyline:not(.chart-trail)')];
      if (lines.length === series.length) {
        markerGroups.forEach(group => { group.style.opacity = '0'; });
        if (cursorLayer) cursorLayer.style.opacity = '0';
        const started = global.performance ? performance.now() : Date.now();
        const duration = 190;
        if (state.frame) cancelAnimationFrame(state.frame);
        const tick = now => {
          const t = clamp(((now || Date.now()) - started) / duration, 0, 1);
          lines.forEach((line, index) => {
            const from = starts[index], to = targets[index];
            line.setAttribute('points', to.map((point, i) => {
              const base = from[i] || point;
              return round(lerp(base.x, point.x, t), 2) + ',' + round(lerp(base.y, point.y, t), 2);
            }).join(' '));
          });
          if (t < 1) state.frame = requestAnimationFrame(tick);
          else {
            markerGroups.forEach(group => { group.style.opacity = ''; });
            if (cursorLayer) cursorLayer.style.opacity = '';
            state.frame = null;
          }
        };
        state.frame = requestAnimationFrame(tick);
      }
    }
    state.previous = series.map(item => item.points.slice());
  }

  /* Categorical magnitudes as text-first bars: counts, frequencies, shares,
   * histogram bins. Labels and values are real text, so the figure reads
   * correctly without an extra alternative. */
  function renderBars(root, options) {
    if (!root) throw new TypeError('renderBars needs a container element.');
    const { bars, orientation = 'horizontal', format = defaultNumber, caption, target, table } = options || {};
    if (!Array.isArray(bars) || !bars.length) throw new TypeError('renderBars needs at least one bar.');
    bars.forEach(bar => {
      if (typeof bar.label !== 'string' || !bar.label) throw new TypeError('Every bar needs a label.');
      requireFinite(Number(bar.value), 'A bar value');
      if (Number(bar.value) < 0) throw new RangeError('renderBars shows magnitudes; keep values at or above zero.');
    });
    const highest = Math.max(...bars.map(bar => Number(bar.value)), target ? Number(target.value) : 0);
    const max = Number.isFinite(options.max) ? Number(options.max) : highest || 1;
    const chart = node('div', undefined, 'bar-chart' + (orientation === 'vertical' ? ' bar-chart--vertical' : ''));
    if (caption) {
      const heading = node('p', caption, 'explain');
      chart.append(heading);
    }
    if (orientation === 'vertical') {
      const row = node('div');
      row.style.display = 'flex';
      row.style.alignItems = 'flex-end';
      row.style.gap = '4px';
      row.style.height = (options.height || 180) + 'px';
      bars.forEach((bar, index) => {
        const column = node('div');
        column.style.flex = '1 1 0';
        column.style.display = 'flex';
        column.style.flexDirection = 'column';
        column.style.justifyContent = 'flex-end';
        column.style.height = '100%';
        column.style.minWidth = '0';
        const fill = node('div', undefined, 'bar-fill');
        fill.style.height = Math.max(1, (Number(bar.value) / max) * 100) + '%';
        fill.style.width = '100%';
        if (bar.series) fill.style.background = 'var(--series-' + bar.series + ')';
        if (bar.muted) fill.style.background = 'var(--graphic-neutral)';
        fill.title = bar.label + ': ' + format(Number(bar.value));
        const label = node('span', bars.length > (options.labelEvery || 12) && index % Math.ceil(bars.length / 6) !== 0 ? '' : bar.label, 'faint');
        label.style.textAlign = 'center';
        label.style.overflow = 'hidden';
        column.append(fill, label);
        row.append(column);
      });
      chart.append(row);
    } else {
      bars.forEach(bar => {
        const row = node('div', undefined, 'bar-row');
        if (bar.series) row.dataset.series = String(bar.series);
        if (bar.muted) row.dataset.muted = 'true';
        const label = node('span', bar.label, 'bar-label');
        const track = node('div', undefined, 'bar-track');
        const fill = node('div', undefined, 'bar-fill');
        fill.style.width = clamp((Number(bar.value) / max) * 100, 0, 100) + '%';
        track.append(fill);
        const value = node('span', format(Number(bar.value)) + (bar.note ? ' ' : ''), 'bar-value');
        if (bar.note) value.append(node('span', bar.note, 'faint'));
        row.append(label, track, value);
        chart.append(row);
      });
    }
    if (target) {
      const note = node('p', (target.label || 'Reference') + ': ' + format(Number(target.value)), 'explain');
      chart.append(note);
    }
    const children = [chart];
    const wantsTable = table === undefined ? orientation === 'vertical' : Boolean(table);
    if (wantsTable) {
      const details = node('details');
      details.append(node('summary', 'View values as a table'));
      const wrap = node('div', undefined, 'table-wrap');
      const dataTable = node('table', undefined, 'data-table');
      if (caption) dataTable.append(node('caption', caption));
      const head = node('thead'), headRow = node('tr');
      [options.labelHeading || 'Category', options.valueHeading || 'Value'].forEach(text => {
        const cell = node('th', text);
        cell.scope = 'col';
        headRow.append(cell);
      });
      head.append(headRow);
      const body = node('tbody');
      bars.forEach(bar => {
        const row = node('tr');
        row.append(node('td', bar.label), node('td', format(Number(bar.value))));
        body.append(row);
      });
      dataTable.append(head, body);
      wrap.append(dataTable);
      details.append(wrap);
      const previous = root.querySelector('details');
      details.open = Boolean(previous && previous.open);
      children.push(details);
    }
    root.replaceChildren(...children);
  }

  /* A labeled table of cells: confusion matrix, truth table, transition
   * table, payoff grid, heat map. Real table semantics, so headers and cells
   * are announced together. */
  function renderGrid(root, options) {
    if (!root) throw new TypeError('renderGrid needs a container element.');
    const { columns, rows, cells, caption, corner = '', format = defaultNumber } = options || {};
    if (!Array.isArray(columns) || !columns.length) throw new TypeError('renderGrid needs columns.');
    if (!Array.isArray(rows) || !rows.length) throw new TypeError('renderGrid needs rows.');
    if (!Array.isArray(cells) || cells.length !== rows.length ||
      cells.some(row => !Array.isArray(row) || row.length !== columns.length)) {
      throw new TypeError('renderGrid needs one cell per row and column.');
    }
    const text = entry => (typeof entry === 'string' ? entry : entry.label);
    const table = node('table', undefined, 'data-table grid-table');
    if (caption) table.append(node('caption', caption));
    const head = node('thead'), headRow = node('tr');
    const cornerCell = node(corner ? 'th' : 'td', corner);
    if (corner) cornerCell.scope = 'col';
    headRow.append(cornerCell);
    columns.forEach(column => {
      const cell = node('th', text(column));
      cell.scope = 'col';
      headRow.append(cell);
    });
    head.append(headRow);
    const body = node('tbody');
    rows.forEach((row, rowIndex) => {
      const line = node('tr');
      const header = node('th', text(row));
      header.scope = 'row';
      line.append(header);
      cells[rowIndex].forEach(cell => {
        const value = cell && typeof cell === 'object' ? cell : { value: cell };
        const data = node('td');
        const shown = value.value === undefined || value.value === null
          ? '-'
          : (typeof value.value === 'number' ? format(value.value) : String(value.value));
        data.append(node('strong', shown));
        if (value.label) data.append(node('span', value.label, 'faint'));
        if (value.label) data.querySelector('.faint').style.display = 'block';
        if (value.tone) data.classList.add('cm-' + value.tone);
        if (Number.isFinite(value.intensity)) {
          const share = clamp(value.intensity, 0, 1) * 100;
          data.style.background = 'color-mix(in oklab, var(--series-1) ' + share.toFixed(0) + '%, var(--surface))';
        }
        if (value.state) data.dataset.state = value.state;
        line.append(data);
      });
      body.append(line);
    });
    table.append(head, body);
    const wrap = node('div', undefined, 'table-wrap');
    wrap.append(table);
    root.replaceChildren(wrap);
  }

  global.LearningUI = Object.freeze({
    /* utilities */
    clamp, lerp, round, fmt, seededRandom, announce, theme, motion,
    /* controls */
    bindRange, bindChoice, bindCheckbox,
    /* sequence and questions */
    mountStepper, mountQuestion, mountQuiz, mountPrediction, mountHints,
    mountSelfExplain, mountSortable, mountMatching,
    /* notation and drawing */
    math, svg,
    /* figures */
    renderChart, renderBars, renderGrid
  });
})(window);
