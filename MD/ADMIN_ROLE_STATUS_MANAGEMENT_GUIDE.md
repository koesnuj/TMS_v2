# Admin Role & Status 관리 가이드

## 🎯 목표

관리자(Admin)가 사용자의 Role과 Status를 직접 변경할 수 있는 UI와 API를 구현하여,
더 유연한 사용자 관리를 가능하게 합니다.

---

## 📐 구현 내용

### 1. 기능 개요

#### Role 변경
- **Admin 권한 전용**: 관리자만 사용자 Role 변경 가능
- **드롭다운 선택**: 테이블에서 직접 Role 선택
- **선택 옵션**: 
  - `관리자` (ADMIN)
  - `사용자` (USER)
- **확인 모달**: 변경 전 확인 절차
- **실시간 반영**: 변경 즉시 UI 업데이트

#### Status 변경
- **Admin 권한 전용**: 관리자만 사용자 Status 변경 가능
- **드롭다운 선택**: 테이블에서 직접 Status 선택
- **선택 옵션**:
  - `활성` (ACTIVE) - 초록색 배지
  - `비활성` (REJECTED) - 회색 배지
- **확인 모달**: 변경 전 확인 절차
- **실시간 반영**: 변경 즉시 UI 업데이트

---

## 💻 구현 상세

### 1. API 함수 추가

**파일**: `frontend/src/api/admin.ts`

```typescript
export interface UpdateUserRoleData {
  email: string;
  role: 'ADMIN' | 'USER';
}

export interface UpdateUserStatusData {
  email: string;
  status: 'ACTIVE' | 'REJECTED';
}

/**
 * 사용자 Role 변경
 */
export const updateUserRole = async (data: UpdateUserRoleData): Promise<any> => {
  const response = await api.patch('/admin/users/role', data);
  return response.data;
};

/**
 * 사용자 Status 변경
 */
export const updateUserStatus = async (data: UpdateUserStatusData): Promise<any> => {
  const response = await api.patch('/admin/users/status', data);
  return response.data;
};
```

---

### 2. AdminPage 컴포넌트 수정

**파일**: `frontend/src/pages/AdminPage.tsx`

#### State 추가

```typescript
// Confirm modal state
const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
const [confirmModalData, setConfirmModalData] = useState<{
  title: string;
  message: string;
  onConfirm: () => void;
} | null>(null);

// 현재 사용자 정보
const { user: currentUser } = useAuth();
const isAdmin = currentUser?.role === 'ADMIN';
```

#### Role 변경 핸들러

```typescript
const handleRoleChange = (user: User, newRole: 'ADMIN' | 'USER') => {
  if (user.role === newRole) return;
  
  const roleText = newRole === 'ADMIN' ? '관리자' : '사용자';
  setConfirmModalData({
    title: 'Role 변경 확인',
    message: `${user.name}(${user.email})의 Role을 "${roleText}"(으)로 변경하시겠습니까?`,
    onConfirm: async () => {
      try {
        await updateUserRole({ email: user.email, role: newRole });
        loadUsers();
        setMessage('사용자 Role이 변경되었습니다.');
        setTimeout(() => setMessage(''), 3000);
      } catch (error) {
        alert('Role 변경에 실패했습니다.');
      }
    }
  });
  setIsConfirmModalOpen(true);
};
```

#### Status 변경 핸들러

```typescript
const handleStatusChange = (user: User, newStatus: 'ACTIVE' | 'REJECTED') => {
  if (user.status === newStatus) return;
  
  const statusText = newStatus === 'ACTIVE' ? '활성' : '비활성';
  setConfirmModalData({
    title: 'Status 변경 확인',
    message: `${user.name}(${user.email})의 Status를 "${statusText}"(으)로 변경하시겠습니까?`,
    onConfirm: async () => {
      try {
        await updateUserStatus({ email: user.email, status: newStatus });
        loadUsers();
        setMessage('사용자 Status가 변경되었습니다.');
        setTimeout(() => setMessage(''), 3000);
      } catch (error) {
        alert('Status 변경에 실패했습니다.');
      }
    }
  });
  setIsConfirmModalOpen(true);
};
```

---

### 3. UI 컴포넌트

#### Role 드롭다운

```tsx
<td className="px-6 py-4 whitespace-nowrap">
  {isAdmin ? (
    <select
      value={user.role}
      onChange={(e) => handleRoleChange(user, e.target.value as 'ADMIN' | 'USER')}
      className={`text-xs font-medium uppercase tracking-wide rounded-full px-3 py-1.5 border-0 cursor-pointer focus:ring-2 focus:ring-offset-1 transition-colors ${
        user.role === 'ADMIN' 
          ? 'bg-indigo-100 text-indigo-800 hover:bg-indigo-200 focus:ring-indigo-500' 
          : 'bg-slate-100 text-slate-800 hover:bg-slate-200 focus:ring-slate-500'
      }`}
    >
      <option value="ADMIN">관리자</option>
      <option value="USER">사용자</option>
    </select>
  ) : (
    <Badge variant={user.role === 'ADMIN' ? 'primary' : 'neutral'}>
      {user.role === 'ADMIN' ? '관리자' : '사용자'}
    </Badge>
  )}
</td>
```

**특징**:
- Admin 권한: 드롭다운 표시 (변경 가능)
- 일반 사용자: Badge 표시 (읽기 전용)
- 동적 스타일: Role에 따라 색상 변경
  - ADMIN: Indigo (인디고)
  - USER: Slate (회색)

#### Status 드롭다운

```tsx
<td className="px-6 py-4 whitespace-nowrap">
  {isAdmin ? (
    <select
      value={user.status}
      onChange={(e) => handleStatusChange(user, e.target.value as 'ACTIVE' | 'REJECTED')}
      className={`text-xs font-medium uppercase tracking-wide rounded-full px-3 py-1.5 border-0 cursor-pointer focus:ring-2 focus:ring-offset-1 transition-colors ${
        user.status === 'ACTIVE' 
          ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200 focus:ring-emerald-500' 
          : 'bg-slate-300 text-slate-700 hover:bg-slate-400 focus:ring-slate-500'
      }`}
    >
      <option value="ACTIVE">활성</option>
      <option value="REJECTED">비활성</option>
    </select>
  ) : (
    <Badge variant={user.status === 'ACTIVE' ? 'success' : 'neutral'}>
      {user.status === 'ACTIVE' ? '활성' : '비활성'}
    </Badge>
  )}
</td>
```

**특징**:
- Admin 권한: 드롭다운 표시 (변경 가능)
- 일반 사용자: Badge 표시 (읽기 전용)
- 동적 스타일: Status에 따라 색상 변경
  - ACTIVE: Emerald (초록)
  - REJECTED: Slate (회색)

#### 확인 모달

```tsx
{confirmModalData && (
  <ConfirmModal
    isOpen={isConfirmModalOpen}
    onClose={() => {
      setIsConfirmModalOpen(false);
      setConfirmModalData(null);
    }}
    onConfirm={confirmModalData.onConfirm}
    title={confirmModalData.title}
    message={confirmModalData.message}
    confirmText="변경"
    cancelText="취소"
    variant="warning"
  />
)}
```

---

### 4. 백엔드 API

#### Role 변경 API

**파일**: `backend/src/controllers/adminController.ts`

```typescript
export async function updateUserRole(req: Request, res: Response): Promise<void> {
  try {
    const { email, role } = req.body;

    // 유효성 검증
    if (!email || !role) {
      res.status(400).json({
        success: false,
        message: '이메일과 역할(USER/ADMIN)은 필수 항목입니다.',
      });
      return;
    }

    if (role !== 'USER' && role !== 'ADMIN') {
      res.status(400).json({
        success: false,
        message: '역할은 "USER" 또는 "ADMIN"만 가능합니다.',
      });
      return;
    }

    // 사용자 조회
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      res.status(404).json({
        success: false,
        message: '사용자를 찾을 수 없습니다.',
      });
      return;
    }

    // 역할 업데이트
    const updatedUser = await prisma.user.update({
      where: { email },
      data: { role },
    });

    res.status(200).json({
      success: true,
      message: '사용자 역할이 변경되었습니다.',
      user: updatedUser,
    });
  } catch (error) {
    console.error('Update user role error:', error);
    res.status(500).json({
      success: false,
      message: '사용자 역할 업데이트 중 오류가 발생했습니다.',
    });
  }
}
```

#### Status 변경 API

```typescript
export async function updateUserStatus(req: Request, res: Response): Promise<void> {
  try {
    const { email, status } = req.body;

    // 유효성 검증
    if (!email || !status) {
      res.status(400).json({
        success: false,
        message: '이메일과 상태(ACTIVE/REJECTED)는 필수 항목입니다.',
      });
      return;
    }

    if (status !== 'ACTIVE' && status !== 'REJECTED' && status !== 'PENDING') {
      res.status(400).json({
        success: false,
        message: '상태는 "ACTIVE", "REJECTED", "PENDING"만 가능합니다.',
      });
      return;
    }

    // 사용자 조회
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      res.status(404).json({
        success: false,
        message: '사용자를 찾을 수 없습니다.',
      });
      return;
    }

    // 상태 업데이트
    const updatedUser = await prisma.user.update({
      where: { email },
      data: { status },
    });

    res.status(200).json({
      success: true,
      message: '사용자 상태가 변경되었습니다.',
      user: updatedUser,
    });
  } catch (error) {
    console.error('Update user status error:', error);
    res.status(500).json({
      success: false,
      message: '사용자 상태 업데이트 중 오류가 발생했습니다.',
    });
  }
}
```

#### 라우트 추가

**파일**: `backend/src/routes/admin.ts`

```typescript
/**
 * @route   PATCH /api/admin/users/role
 * @desc    사용자 역할 변경
 * @access  Private (Admin only)
 */
router.patch('/users/role', updateUserRole);

/**
 * @route   PATCH /api/admin/users/status
 * @desc    사용자 상태 변경
 * @access  Private (Admin only)
 */
router.patch('/users/status', updateUserStatus);
```

---

## 🎨 색상 시스템

### Role 색상

#### ADMIN (관리자)
```css
bg-indigo-100        /* 배경: 연한 인디고 */
text-indigo-800      /* 텍스트: 진한 인디고 */
hover:bg-indigo-200  /* 호버: 중간 인디고 */
focus:ring-indigo-500 /* 포커스: 인디고 링 */
```

#### USER (사용자)
```css
bg-slate-100         /* 배경: 연한 회색 */
text-slate-800       /* 텍스트: 진한 회색 */
hover:bg-slate-200   /* 호버: 중간 회색 */
focus:ring-slate-500 /* 포커스: 회색 링 */
```

### Status 색상

#### ACTIVE (활성)
```css
bg-emerald-100        /* 배경: 연한 초록 */
text-emerald-800      /* 텍스트: 진한 초록 */
hover:bg-emerald-200  /* 호버: 중간 초록 */
focus:ring-emerald-500 /* 포커스: 초록 링 */
```

#### REJECTED (비활성)
```css
bg-slate-300         /* 배경: 진한 회색 */
text-slate-700       /* 텍스트: 중간 회색 */
hover:bg-slate-400   /* 호버: 더 진한 회색 */
focus:ring-slate-500 /* 포커스: 회색 링 */
```

---

## 🔄 사용 흐름

### Role 변경

```
1. Admin이 사용자 테이블에서 Role 드롭다운 클릭
   ↓
2. "관리자" 또는 "사용자" 선택
   ↓
3. handleRoleChange() 실행
   - 현재 Role과 비교 (동일하면 무시)
   - 확인 모달 데이터 설정
   - 모달 열기
   ↓
4. 확인 모달 표시
   - 제목: "Role 변경 확인"
   - 메시지: "홍길동(user@example.com)의 Role을 "관리자"(으)로 변경하시겠습니까?"
   - 버튼: [취소] [변경]
   ↓
5. 사용자 액션
   - "변경" 클릭 → API 호출
   - "취소" 클릭 → 모달 닫기
   ↓
6. API 호출 (변경 클릭 시)
   - PATCH /api/admin/users/role
   - { email, role }
   ↓
7. 성공 처리
   - 사용자 목록 다시 로드
   - 성공 메시지 표시: "사용자 Role이 변경되었습니다."
   - 3초 후 메시지 자동 사라짐
```

### Status 변경

```
1. Admin이 사용자 테이블에서 Status 드롭다운 클릭
   ↓
2. "활성" 또는 "비활성" 선택
   ↓
3. handleStatusChange() 실행
   - 현재 Status와 비교 (동일하면 무시)
   - 확인 모달 데이터 설정
   - 모달 열기
   ↓
4. 확인 모달 표시
   - 제목: "Status 변경 확인"
   - 메시지: "홍길동(user@example.com)의 Status를 "활성"(으)로 변경하시겠습니까?"
   - 버튼: [취소] [변경]
   ↓
5. 사용자 액션
   - "변경" 클릭 → API 호출
   - "취소" 클릭 → 모달 닫기
   ↓
6. API 호출 (변경 클릭 시)
   - PATCH /api/admin/users/status
   - { email, status }
   ↓
7. 성공 처리
   - 사용자 목록 다시 로드
   - 성공 메시지 표시: "사용자 Status가 변경되었습니다."
   - 3초 후 메시지 자동 사라짐
```

---

## 🔒 권한 체크

### 프론트엔드

```typescript
const { user: currentUser } = useAuth();
const isAdmin = currentUser?.role === 'ADMIN';

// 조건부 렌더링
{isAdmin ? (
  <select>...</select>  // 드롭다운 (변경 가능)
) : (
  <Badge>...</Badge>    // 배지 (읽기 전용)
)}
```

### 백엔드

```typescript
// 미들웨어: backend/src/routes/admin.ts
router.use(authenticateToken);  // JWT 인증
router.use(requireAdmin);        // Admin 권한 체크
```

모든 `/api/admin/*` 라우트는 자동으로 Admin 권한이 필요합니다.

---

## 📊 비교표

| 항목 | Before | After |
|------|--------|-------|
| **Role 변경** | 불가능 | Admin이 드롭다운으로 변경 |
| **Status 변경** | Approve/Reject 버튼만 | Admin이 드롭다운으로 자유롭게 변경 |
| **권한 체크** | 없음 | 프론트엔드 + 백엔드 이중 체크 |
| **확인 절차** | 없음 | 커스텀 모달로 확인 |
| **UI 피드백** | 없음 | 성공 메시지 토스트 (3초) |
| **색상 구분** | 단순 Badge | 동적 색상 (Role/Status별) |
| **일반 사용자** | - | Badge만 표시 (읽기 전용) |

---

## 🎯 사용 시나리오

### 1. 사용자를 관리자로 승격

```
상황: 김철수를 관리자로 승격하고 싶음

1. Admin 페이지 접속
2. All Users 테이블에서 김철수 찾기
3. Role 드롭다운 클릭
4. "관리자" 선택
5. 확인 모달: "김철수(kim@example.com)의 Role을 "관리자"(으)로 변경하시겠습니까?"
6. "변경" 클릭
7. 성공 메시지: "사용자 Role이 변경되었습니다."
8. 테이블에서 Role이 즉시 "관리자" (Indigo Badge)로 표시
```

### 2. 비활성 사용자를 다시 활성화

```
상황: 퇴사 후 복귀한 직원을 다시 활성화

1. Admin 페이지 접속
2. All Users 테이블에서 해당 사용자 찾기
3. Status가 "비활성" (회색)으로 표시됨
4. Status 드롭다운 클릭
5. "활성" 선택
6. 확인 모달: "이지은(lee@example.com)의 Status를 "활성"(으)로 변경하시겠습니까?"
7. "변경" 클릭
8. 성공 메시지: "사용자 Status가 변경되었습니다."
9. 테이블에서 Status가 즉시 "활성" (초록 Badge)로 표시
```

### 3. 관리자를 일반 사용자로 강등

```
상황: 권한 남용 또는 역할 변경

1. Admin 페이지 접속
2. All Users 테이블에서 해당 관리자 찾기
3. Role 드롭다운 클릭
4. "사용자" 선택
5. 확인 모달: "박민수(park@example.com)의 Role을 "사용자"(으)로 변경하시겠습니까?"
6. "변경" 클릭
7. 성공 메시지: "사용자 Role이 변경되었습니다."
8. 테이블에서 Role이 즉시 "사용자" (회색 Badge)로 표시
```

---

## ✅ 체크리스트

### 프론트엔드
- [x] API 함수 추가 (`updateUserRole`, `updateUserStatus`)
- [x] AdminPage에 상태 추가 (모달 데이터)
- [x] Role 변경 핸들러 구현
- [x] Status 변경 핸들러 구현
- [x] 권한 체크 로직 (`isAdmin`)
- [x] Role 드롭다운 UI 구현
- [x] Status 드롭다운 UI 구현
- [x] 확인 모달 통합
- [x] 성공 메시지 토스트
- [x] 동적 색상 스타일링

### 백엔드
- [x] `updateUserRole` 컨트롤러 구현
- [x] `updateUserStatus` 컨트롤러 구현
- [x] 유효성 검증 (email, role, status)
- [x] 라우트 추가 (`PATCH /api/admin/users/role`, `/status`)
- [x] Admin 권한 미들웨어 적용
- [x] 에러 핸들링

### 테스트
- [ ] Admin으로 Role 변경
- [ ] Admin으로 Status 변경
- [ ] 일반 사용자로 접속 시 드롭다운 숨김 확인
- [ ] 확인 모달 표시 확인
- [ ] 취소 버튼 클릭 시 변경 안 됨 확인
- [ ] 변경 버튼 클릭 시 API 호출 확인
- [ ] 성공 메시지 표시 확인
- [ ] 테이블 즉시 업데이트 확인
- [ ] 동일한 값 선택 시 무시 확인

---

## 🚀 결론

Admin Role & Status 관리 기능을 통해:

1. ✅ **유연한 사용자 관리**: 드롭다운으로 즉시 변경 가능
2. ✅ **권한 기반 접근**: Admin만 변경 가능, 일반 사용자는 읽기 전용
3. ✅ **안전한 변경**: 확인 모달로 실수 방지
4. ✅ **명확한 피드백**: 성공 메시지와 즉시 UI 반영
5. ✅ **직관적인 UI**: 색상으로 Role/Status 구분
6. ✅ **일관된 경험**: 다른 TMS 기능과 동일한 모달 스타일

관리자가 사용자 권한을 더 효율적으로 관리할 수 있게 되었습니다! 🎉

