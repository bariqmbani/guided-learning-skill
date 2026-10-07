/* Domain checks for model-driven SVG motion. Shared transport lifecycle is
 * exercised in the main smoke suite; these assert the actual teaching models. */
'use strict';
const assert = require('node:assert/strict');

async function checkTemplateMotion({ page, open }) {
  const originalViewport = page.viewportSize();
  const widthOfSquare = () => page.locator('#figure polygon').first().evaluate(element => {
    const xs = element.getAttribute('points').split(' ').map(point => Number(point.split(',')[0]));
    return Math.max(...xs) - Math.min(...xs);
  });
  await open('geometry-lab');
  assert(await page.locator('[data-speed]').isVisible(), 'geometry preset speed must be visible without opening settings');
  const initialWidth = await widthOfSquare();
  const fixedBounds = await page.locator('#figure').getAttribute('viewBox');
  await page.click('[data-preset="6,8"]');
  await page.waitForTimeout(120);
  const intermediateWidth = await widthOfSquare();
  assert(intermediateWidth > initialWidth && intermediateWidth < initialWidth * 2,
    'geometry preset must visibly interpolate model lengths');
  await page.waitForFunction(() => document.getElementById('area-c').textContent === '100');
  assert.equal(await page.locator('#figure').getAttribute('viewBox'), fixedBounds,
    'geometry must not refit its scale while lengths grow');
  assert(Math.abs((await widthOfSquare()) - initialWidth * 2) < .02,
    'doubling a leg must visibly double the side of its square');
  await page.click('[data-preset="5,5"]');
  await page.waitForTimeout(80);
  await page.click('#reset');
  await page.waitForTimeout(650);
  assert.equal(await page.locator('#area-c').innerText(), '25', 'reset must interrupt geometry motion');

  await open('motion-explainer');
  assert(await page.locator('[data-speed]').isVisible(), 'playback speed must be visible without opening settings');
  assert.equal(await page.locator('#model-time').innerText(), '0.00 s', 'the model must not autoplay');
  await page.click('[data-next]');
  await page.waitForTimeout(250);
  const points = await page.evaluate(() => {
    const circle = document.getElementById('orbit-point'), wave = document.getElementById('wave-point');
    return { x: Number(circle.getAttribute('cx')) - 100, y: Number(circle.getAttribute('cy')) - 100,
      circleY: Number(circle.getAttribute('cy')), waveY: Number(wave.getAttribute('cy')) };
  });
  assert(points.x > 0 && points.y < 0, 'the point must move through the first quadrant');
  assert(Math.abs(Math.hypot(points.x, points.y) - 64) < .00001,
    'intermediate positions must follow the circle, not cut across its chord');
  assert.equal(points.circleY, points.waveY, 'both representations must share the exact model height');
  await page.uncheck('[data-motion]');
  assert.equal(await page.locator('#model-time').innerText(), '2.00 s');
  assert.equal(await page.locator('#model-height').innerText(), '1.00');
  await page.check('[data-motion]');
  await page.selectOption('[data-speed]', '0.5');
  await page.click('[data-back]');
  await page.waitForTimeout(250);
  const reverseFrame = await page.evaluate(() => {
    const circle = document.getElementById('orbit-point'), wave = document.getElementById('wave-point');
    return { x: Number(circle.getAttribute('cx')) - 100, y: Number(circle.getAttribute('cy')) - 100,
      circleY: Number(circle.getAttribute('cy')), waveY: Number(wave.getAttribute('cy')),
      time: Number.parseFloat(document.getElementById('model-time').textContent) };
  });
  assert(reverseFrame.time > 0 && reverseFrame.time < 2,
    'Back must animate decreasing model time through intermediate frames');
  assert(reverseFrame.x > 0 && reverseFrame.y < 0 && Math.abs(Math.hypot(reverseFrame.x, reverseFrame.y) - 64) < .00001,
    'Back must retrace the circular arc rather than cut a chord or replay forward motion');
  assert.equal(reverseFrame.circleY, reverseFrame.waveY, 'reverse motion must keep both representations synchronized');
  assert.match(await page.locator('#checkpoint-title').innerText(), /^Returning:/,
    'the current caption must distinguish backward inspection');
  await page.waitForTimeout(200);
  const slowTime = Number.parseFloat(await page.locator('#model-time').innerText());
  const slowDelta = reverseFrame.time - slowTime;
  assert(slowDelta > 0, 'reverse model time must keep decreasing');
  await page.click('[data-play]');
  const pausedTime = await page.locator('#model-time').innerText();
  await page.selectOption('[data-speed]', '2');
  await page.waitForTimeout(250);
  assert.equal(await page.locator('#model-time').innerText(), pausedTime,
    'pausing and changing speed must preserve the intermediate reverse frame');
  await page.click('[data-play]');
  await page.waitForTimeout(200);
  const fastTime = Number.parseFloat(await page.locator('#model-time').innerText());
  assert(Number.parseFloat(pausedTime) - fastTime > slowDelta * 2,
    'visible speed control must change the running reverse animation rate');
  await page.waitForFunction(() => document.getElementById('model-time').textContent === '0.00 s');
  assert.equal(await page.locator('#model-height').innerText(), '0.00');
  assert.equal(await page.locator('[data-position]').innerText(), 'Step 1 of 5',
    'finishing manual Back must remain on the inspected checkpoint');
  await page.click('[data-reset]');

  await page.emulateMedia({ reducedMotion: 'reduce' });
  await open('motion-explainer');
  assert.equal(await page.locator('[data-motion]').isChecked(), true, 'lesson motion starts enabled independently of the OS preference');
  await page.uncheck('[data-motion]');
  assert.equal(await page.locator('[data-play]').isEnabled(), true, 'reduced motion must keep Play available');
  await page.click('[data-next]');
  assert.equal(await page.locator('#model-time').innerText(), '2.00 s', 'turning lesson motion off must settle the checkpoint');
  await page.check('[data-motion]');
  await page.click('[data-next]');
  await page.waitForTimeout(200);
  const time = Number.parseFloat(await page.locator('#model-time').innerText());
  assert(time > 2 && time < 4, 'explicit motion opt-in must animate between model checkpoints');
  await page.click('[data-reset]');
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await checkPlayerLayouts({ page, open });
  if (originalViewport) await page.setViewportSize(originalViewport);
}

async function checkPlayerLayouts({ page, open }) {
  for (const name of ['step-sequence', 'system-map', 'geometry-lab', 'motion-explainer']) {
    for (const [width, height] of [[320, 568], [390, 844]]) {
      await page.setViewportSize({ width, height });
      await open(name);
      assert(await page.locator('[data-speed]').isVisible(), name + ': speed is visible on phones');
      assert(await page.locator('[data-motion]').isVisible(), name + ': animation toggle is visible on phones');
      await page.click(name === 'geometry-lab' ? '[data-preset="6,8"]' : '[data-next]');
      const layout = await page.evaluate(() => {
        const scene = document.querySelector('.motion-scene').getBoundingClientRect();
        const controls = document.querySelector('.scene-controls');
        const primary = controls.querySelector('.scene-transport, .scene-presets').getBoundingClientRect();
        const scrub = controls.querySelector('[data-scrub]');
        return { pageWidth: document.documentElement.scrollWidth, sceneTop: scene.top, primaryBottom: primary.bottom,
          scrubHeight: scrub ? scrub.getBoundingClientRect().height : 0 };
      });
      assert(layout.pageWidth <= width, name + ': no phone overflow');
      assert(layout.sceneTop >= -1 && layout.primaryBottom <= height + 1,
        name + ': the actual control click must leave the scene and primary actions together in view');
      assert(layout.scrubHeight <= 48, name + ': scrubbers must not grow tall in stacked controls');
    }
    // A 640px viewport at 200% CSS zoom has 320px of usable layout width.
    // Long labels and RTL must remain readable in document flow, without clipping.
    await page.setViewportSize({ width: 640, height: 900 });
    await open(name);
    const stress = await page.evaluate(() => {
      document.documentElement.dir = 'rtl';
      document.documentElement.style.zoom = '2';
      const labels = { play: 'Wiedergabe fortsetzen', back: 'Vorheriger Schritt', next: 'Nächster Schritt', reset: 'Von vorne beginnen' };
      Object.entries(labels).forEach(([action, label]) => {
        const button = document.querySelector('[data-' + action + ']');
        if (button) button.textContent = label;
      });
      const speedLabel = document.querySelector('.scene-speed');
      if (speedLabel) speedLabel.firstChild.textContent = 'Wiedergabegeschwindigkeit';
      const motionLabel = document.querySelector('.scene-motion');
      if (motionLabel) motionLabel.lastChild.textContent = ' Änderungen animiert darstellen';
      const controls = document.querySelector('.scene-controls');
      const buttons = [...controls.querySelectorAll('.scene-transport > button, .scene-presets > button')];
      return { pageWidth: document.documentElement.scrollWidth,
        clipped: [...controls.querySelectorAll('button, label, summary, select')].filter(element =>
          element.getClientRects().length && element.scrollWidth > element.clientWidth + 2).map(element => element.textContent),
        mirrored: buttons[0].getBoundingClientRect().left > buttons[1].getBoundingClientRect().left,
        sceneCoordinates: (() => {
          const items = document.querySelectorAll('#items > li');
          if (items.length) {
            const center = element => { const box = element.getBoundingClientRect(); return box.left + box.width / 2; };
            return center(items[0]) < center(items[items.length - 1]) &&
              Math.abs(center(items[0]) - center(document.querySelector('[data-pointer="low"]'))) < 6 &&
              Math.abs(center(items[items.length - 1]) - center(document.querySelector('[data-pointer="high"]'))) < 6;
          }
          const map = document.getElementById('pipeline-map');
          if (map) return map.querySelector('[data-id="checkout"]').getBoundingClientRect().left <
            map.querySelector('[data-id="lint"]').getBoundingClientRect().left;
          return true;
        })() };
    });
    assert(stress.pageWidth <= 640, name + ': RTL/long labels/200% zoom must not cause horizontal overflow');
    assert.deepEqual(stress.clipped, [], name + ': translated controls must wrap without clipping');
    assert(stress.mirrored, name + ': transport follows the inline direction without changing DOM order');
    assert(stress.sceneCoordinates, name + ': RTL controls must not reverse physical model coordinates or detach pointers');
  }
  // Previously a direct range inherited flex-basis:140px from row controls,
  // turning it into a 140px-tall input inside .stack. Preserve compatibility.
  await open('motion-explainer');
  const directRangeHeight = await page.evaluate(() => {
    const controls = document.createElement('div');
    controls.className = 'scene-controls stack';
    controls.innerHTML = '<input type="range" data-scrub aria-label="Compatibility seek control">';
    document.body.append(controls);
    const height = controls.firstElementChild.getBoundingClientRect().height;
    controls.remove();
    return height;
  });
  assert(directRangeHeight <= 48, 'direct ranges in stacked scene controls stay bounded');
}

module.exports = { checkTemplateMotion };
