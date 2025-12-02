# 3단 레이아웃 UI 가이드 (Testiny 스타일)

## 📐 레이아웃 구조

```
┌─────────────────────────────────────────────────────────────────┐
│ [좌측 패널 320px]  │  [중앙 테이블 flex-1]  │ [우측 패널 480px] │
│                    │                        │   (슬라이드)      │
│ Test Run Info      │  Test Cases Table     │  Detail Panel     │
│ - 이름/설명         │  - 클릭 가능한 행       │  - Assignee       │
│ - Progress         │  - 선택된 행 하이라이트  │  - Status         │
│ - Stats            │  - Search & Filter     │  - Preconditions  │
│ - Filter           │                        │  - Steps          │
│                    │                        │  - Comment        │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🎯 주요 기능

### 1. **좌측 패널 (Test Run Info)**
- Test Run의 기본 정보 (이름, 설명, 생성자, 날짜)
- Overall Progress Bar (완료율)
- 상태별 통계 (Passed, Failed, In Progress, Blocked, Untested)
- Status 필터 드롭다운

### 2. **중앙 테이블 (Test Cases)**
- 테스트 케이스 목록 (ID, Title, Assignee, Result)
- 행 클릭 → 우측 디테일 패널 열림
- 선택된 행은 `bg-indigo-50` + `border-l-4 border-indigo-500`로 하이라이트
- 검색 기능 (Title, ID 기준)
- 필터링 결과 실시간 반영

### 3. **우측 디테일 패널 (Slide-in)**
- **슬라이드 애니메이션**: `transform translate-x-0` (열림) / `translate-x-full` (닫힘)
- **Backdrop**: 반투명 배경 (`bg-black/20`)
- **닫기 방법**:
  - X 버튼 클릭
  - ESC 키 (전역 이벤트 리스너)
  - 배경 클릭 (Backdrop)
- **내용**:
  - Test Case ID, Title, Priority Badge
  - Assignee 드롭다운 (pill 형태)
  - Result/Status 드롭다운 (pill 형태, 색상 구분)
  - Precondition (있는 경우)
  - Steps (번호 매겨진 리스트)
  - Expected Result (있는 경우)
  - Comment (textarea, blur 시 자동 저장)
  - Metadata (Last executed 시간)

---

## 🔄 상호작용 플로우

### A. 행 클릭 → 패널 열기
```typescript
const handleRowClick = (item: PlanItem) => {
  setSelectedItem(item);
  setIsPanelOpen(true);
};
```

### B. 패널에서 데이터 변경 → 테이블 즉시 반영
```typescript
const handlePanelUpdate = async (itemId, updates) => {
  await updatePlanItem(planId, itemId, updates);
  
  // 로컬 상태 업데이트 (테이블 즉시 반영)
  setPlan(prev => ({
    ...prev,
    items: prev.items.map(item => 
      item.id === itemId ? { ...item, ...updates } : item
    )
  }));
  
  // 선택된 아이템도 업데이트
  setSelectedItem(prev => ({ ...prev, ...updates }));
};
```

### C. ESC 키로 패널 닫기
```typescript
useEffect(() => {
  const handleEscape = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && isOpen) {
      onClose();
    }
  };
  document.addEventListener('keydown', handleEscape);
  return () => document.removeEventListener('keydown', handleEscape);
}, [isOpen, onClose]);
```

### D. 배경 클릭 시 닫기
```typescript
const handleBackdropClick = (e: React.MouseEvent) => {
  if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
    onClose();
  }
};
```

---

## 🎨 스타일링 가이드

### 선택된 행 하이라이트
```tsx
<tr 
  className={`cursor-pointer transition-colors hover:bg-indigo-50/50 ${
    selectedItem?.id === item.id 
      ? 'bg-indigo-50 border-l-4 border-indigo-500' 
      : ''
  }`}
>
```

### Status 색상 시스템
```typescript
const getStatusColor = (status: TestResult) => {
  switch (status) {
    case 'PASS':
      return 'bg-emerald-500 text-white';
    case 'FAIL':
      return 'bg-red-500 text-white';
    case 'BLOCK':
      return 'bg-gray-600 text-white';
    case 'IN_PROGRESS':
      return 'bg-amber-500 text-white';
    case 'NOT_RUN':
    default:
      return 'bg-gray-400 text-white';
  }
};
```

### 슬라이드 패널 애니메이션
```tsx
<div
  className={`fixed top-0 right-0 h-full w-[480px] bg-white shadow-2xl z-50 
    transform transition-transform duration-300 ease-in-out overflow-y-auto 
    ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
>
```

### Backdrop (반투명 배경)
```tsx
<div
  className="fixed inset-0 bg-black/20 z-40 transition-opacity"
  onClick={handleBackdropClick}
/>
```

---

## 📦 컴포넌트 구조

### 1. `TestCaseDetailPanel.tsx`
**Props:**
- `planItem: PlanItem | null` - 현재 선택된 테스트 케이스
- `users: UserType[]` - Assignee 드롭다운용 사용자 목록
- `isOpen: boolean` - 패널 열림/닫힘 상태
- `onClose: () => void` - 패널 닫기 콜백
- `onUpdate: (itemId, updates) => void` - 데이터 업데이트 콜백

**주요 기능:**
- ESC 키 이벤트 리스너
- Backdrop 클릭 감지
- Result/Assignee 변경 시 즉시 API 호출
- Comment는 blur 시 저장

### 2. `PlanDetailPageNew.tsx`
**State:**
- `plan: PlanDetail | null` - 전체 플랜 데이터
- `selectedItem: PlanItem | null` - 선택된 테스트 케이스
- `isPanelOpen: boolean` - 우측 패널 열림 상태
- `searchQuery: string` - 검색어
- `filterStatus: TestResult | 'ALL'` - 필터 상태

**주요 함수:**
- `handleRowClick(item)` - 행 클릭 시 패널 열기
- `handlePanelUpdate(itemId, updates)` - 패널에서 변경 시 처리
- `loadPlanDetail(id)` - 플랜 데이터 로드
- `loadUsers()` - 사용자 목록 로드

---

## 🚀 사용 방법

### 설치 및 실행
```bash
cd frontend
npm install
npm run dev
```

### 라우팅
```typescript
// App.tsx
import PlanDetailPage from './pages/PlanDetailPageNew';

<Route path="/plans/:planId" element={<PlanDetailPage />} />
```

### 테스트
1. **Plans 페이지** (`/plans`)에서 Test Plan 클릭
2. **Detail 페이지** (`/plans/:planId`)로 이동
3. 좌측 패널에서 Test Run 정보 확인
4. 중앙 테이블에서 테스트 케이스 행 클릭
5. 우측 패널이 슬라이드 인
6. Assignee/Status 변경 → 테이블 즉시 반영 확인
7. ESC 키 또는 배경 클릭으로 패널 닫기

---

## ✅ UX 고려사항

### 1. **포커스 관리**
- 패널이 열릴 때 자동으로 첫 번째 입력 필드에 포커스 (선택 사항)
- ESC 키로 즉시 닫기

### 2. **키보드 단축키**
- `ESC`: 패널 닫기
- 향후 추가 가능: `←/→`: 이전/다음 케이스로 이동

### 3. **애니메이션**
- 슬라이드 인/아웃: `300ms ease-in-out`
- 행 하이라이트: `transition-colors`
- Progress Bar: `transition-all duration-500`

### 4. **반응형**
- 좌측 패널: 320px 고정
- 중앙 테이블: `flex-1` (유동)
- 우측 패널: 480px 고정 (슬라이드)
- 작은 화면에서는 패널이 전체 화면을 덮도록 조정 가능

### 5. **로딩 상태**
- 초기 로드: "Loading..." 메시지
- 데이터 없음: "No test cases found" 메시지
- API 호출 중: 버튼 disabled 처리 (필요 시)

### 6. **에러 처리**
- API 실패 시 `alert()` 또는 토스트 메시지
- 네트워크 에러 시 재시도 버튼 제공 (향후)

---

## 🎯 핵심 포인트

1. ✅ **3단 레이아웃**: 좌측(Info) + 중앙(Table) + 우측(Detail)
2. ✅ **클릭 가능한 행**: 테이블 행 클릭 → 패널 열림
3. ✅ **슬라이드 패널**: 우측에서 슬라이드 인, Backdrop 포함
4. ✅ **실시간 업데이트**: 패널 변경 → 테이블 즉시 반영
5. ✅ **ESC/배경 클릭**: 패널 닫기
6. ✅ **Status 색상**: 일관된 팔레트 사용
7. ✅ **검색 & 필터**: 실시간 필터링
8. ✅ **Progress Visualization**: 진행률 바 + 통계

---

## 📸 참고 스크린샷 (Testiny 스타일)

구현된 UI는 Testiny의 다음 요소를 참고했습니다:
- 3단 레이아웃 구조
- 슬라이드 인 디테일 패널
- 클릭 가능한 테이블 행
- Progress Summary 카드
- Status별 색상 구분
- 깔끔한 타이포그래피와 간격

---

이제 브라우저에서 `/plans/:planId`로 이동하여 새로운 3단 레이아웃을 확인할 수 있습니다! 🎉

