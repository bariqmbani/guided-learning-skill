/* Educational scene lifecycle checks, offline and independent of lesson content.
 * Also used by interactive_browser_smoke.cjs. Requires the same Playwright env vars.
 */
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

async function checkScenes({ browser }) {
  const runtime = fs.readFileSync(path.resolve(__dirname, '../SKILLS/learning-interactives/interactive.js'), 'utf8');
  const context = await browser.newContext({ offline: true, reducedMotion: 'no-preference' });
  const page = await context.newPage();
  const failures = [];
  page.on('pageerror', error => failures.push(error.message));
  page.on('request', request => { if (/^https?:/.test(request.url())) failures.push(request.url()); });
  const fixture = (fallback = false, checkbox = true, motionPolicy) => `<!doctype html><html lang="en"><meta charset="utf-8"><title>Scene checks</title>
    <style>[data-scene]{position:relative;display:flex;justify-content:space-between;width:320px;height:150px;border:2px solid;padding:12px}
      .endpoint{width:45px;align-self:flex-start}.ball{position:absolute;left:12px;top:90px;width:15px;height:15px;background:blue}
      .marker{width:12px;height:12px;background:red;opacity:0}.unrelated{width:20px;height:20px}</style>
    <body><section id="player"><button data-back>Back</button><button data-next>Next</button><button data-play>Play</button><button data-reset>Reset</button>
      <select data-speed aria-label="Speed"><option value="0.5">Slow</option><option value="1" selected>Normal</option><option value="4">Fast</option></select>
      ${checkbox ? '<label><input type="checkbox" data-motion>Show movement</label>' : ''}
      <input data-scrub type="range" aria-label="Step"><p data-position></p><p data-step-summary></p>
      <div data-scene><span id="a" class="endpoint">Source</span><span id="b" class="endpoint">Destination</span><span id="ball" class="ball"></span><span id="marker" class="marker"></span></div>
    </section><div id="separate"><span class="unrelated"></span></div><p data-announcer></p>
    ${fallback ? '<script>Element.prototype.animate = undefined;</script>' : ''}<script>${runtime}</script><script>
      const root=document.querySelector('#player'), ball=document.querySelector('#ball'), marker=document.querySelector('#marker');
      window.scene=LearningUI.createScene(root,{duration:600,easing:'linear'${motionPolicy === undefined ? '' : ',motion:' + JSON.stringify(motionPolicy)}});
      window.other=LearningUI.createScene(document.querySelector('#separate'),{duration:1000,easing:'linear'});
      window.value=0;window.updates=0;window.renders=[];
      window.player=LearningUI.mountStepper(root,{count:3,interval:300,scene,render(index,context){
        renders.push({index,...context});
        root.querySelector('[data-step-summary]').textContent='State '+index;
        scene.to(ball,{transform:'translateX('+index*100+'px)'});
        scene.tween('phase',{to:index,update(value){window.value=value;window.updates++;}});
        if(!context.instant && context.direction) scene.transfer(marker,
          document.querySelector(context.direction < 0 ? '#b' : '#a'),
          document.querySelector(context.direction < 0 ? '#a' : '#b'));
        else scene.to(marker,{opacity:0});
      }});
      window.x=()=>new DOMMatrix(getComputedStyle(ball).transform).m41;
    </script></body></html>`;
  const open = async (fallback = false, checkbox = true, motionPolicy) => {
    // Reload the realm as well as the DOM: the runtime deliberately rejects duplicate initialization.
    await page.goto('about:blank');
    await page.setContent(fixture(fallback, checkbox, motionPolicy));
  };
  const pose = () => page.evaluate(() => ({ x: x(), value, active: scene.active, index: player.get(), playing: document.querySelector('[data-play]').getAttribute('aria-pressed') }));
  const wait = ms => page.waitForTimeout(ms);
  try {
    await open();
    await wait(220);
    assert.deepEqual(await pose(), { x: 0, value: 0, active: 0, index: 0, playing: 'false' }, 'Mounting is immediate and never autoplays.');
    assert.deepEqual(await page.evaluate(() => renders[0]), { index: 0, fromIndex: 0, direction: 0, reason: 'init', instant: true });

    // Equivalent computed geometry must not create a stationary WAAPI job.
    const equivalent = await page.evaluate(() => {
      const active = [];
      scene.to(ball, {transform:'translateX(0%)',opacity:1}); active.push(scene.active);
      scene.to(ball, {transform:'matrix(1, 0, 0, 1, 15, 0)'}, {instant:true});
      scene.to(ball, {transform:'translateX(100%)',opacity:'1.0'}); active.push(scene.active);
      scene.to(ball, {transform:'translateX(15px)'}); active.push(scene.active);
      scene.to(ball, {transform:'translate3d(15px, 0px, 0px)'}); active.push(scene.active);
      scene.to(ball, {transform:'none'}, {instant:true});
      scene.to(ball, {transform:'translate(0px, 0px)'}); active.push(scene.active);
      const animations=ball.getAnimations().length;
      player.reset();
      return {active,animations};
    });
    assert.deepEqual(equivalent, {active:[0,0,0,0,0],animations:0}, 'Percentages, matrices, identity and numeric opacity spellings describe the same pose.');

    // Intermediate geometry and numeric frames must exist; changing a class is not animation.
    await page.locator('[data-next]').click();
    await wait(160);
    let current = await pose();
    assert(current.x > 5 && current.x < 95, 'Transform has a visible intermediate position.');
    assert(current.value > 0 && current.value < 1, 'Numeric tween exposes intermediate model values.');
    assert.equal(await page.locator('#marker').evaluate(el => getComputedStyle(el).opacity), '1');
    assert.equal(await page.locator('[data-play]').textContent(), 'Pause', 'Manual movement exposes a direct Pause action.');
    await page.locator('[data-play]').click();
    await wait(40); // Let a pending WAAPI pause become ready.
    const frozen = await pose();
    await wait(180);
    current = await pose();
    assert(Math.abs(current.x - frozen.x) < 0.2, 'Pause freezes actual element geometry.');
    assert.equal(current.value, frozen.value, 'Pause freezes custom drawing updates.');
    await page.evaluate(() => player.play());
    await wait(110);
    current = await pose();
    assert(current.x > frozen.x + 4 && current.value > frozen.value, 'Play resumes both scene clocks.');
    await page.waitForFunction(() => scene.active === 0);
    await wait(340);
    assert.equal((await pose()).index, 1, 'Resuming a manual movement completes only that step.');
    assert.equal((await pose()).playing, 'false');

    // Back reverses the actual transform, model and transfer. It shares the
    // visible speed control and manual pause/resume semantics with Next.
    await page.locator('[data-speed]').selectOption('0.5');
    await page.locator('[data-back]').click();
    await wait(160);
    const reverse = await pose();
    assert(reverse.x > 60 && reverse.x < 100, 'Back has an intermediate position toward the preceding checkpoint.');
    assert(reverse.value > 0 && reverse.value < 1, 'Back exposes intermediate reverse model values.');
    assert.deepEqual(await page.evaluate(() => renders.at(-1)), {index:0,fromIndex:1,direction:-1,reason:'back',instant:false});
    const markerCentre = () => page.locator('#marker').evaluate(el => { const box=el.getBoundingClientRect();return box.left+box.width/2; });
    const reverseMarker = await markerCentre();
    await page.locator('[data-play]').click();
    await wait(40);
    const reverseFrozen = await pose();
    const frozenMarker = await markerCentre();
    await wait(160);
    const stillReverse = await pose();
    assert(Math.abs(stillReverse.x-reverseFrozen.x)<0.2 && stillReverse.value===reverseFrozen.value, 'Pause freezes reverse transform and model motion.');
    assert(Math.abs(await markerCentre()-frozenMarker)<0.2, 'Pause freezes the reversed transfer too.');
    await page.locator('[data-speed]').selectOption('4');
    assert.equal((await pose()).value, reverseFrozen.value, 'Changing the rate while paused does not advance the reverse model.');
    await page.locator('[data-play]').click();
    await wait(55);
    const reverseFaster = await pose();
    assert(reverseFaster.x < reverseFrozen.x-15 && reverseFaster.value < reverseFrozen.value-0.15, 'The speed control accelerates reverse geometry and model together.');
    assert(await markerCentre()<reverseMarker-20, 'The transfer moves from the destination back toward the source.');
    await page.waitForFunction(() => scene.active===0);
    await wait(360);
    assert.deepEqual(await pose(), {x:0,value:0,active:0,index:0,playing:'false'}, 'Resuming Back completes only the reverse operation without autoplay.');
    await page.locator('[data-speed]').selectOption('1');

    // A reset cancels old jobs and ends at the initial model, even after their old deadlines.
    await page.locator('[data-reset]').click();
    assert.deepEqual(await pose(), { x: 0, value: 0, active: 0, index: 0, playing: 'false' });
    await wait(680);
    assert.equal((await pose()).value, 0);
    await page.locator('[data-next]').click();
    await wait(100);
    await page.locator('[data-scrub]').evaluate(el => { el.value = '2'; el.dispatchEvent(new Event('input', { bubbles: true })); });
    assert.deepEqual(await pose(), { x: 200, value: 2, active: 0, index: 2, playing: 'false' }, 'Scrubbing settles synchronously.');
    await wait(650);
    assert.equal((await pose()).x, 200);

    // Replacement motions begin at the displayed pose and invalidate old completions.
    await page.evaluate(() => {
      player.reset();
      scene.to(ball, { transform: 'translateX(200px)' }, { duration: 1000, easing: 'linear' });
      scene.tween('phase', { to: 10, duration: 1000, update(v) { window.value = v; } });
    });
    await wait(180);
    const interrupted = await pose();
    const replacement = await page.evaluate(() => {
      scene.to(ball, { transform: 'translateX(-100px)' }, { duration: 500, easing: 'linear' });
      scene.tween('phase', { from: -99, to: -10, duration: 500, update(v) { window.value = v; } });
      return { x: x(), value };
    });
    assert(Math.abs(replacement.x - interrupted.x) < 8, 'Retargeting retains the current visual position.');
    assert(Math.abs(replacement.value - interrupted.value) < 0.4, 'Active tween retargeting ignores an obsolete from value.');
    await wait(550);
    assert.equal((await pose()).x, -100);
    assert.equal((await pose()).value, -10);
    await wait(450);
    assert.equal((await pose()).value, -10, 'The replaced tween cannot run a stale final update.');

    // The new render owns its active keys: omitted jobs cannot outlive that model state.
    await page.evaluate(() => {
      scene.render(() => scene.tween('old-state', { from: 0, to: 1, duration: 500, update(v) { window.oldValue = v; } }));
    });
    await wait(90);
    await page.evaluate(() => scene.render(() => scene.to(ball, { opacity: 0.7 })));
    const oldValue = await page.evaluate(() => oldValue);
    await wait(550);
    assert.equal(await page.evaluate(() => oldValue), oldValue);

    // Rate changes preserve progress instead of restarting either kind of job.
    await page.evaluate(() => {
      player.reset();
      scene.to(ball, { transform: 'translateX(200px)' }, { duration: 1200, easing: 'linear' });
      scene.tween('phase', { to: 1, duration: 1200, update(v) { window.value = v; } });
    });
    await wait(130);
    const beforeRate = await pose();
    await page.evaluate(() => scene.setRate(4));
    await wait(130);
    const afterRate = await pose();
    assert(afterRate.x > beforeRate.x + 45 && afterRate.value > beforeRate.value + 0.2);
    await wait(230);
    assert.equal((await pose()).x, 200);
    assert.equal((await pose()).value, 1);

    // Container or label resizing recomputes transfer coordinates without cancelling the trip.
    await page.evaluate(() => {
      player.reset();scene.setRate(1);
      scene.transfer(marker,document.querySelector('#a'),document.querySelector('#b'),{duration:1000,easing:'linear'});
    });
    await wait(160);
    await page.locator('#b').evaluate(el => { el.textContent = 'A longer destination that wraps'; el.style.width = '35px'; });
    await wait(90);
    assert.equal(await page.evaluate(() => scene.active), 1, 'Text wrapping must not finish an in-flight transfer.');
    await page.locator('[data-scene]').evaluate(el => { el.style.width = '240px'; });
    await wait(90);
    assert.equal(await page.evaluate(() => scene.active), 1);
    assert.equal(await page.locator('#marker').evaluate(el => getComputedStyle(el).opacity), '1');
    await wait(750);
    assert.equal(await page.evaluate(() => scene.active), 0);
    assert.equal(await page.locator('#marker').evaluate(el => getComputedStyle(el).opacity), '0');
    assert.equal(await page.locator('#a').textContent(), 'Source', 'Transfers leave source entities intact.');
    const alignment = await page.evaluate(() => {
      const source=marker.getBoundingClientRect(), destination=document.querySelector('#b').getBoundingClientRect();
      return Math.abs(source.left+source.width/2-destination.left-destination.width/2);
    });
    assert(alignment < 1, 'The transfer endpoint follows the resized local scene.');

    // Keyboard Play is deliberate educational motion. The final visual must finish.
    await page.evaluate(() => player.reset());
    await page.locator('[data-play]').focus();
    await page.keyboard.press('Enter');
    await page.waitForFunction(() => player.get() === 1);
    await wait(130);
    assert((await pose()).x > 5 && (await pose()).x < 100);
    await page.waitForFunction(() => player.get() === 2);
    assert.equal((await pose()).playing, 'true', 'The player stays active for the final visual.');
    await wait(120);
    assert((await pose()).x > 100 && (await pose()).x < 200);
    await page.evaluate(() => player.pause());
    const finalPause = await page.locator('[data-play]').textContent();
    assert.equal(finalPause, 'Play', 'A paused final visual offers resume, not replay.');
    await page.evaluate(() => player.play());
    await page.waitForFunction(() => document.querySelector('[data-play]').textContent === 'Replay');
    assert.equal((await pose()).x, 200);
    assert.equal((await pose()).value, 2);

    // Boundary controls retain keyboard focus inside the player after disabling.
    await page.locator('[data-back]').focus();
    await page.keyboard.press('Home');
    assert.equal((await pose()).index, 0);
    assert.equal(await page.locator('[data-play]').evaluate(el => document.activeElement === el), true);
    await page.keyboard.press('ArrowRight');
    assert.equal((await pose()).index, 1, 'Arrow stepping still works after Back disables at the first state.');
    await page.locator('[data-next]').focus();
    await page.keyboard.press('End');
    assert.equal((await pose()).index, 2);
    assert.equal(await page.locator('[data-play]').evaluate(el => document.activeElement === el), true);
    await page.keyboard.press('ArrowLeft');
    assert.equal((await pose()).index, 1, 'Arrow stepping still works after Next disables at the last state.');

    // An unchanged pose in a new model step must not falsely offer Pause.
    await page.evaluate(() => {
      player.destroy({preserveScene:true});
      window.player=LearningUI.mountStepper(document.querySelector('#player'),{count:2,scene,render(){scene.to(ball,{transform:'translateX(0%)',opacity:1});}});
    });
    await page.locator('[data-next]').click();
    assert.equal(await page.evaluate(() => scene.active), 0);
    assert.equal(await page.locator('[data-play]').textContent(), 'Replay');
    await open();

    // Rapid direction changes commit the outgoing operation before the next
    // render reads counters and membership. Reverse uses the operation left.
    await page.evaluate(() => {
      player.destroy({preserveScene:true});
      window.committed = 0;
      window.model = {total:3, members:['A']};
      window.commits = [];
      window.observedBefore = [];
      const checkpoints = [{total:3,members:['A']},{total:8,members:['A','B']},{total:10,members:['A','B','C']}];
      window.player = LearningUI.mountStepper(document.querySelector('#player'), {
        count: 3, scene,
        render(index, context) {
          observedBefore.push({index, committed, ...context});
          scene.to(ball, {transform:'translateX('+index*100+'px)'});
          const endpoint = checkpoints[index];
          const commit = () => { window.committed = index; window.model = endpoint; };
          if (context.instant) { commit(); return; }
          const operationIndex = context.direction < 0 ? context.fromIndex : index;
          const difference = checkpoints[operationIndex].total-checkpoints[operationIndex-1].total;
          window.operation = {from:context.fromIndex,to:index,delta:context.direction*difference};
          scene.transfer(marker, document.querySelector(context.direction<0?'#b':'#a'), document.querySelector(context.direction<0?'#a':'#b'));
          scene.tween('atomic-operation', {from:0, to:1, duration:600, update(progress) {
            if (progress === 1) {
              commit();
              commits.push({completed:index, selected:player.get()});
            }
          }});
        }
      });
    });
    await page.locator('[data-next]').click();
    await wait(100);
    assert.equal(await page.evaluate(() => committed), 0);
    await page.locator('[data-next]').click();
    const committedFirst = await page.evaluate(() => ({committed, commits, before:observedBefore.at(-1)}));
    assert.deepEqual(committedFirst, {committed:1, commits:[{completed:1,selected:1}], before:{index:2,committed:1,fromIndex:1,direction:1,instant:false,reason:'next'}});
    await wait(100);
    await page.locator('[data-back]').click();
    assert.deepEqual(await page.evaluate(() => ({committed,active:scene.active,index:player.get(),model,operation,render:observedBefore.at(-1)})), {
      committed:2,active:3,index:1,model:{total:10,members:['A','B','C']},operation:{from:2,to:1,delta:-2},
      render:{index:1,committed:2,fromIndex:2,direction:-1,instant:false,reason:'back'}
    }, 'Back starts from the complete outgoing checkpoint and reverses its operation, including the correct quantity.');
    await wait(90);
    const backMidpoint = await pose();
    assert(backMidpoint.x>100 && backMidpoint.x<200, 'The atomic reverse operation has intermediate geometry.');
    await page.locator('[data-next]').click();
    assert.deepEqual(await page.evaluate(() => ({committed,index:player.get(),model,operation,render:observedBefore.at(-1)})), {
      committed:1,index:2,model:{total:8,members:['A','B']},operation:{from:1,to:2,delta:2},
      render:{index:2,committed:1,fromIndex:1,direction:1,instant:false,reason:'next'}
    }, 'Next during Back commits the reverse membership before applying the forward operation.');
    await page.waitForFunction(() => scene.active===0);
    assert.deepEqual(await page.evaluate(() => ({committed,model})), {committed:2,model:{total:10,members:['A','B','C']}});
    await page.locator('[data-play]').focus();
    await page.keyboard.press('ArrowLeft');
    await wait(90);
    assert.deepEqual(await page.evaluate(() => ({committed,active:scene.active,index:player.get(),instant:observedBefore.at(-1).instant,operation})), {
      committed:2,active:3,index:1,instant:false,operation:{from:2,to:1,delta:-2}
    }, 'ArrowLeft follows the same animated reverse semantics as Back.');
    await page.keyboard.press('ArrowLeft');
    assert.deepEqual(await page.evaluate(() => ({committed,index:player.get(),model,operation,render:observedBefore.at(-1)})), {
      committed:1,index:0,model:{total:8,members:['A','B']},operation:{from:1,to:0,delta:-5},
      render:{index:0,committed:1,fromIndex:1,direction:-1,instant:false,reason:'back'}
    }, 'Rapid repeated Back reverses the operation at fromIndex instead of reading an unfinished model.');
    await page.waitForFunction(() => scene.active===0);
    assert.deepEqual(await page.evaluate(() => ({committed,model,commits})), {
      committed:0,model:{total:3,members:['A']},commits:[
        {completed:1,selected:1},{completed:2,selected:2},{completed:1,selected:1},
        {completed:2,selected:2},{completed:1,selected:1},{completed:0,selected:0}
      ]
    }, 'Each forward or reverse completion belongs to its selected checkpoint, exactly once.');
    await page.keyboard.press('ArrowLeft');
    assert.deepEqual(await page.evaluate(() => ({active:scene.active,render:observedBefore.at(-1)})), {
      active:0,render:{index:0,committed:0,fromIndex:0,direction:0,instant:true,reason:'back'}
    }, 'A boundary arrow does not repeat a reverse domain operation.');
    await open();

    // PreserveScene supports a changed model without losing the local opt-in.
    await page.locator('[data-motion]').uncheck();
    await page.evaluate(() => {
      player.destroy({ preserveScene: true });
      window.player=LearningUI.mountStepper(document.querySelector('#player'), {count:2,scene,render(i){scene.to(ball,{transform:'translateX('+i*50+'px)'});}});
    });
    assert.equal(await page.evaluate(() => scene.enabled()), false);
    await page.locator('[data-next]').click();
    assert.equal((await pose()).x, 50);

    // A timer preserves elapsed time on both Pause and a speed-control change.
    await open();
    await page.evaluate(() => {
      player.destroy({preserveScene:true});
      window.player=LearningUI.mountStepper(document.querySelector('#player'),{count:3,interval:1200,scene,render(i){scene.to(ball,{transform:'translateX('+i*100+'px)'});}});
      player.play();
    });
    await wait(500);
    await page.evaluate(() => player.pause());
    await wait(180);
    assert.equal((await pose()).index, 0);
    const resumedAt = Date.now();
    await page.evaluate(() => player.play());
    await page.waitForFunction(() => player.get() === 1);
    assert(Date.now() - resumedAt < 1000, 'Resume uses the remaining interval, not a fresh full interval.');
    await page.evaluate(() => {player.reset();player.play();});
    await wait(600);
    const speedAt = Date.now();
    await page.locator('[data-speed]').selectOption('4');
    await page.waitForFunction(() => player.get() === 1);
    assert(Date.now() - speedAt < 280, 'Changing speed rescales only the remaining model time.');
    await wait(70);
    assert((await pose()).x > 10 && (await pose()).x < 100, 'The same speed control reaches actual scene animation.');

    // An explicit action keeps a fitting mobile scene and its playback row visible.
    await open();
    await page.setViewportSize({width:320,height:568});
    await page.evaluate(() => {
      const spacer=document.createElement('div');spacer.style.height='600px';document.body.prepend(spacer);
      const root=document.querySelector('#player'), diagram=root.querySelector('[data-scene]');
      diagram.style.width='250px';diagram.style.height='160px';root.prepend(diagram);
      const row=document.createElement('div');row.className='btn-row';
      root.querySelectorAll('button').forEach(button=>row.append(button));
      const gap=document.createElement('div');gap.style.height='170px';diagram.after(gap);gap.after(row);
      const tail=document.createElement('div');tail.style.height='700px';document.body.append(tail);
      window.scrollTo(0,row.getBoundingClientRect().top+window.scrollY-20);
    });
    assert(await page.locator('[data-scene]').evaluate(el => el.getBoundingClientRect().top < 0));
    await page.locator('[data-play]').click();
    const visible = await page.evaluate(() => ({scene:document.querySelector('[data-scene]').getBoundingClientRect().top, row:document.querySelector('.btn-row').getBoundingClientRect().bottom, focused:document.activeElement.hasAttribute('data-play')}));
    assert(visible.scene >= 0 && visible.row <= 568, 'The actual clicked action brings the whole fitting scene into view.');
    assert(visible.focused, 'Scene scrolling leaves keyboard focus on the control.');
    await page.setViewportSize({width:1280,height:720});

    // Educational movement starts enabled even under reduced motion, without autoplay.
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await open();
    assert.equal(await page.locator('[data-motion]').isChecked(), true);
    assert.equal(await page.locator('[data-play]').isEnabled(), true);
    assert.equal(await page.evaluate(() => LearningUI.motion.reduced()), true, 'Decorative reduced-motion policy remains independent.');
    assert.equal(await page.locator('.motion-note').isVisible(), false, 'The legacy reduced-motion note does not contradict the scene checkbox.');
    await wait(180);
    assert.equal((await pose()).index, 0);
    assert.equal((await pose()).active, 0);
    await page.locator('[data-next]').click();
    await wait(130);
    assert((await pose()).x > 5 && (await pose()).x < 95, 'The checked default enables actual educational movement.');
    await page.locator('[data-motion]').uncheck();
    assert.deepEqual({ x: (await pose()).x, value: (await pose()).value, active: (await pose()).active }, { x: 100, value: 1, active: 0 });
    assert.equal(await page.evaluate(() => other.enabled()), true, 'Turning movement off is local to this scene.');
    await page.locator('[data-reset]').click();
    assert.equal(await page.locator('[data-motion]').isChecked(), false, "Reset preserves the learner's local choice.");
    await page.locator('[data-play]').click();
    await page.waitForFunction(() => player.get() === 1);
    assert.deepEqual({ x: (await pose()).x, value: (await pose()).value, active: (await pose()).active }, { x: 100, value: 1, active: 0 });
    await page.waitForFunction(() => document.querySelector('[data-play]').textContent === 'Replay');
    assert.equal((await pose()).value, 2);
    await page.locator('[data-reset]').click();
    await page.locator('[data-motion]').check();
    await page.locator('[data-next]').click();
    await wait(130);
    assert((await pose()).x > 5 && (await pose()).x < 95, 'The checkbox can restore movement.');
    await open(false, false);
    await page.locator('[data-next]').click();
    await wait(130);
    assert((await pose()).x > 5 && (await pose()).x < 95, 'Movement also defaults on without a checkbox.');

    // An author may explicitly choose the system policy or an initially off scene.
    await open(false, true, 'system');
    assert.equal(await page.locator('[data-motion]').isChecked(), false);
    await page.locator('[data-next]').click();
    assert.equal((await pose()).x, 100);
    assert.equal((await pose()).active, 0);
    await page.locator('[data-reset]').click();
    await page.locator('[data-motion]').check();
    await page.locator('[data-next]').click();
    await wait(130);
    assert((await pose()).x > 5 && (await pose()).x < 95, 'Explicit scene choice overrides an authored system policy.');
    await open(false, false, 'system');
    await page.locator('[data-next]').click();
    assert.equal((await pose()).x, 100);
    assert.equal((await pose()).active, 0);
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await open(false, true, false);
    assert.equal(await page.locator('[data-motion]').isChecked(), false);
    await page.locator('[data-next]').click();
    assert.equal((await pose()).active, 0);
    await page.locator('[data-reset]').click();
    await page.locator('[data-motion]').check();
    await page.locator('[data-next]').click();
    await wait(130);
    assert((await pose()).x > 5 && (await pose()).x < 95);

    // Preference changes and hidden tabs stop both clock and visuals; restoring a tab never autoplays.
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await open();
    await page.locator('[data-play]').click();
    await page.waitForFunction(() => player.get() === 1);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.waitForFunction(() => document.querySelector('[data-play]').getAttribute('aria-pressed') === 'false');
    assert.equal(await page.locator('[data-motion]').isChecked(), true, 'A system change pauses playback without disabling the default motion choice.');
    await wait(40);
    const preferencePause = await pose();
    await wait(150);
    assert.deepEqual(await pose(), preferencePause);
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.evaluate(() => player.play());
    await wait(80);
    await page.evaluate(() => { Object.defineProperty(document,'hidden',{configurable:true,value:true}); document.dispatchEvent(new Event('visibilitychange')); });
    await wait(40);
    const hidden = await pose();
    await wait(350);
    assert.deepEqual(await pose(), hidden);
    await page.evaluate(() => { Object.defineProperty(document,'hidden',{configurable:true,value:false}); document.dispatchEvent(new Event('visibilitychange')); });
    await wait(120);
    assert.equal((await pose()).playing, 'false');
    await page.evaluate(() => player.play());
    await page.waitForFunction(() => document.querySelector('[data-play]').textContent === 'Replay');

    // Cleanup prevents every future frame, control listener, and idle callback.
    await page.evaluate(() => { player.reset(); player.go(1,{instant:false}); });
    await wait(70);
    await page.evaluate(() => player.destroy());
    const afterDestroy = await pose(), destroyedUpdates = await page.evaluate(() => updates);
    await wait(700);
    assert.deepEqual(await pose(), afterDestroy);
    assert.equal(await page.evaluate(() => updates), destroyedUpdates);
    await page.locator('[data-next]').click();
    assert.equal((await pose()).index, afterDestroy.index);

    // Missing WAAPI settles CSS correctly; the numeric SVG/Canvas clock still works.
    await open(true);
    await page.locator('[data-next]').click();
    assert.equal((await pose()).x, 100);
    assert.equal(await page.locator('#marker').evaluate(el => getComputedStyle(el).opacity), '0');
    await wait(120);
    assert((await pose()).value > 0 && (await pose()).value < 1);
    await page.evaluate(() => scene.finish());
    assert.equal((await pose()).value, 1);
    assert.equal((await pose()).active, 0);
    await assert.rejects(() => page.evaluate(() => scene.to(ball,{width:'100px'})), /supports only/);
    await assert.rejects(() => page.evaluate(() => scene.setRate(0)), /positive/);
    await assert.rejects(() => page.evaluate(() => LearningUI.createScene(document.querySelector('#player'),{motion:'invalid'})), /motion must be/);
    await assert.rejects(() => page.evaluate(() => scene.tween('bad',{to:NaN,update(){}})), /finite/);
    assert.deepEqual(failures, []);
  } finally {
    await context.close();
  }
}
module.exports = { checkScenes };
if (require.main === module) {
  (async () => {
    const { chromium } = require(process.env.LEARNING_PLAYWRIGHT_PATH || 'playwright');
    const browser = await chromium.launch({ headless: true, ...(process.env.LEARNING_BROWSER_EXECUTABLE ? { executablePath: process.env.LEARNING_BROWSER_EXECUTABLE } : {}) });
    try { await checkScenes({ browser }); console.log('Interactive scene checks passed.'); }
    finally { await browser.close(); }
  })().catch(error => { console.error(error); process.exitCode = 1; });
}
