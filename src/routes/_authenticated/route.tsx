import { createFileRoute, redirect } from '@tanstack/react-router'
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout'
import { getCookie } from '@/lib/cookies'

const ACCESS_TOKEN = 'pn_access_token'

export const Route = createFileRoute('/_authenticated')({
  beforeLoad: ({ location }) => {
    const token = getCookie(ACCESS_TOKEN)
    if (!token) {
      throw redirect({
        to: '/sign-in',
        search: { redirect: location.pathname + location.search + location.hash },
      })
    }
  },
  component: AuthenticatedLayout,
})
