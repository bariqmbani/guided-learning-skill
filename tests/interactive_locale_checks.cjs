/* Runtime localization coverage, also called by interactive_browser_smoke.cjs.
 * Standalone: node tests/interactive_locale_checks.cjs (same Playwright env vars).
 * The fixture runs offline as one file; production needs no test dependencies.
 */
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

async function checkLocalization(browser) {
  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'learning-locale-'));
  const runtime = fs.readFileSync(path.resolve(__dirname, '../SKILLS/learning-interactives/interactive.js'), 'utf8');
  const context = await browser.newContext({ colorScheme: 'light', offline: true, locale: 'en-US' });
  const page = await context.newPage();
  const failures = [];
  page.on('pageerror', error => failures.push(error.message));
  page.on('request', request => { if (/^https?:/.test(request.url())) failures.push(request.url()); });
  const fixture = configuration => `<!doctype html><html lang="de"><meta charset="utf-8"><title>Locale checks</title>
    <body><header class="lesson-header"><h1>Locale checks</h1></header>
    <p data-announcer role="status" aria-live="polite"></p>
    <form id="question"><label><input type="radio" name="question" value="yes">Ja</label>
      <button data-check>Prüfen</button><p data-feedback></p></form>
    <form id="quiz"><p data-quiz-position></p><p data-quiz-prompt></p><fieldset data-quiz-choices></fieldset>
      <button data-check>Prüfen</button><button type="button" data-next></button>
      <p data-feedback></p><p data-quiz-summary></p><button type="button" data-restart>Neu</button></form>
    <form id="answer"><textarea></textarea><button data-check>Antworten</button><p data-record></p></form>
    <div id="hints"><button data-hint-next></button><span data-hint-count></span><ol data-hint-list></ol></div>
    <form id="explain"><textarea data-answer></textarea><button data-check>Vergleichen</button>
      <p data-feedback></p><p data-count></p><p data-reference hidden>Referenz</p></form>
    <div id="order"><ol data-sortable></ol><button data-check>Prüfen</button>
      <button data-shuffle>Mischen</button><p data-feedback></p></div>
    <div id="matching"><div data-matching></div><button data-check>Prüfen</button><p data-feedback></p></div>
    <div id="stepper"><button data-back>Zurück</button><button data-next>Weiter</button>
      <button data-play></button><button data-reset>Neu</button><p data-position></p>
      <input type="range" data-scrub><span data-scrub-value></span><p data-step-summary>Spur</p></div>
    <div id="chart"></div><div id="bars"></div>
    <script>window.LearningUIStrings = ${(JSON.stringify(configuration) || 'undefined').replace(/</g, '\\u003c')};</script>
    <script>${runtime}</script><script>
      const byId = id => document.getElementById(id);
      LearningUI.mountQuestion(byId('question'), { correct: 'yes', feedback: { yes: 'Beleg' } });
      LearningUI.mountQuiz(byId('quiz'), { items: [{ prompt: 'Frage', correct: 'a',
        choices: [{ value: 'a', label: 'A' }, { value: 'b', label: 'B' }], feedback: { a: 'Beleg' } }] });
      LearningUI.mountPrediction(byId('answer'));
      LearningUI.mountHints(byId('hints'), { hints: ['Erster Hinweis', 'Zweiter Hinweis'] });
      LearningUI.mountSelfExplain(byId('explain'), { minLength: 3 });
      LearningUI.mountSortable(byId('order'), { items: [{ id: 'a', label: 'A' }, { id: 'b', label: 'B' }] });
      LearningUI.mountMatching(byId('matching'), { pairs: [
        { id: 'a', term: 'A', match: 'eins' }, { id: 'b', term: 'B', match: 'zwei' }] });
      window.trace = LearningUI.mountStepper(byId('stepper'), { count: 2, interval: 200, render() {} });
      LearningUI.renderChart(byId('chart'), { xLabel: 'Zeit', yLabel: 'Wert',
        series: [{ label: 'A', points: [{ x: 0, y: 0 }, { x: 1, y: 2 }] }],
        baseline: [{ x: 0, y: 1 }, { x: 1, y: 1 }] });
      LearningUI.renderBars(byId('bars'), { bars: [{ label: 'A', value: 1 }], table: true, target: { value: 2 } });
    </script></body></html>`;
  const open = async configuration => {
    fs.writeFileSync(path.join(temporary, 'locale.html'), fixture(configuration));
    await page.goto(pathToFileURL(path.join(temporary, 'locale.html')).href);
  };
  const content = selector => page.locator(selector).textContent();
  const submit = selector => page.locator(selector).evaluate(form => form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })));
  const announcement = async expected => {
    await page.waitForFunction(value => document.querySelector('[data-announcer]').textContent === value, expected);
  };
  try {
    // Defaults preserve English copy and the browser's numeric conventions.
    await open(undefined);
    assert.equal(await content('[data-theme-toggle]'), 'Dark mode');
    assert.equal(await content('#quiz [data-quiz-position]'), 'Question 1 of 1');
    assert.equal(await page.evaluate(() => LearningUI.fmt.fixed(1234.5, 2)), '1,234.50');
    await submit('#question');
    assert.equal(await content('#question [data-feedback]'), 'Choose an answer, then check your reasoning.');
    await page.locator('#question input').check();
    await submit('#question');
    assert.equal(await content('#question [data-feedback]'), 'That fits. Beleg');
    assert.equal(await page.evaluate(() => Object.isFrozen(LearningUI.i18n.defaults)), true);

    await open({ locale: 'de-DE', messages: {
      'theme.dark': 'Dunkel', 'theme.switchDark': 'Dunkles Design wählen',
      'question.correct': '{feedback} — richtig.',
      'quiz.position': 'Frage {current}/{total}', 'quiz.summary': '{correct}/{total} beim ersten Versuch.',
      'quiz.complete': 'Fertig', 'quiz.seeSummary': 'Zusammenfassung', 'quiz.restarted': 'Neu begonnen.',
      'answer.label': 'Deine Antwort', 'answer.record': '{answer} ({label})', 'answer.recorded': 'Antwort gespeichert.',
      'hints.first': 'Hinweis', 'hints.shown': '{shown}/{total} Hinweise', 'hints.announce': '{current}: {hint}',
      'explain.minimum': 'Mindestens {minimum}; bisher {length}.', 'explain.count': '{length} Zeichen.',
      'explain.compare': 'Vergleiche.', 'explain.revealed': 'Referenz sichtbar.',
      'order.earlier': 'Früher: {label}, Platz {position}', 'order.complete': 'Alle Schritte passen.',
      'order.moved': '{label}: Platz {position}/{total}.', 'order.shuffled': 'Gemischt.',
      'matching.label': 'Zuordnung: {term}', 'matching.choose': 'Wählen…', 'matching.correct': 'Richtig',
      'matching.complete': 'Alle zugeordnet.', 'matching.incomplete': '{correct}/{answered}; bitte alle wählen.',
      'stepper.play': 'Start', 'stepper.replay': 'Wiederholen', 'stepper.position': 'Schritt {current}/{total}',
      'stepper.scrub': '{current}/{total}', 'stepper.finished': 'Fertig: {position}.',
      'stepper.reducedMotion': 'Reduzierte Bewegung ist aktiv. Start, Zurück und Weiter bleiben verfügbar.',
      'math.root': 'Wurzel[{index}]', 'chart.caption': '{y} über {x}',
      'chart.description': '{caption}: {series}.{cursor} Tabelle unten.', 'chart.series': 'Reihe',
      'chart.cursorDescription': ' Pfeiltasten verwenden.', 'chart.cursorHint': 'Werte mit Pfeiltasten lesen.',
      'chart.data': 'Diagrammdaten', 'chart.baseline': 'Vergleich', 'table.show': 'Tabelle öffnen',
      'bars.reference': 'Referenz', 'bars.category': 'Kategorie', 'bars.value': 'Wert'
    } });
    // Initial auto-mounted controls use the dictionary; omitted entries fall back per key.
    assert.equal(await content('[data-theme-toggle]'), 'Dunkel');
    assert.equal(await page.locator('[data-theme-toggle]').getAttribute('aria-label'), 'Dunkles Design wählen');
    await page.locator('[data-theme-toggle]').click();
    assert.equal(await content('[data-theme-toggle]'), 'Light mode');
    assert.equal(await page.locator('[data-theme-toggle]').getAttribute('aria-label'), 'Switch to light mode');
    await page.locator('[data-theme-toggle]').click();
    assert.equal(await page.evaluate(() => LearningUI.fmt.fixed(1234.5, 2)), '1.234,50');
    assert.equal(await page.evaluate(() => LearningUI.fmt.signed(-3.5, 2)), '−3,50');
    assert.equal(await page.evaluate(() => LearningUI.fmt.pct(.625)), '62,5\u00a0%');
    assert.equal(await page.evaluate(() => LearningUI.i18n.text('quiz.position', { current: 1000, total: 2000 })), 'Frage 1.000/2.000');
    await page.locator('#question input').check();
    await submit('#question');
    assert.equal(await content('#question [data-feedback]'), 'Beleg — richtig.');
    assert.equal(await content('#quiz [data-quiz-position]'), 'Frage 1/1');
    await page.locator('#quiz input[value=a]').check();
    await submit('#quiz');
    assert.equal(await content('#quiz [data-feedback]'), 'That fits. Beleg');
    assert.equal(await content('#quiz [data-next]'), 'Zusammenfassung');
    await page.locator('#quiz [data-next]').click();
    assert.equal(await content('#quiz [data-quiz-summary]'), '1/1 beim ersten Versuch.');
    assert.equal(await content('#quiz [data-quiz-position]'), 'Fertig');
    await announcement('1/1 beim ersten Versuch.');
    await page.locator('#quiz [data-restart]').click();
    await announcement('Neu begonnen.');

    // User content and translation placeholders remain text, even when they resemble markup.
    const answer = '<img src=x onerror="window.injected=true">';
    await page.locator('#answer textarea').fill(answer);
    await submit('#answer');
    assert.equal(await content('#answer [data-record]'), answer + ' (Deine Antwort)');
    assert.equal(await page.locator('#answer img').count(), 0);
    await announcement('Antwort gespeichert.');
    await page.locator('#hints [data-hint-next]').click();
    assert.equal(await content('#hints [data-hint-count]'), '1/2 Hinweise');
    assert.equal(await content('#hints [data-hint-next]'), 'Show the next hint');
    await announcement('1: Erster Hinweis');
    assert.equal(await content('#explain [data-count]'), 'Mindestens 3; bisher 0.');
    await page.locator('#explain textarea').fill('abc');
    assert.equal(await content('#explain [data-count]'), '3 Zeichen.');
    await submit('#explain');
    assert.equal(await content('#explain [data-feedback]'), 'Vergleiche.');
    await announcement('Referenz sichtbar.');

    assert.equal(await page.locator('#order [data-id=a] [data-up]').getAttribute('aria-label'), 'Früher: A, Platz 2');
    await page.locator('#order [data-id=a] [data-up]').click();
    await announcement('A: Platz 1/2.');
    await page.locator('#order [data-check]').click();
    assert.equal(await content('#order [data-feedback]'), 'Alle Schritte passen.');
    await page.locator('#order [data-shuffle]').click();
    await announcement('Gemischt.');
    assert.equal(await page.locator('#matching select').first().getAttribute('aria-label'), 'Zuordnung: A');
    assert.equal(await content('#matching select option[value=""] >> nth=0'), 'Wählen…');
    await page.locator('#matching [data-check]').click();
    assert.equal(await content('#matching [data-feedback]'), '0/0; bitte alle wählen.');
    await page.locator('#matching [data-id=a] select').selectOption('eins');
    await page.locator('#matching [data-id=b] select').selectOption('zwei');
    await page.locator('#matching [data-check]').click();
    assert.equal(await content('#matching [data-feedback]'), 'Alle zugeordnet.');
    assert.equal(await content('#matching .match-verdict >> nth=0'), 'Richtig');

    assert.equal(await content('#stepper [data-play]'), 'Start');
    assert.equal(await content('#stepper [data-position]'), 'Schritt 1/2');
    await page.locator('#stepper [data-play]').click();
    await announcement('Fertig: Schritt 2/2.');
    assert.equal(await content('#stepper [data-play]'), 'Wiederholen');
    assert.equal(await content('#stepper [data-scrub-value]'), '2/2');
    assert.equal(await page.locator('#stepper [data-scrub]').getAttribute('aria-valuetext'), 'Schritt 2/2');
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.waitForFunction(() => !document.querySelector('#stepper .motion-note').hidden);
    assert.equal(await content('#stepper .motion-note'), 'Reduzierte Bewegung ist aktiv. Start, Zurück und Weiter bleiben verfügbar.');
    assert.equal(await page.locator('#stepper [data-play]').isDisabled(), false);
    await page.locator('#stepper [data-reset]').click();
    assert.equal(await content('#stepper [data-play]'), 'Start');
    await page.locator('#stepper [data-play]').click();
    assert.equal(await content('#stepper [data-play]'), 'Pause');
    await page.waitForFunction(() => document.querySelector('#stepper [data-play]').getAttribute('aria-pressed') === 'false');
    await announcement('Fertig: Schritt 2/2.');
    assert.equal(await content('#stepper [data-play]'), 'Wiederholen');

    assert.equal(await page.evaluate(() => LearningUI.math.toText('\\sqrt[3]{x}')), 'Wurzel[3]x');
    assert.equal(await page.locator('#chart svg').getAttribute('aria-label'), 'Wert über Zeit: A. Pfeiltasten verwenden. Tabelle unten.');
    assert.equal(await content('#chart summary'), 'Tabelle öffnen');
    assert.equal(await content('#chart caption'), 'Wert über Zeit');
    assert.equal(await content('#chart th >> nth=0'), 'Reihe');
    assert.equal(await content('#chart .chart-hint'), 'Werte mit Pfeiltasten lesen.');
    assert.equal(await page.locator('#chart .table-wrap').getAttribute('aria-label'), 'Diagrammdaten');
    assert.ok((await content('#chart .chart-legend')).includes('Vergleich'));
    assert.equal(await content('#bars summary'), 'Tabelle öffnen');
    assert.equal(await content('#bars th >> nth=0'), 'Kategorie');
    assert.equal(await content('#bars th >> nth=1'), 'Wert');
    assert.equal(await content('#bars .explain'), 'Referenz: 2');
    assert.equal(await page.evaluate(() => Boolean(window.injected)), false);

    // Translation strings themselves cannot introduce markup; invalid optional configuration stays usable.
    await open({ locale: 'invalid_locale', messages: { 'theme.dark': '<b>Dunkel</b>', 'hints.first': 42, 'hints.next': '' } });
    assert.equal(await content('[data-theme-toggle]'), '<b>Dunkel</b>');
    assert.equal(await page.locator('[data-theme-toggle] b').count(), 0);
    assert.equal(await content('#hints [data-hint-next]'), 'Show a hint');
    assert.equal(await page.evaluate(() => LearningUI.fmt.fixed(1234.5, 2)), '1,234.50');

    // Browsers without MathML keep translated linear accessible names, offline.
    await page.addInitScript(() => {
      window.MathMLElement = undefined;
      const create = document.createElementNS.bind(document);
      document.createElementNS = (namespace, tag, ...rest) => namespace === 'http://www.w3.org/1998/Math/MathML'
        ? document.createElement('span') : create(namespace, tag, ...rest);
    });
    await open({ messages: { 'math.root': 'Wurzel[{index}]' } });
    assert.equal(await page.evaluate(() => LearningUI.math.supported), false);
    assert.equal(await page.evaluate(() => LearningUI.math.tex('\\sqrt[3]{x}').getAttribute('aria-label')), 'Wurzel[3]x');
    assert.equal(await page.evaluate(() => LearningUI.math.tex('\\sqrt[3]{x}', { label: 'Kubikwurzel aus x' }).getAttribute('aria-label')), 'Kubikwurzel aus x');
    assert.deepEqual(failures, []);
  } finally {
    await context.close();
    fs.rmSync(temporary, { recursive: true, force: true });
  }
}

module.exports = { checkLocalization };
if (require.main === module) {
  (async () => {
    const { chromium } = require(process.env.LEARNING_PLAYWRIGHT_PATH || 'playwright');
    const browser = await chromium.launch({ headless: true, ...(process.env.LEARNING_BROWSER_EXECUTABLE ? { executablePath: process.env.LEARNING_BROWSER_EXECUTABLE } : {}) });
    try { await checkLocalization(browser); console.log('Interactive locale checks passed.'); }
    finally { await browser.close(); }
  })().catch(error => { console.error(error); process.exitCode = 1; });
}
