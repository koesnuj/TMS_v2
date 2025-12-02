# 고정 우측 패널 레이아웃 가이드

## 📐 레이아웃 구조

```
┌────────────────────────────────────────────────────────────┐
│ h-screen (100vh)                                          │
│ ┌──────────────────────────────────┐ ┌─────────────────┐ │
│ │ 좌측+중앙 래퍼 (flex-1)           │ │ 우측 패널       │ │
│ │ overflow-y-auto (스크롤 가능)     │ │ sticky top-0   │ │
│ │                                  │ │ h-screen       │ │
│ │ ┌──────┐ ┌───────────────────┐  │ │ ┌────────────┐ │ │
│ │ │좌측  │ │중앙 테이블         │  │ │ │ Header 고정│ │ │
│ │ │Test  │ │• Test Run Info    │  │ │ ├────────────┤ │ │
│ │ │Runs  │ │• Search Bar       │  │ │ │ Content ↕  │ │ │
│ │ │      │ │• Table Header     │  │ │ │ (스크롤)   │ │ │
│ │ │      │ │• Test Case 1      │  │ │ │            │ │ │
│ │ │ ↓    │ │• Test Case 2      │  │ │ │            │ │ │
│ │ │ ↓    │ │• Test Case 3      │  │ │ │            │ │ │
│ │ │ ↓    │ │  ...              │  │ │ │            │ │ │
│ │ │      │ │• Test Case N      │  │ │ │            │ │ │
│ │ └──────┘ └───────────────────┘  │ │ └────────────┘ │ │
│ │                                  │ │                │ │
│ │ 좌측+중앙이 함께 스크롤됨          │ │ 화면에 고정됨   │ │
│ └──────────────────────────────────┘ └─────────────────┘ │
└────────────────────────────────────────────────────────────┘
```

---

## 🎯 핵심 원리

### 1. **전체 컨테이너**
```tsx
<div className="flex h-screen overflow-hidden">
```
- `flex`: Flexbox 레이아웃
- `h-screen`: 100vh (전체 화면 높이)
- `overflow-hidden`: 브라우저 스크롤바 숨김

### 2. **좌측+중앙 래퍼**
```tsx
<div className="flex-1 flex overflow-y-auto overflow-x-hidden">
  {/* 좌측 컬럼 */}
  <div className="w-[260px] ...">...</div>
  
  {/* 중앙 컬럼 */}
  <div className="flex-1 ...">...</div>
</div>
```
- `flex-1`: 나머지 공간 차지 (우측 패널 제외)
- `flex`: 내부를 row 방향 Flexbox로
- `overflow-y-auto`: 세로 스크롤 가능
- `overflow-x-hidden`: 가로 스크롤 방지
- **이 래퍼가 스크롤되면 좌측+중앙이 함께 움직임**

### 3. **우측 패널 (고정)**
```tsx
{selectedItem && (
  <div className="sticky top-0 h-screen">
    <TestCaseDetailColumn ... />
  </div>
)}
```
- `sticky top-0`: 화면 상단에 고정
- `h-screen`: 100vh (전체 화면 높이)
- **좌측+중앙이 스크롤되어도 우측은 움직이지 않음**

### 4. **우측 패널 내부**
```tsx
<div className="w-[420px] h-full ... flex flex-col overflow-hidden">
  {/* Header - 고정 */}
  <div className="flex-shrink-0 ...">
    Test Case Details [X]
  </div>
  
  {/* Content - 스크롤 */}
  <div className="flex-1 overflow-y-auto ...">
    {/* Assignee, Status, Steps, Comment 등 */}
  </div>
</div>
```
- `h-full`: 부모(`h-screen`)의 높이 상속
- `flex flex-col`: 세로 방향 Flexbox
- `overflow-hidden`: 전체 컨테이너는 스크롤 없음
- Header: `flex-shrink-0` (고정)
- Content: `flex-1 overflow-y-auto` (내용이 길면 스크롤)

---

## 🔄 스크롤 동작

### A. 사용자가 마우스 휠로 아래로 스크롤
```
1. 포인터가 좌측 또는 중앙 영역에 있을 때:
   → 좌측+중앙 래퍼가 스크롤됨
   → 좌측 Test Runs + 중앙 Test Cases가 함께 위로 올라감
   → 우측 패널은 고정되어 움직이지 않음

2. 포인터가 우측 패널 영역에 있을 때:
   → 우측 패널 내부 Content만 스크롤됨
   → Header("Test Case Details")는 고정
   → 좌측+중앙은 움직이지 않음
```

### B. 브라우저 스크롤바
```
좌측+중앙 래퍼 영역: 세로 스크롤바 표시 (내용이 길 경우)
우측 패널 Content: 세로 스크롤바 표시 (내용이 길 경우)
브라우저 전체: 스크롤바 없음 (overflow-hidden)
```

---

## 💻 코드 구조

### PlanDetailPage3Column.tsx
```tsx
const PlanDetailPage3Column: React.FC = () => {
  // ... state 및 함수들

  return (
    <div className="flex h-screen overflow-hidden">
      {/* 좌측+중앙 래퍼: 함께 스크롤 */}
      <div className="flex-1 flex overflow-y-auto overflow-x-hidden">
        
        {/* 좌측 컬럼: Test Runs List */}
        <div className="w-[260px] bg-slate-50 border-r border-slate-200 flex flex-col flex-shrink-0">
          <div className="p-4 border-b border-slate-200 bg-white">
            {/* Header */}
          </div>
          <div className="flex-1">
            {/* Test Runs List */}
          </div>
        </div>

        {/* 중앙 컬럼: Test Cases Table */}
        <div className="flex-1 flex flex-col bg-white min-w-0">
          <div className="px-6 py-4 border-b border-slate-200">
            {/* Test Run Info Header */}
          </div>
          <div className="px-6 py-3 border-b border-slate-200">
            {/* Toolbar (Search) */}
          </div>
          <div className="flex-1">
            {/* Table */}
            <table className="min-w-full">
              <thead className="sticky top-0 ...">...</thead>
              <tbody>...</tbody>
            </table>
          </div>
        </div>

      </div>
      {/* 좌측+중앙 래퍼 종료 */}

      {/* 우측 컬럼: Detail Column (고정) */}
      {selectedItem && (
        <div className="sticky top-0 h-screen">
          <TestCaseDetailColumn
            planItem={selectedItem}
            users={users}
            onClose={() => setSelectedItem(null)}
            onUpdate={handleUpdate}
          />
        </div>
      )}
    </div>
  );
};
```

### TestCaseDetailColumn.tsx
```tsx
export const TestCaseDetailColumn: React.FC<Props> = ({...}) => {
  return (
    <div className="w-[420px] h-full bg-white border-l border-slate-200 flex-shrink-0 flex flex-col overflow-hidden">
      
      {/* Header - 고정 */}
      <div className="bg-white border-b border-slate-200 px-5 py-4 flex items-center justify-between flex-shrink-0">
        <h3>Test Case Details</h3>
        <button onClick={onClose}>
          <X size={18} />
        </button>
      </div>

      {/* Content - 스크롤 */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
        {/* Assignee */}
        {/* Status */}
        {/* Precondition */}
        {/* Steps */}
        {/* Expected Result */}
        {/* Comment */}
      </div>
    </div>
  );
};
```

---

## ✅ 장점

### 1. **직관적인 스크롤 동작**
- 좌측+중앙을 보면서 스크롤 → 리스트가 움직임
- 우측 디테일을 보면서 스크롤 → 디테일 내용만 움직임

### 2. **우측 패널 항상 가시성**
- Test Case를 선택하면 우측 패널이 화면에 고정됨
- 좌측이나 중앙을 아무리 스크롤해도 우측은 그대로
- 언제든지 Status/Assignee를 변경하거나 닫을 수 있음

### 3. **공간 활용**
- 좌측+중앙이 긴 리스트여도 스크롤로 모두 접근 가능
- 우측 패널도 내용이 길면 독립적으로 스크롤
- 화면 크기에 맞게 최적화된 레이아웃

### 4. **성능**
- `position: sticky` 사용으로 GPU 가속
- 조건부 렌더링으로 불필요한 DOM 최소화
- 각 영역의 스크롤이 독립적이라 리렌더링 최소화

---

## 📊 레이아웃 비교

| 항목 | 이전 (독립 스크롤) | 현재 (좌/중 함께, 우 고정) |
|------|-------------------|-------------------------|
| **좌측 패널** | 독립 스크롤 | 중앙과 함께 스크롤 |
| **중앙 테이블** | 독립 스크롤 | 좌측과 함께 스크롤 |
| **우측 패널** | 독립 스크롤 | 화면 고정 (sticky) |
| **스크롤바** | 각 컬럼마다 | 좌/중 래퍼에 1개, 우측 내부에 1개 |
| **사용성** | 혼란 가능 | 직관적 |
| **패널 가시성** | 스크롤 시 가려짐 | 항상 보임 |

---

## 🎨 CSS/Tailwind 핵심 클래스

### 전체 컨테이너
```css
flex h-screen overflow-hidden
```
→ Flexbox, 100vh, 브라우저 스크롤 없음

### 좌/중 래퍼
```css
flex-1 flex overflow-y-auto overflow-x-hidden
```
→ 남은 공간 차지, 내부 Flexbox, 세로 스크롤 가능

### 우측 패널 래퍼
```css
sticky top-0 h-screen
```
→ 상단 고정, 100vh

### 우측 패널 내부
```css
w-[420px] h-full flex flex-col overflow-hidden
```
→ 고정폭, 부모 높이, 세로 Flexbox

### 우측 패널 헤더
```css
flex-shrink-0
```
→ 축소 방지 (고정 영역)

### 우측 패널 콘텐츠
```css
flex-1 overflow-y-auto
```
→ 남은 공간 차지, 내용이 길면 스크롤

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

### 3. 스크롤 동작 확인
1. ✅ 좌측/중앙 영역에서 마우스 휠 → 좌/중이 함께 스크롤
2. ✅ 우측 패널 선택 → 화면에 고정되어 있음
3. ✅ 우측 패널 위에서 마우스 휠 → 패널 내부만 스크롤
4. ✅ 좌측/중앙을 스크롤해도 → 우측 패널은 그대로

---

## 🎯 핵심 포인트

1. **좌측+중앙을 하나의 래퍼로 묶기**
   ```tsx
   <div className="flex-1 flex overflow-y-auto">
     <LeftColumn />
     <CenterColumn />
   </div>
   ```

2. **우측 패널을 sticky로 고정**
   ```tsx
   <div className="sticky top-0 h-screen">
     <RightColumn />
   </div>
   ```

3. **전체 컨테이너는 h-screen + overflow-hidden**
   ```tsx
   <div className="flex h-screen overflow-hidden">
   ```

4. **우측 패널 내부는 flex-col + overflow-y-auto**
   ```tsx
   <div className="flex flex-col h-full overflow-hidden">
     <div className="flex-shrink-0">{/* Header */}</div>
     <div className="flex-1 overflow-y-auto">{/* Content */}</div>
   </div>
   ```

---

이제 브라우저에서 확인하시면 **좌측+중앙은 함께 스크롤**되고, **우측 패널은 화면에 고정**되는 직관적인 레이아웃을 경험하실 수 있습니다! 🎉

**핵심**: `position: sticky` + `h-screen`을 사용하여 우측 패널이 화면에 고정되면서도 DOM 구조상 자연스럽게 배치되어, 복잡한 z-index 관리나 fixed positioning의 문제를 피할 수 있습니다.

