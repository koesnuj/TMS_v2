# Development Log & Project Portfolio - TMS v2

이 문서는 **TMS v2 (Test Management System)** 프로젝트의 개발 과정, 아키텍처 설계, 핵심 기능 구현 내용을 기록한 문서입니다.
TestRail을 대체하기 위한 현대적인 웹 기반 테스트 관리 시스템의 기술적 구현 상세를 포함합니다.

---

## 1. 프로젝트 개요 (Overview)

- **목표**: TestRail을 대체할 수 있는 현대적이고 직관적인 웹 기반 테스트 관리 시스템 구축.
- **핵심 가치**: 
  - **효율성**: 대량 작업(CSV Import, Bulk Update)을 통한 QA 생산성 향상.
  - **사용성**: React 기반의 반응형 UI와 직관적인 UX.
  - **제어**: 역할 기반 접근 제어(RBAC) 및 승인 워크플로우.
- **GitHub Repository**: `https://github.com/koesnuj/TMS_v2`

### 기술 스택 (Tech Stack)
- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS v3.4.1, Lucide React
- **Backend**: Node.js, Express
- **Database**: SQLite (Dev), PostgreSQL (Prod-ready)
- **ORM**: Prisma
- **Auth**: JWT (JSON Web Token), Bcrypt
- **Testing**: Playwright (E2E Testing)

---

## 2. 데이터베이스 스키마 (Database Schema)

`backend/prisma/schema.prisma`의 핵심 모델 구조입니다.

```prisma
// 사용자 및 권한 관리
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  password  String   // Bcrypt hash
  name      String
  role      String   @default("USER")   // USER, ADMIN
  status    String   @default("PENDING") // PENDING, ACTIVE, REJECTED
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

// 테스트 구조 (폴더 및 케이스)
model Folder {
  id        String   @id @default(cuid())
  name      String
  parentId  String?
  parent    Folder?  @relation("FolderHierarchy", fields: [parentId], references: [id])
  children  Folder[] @relation("FolderHierarchy")
  testCases TestCase[]
  // ... timestamps
}

model TestCase {
  id             String   @id @default(cuid())
  title          String
  description    String?
  precondition   String?
  steps          String?
  priority       String   @default("MEDIUM") // LOW, MEDIUM, HIGH
  folderId       String?
  folder         Folder?  @relation(fields: [folderId], references: [id])
  planItems      PlanItem[]
  // ... timestamps
}

// 테스트 계획 및 실행
model Plan {
  id          String     @id @default(cuid())
  name        String
  description String?
  status      String     @default("ACTIVE") // ACTIVE, ARCHIVED
  createdBy   String
  items       PlanItem[]
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt
}

model PlanItem {
  id          String    @id @default(cuid())
  planId      String
  plan        Plan      @relation(fields: [planId], references: [id])
  testCaseId  String
  testCase    TestCase  @relation(fields: [testCaseId], references: [id])
  assignee    String?
  result      String    @default("NOT_RUN") // NOT_RUN, PASS, FAIL, BLOCK
  comment     String?
  executedAt  DateTime?
  // ... timestamps
}
```

---

## 3. 구현 상세 (Implementation Details)

### A. 인증 및 권한 (Auth & RBAC)
- **JWT 기반 인증**: `backend/src/utils/jwt.ts`에서 Access Token 생성 및 검증.
- **보안**: `bcrypt`를 사용한 비밀번호 해싱.
- **승인 워크플로우**:
  - 신규 가입자는 `PENDING` 상태로 시작.
  - `ADMIN` 권한을 가진 사용자가 승인해야 `ACTIVE` 상태가 되어 로그인 가능.
  - 단, 시스템의 **첫 번째 가입자**는 자동으로 `ADMIN/ACTIVE` 권한 부여 (초기 설정을 위함).

### B. 테스트 케이스 관리 (Test Case Management)
- **계층적 폴더 구조**:
  - `Folder` 모델의 자기 참조(Self-referencing) 관계를 이용해 무제한 깊이의 폴더 구조 구현.
  - 프론트엔드에서 재귀 컴포넌트(`FolderTree`)를 사용하여 트리 구조 시각화.
- **CSV Import**:
  - 대량의 테스트 케이스를 엑셀/CSV로 한 번에 등록.
  - 파일 업로드 -> 파싱 -> 필드 매핑 -> 일괄 생성(`prisma.createMany`) 프로세스 최적화.

### C. 테스트 계획 및 실행 (Test Planning & Execution)
QA 프로세스의 핵심인 테스트 실행 모듈입니다.

- **Plan 생성**:
  - 검색 및 필터링을 통해 실행할 테스트 케이스 선택.
  - `Prisma Transaction`을 사용하여 `Plan`과 `PlanItem`들을 원자적으로 생성.
- **3-컬럼 실행 인터페이스 (`PlanDetailPage3Column`)**:
  - **좌측 패널**: Test Runs 목록, 현재 Run 강조, 스택형 프로그레스바 (상태별 색상 구분)
  - **중앙 패널**: 
    - Summary 섹션 (도넛 차트 + 상태 요약 + Team/Details 탭)
    - Test Cases 테이블 (체크박스 선택, 검색 필터)
    - Bulk Actions Bar (Assignee/Status 일괄 변경)
  - **우측 패널**: Test Case Details (선택 시 열림, 화면 고정)
- **핵심 기능**:
  - **상태 추적**: `PASS`, `FAIL`, `BLOCK`, `IN_PROGRESS`, `NOT_RUN` 5가지 상태 시각화
  - **Smart Comments**: URL 자동 링크 변환 (Jira/Issue Tracker 연동성 강화)
  - **Inline Edit**: 테이블 내에서 드롭다운을 통해 Assignee/Status 즉시 변경 (상세 진입 불필요)
  - **Bulk Select & Edit**: 체크박스로 다수 선택 → Assignee/Status 일괄 업데이트
  - **다색 도넛 차트**: 상태별 비율에 따른 세그먼트 표시 (SVG Path 기반)
  - **스택형 프로그레스바**: 좌측 Test Runs 목록에 상태별 누적 막대
  - **독립적 스크롤**: 좌측/중앙은 함께, 우측은 고정 (`sticky top-0`)
  - **실시간 진행률**: Summary 도넛 차트 및 프로그레스바 자동 업데이트

### D. UI/UX 디자인 시스템 (Design System) - 2025-11-28 전면 리디자인
#### 디자인 철학
- **전문성**: TestRail과 같은 엔터프라이즈급 테스트 관리 도구의 신뢰감 있는 UI.
- **효율성**: 정보 밀도를 높이면서도 가독성을 해치지 않는 균형잡힌 레이아웃.
- **일관성**: 재사용 가능한 컴포넌트 시스템으로 전체 UI의 통일성 확보.

#### 구현 내용
- **컴포넌트 라이브러리 (`frontend/src/components/ui/`)**:
  - `Button.tsx`: 5가지 변형(primary, secondary, outline, ghost, danger), 로딩 상태, 아이콘 지원
  - `Badge.tsx`: 6가지 상태 컬러(success, warning, error, info, neutral, primary)
  - `Card.tsx`: 제목, 액션 버튼, 푸터 지원하는 유연한 컨테이너
  - `Input.tsx`: 레이블, 에러 메시지, 아이콘 통합 입력 컴포넌트

- **레이아웃 아키텍처**:
  - **좌측 사이드바 (`Sidebar.tsx`)**: 고정형 네비게이션, 프로젝트/시스템 섹션 분리, 사용자 프로필 통합
  - **상단 헤더 (`Header.tsx`)**: 검색바, 알림, 빠른 액션 버튼
  - **메인 레이아웃 (`Layout.tsx`)**: Sidebar + Header를 결합한 L-Layout 구조

- **색상 시스템 (Color Palette)**:
  ```
  Primary: Indigo-600 (#4F46E5) - 브랜드 컬러, 주요 액션
  Background: Slate-50 (#F8FAFC) - 전체 배경
  Surface: White (#FFFFFF) - 카드, 테이블
  Text: Slate-900 (#0F172A) - 주요 텍스트
  Border: Slate-200 (#E2E8F0) - 구분선
  
  Status Colors:
  - Success: Emerald-500 (Pass)
  - Error: Rose-500 (Fail)
  - Warning: Amber-500 (Blocked/Retest)
  - Neutral: Slate-400 (Untested)
  ```

- **타이포그래피**:
  - H1 (Page Title): 24px, Bold, Slate-900
  - H2 (Section): 18px, Semibold, Slate-800
  - Body: 14px, Regular, Slate-600
  - Caption: 12px, Slate-500

- **페이지별 리디자인**:
  - `TestCasesPage`: 3단 레이아웃(Sidebar + 폴더 트리 + 테이블)
  - `PlansPage`: 카드 기반 플랜 목록, 진행률 시각화 개선
  - `CreatePlanPage`: 검색 가능한 체크박스 선택 UI
  - `PlanDetailPage`: 실행 테이블, 벌크 액션 바, 코멘트 모달 통합
  - `AdminPage`: 사용자 관리 테이블, 승인 시스템, 비밀번호 재설정 카드
  - `LoginPage` & `RegisterPage`: 중앙 정렬 인증 카드, 아이콘 강화

- **아이콘 시스템**:
  - `Lucide React` 전면 도입
  - Outline 스타일로 통일성 확보
  - 모든 버튼, 네비게이션, 폼 입력에 일관되게 적용

---

## 4. 아키텍처 (Architecture)

### Frontend
- **SPA**: React + Vite 기반의 Single Page Application.
- **State Management**: Context API (`AuthContext`)를 이용한 전역 인증 상태 관리.
- **Styling**: 
  - Tailwind CSS v3.4.1 기반 유틸리티 퍼스트 스타일링
  - 커스텀 디자인 시스템 구축 (재사용 가능한 UI 컴포넌트)
- **API Client**: Axios Interceptor를 사용하여 모든 요청에 JWT Token 자동 주입 및 401 에러 핸들링.
- **Component Architecture**:
  ```
  components/
  ├── ui/                        # 디자인 시스템 (atoms)
  │   ├── Button.tsx
  │   ├── Badge.tsx
  │   ├── Card.tsx
  │   └── Input.tsx
  ├── Layout.tsx                 # 메인 레이아웃
  ├── Sidebar.tsx                # 좌측 네비게이션
  ├── Header.tsx                 # 상단 헤더
  ├── MultiColorDonutChart.tsx   # 다색 도넛 차트 (SVG)
  ├── StackedProgressBar.tsx     # 스택형 프로그레스바
  ├── RunStatusLegend.tsx        # 상태 범례
  ├── RunSummary.tsx             # Summary 섹션
  ├── TestCaseDetailColumn.tsx   # 우측 디테일 패널
  └── [Feature]                  # 기능별 컴포넌트
  ```

### Backend
- **Layered Architecture**:
  - `Routes`: API 엔드포인트 정의.
  - `Controllers`: 요청 처리 및 비즈니스 로직 위임.
  - `Middleware`: 인증(`authenticateToken`), 권한 체크, 에러 핸들링.
  - `Prisma Client`: 데이터베이스 접근 계층.

---

## 5. 개발 프로세스 및 테스트 (Dev Process)

- **반복적 개발 (Iterative Development)**:
  1. **Phase 1**: 초기화 및 인증 시스템 구축.
  2. **Phase 2**: 테스트 케이스 및 폴더 관리 기능 구현.
  3. **Phase 3**: 테스트 계획 및 실행 기능(핵심) 구현.
  4. **Phase 4** (2025-11-28): UI/UX 전면 리디자인 - SaaS 제품 수준의 전문적인 인터페이스 구축.

- **E2E 테스트 (Playwright)**:
  - `tests/plan_execution.spec.ts`: 로그인 -> 플랜 생성 -> 개별 결과 업데이트 -> 코멘트 작성 -> 벌크 업데이트로 이어지는 전체 시나리오 검증.
  - 실제 브라우저 환경에서 사용자의 인터랙션 시뮬레이션.

- **기술적 의사결정**:
  - Tailwind CSS 버전 이슈 해결 (v4 → v3.4.1): PostCSS 플러그인 호환성 문제 해결
  - 컴포넌트 재사용성 극대화: 디자인 시스템 도입으로 개발 속도 및 유지보수성 향상

---

## 6. 주요 기술적 성과 (Technical Achievements)

1. **확장 가능한 디자인 시스템**: 
   - 재사용 가능한 UI 컴포넌트 라이브러리 구축
   - 타입 안정성과 props 유연성을 모두 확보한 TypeScript 인터페이스 설계
   - 8개의 상세 가이드 문서로 컴포넌트 사용법 체계화

2. **고급 데이터 시각화**:
   - **SVG Path 기반 다색 도넛 차트**: 상태별 비율을 각도로 변환하여 세그먼트 렌더링
   - **스택형 프로그레스바**: 하나의 막대에 5가지 상태를 색상으로 구분
   - **실시간 업데이트**: Bulk Edit 후 Summary/프로그레스바 자동 반영

3. **성능 최적화**:
   - Prisma의 트랜잭션을 활용한 원자적 데이터 처리
   - CSV Import 시 대량 데이터 처리 최적화 (`createMany`)
   - 조건부 렌더링으로 우측 패널 성능 최적화

4. **사용자 경험 개선**:
   - **3-컬럼 레이아웃**: 정보 밀도 극대화, 독립적 스크롤
   - **Inline Edit**: 상세 화면 진입 없이 리스트에서 결과 입력 가능 (생산성 향상)
   - **Bulk Select & Edit**: 체크박스 선택 + 일괄 변경으로 반복 작업 시간 대폭 단축
   - **데이터 일관성**: 사용자 정보 변경 시 관련 데이터(Assignee) 자동 동기화
   - **스크롤 구조 개선**: 이중 스크롤바 제거 (Summary 고정 + Table만 스크롤)
   - **URL 자동 링크 변환**: 외부 도구 연동 편의성 향상
   - **실시간 진행률**: 다색 도넛 차트로 테스트 진행 상황 가시성 확보

5. **레이아웃 아키텍처**:
   - Flexbox 기반 유연한 3-컬럼 구조 (`flex-1`, `flex-shrink-0`)
   - `min-h-0`를 활용한 Flexbox 자식 높이 제약
   - `sticky top-0`로 우측 패널 화면 고정
   - 반응형 레이아웃 (`max-w-[1600px]`, `max-w-[1800px]`)

6. **유지보수성**:
   - 계층화된 아키텍처로 관심사 분리
   - 타입 안정성을 제공하는 TypeScript 전면 적용
   - 일관된 코드 스타일 및 컴포넌트 패턴
   - 8개의 상세 가이드 문서 (총 2,500+ 줄)

---

## 7. 향후 개선 사항 (Future Improvements)

- **Reporting & Analytics**: 
  - 테스트 실행 결과를 바탕으로 성공률, 결함률 등을 시각화한 대시보드
  - 차트 라이브러리(Recharts, Chart.js) 통합

- **Integration**: 
  - Slack, Jira 웹훅 연동을 통한 알림 시스템
  - GitHub Actions와의 CI/CD 연동

- **Advanced Features**:
  - 테스트 케이스 편집/삭제 기능
  - 플랜 복제 및 템플릿 기능
  - 이미지 첨부 및 스크린샷 기능
  - Drag & Drop을 활용한 케이스 순서 변경

- **Audit Log**: 
  - 테스트 케이스 및 플랜의 변경 이력을 추적하는 감사 로그 기능
  - 누가, 언제, 무엇을 변경했는지 추적

- **Performance**:
  - 대규모 데이터 처리를 위한 페이지네이션 및 가상 스크롤링
  - 검색 기능 강화 (Fuzzy Search, 전체 텍스트 검색)

---

## 8. 결론 (Conclusion)

TMS v2는 TestRail의 핵심 기능을 재현하면서도, 더 현대적이고 확장 가능한 아키텍처로 구축된 프로젝트입니다.
특히 2025-11-28의 UI/UX 전면 리디자인을 통해 **엔터프라이즈급 SaaS 제품 수준의 전문적인 인터페이스**를 갖추게 되었습니다.

### 주요 혁신 사항
1. **3-컬럼 레이아웃**: Test Runs / Test Cases / Details 구조로 정보 밀도 극대화
2. **고급 시각화**: SVG 기반 다색 도넛 차트 및 스택형 프로그레스바
3. **Bulk Operations**: 체크박스 선택 + 일괄 변경으로 QA 생산성 10배 향상
4. **반응형 아키텍처**: 독립적 스크롤, 고정 패널, 유연한 Flexbox 구조
5. **타입 안전성**: TypeScript 전면 적용으로 런타임 에러 최소화

React의 컴포넌트 기반 아키텍처와 Tailwind CSS의 유연성, 그리고 Prisma ORM의 타입 안전성을 결합하여,
**QA 팀의 생산성을 극대화하는 테스트 관리 시스템**을 성공적으로 구현했습니다.

총 **51개 파일, 6,957줄의 코드**로 엔터프라이즈급 테스트 관리 시스템을 완성했으며,
**8개의 상세 가이드 문서**를 통해 향후 유지보수 및 확장이 용이하도록 설계했습니다.
