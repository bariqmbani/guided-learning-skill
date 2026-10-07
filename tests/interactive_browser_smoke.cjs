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
const templates = ['parameter-explorer', 'step-sequence', 'comparison', 'probability-lab', 'decision-scenario'];

(async () => {
  let browser;
  try {
    for (const template of templates) {
      execFileSync(python, [path.join(kit, 'scaffold.py'), template, path.join(temporary, template + '.html')]);
    }
    fs.copyFileSync(path.join(kit, 'example-interactive.html'), path.join(temporary, 'example-interactive.html'));
    execFileSync(python, [path.join(temporary, 'build.py'), 'example-interactive.html']);
    // Prove the delivered HTML works after its adjacent assets are removed.
    for (const name of ['interactive.css', 'interactive.js', 'build.py']) fs.unlinkSync(path.join(temporary, name));
    browser = await chromium.launch({ headless: true, ...(process.env.LEARNING_BROWSER_EXECUTABLE ? { executablePath: process.env.LEARNING_BROWSER_EXECUTABLE } : {}) });
    const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, offline: true });
    const page = await context.newPage();
    const failures = [];
    page.on('pageerror', error => failures.push(error.message));
    page.on('request', request => { if (/^https?:/.test(request.url())) failures.push('Network request: ' + request.url()); });
    const open = name => page.goto(pathToFileURL(path.join(temporary, name + '.html')).href);
    const text = selector => page.locator(selector).innerText();
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
    for (const name of [...templates, 'example-interactive']) {
      await open(name);
      assert.equal(await page.locator('h1').count(), 1);
      for (const width of [1280, 375, 320]) {
        await page.setViewportSize({ width, height: 900 });
        await page.waitForTimeout(60); // Let ResizeObserver update chart coordinates.
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), true, name + ': horizontal overflow at ' + width);
      }
      await page.setViewportSize({ width: 1280, height: 900 });
    }

    await open('parameter-explorer');
    await question('up-two');
    await page.locator('#slope').focus();
    await page.keyboard.press('ArrowRight');
    assert.equal(await page.locator('#slope').inputValue(), '1.5');
    assert.equal(await text('#at-two'), '4');
    await range('slope', -3); await range('intercept', 4);
    assert.equal(await text('#at-two'), '-2');
    assert.equal(await page.locator('#line-chart table tbody tr').count(), 10);
    await page.locator('#line-chart summary').click();
    await page.setViewportSize({ width: 375, height: 900 });
    await page.waitForTimeout(80);
    assert.equal(await page.locator('#line-chart details').getAttribute('open'), '');
    await page.click('#reset');
    assert.equal(await text('#at-two'), '3');

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
    assert.equal(await text('#mid'), '—');
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

    const staticPage = await browser.newPage({ javaScriptEnabled: false });
    for (const name of [...templates, 'example-interactive']) {
      await staticPage.goto(pathToFileURL(path.join(temporary, name + '.html')).href);
      assert.equal(await staticPage.locator('noscript').isVisible(), true, name + ': missing static fallback');
    }
    console.log('PASS: 6 standalone lessons offline; desktop/mobile, keyboard, models, reset/retry, playback/reduced motion, seeded replay, branches, and no-JS fallbacks.');
  } finally {
    if (browser) await browser.close();
    fs.rmSync(temporary, { recursive: true, force: true });
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
