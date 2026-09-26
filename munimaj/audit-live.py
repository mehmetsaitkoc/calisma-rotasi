"""Read-only audit. Never submits a form or changes the deployed service."""
import asyncio, json, pathlib, os
from playwright.async_api import async_playwright

async def main():
    out = pathlib.Path('munimaj-baseline'); out.mkdir(exist_ok=True)
    report = []
    async with async_playwright() as p:
        browser = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
        for width, height in [(1440,1000),(390,844)]:
            page = await browser.new_page(viewport={'width':width,'height':height},device_scale_factor=1)
            errors=[]; page.on('pageerror', lambda e:errors.append(str(e)))
            response=await page.goto('https://munimaj-demo.onrender.com',wait_until='domcontentloaded',timeout=120000)
            await page.wait_for_timeout(3500)
            await page.evaluate('window.scrollTo(0,document.body.scrollHeight)')
            await page.wait_for_timeout(2500)
            await page.evaluate('window.scrollTo(0,0)')
            await page.screenshot(path=str(out/f'live-{width}.png'),full_page=True)
            (out/f'live-{width}.html').write_text(await page.content())
            images=await page.locator('img').evaluate_all('(a)=>a.map(i=>({src:i.currentSrc,ok:i.complete&&i.naturalWidth>0,alt:i.alt}))')
            report.append({'viewport':[width,height],'status':response.status,'url':page.url,'pageErrors':errors,'images':images,'horizontalOverflow':await page.evaluate('document.documentElement.scrollWidth>innerWidth')})
            await page.close()
        await browser.close()
    (out/'audit.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
asyncio.run(main())
