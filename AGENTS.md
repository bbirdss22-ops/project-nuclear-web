# AGENTS.md — project-nuclear-web

Frontend สำหรับ Project Nuclear — Vite + React + TanStack Router + shadcn/ui

## 🚀 Quick Start

```bash
npm install
npm run dev          # local dev (http://localhost:5173)
npm run build        # production build
npm run tsc          # type check
```

## 📁 โครงสร้างหลัก

```
src/
├── features/           # Feature modules
│   ├── auth/           # Sign-in, sign-up
│   ├── customers/      # Customer list + detail
│   ├── dashboard/      # Dashboard overview
│   └── register/       # Line registration form
├── components/         # Shared UI components
│   ├── layout/         # AppSidebar, header
│   └── ui/             # shadcn/ui components
├── lib/
│   ├── api.ts          # API client (axios) + all endpoint functions
│   └── cookies.ts      # Cookie utilities
├── stores/
│   └── auth-store.ts   # Zustand auth store (JWT + user)
├── routes/             # TanStack Router routes
│   ├── (auth)/sign-in.tsx
│   ├── (auth)/register.tsx
│   ├── _authenticated/customers/
│   └── clerk/          # Legacy Clerk routes (placeholder)
└── hooks/              # Custom hooks
```

## 🔐 Auth Flow

1. **Login:** `POST /api/auth/login` → JWT + user
2. **Store:** Zustand (auth-store.ts) → cookie `pn_access_token` + user state
3. **Guard:** `_authenticated/route.tsx` → `beforeLoad` check cookie → redirect `/sign-in`
4. **Interceptor:** 401 auto-logout → reset cookie + redirect

## 🌐 API

Base URL: `VITE_API_BASE_URL` (env var)
Backend: `https://project-nuclear-api.onrender.com`

API functions ใน `src/lib/api.ts`:
- `login()` — Auth
- `getCustomers()`, `searchCustomers()`, `getCustomerById()` — Customers CRUD
- `createCustomer()`, `updateCustomer()` — Customer mutations

## 🚢 Deploy

**Platform:** Vercel (connected GitHub repo)
**Branch:** `master` → auto-deploy
**Env vars:** `VITE_API_BASE_URL` set on Vercel dashboard

```bash
git add -A && git commit -m "..." && git push origin master
```

## 🧪 QA Notes

- QA ด้วย curl/web_fetch เท่านั้น → **ไม่สามารถเทส browser flow จริง** (JS, form submit, cookie, router navigation)
- Integration test ต้องเทสบน browser จริงหรือ Playwright/Cypress
- API endpoints สามารถเทสผ่าน curl โดยตรง

## 🔗 Related

- **Backend:** `project-nuclear-api` — NestJS + Neon DB + Line OA
- **Repo:** `github.com/bbirdss22-ops/project-nuclear-web`
- **Vault:** `project-newclear` — System Design, Phase 1 Tasks, API ref
- **Production:** `https://project-nuclear-web.vercel.app`
