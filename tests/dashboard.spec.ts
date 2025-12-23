import { test, expect, type Page } from '@playwright/test';

async function loginAs(page: Page, email: string, password: string) {
  await page.goto('/login');
  await expect(page).toHaveURL(/\/login/);

  await page.getByLabel('이메일').fill(email);
  await page.getByLabel('비밀번호').fill(password);
  await page.getByRole('button', { name: '로그인' }).click();

  await expect(page).toHaveURL('/', { timeout: 10000 });
}

test.describe('Dashboard (Overview / Active Plans)', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'test1@tms.com', 'test123!');
  });

  test('대시보드 섹션(Overview/Active Test Plans)이 렌더링된다', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Overview' })).toBeVisible({ timeout: 15000 });
    await expect(page.getByRole('heading', { name: 'Active Test Plans' })).toBeVisible();
  });

  test('Overview 카드(Active Plans) 클릭 시 /plans 로 이동한다', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Overview' })).toBeVisible({ timeout: 15000 });

    // 카드 내부 텍스트 클릭(버블링으로 카드 onClick 트리거)
    await page.getByText('ACTIVE PLANS', { exact: true }).click();
    await expect(page).toHaveURL(/\/plans$/, { timeout: 10000 });
    await expect(page.getByRole('heading', { name: '테스트 플랜', exact: true })).toBeVisible();
  });

  test('활성 플랜이 있으면 대시보드 카드에서 View Plan으로 상세 이동 가능', async ({ page }) => {
    const timestamp = Date.now();
    const tcTitle = `DASH_TC_${timestamp}`;
    const planName = `Dashboard Plan ${timestamp}`;

    const token = await page.evaluate(() => localStorage.getItem('accessToken'));
    if (!token) throw new Error('accessToken missing');

    const planId = await page.evaluate(
      async ({ token, tcTitle, planName }) => {
        const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

        const tcRes = await fetch('/api/testcases', {
          method: 'POST',
          headers,
          body: JSON.stringify({ title: tcTitle, priority: 'MEDIUM' }),
        });
        if (!tcRes.ok) throw new Error(`Failed to create testcase: ${tcRes.status}`);
        const tcJson = await tcRes.json();
        const testCaseId = tcJson?.data?.id;
        if (!testCaseId) throw new Error('testCaseId missing');

        const planRes = await fetch('/api/plans', {
          method: 'POST',
          headers,
          body: JSON.stringify({ name: planName, testCaseIds: [testCaseId] }),
        });
        if (!planRes.ok) throw new Error(`Failed to create plan: ${planRes.status}`);
        const planJson = await planRes.json();
        return planJson?.data?.id as string;
      },
      { token, tcTitle, planName }
    );

    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Active Test Plans' })).toBeVisible({ timeout: 15000 });

    // 카드에 플랜 이름이 노출되어야 함
    await expect(page.getByRole('heading', { name: planName })).toBeVisible();

    // View Plan 클릭 → 상세로 이동 (여러 카드가 있을 수 있어 planId로 정확히 클릭)
    await page.locator(`a[href="/plans/${planId}"]`, { hasText: 'View Plan' }).click();
    await expect(page).toHaveURL(new RegExp(`/plans/${planId}$`), { timeout: 10000 });
    await expect(page.getByRole('heading', { name: planName })).toBeVisible({ timeout: 15000 });
  });
});


