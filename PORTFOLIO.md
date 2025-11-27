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
- **Frontend**: React, TypeScript, Vite, Tailwind CSS, Lucide Icons
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
- **실행 인터페이스 (`PlanDetailPage`)**:
  - **상태 추적**: `PASS`, `FAIL`, `BLOCK`, `NOT_RUN` 상태를 시각적으로 구분.
  - **Smart Comments**: 코멘트 입력 시 URL(`http://...`)을 감지하여 자동으로 클릭 가능한 링크(`<a>` 태그)로 변환. (Jira/Issue Tracker 연동성 강화)
  - **Bulk Updates**: 체크박스로 다수의 아이템을 선택하여 결과 및 코멘트를 일괄 업데이트.
  - **실시간 진행률**: 전체 아이템 대비 실행된 아이템(NOT_RUN 제외)의 비율을 실시간 Progress Bar로 표시.

### D. UI/UX 디자인 (User Interface)
- **Enterprise Style**: TestRail과 유사한 전문적인 **Blue Theme** 적용.
- **Tab Navigation**: 직관적인 상단 탭 메뉴(`Test Cases`, `Test Plans & Runs`, `Administration`)로 업무 효율성 증대.
- **Responsive Layout**: 다양한 해상도에 대응하는 반응형 디자인 및 `Lucide React` 아이콘을 활용한 직관적인 시각화.
- **Admin Dashboard**: Notion 스타일의 카드 UI를 도입하여 시스템 상태와 기술 스택을 한눈에 파악 가능.

---

## 4. 아키텍처 (Architecture)

### Frontend
- **SPA**: React + Vite 기반의 Single Page Application.
- **State Management**: Context API (`AuthContext`)를 이용한 전역 인증 상태 관리.
- **Styling**: Tailwind CSS를 활용한 유틸리티 퍼스트 스타일링.
- **API Client**: Axios Interceptor를 사용하여 모든 요청에 JWT Token 자동 주입 및 401 에러 핸들링.

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
- **E2E 테스트 (Playwright)**:
  - `tests/plan_execution.spec.ts`: 로그인 -> 플랜 생성 -> 개별 결과 업데이트 -> 코멘트 작성 -> 벌크 업데이트로 이어지는 전체 시나리오 검증.
  - 실제 브라우저 환경에서 사용자의 인터랙션 시뮬레이션.

---

## 6. 향후 개선 사항 (Future Improvements)

- **Reporting**: 테스트 실행 결과를 바탕으로 성공률, 결함률 등을 시각화한 대시보드 차트.
- **Integration**: Slack, Jira 웹훅 연동을 통한 알림 시스템.
- **Audit Log**: 테스트 케이스 및 플랜의 변경 이력을 추적하는 감사 로그 기능.

---
