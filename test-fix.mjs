import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  let hasError = false;
  page.on('console', msg => {
    if (msg.type() === 'error' && msg.text().includes('Maximum update depth')) {
      hasError = true;
      console.log('❌ Still has Maximum update depth error');
    }
  });
  
  await page.goto('http://127.0.0.1:5173/strategy-quiz/practice', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  
  const buttons = await page.$$('.option-card');
  console.log(`Found ${buttons.length} option-card buttons`);
  
  // 点击第一个选项
  console.log('Clicking first option (A)...');
  await buttons[0].click();
  await page.waitForTimeout(500);
  
  // 检查是否有反馈
  const feedback = await page.$('.feedback-panel');
  console.log('Has feedback panel:', feedback !== null);
  
  // 检查按钮状态
  const firstBtn = buttons[0];
  const classes = await firstBtn.getAttribute('class');
  console.log('First button classes after click:', classes);
  
  if (classes && (classes.includes('is-correct') || classes.includes('is-wrong') || classes.includes('is-selected'))) {
    console.log('✅ Click worked! Button has state class');
  } else {
    console.log('❌ Click did not change button state');
  }
  
  await page.screenshot({ path: '/tmp/practice-fixed.png', fullPage: false });
  console.log('Screenshot saved');
  
  if (!hasError) {
    console.log('✅ No Maximum update depth error');
  }
  
  await browser.close();
})();
