/* Development-only checks. Install Playwright separately, then:
 * PLAYWRIGHT_MODULE=/path/to/playwright CHROMIUM_EXECUTABLE=/path/to/chrome node tests/browser.cjs
 * Omit either variable when the normal Playwright module/browser installation is available.
 */
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const { pathToFileURL } = require('node:url');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const url = pathToFileURL(path.resolve(__dirname, '../index.html')).href;
const visuals = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../content/visuals.json'), 'utf8'));

(async () => {
  const browser = await chromium.launch({headless:true,...(process.env.CHROMIUM_EXECUTABLE ? {executablePath:process.env.CHROMIUM_EXECUTABLE} : {})});
  const context = await browser.newContext({viewport:{width:1440,height:1000}});
  const page = await context.newPage();
  const errors=[],network=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('request',r=>{if(/^https?:/.test(r.url()))network.push(r.url());});
  async function section(id){await page.evaluate(id=>{location.hash=id;},id);await page.waitForFunction(id=>document.getElementById(id).getBoundingClientRect().height>0,id);}
  await page.goto(url);
  assert.equal(await page.locator('article.page:visible').count(),1);
  await section('c21');
  assert.equal(await page.locator('.practice-question:visible').count(),90);
  assert.equal(await page.locator('#q01 .practice-explanation').isVisible(),false);
  const correct=await page.locator('#q01').getAttribute('data-answer');
  await page.locator('#q01 input[value="'+correct+'"]').check();
  await page.locator('#q01 summary').click();
  assert.equal(await page.locator('#q01 .practice-explanation').isVisible(),true);
  await page.locator('#practice-grade').click();
  assert.match(await page.locator('#practice-results').innerText(),/1 correct of 90/);
  await page.locator('#practice-scope').selectOption('diagnostic');
  assert.equal(await page.locator('.practice-question:visible').count(),13);
  await page.reload();
  assert.equal(await page.locator('.practice-question:visible').count(),13);
  assert.equal(await page.locator('#q01 input[value="'+correct+'"]').isChecked(),true);
  // A map link opens both the right page and an item hidden by the active filter.
  await section('coverage');
  await page.locator('#coverage a[href="#q58"]').first().click();
  assert.equal(await page.locator('#q58').isVisible(),true);
  assert.equal(await page.locator('#practice-scope').inputValue(),'all');
  assert.equal(await page.locator('article.page:visible').count(),1);
  // Browser back restores the map through hash navigation.
  await page.goBack();
  assert.equal(await page.locator('#coverage').isVisible(),true);
  await section('c21');
  page.once('dialog',d=>d.accept());await page.locator('#practice-timed').click();
  assert.equal(await page.locator('#practice-scope').isDisabled(),true);
  await page.locator('#q01 summary').click();
  assert.equal(await page.locator('#q01 details').getAttribute('open'),null);
  assert.match(await page.locator('#practice-timer').innerText(),/Time remaining/);
  // Native arrow navigation inside a radio group must not switch book chapters.
  await page.locator('#q01-0').focus();await page.keyboard.press('ArrowRight');
  assert.equal(await page.locator('#c21').isVisible(),true);
  await page.reload();
  assert.equal(await page.locator('#practice-scope').isDisabled(),true);
  page.once('dialog',d=>d.accept());await page.locator('#practice-grade').click();
  assert.equal(await page.locator('#practice-scope').isDisabled(),false);
  // Export is local and contains the selected record.
  const downloadPromise=page.waitForEvent('download');await page.locator('#practice-export').click();
  const download=await downloadPromise;assert.equal(download.suggestedFilename(),'aaism-learning-record.json');
  await section('map');
  const open=page.locator('#figure-1 .figure-open');await open.focus();await page.keyboard.press('Enter');
  assert.equal(await page.locator('#lb').isVisible(),true);
  assert.equal(await page.locator('#lbX').evaluate(e=>e===document.activeElement),true);
  await page.keyboard.press('Tab');assert.equal(await page.locator('#lbFit').evaluate(e=>e===document.activeElement),true);
  await page.keyboard.press('Escape');
  assert.equal(await open.evaluate(e=>e===document.activeElement),true);
  assert.equal(await page.locator('[data-modal-inert]').count(),0);
  // Every new illustration is in its teaching section and its labels fit the artwork.
  for (const visual of visuals) {
    await section(visual.chapter);
    const figure=page.locator('#visual-'+visual.id);
    assert.equal(await figure.isVisible(),true);
    const clipped=await figure.locator('svg').evaluate(svg=>{
      const vb=svg.viewBox.baseVal;
      const panels=Array.from(svg.querySelectorAll('rect')).map(r=>r.getBBox()).filter(r=>r.width<950);
      return Array.from(svg.querySelectorAll('text')).filter(t=>{
        const b=t.getBBox(),x=Number(t.getAttribute('x')),y=Number(t.getAttribute('y'));
        if(b.x<0||b.y<0||b.x+b.width>vb.width+1||b.y+b.height>vb.height+1)return true;
        const r=panels.filter(r=>x>=r.x&&x<=r.x+r.width&&y>=r.y&&y<=r.y+r.height).sort((a,b)=>a.width*a.height-b.width*b.height)[0];
        return r&&(b.x<r.x+3||b.x+b.width>r.x+r.width-3||b.y<r.y-1||b.y+b.height>r.y+r.height+1);
      }).map(t=>t.textContent);
    });
    assert.deepEqual(clipped,[],visual.id);
  }
  // Continuous mode contains every chapter; position resumes without a URL fragment.
  await page.locator('#mFlow').click();assert.equal(await page.locator('article.page:visible').count(),39);
  await section('c16');await page.waitForTimeout(300);
  const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('aaism-book:v2:pos')));
  assert.equal(saved.id,'c16');assert.equal(saved.flow,true);
  await page.goto(url);assert.equal(await page.locator('article.page:visible').count(),39);
  assert.match(await page.locator('#resume').innerText(),/Data controls/);
  // Small screens should not create document-wide horizontal scrolling.
  await page.setViewportSize({width:390,height:844});
  await page.locator('.mobile-toc-toggle').click();
  assert.equal(await page.locator('.mobile-toc-toggle').getAttribute('aria-expanded'),'true');
  await page.locator('#mPage').click();await section('c21');
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1));
  await section('c15');assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1));
  const viewport=page.locator('#visual-release-gates .visual-viewport');
  assert.ok(await viewport.evaluate(e=>e.scrollWidth>e.clientWidth));
  await viewport.focus();await page.keyboard.press('ArrowRight');
  await page.waitForFunction(()=>document.querySelector('#visual-release-gates .visual-viewport').scrollLeft>0);
  assert.equal(await page.locator('#c15').isVisible(),true);
  await viewport.click();assert.equal(await page.locator('#lb').isVisible(),false);
  const visualOpen=page.locator('#visual-release-gates .figure-open');
  await visualOpen.focus();await page.keyboard.press('Enter');
  assert.equal(await page.locator('#lb').isVisible(),true);
  assert.equal(await page.locator('#lbInner svg').evaluate(svg=>svg.getAttribute('aria-labelledby').split(/\s+/).every(id=>svg.querySelector('[id="'+id+'"]'))),true);
  assert.equal(await page.evaluate(()=>{const ids=Array.from(document.querySelectorAll('[id]'),e=>e.id);return ids.length===new Set(ids).size;}),true);
  await page.locator('#lbBig').click();assert.ok(await page.locator('#lbInner').evaluate(e=>e.getBoundingClientRect().width>window.innerWidth));
  await page.keyboard.press('Escape');assert.equal(await visualOpen.evaluate(e=>e===document.activeElement),true);
  await page.locator('#mFlow').click();
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1));
  await page.locator('#mPage').click();
  // Printable practice: all choices, no solutions or unrelated chapters.
  await section('c21');await page.evaluate(()=>document.body.classList.add('print-questions'));
  await page.emulateMedia({media:'print'});
  assert.equal(await page.locator('.practice-question:visible').count(),90);
  assert.equal(await page.locator('.practice-explanation:visible').count(),0);
  assert.equal(await page.locator('article.page:visible').count(),1);
  assert.equal(await page.locator('.study-visual:visible').count(),0);
  await page.emulateMedia({media:'screen'});await page.evaluate(()=>document.body.classList.remove('print-questions'));
  await page.emulateMedia({media:'print'});
  assert.equal(await page.locator('.study-visual:visible').count(),visuals.length);
  assert.equal(await page.locator('.visual-help:visible').count(),0);
  assert.ok(await page.locator('#visual-release-gates svg').evaluate(e=>e.getBoundingClientRect().width<=e.closest('figure').getBoundingClientRect().width));
  await page.emulateMedia({media:'screen'});
  assert.deepEqual(errors,[]);assert.deepEqual(network,[]);
  // Both storage denial and JS-disabled reading remain useful.
  const blocked=await browser.newContext();const bp=await blocked.newPage();
  await bp.addInitScript(()=>Object.defineProperty(window,'localStorage',{get(){throw new Error('blocked');}}));
  await bp.goto(url+'#c21');assert.equal(await bp.locator('#q01').isVisible(),true);await bp.locator('#q01-0').check();
  const nojs=await browser.newContext({javaScriptEnabled:false});const np=await nojs.newPage();await np.goto(url);
  assert.equal(await np.locator('article.page:visible').count(),39);
  assert.equal(await np.locator('#q01 input').count(),4);
  await browser.close();
  console.log('Browser checks passed: offline, navigation/back, practice, persistence, timing, export, all illustration labels, keyboard scrolling, accessible SVG enlargement, responsive layout, print, blocked storage and no-JS.');
})().catch(e=>{console.error(e);process.exit(1);});
