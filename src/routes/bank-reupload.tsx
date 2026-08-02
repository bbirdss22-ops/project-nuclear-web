import { z } from 'zod'
import { createFileRoute } from '@tanstack/react-router'
import { BankReupload } from '@/features/bank-reupload'

const searchSchema = z.object({
  token: z.string().optional(),
})

export const Route = createFileRoute('/bank-reupload')({
  component: BankReupload,
  validateSearch: searchSchema,
})
