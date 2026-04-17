import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  let hasError = false;
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log(`[Error] ${msg.text()}`);
      if (msg.text().includes('Maximum update depth')) {
        hasError = true;
      }
    }
  });
  
  console.log('Testing GitHub Pages...');
  await page.goto('https://yourkaikai.github.io/strategy-quiz/practice', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  
  const buttons = await page.$$('.option-card');
  console.log(`Found ${buttons.length} option buttons`);
  
  if (buttons.length > 0) {
    console.log('Clicking first option...');
    await buttons[0].click();
    await page.waitForTimeout(500);
    
    const firstBtn = buttons[0];
    const classes = await firstBtn.getAttribute('class');
    console.log('Button classes after click:', classes);
    
    if (classes && classes.includes('is-')) {
      console.log('✅ Click worked!');
    } else {
      console.log('❌ Click did not work');
    }
  }
  
  if (hasError) {
    console.log('❌ Still has infinite loop error');
  } else {
    console.log('✅ No infinite loop error');
  }
  
  await browser.close();
})();
