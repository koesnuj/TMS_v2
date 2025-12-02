# TMS 인증/권한 시스템 - 설치 및 실행 가이드

## 📋 목차

1. [사전 준비](#사전-준비)
2. [백엔드 설치 및 실행](#백엔드-설치-및-실행)
3. [프론트엔드 설치 및 실행](#프론트엔드-설치-및-실행)
4. [테스트](#테스트)
5. [문제 해결](#문제-해결)

---

## 사전 준비

다음 프로그램들이 설치되어 있어야 합니다:

- **Node.js** (v18 이상)
- **npm** 또는 **yarn**
- **PostgreSQL** (v14 이상) - 또는 SQLite로 테스트 가능

---

## 백엔드 설치 및 실행

### 1. 백엔드 디렉토리로 이동

```bash
cd backend
```

### 2. 의존성 설치

```bash
npm install
```

### 3. 환경 변수 설정

`env.example` 파일을 복사하여 `.env` 파일을 생성합니다:

```bash
cp env.example .env
```

`.env` 파일을 열어 데이터베이스 URL과 JWT 비밀키를 설정합니다:

```env
DATABASE_URL="postgresql://username:password@localhost:5432/tms_db"
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
JWT_EXPIRES_IN="7d"
PORT=3001
NODE_ENV="development"
FRONTEND_URL="http://localhost:5173"
```

**SQLite 사용 시** (테스트 환경):
```env
DATABASE_URL="file:./dev.db"
```

그리고 `prisma/schema.prisma` 파일에서 데이터베이스 provider를 변경:
```prisma
datasource db {
  provider = "sqlite"  // postgresql에서 변경
  url      = env("DATABASE_URL")
}
```

### 4. 데이터베이스 마이그레이션

```bash
npm run prisma:migrate
```

처음 실행 시 마이그레이션 이름을 물어봅니다. 예: `init`

### 5. Prisma Client 생성

```bash
npm run prisma:generate
```

### 6. 개발 서버 실행

```bash
npm run dev
```

서버가 `http://localhost:3001`에서 실행됩니다.

### 7. 서버 확인

브라우저나 Postman에서 다음 URL로 접속하여 서버가 정상 작동하는지 확인:

```
http://localhost:3001/health
```

응답:
```json
{
  "success": true,
  "message": "TMS Backend Server is running",
  "timestamp": "2025-11-27T..."
}
```

---

## 프론트엔드 설치 및 실행

### 1. 프론트엔드 디렉토리로 이동

**새 터미널 창을 열고** 다음 명령을 실행합니다:

```bash
cd frontend
```

### 2. 의존성 설치

```bash
npm install
```

### 3. 개발 서버 실행

```bash
npm run dev
```

프론트엔드가 `http://localhost:5173`에서 실행됩니다.

### 4. 브라우저에서 접속

브라우저에서 `http://localhost:5173`을 열면 로그인 페이지가 표시됩니다.

---

## 테스트

### 1. 첫 사용자 등록 (관리자 계정)

1. 회원가입 페이지로 이동 (`http://localhost:5173/register`)
2. 다음 정보를 입력:
   - 이름: `관리자`
   - 이메일: `admin@test.com`
   - 비밀번호: `password123`
3. **회원가입** 버튼 클릭
4. 첫 번째 사용자는 자동으로 ADMIN 권한으로 생성됩니다.

### 2. 로그인

1. 로그인 페이지로 이동 (`http://localhost:5173/login`)
2. 위에서 생성한 계정으로 로그인
3. 로그인 성공 시 홈 페이지로 이동

### 3. 관리자 기능 테스트

1. 상단의 **"관리자 페이지"** 버튼 클릭
2. 다음 기능들을 확인:
   - 가입 대기 사용자 목록 (현재는 비어있음)
   - 전체 사용자 목록 (관리자 계정 1개)
   - 비밀번호 초기화 폼

### 4. 일반 사용자 가입 테스트

1. 로그아웃
2. 새로운 계정으로 회원가입 (예: `user@test.com`)
3. "관리자 승인 대기 중" 메시지 확인
4. 관리자 계정으로 다시 로그인
5. 관리자 페이지에서 가입 대기 사용자 확인
6. **승인** 버튼 클릭
7. 로그아웃 후 일반 사용자 계정으로 로그인 가능 확인

---

## 문제 해결

### 백엔드 서버가 시작되지 않는 경우

1. **PostgreSQL 실행 확인**:
   ```bash
   # Windows (관리자 권한)
   net start postgresql
   
   # macOS
   brew services start postgresql
   
   # Linux
   sudo systemctl start postgresql
   ```

2. **데이터베이스 연결 확인**:
   ```bash
   psql -U postgres
   ```
   
   데이터베이스 생성:
   ```sql
   CREATE DATABASE tms_db;
   ```

3. **포트 충돌 확인**:
   3001 포트가 이미 사용 중이라면 `.env` 파일에서 다른 포트로 변경

### 프론트엔드가 백엔드에 연결되지 않는 경우

1. 백엔드 서버가 실행 중인지 확인
2. `frontend/src/api/axios.ts` 파일에서 `baseURL` 확인:
   ```typescript
   baseURL: 'http://localhost:3001/api',
   ```

### Prisma 마이그레이션 오류

```bash
# 마이그레이션 초기화 (데이터베이스 삭제 후 재생성)
npx prisma migrate reset

# 다시 마이그레이션 실행
npm run prisma:migrate
```

### CORS 오류

백엔드의 `.env` 파일에서 `FRONTEND_URL`이 올바른지 확인:
```env
FRONTEND_URL="http://localhost:5173"
```

---

## 추가 명령어

### 백엔드

```bash
# 프로덕션 빌드
npm run build

# 프로덕션 실행
npm start

# Prisma Studio (데이터베이스 GUI)
npm run prisma:studio
```

### 프론트엔드

```bash
# 프로덕션 빌드
npm run build

# 빌드 미리보기
npm run preview
```

---

## 다음 단계

설치가 완료되었다면 `AUTH_IMPLEMENTATION_GUIDE.md` 문서를 참고하여:
- 시스템 아키텍처 이해하기
- API 엔드포인트 확인하기
- 코드 구조 파악하기
- 추가 기능 개발하기

---

## 지원

문제가 발생하면 다음을 확인하세요:
1. Node.js 버전 (v18 이상)
2. PostgreSQL 실행 상태
3. `.env` 파일 설정
4. 콘솔 에러 메시지

즐거운 개발 되세요! 🚀

