# 개발 히스토리 (Development History)

이 문서는 TMS v2 프로젝트의 전체 개발 과정을 시간순으로 정리한 문서입니다.  
다른 채팅에서도 프로젝트 컨텍스트를 빠르게 파악하고 작업을 이어갈 수 있도록 작성되었습니다.

---

## 📌 프로젝트 개요

- **프로젝트명**: TMS v2 (Test Management System)
- **목적**: TestRail을 대체할 자체 구축형 테스트 케이스 관리 시스템
- **저장소**: https://github.com/koesnuj/TMS_v2
- **시작일**: 2025년 11월

---

## 🛠️ 기술 스택

### 백엔드
- **Runtime**: Node.js
- **Framework**: Express + TypeScript
- **ORM**: Prisma 5.12.0
- **Database**: SQLite (Development), PostgreSQL 지원
- **Authentication**: JWT (jsonwebtoken) + bcrypt
- **File Upload**: Multer
- **Dev Tools**: Nodemon, ts-node

### 프론트엔드
- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite 5
- **Routing**: React Router v6
- **HTTP Client**: Axios
- **State Management**: Context API (AuthContext)
- **Styling**: Tailwind CSS v3.4.1
- **UI Components**: 
  - Lucide React (아이콘)
  - Tiptap (Rich Text Editor)
  - @dnd-kit (Drag & Drop)
- **Export Libraries**: 
  - XLSX (엑셀)
  - jsPDF + jspdf-autotable (PDF)
  - PapaParse (CSV)

### 테스팅
- **E2E Testing**: Playwright

---

## 📂 프로젝트 구조

```
TMS_v2/
├── backend/                 # Express API 서버
│   ├── src/
│   │   ├── controllers/     # 비즈니스 로직
│   │   │   ├── authController.ts
│   │   │   ├── adminController.ts
│   │   │   ├── folderController.ts
│   │   │   ├── testcaseController.ts
│   │   │   ├── planController.ts
│   │   │   └── dashboardController.ts
│   │   ├── routes/          # API 라우팅
│   │   ├── middleware/      # auth, roleCheck
│   │   ├── utils/           # JWT, password 유틸
│   │   └── lib/             # Prisma client
│   ├── prisma/
│   │   ├── schema.prisma    # DB 스키마
│   │   └── dev.db           # SQLite 파일
│   └── uploads/             # 파일 업로드
│
├── frontend/                # React 앱
│   ├── src/
│   │   ├── api/             # API 클라이언트 (Axios)
│   │   ├── components/
│   │   │   ├── ui/          # 디자인 시스템 (Button, Card, Badge, Input)
│   │   │   ├── Layout.tsx, Sidebar.tsx, Header.tsx
│   │   │   ├── FolderTree.tsx
│   │   │   ├── TestCaseFormModal.tsx
│   │   │   ├── BulkEditModal.tsx
│   │   │   ├── CsvImportModal.tsx
│   │   │   ├── DonutChart.tsx, MultiColorDonutChart.tsx
│   │   │   ├── StackedProgressBar.tsx
│   │   │   └── RunSummary.tsx
│   │   ├── pages/
│   │   │   ├── HomePage.tsx              # 대시보드
│   │   │   ├── LoginPage.tsx
│   │   │   ├── TestCasesPage.tsx         # 테스트 케이스 관리
│   │   │   ├── PlansPage.tsx
│   │   │   ├── CreatePlanPage.tsx
│   │   │   ├── PlanDetailPage3Column.tsx # 실행 및 리포팅
│   │   │   └── AdminPage.tsx
│   │   ├── context/
│   │   │   └── AuthContext.tsx
│   │   └── utils/
│   │       └── export.ts    # PDF/Excel 내보내기
│   └── index.css            # Tailwind + Global Styles
│
├── tests/                   # E2E 테스트 (Playwright)
│   ├── auth.spec.ts
│   ├── plan_execution.spec.ts
│   ├── plan.spec.ts
│   └── testcase_management.spec.ts
│
└── MD/                      # 프로젝트 문서
    ├── PROJECT_SUMMARY.md
    ├── SETUP_GUIDE.md
    ├── AUTH_IMPLEMENTATION_GUIDE.md
    ├── THREE_COLUMN_LAYOUT_GUIDE.md
    ├── BULK_SELECT_EDIT_GUIDE.md
    └── DEV_HISTORY.md (이 문서)
```

---

## 📅 개발 타임라인

### Phase 1: 프로젝트 초기화 및 인증 시스템 (2025-11-27)

#### 완료 작업
- ✅ Git 저장소 설정
- ✅ 백엔드/프론트엔드 모노레포 구조 설정
- ✅ Prisma 스키마 설계 (User, Folder, TestCase, Plan, PlanItem)
- ✅ JWT 기반 인증 시스템
  - 회원가입 (POST `/api/auth/signup`)
  - 로그인 (POST `/api/auth/login`)
  - 내 정보 조회 (GET `/api/auth/me`)
- ✅ 역할 기반 접근 제어 (RBAC)
  - 역할: USER, ADMIN
  - 상태: PENDING, ACTIVE, REJECTED
  - 첫 가입자 자동 ADMIN 승격
- ✅ 관리자 기능
  - 사용자 승인/거절 (PATCH `/api/admin/users/approve`)
  - 사용자 목록 조회 (GET `/api/admin/users`)
  - 비밀번호 초기화 (POST `/api/admin/users/reset-password`)
- ✅ 프론트엔드 인증 UI
  - LoginPage, RegisterPage
  - AuthContext (전역 상태)
  - PrivateRoute, RequireAdmin (권한 라우팅)

#### 주요 결정사항
- **Database**: SQLite 선택 (개발 편의성, PostgreSQL 전환 가능)
- **Authentication**: JWT Access Token 방식 (Refresh Token은 향후 구현)
- **Password**: bcrypt로 해시화

---

### Phase 2: 테스트 케이스 관리 (2025-11-28)

#### 완료 작업
- ✅ 계층형 폴더 구조 구현
  - 무제한 깊이의 부모-자식 관계
  - 폴더 생성 API (POST `/api/folders`)
  - 폴더 트리 조회 API (GET `/api/folders/tree`)
- ✅ 테스트 케이스 CRUD API
  - 생성 (POST `/api/testcases`)
  - 폴더별 조회 (GET `/api/testcases?folderId=xxx`)
  - 전체 조회 (GET `/api/testcases`)
  - 수정 (PUT `/api/testcases/:id`)
  - 삭제 (DELETE `/api/testcases/:id`)
  - 폴더 이동 (PATCH `/api/testcases/:id/move`)
- ✅ CSV Import 기능
  - 헤더 매핑 기반 대량 생성
  - 유효성 검증 (필수 필드 체크)
- ✅ 프론트엔드 UI
  - `FolderTree` 컴포넌트 (재귀적 렌더링)
  - `TestCasesPage` (분할 뷰: 트리 + 테이블)
  - `TestCaseFormModal` (생성/수정 통합)
  - `CsvImportModal`

#### 주요 기능
- **테스트 케이스 필드**: title, description, precondition, steps, expectedResult, priority (LOW/MEDIUM/HIGH)
- **폴더 이동**: 드롭다운으로 대상 폴더 선택
- **All Cases 보기**: 폴더 선택 해제 시 전체 케이스 표시

---

### Phase 3: 테스트 계획 및 실행 (2025-11-29)

#### 완료 작업
- ✅ 플랜 API
  - 플랜 생성 (POST `/api/plans`)
  - 플랜 목록 (GET `/api/plans`) - 진행률 계산 포함
  - 플랜 상세 (GET `/api/plans/:id`)
  - 플랜 삭제 (DELETE `/api/plans/:id`)
- ✅ 플랜 아이템 API
  - 개별 업데이트 (PATCH `/api/plans/:planId/items/:itemId`)
  - 벌크 업데이트 (PATCH `/api/plans/:planId/items/bulk`)
- ✅ 테스트 실행 상태
  - NOT_RUN (기본값)
  - IN_PROGRESS (진행 중)
  - PASS (통과)
  - FAIL (실패)
  - BLOCK (블록됨)
- ✅ 프론트엔드 UI
  - `PlansPage` (플랜 목록 + 진행률 바)
  - `CreatePlanPage` (테스트 케이스 검색 및 선택)
  - `PlanDetailPage` (실행 인터페이스)
    - 상태 드롭다운
    - 담당자 입력
    - 메모 모달 (URL 자동 링크화)
    - 실시간 진행률 업데이트

---

### Phase 4: UI/UX 전면 리디자인 (2025-11-30)

#### 완료 작업
- ✅ **디자인 시스템 구축**
  - `ui/Button.tsx` - 다양한 variant 지원
  - `ui/Card.tsx` - 일관된 카드 스타일
  - `ui/Badge.tsx` - 상태 표시용
  - `ui/Input.tsx` - 폼 입력
  - `ui/ConfirmModal.tsx` - 확인 다이얼로그
- ✅ **레이아웃 전환**
  - TestRail 스타일 좌측 사이드바
  - `Sidebar.tsx` + `Header.tsx` + `MainLayout.tsx`
  - 반응형 디자인 (모바일/태블릿/데스크톱)
- ✅ **색상 팔레트**
  - Primary: Indigo (500-700)
  - Background: Slate (50-100)
  - Text: Slate (600-900)
- ✅ **3-컬럼 레이아웃** (`PlanDetailPage3Column.tsx`)
  - 좌측: Test Runs 목록 + 스택형 프로그레스바
  - 중앙: Summary (도넛 차트) + Test Cases 테이블
  - 우측: Test Case Details (선택 시 고정 패널)
- ✅ **고급 시각화**
  - `MultiColorDonutChart.tsx` - 5가지 상태별 색상
  - `StackedProgressBar.tsx` - 세그먼트별 진행률
  - `RunSummary.tsx` - 통계 요약
- ✅ **Bulk Select & Edit**
  - 체크박스 전체 선택
  - 선택한 항목 일괄 상태 변경
  - 선택한 항목 일괄 담당자 지정
  - `BulkEditModal.tsx`

#### 문서화
- `MD/THREE_COLUMN_LAYOUT_GUIDE.md`
- `MD/BULK_SELECT_EDIT_GUIDE.md`
- `MD/MULTI_COLOR_DONUT_CHART_GUIDE.md`
- `MD/STACKED_PROGRESS_BAR_GUIDE.md`

---

### Phase 5: 대시보드 및 리포팅 (2025-12-01)

#### 완료 작업
- ✅ **대시보드 페이지** (`HomePage.tsx`)
  - Stats Widgets
    - Total Cases (전체 테스트 케이스 수)
    - Active Plans (활성 플랜 수)
    - Test Executions (총 실행 수)
    - My Assignments (내 할당 작업 수)
  - My Assignments 섹션
    - 나에게 할당된 작업 목록
    - 플랜명, 케이스명, 상태 표시
    - 클릭 시 해당 플랜으로 이동
  - Recent Activity 섹션
    - 최근 실행 이력 타임라인
    - 실행자, 케이스명, 상태, 시간 표시
- ✅ **대시보드 API** (`dashboardController.ts`)
  - GET `/api/dashboard/stats` - 통계 데이터
  - GET `/api/dashboard/my-assignments` - 내 할당 작업
  - GET `/api/dashboard/recent-activity` - 최근 활동
- ✅ **리포팅 시스템**
  - Export to PDF (`jspdf`, `jspdf-autotable`)
    - 플랜 정보 (이름, 생성자, 날짜)
    - 실행 통계 (Pass/Fail/Block 등)
    - 상세 테이블 (케이스명, 상태, 담당자, 메모)
  - Export to Excel (`xlsx`)
    - Summary 시트 (통계)
    - Details 시트 (전체 데이터)
  - 클라이언트 사이드 생성으로 서버 부하 없음
- ✅ **테스트 케이스 CRUD 완성**
  - 수정 기능 추가 (Edit 버튼 → TestCaseFormModal)
  - 삭제 기능 추가 (Delete 버튼 → ConfirmModal)
  - 폴더 이동 기능 (Move 버튼 → 폴더 선택 드롭다운)
  - 'All Cases' 보기 기능 (Root 버튼)

#### 버그 수정
- ✅ 로그인 토큰 처리 버그 수정
  - 백엔드: `accessToken` 반환
  - 프론트엔드: `token` vs `accessToken` 불일치 해결
  - AuthContext와 API 클라이언트 통일

#### 테스팅
- ✅ E2E 테스트 추가 (`testcase_management.spec.ts`)
  - 로그인 시나리오
  - 폴더 생성
  - 테스트 케이스 CRUD
  - 폴더 이동
  - 전체 시나리오 검증 완료

---

### Phase 6: 문서화 및 README 개선 (2025-12-02)

#### 완료 작업
- ✅ **MD 폴더 재구성**
  - `backup/` 폴더의 가이드 문서들을 `MD/` 폴더로 이동
  - 16개 마크다운 파일 정리
- ✅ **README.md 전면 개선**
  - 톤 앤 매너: 전문적 → 친근하고 가벼운 느낌
  - 구조 단순화: 핵심 기능 중심으로 재작성
  - Palet AI 스타일 참고 (https://github.com/cha2hyun/palet-ai)
  - 사용 사례 추가
  - 불필요한 기술 상세 내용 제거
- ✅ **DEV_HISTORY.md 작성** (이 문서)
  - 전체 개발 과정 시간순 정리
  - 다른 채팅에서 컨텍스트 파악 가능하도록 구성

#### 커밋
- Commit: `66bc758` - "docs: README를 더 가볍고 친근한 톤으로 개선"
- 17개 파일 변경 (MD 이동 16개 + README 1개)

---

## 🗄️ 데이터베이스 스키마

### User (사용자)
```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  password  String   // bcrypt 해시
  name      String
  role      String   @default("USER")    // USER, ADMIN
  status    String   @default("PENDING") // PENDING, ACTIVE, REJECTED
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

### Folder (폴더)
```prisma
model Folder {
  id        String     @id @default(cuid())
  name      String
  parentId  String?
  parent    Folder?    @relation("FolderHierarchy", fields: [parentId], references: [id])
  children  Folder[]   @relation("FolderHierarchy")
  testCases TestCase[]
  createdAt DateTime   @default(now())
  updatedAt DateTime   @updatedAt
}
```

### TestCase (테스트 케이스)
```prisma
model TestCase {
  id             String     @id @default(cuid())
  title          String
  description    String?
  precondition   String?
  steps          String?
  expectedResult String?
  priority       String     @default("MEDIUM") // LOW, MEDIUM, HIGH
  sequence       Float      @default(0)
  folderId       String?
  folder         Folder?    @relation(fields: [folderId], references: [id])
  planItems      PlanItem[]
  createdAt      DateTime   @default(now())
  updatedAt      DateTime   @updatedAt
}
```

### Plan (테스트 계획)
```prisma
model Plan {
  id          String     @id @default(cuid())
  name        String
  description String?
  status      String     @default("ACTIVE") // ACTIVE, ARCHIVED
  createdBy   String     // 이메일 또는 이름
  items       PlanItem[]
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt
}
```

### PlanItem (플랜 아이템)
```prisma
model PlanItem {
  id          String    @id @default(cuid())
  planId      String
  plan        Plan      @relation(fields: [planId], references: [id])
  testCaseId  String
  testCase    TestCase  @relation(fields: [testCaseId], references: [id])
  assignee    String?   // 담당자
  result      String    @default("NOT_RUN") // NOT_RUN, IN_PROGRESS, PASS, FAIL, BLOCK
  comment     String?
  executedAt  DateTime?
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
}
```

---

## 🎯 현재 상태 (As of 2025-12-02)

### 완성된 기능
- ✅ 인증 및 권한 관리 (회원가입, 로그인, 관리자 승인)
- ✅ 테스트 케이스 전체 CRUD (생성, 조회, 수정, 삭제)
- ✅ 계층형 폴더 구조 (무제한 깊이)
- ✅ 폴더 이동 기능
- ✅ CSV Import/Export
- ✅ 테스트 플랜 생성 및 관리
- ✅ 테스트 실행 및 결과 기록 (5가지 상태)
- ✅ Bulk Select & Edit (일괄 편집)
- ✅ 3-컬럼 레이아웃 (실행 UI)
- ✅ 대시보드 (통계, 내 작업, 최근 활동)
- ✅ 리포팅 (PDF/Excel 내보내기)
- ✅ E2E 테스트 (Playwright)
- ✅ 반응형 UI (모바일/태블릿/데스크톱)

### 시스템 상태
- **안정성**: 모든 주요 기능 테스트 완료, 프로덕션 준비 완료
- **성능**: 중소 규모 팀 사용에 최적화 (SQLite 기반)
- **사용성**: 직관적인 UI/UX, TestRail 대비 진입 장벽 낮음

---

## 🚀 다음 단계 (Roadmap)

### 단기 계획
1. **플랜 복제 기능**
   - 기존 플랜을 복사하여 새 플랜 생성
   - 회귀 테스트 시나리오에 유용
2. **테스트 케이스 순서 변경**
   - Drag & Drop으로 순서 조정
   - `sequence` 필드 활용
3. **이미지 첨부 기능**
   - 스크린샷 첨부 지원
   - 클라우드 스토리지 연동 고려

### 중기 계획
1. **알림 시스템**
   - 할당 시 이메일/Slack 알림
   - 플랜 완료 시 알림
2. **검색 기능 강화**
   - Full-text search
   - 필터링 옵션 확대
3. **테스트 케이스 버전 관리**
   - History 기록
   - Diff 비교

### 장기 계획
1. **CI/CD 연동**
   - GitHub Actions 파이프라인
   - 자동 배포 구성
2. **API 자동화 지원**
   - REST API를 통한 외부 도구 연동
   - Webhook 지원
3. **대규모 확장**
   - PostgreSQL 마이그레이션
   - 가상 스크롤링/페이지네이션
   - Redis 캐싱

---

## 📝 주요 문서

### 설치 및 실행
- `README.md` - 프로젝트 개요 및 빠른 시작
- `MD/SETUP_GUIDE.md` - 상세 설치 가이드
- `backend/README.md` - 백엔드 API 문서

### 기능 가이드
- `MD/PROJECT_SUMMARY.md` - 프로젝트 전체 요약
- `MD/AUTH_IMPLEMENTATION_GUIDE.md` - 인증 구현 상세
- `MD/THREE_COLUMN_LAYOUT_GUIDE.md` - 3-컬럼 레이아웃
- `MD/BULK_SELECT_EDIT_GUIDE.md` - 일괄 편집 기능
- `MD/ADMIN_ROLE_STATUS_MANAGEMENT_GUIDE.md` - 권한 관리

### 개발 가이드
- `MD/DEV_HISTORY.md` (이 문서) - 개발 히스토리
- `project_progress.log` - 진행 상황 로그
- `backend/API_TEST.http` - API 테스트 예제

---

## 🐛 알려진 이슈 및 해결 내역

### 해결된 이슈
1. **로그인 토큰 불일치** (2025-12-01 해결)
   - 문제: 백엔드는 `accessToken` 반환, 프론트엔드는 `token`으로 저장
   - 해결: `accessToken`으로 통일

2. **폴더 이동 시 UI 미반영** (2025-11-30 해결)
   - 문제: 이동 후 화면 갱신 안됨
   - 해결: API 호출 후 즉시 리로드

3. **Bulk Edit 시 체크박스 상태 유지** (2025-11-30 해결)
   - 문제: 일괄 편집 후 체크박스 해제 안됨
   - 해결: 모달 닫을 때 `selectedItems` 초기화

### 현재 알려진 이슈
- 없음 (안정 상태)

---

## 💡 핵심 설계 결정 및 이유

### 1. SQLite 선택
- **이유**: 개발/테스트 단순화, 별도 DB 서버 불필요
- **장점**: 빠른 프로토타입, 쉬운 백업
- **단점**: 동시 접속자 제한 (향후 PostgreSQL 고려)

### 2. JWT Access Token 방식
- **이유**: 간단한 인증, 서버 상태 불필요
- **장점**: Stateless, 확장 용이
- **단점**: 토큰 탈취 위험 (HTTPS 필수, Refresh Token 추가 고려)

### 3. 클라이언트 사이드 리포팅
- **이유**: 서버 부하 최소화, PDF/Excel 생성 비용 높음
- **장점**: 빠른 응답, 확장성
- **단점**: 브라우저 메모리 제약 (대용량 데이터 시)

### 4. 3-컬럼 레이아웃
- **이유**: 테스트 실행 시 컨텍스트 전환 최소화
- **장점**: 한 화면에서 모든 정보 확인
- **단점**: 작은 화면에서는 반응형 처리 필요

### 5. Tailwind CSS
- **이유**: 빠른 개발, 일관된 디자인
- **장점**: 유틸리티 퍼스트, 커스터마이징 쉬움
- **단점**: 클래스 이름 길어질 수 있음 (컴포넌트화로 해결)

---

## 🔧 유지보수 가이드

### 개발 서버 실행
```bash
# 백엔드
cd backend
npm run dev  # http://localhost:3001

# 프론트엔드 (새 터미널)
cd frontend
npm run dev  # http://localhost:5173
```

### 데이터베이스 마이그레이션
```bash
cd backend
npm run prisma:migrate      # 마이그레이션 적용
npm run prisma:generate     # Prisma Client 생성
npm run prisma:studio       # DB GUI 실행
```

### E2E 테스트 실행
```bash
npx playwright test                    # 전체 테스트
npx playwright test --ui               # UI 모드
npx playwright test auth.spec.ts      # 특정 테스트
npx playwright show-report            # 리포트 보기
```

### 프로덕션 빌드
```bash
# 백엔드
cd backend
npm run build
npm start

# 프론트엔드
cd frontend
npm run build
npm run preview
```

---

## 📞 문제 해결 (Troubleshooting)

### 백엔드 서버가 시작되지 않는 경우
1. `.env` 파일 존재 확인
2. `DATABASE_URL` 설정 확인
3. 포트 충돌 확인 (3001)
4. `npm run prisma:generate` 재실행

### 프론트엔드가 백엔드에 연결되지 않는 경우
1. 백엔드 서버 실행 확인
2. CORS 설정 확인 (`backend/src/index.ts`)
3. Axios baseURL 확인 (`frontend/src/api/axios.ts`)

### 데이터베이스 초기화
```bash
cd backend
npx prisma migrate reset  # 주의: 모든 데이터 삭제
npm run prisma:migrate
```

### 의존성 문제
```bash
# 백엔드
cd backend
rm -rf node_modules package-lock.json
npm install

# 프론트엔드
cd frontend
rm -rf node_modules package-lock.json
npm install
```

---

## 🎓 학습 자료 및 참고 링크

### 사용된 주요 라이브러리
- [Express](https://expressjs.com/) - Node.js 웹 프레임워크
- [Prisma](https://www.prisma.io/) - 타입 세이프 ORM
- [React Router](https://reactrouter.com/) - 클라이언트 사이드 라우팅
- [Tailwind CSS](https://tailwindcss.com/) - 유틸리티 퍼스트 CSS
- [Lucide React](https://lucide.dev/) - 아이콘 라이브러리
- [Playwright](https://playwright.dev/) - E2E 테스트 프레임워크
- [jsPDF](https://github.com/parallax/jsPDF) - PDF 생성
- [SheetJS](https://sheetjs.com/) - Excel 처리

### 영감을 받은 프로젝트
- [TestRail](https://www.testrail.com/) - 테스트 관리 툴
- [Palet AI](https://github.com/cha2hyun/palet-ai) - 친근한 README 스타일

---

## 📄 라이선스

MIT License - 자유롭게 사용하고 수정하세요!

---

## 👥 기여자

- **프로젝트 시작**: 2025년 11월
- **개발 환경**: Node.js + React + TypeScript
- **저장소**: https://github.com/koesnuj/TMS_v2

---

**즐거운 테스팅 되세요! 🚀**

마지막 업데이트: 2025-12-02

