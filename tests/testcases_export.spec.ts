import { test, expect, type Page } from '@playwright/test';

async function loginAs(page: Page, email: string, password: string) {
  await page.goto('/login');
  await expect(page).toHaveURL(/\/login/);

  await page.getByLabel('이메일').fill(email);
  await page.getByLabel('비밀번호').fill(password);
  await page.getByRole('button', { name: '로그인' }).click();

  await expect(page).toHaveURL('/', { timeout: 10000 });
}

test.describe('TestCases Export (CSV/Excel)', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'admin@tms.com', 'admin123!');
  });

  test('Export: 전체 케이스를 CSV로 다운로드한다', async ({ page }) => {
    const timestamp = Date.now();
    const tcTitle = `EXPORT_TC_${timestamp}`;

    const token = await page.evaluate(() => localStorage.getItem('accessToken'));
    if (!token) throw new Error('accessToken missing');

    await page.evaluate(
      async ({ token, tcTitle }) => {
        const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
        const res = await fetch('/api/testcases', {
          method: 'POST',
          headers,
          body: JSON.stringify({ title: tcTitle, priority: 'MEDIUM' }),
        });
        if (!res.ok) throw new Error(`Failed to create testcase: ${res.status}`);
      },
      { token, tcTitle }
    );

    await page.goto('/testcases');
    await expect(page.getByRole('heading', { name: 'Test Cases' })).toBeVisible({ timeout: 15000 });
    // 목록/섹션 로딩 완료 및 방금 생성한 케이스가 화면에 나타날 때까지 대기
    await expect(page.getByText(tcTitle)).toBeVisible({ timeout: 15000 });

    // CSV Export는 Blob URL + a.click() 방식이라 Playwright download 이벤트가 항상 발생하지 않을 수 있음.
    // 대신 anchor click을 훅킹해서 "다운로드 트리거"가 발생했는지 검증한다.
    await page.evaluate(() => {
      (window as any).__lastDownload = null;
      const orig = HTMLAnchorElement.prototype.click;
      HTMLAnchorElement.prototype.click = function (this: HTMLAnchorElement) {
        (window as any).__lastDownload = { download: this.download, href: this.href };
        return orig.apply(this);
      };
    });

    await page.getByTestId('testcases-export-button').click();
    await expect(page.getByText('Export 대상')).toBeVisible();
    // 기본값이 '현재 폴더'로 잡히면 내보낼 케이스가 0개가 될 수 있어, 항상 '모든 케이스'를 명시적으로 선택
    await page.getByLabel('모든 케이스').check();

    await page.getByTestId('testcases-export-csv').click();

    const last = await page.evaluate(() => (window as any).__lastDownload);
    expect(last).toBeTruthy();
    expect(String(last.download)).toMatch(/\.csv$/i);
    expect(String(last.href)).toMatch(/^blob:/);
  });

  test('Export: 선택된 케이스만 Excel로 다운로드한다', async ({ page }) => {
    const timestamp = Date.now();
    const tcTitle1 = `EXPORT_SEL_TC1_${timestamp}`;
    const tcTitle2 = `EXPORT_SEL_TC2_${timestamp}`;

    const token = await page.evaluate(() => localStorage.getItem('accessToken'));
    if (!token) throw new Error('accessToken missing');

    await page.evaluate(
      async ({ token, titles }) => {
        const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
        for (const title of titles) {
          const res = await fetch('/api/testcases', {
            method: 'POST',
            headers,
            body: JSON.stringify({ title, priority: 'LOW' }),
          });
          if (!res.ok) throw new Error(`Failed to create testcase: ${res.status}`);
        }
      },
      { token, titles: [tcTitle1, tcTitle2] }
    );

    await page.goto('/testcases');
    await expect(page.getByRole('heading', { name: 'Test Cases' })).toBeVisible({ timeout: 15000 });

    // 한 케이스만 선택
    const row = page.locator('tr', { hasText: tcTitle1 }).first();
    await row.locator('input[type="checkbox"]').check();

    // Excel Export도 DOM 기반 다운로드(라이브러리 내부에서 a.click)일 수 있어 Playwright download 이벤트가 안 잡힐 수 있음.
    // anchor click을 훅킹해서 "다운로드 트리거"가 발생했는지 검증한다.
    await page.evaluate(() => {
      (window as any).__lastDownload = null;
      const orig = HTMLAnchorElement.prototype.click;
      HTMLAnchorElement.prototype.click = function (this: HTMLAnchorElement) {
        (window as any).__lastDownload = { download: this.download, href: this.href };
        return orig.apply(this);
      };
    });

    await page.getByTestId('testcases-export-button').click();
    await expect(page.getByText('Export 대상')).toBeVisible();

    await page.getByLabel('선택된 케이스만').check();

    await page.getByTestId('testcases-export-excel').click();

    const last = await page.evaluate(() => (window as any).__lastDownload);
    expect(last).toBeTruthy();
    expect(String(last.download)).toMatch(/\.(xlsx|xls)$/i);
    expect(String(last.href)).toMatch(/^(blob:|data:)/);
  });
});


