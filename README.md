# ระบบเกษตรนิวเคลียร์ — Dashboard

แอปพลิเคชัน Dashboard สำหรับบริหารจัดการสมาชิก สร้างด้วย Vite + React + TailwindCSS

![alt text](public/images/shadcn-admin.png)

[![Sponsored by Clerk](https://img.shields.io/badge/Sponsored%20by-Clerk-5b6ee1?logo=clerk)](https://go.clerk.com/GttUAaK)

Dashboard UI สำหรับโครงการในทีม สร้างจากฐานเดิมของ [shadcn-admin](https://github.com/satnaing/shadcn-admin) ซึ่งใช้ Shadcn UI components (ปัจจุบันเป็น components มาตรฐานในโปรเจกต์)

> Note: โปรเจกต์นี้ยังคงใช้ shadcn/ui components (CSS Variables + TailwindCSS) ในรูปแบบเดิม แต่เปลี่ยน branding texts เป็นภาษาไทย

## Features

- Light/dark mode
- Responsive
- Accessible
- With built-in Sidebar component
- Global search command
- 10+ pages
- Extra custom components
- RTL support

<details>
<summary>Customized Components (click to expand)</summary>

This project uses Shadcn UI components, but some have been slightly modified for better RTL (Right-to-Left) support and other improvements.

If you want to update components using the Shadcn CLI (e.g., `npx shadcn@latest add <component>`), it's generally safe for non-customized components. For the listed customized ones, you may need to manually merge changes to preserve the project's modifications and avoid overwriting RTL support or other updates.

### Modified Components

- scroll-area
- sonner
- separator

### RTL Updated Components

- alert-dialog
- calendar
- command
- dialog
- dropdown-menu
- select
- table
- sheet
- sidebar
- switch

**Notes:**

- **Modified Components**: These have general updates, potentially including RTL adjustments.
- **RTL Updated Components**: These have specific changes for RTL language support (e.g., layout, positioning).
- For implementation details, check the source files in `src/components/ui/`.
- All other components in the project are standard and can be safely updated via the CLI.

</details>

## Tech Stack

**UI:** [ShadcnUI](https://ui.shadcn.com) (TailwindCSS + RadixUI)

**Build Tool:** [Vite](https://vitejs.dev/)

**Routing:** [TanStack Router](https://tanstack.com/router/latest)

**Type Checking:** [TypeScript](https://www.typescriptlang.org/)

**Linting/Formatting:** [ESLint](https://eslint.org/) & [Prettier](https://prettier.io/)

**Icons:** [Lucide Icons](https://lucide.dev/icons/), [Tabler Icons](https://tabler.io/icons) (Brand icons only)

**Auth (partial):** [Clerk](https://go.clerk.com/GttUAaK)

## Run Locally

Clone the project

```bash
  git clone https://github.com/bbirdss22-ops/project-nuclear-web.git
```

Go to the project directory

```bash
  cd project-nuclear-web
```

Install dependencies

```bash
  pnpm install
```

Start the server

```bash
  pnpm run dev
```

## License

Licensed under the [MIT License](https://choosealicense.com/licenses/mit/)
