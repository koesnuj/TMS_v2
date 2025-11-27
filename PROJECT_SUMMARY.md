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
   - **프론트엔드**: `cd frontend && npm run dev` (http://localhost:5173)

3. **테스트 계정**
   - **관리자 (Admin)**: `julim@krafton.com` / `123456` (첫 실행 시 자동 생성되거나, 직접 가입 후 DB에서 role 변경 필요할 수 있음 - 현재 코드는 첫 가입자 자동 Admin 처리)

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
│   │   ├── components/  # 재사용 컴포넌트 (Navbar, Layout, Modals)
│   │   ├── pages/       # 페이지 컴포넌트
│   │   └── context/     # 전역 상태 (Auth)
│   └── index.css        # Tailwind + Global Styles
│
└── tests/             # E2E 테스트 (Playwright)
```

### 기술 스택
- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Lucide Icons
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
- [x] 테스트 케이스 생성/조회 (우선순위, 전제조건 등)
- [x] **CSV Import**: 엑셀/CSV 파일을 통한 대량 등록 기능

### C. 테스트 계획 및 실행 (Test Planning & Execution)
- [x] 테스트 플랜 생성 (케이스 검색 및 선택)
- [x] **실행 인터페이스**:
  - 상태 변경 (Pass/Fail/Block/Not Run)
  - 결과 자동 집계 및 진행률 바 표시
  - **Bulk Update**: 다중 선택 후 일괄 결과 적용
  - **Smart Comment**: URL 자동 링크 변환 기능

### D. UI/UX (Design)
- [x] **TestRail Style UI**: 
  - Blue Theme & Tab Navigation 적용
  - 직관적인 아이콘 및 반응형 레이아웃
- [x] 관리자 대시보드 (Notion-style Tech Stack 카드 포함)

---

## 4. 📝 최근 작업 로그 (Last Session)

**날짜**: 2025-11-27
**작업 내용**: UI 리디자인 및 테스트 실행 기능 안정화

1. **UI 테마 변경**: 29CM Green 테마 시도 후 **TestRail Blue 테마**로 최종 확정.
   - Navbar, Tabs, Table 스타일을 엔터프라이즈급으로 개선.
2. **관리자 페이지 개선**: Notion 스타일의 기술 스택 요약 카드 추가 및 UI 현대화.
3. **E2E 테스트 완료**: `tests/plan_execution.spec.ts`를 통해 실행 프로세스 검증 완료.

---

## 5. 🔜 다음 작업 계획 (Next Steps)

1. **리포팅 (Reporting)**
   - 플랜별 결과 리포트 페이지 구현
   - 파이 차트/바 차트를 활용한 시각화 (Recharts 등 도입 고려)

2. **CI/CD 파이프라인**
   - GitHub Actions를 이용한 자동 배포 및 테스트 설정

3. **편의성 개선**
   - 테스트 케이스 순서 변경 (Drag & Drop)
   - 이미지 첨부 기능 (현재는 텍스트만 가능)
