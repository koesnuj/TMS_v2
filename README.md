# ORCA

테스트 케이스 관리 시스템

---

## 주요 기능

### 테스트 케이스 관리
- 폴더 구조로 테스트 케이스 분류
- 드래그 앤 드롭으로 이동
- Rich Text Editor 지원

### 테스트 실행 계획(Plan)
- 테스트 선택 및 Plan 생성
- 담당자 할당
- 실행 결과 기록

### 진행률 시각화
- 도넛 차트 및 프로그레스 바
- Pass/Fail/Block 상태 표시

### CSV 지원
- CSV 파일 업로드/다운로드

### 권한 관리
- 관리자 승인 시스템
- 역할 기반 접근 제어

---

## 빠른 시작

> 이 레포의 **현재 DB는 PostgreSQL(Prisma)** 입니다. (`DATABASE_URL=postgresql://postgres:postgres@localhost:5432/tms_dev`)

### 1. 레포지토리 클론
```bash
git clone <repository-url>
cd TMS_v2
```

### 2. DB/의존성/시드까지 한 번에 준비 (Windows PowerShell 권장)

프로젝트 루트에서:

```powershell
.\scripts\bootstrap_phase0_safety.ps1
```

- 내부적으로 **Postgres 컨테이너 기동 + migrate + seed**까지 수행합니다.
- DB만 띄우고 싶으면(호환 엔트리포인트):

```powershell
.\scripts\start_postgres.ps1
```

### 3. 개발 서버 실행(터미널 2개)

백엔드:

```powershell
cd backend
npm run dev
```

프론트엔드:

```powershell
cd frontend
npm run dev
```

실행 주소:
- 프론트: `http://localhost:5173`
- 백엔드: `http://localhost:3001` (헬스체크: `GET /health`)

### 4. 첫 사용
1. `http://localhost:5173`에 접속
2. 로그인 후 시스템 사용

시드 계정(기본):
- **admin@tms.com / admin123!**

---

## CI와 동일한 로컬 검증(권장)

루트에서 아래 커맨드로 **CI와 같은 순서**로 실행됩니다:

```bash
npm run lint
npm run typecheck
npm run test:unit
npm run build
```

> 참고: 현재 ESLint는 아직 설정되어 있지 않아 `lint`는 “skip” 메시지만 출력합니다. (CI 안정성을 위해 스텁으로 유지)

---

## 사용법

1. 회원가입 및 관리자 승인 (첫 사용자는 자동 관리자 지정)
2. 로그인
3. 폴더 생성 및 테스트 케이스 작성
4. Plan 생성 및 테스트 실행

---

## 기술 스택

### 백엔드
- Express + TypeScript
- Prisma (PostgreSQL)
- JWT

### 프론트엔드
- React 18 (TypeScript)
- Vite
- Tailwind CSS

---

## 프로젝트 구조
```
TMS_v2/
├── backend/          # Express API 서버(Prisma)
├── frontend/         # React 프론트엔드(Vite)
├── scripts/          # 로컬 부트스트랩/DB 스크립트(Windows)
├── tests/            # Playwright E2E
├── docs/             # 규칙/스냅샷/진행 문서
└── packages/shared/  # 공용 타입/유틸(워크스페이스)
```

---

## 테스트(검증)

```bash
npm test
```

특정 테스트만:

```bash
npm test -- tests/smoke.spec.ts
```

---

## 배포

Railway와 Vercel에 배포하는 방법은 [DEPLOYMENT.md](./DEPLOYMENT.md)를 참고하세요.

---

## 라이선스

MIT License
