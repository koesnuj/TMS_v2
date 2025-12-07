# TMS v2.0 설정 가이드

이 가이드는 프로젝트를 처음 클론한 후 설정하는 방법을 설명합니다.

## 🚀 빠른 시작 (3분 완성)

### 전제 조건
- Node.js 18 이상 설치 필요
- npm 또는 yarn

### 1단계: 백엔드 설정

```bash
# 백엔드 디렉토리로 이동
cd backend

# 패키지 설치 (자동으로 데이터베이스 설정 완료)
npm install

# 서버 시작
npm run dev
```

✅ 백엔드 서버가 `http://localhost:3001`에서 실행됩니다.

### 2단계: 프론트엔드 설정 (새 터미널)

```bash
# 프론트엔드 디렉토리로 이동
cd frontend

# 패키지 설치
npm install

# 개발 서버 시작
npm run dev
```

✅ 프론트엔드가 `http://localhost:5173`에서 실행됩니다.

### 3단계: 첫 사용자 등록

1. 브라우저에서 `http://localhost:5173` 접속
2. "회원가입" 클릭
3. 정보 입력 후 가입
   - **첫 번째 사용자는 자동으로 관리자 권한이 부여됩니다**
4. 로그인 후 시스템 사용 시작!

---

## 📋 상세 설명

### 왜 간단한가요?

1. **SQLite 사용**: 별도의 PostgreSQL/MySQL 설치 불필요
2. **자동 마이그레이션**: `npm install` 시 자동으로 데이터베이스 테이블 생성
3. **기본 설정 포함**: 환경 변수 없이도 바로 실행 가능

### 데이터베이스 위치

데이터베이스 파일은 `backend/prisma/dev.db`에 생성됩니다.

### 환경 변수 (선택사항)

기본 설정으로 작동하지만, 커스터마이징이 필요하면:

```bash
cd backend
cp env.example .env
# .env 파일 수정
```

---

## 🛠️ 수동 설정 (문제 발생 시)

자동 설정이 실패한 경우:

```bash
cd backend

# Prisma 클라이언트 생성
npx prisma generate

# 데이터베이스 마이그레이션
npx prisma migrate deploy
# 또는
npx prisma migrate dev --name init

# 서버 시작
npm run dev
```

---

## 🔧 추가 명령어

### 데이터베이스 GUI 열기
```bash
cd backend
npm run prisma:studio
```

### 새 마이그레이션 생성
```bash
cd backend
npm run prisma:migrate
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
```

---

## ❓ 문제 해결

### "npm not found" 오류
- Node.js를 설치하거나 재설치 후 터미널을 재시작하세요.

### PowerShell 스크립트 실행 오류
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### 백엔드 포트 충돌 (3001)
`.env` 파일에서 `PORT` 변경:
```env
PORT=3002
```

### 프론트엔드 포트 충돌 (5173)
다른 포트는 Vite가 자동으로 찾아줍니다.

---

## 📚 추가 자료

- [메인 README](./README.md)
- [백엔드 API 문서](./backend/README.md)
- [프로젝트 진행 상황](./project_progress.log)

---

**즐거운 테스트 관리 되세요! 🎉**



