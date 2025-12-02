# Bulk Select & Edit 기능 가이드

## 🎯 구현 목표

1. 스크롤 구조 개선: 중앙 패널의 이중 스크롤바 제거
2. Bulk select: 체크박스로 여러 Test Case 선택
3. Bulk edit: 선택된 케이스들의 Assignee/Status 일괄 변경

---

## 📐 스크롤 구조 개선

### Before (문제)
```
중앙 컬럼 전체: overflow-y-auto
└─ Summary 카드
└─ Table 카드
   └─ Table div: overflow-auto
   
결과: 스크롤바 2개 (중앙 컬럼 + 테이블)
```

### After (해결)
```
중앙 컬럼: flex flex-col
├─ Summary 카드: flex-shrink-0 (고정, 스크롤 없음)
└─ Table 카드: flex-1 flex flex-col
   ├─ Toolbar: flex-shrink-0 (고정)
   ├─ Bulk Actions: flex-shrink-0 (고정)
   └─ Table div: flex-1 overflow-y-auto (스크롤 가능)
   
결과: 스크롤바 1개 (테이블 영역만)
```

### 코드 구조

```tsx
<div className="flex-1 flex flex-col bg-slate-50 min-w-0">
  {/* Summary - 고정 */}
  <div className="p-6 flex-shrink-0">
    <RunSummary ... />
  </div>

  {/* Table Card - 가변 */}
  <div className="px-6 pb-6 flex-1 flex flex-col min-h-0">
    <div className="bg-white rounded-lg ... flex flex-col flex-1">
      {/* Toolbar - 고정 */}
      <div className="... flex-shrink-0">...</div>
      
      {/* Bulk Actions - 고정 */}
      {selectedItemIds.size > 0 && (
        <div className="... flex-shrink-0">...</div>
      )}
      
      {/* Table - 스크롤 */}
      <div className="flex-1 overflow-y-auto">
        <table>...</table>
      </div>
    </div>
  </div>
</div>
```

---

## ✅ Bulk Select 기능

### State 관리

```typescript
const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(new Set());
```

### 체크박스 핸들러

#### 1. 개별 선택/해제
```typescript
const handleToggleSelect = (itemId: string) => {
  setSelectedItemIds(prev => {
    const newSet = new Set(prev);
    if (newSet.has(itemId)) {
      newSet.delete(itemId);
    } else {
      newSet.add(itemId);
    }
    return newSet;
  });
};
```

#### 2. 전체 선택/해제
```typescript
const handleSelectAll = () => {
  if (selectedItemIds.size === filteredItems.length && filteredItems.length > 0) {
    setSelectedItemIds(new Set()); // 전체 해제
  } else {
    setSelectedItemIds(new Set(filteredItems.map(item => item.id))); // 전체 선택
  }
};
```

### 테이블 헤더 (전체 선택 체크박스)

```tsx
<th className="px-4 py-2 w-12 text-center">
  <button
    onClick={handleSelectAll}
    className="text-slate-500 hover:text-slate-700"
    title={selectedItemIds.size === filteredItems.length ? "Deselect All" : "Select All"}
  >
    {selectedItemIds.size > 0 && selectedItemIds.size === filteredItems.length ? 
      <CheckSquare size={16} className="text-indigo-600" /> : 
      <Square size={16} />
    }
  </button>
</th>
```

### 테이블 바디 (개별 체크박스)

```tsx
<td className="px-4 py-3 text-center">
  <input
    type="checkbox"
    checked={selectedItemIds.has(item.id)}
    onChange={(e) => {
      e.stopPropagation(); // 행 클릭 이벤트 전파 방지
      handleToggleSelect(item.id);
    }}
    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-slate-300 rounded cursor-pointer"
  />
</td>
```

### 선택된 행 하이라이트

```tsx
<tr className={`
  transition-colors hover:bg-slate-50 
  ${selectedItem?.id === item.id ? 'bg-indigo-50 border-l-4 border-indigo-600' : ''}
  ${selectedItemIds.has(item.id) ? 'bg-indigo-50/30' : ''}
`}>
```

**효과:**
- 우측 패널 선택: `bg-indigo-50` + `border-l-4`
- 체크박스 선택: `bg-indigo-50/30` (반투명)

---

## 🔄 Bulk Edit 기능

### State 관리

```typescript
const [bulkAssignee, setBulkAssignee] = useState<string>('');
const [bulkResult, setBulkResult] = useState<TestResult | ''>('');
```

### Bulk Actions Bar

```tsx
{selectedItemIds.size > 0 && (
  <div className="px-6 py-3 border-b bg-indigo-50 flex items-center gap-4 flex-shrink-0">
    {/* 선택 개수 표시 */}
    <div className="flex items-center gap-2">
      <CheckSquare size={16} className="text-indigo-600" />
      <span className="text-sm font-semibold text-indigo-900">
        {selectedItemIds.size} test case{selectedItemIds.size > 1 ? 's' : ''} selected
      </span>
    </div>

    <div className="h-5 w-px bg-indigo-200"></div>

    {/* Bulk actions */}
    <div className="flex items-center gap-3 flex-1">
      {/* Assignee 드롭다운 */}
      <select
        value={bulkAssignee}
        onChange={(e) => setBulkAssignee(e.target.value)}
        className="text-xs border-slate-300 rounded-md py-1.5 px-3 bg-white"
      >
        <option value="">Set assignee...</option>
        {users.map(user => (
          <option key={user.id} value={user.name}>{user.name}</option>
        ))}
      </select>

      {/* Status 드롭다운 */}
      <select
        value={bulkResult}
        onChange={(e) => setBulkResult(e.target.value as TestResult | '')}
        className="text-xs border-slate-300 rounded-md py-1.5 px-3 bg-white"
      >
        <option value="">Set status...</option>
        <option value="NOT_RUN">NOT STARTED</option>
        <option value="IN_PROGRESS">IN PROGRESS</option>
        <option value="PASS">PASS</option>
        <option value="FAIL">FAIL</option>
        <option value="BLOCK">BLOCKED</option>
      </select>

      {/* Apply 버튼 */}
      <Button
        onClick={handleBulkUpdate}
        disabled={!bulkResult && !bulkAssignee}
        size="sm"
      >
        Apply
      </Button>
    </div>
  </div>
)}
```

### Bulk Update 핸들러

```typescript
const handleBulkUpdate = async () => {
  if (!planId || selectedItemIds.size === 0) return;
  if (!bulkResult && !bulkAssignee) {
    alert('Please select an assignee or status to update.');
    return;
  }

  const confirmMsg = `Update ${selectedItemIds.size} test case(s)?`;
  if (!confirm(confirmMsg)) return;

  try {
    // Bulk API 호출
    const updates: { result?: TestResult; assignee?: string } = {};
    if (bulkResult) updates.result = bulkResult;
    if (bulkAssignee) updates.assignee = bulkAssignee;

    await bulkUpdatePlanItems(planId, {
      items: Array.from(selectedItemIds),
      ...updates,
    });

    // 선택 해제 및 초기화
    setSelectedItemIds(new Set());
    setBulkResult('');
    setBulkAssignee('');

    // 데이터 다시 로드
    loadPlanDetail(planId);  // Summary & 테이블 업데이트
    loadPlans();              // 좌측 프로그레스바 업데이트
  } catch (error) {
    alert('Bulk update failed');
  }
};
```

---

## 🎨 UI/UX 개선

### 1. Toolbar 선택 개수 표시

```tsx
<div className="text-sm text-slate-600">
  {selectedItemIds.size > 0 ? (
    <span className="font-semibold text-indigo-600">
      {selectedItemIds.size} selected
    </span>
  ) : (
    <span>{filteredItems.length} of {totalItems} test cases</span>
  )}
</div>
```

### 2. Bulk Actions Bar 스타일

```css
bg-indigo-50          /* 인디고 배경 */
border-b              /* 하단 보더 */
flex items-center     /* 세로 중앙 정렬 */
gap-4                 /* 요소 간 간격 */
```

### 3. 체크박스 이벤트 전파 방지

```tsx
onChange={(e) => {
  e.stopPropagation(); // 행 클릭 이벤트 방지
  handleToggleSelect(item.id);
}}
```

**이유**: 체크박스 클릭 시 우측 패널이 열리지 않도록

### 4. 행 클릭 영역 분리

```tsx
// 체크박스 칸: 체크박스만
<td className="px-4 py-3 text-center">
  <input type="checkbox" ... />
</td>

// 나머지 칸: 우측 패널 열기
<td className="px-4 py-3 cursor-pointer" onClick={() => handleRowClick(item)}>
  ...
</td>
```

---

## 🔄 데이터 흐름

### 1. Bulk Update 흐름

```
1. 사용자가 체크박스로 여러 케이스 선택
   ↓
2. selectedItemIds Set에 추가
   ↓
3. Bulk Actions Bar 표시
   ↓
4. Assignee/Status 선택
   ↓
5. Apply 버튼 클릭
   ↓
6. handleBulkUpdate() 호출
   ↓
7. API: bulkUpdatePlanItems()
   ↓
8. 선택 해제 및 초기화
   ↓
9. 데이터 다시 로드
   - loadPlanDetail() → Summary & 테이블
   - loadPlans() → 좌측 프로그레스바
   ↓
10. Summary 도넛차트 자동 업데이트
    좌측 Test Runs 프로그레스바 자동 업데이트
```

### 2. Summary 업데이트

```typescript
// 데이터 다시 로드 후
const statusCounts = {
  passed: plan.items.filter(i => i.result === 'PASS').length,
  inProgress: plan.items.filter(i => i.result === 'IN_PROGRESS').length,
  failed: plan.items.filter(i => i.result === 'FAIL').length,
  blocked: plan.items.filter(i => i.result === 'BLOCK').length,
  notRun: plan.items.filter(i => i.result === 'NOT_RUN').length,
};

// RunSummary에 전달 → MultiColorDonutChart 자동 업데이트
```

### 3. 좌측 프로그레스바 업데이트

```typescript
// loadPlans() 호출 후
plans.map(p => (
  <StackedProgressBar
    statusCounts={{
      passed: p.stats?.pass || 0,
      // ... stats 자동 계산됨
    }}
  />
))
```

---

## 📦 주요 컴포넌트

### 1. PlanDetailPage3Column.tsx

**새로운 State:**
```typescript
const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(new Set());
const [bulkAssignee, setBulkAssignee] = useState<string>('');
const [bulkResult, setBulkResult] = useState<TestResult | ''>('');
```

**새로운 핸들러:**
- `handleToggleSelect(itemId)`: 개별 선택/해제
- `handleSelectAll()`: 전체 선택/해제
- `handleBulkUpdate()`: Bulk 업데이트 실행

**레이아웃 변경:**
```tsx
{/* Summary - flex-shrink-0 */}
<div className="p-6 flex-shrink-0">

{/* Table Card - flex-1 flex flex-col */}
<div className="px-6 pb-6 flex-1 flex flex-col min-h-0">
  <div className="... flex flex-col flex-1">
    <Toolbar />
    <BulkActionsBar />
    <div className="flex-1 overflow-y-auto">
      <Table />
    </div>
  </div>
</div>
```

---

## 🎯 핵심 CSS 클래스

### 중앙 컬럼 구조

```css
flex-1 flex flex-col bg-slate-50 min-w-0
```

### Summary 영역 (고정)

```css
p-6 flex-shrink-0
```

### Table Card 래퍼 (가변)

```css
px-6 pb-6 flex-1 flex flex-col min-h-0
```

**중요:** `min-h-0`는 flexbox에서 자식이 부모를 넘어서지 않도록 보장

### Table Card 내부

```css
bg-white rounded-lg border shadow-sm overflow-hidden flex flex-col flex-1
```

### Toolbar (고정)

```css
px-6 py-3 border-b flex justify-between items-center bg-slate-50 flex-shrink-0
```

### Bulk Actions Bar (고정)

```css
px-6 py-3 border-b bg-indigo-50 flex items-center gap-4 flex-shrink-0
```

### Table 영역 (스크롤)

```css
flex-1 overflow-y-auto overflow-x-hidden
```

---

## 🎨 UI 스타일

### Bulk Actions Bar

```tsx
<div className="px-6 py-3 border-b border-slate-200 bg-indigo-50 flex items-center gap-4">
  {/* 아이콘 + 선택 개수 */}
  <div className="flex items-center gap-2">
    <CheckSquare size={16} className="text-indigo-600" />
    <span className="text-sm font-semibold text-indigo-900">
      3 test cases selected
    </span>
  </div>

  {/* 구분선 */}
  <div className="h-5 w-px bg-indigo-200"></div>

  {/* 드롭다운 + 버튼 */}
  <div className="flex items-center gap-3 flex-1">
    <select>Set assignee...</select>
    <select>Set status...</select>
    <Button>Apply</Button>
  </div>
</div>
```

### 선택된 행 스타일

```tsx
className={`
  transition-colors hover:bg-slate-50 
  ${selectedItem?.id === item.id ? 'bg-indigo-50 border-l-4 border-indigo-600' : ''}
  ${selectedItemIds.has(item.id) ? 'bg-indigo-50/30' : ''}
`}
```

**효과:**
- 우측 패널 선택 (행 클릭): 진한 인디고 + 좌측 보더
- 체크박스 선택: 연한 인디고 (반투명)
- 둘 다 선택 가능 (중첩 가능)

---

## 🚀 사용 방법

### 1. 서버 실행
```bash
cd frontend
npm run dev
```

### 2. 브라우저에서 테스트

```
http://localhost:5173/plans/:planId
```

### 3. Bulk Select 테스트
1. ✅ 전체 선택 체크박스 클릭 → 모든 행 선택
2. ✅ 개별 체크박스 클릭 → 특정 행 선택/해제
3. ✅ Toolbar에 선택 개수 표시 확인
4. ✅ Bulk Actions Bar 나타남 확인

### 4. Bulk Edit 테스트
1. ✅ 여러 케이스 선택
2. ✅ Assignee 또는 Status 선택
3. ✅ Apply 버튼 클릭
4. ✅ 확인 다이얼로그 확인
5. ✅ 테이블 즉시 업데이트 확인
6. ✅ Summary 도넛차트 업데이트 확인
7. ✅ 좌측 프로그레스바 업데이트 확인

### 5. 스크롤 테스트
1. ✅ 중앙 Summary 영역: 스크롤 없음 (고정)
2. ✅ 중앙 Table 영역: 스크롤바 1개만
3. ✅ 우측 패널: 독립적으로 스크롤
4. ✅ 좌측 Test Runs: 독립적으로 스크롤

---

## 📊 비교표

| 항목 | Before | After |
|------|--------|-------|
| **중앙 스크롤바** | 2개 (중복) | 1개 (테이블만) |
| **Summary** | 스크롤됨 | 고정 |
| **선택 방식** | 행 클릭만 | 체크박스 추가 |
| **Bulk Edit** | 없음 | Assignee/Status 일괄 변경 |
| **선택 표시** | Toolbar 고정 | 동적 (N selected) |
| **Bulk Actions** | 없음 | 전용 바 표시 |
| **체크박스 이벤트** | - | 전파 방지 (stopPropagation) |

---

## 🎯 핵심 포인트

1. **Flexbox 중첩 구조**: `flex flex-col` 안에 `flex-1` + `flex-shrink-0`
2. **min-h-0**: Flexbox 자식이 부모 높이를 초과하지 않도록
3. **overflow 분리**: Summary는 스크롤 없음, Table만 스크롤
4. **Set<string> 사용**: 선택 상태 관리 (효율적인 추가/삭제)
5. **stopPropagation**: 체크박스 클릭 시 행 클릭 방지
6. **조건부 렌더링**: Bulk Actions Bar는 선택 시만 표시
7. **자동 업데이트**: Bulk update 후 Summary/프로그레스바 자동 반영

---

브라우저에서 확인하시면 **스크롤 구조가 개선**되고 **Bulk select/edit 기능**이 추가된 완성도 높은 UI를 경험하실 수 있습니다! 🎉

