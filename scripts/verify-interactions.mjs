import assert from 'node:assert/strict';

// Pass a Playwright context; any deployment credentials belong to the caller.
// Run against a production build: development did not expose the Link failure.
export async function verifyInteractions(context, origin) {
  const results = [];
  for (const lang of ['zh', 'en']) {
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    try {
      await page.goto(`${origin}/${lang}`, {waitUntil: 'networkidle'});
      await page.locator(`.desktop-nav a[href="/${lang}/projects"]`).click();
      await page.waitForURL(`${origin}/${lang}/projects`);
      await page.locator('.work-luanshi-zhiqi .work-image').click();
      await page.waitForURL(`${origin}/${lang}/projects/luanshi-zhiqi`);
      assert.match(await page.locator('h1').innerText(), /乱世执棋|Luanshi Zhiqi/);
      await page.locator('.back-link').click();
      await page.waitForURL(`${origin}/${lang}/projects`);
      await page.getByRole('textbox').fill('Luanshi');
      await page.getByRole('button', {name: lang === 'zh' ? '搜索' : 'Search', exact: true}).click();
      await page.waitForURL(`${origin}/${lang}/projects?q=Luanshi`);
      await page.waitForFunction(() => document.querySelectorAll('.projects-grid .work-card').length === 1);
      const other = lang === 'zh' ? 'en' : 'zh';
      await page.locator('.language-link').click();
      await page.waitForURL(`${origin}/${other}/projects?q=Luanshi`);
      assert.equal(await page.locator('html').getAttribute('lang'), other === 'zh' ? 'zh-CN' : 'en');
      await page.goto(`${origin}/${lang}/projects/luanshi-zhiqi`, {waitUntil:'networkidle'});
      await page.locator('.image-zoom').first().click();
      await page.getByRole('dialog').waitFor({state:'visible'});
      await page.keyboard.press('Escape');
      await page.getByRole('dialog').waitFor({state:'hidden'});
      await page.setViewportSize({width:390, height:844});
      await page.getByRole('button', {name:lang === 'zh' ? '打开菜单' : 'Open menu', exact:true}).click();
      await page.locator(`.mobile-links a[href="/${lang}/about"]`).click();
      await page.waitForURL(`${origin}/${lang}/about`);
      await page.getByRole('dialog').waitFor({state:'hidden'});
      const sound = page.getByRole('switch');
      const before = await sound.getAttribute('aria-checked');
      await sound.click();
      assert.notEqual(await sound.getAttribute('aria-checked'), before);
      assert.deepEqual(errors, [], `${lang} browser errors`);
      results.push(`${lang}: navigation, project links, search, language, lightbox, mobile menu, sound passed`);
    } finally { await page.close(); }
  }
  return results;
}
