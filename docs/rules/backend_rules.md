
# ⚙️ Backend Engineering Rules — AI‑First Rewritten Edition

Applies to: `/backend/**`

---

## 1. Architecture
Backend follows strict 3‑layer pattern:
1. **Controller** — HTTP parsing, validation, response formatting  
2. **Service** — business logic  
3. **Prisma** — DB access only

No logic in controllers beyond validation.

---

## 2. Prisma Rules
- All relations MUST use explicit `select` or `include`.
- Transactions required for multi‑update operations.
- Id fields MUST use UUID.

---

## 3. Validation Rules
Use **Zod** for:
- Request body
- Query params
- URL params

Controllers MUST fail early if validation fails.

---

## 4. Error Handling
Only `ApiError` permitted.

```ts
throw new ApiError(404, "TEST_CASE_NOT_FOUND", "Test case not found");
```

---

## 5. Folder Structure (Strict)
```
src/
  controllers/
  services/
  middlewares/
  routes/
  utils/
  config/
  prisma/
```

