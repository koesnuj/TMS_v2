# 스택형 Progress Bar 및 상태 범례 가이드

## 📊 개선 사항

### Before vs After

#### Before (단일 색상 Progress Bar)
```
[████████████░░░░░░░░] 60%
단일 색상 (indigo-600 or emerald-500)
```

#### After (상태별 스택형 Progress Bar)
```
[녹색██][노랑█][빨강█][회색█][연회색███████] 60%
Passed | InProg | Failed | Blocked | NotRun
```

---

## 🎯 구현된 컴포넌트

### 1. `StackedProgressBar.tsx`

**용도**: 상태별 누적 진행 막대

```tsx
type RunStatusCounts = {
  passed: number;
  inProgress: number;
  failed: number;
  blocked: number;
  notRun: number;
};

interface StackedProgressBarProps {
  statusCounts: RunStatusCounts;
  height?: string;          // 기본: 'h-2'
  showTooltip?: boolean;    // 기본: false
}
```

**특징:**
- ✅ 5가지 상태를 고정된 순서로 표시
  1. Passed (녹색)
  2. In Progress (노랑)
  3. Failed (빨강)
  4. Blocked (진한 회색)
  5. Not Run (연한 회색)
- ✅ 각 상태의 비율에 따라 폭 자동 계산
- ✅ 부드러운 트랜지션 (`transition-all duration-300`)
- ✅ 툴팁 옵션 (hover 시 상태명 + 개수 표시)

**사용 예:**
```tsx
<StackedProgressBar
  statusCounts={{
    passed: 20,
    inProgress: 5,
    failed: 3,
    blocked: 2,
    notRun: 70,
  }}
  height="h-2"
  showTooltip={true}
/>
```

**렌더링 결과:**
```html
<div class="w-full bg-slate-200 rounded-full overflow-hidden h-2 flex">
  <div class="bg-emerald-500" style="width: 20%"></div>
  <div class="bg-amber-500" style="width: 5%"></div>
  <div class="bg-red-500" style="width: 3%"></div>
  <div class="bg-gray-600" style="width: 2%"></div>
  <div class="bg-slate-300" style="width: 70%"></div>
</div>
```

---

### 2. `RunStatusLegend.tsx`

**용도**: 상태별 범례 리스트 (도넛 차트 옆에 표시)

```tsx
interface RunStatusLegendProps {
  statusCounts: RunStatusCounts;
  totalCases: number;
}
```

**특징:**
- ✅ 고정된 순서 (Passed > In Progress > Failed > Blocked > Not Run)
- ✅ 각 항목 형식: `[색상 점] [상태명] [개수] ([%])`
- ✅ 자연스러운 타이포그래피 및 간격
- ✅ 상태명: `text-sm font-medium`
- ✅ 개수: `text-sm font-semibold`
- ✅ 퍼센트: `text-xs text-slate-500`

**렌더링 예:**
```
● Passed       20 (20%)
● In Progress   5  (5%)
● Failed        3  (3%)
● Blocked       2  (2%)
● Not Run      70 (70%)
```

**레이아웃:**
```tsx
<div className="flex items-center gap-3">
  {/* 색상 점 */}
  <div className="w-3 h-3 rounded-full bg-emerald-500" />
  
  {/* 상태명 + 개수 + 퍼센트 */}
  <div className="flex items-baseline gap-2">
    <span className="text-sm font-medium">Passed</span>
    <div className="flex items-baseline gap-1.5">
      <span className="text-sm font-semibold">20</span>
      <span className="text-xs text-slate-500">(20%)</span>
    </div>
  </div>
</div>
```

---

### 3. `RunSummary.tsx` (업데이트)

**변경 사항:**
- ❌ 제거: 기존 `statusList` 배열 및 수동 렌더링
- ✅ 추가: `RunStatusLegend` 컴포넌트 사용
- ✅ 추가: `RunStatusCounts` 타입 import

**Before:**
```tsx
// 복잡한 statusList 배열 정의
const statusList = [
  { label: 'Failed', count: ..., icon: <X />, ... },
  { label: 'Blocked', count: ..., icon: <MinusCircle />, ... },
  // ...
];

// 수동 렌더링
{statusList.map((status) => (
  <div key={status.label}>
    <div className={status.color} />
    <span>{status.label}</span>
    <span>{status.count}</span>
    // ...
  </div>
))}
```

**After:**
```tsx
// 간단한 컴포넌트 사용
<RunStatusLegend
  statusCounts={statusCounts}
  totalCases={totalCases}
/>
```

---

### 4. `PlanDetailPage3Column.tsx` (좌측 Test Runs 목록)

**변경 사항:**
- ❌ 제거: 단일 색상 Progress Bar
- ✅ 추가: `StackedProgressBar` 컴포넌트

**Before:**
```tsx
<div className="flex items-center gap-2">
  <span>{p.stats?.progress}%</span>
  <div className="flex-1 bg-slate-200 rounded-full h-1">
    <div
      className={`h-1 rounded-full ${
        (p.stats?.progress || 0) === 100 
          ? 'bg-emerald-500' 
          : 'bg-indigo-600'
      }`}
      style={{ width: `${p.stats?.progress || 0}%` }}
    />
  </div>
</div>
```

**After:**
```tsx
<div className="flex items-center gap-2">
  <span className="font-semibold">{p.stats?.progress}%</span>
  <StackedProgressBar
    statusCounts={{
      passed: p.stats?.pass || 0,
      inProgress: 0, // API에서 제공하지 않음
      failed: p.stats?.fail || 0,
      blocked: p.stats?.block || 0,
      notRun: p.stats?.notRun || 0,
    }}
    height="h-1.5"
  />
</div>
```

---

## 🎨 색상 팔레트

| Status | Tailwind Class | Hex | 용도 |
|--------|---------------|-----|------|
| **Passed** | `bg-emerald-500` | `#10B981` | 성공 |
| **In Progress** | `bg-amber-500` | `#F59E0B` | 진행 중 |
| **Failed** | `bg-red-500` | `#EF4444` | 실패 |
| **Blocked** | `bg-gray-600` | `#4B5563` | 차단됨 |
| **Not Run** | `bg-slate-300` | `#CBD5E1` | 미실행 |

---

## 📐 레이아웃 예시

### Summary 섹션 (도넛 차트 + 상태 범례)

```
┌─────────────────────────────────────────────────────┐
│ SUMMARY                                             │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ┌────────┐         ┌──────────────────────────┐  │
│  │        │         │                          │  │
│  │  83%   │    │    │ ● Passed       20 (20%) │  │
│  │COMPLETE│    │    │ ● In Progress   5  (5%) │  │
│  │        │    │    │ ● Failed        3  (3%) │  │
│  └────────┘    │    │ ● Blocked       2  (2%) │  │
│                │    │ ● Not Run      70 (70%) │  │
│  5 of 6 done   │    │                          │  │
│                │    └──────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

### Test Runs 목록 (스택형 Progress Bar)

```
┌─────────────────────────────┐
│ TEST RUNS                   │
├─────────────────────────────┤
│ ● 소호로                     │
│ 14% [녹█][노█][빨█][회█████]│
├─────────────────────────────┤
│   테스트 플랜 2              │
│ 87% [녹████████][빨█][회█]  │
├─────────────────────────────┤
│   플랜 3                     │
│ 0%  [회████████████████████] │
└─────────────────────────────┘
```

---

## 🔄 데이터 흐름

### 1. API → Plan 객체
```typescript
interface PlanStats {
  total: number;
  pass: number;
  fail: number;
  block: number;
  notRun: number;
  progress: number;
}
```

### 2. Plan → RunStatusCounts 변환
```typescript
const statusCounts: RunStatusCounts = {
  passed: plan.stats.pass,
  inProgress: 0, // 현재 API에서 제공하지 않음
  failed: plan.stats.fail,
  blocked: plan.stats.block,
  notRun: plan.stats.notRun,
};
```

### 3. RunStatusCounts → StackedProgressBar
```typescript
<StackedProgressBar statusCounts={statusCounts} />
```

### 4. 비율 계산 (컴포넌트 내부)
```typescript
const total = passed + inProgress + failed + blocked + notRun;
const passedPercent = (passed / total) * 100;
// ...각 상태별 퍼센트 계산
```

### 5. 렌더링
```tsx
<div style={{ width: `${passedPercent}%` }} className="bg-emerald-500" />
```

---

## ✅ 개선 효과

### 1. **시각적 명확성**
- Before: 단일 색상으로 전체 진행률만 표시
- After: 각 상태별 비율을 한눈에 파악 가능

### 2. **정보 밀도**
- Before: Progress Bar 하나당 1가지 정보 (전체 진행률)
- After: Progress Bar 하나당 5가지 정보 (각 상태별 비율)

### 3. **일관성**
- Before: 좌측 목록과 Summary 섹션의 표현 방식 불일치
- After: 동일한 색상 팔레트 및 상태 순서 사용

### 4. **재사용성**
- Before: 각 화면마다 Progress Bar 수동 구현
- After: `StackedProgressBar` 컴포넌트로 통일

### 5. **타이포그래피**
- Before: 상태명/숫자/퍼센트가 불규칙하게 배치
- After: `flex items-baseline gap-2`로 자연스럽게 정렬

---

## 🚀 사용 방법

### 1. 서버 실행
```bash
cd frontend
npm run dev
```

### 2. 브라우저에서 확인
```
http://localhost:5173/plans/:planId
```

### 3. 확인 사항
- ✅ Summary 섹션: 도넛 차트 옆 상태 범례 (고정된 순서)
- ✅ 좌측 Test Runs: 각 Run마다 스택형 Progress Bar
- ✅ 색상 일관성: 모든 곳에서 동일한 색상 사용
- ✅ 순서 일관성: Passed > In Progress > Failed > Blocked > Not Run

---

## 📝 향후 개선 가능 사항

### 1. API 개선
```typescript
// backend: PlanStats에 inProgress 추가
interface PlanStats {
  total: number;
  pass: number;
  inProgress: number; // 추가
  fail: number;
  block: number;
  notRun: number;
  progress: number;
}
```

### 2. 애니메이션 강화
```tsx
<StackedProgressBar
  statusCounts={statusCounts}
  animated={true} // 로딩 시 애니메이션
/>
```

### 3. 인터랙티브 기능
```tsx
<StackedProgressBar
  statusCounts={statusCounts}
  onClick={(status) => filterByStatus(status)} // 클릭 시 필터링
  showTooltip={true}
/>
```

---

## 🎯 핵심 포인트

1. **고정된 순서**: Passed > In Progress > Failed > Blocked > Not Run
2. **일관된 색상**: 모든 컴포넌트에서 동일한 색상 팔레트 사용
3. **자동 계산**: 각 상태의 비율을 자동으로 계산하여 렌더링
4. **재사용성**: `StackedProgressBar`와 `RunStatusLegend` 컴포넌트로 통일
5. **타이포그래피**: 상태명, 개수, 퍼센트가 자연스럽게 정렬

이제 브라우저에서 확인하시면 **상태별로 구분된 스택형 Progress Bar**와 **개선된 상태 범례**를 경험하실 수 있습니다! 🎉

