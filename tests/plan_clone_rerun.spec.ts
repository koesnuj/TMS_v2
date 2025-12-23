import { test, expect } from '@playwright/test';

test('플랜 복제/재실행 시나리오', async ({ page }) => {
  test.setTimeout(60000);

  const timestamp = Date.now();
  const adminEmail = 'admin@tms.com';
  const adminPassword = 'admin123!';

  const tcTitle1 = `CLONE_TC_1_${timestamp}`;
  const tcTitle2 = `CLONE_TC_2_${timestamp}`;

  // 1) 로그인
  await page.goto('/login');
  await page.getByLabel('이메일').fill(adminEmail);
  await page.getByLabel('비밀번호').fill(adminPassword);
  await page.getByRole('button', { name: '로그인' }).click();
  await expect(page).toHaveURL('/', { timeout: 10000 });

  // 2) 테스트케이스 2개 생성(API)
  const token = await page.evaluate(() => localStorage.getItem('accessToken'));
  if (!token) throw new Error('accessToken missing');

  await page.evaluate(
    async ({ token, titles }) => {
      const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
      for (const title of titles) {
        const res = await fetch('/api/testcases', {
          method: 'POST',
          headers,
          body: JSON.stringify({ title, priority: 'MEDIUM' }),
        });
        if (!res.ok) throw new Error(`Failed to create testcase: ${res.status}`);
      }
    },
    { token, titles: [tcTitle1, tcTitle2] }
  );

  // 3) 플랜 생성 UI
  await page.goto('/plans');
  await expect(page.getByRole('heading', { name: '테스트 플랜', exact: true })).toBeVisible();
  await page.getByRole('button', { name: '플랜 생성', exact: true }).first().click();

  const planName = `CloneRerun Plan ${timestamp}`;
  await page.fill('input[placeholder*="예: 2024"]', planName);

  await page.fill('input[placeholder="ID 또는 제목으로 검색..."]', timestamp.toString());
  await page.waitForTimeout(300);

  // 필터된 2개 케이스 선택
  await page.locator('tr', { hasText: tcTitle1 }).locator('input[type="checkbox"]').check();
  await page.locator('tr', { hasText: tcTitle2 }).locator('input[type="checkbox"]').check();

  await page.getByRole('button', { name: /^플랜 생성/ }).click();
  await expect(page).toHaveURL('/plans');

  // 4) 플랜 상세 이동
  await page.getByText(planName).click();
  await expect(page).toHaveURL(/\/plans\//);
  await expect(page.getByText(tcTitle1)).toBeVisible();

  // 5) 1개를 PASS로 변경(API)해 실행 기록 생성 - UI 의존 제거
  const sourcePlanId = page.url().split('/plans/')[1];
  await page.evaluate(
    async ({ token, planId, tcTitle }) => {
      const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
      const detailRes = await fetch(`/api/plans/${planId}`, { headers });
      if (!detailRes.ok) throw new Error(`Failed to get plan detail: ${detailRes.status}`);
      const detailJson = await detailRes.json();
      const items = detailJson?.data?.items || [];
      const target = items.find((i: any) => i?.testCase?.title === tcTitle);
      if (!target) throw new Error('Target plan item not found');

      const patchRes = await fetch(`/api/plans/${planId}/items/${target.id}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ result: 'PASS' }),
      });
      if (!patchRes.ok) throw new Error(`Failed to update plan item: ${patchRes.status}`);
    },
    { token, planId: sourcePlanId, tcTitle: tcTitle1 }
  );

  // 6) 재실행 버튼 → 확인 → 새 플랜으로 이동
  await page.getByRole('button', { name: '재실행', exact: true }).first().click();
  await page.getByRole('button', { name: '재실행', exact: true }).nth(1).click(); // ConfirmModal의 confirmText

  await expect(page).toHaveURL(/\/plans\//);
  await expect(page.getByText(tcTitle1)).toBeVisible();

  // 7) 재실행 플랜에서는 결과가 모두 NOT_RUN 이어야 함 (API로 검증)
  const rerunPlanId = page.url().split('/plans/')[1];
  await page.evaluate(
    async ({ token, planId }) => {
      const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
      const detailRes = await fetch(`/api/plans/${planId}`, { headers });
      if (!detailRes.ok) throw new Error(`Failed to get rerun plan detail: ${detailRes.status}`);
      const detailJson = await detailRes.json();
      const items = detailJson?.data?.items || [];
      if (items.length === 0) throw new Error('Rerun plan has no items');
      const allNotRun = items.every((i: any) => i?.result === 'NOT_RUN');
      if (!allNotRun) throw new Error('Rerun plan has non-NOT_RUN results');
    },
    { token, planId: rerunPlanId }
  );
});


