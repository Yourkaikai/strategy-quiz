import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  await page.goto('http://127.0.0.1:5173/strategy-quiz/practice', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  
  await page.screenshot({ path: '/tmp/practice-page.png', fullPage: false });
  
  const buttons = await page.$$('.option-card');
  console.log(`Found ${buttons.length} option-card buttons`);
  
  for (let i = 0; i < Math.min(buttons.length, 4); i++) {
    const btn = buttons[i];
    const text = await btn.textContent();
    const isDisabled = await btn.getAttribute('disabled');
    console.log(`Button ${i}: "${text?.substring(0, 30)}..." | disabled: ${isDisabled}`);
  }
  
  if (buttons.length > 0) {
    console.log('\nClicking first option...');
    await buttons[0].click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: '/tmp/practice-after-click.png', fullPage: false });
    console.log('Screenshot saved');
  }
  
  await browser.close();
})();
