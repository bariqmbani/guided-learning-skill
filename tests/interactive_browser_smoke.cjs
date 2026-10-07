/* Optional browser regression checks. Requires Playwright and its Chromium.
 * node tests/interactive_browser_smoke.cjs
 * LEARNING_PLAYWRIGHT_PATH can name an externally installed Playwright module;
 * LEARNING_BROWSER_EXECUTABLE can select an existing Chromium executable.
 * Runtime/installer users do not need Node or Playwright.
 */
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { execFileSync } = require('node:child_process');
const { chromium } = require(process.env.LEARNING_PLAYWRIGHT_PATH || 'playwright');
const { checkLocalization } = require('./interactive_locale_checks.cjs');
const { checkScenes } = require('./interactive_scene_checks.cjs');
const { checkTemplateMotion } = require('./interactive_template_motion_checks.cjs');
const kit = path.resolve(__dirname, '../SKILLS/learning-interactives');
const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'learning-browser-'));
const python = process.env.LEARNING_PYTHON || 'python3';
const templates = ['parameter-explorer', 'step-sequence', 'comparison', 'probability-lab',
  'decision-scenario', 'practice-set', 'order-steps', 'system-map', 'data-explorer', 'geometry-lab', 'motion-explainer'];
const galleries = ['example-interactive', 'components', 'index'];
const allPages = [...templates, ...galleries];

(async () => {
  let browser;
  try {
    for (const template of templates) {
      execFileSync(python, [path.join(kit, 'scaffold.py'), template, path.join(temporary, template + '.html')]);
    }
    for (const name of galleries) {
      fs.copyFileSync(path.join(kit, name + '.html'), path.join(temporary, name + '.html'));
    }
    execFileSync(python, [path.join(temporary, 'build.py'),
      ...templates.map(name => name + '.source.html'), ...galleries.map(name => name + '.html')]);
    // The static checker must pass on everything before the browser runs.
    execFileSync(python, [path.join(kit, 'verify.py'), '--quiet',
      ...allPages.map(name => path.join(temporary, name + '.html'))], { encoding: 'utf8' });
    // Prove the delivered HTML works after its adjacent assets are removed.
    for (const name of ['interactive.css', 'interactive.js', 'build.py']) fs.unlinkSync(path.join(temporary, name));
    browser = await chromium.launch({ headless: true, ...(process.env.LEARNING_BROWSER_EXECUTABLE ? { executablePath: process.env.LEARNING_BROWSER_EXECUTABLE } : {}) });
    const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, colorScheme: 'light', offline: true });
    const page = await context.newPage();
    const failures = [];
    page.on('pageerror', error => failures.push(error.message));
    page.on('request', request => { if (/^https?:/.test(request.url())) failures.push('Network request: ' + request.url()); });
    const open = name => page.goto(pathToFileURL(path.join(temporary, name + '.html')).href);
    const text = selector => page.locator(selector).innerText();
    const selectSpeed = async value => {
      assert.equal(await page.locator('[data-speed]').isVisible(), true,
        'animation speed must be directly available in the toolbar');
      await page.selectOption('[data-speed]', value);
    };
    const hasOutline = element => {
      const style = getComputedStyle(element);
      return style.outlineStyle !== 'none' && parseFloat(style.outlineWidth) > 0;
    };
    const revealState = element => {
      const style = getComputedStyle(element);
      return { opacity: Number(style.opacity), transform: style.transform };
    };
    const checkPalette = async (target, name) => {
      if (name === 'parameter-explorer') {
        await target.locator('#pin').click();
        await target.locator('#slope').evaluate(input => {
          input.value = '2';
          input.dispatchEvent(new Event('input', { bubbles: true }));
        });
      }
      const failedPairs = await target.evaluate(() => {
        const parse = value => {
          const channels = value.match(/[\d.]+/g).map(Number);
          return [...channels.slice(0, 3), channels[3] ?? 1];
        };
        const over = (front, back) => [...front.slice(0, 3).map((channel, index) =>
          channel * front[3] + back[index] * (1 - front[3])), 1];
        const luminance = color => color.slice(0, 3).map(channel => channel / 255)
          .map(channel => channel <= .04045 ? channel / 12.92 : ((channel + .055) / 1.055) ** 2.4)
          .reduce((sum, channel, index) => sum + channel * [.2126, .7152, .0722][index], 0);
        const failures = [];
        for (const [selector, property, minimum] of [
          ['body, .subtitle, .faint, .hint-count, .btn:not(:disabled)', 'color', 4.5],
          ['.chart-trail, .map-links .edge', 'stroke', 3]
        ]) {
          document.querySelectorAll(selector).forEach(element => {
            if (!element.getClientRects().length) return;
            const chain = [];
            for (let node = element; node; node = node.parentElement) chain.unshift(getComputedStyle(node));
            let background = [255, 255, 255, 1];
            chain.forEach(style => { background = over(parse(style.backgroundColor), background); });
            const foreground = parse(getComputedStyle(element)[property]);
            foreground[3] *= chain.reduce((opacity, style) => opacity * Number(style.opacity), 1);
            const values = [luminance(over(foreground, background)), luminance(background)];
            const ratio = (Math.max(...values) + .05) / (Math.min(...values) + .05);
            if (ratio < minimum) failures.push({ element: element.id || element.className, ratio, minimum });
          });
        }
        return failures;
      });
      assert.deepEqual(failedPairs, [], name + ': rendered palette contrast');
    };
    const range = (id, value) => page.locator('#' + id).evaluate((element, next) => {
      element.value = next;
      element.dispatchEvent(new Event('input', { bubbles: true }));
      element.dispatchEvent(new Event('change', { bubbles: true }));
    }, String(value));
    const question = async value => {
      await page.check(`#warmup input[value="${value}"]`);
      await page.click('#warmup [data-check]');
      assert.equal(await page.locator('#warmup [data-feedback]').isVisible(), true);
      assert.equal(await page.locator('#warmup [data-feedback]').getAttribute('data-tone'), 'correct');
      await page.click('#warmup [data-retry]');
      assert.equal(await page.locator('#warmup input:checked').count(), 0);
    };
    for (const name of allPages) {
      await open(name);
      assert.equal(await page.locator('h1').count(), 1);
      const toggle = page.locator('[data-theme-toggle]');
      assert.equal(await toggle.count(), 1, name + ': missing or duplicate theme toggle');
      assert.equal(await toggle.isVisible(), true, name + ': theme toggle is hidden');
      const originalBackground = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
      await toggle.click();
      const chosenTheme = await page.locator('html').getAttribute('data-theme');
      assert.ok(['dark', 'light'].includes(chosenTheme), name + ': theme choice was not applied');
      assert.notEqual(await page.evaluate(() => getComputedStyle(document.body).backgroundColor), originalBackground, name + ': theme control did not change the page');
      await page.reload();
      assert.equal(await page.locator('html').getAttribute('data-theme'), chosenTheme, name + ': theme choice was lost on reload');
      await toggle.click();
      assert.equal(await page.evaluate(() => getComputedStyle(document.body).backgroundColor), originalBackground, name + ': theme toggle did not restore the other palette');
      const missedPointers = await page.locator('button, input:not([type="hidden"]), select, textarea, summary, a[href], [role="button"]').evaluateAll(elements => elements
        .filter(element => element.getClientRects().length && !element.matches(':disabled') && element.getAttribute('aria-disabled') !== 'true')
        .filter(element => getComputedStyle(element).cursor !== 'pointer')
        .map(element => element.tagName.toLowerCase() + (element.id ? '#' + element.id : '') + (element.getAttribute('type') ? '[' + element.getAttribute('type') + ']' : '')));
      assert.deepEqual(missedPointers, [], name + ': enabled controls without a pointer cursor');
      // Every expression reaches MathML rather than staying as raw TeX.
      const unrendered = await page.locator('[data-math]:not(:has(math)):not(.math-fallback)').count();
      assert.equal(unrendered, 0, name + ': unrendered data-math');
      for (const width of [1280, 375, 320]) {
        await page.setViewportSize({ width, height: 900 });
        await page.waitForTimeout(60); // Let ResizeObserver update chart coordinates.
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), true, name + ': horizontal overflow at ' + width);
      }
      await page.setViewportSize({ width: 1280, height: 900 });
    }

    await open('components');
    // Reproduce partial rows (4/7/10 choices in three columns), including
    // narrower containers and RTL. The final choice must not grow to a full row.
    const segmentedIssues = await page.evaluate(() => {
      const issues = [];
      for (const source of document.querySelectorAll('#controls .three-col .segmented')) {
        const group = source.cloneNode(true);
        group.querySelectorAll('input').forEach(input => { input.name += '-layout-probe'; });
        document.querySelector('main').append(group);
        try {
          for (const width of [160, 240, 360, 500]) {
            group.style.width = width + 'px';
            for (const direction of ['ltr', 'rtl']) {
              group.dir = direction;
              const bounds = group.getBoundingClientRect();
              const labels = [...group.querySelectorAll(':scope > label')];
              const firstWidth = labels[0].getBoundingClientRect().width;
              labels.forEach(label => {
                const rect = label.getBoundingClientRect();
                if (Math.abs(rect.width - firstWidth) > 1 || rect.height < 44 ||
                    rect.left < bounds.left || rect.right > bounds.right ||
                    rect.top < bounds.top || rect.bottom > bounds.bottom ||
                    label.scrollWidth > label.clientWidth || label.scrollHeight > label.clientHeight) {
                  issues.push(labels.length + ' choices, ' + width + 'px, ' + direction + ': ' + label.textContent.trim());
                }
              });
            }
          }
        } finally { group.remove(); }
      }
      return issues;
    });
    assert.deepEqual(segmentedIssues, [], 'segmented choices stretch or clip');
    for (const [name, count] of [['Four seasons', 4], ['Seven days', 7], ['Ten learning steps', 10]]) {
      const group = page.getByRole('radiogroup', { name, exact: true });
      const options = group.getByRole('radio');
      assert.equal(await options.count(), count);
      await options.first().focus();
      await page.keyboard.press('ArrowRight');
      assert.equal(await options.nth(1).isChecked(), true);
      assert.equal(await options.nth(1).locator('..').evaluate(hasOutline), true, 'segmented keyboard focus is hidden');
      await options.last().check();
      assert.equal(await group.locator('input:checked').count(), 1);
    }

    // Matching feedback must identify each result without relying on color.
    // Reused pair IDs in separate activities must keep descriptions isolated.
    await page.evaluate(() => {
      window.matchingChecks = [];
      for (const id of ['matching-one', 'matching-two']) {
        const root = document.createElement('section');
        root.id = id;
        root.innerHTML = '<div class="match-grid" data-matching></div><button type="button" data-check>Check matches</button><p class="feedback" data-feedback></p>';
        document.querySelector('main').append(root);
        window.matchingChecks.push(LearningUI.mountMatching(root, { pairs: [
          { id: 'mean', term: 'Mean', match: 'Uses every value' },
          { id: 'median', term: 'Median', match: 'Uses position' }
        ] }));
      }
    });
    const firstMatches = page.locator('#matching-one');
    const secondMatches = page.locator('#matching-two');
    const visibleVerdicts = root => root.locator('.match-verdict:not([hidden])').allTextContents();
    assert.deepEqual(await visibleVerdicts(firstMatches), []);
    assert.equal(await page.locator('.match-grid').evaluateAll(grids => {
      const ids = grids.flatMap(grid => [...grid.querySelectorAll('[id]')].map(element => element.id));
      return ids.length === new Set(ids).size && grids.every(grid => [...grid.querySelectorAll('select')].every(select =>
        select.closest('.match-row').contains(document.getElementById(select.getAttribute('aria-describedby')))));
    }), true, 'matching feedback descriptions cross between activities');
    await firstMatches.getByRole('combobox', { name: 'Match for Mean', exact: true }).selectOption('Uses every value');
    await firstMatches.getByRole('combobox', { name: 'Match for Median', exact: true }).selectOption('Uses every value');
    await firstMatches.locator('[data-check]').click();
    assert.deepEqual(await visibleVerdicts(firstMatches), ['Correct', 'Try again']);
    assert.match(await firstMatches.locator('[data-feedback]').innerText(), /1 of 2 are right/);
    assert.deepEqual(await visibleVerdicts(secondMatches), []);
    await secondMatches.getByRole('combobox', { name: 'Match for Mean', exact: true }).selectOption('Uses every value');
    await secondMatches.getByRole('combobox', { name: 'Match for Median', exact: true }).selectOption('Uses position');
    // Sample immediately so a fast machine cannot finish the entrance first.
    const matchingReveal = await secondMatches.evaluate(root => {
      const button = root.querySelector('[data-check]');
      button.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
      button.click();
      const style = getComputedStyle(root.querySelector('[data-feedback]'));
      return { opacity: Number(style.opacity), transform: style.transform };
    });
    assert.ok(matchingReveal.opacity < 1, 'pointer matching feedback has no reveal');
    assert.notEqual(matchingReveal.transform, 'none');
    // A key press must settle a pointer reveal even before its queued frames run.
    await page.keyboard.press('Shift');
    assert.deepEqual(await secondMatches.locator('[data-feedback]').evaluate(revealState), { opacity: 1, transform: 'none' });
    const interruptedCues = await secondMatches.locator('[data-feedback]').evaluate(element => {
      return ['enter', 'mark'].map(cue => {
        document.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
        LearningUI.motion[cue](element);
        getComputedStyle(element).opacity;
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Shift', bubbles: true }));
        getComputedStyle(element).opacity;
        document.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
        const style = getComputedStyle(element);
        return { opacity: Number(style.opacity), transform: style.transform, animations: element.getAnimations().length };
      });
    });
    assert.deepEqual(interruptedCues, Array(2).fill({ opacity: 1, transform: 'none', animations: 0 }), 'returning to a pointer revives an interrupted cue');
    assert.deepEqual(await visibleVerdicts(secondMatches), ['Correct', 'Correct']);
    await firstMatches.getByRole('combobox', { name: 'Match for Median', exact: true }).selectOption('Uses position');
    assert.deepEqual(await visibleVerdicts(firstMatches), ['Correct']);
    assert.equal(await firstMatches.locator('[data-feedback]').innerText(), '');
    assert.equal(await firstMatches.locator('[data-feedback]').getAttribute('data-tone'), null);
    await firstMatches.locator('[data-check]').click();
    assert.deepEqual(await visibleVerdicts(firstMatches), ['Correct', 'Correct']);
    await page.evaluate(() => window.matchingChecks[0].reset());
    assert.deepEqual(await firstMatches.locator('select').evaluateAll(selects => selects.map(select => select.value)), ['', '']);
    assert.deepEqual(await firstMatches.locator('.match-verdict').allTextContents(), ['', '']);
    assert.deepEqual(await visibleVerdicts(firstMatches), []);
    assert.equal(await firstMatches.locator('[data-verdict]').count(), 0);
    assert.equal(await firstMatches.locator('[data-feedback]').innerText(), '');
    assert.deepEqual(await visibleVerdicts(secondMatches), ['Correct', 'Correct']);

    await open('parameter-explorer');
    // A pointer does not create the keyboard ring, including while held down.
    const chart = page.locator('#line-chart svg');
    await chart.scrollIntoViewIfNeeded();
    await chart.hover();
    await page.mouse.down();
    assert.equal(await chart.evaluate(hasOutline), false, 'chart shows a pointer outline');
    await page.mouse.up();
    await page.keyboard.press('Tab');
    await page.keyboard.press('Shift+Tab');
    assert.equal(await chart.evaluate(element => element === document.activeElement), true);
    assert.equal(await chart.evaluate(hasOutline), true, 'chart lost its keyboard focus ring');
    await question('up-two');
    await page.locator('#slope').focus();
    await page.keyboard.press('ArrowRight');
    assert.equal(await page.locator('#slope').inputValue(), '1.5');
    assert.equal(await text('#at-two'), '4');
    await range('slope', -3); await range('intercept', 4);
    assert.equal(await text('#at-two'), '\u22122'); // a typographic minus, matching the equation
    assert.equal(await page.locator('#line-chart table tbody tr').count(), 10);
    await page.locator('#line-chart summary').click();
    await page.setViewportSize({ width: 375, height: 900 });
    await page.waitForTimeout(80);
    assert.equal(await page.locator('#line-chart details').getAttribute('open'), '');
    // A pinned line stays on the chart as a baseline for comparison.
    await page.click('#pin');
    assert.equal(await page.locator('.chart-legend li').count(), 3);
    await page.click('#reset');
    assert.equal(await text('#at-two'), '3');
    assert.equal(await page.locator('.chart-legend li').count(), 2);
    // The chart cursor is reachable from the keyboard and reports values.
    await page.locator('#line-chart svg').focus();
    await page.keyboard.press('ArrowRight');
    assert.match(await text('#line-chart .chart-readout'), /Input x/);

    await open('comparison');
    await question('equal');
    assert.equal(await text('#compound-total'), '259.37');
    await range('rounds', 1);
    assert.equal(await text('#simple-total'), '110.00');
    assert.equal(await text('#compound-total'), '110.00');
    await range('initial', 200); await range('rate', 20); await range('rounds', 20);
    assert.equal(await text('#compound-total'), '7,667.52');
    await page.setViewportSize({ width: 320, height: 900 });
    await page.waitForTimeout(80);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), true);
    await range('rate', 0);
    assert.equal(await text('#compound-total'), '200.00');
    await page.click('#reset');
    assert.equal(await text('#compound-total'), '259.37');

    await open('step-sequence');
    await question('right');
    assert.equal(await page.locator('[data-back]').isDisabled(), true);
    await page.click('[data-next]');
    assert.equal(await text('#mid'), '—', 'the midpoint readout commits when its value arrives');
    await page.waitForTimeout(250);
    const transfer = await page.evaluate(() => {
      const center = selector => { const r = document.querySelector(selector).getBoundingClientRect(); return (r.top + r.bottom) / 2; };
      return { from: center('#items li:nth-child(4) strong'), current: center('#search-copy'), to: center('#comparison-value') };
    });
    assert.ok(transfer.current > transfer.from + 1 && transfer.current < transfer.to - 1,
      'midpoint value must visibly travel from the array into the comparison');
    await page.click('[data-back]');
    await page.waitForTimeout(250);
    const reverseTransfer = await page.evaluate(() => {
      const center = selector => { const r = document.querySelector(selector).getBoundingClientRect(); return (r.top + r.bottom) / 2; };
      return { from: center('#comparison-value'), current: center('#search-copy'), to: center('#items li:nth-child(4) strong') };
    });
    assert.ok(reverseTransfer.current > reverseTransfer.to + 1 && reverseTransfer.current < reverseTransfer.from - 1,
      'Back must visibly return the comparison value to its source');
    assert.equal(await text('#mid'), '3', 'the outgoing checkpoint remains readable during reversal');
    await page.click('[data-play]');
    await page.waitForTimeout(40); // Let the WAAPI pause settle before comparing poses.
    const reversePaused = await page.locator('#search-copy').evaluate(element => getComputedStyle(element).transform);
    await page.waitForTimeout(100);
    assert.equal(await page.locator('#search-copy').evaluate(element => getComputedStyle(element).transform), reversePaused,
      'Pause must freeze the reverse transfer');
    await selectSpeed('2');
    await page.click('[data-play]');
    await page.waitForFunction(() => document.querySelector('[data-play]').textContent === 'Play');
    assert.equal(await text('#mid'), '—');
    for (let i = 0; i < 6; i += 1) await page.click('[data-next]');
    assert.equal(await text('#step-title'), 'Return index 4');
    assert.equal(await page.locator('[data-next]').isDisabled(), true);
    await page.waitForFunction(() => document.querySelector('[data-play]').textContent === 'Replay');
    await selectSpeed('2');
    await page.click('[data-play]');
    await page.waitForFunction(() => document.querySelector('[data-play]').textContent === 'Replay', null, { timeout: 10000 });
    assert.equal(await page.locator('[data-play]').getAttribute('aria-pressed'), 'false');
    await page.click('[data-reset]');

    // A newly reduced-motion preference pauses playback without locking Play.
    await selectSpeed('2');
    await page.click('[data-play]');
    await page.waitForFunction(() => document.querySelector('[data-scrub]').value === '1');
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.waitForFunction(() => document.querySelector('[data-play]').getAttribute('aria-pressed') === 'false');
    assert.equal(await page.locator('[data-play]').isDisabled(), false);
    assert.equal(await page.locator('.motion-note').isVisible(), false, 'scene preference must not be mislabeled by the OS preference');
    const preferencePause = await text('[data-position]');
    await page.waitForTimeout(900);
    assert.equal(await text('[data-position]'), preferencePause, 'preference change left a playback timer running');
    await page.click('[data-play]');
    await page.waitForFunction(() => document.querySelector('[data-scrub]').value === '2');
    await page.click('[data-play]');
    assert.equal(await page.locator('[data-play]').getAttribute('aria-pressed'), 'false');
    const manualPause = await text('[data-position]');
    await page.waitForTimeout(900);
    assert.equal(await text('[data-position]'), manualPause, 'Pause did not stop reduced-motion playback');
    await page.click('[data-back]');
    assert.equal(await page.locator('[data-scrub]').inputValue(), '1');
    await page.click('[data-next]');
    assert.equal(await page.locator('[data-scrub]').inputValue(), '2');
    await page.locator('[data-play]').press('End');
    assert.equal(await text('#step-title'), 'Return index 4');
    await page.locator('[data-play]').press('Home');
    assert.equal(await page.locator('[data-scrub]').inputValue(), '0');
    await range('scrub', 3);
    assert.equal(await page.locator('[data-scrub]').inputValue(), '3');
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.waitForFunction(() => document.querySelector('.motion-note').hidden);
    assert.equal(await page.locator('[data-play]').getAttribute('aria-pressed'), 'false');

    // Loading with reduced motion preserves deliberate Play, finite end, and replay.
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await open('step-sequence');
    assert.equal(await page.locator('[data-play]').isDisabled(), false);
    assert.equal(await page.locator('.motion-note').isVisible(), false);
    assert.equal(await page.locator('[data-motion]').isChecked(), true, 'scene animation must start enabled');
    assert.equal(await page.locator('[data-play]').evaluate(button => getComputedStyle(button).transitionDuration), '0s', 'Play availability bypassed reduced-motion CSS');
    await page.waitForTimeout(1700);
    assert.equal(await text('[data-position]'), 'Step 1 of 7', 'reduced-motion trace started on load');
    assert.equal(await page.locator('[data-play]').getAttribute('aria-pressed'), 'false');
    await selectSpeed('2');
    await page.click('[data-play]');
    assert.equal(await page.locator('[data-play]').getAttribute('aria-pressed'), 'true');
    await page.waitForFunction(() => document.querySelector('[data-play]').textContent === 'Replay', null, { timeout: 10000 });
    assert.equal(await text('#step-title'), 'Return index 4');
    assert.equal(await text('[data-play]'), 'Replay');
    assert.equal(await page.locator('[data-play]').getAttribute('aria-pressed'), 'false');
    await page.waitForTimeout(900);
    assert.equal(await text('[data-position]'), 'Step 7 of 7', 'reduced-motion playback looped after the last state');
    await page.click('[data-play]');
    assert.equal(await text('[data-position]'), 'Step 1 of 7');
    assert.equal(await page.locator('[data-play]').getAttribute('aria-pressed'), 'true');

    // Hidden tabs still pause and cannot start, even through a programmatic click.
    await page.evaluate(() => {
      Object.defineProperty(document, 'hidden', { configurable: true, value: true });
      document.dispatchEvent(new Event('visibilitychange'));
      document.querySelector('[data-play]').click();
    });
    assert.equal(await page.locator('[data-play]').getAttribute('aria-pressed'), 'false');
    await page.waitForTimeout(900);
    assert.equal(await text('[data-position]'), 'Step 1 of 7');
    await page.evaluate(() => {
      delete document.hidden;
      document.dispatchEvent(new Event('visibilitychange'));
    });
    assert.equal(await page.locator('[data-play]').getAttribute('aria-pressed'), 'false');
    await page.click('[data-play]');
    await page.click('[data-reset]');
    await page.waitForTimeout(1700);
    assert.equal(await text('[data-position]'), 'Step 1 of 7', 'Reset did not cancel reduced-motion playback');
    assert.equal(await page.locator('[data-play]').getAttribute('aria-pressed'), 'false');

    // One-state traces have nothing to play under either motion preference.
    await page.evaluate(() => {
      const root = document.createElement('section');
      root.id = 'single-state';
      root.innerHTML = '<button data-back>Back</button><button data-next>Next</button><button data-play>Play</button><button data-reset>Reset</button><p data-position></p>';
      document.querySelector('main').append(root);
      LearningUI.mountStepper(root, { count: 1, render() {} });
      root.querySelector('[data-play]').dispatchEvent(new MouseEvent('click'));
    });
    assert.equal(await page.locator('#single-state [data-play]').isDisabled(), true);
    assert.equal(await page.locator('#single-state [data-play]').getAttribute('aria-pressed'), 'false');
    assert.equal(await page.locator('#single-state .motion-note').isVisible(), false);
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.waitForFunction(() => document.querySelector('#single-state .motion-note').hidden);
    assert.equal(await page.locator('#single-state [data-play]').isDisabled(), true);

    await open('probability-lab');
    await question('no');
    await page.click('#toss-ten');
    assert.equal(await text('#toss-count'), '10');
    const first = await text('#history');
    const heads = await text('#heads-count');
    await page.click('#replay'); await page.click('#toss-ten');
    assert.equal(await text('#history'), first);
    assert.equal(await text('#heads-count'), heads);
    await range('chance', 100);
    assert.equal(await text('#toss-count'), '10'); // Pending settings do not rewrite history.
    await page.click('#settings button[type="submit"]');
    await page.click('#toss-ten');
    assert.equal(await text('#heads-count'), '10');
    await range('chance', 0); await page.click('#settings button[type="submit"]');
    for (let i = 0; i < 20; i += 1) await page.click('#toss-ten');
    assert.equal(await text('#toss-count'), '200');
    assert.equal(await text('#heads-count'), '0');
    assert.equal(await page.locator('#toss-one').isDisabled(), true);
    assert.equal(await page.locator('#toss-ten').isDisabled(), true);
    await page.click('#reset');
    assert.equal(await text('#toss-count'), '0');
    assert.equal(await page.locator('#chance').inputValue(), '50');
    assert.equal(await page.locator('#seed').inputValue(), '42');

    await open('decision-scenario');
    await question('no');
    for (let i = 0; i < 2; i += 1) {
      await page.check('#decision input[value="0"]');
      await page.click('#decision button[type="submit"]');
    }
    assert.equal(await text('#scenario-title'), 'A supported repair, with a clear boundary');
    assert.equal(await page.locator('#decision').isVisible(), false);
    assert.equal(await page.locator('#history li').count(), 2);
    assert.equal(await page.locator('#last-consequence.motion-enter, #ending.motion-enter').count(), 2);
    assert.equal(await page.locator('#scenario-title').evaluate(element => element === document.activeElement), true);
    await page.click('#another-path');
    assert.equal(await page.locator('#history li').count(), 0);
    assert.equal(await page.locator('#decision').isVisible(), true);
    // A less useful choice remains recoverable; feedback is a consequence, not a score.
    await page.check('#decision input[value="1"]');
    await page.click('#decision button[type="submit"]');
    await page.check('#decision input[value="1"]');
    await page.click('#decision button[type="submit"]');
    assert.equal(await text('#scenario-title'), 'The stopping rule was too weak');
    await page.click('#reset');
    assert.equal(await page.locator('#last-consequence').isVisible(), false);
    assert.equal(await page.locator('#ending').isVisible(), false);
    await page.check('#decision input[value="0"]');
    await page.locator('#decision button[type="submit"]').focus();
    await page.keyboard.press('Enter');
    assert.deepEqual(await page.locator('#last-consequence').evaluate(revealState), { opacity: 1, transform: 'none' });

    await open('practice-set');
    for (const width of [1280, 375, 320]) {
      await page.setViewportSize({ width, height: 900 });
      const rows = await page.locator('[data-quiz-choices] > label').evaluateAll(labels => labels.map(label => {
        const rect = label.getBoundingClientRect();
        return { top: rect.top, bottom: rect.bottom, left: rect.left };
      }));
      assert.ok(rows.length > 1);
      rows.slice(1).forEach((row, index) => {
        assert.ok(row.top >= rows[index].bottom - 1, 'quiz answers share a row at ' + width);
        assert.ok(Math.abs(row.left - rows[0].left) < 1, 'quiz answers are misaligned at ' + width);
      });
    }
    await page.setViewportSize({ width: 1280, height: 900 });
    const hintAlignment = await page.locator('[data-hints]').evaluate(root => {
      const button = root.querySelector('[data-hint-next]').getBoundingClientRect();
      const count = root.querySelector('[data-hint-count]').getBoundingClientRect();
      return Math.abs((button.top + button.bottom) / 2 - (count.top + count.bottom) / 2);
    });
    assert.ok(hintAlignment < 2, 'hint count is not vertically centered');
    const quizNext = async value => {
      await page.check(`#quiz input[value="${value}"]`);
      await page.click('#quiz [data-check]');
      await page.click('#quiz [data-next]');
    };
    await quizNext('median'); await quizNext('mean'); await quizNext('mean'); await quizNext('max');
    assert.match(await text('[data-quiz-summary]'), /4 of 4 correctly on the first attempt/);
    await page.click('[data-hint-next]');
    assert.equal(await page.locator('[data-hint-list] li').count(), 1);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.click('[data-hint-next]');
    assert.equal(await page.locator('[data-hint-list] li').count(), 2);
    assert.equal(await page.locator('[data-hint-list] li').last().isVisible(), true);
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(() => requestAnimationFrame(resolve)))));
    const movingHint = await page.locator('[data-hint-list] li').last().evaluate(element => element.getAnimations().some(animation =>
      animation.effect.getKeyframes().some(frame => frame.transform && frame.transform !== 'none')));
    assert.equal(movingHint, false, 'reduced-motion hint still moves');
    // Keyboard reveals must not delay the reading position with an entrance.
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.locator('[data-hint-next]').focus();
    await page.keyboard.press('Enter');
    assert.equal(await page.locator('[data-hint-list] li').last().evaluate(element => element.getAnimations().length), 0, 'keyboard hint reveal is animated');
    await page.fill('#answer', 'The mean adds every value, so one long ticket lifts it above a typical one.');
    await page.click('#self-explain [data-check]');
    assert.equal(await page.locator('#self-explain [data-reference]').isVisible(), true);

    await open('order-steps');
    const order = ['divide', 'simplify', 'subtract', 'solution', 'check'];
    for (let target = 0; target < order.length; target += 1) {
      for (;;) {
        const ids = await page.locator('[data-sortable] li').evaluateAll(items => items.map(item => item.dataset.id));
        if (ids[target] === order[target]) break;
        const from = ids.indexOf(order[target]);
        await page.locator(`[data-sortable] li[data-id="${order[target]}"] [data-up]`).click();
        assert.ok(from > target, 'ordering did not converge');
      }
    }
    const orderingReveal = await page.locator('#ordering [data-check]').evaluate(button => {
      button.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
      button.click();
      return ['#ordering [data-feedback]', '#worked'].map(selector => {
        const style = getComputedStyle(document.querySelector(selector));
        return { opacity: Number(style.opacity), transform: style.transform };
      });
    });
    orderingReveal.forEach(state => {
      assert.ok(state.opacity < 1, 'pointer ordering result has no reveal');
      assert.notEqual(state.transform, 'none');
    });
    assert.match(await text('#ordering [data-feedback]'), /Every step is in place/);
    assert.equal(await page.locator('#worked').isVisible(), true);
    await page.waitForFunction(() => getComputedStyle(document.querySelector('#worked')).opacity === '1');
    await page.click('#ordering [data-check]');
    assert.deepEqual(await page.locator('#worked').evaluate(revealState), { opacity: 1, transform: 'none' }, 'rechecking replays an already visible worked answer');

    // Native disclosures must reverse smoothly without delaying keyboard use.
    const disclosure = page.locator('details').first();
    const disclosureState = element => {
      const style = getComputedStyle(element, '::details-content');
      return { height: parseFloat(style.height), opacity: Number(style.opacity), visibility: style.contentVisibility };
    };
    const nativeDisclosureMotion = await page.evaluate(() => CSS.supports('selector(details::details-content)') &&
      CSS.supports('interpolate-size: allow-keywords') && CSS.supports('transition-behavior: allow-discrete'));
    await disclosure.locator('summary').focus();
    await page.keyboard.press('Enter');
    assert.equal(await disclosure.getAttribute('open'), '');
    if (nativeDisclosureMotion) {
      const expanded = await disclosure.evaluate(disclosureState);
      assert.ok(expanded.height > 0);
      assert.equal(expanded.opacity, 1, 'keyboard disclosure fades');
      await page.keyboard.press('Enter');
      assert.equal((await disclosure.evaluate(disclosureState)).height, 0);
      // Slow only this test instance to inspect intermediate and reversed frames.
      await disclosure.evaluate(element => element.style.setProperty('--motion-disclosure', '1000ms'));
      await disclosure.locator('summary').click();
      await page.waitForTimeout(50);
      const opening = await disclosure.evaluate(disclosureState);
      assert.ok(opening.height > 0 && opening.height < expanded.height, 'disclosure snaps open');
      await disclosure.locator('summary').evaluate(summary => summary.click());
      const reversing = await disclosure.evaluate(disclosureState);
      assert.ok(reversing.height > 0 && reversing.height < expanded.height, 'closing jumps to an endpoint');
      await disclosure.locator('summary').evaluate(summary => summary.click());
      await page.keyboard.press('Shift');
      assert.deepEqual(await disclosure.evaluate(disclosureState), expanded, 'keyboard interruption does not settle disclosure');
      await page.keyboard.press('Enter');
      assert.equal((await disclosure.evaluate(disclosureState)).visibility, 'hidden');
      await disclosure.evaluate(element => element.style.removeProperty('--motion-disclosure'));
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await disclosure.locator('summary').evaluate(summary => {
        summary.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
        summary.click();
      });
      // Native details applies content visibility at paint, after the first RAF.
      await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
      const reduced = await disclosure.evaluate(disclosureState);
      assert.equal(reduced.height, expanded.height, 'reduced-motion disclosure changes height gradually');
      assert.ok(reduced.opacity >= .85 && reduced.opacity <= 1);
      assert.equal(await disclosure.evaluate(element => getComputedStyle(element, '::details-content').transitionProperty.includes('height')), false);
      await page.emulateMedia({ reducedMotion: 'no-preference' });
    }

    await open('system-map');
    const compileNode = page.locator('.map-node[data-id="compile"]');
    await compileNode.click();
    assert.match(await text('#map-desc'), /Waits for Checkout/);
    const assertNodeBounds = async () => {
      const overlayHeight = await page.locator('.map-links').evaluate(svg => ({
        scene: svg.parentElement.getBoundingClientRect().height, overlay: svg.getBoundingClientRect().height
      }));
      assert.ok(Math.abs(overlayHeight.scene - overlayHeight.overlay) < 1, 'shared SVG defaults clipped the dependency overlay');
      const clipped = await page.locator('.map-node').evaluateAll(nodes => nodes.flatMap(node => {
        const rect = node.getBoundingClientRect();
        return [...node.querySelectorAll('strong, .node-status')].filter(text => {
          const bounds = text.getBoundingClientRect();
          return bounds.left < rect.left - 1 || bounds.top < rect.top - 1 || bounds.right > rect.right + 1 || bounds.bottom > rect.bottom + 1;
        }).map(text => node.dataset.id + ': ' + text.textContent);
      }));
      assert.deepEqual(clipped, [], 'map text escapes its node');
    };
    for (const width of [1280, 375, 320]) {
      await page.setViewportSize({ width, height: 900 });
      await assertNodeBounds();
    }
    await page.setViewportSize({ width: 1280, height: 900 });
    await compileNode.hover();
    await page.mouse.down();
    assert.equal(await compileNode.evaluate(hasOutline), false, 'map node shows a pointer outline');
    await page.mouse.up();
    assert.match(await text('#map-desc'), /Waits for Checkout/);
    assert.equal(await page.locator('.map-node[data-role="downstream"]').count(), 3);
    await assertNodeBounds();
    await page.keyboard.press('Tab');
    await page.keyboard.press('Shift+Tab');
    assert.equal(await compileNode.evaluate(element => element === document.activeElement && element.matches(':focus-visible')), true, 'map node lost keyboard focus');
    assert.equal(await compileNode.evaluate(hasOutline), true, 'map node keyboard focus ring is hidden');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Enter');
    assert.equal(await compileNode.getAttribute('aria-pressed'), 'false');
    await page.keyboard.press('Shift+Tab');
    await page.keyboard.press('Enter');
    assert.equal(await compileNode.getAttribute('aria-pressed'), 'true');
    // Clicking the same keyboard-focused node must switch focus appearance too.
    await compileNode.hover();
    await page.mouse.down();
    assert.equal(await compileNode.evaluate(hasOutline), false);
    await page.mouse.up();
    await page.click('[data-next]');
    await page.click('[data-next]');
    const testNode = page.locator('.map-node[data-id="test"]');
    await page.waitForFunction(() => document.querySelector('.map-node[data-id="test"]').dataset.state === 'blocked');
    await page.click('[data-back]');
    await page.waitForTimeout(220);
    assert.match(await text('#flow-title'), /^Rewind: Unit tests → Compile/);
    assert.equal(await testNode.getAttribute('data-state'), 'blocked', 'reverse transfer retains the outgoing state until arrival');
    const reverseDependency = await page.evaluate(() => {
      const center = element => { const rect = element.getBoundingClientRect(); return rect.left + rect.width / 2; };
      const pulse = [...document.querySelectorAll('.pipeline-pulse')].find(element => Number(getComputedStyle(element).opacity) > .5);
      return {
        current: pulse ? center(pulse) : null,
        from: center(document.querySelector('.map-node[data-id="test"] [data-side="left"]')),
        to: center(document.querySelector('.map-node[data-id="compile"] [data-side="right"]'))
      };
    });
    assert.ok(reverseDependency.current !== null && reverseDependency.current > reverseDependency.to + 1 && reverseDependency.current < reverseDependency.from - 1,
      'Back retraces the dependency from its destination toward its source');
    await page.waitForFunction(() => document.querySelector('.map-node[data-id="test"]').dataset.state === 'idle');
    assert.equal(await testNode.locator('.node-status').innerText(), 'Depends on it');
    assert.equal(await text('#flow-title'), 'Compile fails');
    await page.click('[data-reset]');
    assert.equal(await compileNode.locator('.node-status').innerText(), 'Selected');

    await open('data-explorer');
    assert.match(await text('#observation'), /treatment B leads/);
    await range('severe-share', 50);
    assert.match(await text('#observation'), /treatment A leads/);
    await page.click('#grouping input[value="severity"]');
    assert.equal(await page.locator('#rate-bars .bar-row').count(), 4);

    await open('geometry-lab');
    assert.equal(await text('#area-c'), '25');
    await range('leg-a', 6); await range('leg-b', 8);
    assert.equal(await text('#area-c'), '100');
    assert.match(await text('#observation'), /hypotenuse is exactly 10/);
    await page.click('#reset');
    assert.equal(await text('#area-c'), '25');

    await open('example-interactive');
    await range('threshold', 100);
    assert.equal(await text('#precision'), 'N/A');
    assert.equal(await text('#recall'), '0%');
    assert.equal(await text('#fn'), '20');
    await range('threshold', 0);
    assert.equal(await text('#precision'), '50%');
    assert.equal(await text('#recall'), '100%');
    await page.click('#reset');
    assert.equal(await text('#tp'), '15');
    assert.equal(await text('#fp'), '4');
    assert.deepEqual(failures, []);
    await checkTemplateMotion({ page, open });
    assert.deepEqual(failures, [], 'template motion checks emitted browser errors');
    await context.close();

    // Follow the OS until the learner makes a choice, then retain that choice.
    for (const name of allPages) {
      // Separate storage prevents an earlier page's manual choice from
      // overriding the system preference on this page's first visit.
      const darkContext = await browser.newContext({ colorScheme: 'dark', offline: true });
      const darkPage = await darkContext.newPage();
      darkPage.on('pageerror', error => failures.push(error.message));
      await darkPage.goto(pathToFileURL(path.join(temporary, name + '.html')).href);
      const darkBackground = await darkPage.evaluate(() => getComputedStyle(document.body).backgroundColor);
      await checkPalette(darkPage, name);
      await darkPage.emulateMedia({ colorScheme: 'light' });
      await darkPage.waitForFunction(previous => getComputedStyle(document.body).backgroundColor !== previous, darkBackground);
      const lightBackground = await darkPage.evaluate(() => getComputedStyle(document.body).backgroundColor);
      await darkPage.locator('[data-theme-toggle]').click();
      assert.equal(await darkPage.locator('html').getAttribute('data-theme'), 'dark');
      await darkPage.emulateMedia({ colorScheme: 'dark' });
      await darkPage.emulateMedia({ colorScheme: 'light' });
      assert.equal(await darkPage.evaluate(() => getComputedStyle(document.body).backgroundColor), darkBackground, name + ': OS replaced the manual theme');
      await darkPage.reload();
      assert.equal(await darkPage.evaluate(() => getComputedStyle(document.body).backgroundColor), darkBackground, name + ': stored dark theme was lost');
      await darkPage.locator('[data-theme-toggle]').click();
      assert.equal(await darkPage.evaluate(() => getComputedStyle(document.body).backgroundColor), lightBackground, name + ': manual light theme did not apply');
      await darkPage.emulateMedia({ colorScheme: 'dark' });
      assert.equal(await darkPage.evaluate(() => getComputedStyle(document.body).backgroundColor), lightBackground, name + ': OS replaced the manual light theme');
      await checkPalette(darkPage, name);
      await darkContext.close();
    }

    // Private/restricted browser storage must not break lessons or their toggle.
    const restricted = await browser.newContext({ colorScheme: 'light', offline: true });
    await restricted.addInitScript(() => Object.defineProperty(window, 'localStorage', {
      get() { throw new DOMException('Storage is unavailable', 'SecurityError'); }
    }));
    const restrictedPage = await restricted.newPage();
    const restrictedErrors = [];
    restrictedPage.on('pageerror', error => restrictedErrors.push(error.message));
    await restrictedPage.goto(pathToFileURL(path.join(temporary, 'parameter-explorer.html')).href);
    await restrictedPage.locator('[data-theme-toggle]').click();
    assert.equal(await restrictedPage.locator('html').getAttribute('data-theme'), 'dark');
    await restrictedPage.locator('#slope').evaluate(element => {
      element.value = '2';
      element.dispatchEvent(new Event('input', { bubbles: true }));
    });
    assert.equal(await restrictedPage.locator('#at-two').innerText(), '5');
    assert.deepEqual(restrictedErrors, []);
    await restricted.close();
    assert.deepEqual(failures, []);

    const staticPage = await browser.newPage({ javaScriptEnabled: false });
    for (const name of [...templates, 'example-interactive']) {
      await staticPage.goto(pathToFileURL(path.join(temporary, name + '.html')).href);
      assert.equal(await staticPage.locator('noscript').isVisible(), true, name + ': missing static fallback');
      const summary = staticPage.locator('details > summary').first();
      if (await summary.count()) {
        await summary.click();
        assert.equal(await summary.locator('..').getAttribute('open'), '', name + ': no-JS disclosure cannot open');
        await summary.press('Enter');
        assert.equal(await summary.locator('..').getAttribute('open'), null, name + ': no-JS disclosure cannot close');
      }
    }
    await checkLocalization(browser);
    await checkScenes({ browser });
    console.log('PASS: 14 standalone pages offline; static checks, MathML notation, desktop/mobile, pointer and keyboard focus, segmented choices, matching verdicts and isolated descriptions, chart cursor, models, reset/retry, playback/reduced motion, explanatory scenes, interrupted reveals and native disclosures, quiz layout, map bounds, seeded replay, branches, ordering, theme controls and persistence, restricted storage, no-JS fallbacks, and localized runtime controls/feedback.');
  } finally {
    if (browser) await browser.close();
    fs.rmSync(temporary, { recursive: true, force: true });
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
