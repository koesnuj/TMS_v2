# 🚀 TMS v2 (Test Management System) 프로젝트 요약

이 문서는 TMS v2 프로젝트의 **실행 방법, 현재 상태, 주요 기능, 기술 스택**을 요약한 문서입니다.
다음 작업자가 이 문서를 통해 프로젝트 컨텍스트를 빠르게 파악하고 개발을 이어갈 수 있도록 작성되었습니다.

---

## 1. 🛠 실행 가이드 (Quick Start)

### 사전 요구사항
- Node.js (v18 이상)
- npm

### 설치 및 실행
1. **저장소 클론 및 의존성 설치**
   ```bash
   git clone https://github.com/koesnuj/TMS_v2.git
   cd TMS_v2
   
   # 백엔드 설정
   cd backend
   npm install
   npm run db:migrate # DB 초기화 (SQLite)
   
   # 프론트엔드 설정 (새 터미널)
   cd ../frontend
   npm install
   ```

2. **서버 실행**
   - **백엔드**: `cd backend && npm run dev` (http://localhost:3001)
   - **프론트엔드**: `cd frontend && npm run dev` (http://localhost:5173 또는 5174)

3. **테스트 계정**
   - **관리자 (Admin)**: 첫 가입자가 자동으로 Admin으로 승인됨
   - 이후 가입자는 Admin의 승인이 필요함 (PENDING 상태)

---

## 2. 🏗 프로젝트 구조 및 기술 스택

### 구조 (Monorepo-like)
```
TMS_v2/
├── backend/           # Express + Prisma (Node.js)
│   ├── src/
│   │   ├── controllers/ # 비즈니스 로직
│   │   ├── routes/      # API 라우팅
│   │   ├── middleware/  # 인증, 권한 체크
│   │   └── utils/       # JWT, Password 유틸
│   ├── prisma/          # DB 스키마 및 SQLite 파일
│   └── tests/           # 백엔드 유닛 테스트 (예정)
│
├── frontend/          # React + Vite (TypeScript)
│   ├── src/
│   │   ├── api/         # API 클라이언트 (Axios)
│   │   ├── components/  # 재사용 컴포넌트
│   │   │   ├── ui/      # 디자인 시스템 (Button, Card, Badge, Input)
│   │   │   ├── Sidebar.tsx, Header.tsx, Layout.tsx
│   │   │   └── FolderTree, Modals
│   │   ├── pages/       # 페이지 컴포넌트
│   │   └── context/     # 전역 상태 (Auth)
│   └── index.css        # Tailwind + Global Styles
│
└── tests/             # E2E 테스트 (Playwright)
```

### 기술 스택
- **Frontend**: 
  - React 18, TypeScript, Vite
  - Tailwind CSS v3.4.1 (커스텀 디자인 시스템)
  - Lucide React (아이콘)
  - jsPDF, XLSX (리포팅)
- **Backend**: Node.js, Express, Prisma ORM
- **Database**: SQLite (Development), PostgreSQL (Production ready)
- **Auth**: JWT (Access Token), Bcrypt
- **Testing**: Playwright (E2E)

---

## 3. ✅ 구현된 주요 기능 (Status)

### A. 인증 (Authentication)
- [x] 회원가입 및 로그인 (JWT)
- [x] 관리자 승인 시스템 (Pending -> Active)
- [x] 역할 기반 접근 제어 (RBAC: Admin / User)

### B. 테스트 케이스 관리 (Test Case Management)
- [x] 계층형 폴더 구조 (무제한 깊이)
- [x] **CRUD 완성**: 생성, 조회, 수정, 삭제 기능
- [x] **폴더 이동**: 케이스의 폴더 변경 및 루트 이동 지원
- [x] **CSV Import**: 엑셀/CSV 파일을 통한 대량 등록 기능

### C. 테스트 계획 및 실행 (Test Planning & Execution)
- [x] 테스트 플랜 생성 (케이스 검색 및 선택)
- [x] **3-컬럼 실행 인터페이스**:
  - 좌측: Test Runs 목록 + 스택형 프로그레스바
  - 중앙: Summary (도넛 차트) + Test Cases 테이블
  - 우측: Test Case Details (선택 시 열림, 화면 고정)
- [x] **핵심 기능**:
  - 5가지 상태 (Pass/Fail/Block/In Progress/Not Run)
  - **다색 도넛 차트**: 상태별 비율 시각화
  - **Bulk Select & Edit**: 체크박스 선택 + Assignee/Status 일괄 변경
  - **실시간 진행률 자동 업데이트**

### D. 대시보드 및 리포팅 (Dashboard & Reporting)
- [x] **대시보드 (Dashboard)**:
  - 통계 위젯 (Total Cases, Active Plans, Executions)
  - 내 할당 작업 (My Assignments) 바로가기
  - 최근 활동 (Recent Activity) 타임라인
- [x] **리포팅 (Export)**:
  - PDF 내보내기 (요약 + 상세 테이블)
  - Excel 내보내기 (Summary 시트 + Details 시트)

---

## 4. 📝 최근 작업 로그 (Last Session)

**날짜**: 2025-12-01
**작업 내용**: 핵심 기능 고도화 (CRUD, Dashboard, Reporting) 및 안정화

### 주요 변경사항
1. **테스트 케이스 CRUD 완성**
   - 생성/수정 통합 모달 (`TestCaseFormModal`) 구현
   - 삭제 기능 및 안전장치(Confirm Modal) 적용
   - 폴더 이동 기능 구현 (드롭다운 트리)
   - 'All Cases' 보기 기능 추가로 UX 개선

2. **대시보드 구현**
   - 홈페이지(`/`)를 대시보드로 전면 개편
   - 사용자별 맞춤 정보(내 작업, 활동 로그) 제공
   - 직관적인 통계 카드 UI 적용

3. **리포팅 시스템 구축**
   - `jspdf`, `jspdf-autotable`, `xlsx` 도입
   - 클라이언트 사이드 리포트 생성으로 서버 부하 최소화
   - 전문적인 포맷의 PDF/Excel 결과물 제공

4. **안정성 강화**
   - 로그인 토큰 처리 버그 수정 (`token` vs `accessToken` 불일치 해결)
   - E2E 테스트 (`testcase_management.spec.ts`) 추가로 주요 시나리오 검증 완료

---

## 5. 🔜 다음 작업 계획 (Next Steps)

1. **편의성 개선**
   - 테스트 케이스 순서 변경 (Drag & Drop)
   - 이미지 첨부 기능 (현재는 텍스트만 가능)
   - 대규모 데이터를 위한 페이지네이션/가상 스크롤링

2. **고급 기능**
   - 플랜 복제 및 재실행
   - 사용자별 알림 시스템 (Slack/Email 연동)
   - 테스트 케이스 버전 관리 (History)

3. **CI/CD 파이프라인**
   - GitHub Actions를 이용한 자동 배포 및 테스트 설정

---

## 6. 📚 참고 문서

### 프로젝트 문서
- **README**: `README.md` - 프로젝트 개요 및 빠른 시작
- **상세 가이드**: `SETUP_GUIDE.md` - 초기 설치 및 설정 방법
- **진행 로그**: `project_progress.log` - 개발 히스토리 및 타임라인

### 기술 가이드 (frontend/)
1. **LAYOUT_GUIDE.md** - 반응형 레이아웃 구조
2. **THREE_COLUMN_RESPONSIVE_GUIDE.md** - 3-컬럼 최적화
3. **BULK_SELECT_EDIT_GUIDE.md** - Bulk Select/Edit 기능
4. **ADMIN_ROLE_STATUS_MANAGEMENT_GUIDE.md** - 관리자 권한 관리
