# TMS v2.0 반응형 레이아웃 가이드

## 📐 레이아웃 구조 개요

TMS v2.0은 **좌측 고정 사이드바 + 우측 유동 콘텐츠 영역** 구조를 사용합니다.

```
┌─────────────────────────────────────────────────────┐
│ ┌──────┐  ┌────────────────────────────────────┐   │
│ │      │  │         Header (검색, 알림)         │   │
│ │ Side │  ├────────────────────────────────────┤   │
│ │ bar  │  │                                    │   │
│ │ 256px│  │    Main Content (유동적 확장)       │   │
│ │ 고정  │  │    max-w-[1800px]                 │   │
│ │      │  │    padding: 32px                   │   │
│ │      │  │                                    │   │
│ └──────┘  └────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

---

## 🎯 반응형 Breakpoint 전략

### 화면 크기별 동작
- **< 1024px (태블릿)**: Sidebar 숨김 또는 오버레이 형태
- **1024px ~ 1600px**: 콘텐츠 영역 100% 사용
- **1600px ~ 1920px**: 콘텐츠 max-w-[1600px]까지 확장
- **1920px ~ 2560px**: 콘텐츠 max-w-[1800px]까지 확장
- **> 2560px**: 콘텐츠 1800px로 제한, 좌우 여백 증가

---

## 💻 Tailwind 클래스 적용 규칙

### 1. Layout.tsx (전체 레이아웃)
```tsx
<div className="flex min-h-screen bg-slate-50">
  {/* Sidebar: 고정폭 */}
  <Sidebar /> {/* w-64 (256px) */}
  
  {/* Main Wrapper: 유동 확장 */}
  <div className="flex-1 flex flex-col ml-64 min-w-0">
    <Header />
    <main className="flex-1 overflow-hidden">
      <Outlet />
    </main>
  </div>
</div>
```

### 2. 페이지 컨테이너 (공통 패턴)
```tsx
// 일반 페이지 (PlansPage, AdminPage)
<div className="p-8 w-full mx-auto max-w-[1800px]">
  {/* 콘텐츠 */}
</div>

// 폼 페이지 (CreatePlanPage)
<div className="p-8 w-full mx-auto max-w-[1600px]">
  {/* 콘텐츠 */}
</div>

// 분할 뷰 페이지 (TestCasesPage)
<div className="flex h-full">
  {/* 좌측 Inner Sidebar */}
  <div className="w-72 flex-shrink-0">...</div>
  
  {/* 우측 콘텐츠: 나머지 공간 모두 사용 */}
  <div className="flex-1 min-w-0">...</div>
</div>
```

---

## 🎨 컴포넌트별 레이아웃 코드

### A. Layout.tsx (전체 레이아웃)
```tsx
import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

const Layout: React.FC = () => {
  return (
    <div className="flex min-h-screen bg-slate-50 font-sans text-slate-900">
      {/* Sidebar: 고정 256px */}
      <Sidebar />

      {/* Main Content Wrapper: 유동 확장 */}
      <div className="flex-1 flex flex-col ml-64 min-w-0 transition-all duration-300">
        
        {/* Top Header: 고정 높이 64px */}
        <Header />

        {/* Page Content: 나머지 공간 모두 사용 */}
        <main className="flex-1 overflow-hidden relative flex flex-col">
           <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
```

### B. PlansPage.tsx (목록 페이지)
```tsx
const PlansPage: React.FC = () => {
  return (
    // w-full: 가능한 모든 너비 사용
    // max-w-[1800px]: 최대 1800px로 제한
    // mx-auto: 좌우 자동 여백 (가운데 정렬)
    // p-8: 내부 여백 32px
    <div className="p-8 w-full mx-auto max-w-[1800px]">
      <div className="flex justify-between items-end mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Test Plans & Runs</h1>
          <p className="text-slate-500 mt-1">Manage your test execution cycles.</p>
        </div>
        <Button onClick={() => navigate('/plans/create')}>
          Add Test Plan
        </Button>
      </div>

      {/* 테이블: 부모 컨테이너 너비를 100% 사용 */}
      <Card noPadding>
        <table className="min-w-full divide-y divide-slate-200">
          {/* ... */}
        </table>
      </Card>
    </div>
  );
};
```

### C. PlanDetailPage.tsx (상세 페이지)
```tsx
const PlanDetailPage: React.FC = () => {
  return (
    <div className="p-8 w-full mx-auto max-w-[1800px]">
      {/* 헤더 카드: 좌우로 넓게 확장 */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6 mb-6">
        <div className="flex items-start justify-between">
          {/* 좌측: 플랜 정보 (flex-1로 공간 최대 활용) */}
          <div className="flex-1">
            {/* ... */}
          </div>

          {/* 우측: Progress 카드 (고정폭 320px) */}
          <div className="w-80 bg-slate-50 rounded-lg border border-slate-200 p-5">
            {/* ... */}
          </div>
        </div>
      </div>

      {/* 테이블: 전체 너비 사용 */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        <table className="min-w-full">
          {/* ... */}
        </table>
      </div>
    </div>
  );
};
```

### D. TestCasesPage.tsx (분할 뷰)
```tsx
const TestCasesPage: React.FC = () => {
  return (
    // height: 100%로 부모 높이 모두 사용
    <div className="flex h-full">
      {/* Inner Sidebar: 고정 288px */}
      <div className="w-72 bg-slate-50 border-r border-slate-200 flex-shrink-0">
        {/* 폴더 트리 */}
      </div>

      {/* Main Content: 나머지 공간 모두 사용 */}
      <div className="flex-1 flex flex-col bg-white min-w-0">
        {/* min-w-0: flex 아이템이 축소될 수 있도록 허용 */}
        <div className="px-8 py-5 border-b border-slate-200">
          {/* 툴바 */}
        </div>
        <div className="flex-1 overflow-auto p-8 bg-slate-50/50">
          {/* 테이블: 너비 제한 없음, 스크롤 가능 */}
          <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
            <table className="min-w-full">
              {/* ... */}
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
```

---

## 📏 주요 클래스 설명

### 너비 제어
- `w-full`: 부모 너비 100% 사용
- `max-w-[1800px]`: 최대 너비 1800px 제한
- `mx-auto`: 좌우 여백 자동 (가운데 정렬)
- `min-w-0`: flex 아이템이 축소 가능하도록 설정

### Flex 레이아웃
- `flex-1`: 가능한 모든 공간 차지
- `flex-shrink-0`: 축소 방지 (고정폭 유지)
- `min-w-0`: 텍스트 overflow 방지

### 여백
- `p-8`: 내부 여백 32px (2rem)
- `px-8`: 좌우 여백만 32px
- `ml-64`: 좌측 마진 256px (Sidebar 너비만큼)

---

## 🖥 화면 크기별 예시

### 1920x1080 (Full HD)
```
좌측 Sidebar: 256px (고정)
콘텐츠 영역: 1664px → max-w-[1800px] 제한 없음
실제 콘텐츠 너비: 1600px (padding 32px 제외)
```

### 1366x768 (노트북)
```
좌측 Sidebar: 256px (고정)
콘텐츠 영역: 1110px
실제 콘텐츠 너비: 1046px (padding 32px 제외)
```

### 2560x1440 (2K 모니터)
```
좌측 Sidebar: 256px (고정)
콘텐츠 영역: 2304px → max-w-[1800px]로 제한
실제 콘텐츠 너비: 1736px (padding 32px 제외)
여백: 좌우 각 252px
```

---

## ✅ 적용 완료된 페이지

- ✅ PlansPage: `max-w-[1800px]`
- ✅ PlanDetailPage: `max-w-[1800px]`
- ✅ AdminPage: `max-w-[1800px]`
- ✅ CreatePlanPage: `max-w-[1600px]` (폼 페이지는 조금 더 좁게)
- ✅ TestCasesPage: 분할 뷰로 전체 너비 사용

---

## 🎯 핵심 원칙

1. **좌측 Sidebar는 항상 고정폭 유지** (`w-64` = 256px)
2. **우측 콘텐츠는 유동적으로 확장** (`flex-1`)
3. **콘텐츠 최대폭 제한으로 가독성 확보** (`max-w-[1800px]`)
4. **중앙 정렬 유지** (`mx-auto`)
5. **일정한 여백 유지** (`p-8` = 32px)

이 구조를 통해 다양한 해상도에서 최적의 사용 경험을 제공합니다.

