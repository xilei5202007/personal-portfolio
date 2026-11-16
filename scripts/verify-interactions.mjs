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

export async function verifyStudyPresentation(context, origin) {
  const results = [];
  const viewports = [{width:1440, height:900}, {width:768, height:1024}, {width:390, height:844}];
  for (const lang of ['zh', 'en']) {
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    try {
      for (const viewport of viewports) {
        await page.setViewportSize(viewport);
        await page.goto(`${origin}/${lang}`, {waitUntil:'networkidle'});
        const cards = page.locator('.recent-study');
        assert.ok(await cards.count() > 0, `${lang}: recent studies are present`);
        for (const card of await cards.all()) {
          assert.ok((await card.getAttribute('href')).startsWith(`/${lang}/game-analysis/`));
          assert.ok((await card.locator('h3').innerText()).trim());
          assert.ok((await card.locator('p').innerText()).trim());
          assert.equal(await card.locator('.recent-study-meta span').count(), 2);
          const image = card.locator('img');
          await image.scrollIntoViewIfNeeded();
          await page.waitForFunction(el => el.complete && el.naturalWidth > 0, await image.elementHandle());
        }
        const home = await page.evaluate(() => ({
          viewport:window.innerWidth,
          width:document.documentElement.scrollWidth,
          robots:document.querySelector('meta[name="robots"]')?.content,
          gridColumns:getComputedStyle(document.querySelector('.recent-studies')).gridTemplateColumns.split(' ').length,
          cards:[...document.querySelectorAll('.recent-study')].map(el => ({
            width:el.getBoundingClientRect().width,
            contentWidth:el.scrollWidth,
          })),
        }));
        assert.ok(home.width <= home.viewport + 1, `${lang}: home has no horizontal overflow`);
        const expectedColumns = viewport.width <= 700 ? 1 : viewport.width <= 900 ? 2 : 3;
        assert.equal(home.gridColumns, expectedColumns, `${lang}: recent studies use ${expectedColumns} columns`);
        assert.match(home.robots ?? '', /index/);
        assert.doesNotMatch(home.robots ?? '', /noindex|nofollow/);
        for (const card of home.cards) {
          assert.ok(card.contentWidth <= card.width + 1, `${lang}: study text fits its card`);
        }
        await page.goto(`${origin}/${lang}/game-analysis`, {waitUntil:'networkidle'});
        const urls = await page.locator('a[href]').evaluateAll((links, prefix) =>
          [...new Set(links.map(link => link.href).filter(href => href.startsWith(prefix)))],
        `${origin}/${lang}/game-analysis/`);
        assert.ok(urls.length > 0, `${lang}: study listing links exist`);
        if (lang === 'en') {
          for (const url of urls) {
            await page.goto(url, {waitUntil:'networkidle'});
            assert.ok(await page.locator('#abstract .prose h2').count() > 0, `${url}: English sections exist`);
            assert.doesNotMatch(await page.locator('#abstract .note').innerText(), /in progress/i);
            const anchors = await page.locator('.reading-nav nav a').evaluateAll(links =>
              links.map(link => ({href:link.getAttribute('href'), exists:Boolean(document.getElementById(link.hash.slice(1)))})));
            assert.ok(anchors.length > 1, `${url}: section navigation exists`);
            assert.deepEqual(anchors.filter(link => !link.exists), [], `${url}: all reading anchors resolve`);
            const tocToggle = page.locator('.toc-toggle');
            if (await tocToggle.isVisible() && await tocToggle.getAttribute('aria-expanded') !== 'true') {
              await tocToggle.click();
            }
            await page.locator('.reading-nav nav a[href="#section-1"]').click();
            await page.waitForURL(`${url}#section-1`);
            assert.equal(await page.evaluate(() => document.activeElement?.id), 'section-1');
            assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), `${url}: no horizontal overflow`);
          }
        }
        results.push(`${lang} ${viewport.width}px: study cards, images, metadata, listing and reading anchors passed`);
      }
      assert.deepEqual(errors, [], `${lang}: presentation browser errors`);
    } finally { await page.close(); }
  }
  return results;
}
