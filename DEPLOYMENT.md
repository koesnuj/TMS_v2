# 🚀 배포 가이드

이 문서는 TMS v2.0을 Railway(백엔드)와 Vercel(프론트엔드)에 배포하는 방법을 설명합니다.

## 📋 목차

1. [백엔드 배포 (Railway)](#백엔드-배포-railway)
2. [프론트엔드 배포 (Vercel)](#프론트엔드-배포-vercel)
3. [환경 변수 설정](#환경-변수-설정)
4. [배포 후 확인](#배포-후-확인)
5. [문제 해결](#문제-해결)

---

## 백엔드 배포 (Railway)

### 1. Railway 프로젝트 생성

1. [Railway](https://railway.app) 접속 및 로그인
2. "New Project" 클릭
3. "Deploy from GitHub repo" 선택
4. TMS_v2 레포지토리 선택
5. 루트 디렉토리를 `backend`로 설정

### 2. Railway 환경 변수 설정

Railway 대시보드에서 다음 환경 변수를 설정하세요:

```env
# 필수 환경 변수
NODE_ENV=production
PORT=3001
JWT_SECRET=your-production-secret-key-change-this-to-random-string

# 선택적 환경 변수
JWT_EXPIRES_IN=7d
FRONTEND_URL=https://your-app.vercel.app
```

> ⚠️ **중요**: `JWT_SECRET`은 강력한 랜덤 문자열로 변경하세요!

### 3. Railway 배포 확인

- Railway가 자동으로 빌드 및 배포를 시작합니다
- 배포 로그에서 다음 메시지를 확인하세요:
  ```
  ✅ Generated Prisma Client
  🚀 TMS Backend Server
  ```
- Railway URL: `https://tmsv2-production.up.railway.app`

### 4. 헬스 체크

```bash
curl https://tmsv2-production.up.railway.app/health
```

정상 응답:
```json
{
  "success": true,
  "message": "TMS Backend Server is running",
  "timestamp": "..."
}
```

---

## 프론트엔드 배포 (Vercel)

### 1. Vercel 프로젝트 생성

1. [Vercel](https://vercel.com) 접속 및 로그인
2. "Add New Project" 클릭
3. GitHub 레포지토리 import
4. **Root Directory**: `frontend` 선택
5. **Framework Preset**: Vite 자동 감지

### 2. Vercel 환경 변수 설정

배포 전 Environment Variables에 다음을 추가:

```env
VITE_API_URL=https://tmsv2-production.up.railway.app/api
```

### 3. Vercel 배포

- "Deploy" 클릭
- 첫 배포 완료 후 URL 확인 (예: `https://tms-v2.vercel.app`)

### 4. Railway 환경 변수 업데이트

백엔드(Railway)의 `FRONTEND_URL`을 Vercel URL로 업데이트:

```env
FRONTEND_URL=https://tms-v2.vercel.app
```

Railway 서비스를 재배포하세요.

---

## 환경 변수 설정

### Railway (백엔드)

| 변수명 | 필수 | 기본값 | 설명 |
|--------|------|--------|------|
| `NODE_ENV` | ✅ | - | `production` |
| `PORT` | ✅ | 3001 | Railway가 자동 할당할 수도 있음 |
| `JWT_SECRET` | ✅ | - | JWT 서명용 시크릿 키 (강력한 랜덤 문자열) |
| `JWT_EXPIRES_IN` | ❌ | 7d | 토큰 만료 시간 |
| `FRONTEND_URL` | ❌ | - | Vercel 프론트엔드 URL (CORS) |

### Vercel (프론트엔드)

| 변수명 | 필수 | 값 |
|--------|------|-----|
| `VITE_API_URL` | ✅ | `https://tmsv2-production.up.railway.app/api` |

---

## 배포 후 확인

### 1. 백엔드 헬스 체크

```bash
curl https://tmsv2-production.up.railway.app/health
```

### 2. 프론트엔드 접속

브라우저에서 Vercel URL 접속:
```
https://tms-v2.vercel.app
```

### 3. 전체 플로우 테스트

1. ✅ 프론트엔드 로딩
2. ✅ 회원가입 기능
3. ✅ 로그인 기능
4. ✅ 테스트케이스 CRUD
5. ✅ 이미지 업로드

---

## 문제 해결

### ❌ CORS 오류

**증상**: 프론트엔드에서 API 요청 시 CORS 에러

**해결**:
1. Railway의 `FRONTEND_URL` 환경 변수가 정확한지 확인
2. Vercel 도메인이 `https://`로 시작하는지 확인
3. Railway 서비스 재배포

### ❌ 401 Unauthorized

**증상**: 로그인 후 모든 요청이 401 반환

**해결**:
1. Railway의 `JWT_SECRET`이 설정되었는지 확인
2. 프론트엔드가 올바른 API URL을 사용하는지 확인
3. 브라우저 개발자 도구 → Network 탭에서 요청 확인

### ❌ Database 오류

**증상**: `prisma.user.findUnique()` 에러

**해결**:
1. Railway 빌드 로그에서 마이그레이션 성공 확인
2. Railway 환경에서 수동 마이그레이션:
   ```bash
   railway run npx prisma migrate deploy
   ```

### ❌ 이미지 업로드 실패

**증상**: 이미지가 업로드되지 않음

**해결**:
Railway는 파일 시스템이 임시적입니다. 프로덕션 환경에서는 다음 중 하나를 사용하세요:
- AWS S3
- Cloudinary
- Vercel Blob Storage

---

## 🔧 수동 배포 (Railway CLI)

Railway CLI를 사용한 배포:

```bash
# Railway CLI 설치
npm i -g @railway/cli

# 로그인
railway login

# 프로젝트 연결
railway link

# 백엔드 배포
cd backend
railway up

# 로그 확인
railway logs
```

---

## 📊 모니터링

### Railway 로그 확인

```bash
railway logs --follow
```

### Vercel 배포 로그

Vercel 대시보드 → Deployments → 해당 배포 클릭

---

## 🔄 자동 배포

### GitHub 통합

Railway와 Vercel 모두 GitHub과 연동되어 있으면:
- `main` 브랜치에 push 시 자동 배포
- PR 생성 시 프리뷰 환경 자동 생성

---

## 📝 체크리스트

배포 전 확인사항:

- [ ] Railway 백엔드 배포 완료
- [ ] Railway 환경 변수 설정 (`JWT_SECRET`, `FRONTEND_URL`)
- [ ] Railway 헬스 체크 성공
- [ ] Vercel 프론트엔드 배포 완료
- [ ] Vercel 환경 변수 설정 (`VITE_API_URL`)
- [ ] 회원가입/로그인 테스트 성공
- [ ] CORS 설정 확인
- [ ] 첫 사용자 관리자 권한 확인

---

## 🎉 배포 완료!

배포가 완료되면 다음 URL에서 접속 가능합니다:

- **프론트엔드**: https://tms-v2.vercel.app
- **백엔드 API**: https://tmsv2-production.up.railway.app
- **헬스 체크**: https://tmsv2-production.up.railway.app/health

---

## 📚 추가 자료

- [Railway 문서](https://docs.railway.app/)
- [Vercel 문서](https://vercel.com/docs)
- [프로젝트 README](./README.md)
- [설정 가이드](./SETUP_GUIDE.md)

