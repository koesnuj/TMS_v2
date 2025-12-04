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

### Phase 7: 폴더/테스트케이스 드래그앤드롭, Test Cases/Plans 페이지 전면 리디자인 (2025-12-03)

#### 7-1. 폴더 드래그앤드롭 및 관리 기능

##### 완료 작업
- ✅ **폴더 드래그앤드롭 구현** (`@dnd-kit` 라이브러리 활용)
  - 같은 레벨 내 순서 변경 (위/아래 드래그)
  - 부모/자식 관계 변경 (폴더 위에 드롭하면 자식으로 이동)
  - 드래그 중 시각적 피드백 (하이라이트, 드롭 위치 표시)
  - 드래그 오버레이 미리보기
- ✅ **폴더 이름 변경 기능**
  - 연필 아이콘 클릭으로 이름 변경 모달 표시
  - 백엔드 API: `PATCH /api/folders/:id/rename`
- ✅ **커스텀 InputModal 컴포넌트**
  - 브라우저 기본 `prompt()` 대신 디자인 시스템에 맞는 모달 사용
  - 키보드 지원 (Enter 확인, ESC 취소)
  - 자동 포커스 및 텍스트 선택
- ✅ **안전 장치 구현**
  - 순환 구조 방지 (자손 폴더로 이동 불가)
  - 최대 3단계 깊이 제한
  - 자기 자신 밑으로 이동 방지
- ✅ **UI 텍스트 한글화**
  - 새 폴더 만들기 / 폴더 이름 변경 모달
- ✅ **버그 수정**
  - 회원가입 API 엔드포인트 불일치 수정 (`/auth/signup` → `/auth/register`)

##### 백엔드 변경사항
- Prisma 스키마: `Folder` 모델에 `order` 필드 추가 (Float, 정렬용)
- 새 API 엔드포인트:
  - `PATCH /api/folders/:id/move` - 폴더 이동 (부모 변경 + 순서 변경)
  - `PATCH /api/folders/:id/rename` - 폴더 이름 변경
  - `PATCH /api/folders/reorder` - 폴더 순서 일괄 업데이트

##### 프론트엔드 변경사항
- `FolderTree.tsx`: 드래그앤드롭 기능 전면 재구현
- `InputModal.tsx`: 새 UI 컴포넌트 추가
- `TestCasesPage.tsx`: 폴더 생성/이름 변경 모달 연동

##### 커밋
- Commit: `b9a7452` - "feat: 폴더 드래그앤드롭 및 이름 변경 기능 추가"
- 8개 파일 변경 (+918, -52)

---

#### 7-2. 테스트케이스 드래그앤드롭 및 다중 선택 기능

##### 완료 작업
- ✅ **테스트케이스 순서 변경 (드래그앤드롭)**
  - 테이블 내에서 드래그로 순서 변경
  - `sequence` 필드를 활용한 정렬
  - 서버에 순서 자동 저장
- ✅ **테스트케이스 폴더 이동 (드래그앤드롭)**
  - 테스트케이스를 좌측 폴더 트리로 드래그하여 이동
  - "All Cases" (루트)로도 이동 가능
  - 드롭 대상 폴더 하이라이트 시각적 피드백
- ✅ **다중 선택 지원**
  - 체크박스로 여러 테스트케이스 선택
  - 선택된 상태에서 드래그 시 모든 항목 함께 이동
  - 드래그 오버레이에 "+N" 배지로 이동 중인 항목 수 표시
- ✅ **테스트케이스 ID 형식 변경**
  - 기존: 랜덤 UUID 일부 표시
  - 변경: `OVDR0001`, `OVDR0002` 형식의 순차 번호
  - `caseNumber` 필드 추가 (자동 증가)
- ✅ **테이블 컬럼 개선**
  - "Preconditions" → "Expected Result" 변경
  - "Section" 컬럼 추가 (폴더 경로 표시)
  - Section 컬럼을 제일 앞으로 이동
  - 폴더 경로: `상위폴더 › 중간폴더 › 하위폴더` 형식
- ✅ **Bulk Select / Edit / Delete 기능**
  - 체크박스 전체 선택/해제
  - 선택된 항목 일괄 Priority 변경
  - 선택된 항목 일괄 삭제

##### 백엔드 변경사항
- Prisma 스키마:
  - `TestCase` 모델에 `caseNumber Int @unique` 필드 추가
  - `TestCase` 모델에 `sequence Float @default(0)` 필드 추가
- 새 API 엔드포인트:
  - `POST /api/testcases/reorder` - 테스트케이스 순서 변경
  - `POST /api/testcases/move` - 테스트케이스 폴더 이동 (다중)
  - `PATCH /api/testcases/bulk` - 테스트케이스 일괄 수정
  - `DELETE /api/testcases/bulk` - 테스트케이스 일괄 삭제
- 테스트케이스 조회 시 `folderPath` 반환 (상위 폴더 경로)

##### 프론트엔드 변경사항
- `TestCasesPage.tsx`: 전면 재구현
  - `@dnd-kit` 라이브러리 활용
  - `SortableTestCaseRow` 컴포넌트 (드래그 가능한 행)
  - `DroppableFolderOverlay` 컴포넌트 (폴더 드롭 영역)
  - `BulkEditModal` 컴포넌트 (일괄 편집)
- `testcase.ts` API:
  - `reorderTestCases()` 함수 추가
  - `moveTestCasesToFolder()` 함수 추가
  - `bulkUpdateTestCases()` 함수 추가
  - `bulkDeleteTestCases()` 함수 추가
  - `TestCase` 인터페이스에 `caseNumber`, `folderPath` 필드 추가

---

#### 7-3. Test Cases 페이지 전면 리디자인 및 폴더 관리 강화

##### 완료 작업
- ✅ **Test Cases 페이지 레이아웃 전면 리디자인**
  - TestRail 스타일 "섹션 헤더 + 테이블" 구조로 변경
  - 각 섹션(폴더)별로 테스트케이스 개수 배지 표시
  - 섹션별 독립적인 정렬 기능 (ID, Title, Priority 클릭 시 오름/내림차순 토글)
  - 정렬 상태 화살표 아이콘으로 시각화
- ✅ **테스트케이스 디테일 패널**
  - 우측 슬라이드 패널로 상세 정보 표시
  - 패널 열린 상태에서 다른 케이스 선택 시 내용 업데이트
  - Edit/Delete 버튼 상단 헤더로 이동
  - 인라인 편집 모드 지원 (Rich Text Editor)
- ✅ **상위 폴더 케이스 통합 표시**
  - 상위 폴더 선택 시 하위 폴더의 모든 케이스도 함께 표시
  - 백엔드 `includeDescendants` 파라미터 추가
  - 재귀적으로 모든 자손 폴더 ID 수집
- ✅ **Rich Text Editor 이미지 기능**
  - 이미지 업로드 버튼 추가 (`@tiptap/extension-image`)
  - 5MB 용량 제한, JPEG/PNG/GIF/WEBP 지원
  - 백엔드 이미지 업로드 API (`POST /api/upload/image`)
  - Multer를 활용한 파일 저장
- ✅ **이미지 라이트박스**
  - 첨부된 이미지 클릭 시 팝업으로 확대 보기
  - 확대/축소 (25%~400%)
  - 90도 회전 기능
  - ESC 키 또는 배경 클릭으로 닫기
  - `ImageLightbox.tsx` 컴포넌트 추가
- ✅ **폴더 개별 삭제 기능**
  - 폴더 아이템에 휴지통 아이콘 추가 (hover 시 표시)
  - 확인 모달 후 삭제
  - 하위 폴더 및 테스트케이스 연쇄 삭제
  - `DELETE /api/folders/:id` API 추가
- ✅ **폴더 Bulk 선택/삭제 기능**
  - Folders 헤더에 Bulk 모드 토글 버튼 추가
  - Bulk 모드에서 체크박스로 여러 폴더 선택
  - 선택된 폴더 수 표시 및 일괄 삭제 버튼
  - `DELETE /api/folders/bulk` API 추가
- ✅ **기타 개선**
  - Expected Result 필드 HTML 태그 제거 (`stripHtmlTags` 함수)
  - `DOMPurify`로 XSS 공격 방지
  - 이미지 hover 시 커서 변경 (zoom-in)

##### 백엔드 변경사항
- 새 API 엔드포인트:
  - `DELETE /api/folders/:id` - 폴더 개별 삭제 (하위 폴더 및 테스트케이스 포함)
  - `DELETE /api/folders/bulk` - 폴더 일괄 삭제
  - `POST /api/upload/image` - 이미지 업로드
- `GET /api/testcases` - `includeDescendants` 쿼리 파라미터 추가
- `getAllDescendantIds()` 헬퍼 함수로 재귀적 폴더 ID 수집
- 정적 파일 서빙: `/uploads/images/` 경로

##### 프론트엔드 변경사항
- `TestCasesPage.tsx`: 섹션 기반 레이아웃으로 전면 재구현
  - `SectionHeader` 컴포넌트 (폴더명 + 케이스 수 배지)
  - `TestCaseRow` 컴포넌트 (체크박스 + ID + Title + Priority + 상세 버튼)
  - `TestCaseDetailPanel` 컴포넌트 (우측 슬라이드 패널)
  - 섹션별 정렬 상태 관리 (`SectionSortState`)
- `FolderTree.tsx`: 삭제 및 Bulk 선택 기능 추가
  - `onDeleteFolder` prop 추가
  - `selectedFolderIds`, `onToggleFolderSelect`, `isBulkMode` props 추가
- `RichTextEditor.tsx`: 이미지 업로드 기능 추가
- `ImageLightbox.tsx`: 새 컴포넌트 추가
- `upload.ts`: 이미지 업로드 API 클라이언트 추가
- `folder.ts`: `deleteFolder()`, `bulkDeleteFolders()` 함수 추가

##### 신규 의존성
- `@tiptap/extension-image` - Rich Text Editor 이미지 확장
- `dompurify`, `@types/dompurify` - HTML Sanitization

##### 발생한 문제 및 해결

1. **SQLite autoincrement 제한 문제**
   - 문제: `caseNumber Int @unique @default(autoincrement())` 사용 시 `P1012` 오류
   - 원인: SQLite는 `@id` 필드가 아닌 곳에 `autoincrement()` 사용 불가
   - 해결: 
     1. `caseNumber Int?`로 nullable 필드 추가
     2. Node.js 스크립트로 기존 데이터에 순차 번호 부여
     3. `caseNumber Int @unique`로 변경 후 `db push --accept-data-loss`

2. **TypeScript 타입 추론 오류**
   - 문제: `folder` 변수가 `any` 타입으로 추론되어 컴파일 오류
   - 원인: Prisma 쿼리 결과의 타입이 복잡한 경우 추론 실패
   - 해결: 명시적 타입 지정
     ```typescript
     const folder: { id: string; name: string; parentId: string | null } | null = await prisma.folder.findUnique({...});
     ```

3. **폴더 기능 손실 문제**
   - 문제: 테스트케이스 드래그앤드롭 구현 시 기존 폴더 드래그앤드롭/하위폴더 생성/이름 변경 기능 사라짐
   - 원인: `FolderTree` 컴포넌트를 `DroppableFolderSidebar`로 완전히 대체
   - 해결: 
     1. 기존 `FolderTree` 컴포넌트 유지 (폴더 관리 기능)
     2. 테스트케이스 드래그 시에만 `DroppableFolderOverlay` 오버레이 표시
     3. 두 기능이 독립적으로 동작하도록 분리

---

#### 7-4. Test Plan 아카이브 기능 및 UI 개선

##### 완료 작업
- ✅ **Test Plan 아카이브 기능**
  - 플랜 상태: ACTIVE / ARCHIVED
  - 개별 아카이브/복원 (Archive/Restore)
  - 일괄 아카이브/복원/삭제 (체크박스 선택)
  - 확인 모달로 실수 방지
- ✅ **플랜 삭제 기능**
  - 개별 삭제 (PlanItem 연쇄 삭제)
  - 일괄 삭제 (선택된 플랜 일괄 삭제)
- ✅ **Test Plans 페이지 UI 개선**
  - 필터 토글: All Plans / Active Only / Archived Only
  - All Plans 뷰: 섹션 헤더 + 테이블 구조로 Active/Archived 분리
  - 각 섹션별 개수 배지 표시
  - 페이지네이션: 섹션당 10개 항목, 초과 시 페이지 번호 표시
- ✅ **체크박스 일괄 선택 기능**
  - 테이블 헤더에 전체 선택 체크박스
  - 선택된 항목 수 표시
  - 선택 시 상단에 Archive/Restore/Delete 버튼 노출
  - Indeterminate 상태 지원 (일부 선택 시)

##### 백엔드 변경사항
- 새 API 엔드포인트:
  - `PATCH /api/plans/:planId/archive` - 플랜 아카이브
  - `PATCH /api/plans/:planId/unarchive` - 플랜 복원
  - `DELETE /api/plans/:planId` - 플랜 삭제
  - `PATCH /api/plans/bulk/archive` - 일괄 아카이브
  - `PATCH /api/plans/bulk/unarchive` - 일괄 복원
  - `DELETE /api/plans/bulk` - 일괄 삭제
- `GET /api/plans` - status 필터 개선 (ALL 옵션 추가)

##### 프론트엔드 변경사항
- `plan.ts` API:
  - `archivePlan()`, `unarchivePlan()`, `deletePlan()` 함수 추가
  - `bulkArchivePlans()`, `bulkUnarchivePlans()`, `bulkDeletePlans()` 함수 추가
  - `PlanStatusFilter` 타입 추가 ('ACTIVE' | 'ARCHIVED' | 'ALL')
- `PlansPage.tsx` 전면 개선:
  - 섹션 분리 뷰 (All Plans)
  - 페이지네이션 컴포넌트
  - 체크박스 일괄 선택
  - 일괄 액션 버튼 (상단)
  - 확인 모달 (Archive/Restore/Delete)

---

#### 7-5. Test Plan/Run 페이지 TestRail 스타일 리디자인

##### 완료 작업
- ✅ **Test Plan 생성 페이지 한글화**
  - 모든 UI 텍스트를 한글로 번역
  - 버튼, 라벨, 플레이스홀더 등 전체 한글화
- ✅ **Test Plan 생성 페이지 섹션 기반 UI**
  - TestCasesPage와 동일한 섹션 헤더 + 케이스 테이블 구조
  - 폴더별 섹션 분리 및 접기/펼치기 기능
  - 섹션별 전체 선택 체크박스
  - 섹션별 독립적인 정렬 기능 (ID, Title, Priority)
  - 검색 기능 (ID 또는 제목으로 필터링)
- ✅ **Test Run (Plan Detail) 페이지 전면 리디자인**
  - TestRail 스타일 레이아웃으로 변경
  - 좌측 "TEST RUNS" 패널 제거
  - 상단 Summary 영역 확대 및 재배치
- ✅ **3열 레이아웃 구현**
  - 좌측: 폴더 트리 패널 (280px, 계층 구조)
  - 중앙: Summary + 테스트 케이스 테이블 (축소된 너비)
  - 우측: 테스트 케이스 디테일 패널 (전체 높이)
- ✅ **상단 Summary 영역 개선**
  - 파이 차트 (Passed/Blocked/In Progress/Failed/Untested 색상별)
  - 상태별 Legend (2열 그리드)
  - 진행률 표시 (큰 퍼센트 숫자)
  - 메타 정보 (생성자, 날짜)
  - 액션 버튼 (아카이브/복원, 삭제) 타이틀 행에 배치
- ✅ **폴더 트리 패널**
  - 계층 구조로 폴더 표시 (부모-자식 관계 반영)
  - 폴더 접기/펼치기 가능 (화살표 클릭)
  - 각 폴더별 케이스 개수 표시
  - "전체" 옵션으로 모든 케이스 보기
  - 폴더 선택 시 해당 폴더의 케이스만 필터링
  - 패널 열기/닫기 버튼
- ✅ **테스트 케이스 테이블 컴팩트화**
  - 컬럼 너비 축소 및 최적화
  - ID 형식 간소화 (C123)
  - Priority 첫 글자만 표시 (H/M/L)
  - 폰트 크기 축소
- ✅ **디테일 패널 개선**
  - 케이스 미선택 시 안내 메시지 표시
  - 전체 높이 사용 (위아래 여백 없음)
  - 선택된 케이스의 상세 정보 표시

##### 백엔드 변경사항
- `GET /api/plans/:planId` - 테스트 케이스의 폴더 정보 포함
  - `testCase.folder` 관계 추가 (id, name, parentId)

##### 프론트엔드 변경사항
- `CreatePlanPage.tsx` 전면 재구현:
  - 섹션 기반 테스트 케이스 선택 UI
  - `buildSections()` 헬퍼 함수
  - `SectionHeader`, `SectionTableHeader`, `TestCaseRow` 컴포넌트
  - 섹션별 정렬 상태 관리
- `PlanDetailPage.tsx` 전면 재구현:
  - 3열 레이아웃 (폴더 + 테이블 + 디테일)
  - `PieChart` 컴포넌트 (SVG 기반)
  - `StatusLegend` 컴포넌트
  - `FolderTreePanel` 컴포넌트 (계층 구조)
  - `FolderTreeItem` 컴포넌트 (재귀적 렌더링)
  - 폴더 트리 상태 관리 (expandedFolders)
- `TestCaseDetailColumn.tsx` 개선:
  - 전체 너비/높이 사용
  - 헤더 패딩 축소

##### 레이아웃 구조
```
┌─────────────────────────────────────────────────────────────────────────────┐
│ ← 플랜 목록  |  다른 플랜 선택 ▼                                             │
├──────────┬─────────────────────────────────────┬────────────────────────────┤
│          │ [R1234] Plan Name [활성]  [복원][삭제]│                            │
│  폴더    │ ┌────┐ ● Passed  ● Blocked   80%   │                            │
│  트리    │ │ 🥧 │ ● Progress ● Failed  passed │   테스트 케이스 디테일      │
│  패널    │ └────┘                    N/M      │        패널                │
│          ├─────────────────────────────────────┤   (전체 높이 사용)         │
│  280px   │  [폴더] N/M 케이스  [검색...]        │                            │
│          │ ☐ ID    Title        Pri Assign Res│   케이스 선택 시           │
│          │ ☐ C1    Test Case 1   H   user  PASS│   상세 정보 표시           │
│          │ ☐ C2    Test Case 2   M   -     FAIL│                            │
└──────────┴─────────────────────────────────────┴────────────────────────────┘
```

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
  order     Float      @default(0) // 같은 레벨 내 정렬 순서
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
  caseNumber     Int        @unique              // OVDR 형식 ID용 (OVDR0001, OVDR0002...)
  title          String
  description    String?
  precondition   String?
  steps          String?
  expectedResult String?
  priority       String     @default("MEDIUM")   // LOW, MEDIUM, HIGH
  sequence       Float      @default(0)          // 폴더 내 정렬 순서
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

## 🎯 현재 상태 (As of 2025-12-03)

### 완성된 기능
- ✅ 인증 및 권한 관리 (회원가입, 로그인, 관리자 승인)
- ✅ 테스트 케이스 전체 CRUD (생성, 조회, 수정, 삭제)
- ✅ 계층형 폴더 구조 (최대 5단계 깊이)
- ✅ 폴더 드래그앤드롭 (순서 변경, 부모/자식 관계 변경)
- ✅ 폴더 이름 변경
- ✅ **폴더 삭제** (개별/일괄, 하위 폴더 및 케이스 연쇄 삭제)
- ✅ 테스트케이스 드래그앤드롭 (순서 변경, 폴더 이동)
- ✅ 테스트케이스 다중 선택 및 일괄 이동
- ✅ 테스트케이스 ID 형식 (OVDR0001, OVDR0002...)
- ✅ **TestRail 스타일 섹션 기반 레이아웃** (섹션 헤더 + 테이블)
- ✅ **섹션별 정렬 기능** (ID, Title, Priority)
- ✅ **테스트케이스 디테일 패널** (우측 슬라이드)
- ✅ **Rich Text Editor 이미지 첨부** (업로드 + 라이트박스)
- ✅ **상위 폴더 선택 시 하위 케이스 통합 표시**
- ✅ CSV Import/Export
- ✅ 테스트 플랜 생성 및 관리
- ✅ **테스트 플랜 아카이브** (Archive/Restore, 개별/일괄)
- ✅ **테스트 플랜 삭제** (개별/일괄, 확인 모달)
- ✅ **플랜 목록 페이지네이션** (섹션당 10개)
- ✅ 테스트 실행 및 결과 기록 (5가지 상태)
- ✅ Bulk Select & Edit (일괄 편집/삭제)
- ✅ **3열 레이아웃** (폴더 트리 + 테이블 + 디테일 패널)
- ✅ **TestRail 스타일 Test Run 페이지** (파이 차트 + 상태 Legend)
- ✅ **폴더 트리 패널** (계층 구조, 접기/펼치기)
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
2. ~~**테스트 케이스 순서 변경**~~ → **완료 (Phase 8)**
   - ~~Drag & Drop으로 순서 조정~~
   - ~~`sequence` 필드 활용~~
   - ~~폴더로 드래그앤드롭 이동~~
3. ~~**이미지 첨부 기능**~~ → **완료 (Phase 9)**
   - ~~Rich Text Editor에 이미지 업로드~~
   - ~~이미지 라이트박스 (확대/회전)~~

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

마지막 업데이트: 2025-12-03 (Phase 7 완료)

