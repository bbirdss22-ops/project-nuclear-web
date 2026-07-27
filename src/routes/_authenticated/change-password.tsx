import { createFileRoute } from '@tanstack/react-router'
import { ChangePasswordForm } from '@/features/auth/change-password/change-password-form'

export const Route = createFileRoute('/_authenticated/change-password')({
  component: ChangePasswordForm,
})
