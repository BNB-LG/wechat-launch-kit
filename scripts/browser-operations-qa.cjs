// Synthetic local workbench checks; run with playwright-cli run-code --filename.
async (page) => {
  const checks=[],errors=[];
  const check=(name,ok)=>{if(!ok)throw Error(name);checks.push(name);};
  page.on('pageerror',e=>errors.push(e.message));await page.reload();
  await page.locator('[data-path="project.version"]').fill('1.2.3');
  await page.locator('[data-path="monetization.ads.intent"]').selectOption('traffic-owner');
  await page.locator('[data-path="monetization.payment.intent"]').selectOption('none');
  await page.locator('[data-path="monetization.payment.longTermNoVirtualPayment"]').selectOption('true');
  await page.locator('#refresh-checklist').click();
  check('selected advertising route creates five preparation rows',await page.locator('.checklist-row').count()===5);
  const first=page.locator('.checklist-row').first();await first.locator('[data-key="status"]').selectOption('ready');await first.locator('[data-key="evidence"]').fill('合成测试：已核对当前页面资格，未申请');
  await page.locator('#material-slot').selectOption('general-cover');await page.locator('#add-material').click();
  const cover=page.locator('.material-row').first();await cover.locator('[data-key="path"]').fill('materials/cover.jpg');await cover.locator('[data-key="description"]').fill('合成测试素材说明');
  await page.locator('#material-slot').selectOption('promotion-video');await page.locator('#add-material').click();
  await page.locator('.material-row').nth(1).locator('[data-key="path"]').fill('materials/demo.mp4');
  await page.locator('#refresh').click();await page.locator('#refresh-checklist').click();await page.locator('#refresh').click();
  let m=JSON.parse(await page.locator('#json-editor').inputValue());
  check('media versions inherit current version',m.operations.materials.every(x=>x.version==='1.2.3'));
  check('cover has account-specific JPEG profile',m.operations.materials[0].constraints.width===650&&m.operations.materials[0].constraints.maxBytes===80000);
  check('video limits remain unverified',!m.operations.materials[1].constraints.maxDurationSeconds);
  check('refresh preserves media and prepared checklist evidence',m.operations.materials.length===2&&m.monetization.ads.materials[0].status==='ready'&&m.monetization.ads.materials[0].evidence.includes('合成测试'));
  check('no-payment scope remains boolean',m.monetization.payment.intent==='none'&&m.monetization.payment.longTermNoVirtualPayment===true);
  check('preparation does not elevate application or release status',m.monetization.ads.status==='unknown'&&m.release.stage==='draft');
  await page.locator('[data-path="monetization.payment.intent"]').selectOption('game-iap');await page.locator('#refresh').click();
  check('scope conflict is visible',(await page.locator('#issues').textContent()).includes('长期不虚拟支付'));
  await page.locator('[data-path="monetization.payment.intent"]').selectOption('none');await page.locator('#refresh').click();
  const downloaded=page.waitForEvent('download');await page.locator('#download-html').click();check('operations report downloads',(await downloaded).suggestedFilename()==='copy-fields.html');
  await page.locator('.material-row').last().locator('button').click();await page.locator('#refresh').click();m=JSON.parse(await page.locator('#json-editor').inputValue());check('explicit media removal preserves cover',m.operations.materials.length===1&&m.operations.materials[0].path==='materials/cover.jpg');
  for(const width of [390,768,1360]){await page.setViewportSize({width,height:900});check('operations fit viewport '+width,await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));}
  await page.screenshot({path:'output/playwright/operations.png',fullPage:true});
  await page.reload();const imported=await page.evaluate(()=>{const m=LaunchKit.template('minigame');m.project.version='1.2.3';const a=LaunchKit.operations.material('general-cover','1.2.3');a.id='general-cover-1';a.path='materials/imported.jpg';m.operations.materials=[a];return m;});
  await page.locator('details').filter({has:page.locator('#json-editor')}).locator('summary').click();await page.locator('#json-editor').fill(JSON.stringify(imported));await page.locator('#apply-json').click();await page.locator('#material-slot').selectOption('general-cover');await page.locator('#add-material').click();await page.locator('#refresh').click();m=JSON.parse(await page.locator('#json-editor').inputValue());check('imported material IDs remain unique when adding',new Set(m.operations.materials.map(x=>x.id)).size===2);
  check('no browser errors',errors.length===0);return {passed:checks.length,checks,errors};
}
