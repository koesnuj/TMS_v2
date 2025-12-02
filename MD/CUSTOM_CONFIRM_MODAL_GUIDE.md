# Custom Confirm Modal 가이드

## 🎯 목표

브라우저 기본 `window.confirm()` 대신, TMS UI 스타일에 맞는 커스텀 확인 모달을 사용하여 더 나은 사용자 경험을 제공합니다.

---

## 📐 구현 내용

### 1. ConfirmModal 컴포넌트

**파일**: `frontend/src/components/ui/ConfirmModal.tsx`

#### 주요 특징
- ✅ **전체 화면 오버레이**: 반투명 배경 + 블러 효과 (`backdrop-blur-sm`)
- ✅ **중앙 정렬 카드**: 깔끔한 흰색 카드 모달
- ✅ **아이콘 + 제목 + 메시지**: 직관적인 정보 전달
- ✅ **OK/Cancel 버튼**: 명확한 액션 구분
- ✅ **ESC 키 지원**: 키보드로 모달 닫기
- ✅ **백드롭 클릭 닫기**: 모달 외부 클릭 시 닫힘
- ✅ **스크롤 방지**: 모달 열릴 때 배경 스크롤 비활성화
- ✅ **3가지 variant**: `info`, `warning`, `danger` 스타일

---

## 🎨 UI 구조

### 레이아웃
```
┌─────────────────────────────────────┐
│     전체 화면 오버레이 (반투명)        │
│                                     │
│   ┌─────────────────────────────┐   │
│   │  [아이콘]  제목       [X]   │   │
│   │                             │   │
│   │  메시지 내용                │   │
│   │                             │   │
│   ├─────────────────────────────┤   │
│   │         [Cancel]  [OK]      │   │
│   └─────────────────────────────┘   │
│                                     │
└─────────────────────────────────────┘
```

### 색상 시스템

#### Info (기본)
```tsx
variant="info"
- 아이콘 배경: bg-indigo-50
- 아이콘 색상: text-indigo-600
- 확인 버튼: primary (indigo)
```

#### Warning
```tsx
variant="warning"
- 아이콘 배경: bg-amber-50
- 아이콘 색상: text-amber-600
- 확인 버튼: primary (indigo)
```

#### Danger
```tsx
variant="danger"
- 아이콘 배경: bg-red-50
- 아이콘 색상: text-red-600
- 확인 버튼: danger (red)
```

---

## 💻 사용 방법

### 1. 기본 사용 예제

```tsx
import React, { useState } from 'react';
import { ConfirmModal } from './components/ui/ConfirmModal';

const MyComponent = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleDelete = () => {
    console.log('삭제 실행');
    // 실제 삭제 로직
  };

  return (
    <>
      <button onClick={() => setIsModalOpen(true)}>
        Delete
      </button>

      <ConfirmModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleDelete}
        title="Delete Item"
        message="Are you sure you want to delete this item? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />
    </>
  );
};
```

### 2. Bulk Update 예제 (PlanDetailPage3Column)

```tsx
import { ConfirmModal } from '../components/ui/ConfirmModal';

const PlanDetailPage3Column = () => {
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(new Set());
  const [bulkResult, setBulkResult] = useState<TestResult | ''>('');
  const [bulkAssignee, setBulkAssignee] = useState<string>('');

  // Apply 버튼 클릭 시 모달 열기
  const handleApplyClick = () => {
    if (!bulkResult && !bulkAssignee) {
      alert('Please select an assignee or status to update.');
      return;
    }
    setIsConfirmModalOpen(true);
  };

  // 확인 모달에서 OK 클릭 시 실행
  const handleBulkUpdate = async () => {
    try {
      await bulkUpdatePlanItems(planId, {
        items: Array.from(selectedItemIds),
        result: bulkResult,
        assignee: bulkAssignee,
      });
      
      // 초기화
      setSelectedItemIds(new Set());
      setBulkResult('');
      setBulkAssignee('');
      
      // 데이터 다시 로드
      loadPlanDetail(planId);
      loadPlans();
    } catch (error) {
      alert('Bulk update failed');
    }
  };

  return (
    <>
      {/* Bulk Actions Bar */}
      <Button
        onClick={handleApplyClick}
        disabled={!bulkResult && !bulkAssignee}
      >
        Apply
      </Button>

      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={handleBulkUpdate}
        title="Confirm Bulk Update"
        message={`Update ${selectedItemIds.size} test case(s)?`}
        confirmText="Update"
        cancelText="Cancel"
        variant="info"
      />
    </>
  );
};
```

---

## 📝 Props 인터페이스

```typescript
interface ConfirmModalProps {
  // 모달 표시 여부
  isOpen: boolean;
  
  // 모달 닫기 핸들러
  onClose: () => void;
  
  // 확인 버튼 클릭 핸들러 (OK 클릭 시 자동으로 모달 닫힘)
  onConfirm: () => void;
  
  // 모달 제목
  title: string;
  
  // 모달 메시지 (본문)
  message: string;
  
  // 확인 버튼 텍스트 (기본값: "OK")
  confirmText?: string;
  
  // 취소 버튼 텍스트 (기본값: "Cancel")
  cancelText?: string;
  
  // 스타일 variant (기본값: "info")
  variant?: 'danger' | 'warning' | 'info';
}
```

---

## 🎯 주요 기능

### 1. ESC 키로 모달 닫기

```tsx
useEffect(() => {
  const handleEsc = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  if (isOpen) {
    window.addEventListener('keydown', handleEsc);
  }

  return () => {
    window.removeEventListener('keydown', handleEsc);
  };
}, [isOpen, onClose]);
```

### 2. 스크롤 방지

모달이 열릴 때 배경 스크롤을 비활성화합니다.

```tsx
useEffect(() => {
  if (isOpen) {
    document.body.style.overflow = 'hidden';
  }

  return () => {
    document.body.style.overflow = 'unset';
  };
}, [isOpen]);
```

### 3. 백드롭 클릭으로 닫기

모달 외부(백드롭)를 클릭하면 모달이 닫힙니다. 모달 내부 클릭은 무시됩니다.

```tsx
const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
  // 백드롭 클릭 시에만 닫기 (모달 내부 클릭은 제외)
  if (e.target === e.currentTarget) {
    onClose();
  }
};

<div onClick={handleBackdropClick}>
  <div>모달 내용</div>
</div>
```

### 4. 확인 버튼 클릭 시 자동 닫기

```tsx
const handleConfirm = () => {
  onConfirm();  // 사용자 정의 핸들러 실행
  onClose();    // 모달 자동 닫기
};
```

---

## 🎨 스타일링

### 오버레이 (Backdrop)
```css
fixed inset-0              /* 전체 화면 */
z-50                       /* 최상위 레이어 */
flex items-center justify-center  /* 중앙 정렬 */
bg-black/50                /* 반투명 검정 (50%) */
backdrop-blur-sm           /* 블러 효과 */
```

### 모달 카드
```css
bg-white                   /* 흰색 배경 */
rounded-lg                 /* 둥근 모서리 */
shadow-2xl                 /* 큰 그림자 */
max-w-md w-full            /* 최대 너비 448px, 작은 화면에서는 100% */
transform transition-all   /* 애니메이션 준비 */
```

### 아이콘
```css
w-12 h-12                  /* 48px x 48px */
rounded-full               /* 원형 */
bg-indigo-50               /* 배경색 (variant에 따라 다름) */
flex items-center justify-center  /* 중앙 정렬 */
```

### 헤더
```css
flex items-start gap-4     /* 아이콘 + 제목 + 닫기 버튼 */
p-6 pb-4                   /* 패딩 */
```

### 제목
```css
text-lg font-semibold text-slate-900  /* 18px, 굵게, 진한 회색 */
```

### 메시지
```css
text-sm text-slate-600 leading-relaxed  /* 14px, 회색, 줄간격 넓게 */
```

### 액션 버튼 영역
```css
flex items-center justify-end gap-3  /* 우측 정렬, 버튼 간격 */
px-6 py-4                            /* 패딩 */
bg-slate-50                          /* 연한 회색 배경 */
rounded-b-lg                         /* 하단 둥근 모서리 */
border-t border-slate-200            /* 상단 경계선 */
```

---

## 🔄 사용 흐름

### Before (window.confirm)
```tsx
const handleBulkUpdate = async () => {
  // ❌ 브라우저 기본 확인창 (스타일 커스터마이징 불가)
  if (!confirm('Update 3 test case(s)?')) return;
  
  // 실제 업데이트 로직
  await bulkUpdatePlanItems(...);
};
```

### After (ConfirmModal)
```tsx
const [isModalOpen, setIsModalOpen] = useState(false);

const handleApplyClick = () => {
  // ✅ 커스텀 모달 열기
  setIsModalOpen(true);
};

const handleBulkUpdate = async () => {
  // ✅ 확인 후 실행
  await bulkUpdatePlanItems(...);
};

return (
  <>
    <Button onClick={handleApplyClick}>Apply</Button>
    
    <ConfirmModal
      isOpen={isModalOpen}
      onClose={() => setIsModalOpen(false)}
      onConfirm={handleBulkUpdate}
      title="Confirm Bulk Update"
      message="Update 3 test case(s)?"
    />
  </>
);
```

---

## 📊 비교표

| 항목 | window.confirm | ConfirmModal |
|------|----------------|--------------|
| **스타일** | 브라우저 기본 (커스터마이징 불가) | TMS UI 스타일 (완전 커스터마이징) |
| **아이콘** | 없음 | 3가지 variant 아이콘 |
| **위치** | 브라우저 상단 (고정) | 화면 중앙 |
| **배경** | 없음 | 반투명 오버레이 + 블러 |
| **ESC 키** | 지원 안 함 | 지원 |
| **백드롭 클릭** | 지원 안 함 | 지원 |
| **접근성** | 기본 지원 | ARIA 속성 추가 지원 |
| **애니메이션** | 없음 | Tailwind transition |
| **일관성** | 브라우저마다 다름 | 모든 브라우저 동일 |

---

## 🎯 사용 시나리오

### 1. 삭제 확인 (Danger)
```tsx
<ConfirmModal
  title="Delete Test Case"
  message="Are you sure you want to delete this test case? This action cannot be undone."
  confirmText="Delete"
  cancelText="Cancel"
  variant="danger"
  ...
/>
```

### 2. 변경 확인 (Warning)
```tsx
<ConfirmModal
  title="Unsaved Changes"
  message="You have unsaved changes. Do you want to discard them?"
  confirmText="Discard"
  cancelText="Keep Editing"
  variant="warning"
  ...
/>
```

### 3. 일괄 업데이트 (Info)
```tsx
<ConfirmModal
  title="Confirm Bulk Update"
  message={`Update ${count} test case(s)?`}
  confirmText="Update"
  cancelText="Cancel"
  variant="info"
  ...
/>
```

### 4. 승인/거부 (Info)
```tsx
<ConfirmModal
  title="Approve User"
  message={`Approve ${user.name} (${user.email})?`}
  confirmText="Approve"
  cancelText="Cancel"
  variant="info"
  ...
/>
```

---

## 🚀 확장 가능성

### 1. 입력 필드 추가
현재는 확인/취소만 가능하지만, 필요시 입력 필드를 추가할 수 있습니다.

```tsx
// 예: 코멘트 입력이 필요한 경우
<ConfirmModal
  title="Reject User"
  message="Please provide a reason for rejection:"
  confirmText="Reject"
  cancelText="Cancel"
  variant="danger"
>
  <textarea placeholder="Reason..." />
</ConfirmModal>
```

### 2. 다중 버튼
3개 이상의 버튼이 필요한 경우 확장 가능합니다.

```tsx
// 예: Save / Don't Save / Cancel
<ConfirmModal
  title="Save Changes"
  message="Do you want to save your changes?"
  buttons={[
    { text: 'Save', onClick: handleSave, variant: 'primary' },
    { text: "Don't Save", onClick: handleDiscard, variant: 'ghost' },
    { text: 'Cancel', onClick: handleCancel, variant: 'ghost' },
  ]}
  ...
/>
```

### 3. 커스텀 아이콘
특정 상황에 맞는 아이콘을 사용할 수 있습니다.

```tsx
import { Trash, Save, AlertTriangle } from 'lucide-react';

<ConfirmModal
  icon={<Trash size={24} />}
  ...
/>
```

---

## 📝 체크리스트

### 구현 완료
- [x] ConfirmModal 컴포넌트 생성
- [x] Props 인터페이스 정의
- [x] 3가지 variant 스타일
- [x] ESC 키로 닫기
- [x] 백드롭 클릭으로 닫기
- [x] 스크롤 방지
- [x] ARIA 접근성 속성
- [x] PlanDetailPage3Column에 적용
- [x] window.confirm 제거

### 테스트
- [ ] Apply 버튼 클릭 → 모달 열림
- [ ] OK 버튼 클릭 → Bulk update 실행 → 모달 닫힘
- [ ] Cancel 버튼 클릭 → 모달 닫힘
- [ ] ESC 키 → 모달 닫힘
- [ ] 백드롭 클릭 → 모달 닫힘
- [ ] 모달 열릴 때 배경 스크롤 방지
- [ ] 3가지 variant 스타일 확인

---

## 🎉 결론

`ConfirmModal` 컴포넌트를 사용하면:

1. ✅ **일관된 UI**: TMS 전체에서 통일된 확인 모달 스타일
2. ✅ **더 나은 UX**: 반투명 배경, 블러 효과, 중앙 정렬
3. ✅ **접근성**: ESC 키, 백드롭 클릭, ARIA 속성
4. ✅ **유지보수**: 재사용 가능한 컴포넌트
5. ✅ **확장성**: variant, 커스텀 버튼 텍스트, 다양한 시나리오 지원

브라우저 기본 `window.confirm()`을 대체하여 더 전문적이고 세련된 확인 UI를 제공합니다! 🚀

