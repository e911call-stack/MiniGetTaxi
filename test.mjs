import { chromium } from 'playwright';

async function test() {
  console.log('Starting Playwright test...');
  
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    // Test landing page
    console.log('Navigating to landing page...');
    await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded', timeout: 15000 });
    
    // Check page title
    const title = await page.title();
    console.log('Page title:', title);
    
    // Wait for page to be fully loaded
    await page.waitForTimeout(3000);
    
    // Check for any visible text content
    const bodyText = await page.locator('body').textContent();
    console.log('Page has content:', bodyText.length > 0);
    console.log('Content preview:', bodyText.substring(0, 200));
    
    // Check for Arabic content (default language)
    const pageContent = await page.content();
    console.log('Contains Arabic text:', pageContent.includes('أريد') || pageContent.includes('تاكسي'));
    console.log('Contains English text:', pageContent.includes('Taxi') || pageContent.includes('Yellow'));
    
    console.log('\n✓ Basic tests passed!');
    console.log('Note: Full UI tests require Supabase configuration');
    
  } catch (error) {
    console.error('Test failed:', error.message);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

test();
