import { test, expect } from '@playwright/test';

test('Plan Execution: Result update, Comment, and Bulk update', async ({ page }) => {
  test.setTimeout(60000); 

  const timestamp = Date.now();
  const adminEmail = 'julim@krafton.com';
  const adminPassword = '123456';
  
  // Unique test case titles
  const tcTitle1 = `TC_001_Login_${timestamp}`;
  const tcTitle2 = `TC_002_Search_${timestamp}`;
  const tcTitle3 = `TC_003_Checkout_${timestamp}`;

  console.log('Starting test...');

  // 1. Login as Admin
  await page.goto('/login');
  await page.fill('#email', adminEmail);
  await page.fill('#password', adminPassword);
  await page.getByRole('button', { name: '로그인' }).click();
  
  // Wait for login to complete
  await expect(page).toHaveURL('/', { timeout: 10000 });
  console.log('Login successful, current URL:', page.url());

  // Check Token
  const token = await page.evaluate(() => localStorage.getItem('accessToken'));
  if (!token) {
    throw new Error('Login seemed successful but accessToken is missing');
  }

  // 2. Setup Data (TestCases) via API
  console.log('Creating test cases...');
  await page.evaluate(async ({ token, titles }) => {
    const headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };
    
    const createTestCase = async (title: string, priority: string) => {
      const res = await fetch('/api/testcases', {
        method: 'POST', headers,
        body: JSON.stringify({ title, priority })
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Failed to create test case: ${res.status} ${text}`);
      }
      return res.json();
    };

    await createTestCase(titles[0], 'HIGH');
    await createTestCase(titles[1], 'MEDIUM');
    await createTestCase(titles[2], 'LOW');
  }, { token, titles: [tcTitle1, tcTitle2, tcTitle3] });
  console.log('Test cases created.');

  // 3. Create Plan
  console.log('Navigating to /plans');
  await page.goto('/plans');
  
  // Ensure we are on the plans page
  await expect(page.getByRole('heading', { name: '테스트 플랜' })).toBeVisible();

  console.log('Clicking Create Plan');
  await page.getByText('플랜 생성').click();
  await page.fill('input[placeholder*="예: 2024"]', `Execution Plan ${timestamp}`);
  
  // Wait for test cases to load - use the new titles to filter/search if needed, 
  // but here we rely on sorting/list. To be safer, we search for our specific test cases or assume they appear.
  // Given the "Select All" logic, we might select other existing cases too, but that's fine as long as our target cases are included.
  // Ideally, we should search for our unique cases.
  
  await page.waitForSelector('input[type="text"]'); // Search input
  await page.fill('input[placeholder="제목 검색..."]', timestamp.toString()); // Filter by timestamp to select only these 3
  
  // Wait for filter to apply
  await page.waitForTimeout(500); 

  // Select All (Filtered)
  await page.locator('.bg-gray-50 input[type="checkbox"]').click(); 
  
  await page.getByRole('button', { name: '플랜 생성' }).click();
  console.log('Plan created.');
  
  // 4. Enter Plan Detail
  await expect(page).toHaveURL('/plans');
  await page.getByText(`Execution Plan ${timestamp}`).click();
  await expect(page).toHaveURL(/\/plans\//);
  console.log('Entered plan detail page.');
  
  // Verify initial state
  await expect(page.getByText(tcTitle1)).toBeVisible();
  
  // Note: If other test cases exist in the system from previous runs, "Select All" might have picked them up if we didn't filter.
  // But since we filtered by timestamp, only our 3 cases should be in this plan.
  // So 0% progress is correct.
  await expect(page.getByText('0%')).toBeVisible(); 

  // 5. Test Individual Update (TC_001 -> PASS)
  // Use .first() just in case, but titles should be unique now.
  const row1 = page.locator('tr', { hasText: tcTitle1 }).first();
  const select1 = row1.locator('select');
  
  await select1.selectOption('PASS');
  
  // Verify update: The select value should be PASS
  await expect(select1).toHaveValue('PASS');
  
  // Verify visual feedback (class should contain bg-green-100)
  // We wait a bit for react state update if needed, but toHaveValue handles it usually.
  // Checking class might be flaky if class logic is complex, but let's try.
  await expect(select1).toHaveClass(/bg-green-100/);
  
  // Progress should be 33% (1/3)
  await expect(page.getByText('33%')).toBeVisible();
  console.log('Individual update passed.');

  // 6. Test Comment with Link (TC_001)
  await row1.locator('button').click();
  await expect(page.getByText('메모 입력')).toBeVisible();
  
  const commentText = 'Tested on https://example.com';
  await page.locator('textarea').fill(commentText);
  await page.getByRole('button', { name: '저장' }).click();
  
  await expect(page.getByText('메모 입력')).not.toBeVisible();
  await expect(row1.locator('a[href="https://example.com"]')).toBeVisible();
  console.log('Comment update passed.');

  // 7. Test Bulk Update
  const row2 = page.locator('tr', { hasText: tcTitle2 }).first();
  const row3 = page.locator('tr', { hasText: tcTitle3 }).first();
  
  await row2.locator('input[type="checkbox"]').check();
  await row3.locator('input[type="checkbox"]').check();
  await expect(page.getByText('2개 선택됨')).toBeVisible();
  
  await page.locator('div.animate-fade-in select').selectOption('FAIL');
  
  // Handle confirm dialog
  page.once('dialog', dialog => dialog.accept());
  
  await page.getByText('일괄 적용').click();
  
  // Wait for bulk update to process
  await page.waitForTimeout(1000);

  // In the bulk update section, we also need to check the SELECT element, not span.
  const select2 = row2.locator('select');
  const select3 = row3.locator('select');

  await expect(select2).toHaveValue('FAIL');
  await expect(select2).toHaveClass(/bg-red-100/);
  
  await expect(select3).toHaveValue('FAIL');
  await expect(select3).toHaveClass(/bg-red-100/);
  
  // Progress should be 100%
  await expect(page.getByText('100%')).toBeVisible();
  console.log('Bulk update passed.');

  console.log('All tests passed.');
});
