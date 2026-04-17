import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  // 启用控制台日志
  page.on('console', msg => {
    console.log(`[${msg.type()}] ${msg.text()}`);
  });
  
  await page.goto('http://127.0.0.1:5173/strategy-quiz/practice', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  
  // 点击第一个选项
  console.log('\n--- Before click ---');
  let selected = await page.$('.option-card.is-selected, .option-card.is-correct, .option-card.is-wrong');
  console.log('Has selected/correct/wrong class:', selected !== null);
  
  const buttons = await page.$$('.option-card');
  console.log(`Clicking button: "${(await buttons[0].textContent())?.substring(0, 20)}..."`);
  await buttons[0].click();
  await page.waitForTimeout(1000);
  
  console.log('\n--- After click ---');
  
  // 检查是否有反馈面板
  const feedback = await page.$('.feedback-panel');
  console.log('Has feedback panel:', feedback !== null);
  
  // 检查按钮状态
  const firstBtn = buttons[0];
  const classes = await firstBtn.getAttribute('class');
  console.log('First button classes:', classes);
  
  // 检查是否有正确/错误状态
  selected = await page.$('.option-card.is-selected, .option-card.is-correct, .option-card.is-wrong');
  console.log('Has selected/correct/wrong class:', selected !== null);
  
  // 截图
  await page.screenshot({ path: '/tmp/practice-check.png', fullPage: false });
  console.log('\nScreenshot saved to /tmp/practice-check.png');
  
  await browser.close();
})();
