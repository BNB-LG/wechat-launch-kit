// Run this function via playwright-cli run-code against the local workbench.
async (page) => {
  const checks=[],errors=[];
  const check=(name,ok)=>{if(!ok)throw Error(name);checks.push(name);};
  page.on('pageerror',e=>errors.push(e.message));
  await page.reload();
  await page.locator('#field-total').filter({hasText:'项'}).waitFor();
  check('workbench script loads',await page.locator('.system-row').count()===3);
  const fixture=await page.evaluate(()=>{
    const m=LaunchKit.template('minigame');
    m.project.name='测试滑板';m.project.version='0.1.0';
    m.privacy.dataItems=[{name:'本地成绩',purpose:'展示最高分',storage:'本机',retention:'直到清理',deletion:'清理缓存',evidence:'storage.js:1',autoExpires:false,customFlag:'preserved'}, {name:'声音设置',purpose:'记住声音开关',storage:'本机',retention:'直到清理',deletion:'清理缓存',evidence:'settings.js:1'}];
    m.content.systems=[{id:'score',type:'自定义系统',name:'计分',description:'计分说明'},{id:'pause',type:'自定义系统',name:'暂停',description:'暂停说明'},{id:'settings',type:'设置系统',name:'设置',description:'设置说明'}];
    m.screenshots=[{path:'shots/settings.png',column:'system',systemId:'settings',source:'wechat-device',version:'0.1.0',description:'设置页'}];
    return m;
  });
  await page.locator('details').filter({has:page.locator('#json-editor')}).locator('summary').click();
  await page.locator('#json-editor').fill(JSON.stringify(fixture));
  await page.locator('#apply-json').click();
  check('all imported data rows shown',await page.locator('.data-row').count()===2);
  await page.locator('#refresh').click();await page.locator('#refresh').click();
  let m=JSON.parse(await page.locator('#json-editor').inputValue());
  check('repeated refresh preserves every data item',m.privacy.dataItems.length===2&&m.privacy.dataItems[1].name==='声音设置');
  check('unknown data metadata preserved',m.privacy.dataItems[0].customFlag==='preserved');
  await page.locator('[data-system-id="score"] .remove-system').click();
  await page.locator('#refresh').click();m=JSON.parse(await page.locator('#json-editor').inputValue());
  check('system ids do not shift after deletion',m.content.systems[0].id==='pause'&&m.content.systems[1].id==='settings');
  check('screenshot target remains stable',m.screenshots[0].systemId==='settings');
  if(!await page.locator('.data-row').first().locator('.remove-data').isVisible())await page.locator('details').filter({has:page.locator('#data-items')}).locator('summary').click();
  await page.locator('.data-row').first().locator('.remove-data').click();
  await page.locator('#refresh').click();m=JSON.parse(await page.locator('#json-editor').inputValue());
  check('explicit data removal preserves next item',m.privacy.dataItems.length===1&&m.privacy.dataItems[0].name==='声音设置');
  await page.locator('#add-data').click();
  await page.locator('.data-row').last().locator('[data-key="name"]').fill('新设置');
  await page.locator('#refresh').click();
  check('can add another data item',JSON.parse(await page.locator('#json-editor').inputValue()).privacy.dataItems.length===2);
  await page.locator('[data-path="project.name"]').fill('<img src=x onerror=alert(1)>');
  await page.locator('#refresh').click();
  check('field values are not rendered as HTML',await page.locator('#fields img').count()===0);
  await page.locator('[data-path="project.name"]').fill('测试滑板');
  for(const [id,filename] of [['download-json','manifest.private.json'],['download-html','copy-fields.html'],['download-md','submission.md'],['download-txt','submission.txt']]){
    const downloaded=page.waitForEvent('download');await page.locator('#'+id).click();const file=await downloaded;
    check('download '+filename,file.suggestedFilename()===filename);
  }
  const oldName=await page.locator('[data-path="project.name"]').inputValue();
  await page.locator('#json-editor').fill('{');await page.locator('#apply-json').click();
  check('invalid JSON reports error and retains form',(await page.locator('#status').textContent()).includes('未完成')&&(await page.locator('[data-path="project.name"]').inputValue())===oldName);
  await page.locator('#sync-json').click();
  for(const width of [390,768,1360]){
    await page.setViewportSize({width,height:900});
    check('no horizontal overflow '+width,await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  }
  await page.screenshot({path:'output/playwright/workbench.png',fullPage:true});
  check('no runtime errors '+JSON.stringify(errors),errors.length===0);
  return {passed:checks.length,checks,errors};
}
