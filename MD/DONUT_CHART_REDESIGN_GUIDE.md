# 도넛 차트 재디자인 가이드

## 🎯 문제점 및 해결

### Before (다중 세그먼트 도넛)

**문제점:**
1. ❌ 도넛 차트 안쪽에 알 수 없는 초록색 점
2. ❌ 타원형으로 렌더링 (원형 아님)
3. ❌ 여러 색상 세그먼트가 섞여 시각적으로 복잡
4. ❌ `strokeLinecap="round"`로 인한 포인트 생성
5. ❌ 세그먼트 각도 계산 로직 복잡

### After (단일 Progress Ring)

**개선점:**
1. ✅ 완벽한 정원 (1:1 viewBox 비율)
2. ✅ 단일 색상 Progress Ring (심플)
3. ✅ 포인트/점 완전 제거 (`strokeLinecap="butt"`)
4. ✅ 상태별 세부사항은 오른쪽 리스트로 분리
5. ✅ 부드러운 애니메이션 (`transition-all duration-500`)

---

## 📐 기술적 개선 사항

### 1. **완벽한 정원 구현**

#### Before (타원형 문제)
```tsx
<svg width={size} height={size}>
  // size를 직접 사용하면 브라우저 렌더링에 따라 왜곡 가능
```

#### After (1:1 viewBox)
```tsx
<svg 
  width={size} 
  height={size} 
  viewBox="0 0 100 100"  // ← 1:1 비율 보장
>
```

**핵심:**
- `viewBox`를 정사각형 (100x100)으로 고정
- `width`와 `height`는 실제 렌더링 크기만 결정
- SVG 내부 좌표계는 항상 정사각형 유지

---

### 2. **포인트/점 제거**

#### Before (초록색 점 생성)
```tsx
<circle
  strokeLinecap="round"  // ← 세그먼트 끝에 둥근 캡 생성
  strokeDashoffset={-offset}
  style={{
    transform: `rotate(${rotation}deg)`,  // ← 각도 회전으로 점이 이동
    transformOrigin: 'center',
  }}
/>
```

**문제:**
- `strokeLinecap="round"`: 선의 끝을 둥글게 처리 → 점처럼 보임
- 여러 세그먼트가 회전하면서 포인트들이 생성됨

#### After (포인트 없음)
```tsx
<circle
  strokeLinecap="butt"  // ← 평평한 끝
  strokeDashoffset={progress}
  className="transition-all duration-500"
/>
```

**해결:**
- `strokeLinecap="butt"`: 선의 끝을 평평하게 처리
- 단일 링만 사용하므로 불필요한 포인트 없음

---

### 3. **진행률 계산 단순화**

#### Before (복잡한 세그먼트 계산)
```tsx
// 각 세그먼트마다 개별 계산
segments.map((segment, index) => {
  const segmentLength = (segment.value / 100) * circumference;
  const offset = circumference - segmentLength;
  const rotation = currentAngle;
  currentAngle += (segment.value / 100) * 360;
  // ...
});
```

#### After (단일 진행률 계산)
```tsx
const circumference = 2 * Math.PI * radius;
const progress = ((100 - percentage) / 100) * circumference;

<circle
  strokeDasharray={circumference}
  strokeDashoffset={progress}
/>
```

**설명:**
- `strokeDasharray`: 전체 둘레 설정
- `strokeDashoffset`: 미완료 부분만큼 오프셋
- `(100 - percentage)`: 역순 계산으로 12시 방향부터 채워짐

---

## 🎨 시각적 구조

### 레이아웃

```
┌────────────────────────────────────────────────────┐
│ SUMMARY                                            │
├────────────────────────────────────────────────────┤
│                                                    │
│  ┌──────────┐         ┌────────────────────────┐ │
│  │          │         │                        │ │
│  │   23%    │    │    │ ● Passed       8 (23%)│ │
│  │ COMPLETE │    │    │ ● In Progress  0 (0%) │ │
│  │          │    │    │ ● Failed       0 (0%) │ │
│  │ 8 of 35  │    │    │ ● Blocked      0 (0%) │ │
│  │ done     │    │    │ ● Not Run     27 (77%)│ │
│  └──────────┘    │    │                        │ │
│                  │    └────────────────────────┘ │
│   단일 링        │         상태별 리스트         │
│   (완료율만)     │      (세부 퍼센트 표시)       │
└────────────────────────────────────────────────────┘
```

---

## 💻 코드 구조

### DonutChart.tsx (재설계)

```tsx
interface DonutChartProps {
  percentage: number;    // 완료율 (0-100)
  size?: number;         // 실제 렌더링 크기 (기본 140px)
  strokeWidth?: number;  // 링 두께 (기본 14px)
  color?: string;        // 진행 링 색상 (기본 녹색)
}

export const DonutChart: React.FC<DonutChartProps> = ({
  percentage,
  size = 140,
  strokeWidth = 14,
  color = '#10B981',
}) => {
  // 1:1 비율 viewBox
  const viewBoxSize = 100;
  const center = viewBoxSize / 2;
  const radius = (viewBoxSize - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  
  // 진행률 계산
  const progress = ((100 - percentage) / 100) * circumference;
  
  return (
    <div className="relative inline-flex items-center justify-center">
      <svg 
        width={size} 
        height={size} 
        viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`}
        className="transform -rotate-90"
      >
        {/* 배경 링 */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="#E2E8F0"
          strokeWidth={strokeWidth}
        />
        
        {/* 진행 링 */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={progress}
          strokeLinecap="butt"
          className="transition-all duration-500"
        />
      </svg>
      
      {/* 중앙 텍스트 */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="text-3xl font-bold text-slate-900">
          {percentage}%
        </div>
        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Complete
        </div>
      </div>
    </div>
  );
};
```

---

### RunSummary.tsx (통합)

```tsx
// 완료율 계산 (NOT_RUN 제외)
const completedCases = 
  statusCounts.passed + 
  statusCounts.failed + 
  statusCounts.blocked + 
  statusCounts.inProgress;

const progress = totalCases > 0 
  ? Math.round((completedCases / totalCases) * 100) 
  : 0;

// 도넛 색상 결정 (상태에 따라)
const getDonutColor = () => {
  if (progress === 100) return '#10B981';     // emerald-500 (완료)
  if (statusCounts.failed > 0) return '#EF4444';  // red-500 (실패)
  if (statusCounts.blocked > 0) return '#F59E0B'; // amber-500 (차단)
  return '#6366F1';                           // indigo-500 (진행 중)
};

// 렌더링
<DonutChart
  percentage={progress}
  size={140}
  strokeWidth={14}
  color={getDonutColor()}
/>
```

---

## 🎨 색상 로직

### 도넛 링 색상 (우선순위)

1. **완료 (100%)**: 녹색 `#10B981`
2. **실패 있음**: 빨강 `#EF4444`
3. **차단 있음**: 노랑 `#F59E0B`
4. **진행 중**: 인디고 `#6366F1`

### 상태별 범례 색상 (고정)

- Passed: `#10B981` (emerald-500)
- In Progress: `#F59E0B` (amber-500)
- Failed: `#EF4444` (red-500)
- Blocked: `#4B5563` (gray-600)
- Not Run: `#9CA3AF` (gray-400)

---

## ✅ 체크리스트

### 문제 해결 확인

- [x] 타원형 → 정원 (viewBox 1:1)
- [x] 초록색 점 제거 (strokeLinecap="butt")
- [x] 복잡한 세그먼트 → 단일 링
- [x] 상태별 세부사항 오른쪽 분리
- [x] 부드러운 애니메이션 추가

### 시각적 개선

- [x] 완벽한 원형 렌더링
- [x] 깔끔한 단일 색상 링
- [x] 명확한 중앙 텍스트 (XX% / COMPLETE)
- [x] 포인트/점 완전 제거
- [x] 일관된 스트로크 두께

### 코드 품질

- [x] Props 인터페이스 단순화
- [x] 계산 로직 단순화
- [x] 재사용 가능한 컴포넌트
- [x] TypeScript 타입 안전성
- [x] 린트 에러 없음

---

## 🔧 SVG 파라미터 설명

### viewBox
```tsx
viewBox="0 0 100 100"
```
- 첫 두 숫자 (0, 0): 시작 좌표
- 마지막 두 숫자 (100, 100): 너비, 높이
- **1:1 비율로 완벽한 정원 보장**

### strokeDasharray & strokeDashoffset
```tsx
strokeDasharray={circumference}    // 전체 둘레
strokeDashoffset={progress}        // 미완료 부분
```
- `dasharray`: 선을 점선으로 만드는 패턴
- `dashoffset`: 점선 패턴의 시작 위치 조정
- 이 두 속성을 조합하여 진행률 표현

### transform: rotate(-90deg)
```tsx
className="transform -rotate-90"
```
- SVG 원은 기본적으로 3시 방향부터 시작
- -90도 회전으로 12시 방향부터 시작하도록 변경

### strokeLinecap
```tsx
strokeLinecap="butt"  // 평평한 끝
// vs
strokeLinecap="round" // 둥근 끝 (점 생성)
```

---

## 🚀 사용 방법

### 1. 기본 사용
```tsx
<DonutChart percentage={75} />
```

### 2. 커스텀 색상
```tsx
<DonutChart 
  percentage={50} 
  color="#EF4444"  // 빨강
/>
```

### 3. 크기 조정
```tsx
<DonutChart 
  percentage={90} 
  size={180}       // 더 큰 차트
  strokeWidth={18} // 더 두꺼운 링
/>
```

---

## 📊 비교표

| 항목 | Before (다중 세그먼트) | After (단일 링) |
|------|---------------------|---------------|
| **형태** | 타원형 | 정원 |
| **세그먼트** | 5개 (복잡) | 1개 (단순) |
| **포인트/점** | 있음 (초록색 점) | 없음 |
| **계산 로직** | 복잡 (각도 회전) | 단순 (offset만) |
| **색상** | 5가지 혼재 | 1가지 (상태 기반) |
| **viewBox** | 없음 | 1:1 (100x100) |
| **strokeLinecap** | round | butt |
| **애니메이션** | 없음 | 부드러운 트랜지션 |
| **코드 라인** | ~50줄 | ~30줄 |

---

## 🎯 결론

### 핵심 개선

1. **완벽한 정원**: `viewBox="0 0 100 100"` 사용
2. **포인트 제거**: `strokeLinecap="butt"` 적용
3. **단순화**: 다중 세그먼트 → 단일 Progress Ring
4. **분리**: 도넛은 완료율만, 상태 세부사항은 리스트로

### 장점

- ✅ 시각적으로 깔끔하고 전문적
- ✅ 코드 유지보수 용이
- ✅ 퍼포먼스 향상 (단일 링)
- ✅ 재사용성 높음
- ✅ 애니메이션 부드러움

---

브라우저에서 확인하시면 **완벽한 정원 형태의 깔끔한 도넛 차트**를 경험하실 수 있습니다! 🎉

