# Task Checklist: Store Management Integration

## Phase 1: Backend Implementation
- [x] Update `backend/prisma/schema.prisma` with Store models and relations
- [x] Validate and generate Prisma client: `npx prisma validate` & `npm run prisma:generate`
- [x] Modify `backend/src/types/enums.ts` (add `STORE_MANAGER` role, store audit actions)
- [x] Create `backend/src/controllers/storeItems.controller.ts` (CRUD for items, stock counts)
- [x] Create `backend/src/controllers/stockTransactions.controller.ts` (inward/outward logs)
- [x] Create `backend/src/routes/store.routes.ts` (mount routers, apply roles check)
- [x] Update `backend/src/app.ts` (wire up store routes, upgrade `/health/system` telemetry counts)

## Phase 2: Frontend Implementation
- [x] Update `frontend/src/context/AuthContext.tsx` (login route redirection)
- [x] Update `frontend/src/components/Sidebar.tsx` (workspace switcher, role filtering)
- [x] Create `frontend/src/app/store/page.tsx` (store manager dashboard)
- [x] Create `frontend/src/app/store/items/page.tsx` (inventory management CRUD)
- [x] Create `frontend/src/app/store/transactions/page.tsx` (issue items, inward stock ledger)
- [x] Update `frontend/src/app/system/page.tsx` (diagnostics panel telemetry graphs for store)

## Phase 3: Verification & Walkthrough
- [x] Run backend schema validation
- [x] Perform build/lint checks on both frontend and backend
- [x] Create walkthrough documentation with summary
