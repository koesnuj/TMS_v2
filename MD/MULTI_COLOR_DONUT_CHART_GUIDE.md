# 다색 도넛 차트 구현 가이드

## 🎯 목표

상태별 비율에 따라 다른 색상의 세그먼트로 구성된 도넛 차트 구현

---

## 📊 요구사항

### 1. Summary 도넛 차트
- 각 상태의 개수에 비례한 각도로 다색 세그먼트 표시
- 색상 및 순서 고정: Passed → In Progress → Failed → Blocked → Not Run
- 중앙에는 전체 완료율 (Passed / 전체) 표시

### 2. Test Runs 프로그레스 바
- 상태별 비율에 따른 스택형 막대 (이미 구현됨: `StackedProgressBar`)
- 동일한 색상 팔레트 및 순서 사용

---

## 🎨 색상 및 순서

```typescript
const segments = [
  { status: 'Passed',      color: '#10B981' }, // emerald-500 (녹색)
  { status: 'In Progress', color: '#F59E0B' }, // amber-500 (노랑)
  { status: 'Failed',      color: '#EF4444' }, // red-500 (빨강)
  { status: 'Blocked',     color: '#4B5563' }, // gray-600 (진한 회색)
  { status: 'Not Run',     color: '#CBD5E1' }, // slate-300 (연한 회색)
];
```

---

## 💻 구현: MultiColorDonutChart.tsx

### 인터페이스

```typescript
interface MultiColorDonutChartProps {
  statusCounts: RunStatusCounts;  // 상태별 개수
  size?: number;                  // 차트 크기 (기본 140px)
  strokeWidth?: number;           // 링 두께 (기본 14px)
}

type RunStatusCounts = {
  passed: number;
  inProgress: number;
  failed: number;
  blocked: number;
  notRun: number;
};
```

---

### 핵심 알고리즘

#### 1. 각도 계산

```typescript
const totalCases = 
  statusCounts.passed + 
  statusCounts.inProgress + 
  statusCounts.failed + 
  statusCounts.blocked + 
  statusCounts.notRun;

// 각 세그먼트의 각도
const angle = (count / totalCases) * 360;
```

#### 2. 세그먼트 시작 위치 계산

```typescript
let currentAngle = 0;

segments.forEach(segment => {
  const angle = (segment.count / totalCases) * 360;
  const startAngle = currentAngle;
  currentAngle += angle;  // 다음 세그먼트를 위해 누적
});
```

#### 3. SVG Path 생성

```typescript
// 각도를 라디안으로 변환 (12시 방향 시작: -90도)
const startRad = (startAngle - 90) * (Math.PI / 180);
const endRad = (startAngle + angle - 90) * (Math.PI / 180);

// 호의 시작점과 끝점
const x1 = center + radius * Math.cos(startRad);
const y1 = center + radius * Math.sin(startRad);
const x2 = center + radius * Math.cos(endRad);
const y2 = center + radius * Math.sin(endRad);

// 큰 호 플래그 (180도 이상인 경우)
const largeArcFlag = angle > 180 ? 1 : 0;
```

#### 4. 도넛 모양 Path

```typescript
// 외부 원과 내부 원의 반지름
const outerRadius = radius + strokeWidth / 2;
const innerRadius = radius - strokeWidth / 2;

// SVG path 생성
const pathData = [
  `M ${x1Outer} ${y1Outer}`,           // 외부 시작점
  `A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 1 ${x2Outer} ${y2Outer}`, // 외부 호
  `L ${x2Inner} ${y2Inner}`,           // 내부 끝점으로 선
  `A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${x1Inner} ${y1Inner}`, // 내부 호 (역방향)
  'Z',                                 // 닫기
].join(' ');
```

---

## 📐 SVG Path 명령어 설명

### M (Move To)
```
M x y
```
- 펜을 (x, y) 위치로 이동 (그리지 않음)

### A (Arc)
```
A rx ry x-axis-rotation large-arc-flag sweep-flag x y
```
- `rx, ry`: 타원의 반지름
- `x-axis-rotation`: 타원 회전 각도 (0 = 회전 없음)
- `large-arc-flag`: 0 = 작은 호, 1 = 큰 호
- `sweep-flag`: 0 = 반시계방향, 1 = 시계방향
- `x, y`: 끝점 좌표

### L (Line To)
```
L x y
```
- 현재 위치에서 (x, y)까지 직선 그리기

### Z (Close Path)
```
Z
```
- 경로를 닫음 (시작점으로 직선 연결)

---

## 🔄 렌더링 로직

### 1. 전체 원 (100%)

```typescript
if (segment.percentage >= 99.9) {
  return (
    <circle
      cx={center}
      cy={center}
      r={radius}
      fill="none"
      stroke={segment.color}
      strokeWidth={strokeWidth}
    />
  );
}
```

### 2. 일반 세그먼트

```typescript
<path
  d={pathData}
  fill={segment.color}
  className="transition-all duration-500"
/>
```

---

## 🎨 시각적 예시

### 예제 데이터

```typescript
const statusCounts = {
  passed: 50,      // 50%
  inProgress: 20,  // 20%
  failed: 10,      // 10%
  blocked: 5,      // 5%
  notRun: 15,      // 15%
};
```

### 도넛 차트 렌더링

```
        12시
         ↑
    ┌────○────┐
    │ Passed  │  녹색 (180도)
    │  50%    │
    ○─────────○  3시
    │ InProg  │  노랑 (72도)
    │  20%    │
    ├─────────┤
    │F 10%│B5%│  빨강 + 진회색
    ├─────────┤
    │ Not Run │  연회색 (54도)
    │  15%    │
    └─────────┘
         ↓
        6시

중앙: "50% COMPLETE"
```

---

## 📊 완료율 계산

### Passed 기준

```typescript
const completionRate = totalCases > 0 
  ? Math.round((statusCounts.passed / totalCases) * 100) 
  : 0;

// 예시: passed=50, total=100
// → 50%
```

**이유**: 실제 완료(Passed)된 케이스만 완료율로 계산

---

## 🔗 통합: RunSummary.tsx

### Before (단일 색상)

```tsx
<DonutChart
  percentage={progress}
  color={getDonutColor()}
/>
```

### After (다색)

```tsx
<MultiColorDonutChart
  statusCounts={statusCounts}
  size={140}
  strokeWidth={14}
/>
```

---

## 🎯 주요 특징

### 1. 정확한 비율 표현
- 각 상태의 개수에 정확히 비례한 각도
- 소수점 계산으로 정밀도 유지

### 2. 고정된 순서
- Passed → In Progress → Failed → Blocked → Not Run
- 항상 12시 방향부터 시계방향으로 시작

### 3. 동적 세그먼트
- 0인 상태는 자동으로 제외
- 100%인 경우 전체 원으로 렌더링

### 4. 부드러운 애니메이션
```css
transition-all duration-500
```

### 5. 완벽한 원형
```tsx
viewBox="0 0 100 100"  // 1:1 비율
```

---

## 🧮 수학 공식

### 극좌표 → 직교좌표 변환

```typescript
x = centerX + radius * cos(angle)
y = centerY + radius * sin(angle)
```

### 각도 → 라디안 변환

```typescript
radian = degree * (Math.PI / 180)
```

### 12시 방향 시작 조정

```typescript
adjustedAngle = angle - 90  // SVG는 3시 방향이 0도이므로
```

---

## 📦 파일 구조

```
frontend/src/components/
├── MultiColorDonutChart.tsx     (새로 생성)
├── DonutChart.tsx               (단일 색상, 백업용)
├── StackedProgressBar.tsx       (좌측 프로그레스바)
├── RunStatusLegend.tsx          (상태 범례)
└── RunSummary.tsx               (통합 섹션)
```

---

## 🚀 사용 예제

### 기본 사용

```tsx
<MultiColorDonutChart
  statusCounts={{
    passed: 8,
    inProgress: 0,
    failed: 0,
    blocked: 0,
    notRun: 27,
  }}
/>
```

**결과:**
- 녹색 세그먼트: 8/35 = 22.86% ≈ 82도
- 연회색 세그먼트: 27/35 = 77.14% ≈ 278도
- 중앙: "23% COMPLETE"

### 크기 조정

```tsx
<MultiColorDonutChart
  statusCounts={counts}
  size={180}
  strokeWidth={18}
/>
```

---

## ⚙️ 최적화

### 1. 0인 세그먼트 필터링

```typescript
.filter(seg => seg.count > 0)
```

**효과**: 불필요한 DOM 요소 생성 방지

### 2. 100% 케이스 특수 처리

```typescript
if (segment.percentage >= 99.9) {
  return <circle ... />;
}
```

**효과**: Path 계산 불필요, 더 정확한 원

### 3. 메모이제이션 (선택사항)

```typescript
const segmentsWithAngles = useMemo(() => {
  // 계산 로직
}, [statusCounts, totalCases]);
```

---

## 🐛 엣지 케이스 처리

### 1. 전체 0인 경우

```typescript
if (totalCases === 0) {
  return <EmptyDonutChart />;
}
```

### 2. 단일 상태만 있는 경우

```typescript
if (activeSegments.length === 1) {
  return <circle ... />;  // 전체 원으로 렌더링
}
```

### 3. 매우 작은 세그먼트 (<1%)

```typescript
// 현재 구현은 정확한 각도로 렌더링
// 필요시 최소 각도 설정 가능
const minAngle = 5;  // 최소 5도
```

---

## 📊 비교: 단일 vs 다색

| 항목 | 단일 색상 | 다색 세그먼트 |
|------|----------|-------------|
| **정보량** | 전체 완료율만 | 각 상태별 비율 |
| **시각적** | 심플 | 상세 |
| **계산 복잡도** | 낮음 | 높음 |
| **DOM 요소** | 2개 (배경 + 진행) | N+1개 (배경 + 세그먼트들) |
| **렌더링 성능** | 빠름 | 보통 |
| **사용 케이스** | 간단한 진행률 | 상세 상태 분석 |

---

## ✅ 체크리스트

- [x] 상태별 비율 정확히 계산
- [x] 고정된 색상 순서
- [x] 12시 방향부터 시작
- [x] 완료율(Passed 기준) 중앙 표시
- [x] 0인 세그먼트 자동 제외
- [x] 100% 케이스 특수 처리
- [x] 완벽한 원형 (viewBox 1:1)
- [x] 부드러운 애니메이션
- [x] TypeScript 타입 안전성
- [x] 좌측 프로그레스바와 색상 일관성

---

## 🎯 결론

### 장점
1. ✅ 각 상태의 비율을 직관적으로 표현
2. ✅ 정확한 수학적 계산
3. ✅ 좌측 프로그레스바와 일관된 시각화
4. ✅ 재사용 가능한 컴포넌트
5. ✅ 부드러운 애니메이션

### 사용 시나리오
- **Summary 섹션**: 전체 테스트 상태 한눈에 파악
- **대시보드**: 프로젝트별 테스트 현황
- **리포트**: 시각적 테스트 결과 표현

---

브라우저에서 확인하시면 **상태별 비율에 따른 다색 도넛 차트**를 경험하실 수 있습니다! 🎉

