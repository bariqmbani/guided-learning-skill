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
const kit = path.resolve(__dirname, '../SKILLS/guided-learning/interactives');
const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'learning-browser-'));
const python = process.env.LEARNING_PYTHON || 'python3';
const templates = ['parameter-explorer', 'step-sequence', 'comparison', 'probability-lab',
  'decision-scenario', 'practice-set', 'order-steps', 'system-map', 'data-explorer', 'geometry-lab'];
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
    execFileSync(python, [path.join(temporary, 'build.py'), ...galleries.map(name => name + '.html')]);
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
    const hasOutline = element => {
      const style = getComputedStyle(element);
      return style.outlineStyle !== 'none' && parseFloat(style.outlineWidth) > 0;
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
    assert.equal(await text('#mid'), '3');
    await page.click('[data-back]');
    assert.equal(await text('#mid'), '-');
    for (let i = 0; i < 6; i += 1) await page.click('[data-next]');
    assert.equal(await text('#step-title'), 'Return index 4');
    assert.equal(await page.locator('[data-next]').isDisabled(), true);
    await page.selectOption('[data-speed]', '2');
    await page.click('[data-play]');
    await page.waitForFunction(() => document.querySelector('[data-next]').disabled, null, { timeout: 8000 });
    assert.equal(await page.locator('[data-play]').getAttribute('aria-pressed'), 'false');
    await page.click('[data-reset]');
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.waitForFunction(() => document.querySelector('[data-play]').disabled, null, { timeout: 2000 });
    assert.equal(await page.locator('[data-play]').isDisabled(), true);
    await page.click('[data-next]');
    assert.equal(await text('#mid'), '3');
    await page.emulateMedia({ reducedMotion: 'no-preference' });

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
    await page.click('#ordering [data-check]');
    assert.match(await text('#ordering [data-feedback]'), /Every step is in place/);
    assert.equal(await page.locator('#worked').isVisible(), true);

    await open('system-map');
    const assertNodeBounds = async () => {
      const clipped = await page.locator('#map .node').evaluateAll(nodes => nodes.flatMap(node => {
        const rect = node.querySelector('.node-box').getBBox();
        return [...node.querySelectorAll('text')].filter(text => {
          const bounds = text.getBBox();
          return bounds.x < rect.x - 1 || bounds.y < rect.y - 1 || bounds.x + bounds.width > rect.x + rect.width + 1 || bounds.y + bounds.height > rect.y + rect.height + 1;
        }).map(text => node.dataset.id + ': ' + text.textContent);
      }));
      assert.deepEqual(clipped, [], 'map text escapes its node');
    };
    for (const width of [1280, 375, 320]) {
      await page.setViewportSize({ width, height: 900 });
      await assertNodeBounds();
    }
    await page.setViewportSize({ width: 1280, height: 900 });
    const compileNode = page.locator('#map [data-id="compile"]');
    await compileNode.hover();
    await page.mouse.down();
    assert.equal(await compileNode.evaluate(hasOutline), false, 'map node shows a pointer outline');
    assert.equal(await compileNode.locator('.node-focus').evaluate(element => getComputedStyle(element).opacity), '0', 'map node shows a keyboard ring during pointer press');
    await page.mouse.up();
    assert.match(await text('#map-desc'), /Waits for Checkout/);
    assert.equal(await page.locator('#map .node[data-role="downstream"]').count(), 3);
    await assertNodeBounds();
    await page.keyboard.press('Tab');
    await page.keyboard.press('Shift+Tab');
    assert.equal(await compileNode.evaluate(element => element === document.activeElement && element.matches(':focus-visible')), true, 'map node lost keyboard focus');
    assert.equal(await compileNode.locator('.node-focus').evaluate(element => getComputedStyle(element).opacity), '1', 'map node keyboard focus ring is hidden');
    await page.keyboard.press('Enter');
    assert.equal(await compileNode.getAttribute('aria-pressed'), 'false');
    await page.keyboard.press('Enter');
    assert.equal(await compileNode.getAttribute('aria-pressed'), 'true');
    // Clicking the same keyboard-focused SVG must switch focus appearance too.
    await compileNode.hover();
    await page.mouse.down();
    assert.equal(await compileNode.locator('.node-focus').evaluate(element => getComputedStyle(element).opacity), '0', 'map retained its keyboard ring after switching to pointer');
    assert.equal(await compileNode.evaluate(hasOutline), false);
    await page.mouse.up();
    await page.click('#reset');
    assert.match(await text('#map-desc'), /Select a stage/);

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
    }
    console.log('PASS: 13 standalone pages offline; static checks, MathML notation, desktop/mobile, pointer and keyboard focus, chart cursor, models, reset/retry, playback/reduced motion, quiz layout, map bounds, seeded replay, branches, ordering, theme controls and persistence, restricted storage, and no-JS fallbacks.');
  } finally {
    if (browser) await browser.close();
    fs.rmSync(temporary, { recursive: true, force: true });
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
