# 3-컬럼 레이아웃 가이드 (반응형)

## 📐 레이아웃 구조

```
┌────────────────────────────────────────────────────────────────┐
│                                                                │
│  [좌측: Test Runs]  │  [중앙: Test Cases]  │ [우측: Detail]   │
│     260px 고정       │     flex-grow        │  420px (조건부)  │
│                      │                      │                  │
│  ┌───────────┐      │  ┌───────────────┐  │  ┌────────────┐  │
│  │ Run 1 ✓   │      │  │ Test Run Info │  │  │ Test Case  │  │
│  │ Run 2 ← ● │      │  │───────────────│  │  │ Details    │  │
│  │ Run 3     │      │  │ Stats Bar     │  │  │────────────│  │
│  └───────────┘      │  │───────────────│  │  │ Assignee   │  │
│                      │  │ Search        │  │  │ Status     │  │
│                      │  │───────────────│  │  │ Steps      │  │
│                      │  │ ID │Title│... │  │  │ Comment    │  │
│                      │  │────│─────│────│  │  │            │  │
│                      │  │ ✓  │Test1│... │  │  │ [X] Close  │  │
│                      │  │ ✗  │Test2│... │◀─┼──선택된 행     │  │
│                      │  │    │Test3│... │  │                │  │
│                      │  └───────────────┘  │  └────────────┘  │
└────────────────────────────────────────────────────────────────┘
```

---

## 🎯 핵심 특징

### 1. **컬럼 기반 레이아웃 (슬라이드 없음)**
- ❌ 슬라이드 팝업 (Overlay)
- ✅ 새로운 컬럼이 추가되는 방식
- 우측 패널이 나타나면 중앙 테이블의 폭이 자동으로 줄어듦
- CSS Flexbox로 구현 (`flex-grow`, `flex-shrink-0`)

### 2. **좌측 컬럼 (Test Runs List)**
- **고정 폭**: `260px`
- **내용**:
  - Back to Plans 버튼
  - Test Runs 목록
  - 현재 선택된 Run 강조 (`bg-indigo-50` + `border-l-4`)
  - 각 Run의 Progress Bar
- **스크롤**: 독립적인 세로 스크롤

### 3. **중앙 컬럼 (Test Cases Table)**
- **가변 폭**: `flex-grow` (나머지 공간 모두 사용)
- **상단**: Test Run Info
  - 이름, 설명, Status Badge
  - Stats (Passed, Failed, In Progress, Blocked)
  - Overall Progress Bar
- **테이블**:
  - 4개 컬럼: ID, Title, Assignee, Result
  - 클릭 가능한 행
  - 선택된 행 하이라이트 (`bg-indigo-50` + `border-l-4`)
- **검색**: 상단 검색 바

### 4. **우측 컬럼 (Detail Column)**
- **고정 폭**: `420px`
- **조건부 렌더링**: `selectedItem`이 있을 때만 렌더링
- **내용**:
  - Test Case ID, Title, Priority
  - Assignee 드롭다운
  - Result/Status 드롭다운
  - Precondition, Steps, Expected Result
  - Comment textarea
- **닫기**: X 버튼 또는 ESC 키

---

## 🔄 상호작용 플로우

### A. Test Run 선택
```typescript
// 좌측 패널에서 다른 Run 클릭
onClick={() => {
  navigate(`/plans/${p.id}`);
  setSelectedItem(null); // 디테일 패널 닫기
}}
```

### B. Test Case 행 클릭
```typescript
// 중앙 테이블에서 행 클릭
const handleRowClick = (item: PlanItem) => {
  setSelectedItem(item); // 우측 컬럼 렌더링
};
```

### C. 디테일 패널에서 변경
```typescript
// Assignee/Status 변경 시
const handleUpdate = async (itemId, updates) => {
  await updatePlanItem(planId, itemId, updates);
  
  // 로컬 상태 업데이트 (중앙 테이블 즉시 반영)
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

### D. 디테일 패널 닫기
```typescript
// X 버튼 클릭 또는 ESC 키
onClose={() => setSelectedItem(null)}

// ESC 키 리스너 (TestCaseDetailColumn 컴포넌트 내부)
useEffect(() => {
  const handleEscape = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && planItem) {
      onClose();
    }
  };
  document.addEventListener('keydown', handleEscape);
  return () => document.removeEventListener('keydown', handleEscape);
}, [planItem, onClose]);
```

---

## 📱 반응형 디자인

### 데스크톱 (> 1280px)
```css
좌측: 260px (고정)
중앙: flex-grow (남은 공간)
우측: 420px (선택 시)
```

### 노트북 (1024px ~ 1280px)
```css
좌측: 260px (고정)
중앙: flex-grow (남은 공간)
우측: 380px (선택 시, 약간 좁게)
```

### 태블릿 (< 1024px)
**옵션 1**: 우측 패널이 중앙 아래에 스택
```css
flex-direction: column
좌측: 260px (고정)
중앙 + 우측: 세로 배치
```

**옵션 2**: 우측 패널이 전체 화면 Overlay
```css
우측 패널: fixed, inset-0 (모달 형태)
```

### 구현 예시 (Tailwind)
```tsx
<div className="flex h-full overflow-hidden flex-col lg:flex-row">
  {/* 좌측 */}
  <div className="w-full lg:w-[260px] ...">...</div>
  
  {/* 중앙 */}
  <div className="flex-1 ...">...</div>
  
  {/* 우측 (반응형) */}
  {selectedItem && (
    <div className="
      w-full lg:w-[420px]
      fixed lg:relative
      inset-0 lg:inset-auto
      z-50 lg:z-auto
      lg:border-l
    ">...</div>
  )}
</div>
```

---

## 🎨 스타일링 가이드

### 컬럼 폭 제어
```tsx
// 좌측: 고정 260px, 축소 방지
<div className="w-[260px] flex-shrink-0">

// 중앙: 가변, 최소폭 보장
<div className="flex-1 min-w-0">

// 우측: 고정 420px, 축소 방지 (조건부 렌더링)
{selectedItem && (
  <div className="w-[420px] flex-shrink-0">
)}
```

### 선택된 행 하이라이트
```tsx
<tr className={`
  cursor-pointer transition-colors hover:bg-slate-50
  ${selectedItem?.id === item.id 
    ? 'bg-indigo-50 border-l-4 border-indigo-600' 
    : ''
  }
`}>
```

### 선택된 Test Run 강조
```tsx
<div className={`
  p-4 border-b cursor-pointer transition-colors
  ${p.id === planId 
    ? 'bg-indigo-50 border-l-4 border-l-indigo-600' 
    : 'hover:bg-slate-100'
  }
`}>
```

---

## 📦 파일 구조

### 1. `TestCaseDetailColumn.tsx` (260줄)
```typescript
interface TestCaseDetailColumnProps {
  planItem: PlanItem | null;
  users: UserType[];
  onClose: () => void;
  onUpdate: (itemId, updates) => void;
}
```
- 우측 디테일 컬럼 컴포넌트
- 조건부 렌더링 (`planItem`이 null이면 렌더링 안 함)
- ESC 키 이벤트 리스너
- Assignee/Status 드롭다운 (pill 형태)
- Comment textarea (blur 자동 저장)

### 2. `PlanDetailPage3Column.tsx` (430줄)
```typescript
const [plans, setPlans] = useState<Plan[]>([]);          // 좌측 목록
const [plan, setPlan] = useState<PlanDetail | null>(null); // 중앙 데이터
const [selectedItem, setSelectedItem] = useState<PlanItem | null>(null); // 우측 패널
```
- 3-컬럼 메인 페이지
- Flexbox 레이아웃 (`display: flex`)
- 좌측: Test Runs 목록 + 현재 Run 강조
- 중앙: Test Run Info + Test Cases 테이블
- 우측: `selectedItem` 있을 때만 렌더링

---

## ✅ 장점

1. **레이아웃 안정성**: 슬라이드 팝업이 아니라 컬럼으로 추가되므로 화면이 덜 복잡함
2. **공간 활용**: 우측 패널이 나타나도 중앙 테이블이 여전히 보임
3. **일관성**: 좌/중/우 모두 같은 높이, 각자 독립적인 스크롤
4. **성능**: 조건부 렌더링으로 불필요한 DOM 최소화
5. **접근성**: ESC 키로 쉽게 닫을 수 있음

---

## 🚀 사용 방법

### 1. 서버 실행
```bash
cd frontend
npm run dev
```

### 2. 브라우저에서 확인
```
http://localhost:5173/plans
→ Test Plan 클릭
→ /plans/:planId로 이동
→ 3-컬럼 레이아웃 확인
```

### 3. 인터랙션 테스트
- ✅ 좌측: 다른 Test Run 클릭 → 중앙 테이블 변경
- ✅ 중앙: 테스트 케이스 행 클릭 → 우측 컬럼 나타남
- ✅ 우측: Assignee/Status 변경 → 중앙 테이블 즉시 반영
- ✅ 우측: X 버튼 또는 ESC → 우측 컬럼 사라짐
- ✅ 중앙: 검색 → 실시간 필터링

---

## 🎯 핵심 차이점 (이전 버전 vs 현재)

| 항목 | 이전 (슬라이드 팝업) | 현재 (3-컬럼) |
|------|---------------------|--------------|
| **우측 패널** | fixed, 슬라이드 애니메이션 | relative, 조건부 렌더링 |
| **중앙 테이블** | 패널이 덮음 | 패널과 공존 (폭 자동 조절) |
| **Backdrop** | 반투명 배경 있음 | 없음 |
| **애니메이션** | translate-x | 없음 (즉시 나타남) |
| **z-index** | 40~50 필요 | 불필요 |
| **레이아웃** | Overlay | Flexbox Column |

---

## 📝 추가 개선 아이디어

1. **키보드 단축키**:
   - `←/→`: 이전/다음 테스트 케이스로 이동
   - `Cmd/Ctrl + K`: 검색 포커스

2. **우측 패널 너비 조절**:
   - Resizable divider (드래그로 너비 조절)

3. **모바일 최적화**:
   - 좌측 패널을 드로어(drawer) 형태로
   - 우측 패널을 Bottom Sheet로

4. **상태 유지**:
   - 마지막 선택된 Test Run을 localStorage에 저장
   - 페이지 새로고침 시 복원

5. **벌크 액션**:
   - 체크박스로 여러 케이스 선택
   - 선택된 케이스들의 Status 일괄 변경

---

이제 브라우저에서 확인하시면 깔끔한 3-컬럼 레이아웃을 경험하실 수 있습니다! 🎉

**핵심**: 우측 패널이 "슬라이드 팝업"이 아니라 "새로운 컬럼"으로 추가되므로, 중앙 테이블과 함께 화면에 공존하며, 더욱 직관적이고 안정적인 UX를 제공합니다.

