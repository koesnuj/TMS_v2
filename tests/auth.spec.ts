import { test, expect } from '@playwright/test';

test('회원가입 및 로그인 시나리오', async ({ page }) => {
  // 1. 회원가입 페이지 이동
  await page.goto('/register');
  await expect(page).toHaveURL(/\/register/);

  // 2. 회원가입 정보 입력
  const timestamp = Date.now();
  const email = `test${timestamp}@example.com`;
  const password = 'password123';
  const name = 'Test User';

  await page.fill('#name', name);
  await page.fill('#email', email);
  await page.fill('#password', password);

  // 가입 버튼 클릭
  await page.getByRole('button', { name: '회원가입' }).click();

  // 성공 메시지 확인
  await expect(page.locator('.success-message')).toContainText('회원가입이 완료되었습니다');

  // 3. 로그인 페이지 리다이렉트 확인 (2초 후 이동)
  await expect(page).toHaveURL(/\/login/, { timeout: 10000 });

  // 4. 로그인 수행
  await page.fill('#email', email);
  await page.fill('#password', password);
  await page.getByRole('button', { name: '로그인' }).click();

  // 5. 로그인 성공 후 홈 이동 확인
  await expect(page).toHaveURL('/', { timeout: 10000 });
  
  // 6. 로그인 성공 확인 (Navbar나 환영 메시지가 있다고 가정)
  // 여기서는 URL이 '/'인 것으로 성공 판단
  console.log(`Test Completed for user: ${email}`);
});
