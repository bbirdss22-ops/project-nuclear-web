import { createFileRoute, redirect } from '@tanstack/react-router'
import { Users } from '@/features/users'
import { useAuthStore } from '@/stores/auth-store'

// Guard: only superadmin can access the user management page.
export const Route = createFileRoute('/_authenticated/users/')({
  beforeLoad: () => {
    const role = useAuthStore.getState().user?.role
    if (role !== 'superadmin') {
      throw redirect({ to: '/' })
    }
  },
  component: Users,
})
