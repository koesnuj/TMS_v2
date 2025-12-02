# TMS - Test Management System

**가장 쉽게 테스트 케이스를 관리하는 방법**

복잡한 TestRail은 이제 그만! 직관적인 UI로 테스트 케이스를 작성하고, 실행 결과를 한눈에 확인하세요.

---

## 주요 기능

### 테스트 케이스 관리가 쉬워요

폴더별로 테스트를 정리하고, 드래그 앤 드롭으로 자유롭게 이동할 수 있어요. Rich Text Editor로 상세한 테스트 절차를 작성하세요.

### 테스트 실행 계획(Plan)

필요한 테스트만 선택해서 Plan을 만들고, 팀원에게 할당하세요. 실행 결과를 바로바로 기록할 수 있어요.

### 한눈에 보는 결과

도넛 차트와 프로그레스 바로 테스트 진행률을 실시간으로 확인하세요. Pass/Fail/Block 상태가 한눈에 들어와요.

### CSV로 간편하게

기존에 쓰던 엑셀 파일을 그대로 업로드하거나, 언제든 다운로드할 수 있어요.

### 권한 관리

관리자 승인 시스템으로 팀원을 안전하게 관리하고, 역할에 따라 접근 권한을 제어할 수 있어요.

---

## 설치하기

### 백엔드 실행

```bash
cd backend
npm install
cp env.example .env
# .env 파일을 열어서 설정값을 입력하세요
npm run prisma:generate
npm run prisma:migrate
npm run dev
```

서버가 `http://localhost:3001`에서 실행됩니다.

### 프론트엔드 실행

```bash
cd frontend
npm install
npm run dev
```

서버가 `http://localhost:5173`에서 실행됩니다.

---

## 사용 방법

### 시작하기

1. 프론트엔드 주소로 접속하면 로그인 화면이 나와요
2. 회원가입 후 관리자 승인을 받으세요 (첫 사용자는 자동으로 관리자가 돼요!)
3. 로그인하면 바로 사용할 수 있어요

### 테스트 케이스 만들기

* 좌측 폴더 트리에서 폴더를 만들고
* 테스트 케이스를 추가하세요
* 제목, 설명, 테스트 절차, 예상 결과를 작성할 수 있어요

### Plan 실행하기

* Plan 메뉴에서 새 계획을 만들고
* 실행할 테스트들을 선택하세요
* 담당자를 지정하고 결과를 기록하세요

---

## 활용 사례

### QA 팀의 테스트 관리

팀원들과 함께 테스트 케이스를 작성하고, 릴리즈마다 Plan을 만들어 실행 결과를 추적하세요.

### 개인 프로젝트 테스트

혼자서도 체계적으로 테스트를 관리하고 싶다면, TMS로 간편하게 시작하세요.

### 회귀 테스트

기존 테스트 케이스를 재사용해서 빠르게 회귀 테스트를 진행하세요.

---

## 기술 스택

### 백엔드
* **Electron 30** - Express + TypeScript
* **Prisma** - SQLite 기반 ORM
* **JWT** - 안전한 인증

### 프론트엔드
* **React 18** - TypeScript로 작성
* **Vite** - 빠른 개발 환경
* **Tailwind CSS** - 모던한 UI
* **Tiptap** - Rich Text Editor
* **@dnd-kit** - 드래그 앤 드롭

---

## 프로젝트 구조

```
TMS_v2/
├── backend/          # Express API 서버
├── frontend/         # React 프론트엔드
└── MD/               # 문서들
```

---

## 문서

자세한 내용은 아래 문서를 참고하세요:

* [backend/README.md](./backend/README.md) - API 문서
* [MD/SETUP_GUIDE.md](./MD/SETUP_GUIDE.md) - 설치 가이드
* [MD/PROJECT_SUMMARY.md](./MD/PROJECT_SUMMARY.md) - 프로젝트 요약

---

## 라이선스

MIT License - 자유롭게 사용하고 수정하세요!

---

**즐거운 테스팅 되세요! 🚀**

