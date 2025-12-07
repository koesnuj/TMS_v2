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

### 1. 레포지토리 클론
```bash
git clone <repository-url>
cd TMS_v2
```

### 2. 백엔드 설정 및 실행
```bash
cd backend
npm install          # 자동으로 Prisma 설정 완료
npm run dev          # 서버 시작
```

실행 주소: `http://localhost:3001`

> **참고**: SQLite를 사용하므로 별도의 데이터베이스 설치가 필요하지 않습니다.
> `npm install` 시 자동으로 데이터베이스 테이블이 생성됩니다.

### 3. 프론트엔드 설정 및 실행 (새 터미널)
```bash
cd frontend
npm install
npm run dev
```

실행 주소: `http://localhost:5173`

### 4. 첫 사용
1. `http://localhost:5173`에 접속
2. 회원가입 (첫 사용자는 자동으로 관리자 권한 부여)
3. 로그인 후 시스템 사용

> 💡 **더 자세한 설정 가이드**: [SETUP_GUIDE.md](./SETUP_GUIDE.md) 참고

---

## 사용법

1. 회원가입 및 관리자 승인 (첫 사용자는 자동 관리자 지정)
2. 로그인
3. 폴더 생성 및 테스트 케이스 작성
4. Plan 생성 및 테스트 실행

---

## 기술 스택

### 백엔드
- Electron 30 (Express + TypeScript)
- Prisma (SQLite)
- JWT

### 프론트엔드
- React 18 (TypeScript)
- Vite
- Tailwind CSS
- Tiptap
- @dnd-kit

---

## 프로젝트 구조
```
TMS_v2/
├── backend/          # Express API 서버
└── frontend/         # React 프론트엔드
```

---

## 배포

Railway와 Vercel에 배포하는 방법은 [DEPLOYMENT.md](./DEPLOYMENT.md)를 참고하세요.

---

## 라이선스

MIT License
