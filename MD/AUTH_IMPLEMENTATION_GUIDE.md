# TMS 인증/권한 구현 가이드

## 개요

이 문서는 TMS(Test Management System)의 인증 및 권한 관리 기능을 Express 백엔드로 분리하여 구현하는 과정을 단계별로 설명합니다.

---

## 아키텍처 구조

### 전체 구조
```
┌─────────────────┐         ┌─────────────────┐         ┌──────────────┐
│  Frontend       │         │  Backend        │         │  PostgreSQL  │
│  (React+Vite)   │ ◄─────► │  (Express)      │ ◄─────► │  Database    │
│  Port: 5173     │   API   │  Port: 3001     │   ORM   │              │
└─────────────────┘         └─────────────────┘         └──────────────┘
```

### 기술 스택
- **Frontend**: React + TypeScript + Vite
- **Backend**: Node.js + Express + TypeScript
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: JWT (jsonwebtoken)
- **Password Hashing**: bcrypt

---

## 구현 단계

### 1단계: 백엔드 프로젝트 초기 설정 ✅

백엔드를 독립적인 디렉토리로 구성합니다.

#### 폴더 구조
```
backend/
├── src/
│   ├── index.ts              # Express 서버 엔트리
│   ├── routes/
│   │   ├── auth.ts           # 인증 관련 라우트
│   │   └── admin.ts          # 관리자 라우트
│   ├── middleware/
│   │   ├── auth.ts           # JWT 검증 미들웨어
│   │   └── roleCheck.ts      # 권한 체크 미들웨어
│   ├── controllers/
│   │   ├── authController.ts # 인증 컨트롤러
│   │   └── adminController.ts # 관리자 컨트롤러
│   └── utils/
│       ├── jwt.ts            # JWT 유틸리티
│       └── password.ts       # 비밀번호 해싱 유틸리티
├── prisma/
│   └── schema.prisma         # Prisma 스키마
├── package.json
└── tsconfig.json
```

---

### 2단계: 데이터베이스 스키마 정의 ✅

#### User 모델 (Prisma Schema)
```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  password  String
  name      String
  role      Role     @default(USER)
  status    Status   @default(PENDING)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

enum Role {
  USER
  ADMIN
}

enum Status {
  PENDING
  ACTIVE
  REJECTED
}
```

---

### 3단계: 인증 API 구현 ✅

#### 3.1 회원가입 API
- **Endpoint**: `POST /api/auth/signup`
- **요청 Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "securePassword123",
    "name": "홍길동"
  }
  ```
- **응답**:
  ```json
  {
    "success": true,
    "message": "회원가입이 완료되었습니다. 관리자 승인을 기다려 주세요.",
    "user": {
      "id": "clxxx...",
      "email": "user@example.com",
      "name": "홍길동",
      "status": "PENDING"
    }
  }
  ```

#### 3.2 로그인 API
- **Endpoint**: `POST /api/auth/login`
- **요청 Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "securePassword123"
  }
  ```
- **응답**:
  ```json
  {
    "success": true,
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "clxxx...",
      "email": "user@example.com",
      "name": "홍길동",
      "role": "USER",
      "status": "ACTIVE"
    }
  }
  ```

---

### 4단계: 관리자 API 구현 ✅

#### 4.1 가입 대기 사용자 조회
- **Endpoint**: `GET /api/admin/pending-users`
- **권한**: ADMIN만 접근 가능
- **응답**:
  ```json
  {
    "success": true,
    "users": [
      {
        "id": "clxxx...",
        "email": "pending@example.com",
        "name": "대기자",
        "status": "PENDING",
        "createdAt": "2025-11-27T..."
      }
    ]
  }
  ```

#### 4.2 사용자 승인/거절
- **Endpoint**: `PATCH /api/admin/users/approve`
- **권한**: ADMIN만 접근 가능
- **요청 Body**:
  ```json
  {
    "email": "pending@example.com",
    "action": "approve"  // "approve" 또는 "reject"
  }
  ```

#### 4.3 비밀번호 초기화
- **Endpoint**: `POST /api/admin/users/reset-password`
- **권한**: ADMIN만 접근 가능
- **요청 Body**:
  ```json
  {
    "email": "user@example.com",
    "newPassword": "newPassword123"
  }
  ```

---

### 5단계: 미들웨어 구현 ✅

#### 5.1 JWT 검증 미들웨어
- `src/middleware/auth.ts`에 구현
- Authorization 헤더에서 Bearer 토큰 추출
- JWT 검증 후 `req.user`에 사용자 정보 저장
- 유효하지 않으면 401 반환

#### 5.2 권한 체크 미들웨어
- `src/middleware/roleCheck.ts`에 구현
- `requireAdmin`: role이 ADMIN인지 검사, 아니면 403 반환
- `requireActive`: status가 ACTIVE인지 검사

---

### 6단계: 프론트엔드 연동 ✅

#### 페이지 구성
1. **로그인 페이지** (`/login`) - 이메일/비밀번호 입력 및 로그인
2. **회원가입 페이지** (`/register`) - 신규 사용자 가입
3. **홈 페이지** (`/`) - 로그인 후 메인 대시보드
4. **관리자 페이지** (`/admin`) - 사용자 관리 (ADMIN 전용)

#### API 클라이언트 구성
- Axios 인스턴스 생성 (`src/api/axios.ts`)
- 요청 인터셉터: 모든 API 요청에 자동으로 JWT 토큰 추가
- 응답 인터셉터: 401 에러 시 자동 로그아웃 처리
- LocalStorage에 토큰 및 사용자 정보 저장

#### 인증 컨텍스트
- React Context API로 전역 인증 상태 관리
- `useAuth` 훅으로 어디서든 사용자 정보 접근 가능
- `PrivateRoute` 컴포넌트로 보호된 페이지 구현

---

## ✅ 구현 완료

모든 단계가 완료되었습니다!

---

## 실행 방법

### 백엔드 실행

1. PostgreSQL 데이터베이스 준비
2. `backend` 폴더로 이동
3. 의존성 설치: `npm install`
4. 환경 변수 설정: `env.example`을 참고하여 `.env` 파일 생성
5. Prisma 마이그레이션: `npm run prisma:migrate`
6. Prisma Client 생성: `npm run prisma:generate`
7. 개발 서버 실행: `npm run dev`
8. 서버가 `http://localhost:3001`에서 실행됩니다.

### 프론트엔드 실행

1. `frontend` 폴더로 이동
2. 의존성 설치: `npm install`
3. 개발 서버 실행: `npm run dev`
4. 브라우저에서 `http://localhost:5173` 접속

### 첫 사용자 등록

- 처음 회원가입하는 사용자는 자동으로 **ADMIN** 권한과 **ACTIVE** 상태로 생성됩니다.
- 이후 가입하는 사용자는 **USER** 권한과 **PENDING** 상태로 생성되며, 관리자의 승인이 필요합니다.

---

## 핵심 코드 설명

### 백엔드

#### JWT 생성 및 검증 (`src/utils/jwt.ts`)
```typescript
export function generateToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, JWT_SECRET) as JwtPayload;
}
```

#### 비밀번호 해싱 (`src/utils/password.ts`)
```typescript
export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, SALT_ROUNDS);
}

export async function comparePassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return await bcrypt.compare(password, hashedPassword);
}
```

#### 인증 미들웨어 (`src/middleware/auth.ts`)
```typescript
export function authenticateToken(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({ success: false, message: '인증 토큰이 필요합니다.' });
    return;
  }

  try {
    const decoded = verifyToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ success: false, message: '유효하지 않거나 만료된 토큰입니다.' });
  }
}
```

#### 관리자 권한 체크 (`src/middleware/roleCheck.ts`)
```typescript
export function requireAdmin(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void {
  if (req.user?.role !== 'ADMIN') {
    res.status(403).json({ success: false, message: '관리자 권한이 필요합니다.' });
    return;
  }
  next();
}
```

### 프론트엔드

#### Axios 인터셉터 (`src/api/axios.ts`)
```typescript
// 요청 인터셉터: 토큰 자동 추가
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 응답 인터셉터: 401 에러 시 로그아웃
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('accessToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

#### 보호된 라우트 (`src/components/PrivateRoute.tsx`)
```typescript
const PrivateRoute: React.FC<PrivateRouteProps> = ({ children, requireAdmin = false }) => {
  const { isAuthenticated, isAdmin } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requireAdmin && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};
```

---

## 보안 고려사항

1. **비밀번호 보안**
   - bcrypt를 사용하여 비밀번호를 안전하게 해시화
   - Salt rounds는 10으로 설정 (보안과 성능의 균형)

2. **JWT 토큰**
   - 토큰에는 민감한 정보(비밀번호 등)를 포함하지 않음
   - 만료 시간을 설정하여 토큰의 수명 제한
   - 환경 변수로 JWT_SECRET 관리 (하드코딩 금지)

3. **CORS 설정**
   - 허용된 origin만 API에 접근 가능
   - Credentials 포함 요청 허용

4. **권한 체크**
   - 모든 보호된 API는 미들웨어로 권한 검증
   - 관리자 전용 API는 이중 검증 (인증 + 역할 체크)

5. **입력 검증**
   - 이메일, 비밀번호 등 필수 필드 검증
   - 비밀번호 최소 길이 제한 (6자 이상)

---

## 추가 개선 사항 (향후 작업)

- [ ] Refresh Token 구현 (Access Token 재발급)
- [ ] 이메일 인증 기능
- [ ] 비밀번호 찾기 기능
- [ ] 로그인 시도 제한 (Brute Force 방어)
- [ ] 감사 로그 (Audit Log)
- [ ] 2단계 인증 (2FA)
- [ ] 사용자 프로필 수정 기능
- [ ] 역할 세분화 (QA, Viewer 등)

---

## 참고 사항

- 기존 Next.js 프로젝트(`tms` 폴더)는 그대로 유지됩니다.
- 새로운 Express 백엔드와 React 프론트엔드는 독립적으로 실행됩니다.
- 데이터베이스는 PostgreSQL을 사용합니다. (개발 환경에서는 SQLite도 가능)

