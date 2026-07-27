import { createFileRoute, redirect } from '@tanstack/react-router'
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout'
import { getCookie } from '@/lib/cookies'

const ACCESS_TOKEN = 'pn_access_token'

export const Route = createFileRoute('/_authenticated')({
  beforeLoad: async ({ location }) => {
    try {
      const token = getCookie(ACCESS_TOKEN)
      if (!token) {
        throw redirect({
          to: '/sign-in',
          search: { redirect: location.pathname + location.search + location.hash },
        })
      }
    } catch (err) {
      // If it's a TanStack Router redirect, rethrow it
      if (err && typeof err === 'object' && 'to' in err && err['to'] === '/sign-in') {
        throw err
      }
      // For any other error, also redirect to sign-in
      throw redirect({
        to: '/sign-in',
      })
    }
  },
  component: AuthenticatedLayout,
})
