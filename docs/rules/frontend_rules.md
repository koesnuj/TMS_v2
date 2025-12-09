
# 🎨 Frontend Engineering Rules — AI‑First Rewritten Edition

Applies to: `/frontend/**`

---

## 1. React Architecture

### 1.1 Component Structure
Each component file MUST contain:
- Imports
- Types/interfaces
- Component function
- Hooks
- Helper functions (bottom)

### 1.2 Component Patterns
- Single responsibility
- No business logic in components → use service or API layer
- Pure components unless side effects required
- Prefer React.memo for heavy lists

---

## 2. Tailwind CSS Rules
- Utility-first; avoid custom CSS unless required
- Use `cn()` helper for combined class management
- Support responsive design: mobile-first

---

## 3. State Management
- Local UI state: `useState`
- Shared state: React Context + custom hooks
- No Redux / global stores unless explicitly approved

---

## 4. API Consumption
- All API interactions MUST use `/frontend/src/api/**`
- No fetch/axios inside components
- Use React Query for:
  - caching
  - background refresh
  - mutation rollback

---

## 5. Folder Structure (Strict)
```
src/
  components/
  pages/
  hooks/
  api/
  utils/
  types/
```

---

## 6. Testing
- Use RTL + Playwright patterns
- Component tests must mock API calls
- Critical flows MUST include E2E coverage

